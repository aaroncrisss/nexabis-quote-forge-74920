# Cómo armar un Radar de Competencia en Instagram para detectar qué videos están explotando

El mayor error al crear contenido es grabar a ciegas esperando que algo funcione. Mientras tanto, en tu mismo nicho ya existen cuentas probando ganchos todos los días. Si sabes cuáles publicaciones están rindiendo muy por encima de lo normal, puedes adaptar las fórmulas ganadoras a tu propio estilo sin copiarle a nadie.

Con **Claude Code** y la API oficial de Meta puedes armar tu propio **Radar de Competencia** gratis, sin scraping ilegal y sin pagar herramientas caras de analítica.

---

## Qué logras con esta guía

- Monitorear automáticamente entre 5 y 15 cuentas referentes de tu rubro (cuentas profesionales públicas).
- Calcular un **puntaje viral relativo**: saber qué post obtuvo 3× más interacción que la mediana habitual de esa misma cuenta (así comparas cuentas chicas y grandes de forma justa).
- Etiquetar automáticamente qué fórmula usó el video (*"comenta palabra"*, *"gratis"*, *"error común"*, *"guárdalo"*, etc.).
- Ver una lista diaria de **"Qué comentar o replicar hoy"** con los posts ganadores de las últimas 48 horas.

---

## Qué necesitas (todo gratis o casi)

1. **Instagram Profesional** (Creador o Empresa) vinculado a una **Página de Facebook**.
2. **Cuenta gratuita en Meta for Developers** con token de acceso habilitado para consultas oficiales.
3. **Cuenta gratuita en Supabase** para guardar la lista de competidores y el historial de publicaciones.
4. **Claude Code** para construir las tablas, el motor de cálculo y los filtros automáticos.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Crea las tablas del Radar en Supabase
Necesitas una tabla para las cuentas que quieres observar y otra para guardar las publicaciones destacadas que encuentre el radar.

> **Prompt para Claude Code:**  
> "Crea una migración SQL para Supabase con dos tablas: `ig_competidores` (username, rubro, activo, ultimo_chequeo) e `ig_radar_posts` (post_id único, username, caption, media_type, permalink, likes, comments, score_viral, formulas array, published_at). Asegúrate de que no se dupliquen posts repetidos."

### Paso 2: Carga tus primeras cuentas referentes
Elige cuentas de tu nicho que tengan perfil Profesional (Empresa o Creador), porque la API oficial solo permite consultar ese tipo de cuentas.

> **Prompt para Claude Code:**  
> "Dame un script o consulta SQL sencilla para agregar 5 cuentas referentes de mi nicho en `ig_competidores` y crear una vista rápida para activar o pausar cuentas cuando quiera."

### Paso 3: Conecta la consulta oficial `business_discovery` de Meta
Meta ofrece una ruta oficial llamada `business_discovery` que permite leer los últimos posts, likes, comentarios y textos de otras cuentas profesionales sin violar sus términos.

> **Prompt para Claude Code:**  
> "Crea una Edge Function (o script en Node) llamada `radar-sync` que tome cada cuenta activa de `ig_competidores`, consulte sus últimas publicaciones usando el endpoint `business_discovery` de la Graph API de Meta leyendo el token desde variables de entorno seguras, y devuelva likes, comentarios, texto y enlace."

### Paso 4: Calcula el puntaje viral contra la mediana de la cuenta
Un post con 500 likes es normal para una cuenta gigante, pero un éxito total para una cuenta chica. Comparar contra la mediana propia resuelve eso.

> **Prompt para Claude Code:**  
> "En `radar-sync`, calcula la mediana de `(likes + comentarios)` de los últimos posts de cada cuenta. Luego asigna a cada publicación un `score = (likes + comentarios) / mediana`. Guarda en `ig_radar_posts` los posts que destaquen y limpia automáticamente los registros con más de 21 días para no llenar la base de datos."

### Paso 5: Etiqueta las fórmulas de gancho automáticamente
Sin gastar en APIs de inteligencia artificial, puedes clasificar las tácticas que usa cada texto con reglas simples de palabras clave.

> **Prompt para Claude Code:**  
> "Agrega una función `detectFormulas(caption)` que analice el texto de cada post y le ponga etiquetas automáticas como `comenta_palabra`, `gratis`, `error_comun`, `guardalo`, `paso_a_paso` o `mandaselo` usando expresiones regulares simples."

### Paso 6: Crea la vista "Comenta hoy" y programa el radar cada 12 horas
Detectar un video que está explotando en sus primeras 48 horas te sirve tanto para inspirar tu próximo Reel como para dejar comentarios de valor en tu nicho.

> **Prompt para Claude Code:**  
> "Crea una consulta o vista en Supabase que muestre solo los posts de las últimas 48 horas con `score >= 3`, ordenados del más viral al menos viral. Luego explícame cómo programar `radar-sync` con `pg_cron` para que corra automáticamente cada 12 horas."

### Paso 7: Recibe un resumen con el Top 5 de ideas nuevas
En vez de entrar a revisar tablas todos los días, haz que el sistema te avise solo cuando aparezcan verdaderas joyas nuevas.

> **Prompt para Claude Code:**  
> "Agrega al final de `radar-sync` un filtro que detecte los 5 posts nuevos con mayor puntaje viral que aún no hayan sido notificados y genere un mensaje resumen listo para enviarme por correo o WhatsApp con el enlace, el puntaje y la fórmula detectada."

---

## Errores comunes de Meta y cómo evitarlos

1. **Ventana de 7 días:** Si además del radar usas automatizaciones para responder comentarios en tus propios posts inspirados por el radar, recuerda que Meta bloquea *Private Replies* después de 7 días. *Cómo evitarlo:* procesa respuestas automáticas solo en comentarios recientes.
2. **No usar botones en Private Replies:** Si aplicas la fórmula `comenta_palabra` que detectó tu radar, evita enviar botones URL en el primer DM de respuesta a un comentario. *Cómo evitarlo:* manda el enlace en texto plano dentro del mensaje.
3. **App en modo desarrollo:** Mientras tu app en Meta esté en modo desarrollo, algunas consultas, permisos avanzados o webhooks hacia usuarios externos estarán limitados. *Cómo evitarlo:* prueba primero con cuentas profesionales de prueba y planifica el *App Review* cuando quieras escalar.
4. **Límites de llamadas:** `business_discovery` es una de las rutas más vigiladas por cuota en Meta; si consultas 30 cuentas cada 5 minutos, Meta devolverá error de límite (#4). *Cómo evitarlo:* corre el radar cada 12 o 24 horas y programa una pausa automática de al menos 1 hora si Meta responde con límite de llamadas.

---

Si quieres ver este radar funcionando conectado a un motor que convierte las ideas ganadoras en videos automáticos, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
