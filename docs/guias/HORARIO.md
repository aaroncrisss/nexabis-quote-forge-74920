# Cómo encontrar y programar tu mejor hora real para publicar en Instagram (con Claude Code)

Publicar *"cuando te acuerdas"* o seguir horarios genéricos sacados de un blog mata tu alcance antes de que el Reel tenga oportunidad de despegar. Cada cuenta tiene su propio ritmo según cuándo se conecta su audiencia y a qué hora realmente comenta.

Aquí tienes el paso a paso para armar con Claude Code un **calculador de mejores horarios basado en tus propios datos**, con mapa de calor incluido, programación en un clic y publicación automática de historias de apoyo.

---

## Qué logras con esta guía

- Calcular los **3 mejores horarios de tu semana** (en días distintos) mezclando tres señales reales de tu cuenta.
- Visualizar un mapa de calor (`ig_activity_heatmap`) que muestra qué días y horas comentan más tus seguidores.
- Programar un Reel o carrusel en tu panel con un solo clic sobre el horario recomendado.
- Subir automáticamente una historia con ese mismo Reel 20 minutos después de publicarlo (`auto_historia`).

---

## Qué necesitas

1. **Cuenta Profesional de Instagram** con permisos de estadísticas (`instagram_manage_insights`) y publicación (`instagram_content_publish`).
2. **Supabase** con tus tablas de métricas (`ig_media_stats`), eventos de comentarios (`ig_comment_events`) y publicaciones programadas (`ig_posts`).
3. **Claude Code** para crear la función SQL del mapa de calor, el algoritmo de puntaje y los botones del panel.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Sincroniza cuándo están conectados tus seguidores
Meta entrega el dato de seguidores en línea (`online_followers`), pero lo devuelve en **hora del Pacífico**. Si no conviertes esa hora a tu zona horaria local (por ejemplo, hora de Chile), todo tu cálculo quedará corrido varias horas.

> **Prompt para Claude Code:**  
> "En mi función de mantenimiento en Supabase (`syncMediaStats()`), consulta el endpoint de `online_followers` en la Graph API de Meta, convierte las horas desde la zona horaria del Pacífico a mi hora local (America/Santiago) y guarda la distribución por hora y día en `ig_settings`."

### Paso 2: Crea el mapa de calor de comentarios reales
Saber cuándo hay gente conectada no basta: también importa a qué hora interactúan de verdad. Con tus comentarios guardados en `ig_comment_events` puedes armar un mapa exacto.

> **Prompt para Claude Code:**  
> "Crea una función SQL RPC en Supabase llamada `ig_activity_heatmap(dias int)` que tome los comentarios de `ig_comment_events` de los últimos N días, los convierta a zona horaria America/Santiago y devuelva el conteo agrupado por día de la semana y hora del día."

### Paso 3: Implementa la fórmula de `computeBestTimes()`
Ahora cruza las tres señales en una función clara y transparente, sin cajas negras ni suscripciones caras. La fórmula combina **40 %** seguidores conectados, **35 %** actividad de comentarios a esa hora y **25 %** alcance histórico de tus posts publicados en ese bloque.

> **Prompt para Claude Code:**  
> "Crea una función `computeBestTimes()` en TypeScript que normalice entre 0 y 1 tres métricas por cada día y hora: 40 % seguidores conectados (`online_followers`), 35 % comentarios recibidos (`ig_activity_heatmap`) y 25 % alcance promedio según la hora de publicación en `ig_media_stats`. Devuelve los 3 mejores horarios en días distintos de la semana."

### Paso 4: Conecta los chips de horario y la historia automática
Haz que elegir la hora sea tan simple como tocar un botón y que el sistema empuje el Reel con una historia 20 minutos después.

> **Prompt para Claude Code:**  
> "En mi panel de Contenido y Analítica, muestra los 3 mejores horarios como chips cliqueables que pre-llenen automáticamente la fecha y hora al programar un post en `ig_posts`. Además, agrega una opción `auto_historia` en `ig_settings`: cuando se publique un Reel normal (que no sea Reel de prueba), programa automáticamente una historia con el mismo video para 20 minutos después."

---

## Errores comunes y cómo evitarlos

1. **Olvidar la conversión de zona horaria de Meta:** Meta entrega `online_followers` en hora del Pacífico (`America/Los_Angeles`). Si lo lees directo, publicarás de madrugada sin darte cuenta. *Cómo evitarlo:* convierte siempre todas las horas a tu zona local antes de guardar o graficar.
2. **Elegir los 3 mejores horarios en el mismo día:** Si el martes a las 19:00, 20:00 y 21:00 tienen el puntaje más alto, terminarás publicando todo el mismo día. *Cómo evitarlo:* en `computeBestTimes()`, filtra para elegir máximo un horario ganador por día.
3. **Subir videos de más de 50 MB en Supabase gratuito:** El bucket gratuito de Supabase limita el tamaño por archivo. *Cómo evitarlo:* comprime tus Reels en MP4 (H.264) por debajo de 50 MB antes de subirlos al programador.

---

Si te sirvió esta guía y quieres ver cómo combino estos horarios con el lote automático de videos de cada domingo, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
