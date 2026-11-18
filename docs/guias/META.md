# 4 errores reales de Meta Graph API que bloquean tus DMs (y cómo evitarlos con Claude Code)

Cuando armas tu propio bot de Instagram con la API oficial de Meta, casi nunca fallas por falta de ganas: fallas por reglas silenciosas de Meta que no están bien explicadas y te devuelven errores crípticos mientras tus seguidores se quedan esperando su enlace.

Aquí tienes el checklist con **4 errores verificados en producción contra Meta Graph API v21.0** y los prompts exactos para que Claude Code blinde tu bot antes de que Meta te rechace un solo DM.

---

## Qué logras con esta guía

- Evitar el error de autorización al instante por mezclar el dominio equivocado con tu token de Página.
- Eliminar el error `#100` en respuestas privadas a comentarios (*Private Replies*).
- Manejar correctamente la ventana de 7 días en comentarios y de 24 horas en mensajes directos.
- Blindar tu bot contra límites de velocidad (`#4`, `#17`, `#32`, `#613`) y webhooks silenciados en modo desarrollo.

---

## Qué necesitas

1. **Tu proyecto con Edge Functions en Supabase** conectado a Meta Graph API v21.0.
2. **Tu token de acceso de Página** guardado de forma segura en la base de datos o secretos (nunca expuesto en el frontend).
3. **Claude Code** para revisar tu código actual y aplicar estas cuatro protecciones.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Usa `graph.facebook.com/v21.0` para tokens de Página (`EAA...`)
Cuando conectas una cuenta de Instagram Profesional vinculada a una Página de Facebook, Meta entrega un *Page Access Token* (los que comienzan con `EAA`). Si envías ese token a `graph.instagram.com`, Meta rechaza la petición al instante.

> **Prompt para Claude Code:**  
> "Revisa todas las llamadas a la API de Meta en mi proyecto. Asegúrate de que si el token empieza con `EAA`, todas las peticiones apunten siempre a `https://graph.facebook.com/v21.0/` y nunca a `graph.instagram.com`. Centraliza esto en un helper único llamado `graph()` para no repetir URLs."

### Paso 2: Envía texto plano en Private Replies (evita el error `#100`)
Al responder directamente a un comentario (`recipient: { comment_id }`), muchos intentan mandar una tarjeta bonita con botón URL (`template: generic` con `web_url`). Meta lo prohíbe y responde con el error `#100: Param recipient[comment_id] must not be used with template messages`.

> **Prompt para Claude Code:**  
> "Revisa el envío de Private Replies en `instagram-webhook`. Elimina cualquier `template: generic` o botón `web_url` cuando el destinatario sea un `comment_id`, y envía el mensaje como texto plano incluyendo la URL completa (por ejemplo `https://tudominio.com/r/guia`), porque Instagram convierte el enlace en cliqueable automáticamente."

### Paso 3: Respeta la ventana de 7 días y las 24 horas en Bandeja
Meta impone dos relojes estrictos: solo puedes mandar un Private Reply si el comentario tiene **menos de 7 días** (si es más viejo, devuelve error `(-1)`), y en conversaciones normales de DM solo puedes escribir si el usuario interactuó en las **últimas 24 horas**.

> **Prompt para Claude Code:**  
> "En el sondeo de comentarios de `instagram-webhook`, descarta automáticamente cualquier comentario con más de 7 días de antigüedad antes de llamar a Meta y márcalo como omitido por antigüedad. En mi bandeja de DMs del frontend, calcula si la ventana de 24 horas sigue abierta y deshabilita el campo de envío cuando esté vencida para evitar errores en pantalla."

### Paso 4: Agrega reintentos automáticos y respaldo por `pg_cron`
Mientras tu app en Meta está en modo desarrollo (antes de pasar *App Review*), Meta silencia los webhooks en tiempo real para usuarios externos. Además, si publicas un Reel muy viral, puedes chocar con límites temporales de llamadas (`#4`, `#17`, `#32`, `#613`).

> **Prompt para Claude Code:**  
> "Asegúrate de que `poll_comments` corra cada 2 minutos mediante `pg_cron` como respaldo de los webhooks, y crea una función `retryLimitedComments()` que detecte errores por límite de llamadas de Meta (`#4`, `#17`, `#32`, `#613`) y los reintente automáticamente entre 5 minutos y 6 horas después."

---

## Errores comunes y cómo evitarlos

1. **Probar solo con tu propia cuenta:** En modo desarrollo, Meta deja pasar webhooks de administradores y testers, haciéndote creer que todo funciona, hasta que lo lanzas al público. *Cómo evitarlo:* usa el respaldo cada 2 minutos con `pg_cron` y prepara tu video de prueba para solicitar *Advanced Access*.
2. **Pedir varias métricas de insights en una sola llamada si alguna no aplica:** En estadísticas de posts, Meta rechaza toda la consulta si pides una métrica inválida para ese formato (Reel vs Carrusel). *Cómo evitarlo:* consulta las métricas compatibles según el tipo de publicación o pídelas de forma tolerante a fallos.
3. **Dejar comentarios fallidos sin estado ni motivo:** Si no guardas el código de error exacto que devolvió Meta, nunca sabrás por qué no salió un DM. *Cómo evitarlo:* registra siempre `estado` y `motivo` en `ig_comment_events`.

---

Si te sirvió esta guía y quieres ver cómo evito mensajes duplicados y conecto todo a un CRM real, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
