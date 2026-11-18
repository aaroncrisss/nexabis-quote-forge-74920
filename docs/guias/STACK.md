# El mapa completo para manejar tu Instagram por $0 al mes (sin pagar 4 herramientas)

Si creas contenido o vendes por Instagram, la cuenta mensual de suscripciones sube rápido: pagas ManyChat para los DMs, otra app para programar Reels, otra para enlaces cortos tipo Linktree y otra para analítica. Al final terminas pagando más en herramientas de lo que inviertes en producir contenido.

Aquí tienes el mapa exacto para reemplazar esas 4 suscripciones por un **stack propio de $0 al mes**, apoyado en Supabase, tu propio dominio y Claude Code.

---

## Qué logras con esta guía

- Reemplazar **ManyChat**, **programadores de posts**, **acortadores de links** y **paneles de analítica** en un solo lugar.
- Tener soberanía total sobre tus contactos, comentarios, clics y métricas sin límites artificiales de suscriptores.
- Publicar Reels, carruseles e historias automáticas desde tu propia base de datos.
- Generar guiones y videos en tu computador sin pagar APIs de inteligencia artificial por cada pieza.

---

## Qué necesitas

1. **Cuenta gratuita en Supabase** (base de datos PostgreSQL, almacenamiento de archivos, Edge Functions y tareas `pg_cron`).
2. **Cuenta gratuita en Meta for Developers** conectada a tu Instagram Profesional y Página de Facebook.
3. **Un dominio propio** (si ya tienes web) para alojar tus enlaces cortos rastreables tipo `/r/tu-guia`.
4. **Claude Code** + **Antigravity CLI (`agy`)** y **Remotion** en tu computador si quieres sumar producción automática de videos.

---

## El mapa: qué reemplaza a cada herramienta

Antes de pedirle código a Claude, mira cómo queda cada pieza de tu negocio en el nuevo sistema:

1. **ManyChat → Supabase Edge Function + PostgreSQL:**
   - Una función `instagram-webhook` escucha comentarios y DMs.
   - Cuatro tablas clave (`ig_account`, `ig_campaigns`, `ig_contacts`, `ig_comment_events`) gestionan campañas, leads y evitan duplicados.
   - Sumas `ig_messages` e `ig_respuestas` para tener bandeja de entrada y respuestas rápidas sin costo por contacto.

2. **Programador de contenido (Later / Buffer) → `pg_cron` + Storage:**
   - Guardas tus videos e imágenes en un bucket público `ig-media` (hasta 50 MB por archivo en la capa gratuita de Supabase).
   - Una tabla `ig_posts` agenda Reels, carruseles e historias, y una tarea automática cada 2 minutos publica lo que ya cumplió su hora.

3. **Linktree / Bitly → Ruta `/r/` en tu propio dominio:**
   - En lugar de mandar tráfico a un tercero, creas una tabla `ig_recursos` y una ruta pública `/r/<slug>` en tu sitio.
   - Cada clic pasa por una función que suma la visita y redirige al archivo o página final. Así sabes qué Reel generó cada clic.

4. **Herramientas de analítica y competencia → `ig_media_stats` + Radar:**
   - Guardas el rendimiento real de cada post (alcance, guardados, compartidos, DMs y clics) y calculas tus mejores horarios con datos de tu propia audiencia.
   - Con `ig_competidores` e `ig_radar_posts` monitoreas cuentas de tu nicho usando la API oficial sin pagar plataformas externas.

5. **Guiones y edición con IA → `agy -p` + Remotion en local:**
   - En vez de pagar APIs por token para redactar guiones, usas la CLI local junto con Remotion para renderizar tus Reels directamente en tu PC.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Diseña la base única en Supabase
Pídele a Claude que organice las tablas principales en un solo esquema ordenado para que tu bot, tu calendario y tus métricas conversen entre sí.

> **Prompt para Claude Code:**  
> "Quiero armar un sistema todo-en-uno para Instagram en la capa gratuita de Supabase para no pagar herramientas externas. Diseña la migración SQL inicial con las tablas para campañas Comment-to-DM (`ig_campaigns`, `ig_contacts`, `ig_comment_events`), posts programados (`ig_posts`), enlaces cortos (`ig_recursos`, `ig_links`) y estadísticas (`ig_media_stats`). Explícame qué hace cada tabla en lenguaje simple."

### Paso 2: Reemplaza el acortador de links en tu web
Tener tus propios enlaces `/r/nombre` mejora la confianza del usuario (ve tu marca en el DM) y te da métricas reales de clics por campaña.

> **Prompt para Claude Code:**  
> "Crea en mi proyecto web una ruta pública `/r/:code` y una función SQL `resolve_link` en Supabase que busque el recurso en `ig_recursos` o `ig_links`, sume 1 al contador de clics y redirija al usuario al destino final."

### Paso 3: Activa la publicación programada sin apps de pago
Conecta el almacenamiento gratuito de Supabase con la API de publicación de Meta para que tus Reels y carruseles salgan solos.

> **Prompt para Claude Code:**  
> "Agrega a mi Edge Function `instagram-webhook` una función `publishDuePosts` que revise la tabla `ig_posts` cada 2 minutos buscando publicaciones cuya fecha ya llegó, cree el contenedor en la Graph API de Meta, espere que termine de procesarse y lo publique automáticamente."

### Paso 4: Centraliza tus métricas de embudo
El verdadero poder de tener todo en una sola base de datos es cruzar el comentario con el clic y la venta, algo que ninguna app suelta te da por defecto.

> **Prompt para Claude Code:**  
> "Crea una función SQL `ig_funnel_stats` que me devuelva por cada campaña: total de comentarios recibidos, DMs enviados, ofertas entregadas y clics en mis enlaces `/r/`, para ver todo mi embudo en un solo panel."

---

## Errores comunes al armar tu stack $0 y cómo evitarlos

1. **Subir videos demasiado pesados al storage gratuito:** La capa gratis de Supabase permite archivos de hasta 50 MB por objeto. *Cómo evitarlo:* comprime tus Reels antes de subirlos (un Reel de 30 segundos en buena calidad pesa entre 8 y 20 MB).
2. **Olvidar el permiso de publicación en Meta:** Sin `instagram_content_publish` en tu token, podrás responder DMs pero no programar posts. *Cómo evitarlo:* verifica los permisos de tu token antes de construir el calendario.
3. **Mezclar claves secretas en el frontend:** Nunca pongas tokens de Meta ni claves administrativas en tu web pública. *Cómo evitarlo:* guarda todo en los secretos de Supabase y deja que solo las Edge Functions hablen con Meta.
4. **Querer construir todo el primer día:** El stack completo tiene muchas piezas. *Cómo evitarlo:* parte por Comment-to-DM + links `/r/`, y luego suma el programador y la analítica.

---

Si te sirvió este mapa y quieres ver cómo funciona este sistema en producción cada semana, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
