# 🛡️ Guía Rápida: Comandos Útiles para Supabase Self-Hosted (Coolify)

Esta guía documenta los **comandos exactos que sabemos que funcionan correctamente** interactuando desde tu máquina local Windows hacia el VPS (VPS IP: `31.97.163.113`).

---

## 🚀 1. Bases de Datos y SQL (PostgreSQL)

Debido a que el CLI de Supabase falla en Windows redireccionando archivos sobre SSH puro, y a temas de pertenencia de roles (`must be owner of function`), **esta es la manera oficial y segura** de correr migraciones y scripts SQL en producción:

### A) Subir el archivo SQL al servidor VPS
Primero debemos transferir el script (ej. `script.sql`) a la carpeta temporal del servidor Linux usando SCP:
```powershell
scp ./supabase/migrations/script.sql root@31.97.163.113:/tmp/script.sql
```

### B) Ejecutar el archivo SQL
Una vez en el servidor, usamos `docker exec` inyectándolo a nuestro contenedor (`supabase-db-sggkw8kowco048ksgocgsc8g`). 
> **Aviso Importante:** Al crear funciones RPC o manipular Data, utiliza SIEMPRE el usuario `-U supabase_admin` en lugar de `postgres` para no tener errores de permisos.

```powershell
ssh root@31.97.163.113 "docker exec -i supabase-db-sggkw8kowco048ksgocgsc8g psql -U supabase_admin -d postgres < /tmp/script.sql"
```

### C) Abrir la Consola Interactiva de Postgres
Si quieres entrar a la base de datos a hacer consultas `SELECT` directas a mano en tiempo real:
```powershell
ssh -t root@31.97.163.113 "docker exec -it supabase-db-sggkw8kowco048ksgocgsc8g psql -U supabase_admin -d postgres"
```

---

## ⚡ 2. Edge Functions

Debido a cómo Coolify monta la imagen de Docker de las Edge Functions, es necesario un proceso de 2 pasos para cada actualización.

### A) Desplegar (Subir el código fuente)
Ejecutar el script PowerShell personalizado guardado en la raíz de tu proyecto, que enviará los archivos de tu función (ej: `mp-create-payment`) incluyendo las dependencias globales (`_shared`):
```powershell
./deploy.ps1 -FunctionName "mp-create-payment" -ContainerId "sggkw8kowco048ksgocgsc8g"
```

### B) Recrear el Contenedor (Re-Build)
Coolify y Docker no verán los cambios en la carpeta temporal hasta que reiniciemos/recreemos el contenedor de las Edge Functions explícitamente obligando la recompilación y absorción de las Variables de Entorno `.env`:
```powershell
ssh root@31.97.163.113 "cd /data/coolify/services/sggkw8kowco048ksgocgsc8g && docker compose up -d supabase-edge-functions && echo 'RECREADO OK'"
```

---

## 🌐 3. Logs de Contenedores

Si alguna vez necesitas revisar qué está pasando internamente con el contenedor de Edge Functions (por ejemplo, ver los logs de los pagos fallidos):
```powershell
ssh root@31.97.163.113 "docker logs -f supabase-edge-functions-sggkw8kowco048ksgocgsc8g"
```
