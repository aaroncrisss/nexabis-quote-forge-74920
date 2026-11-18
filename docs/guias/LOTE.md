# De 4 horas editando el domingo a solo 1 clic: así funciona mi lote automático semanal

Si haces Reels para crecer tu marca o vender tus servicios, seguro conoces la rutina del domingo: pasar cuatro horas buscando ideas, escribiendo guiones, grabando o editando para tener qué publicar en la semana. Al tercer domingo, el cansancio gana y dejas de publicar.

La solución no es trabajar más rápido, sino separar el trabajo creativo de la producción repetitiva. Aquí tienes la arquitectura exacta de mi **lote automático semanal**: una tarea que corre sola los domingos, analiza qué funcionó mejor, escribe 5 guiones, renderiza 5 videos y te los deja listos para aprobar con un clic.

---

## Qué logras con esta guía

- Pasar de 4 horas de guion y edición manual a **revisar y tocar "Aprobar"** en minutos.
- Elegir temas basados en datos reales de tu cuenta y de tu nicho (4 fórmulas ganadoras + 1 de exploración), no al azar.
- Generar voces, música, escenas y renderizado en **Remotion** sin pagar APIs de IA por cada guion.
- Dejar los 5 videos subidos como borrador en tu calendario, listos para publicarse a tu mejor hora.

---

## Qué necesitas

1. **Tu panel o base de datos en Supabase** con `ig_posts`, `ig_media_stats` y `ig_radar_posts` (para saber qué está funcionando).
2. **Antigravity CLI (`agy -p`)** en tu computador para redactar guiones en local sin pagar APIs externas.
3. **Remotion** configurado con una plantilla reutilizable (`auto.tsx`) que lea un archivo de especificaciones y renderice videos en serie.
4. **Programador de tareas de Windows** (o `cron` en Mac/Linux) para que todo corra solo cada domingo a las 10:00.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Calcula qué fórmulas te están dando mejores resultados
Antes de escribir nada, el sistema debe mirar tus estadísticas (`ig_media_stats`) y las del Radar de competencia (`ig_radar_posts`) para darle un puntaje viral a cada estructura de video. La regla de oro: **4 fórmulas top comprobadas + 1 fórmula de exploración** para no estancarse.

> **Prompt para Claude Code:**  
> "Quiero crear un script `auto-lote.mjs` en Node.js que consulte en Supabase mis últimas métricas (`ig_media_stats`) y los posts destacados del radar (`ig_radar_posts`), calcule un puntaje por fórmula de contenido y seleccione 4 fórmulas ganadoras más 1 fórmula nueva de exploración para esta semana."

### Paso 2: Genera los 5 guiones en local sin pagar API
En lugar de gastar saldo en APIs externas cada semana, el script llama por consola a `agy -p` pasándole las 5 fórmulas elegidas, el tono de tu marca y las reglas de duración (20 a 35 segundos).

> **Prompt para Claude Code:**  
> "Agrega a `auto-lote.mjs` una etapa que invoque `agy -p` para redactar 5 guiones cortos en formato JSON (gancho de máximo 8 palabras, cuerpo con prueba o pasos concretos, llamado a la acción con palabra clave y caption), validando que ninguno repita exactamente una idea reciente."

### Paso 3: Elige escena, música, voces y valida antes de renderizar
Para que los 5 videos no se vean iguales, el script rota paletas de color, fondos y música automáticamente, genera los audios de voz y valida que el texto calce en el tiempo antes de gastar minutos renderizando.

> **Prompt para Claude Code:**  
> "Crea un módulo de variedad en `auto-lote.mjs` que asigne a cada uno de los 5 guiones una escena, paleta de colores y pista de música distinta sin repetir las del video anterior, genere los archivos de voz y verifique la duración total de cada spec antes de pasar al render."

### Paso 4: Renderiza los 5 videos en Remotion
Con las especificaciones listas (por ejemplo `au001` a `au005`), Remotion toma una composición maestra (`auto.tsx`) y renderiza los 5 MP4 en serie.

> **Prompt para Claude Code:**  
> "Conecta `auto-lote.mjs` con mi proyecto de Remotion (`src/stock/videos/auto.tsx`) para que renderice secuencialmente cada spec generado y guarde un registro de avance y errores en `auto-lote.log`."

### Paso 5: Sube los videos en borrador y avisa por WhatsApp
El script nunca publica directo sin tu visto bueno. Sube los 5 videos al storage de Supabase, los deja en `ig_posts` con `estado='borrador'` repartidos a las 19:00 de tus próximos días libres (marcando 2 como Reels de prueba) y te manda un aviso por WhatsApp.

> **Prompt para Claude Code:**  
> "Haz que al terminar los renders, `auto-lote.mjs` suba cada MP4 a Supabase Storage, inserte los 5 registros en `ig_posts` con `estado='borrador'` en los próximos días sin contenido a las 19:00 (2 marcados como `prueba=true`), y me envíe un resumen por WhatsApp para entrar a mi panel y tocar el botón Aprobar."

### Paso 6: Programa la tarea automática del domingo
Solo te falta decirle a tu computador que ejecute el script todos los domingos a las 10:00 de la mañana.

> **Prompt para Claude Code:**  
> "Dame las instrucciones exactas para crear una tarea programada en Windows llamada 'NexaBot lote automatico' que ejecute `node auto-lote.mjs` todos los domingos a las 10:00 AM y guarde la salida en `auto-lote.log`."

---

## Errores comunes y cómo evitarlos

1. **Publicar automáticamente sin revisar:** Un error de pronunciación o un texto cortado puede salir en vivo si no hay filtro humano. *Cómo evitarlo:* deja siempre los videos en `estado='borrador'` y usa un botón **Aprobar** antes de que entren a la cola real.
2. **Repetir el mismo estilo visual en los 5 Reels:** Si todos tienen el mismo fondo y música, tu audiencia siente que ve el mismo video. *Cómo evitarlo:* usa reglas de rotación obligatoria para escena, paleta y audio.
3. **Subir archivos que superan el límite gratuito:** Supabase free admite hasta 50 MB por archivo. *Cómo evitarlo:* configura la calidad de render en Remotion (CRF/bitrate equilibrado) para que cada video quede bajo 25 MB.
4. **No guardar logs de ejecución:** Si la tarea falla el domingo mientras no estás, sin log no sabrás en qué paso se detuvo. *Cómo evitarlo:* registra cada etapa en `auto-lote.log`.

---

Si te sirvió esta arquitectura y quieres ver cómo apruebo y publico estos lotes cada semana en tiempo real, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
