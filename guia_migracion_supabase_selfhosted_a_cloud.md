# Guía: Migración Supabase Self-Hosted → Supabase Cloud

## Requisitos previos

- Acceso SSH al VPS con Supabase self-hosted
- PostgreSQL 17 instalado en Windows (`winget install -e --id PostgreSQL.PostgreSQL.17 --source winget`)
- Supabase CLI (`npx supabase --version`)
- Proyecto nuevo creado en [Supabase Cloud](https://supabase.com)

---

## Paso 1: Exportar la base de datos desde el VPS

Conectarse al VPS y ejecutar dentro del contenedor de la DB:

```bash
# Identificar el contenedor de postgres
docker ps | grep supabase-db

# Exportar en formato binario comprimido
docker exec -i <CONTAINER_ID> pg_dump \
  -U postgres \
  -F c \
  -f /tmp/backup.dump \
  postgres
```

Descargar el dump a la PC local:

```bash
scp root@<IP_VPS>:/tmp/backup.dump ./backup.dump
```

---

## Paso 2: Crear proyecto en Supabase Cloud

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. Anotar el **Project ID** (ej: `htwuamsbzaznmwuypflt`)
3. Guardar la **contraseña de la DB** que se asigna al crear el proyecto

---

## Paso 3: Obtener credenciales del nuevo proyecto

Desde el Dashboard de Supabase Cloud:

| Dato | Ubicación |
|------|-----------|
| **DB Password** | Settings → Database → Database password |
| **Access Token (CLI)** | Account → Access Tokens → Generate new token |
| **Anon Key** | Settings → API → `anon public` |
| **Project URL** | Settings → API → Project URL |

---

## Paso 4: Restaurar la base de datos

### 4a. Obtener la URL correcta del pooler

```bash
# Enlazar el CLI al nuevo proyecto
npx supabase link --project-ref <PROJECT_ID> --password '<DB_PASSWORD>'

# La URL del pooler queda guardada en:
cat supabase/.temp/pooler-url
# Ejemplo: postgresql://postgres.PROJECT_ID@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

> **Importante:** El prefijo puede ser `aws-0` o `aws-1` y la región varía según dónde creaste el proyecto. Usar siempre la URL de `.temp/pooler-url`.

### 4b. Restaurar con pg_restore

```bash
# Agregar pg_restore al PATH (ajustar versión)
$env:PATH += ";C:\Program Files\PostgreSQL\17\bin"

# Restaurar (ignorar errores de objetos del sistema de Supabase — son esperados)
PGPASSWORD='<DB_PASSWORD>' pg_restore \
  --no-owner --no-acl --clean --if-exists \
  --host=<POOLER_HOST> \
  --port=5432 \
  --username=postgres.<PROJECT_ID> \
  --dbname=postgres \
  ./backup.dump
```

Los errores `must be owner of event trigger` y similares son **normales** — son objetos del sistema de Supabase que no se pueden modificar. Lo importante es que las tablas del schema `public` se creen correctamente.

---

## Paso 5: Restaurar GRANTs (MUY IMPORTANTE)

El backup elimina los permisos por defecto de Supabase Cloud. **Sin este paso, todos los usuarios recibirán error 403.**

```bash
PGPASSWORD='<DB_PASSWORD>' psql \
  -h <POOLER_HOST> \
  -p 5432 \
  -U "postgres.<PROJECT_ID>" \
  -d postgres \
  -c "
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
"
```

---

## Paso 6: Corregir función `has_role` (si existe)

Si tu proyecto usa una función `has_role` con `SECURITY DEFINER` para validar roles en políticas RLS, **fallará en PostgreSQL 17** por recursión infinita.

**Síntoma:** Queries a tablas con políticas que usan `has_role()` se cuelgan o dan timeout.

**Fix:**

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security = off  -- Esta línea es la clave
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

Ejecutar via CLI:

```bash
SUPABASE_ACCESS_TOKEN=<TOKEN> npx supabase db query \
  --linked \
  "CREATE OR REPLACE FUNCTION ..."
```

> **Causa:** En PostgreSQL 15 (self-hosted), `SECURITY DEFINER` bypasseaba RLS automáticamente. En PostgreSQL 17 (Cloud) ya no lo hace, causando un loop infinito cuando la función consulta una tabla que tiene políticas RLS que llaman a la misma función.

---

## Paso 7: Desplegar Edge Functions

```bash
SUPABASE_ACCESS_TOKEN=<TOKEN> npx supabase functions deploy \
  --project-ref <PROJECT_ID>
```

Esto despliega todas las funciones del directorio `supabase/functions/` de una vez.

---

## Paso 8: Configurar Secrets de las funciones

```bash
SUPABASE_ACCESS_TOKEN=<TOKEN> npx supabase secrets set \
  --project-ref <PROJECT_ID> \
  VARIABLE_1="valor1" \
  VARIABLE_2="valor2" \
  ...
```

Variables típicas: `MP_ACCESS_TOKEN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SITE_URL`, etc.

---

## Paso 9: Actualizar el proyecto local

### `supabase/config.toml`
```toml
project_id = "<NUEVO_PROJECT_ID>"
```

### `.env`
```env
VITE_SUPABASE_URL=https://<PROJECT_ID>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY>
VITE_SUPABASE_PROJECT_ID=<PROJECT_ID>
```

---

## Paso 10: Verificar la migración

```bash
# Verificar tablas restauradas
SUPABASE_ACCESS_TOKEN=<TOKEN> npx supabase db query \
  --linked \
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

# Verificar permisos
PGPASSWORD='<DB_PASSWORD>' psql -h <POOLER_HOST> -p 5432 \
  -U "postgres.<PROJECT_ID>" -d postgres \
  -c "SELECT has_table_privilege('authenticated', 'public.profiles', 'SELECT');"
# Debe devolver: t
```

---

## Errores comunes y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `Tenant or user not found` | Región o prefijo del pooler incorrecto | Usar la URL de `supabase/.temp/pooler-url` |
| `Network is unreachable` al host directo | Host directo solo tiene IPv6, ISP no soporta | Usar el pooler (puerto 5432) |
| `403` en todas las queries | GRANTs revocados por el backup | Ejecutar el bloque de GRANTs del Paso 5 |
| Queries que se cuelgan / timeout | Recursión infinita en `has_role` | Aplicar el fix del Paso 6 |
| `must be owner of event trigger` | Objetos del sistema de Supabase | Ignorar, son errores esperados |

---

## Nota sobre usuarios de Auth

El backup **no migra** los usuarios de `auth.users`. Los usuarios que existían en el self-hosted deberán:
- Registrarse nuevamente en el proyecto Cloud, **o**
- Ser exportados/importados manualmente desde el dashboard de Supabase

---

## Resumen de comandos en orden

```bash
# 1. Instalar herramientas
winget install -e --id PostgreSQL.PostgreSQL.17 --source winget

# 2. Enlazar CLI al proyecto Cloud
npx supabase link --project-ref <PROJECT_ID> --password '<DB_PASSWORD>'

# 3. Restaurar DB
PGPASSWORD='<PW>' pg_restore --no-owner --no-acl --clean --if-exists \
  -h <POOLER_HOST> -p 5432 -U postgres.<PROJECT_ID> -d postgres ./backup.dump

# 4. Restaurar GRANTs (siempre necesario)
PGPASSWORD='<PW>' psql -h <POOLER_HOST> -p 5432 -U postgres.<PROJECT_ID> -d postgres \
  -c "GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role; GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role; GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;"

# 5. Desplegar funciones
SUPABASE_ACCESS_TOKEN=<TOKEN> npx supabase functions deploy --project-ref <PROJECT_ID>

# 6. Configurar secrets
SUPABASE_ACCESS_TOKEN=<TOKEN> npx supabase secrets set --project-ref <PROJECT_ID> KEY="value"
```
