# Cómo armar tu propio bot Comment-to-DM en Instagram sin pagar ManyChat (con Claude Code)

Si haces contenido en Instagram, seguro ya conoces el truco: pides que comenten una palabra clave y les llega un mensaje directo (DM) con tu guía, enlace o propuesta. El problema es que pagar herramientas externas todos los meses se vuelve caro rápido cuando tu cuenta empieza a crecer.

Aquí tienes el paso a paso para construir tu propio sistema **Comment-to-DM 100% nativo**, usando Claude Code para que haga el trabajo técnico por ti.

---

## Qué logras con esta guía

- Responder automáticamente por DM a cada persona que comente tu palabra clave en un Reel o publicación.
- Dejar una respuesta pública automática en el comentario (por ejemplo: *"¡Te envié el enlace por DM!"*) para impulsar el alcance del algoritmo.
- Guardar cada contacto en tu propia base de datos sin pagar suscripciones por número de suscriptores.
- Evitar mensajes duplicados aunque dos procesos corran al mismo tiempo.

---

## Qué necesitas (todo gratis o casi)

1. **Instagram Profesional** (Creador o Empresa) vinculado a una **Página de Facebook**.
2. **Cuenta gratuita en Meta for Developers** para conectar la API oficial de Instagram.
3. **Cuenta gratuita en Supabase** (base de datos y funciones en la nube sin mantener servidores).
4. **Claude Code** (o tu asistente de IA con acceso a archivos y terminal) para generar e instalar todo.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Prepara tu carpeta y el plan del proyecto
Abre Claude Code en una carpeta nueva y pídele que organice la estructura antes de tocar nada.

> **Prompt para Claude Code:**  
> "Quiero crear un bot nativo de Instagram Comment-to-DM usando Supabase (PostgreSQL + Edge Functions) y la Graph API de Meta, sin usar ManyChat. Créame la estructura inicial del proyecto y explícame en lenguaje simple qué archivos vas a crear y qué variables secretas voy a necesitar configurar después."

### Paso 2: Crea las tablas de campañas, contactos y eventos
Necesitas guardar tus palabras clave, tus leads y un registro único por comentario para nunca mandar dos veces el mismo DM.

> **Prompt para Claude Code:**  
> "Crea una migración SQL para Supabase con 3 tablas: `ig_campaigns` (nombre, activa, keywords, modo directo, mensaje_oferta, link_url, respuestas_publicas), `ig_contacts` (usuario, primer_contacto, ultimo_contacto, total_comentarios) e `ig_comment_events` con `comment_id` único para garantizar que un comentario jamás se procese dos veces."

### Paso 3: Conecta tu app en Meta for Developers
Entra a Meta for Developers, crea una app de tipo Negocios, agrega el producto de Instagram y genera tu token de acceso con permisos para leer comentarios y enviar mensajes. Guarda ese token solo en los secretos de Supabase, nunca dentro del código.

> **Prompt para Claude Code:**  
> "Explícame paso a paso cómo guardar mi token de Meta y mi token de verificación de webhook como secretos seguros en Supabase CLI, sin escribir ninguna clave ni ID dentro del código fuente."

### Paso 4: Construye la función que responde comentarios
La Edge Function recibe los comentarios nuevos, revisa si coinciden con tu palabra clave y manda el DM + la respuesta pública.

> **Prompt para Claude Code:**  
> "Crea una Edge Function en Supabase llamada `instagram-webhook` que valide el webhook de Meta (GET y POST), compare el texto del comentario contra las campañas activas en `ig_campaigns`, registre el `comment_id` en `ig_comment_events`, envíe un Private Reply por DM con el mensaje y enlace en texto plano, y publique una respuesta aleatoria en el comentario."

### Paso 5: Activa un respaldo automático cada 2 minutos
A veces Meta retrasa los avisos en tiempo real. Un chequeo automático cada 2 minutos asegura que nadie se quede sin su regalo.

> **Prompt para Claude Code:**  
> "Agrega a la Edge Function una acción `poll_comments` que revise los últimos comentarios de mis publicaciones recientes, filtre los que ya existen en `ig_comment_events` y responda los pendientes. Luego créame una tarea con `pg_cron` en Supabase para ejecutarla cada 2 minutos."

### Paso 6: Crea un modo de simulación para probar sin riesgo
Antes de lanzar un Reel real, prueba el flujo completo de forma local.

> **Prompt para Claude Code:**  
> "Agrega una acción `simulate` en `instagram-webhook` que reciba un usuario y un texto de comentario ficticio, muestre qué campaña haría match y devuelva el texto exacto del DM y la respuesta pública sin llamar todavía a la API de Meta."

### Paso 7: Configura tu primera campaña y lánzala
Carga tu primera campaña con una palabra clave corta y clara (por ejemplo: `guia`, `bot` o `sistema`) y pruébala comentando desde una cuenta secundaria.

> **Prompt para Claude Code:**  
> "Dame el SQL o un script sencillo para insertar mi primera campaña activa en `ig_campaigns` con la palabra clave 'guia', un mensaje cercano con mi enlace y 3 variaciones de respuesta pública para no repetir siempre el mismo texto."

---

## Errores comunes de Meta y cómo evitarlos

1. **Ventana de 7 días:** Meta solo permite enviar una respuesta privada si el comentario tiene menos de 7 días. Si intentas responder comentarios más antiguos, la API devuelve error. *Cómo evitarlo:* descarta automáticamente comentarios con más de 7 días antes de intentar enviar el DM.
2. **No usar botones en Private Replies:** Al responder directamente a un comentario, Meta rechaza plantillas con botones de enlace (`web_url`). *Cómo evitarlo:* envía texto normal con tu URL escrita directamente (por ejemplo `https://tusitio.com`); Instagram la vuelve cliqueable sola.
3. **App en modo desarrollo:** Mientras tu app en Meta no pasa por revisión (*App Review*), Meta silencia los webhooks en tiempo real para usuarios externos o restringe respuestas según tu configuración. *Cómo evitarlo:* implementa el respaldo con `pg_cron` (Paso 5) y prepara un video corto de prueba cuando quieras solicitar *Advanced Access*.
4. **Límites de llamadas:** Si consultas la API demasiado seguido o respondes cientos de comentarios de golpe sin pausa, Meta aplica bloqueos temporales. *Cómo evitarlo:* guarda lo ya procesado en tu base de datos, consulta solo los posts recientes y agrega reintentos con espera de varios minutos si aparece un límite.

---

Si te sirvió esta guía y quieres ver cómo conecto este bot con videos automáticos y analítica real, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
