# Cómo recibir una alerta en WhatsApp cuando un Reel empieza a despegar (con Claude Code)

Cuando publicas un Reel, las primeras horas definen si se queda estancado o si el algoritmo lo empuja a miles de personas nuevas. El problema es pasar el día pegado al celular actualizando las estadísticas cada cinco minutos para ver si pasó algo.

Aquí tienes el paso a paso para armar con Claude Code un **sistema automático de alerta de despegue**, que vigila tus Reels recién publicados, los compara contra tu propio promedio y te avisa por WhatsApp en el momento justo para que salgas a empujarlos.

---

## Qué logras con esta guía

- Detectar automáticamente si un Reel nuevo supera en **1,5 veces** tu mediana de vistas de los últimos 20 Reels.
- Recibir una alerta por WhatsApp entre 1 y 4 horas después de publicar, con 5 acciones concretas para aprovechar el impulso.
- Evitar alertas repetidas guardando en tu base de datos si el Reel ya fue notificado.
- Combinar el aviso con la vista **"Comenta hoy"** de tu Radar para interactuar en cuentas de tu nicho justo cuando tu perfil está caliente.

---

## Qué necesitas

1. **Cuenta Profesional de Instagram** con el permiso `instagram_manage_insights` activo en tu token de Meta.
2. **Base de datos en Supabase** con tu tabla de publicaciones programadas (`ig_posts`) y métricas (`ig_media_stats`), más una tarea `pg_cron` de mantenimiento.
3. **Acceso a una API de WhatsApp** (por ejemplo, Evolution API) con su clave guardada en los secretos de Supabase, nunca dentro del código.
4. **Claude Code** para programar la lógica de comparación y el envío del mensaje.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Guarda las métricas recientes y la marca de despegue
Para saber si un Reel está rompiendo tu promedio, primero necesitas un historial de tus últimos 20 Reels y una columna en `ig_posts` que marque si ya se envió la alerta.

> **Prompt para Claude Code:**  
> "Crea una migración SQL para Supabase que agregue la columna booleana `despegue` (por defecto `false`) en `ig_posts`, y asegúrate de que `ig_media_stats` guarde las reproducciones y el alcance de mis últimos Reels publicados junto con su fecha de publicación."

### Paso 2: Crea la función `checkDespegue()` con la regla de 1,5×
No uses el promedio simple, porque un solo video muy viral lo distorsiona todo. La **mediana** de tus últimos 20 Reels es mucho más justa y refleja tu rendimiento real.

> **Prompt para Claude Code:**  
> "En mi Edge Function de mantenimiento en Supabase, crea una función llamada `checkDespegue()`. Debe buscar los Reels publicados entre hace 1 y 4 horas que tengan `despegue = false`, consultar sus vistas actuales en la Graph API de Meta, calcular la mediana de vistas de mis últimos 20 Reels en `ig_media_stats` y verificar si el Reel nuevo alcanza o supera 1,5 veces esa mediana. Si lo logra, marca `despegue = true` en `ig_posts`."

### Paso 3: Conecta la alerta por WhatsApp con 5 acciones claras
De nada sirve un aviso que solo diga *"tu video va bien"*. Pídele a Claude que el mensaje incluya un checklist corto para actuar en dos minutos desde el celular.

> **Prompt para Claude Code:**  
> "Conecta `checkDespegue()` con mi función de envío por WhatsApp usando Evolution API (leyendo la API key desde los secretos de Supabase, jamás escrita en el código). Cuando un Reel despegue, mándame un mensaje con el título o enlace del Reel, cuántas vistas lleva frente a mi mediana y estas 5 acciones: responder todos los comentarios con preguntas abiertas, fijar el mejor comentario, compartir el Reel en historias con un sticker de encuesta, revisar que el Comment-to-DM esté activo y comentar en cuentas del nicho."

### Paso 4: Agrega la vista "Comenta hoy" en tu Radar
Cuando un Reel despega, comentar con criterio en otras cuentas de tu mismo tema atrae visitas directas a tu perfil justo en el mejor momento.

> **Prompt para Claude Code:**  
> "En la pestaña Radar de mi panel, agrega una vista rápida llamada 'Comenta hoy' que filtre las publicaciones de competidores o referentes de mi nicho publicadas en las últimas 48 horas, ordenadas por puntaje de interacción, para tener enlaces directos donde comentar apenas me llegue una alerta de despegue."

---

## Errores comunes y cómo evitarlos

1. **Comparar contra tus primeros 3 Reels o usar promedio simple:** Con pocos datos o un video atípico, la referencia queda altísima y nunca te avisa, o te avisa por cualquier cosa. *Cómo evitarlo:* usa la **mediana** de al menos los últimos 20 Reels y exige un mínimo razonable de vistas antes de disparar la alerta.
2. **Consultar métricas apenas se publica el video:** En los primeros 30 minutos los datos de Meta vienen incompletos o en cero. *Cómo evitarlo:* deja la ventana de chequeo entre 1 y 4 horas después de publicado.
3. **Escribir la API key de WhatsApp en el frontend o en el código:** Si subes el proyecto a un repositorio, expones tu línea. *Cómo evitarlo:* guarda la clave solo en los secretos de Supabase Edge Functions.

---

Si te sirvió esta guía y quieres ver cómo conecto estas alertas con la generación semanal de guiones y videos, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
