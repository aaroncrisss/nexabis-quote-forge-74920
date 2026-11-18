# Reto de 48 horas: arma tu propio bot Comment-to-DM en Instagram con Claude Code

¿Llevas meses pensando en automatizar tus DMs de Instagram pero te frena pagar una suscripción mensual o sentir que "programar una API" es demasiado técnico? Este fin de semana vamos a resolver eso en **48 horas**.

No necesitas saber programar de memoria ni armar una app gigante. Solo necesitas **4 tablas en Supabase**, **1 Edge Function**, una cuenta gratuita en **Meta for Developers** y **Claude Code** haciendo el trabajo pesado por ti.

---

## Qué logras con este reto

- Terminar el domingo con tu **propio bot Comment-to-DM funcionando** y respondiendo comentarios de prueba.
- Dejar de depender de herramientas externas con límite de suscriptores.
- Tener un **simulador local** para probar tus palabras clave y mensajes antes de lanzar un Reel real.
- Quedar con la base lista para sumar CRM, enlaces cortos o programación de contenido después.

---

## Qué necesitas antes de empezar

1. **Cuenta de Instagram Profesional** (Creador o Empresa) vinculada a una **Página de Facebook**.
2. **Cuenta gratuita en Meta for Developers** (para crear tu app y obtener tu token).
3. **Cuenta gratuita en Supabase** (base de datos + Edge Functions en la nube).
4. **Claude Code** abierto en una carpeta nueva de tu computador.

---

## Plan de acción en 48 horas

### Día 1 (Primeras 24 horas): Base de datos y conexión con Meta

#### Paso 1: Prepara tu proyecto y las 4 tablas mínimas
No te compliques con funciones avanzadas todavía. Todo el corazón del bot vive en 4 tablas de PostgreSQL: cuenta conectada, campañas, contactos y eventos de comentarios.

> **Prompt para Claude Code:**  
> "Quiero aceptar el reto de armar mi bot Comment-to-DM en 48 horas usando Supabase y la Graph API de Meta. Crea la estructura inicial del proyecto y una migración SQL con las 4 tablas mínimas: `ig_account` (protegida con RLS para que nadie lea el token desde fuera), `ig_campaigns` (nombre, activa, keywords, match_mode, mensaje_oferta, link_url, respuestas_publicas), `ig_contacts` (libreta de leads) e `ig_comment_events` con `comment_id` único para evitar duplicados."

#### Paso 2: Checklist rápido en Meta for Developers
Entra a Meta for Developers, crea una app de tipo **Negocios**, agrega el producto de **Instagram** y genera tu token de acceso con permisos para leer comentarios y enviar mensajes. Guarda ese token solo en los secretos de Supabase, jamás dentro del código.

- [ ] Instagram en modo Profesional vinculado a Página de Facebook.
- [ ] App creada en Meta for Developers con el producto Instagram activo.
- [ ] Token de acceso generado y guardado como secreto seguro en Supabase.
- [ ] Token de verificación propio inventado y guardado como `IG_VERIFY_TOKEN`.

> **Prompt para Claude Code:**  
> "Guíame paso a paso para guardar mi token de Meta y mi `IG_VERIFY_TOKEN` en los secretos de Supabase CLI, verificando que no quede ninguna clave escrita en los archivos del proyecto."

---

### Día 2 (Siguientes 24 horas): El motor del bot, simulador y primera prueba

#### Paso 3: Construye la Edge Function `instagram-webhook`
Ahora le damos vida al bot. La función debe recibir avisos de Meta, revisar los comentarios recientes cada 2 minutos por si Meta demora, hacer match con tu palabra clave y mandar el DM en texto plano con tu enlace.

> **Prompt para Claude Code:**  
> "Crea una Edge Function en Supabase llamada `instagram-webhook` que valide el webhook de Meta (GET y POST), tenga una acción `poll_comments` para revisar comentarios recientes cada 2 minutos con `pg_cron`, descarte comentarios de más de 7 días, registre el `comment_id` en `ig_comment_events`, envíe el DM en texto plano usando `graph.facebook.com/v21.0` cuando el token empiece por `EAA` y responda públicamente en el comentario."

#### Paso 4: Agrega el simulador para probar sin miedo
Antes de conectar tu cuenta real o lanzar un Reel, prueba tu lógica en seco.

> **Prompt para Claude Code:**  
> "Agrega una acción `simulate` en `instagram-webhook` que reciba un usuario ficticio y un texto de comentario, me diga qué campaña haría match y me muestre exactamente qué DM y qué respuesta pública enviaría, sin llamar todavía a la API de Meta."

#### Paso 5: Crea tu primera campaña y haz la prueba en vivo
Inserta una campaña de prueba con una palabra clave clara (por ejemplo `guia` o `reto`) y comenta desde una cuenta secundaria o de confianza.

> **Prompt para Claude Code:**  
> "Dame el SQL necesario para insertar mi primera campaña activa en `ig_campaigns` con la palabra clave 'reto', un mensaje cercano con mi enlace y 3 variaciones de respuesta pública para que el bot no repita siempre lo mismo."

---

## Errores comunes que te pueden frenar (y cómo saltarlos)

1. **Mandar botones URL en respuesta a un comentario:** Meta rechaza plantillas con botones en Private Replies (error `#100`). *Cómo evitarlo:* envía texto normal con tu link escrito completo; Instagram lo vuelve cliqueable solo.
2. **Apuntar tokens `EAA...` al dominio equivocado:** Los Page Access Tokens funcionan en `graph.facebook.com/v21.0`, no en `graph.instagram.com`. *Cómo evitarlo:* pídele a Claude que valide el prefijo del token antes de armar la URL.
3. **Esperar solo al webhook en modo desarrollo:** Mientras tu app no pasa revisión (*App Review*), Meta puede silenciar webhooks de usuarios externos. *Cómo evitarlo:* activa el respaldo cada 2 minutos con `pg_cron`.
4. **Intentar responder comentarios viejos:** Meta bloquea respuestas privadas a comentarios con más de 7 días. *Cómo evitarlo:* filtra por fecha antes de enviar.

---

¿Aceptaste el reto? Cuando tengas tu bot respondiendo tu primer comentario este fin de semana, súbelo a historias y etiquétame en **@cris.nexabis** para revisarlo y compartirlo. ¡A construir!
