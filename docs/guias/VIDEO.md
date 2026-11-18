# Cómo crear Reels que se editan y programan solos con Claude Code y Remotion

Grabar, cortar silencios, poner subtítulos y exportar en CapCut puede comerse toda tu semana. La alternativa moderna es tratar tus Reels como **plantillas programables**: tú apruebas el guion y el sistema genera la voz, arma las escenas en vertical, valida que no se repita el estilo y deja los videos listos para publicar.

Con **Remotion** y **Claude Code**, no necesitas saber programar React ni edición avanzada para montar tu propia fábrica de videos.

---

## Qué logras con esta guía

- Convertir guiones en texto (formato JSON) en Reels verticales (1080×1920) listos para subir.
- Generar narración con voz automática y subtítulos sincronizados por cuadro.
- Aplicar reglas de variedad para que dos videos seguidos nunca repitan la misma música, paleta o escena.
- Dejar un lote semanal de videos renderizados y listos para aprobar en minutos.

---

## Qué necesitas (todo gratis o casi)

1. **Node.js** instalado en tu computador (gratis).
2. **Remotion** (gratuito para uso individual y pequeños creadores según su licencia).
3. **Claude Code** para armar las escenas, los guiones y los scripts sin escribir código a mano.
4. **Generador de voz gratuito** (como `edge-tts` o voces locales) y una carpeta con música libre de derechos.
5. *(Opcional)* **Supabase** (plan gratuito) si quieres subir los borradores automáticamente a un calendario de publicación.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Crea tu estudio de video en vertical
Inicia un proyecto de Remotion configurado desde cero para formato Reel (9:16).

> **Prompt para Claude Code:**  
> "Crea un proyecto nuevo con Remotion en esta carpeta, configurado para videos verticales de Instagram Reels (1080x1920 a 30 fps) de entre 20 y 45 segundos. Déjame el comando para abrir el Studio y previsualizar en el navegador."

### Paso 2: Define la identidad de tu marca y tus guiones
En vez de editar a mano cada video, guarda tus textos y estructura en un archivo de especificaciones (specs).

> **Prompt para Claude Code:**  
> "Crea un archivo `specs/videos.json` con 3 ejemplos de guiones para mi nicho. Cada video debe tener: id, gancho inicial (primeros 3 segundos), cuerpo dividido en 3 ideas cortas, llamado a la acción final para que comenten una palabra clave, paleta de colores y tipo de escena."

### Paso 3: Construye escenas reutilizables y deterministas
La magia de Remotion es que cada cuadro del video se calcula de forma exacta según el número de frame (sin animaciones aleatorias que fallen al exportar).

> **Prompt para Claude Code:**  
> "Crea un motor de escenas en `src/stock/` que lea `specs/videos.json` y renderice automáticamente: una escena de gancho con texto grande animado, tarjetas visuales para el desarrollo, subtítulos sincronizados abajo y una pantalla final con el llamado a la acción."

### Paso 4: Automatiza las voces desde el guion
No necesitas grabar tu voz cada vez si quieres escalar contenido informativo o educativo (aunque también puedes usar tus propios audios).

> **Prompt para Claude Code:**  
> "Crea un script en `tools/generar-voces.mjs` que lea los textos de `specs/videos.json`, genere los archivos de audio MP3 usando una herramienta gratuita de texto a voz (como `edge-tts`), mida la duración exacta de cada audio y ajuste la duración de cada escena en el JSON."

### Paso 5: Agrega un validador de variedad
Si todos tus Reels se ven iguales, la audiencia pasa de largo. Crea una regla automática que revise el lote antes de renderizar.

> **Prompt para Claude Code:**  
> "Crea un script `tools/validar.mjs` que revise los videos nuevos y me avise con un error si dos videos seguidos usan exactamente la misma combinación de música, paleta de colores o escena principal."

### Paso 6: Renderiza tu lote completo en un comando
Cuando el estudio y las voces estén listos, exporta todos los videos en MP4 sin abrir ningún editor manual.

> **Prompt para Claude Code:**  
> "Agrega un comando `npm run render-lote` que valide primero la variedad, luego renderice cada video pendiente de `specs/videos.json` en formato MP4 listo para Instagram y los guarde en la carpeta `out/`."

### Paso 7: Conecta un lote semanal automático
Puedes programar una tarea en tu computador (por ejemplo los domingos en la mañana) para que genere 4 o 5 ideas nuevas, arme los videos y te avise cuando estén listos para revisar y publicar.

> **Prompt para Claude Code:**  
> "Crea un script `tools/lote-semanal.mjs` que tome mis mejores temas, genere 4 nuevos guiones en `specs/videos.json`, cree las voces, valide variedad, renderice los MP4 y me explique cómo programarlo en el Programador de Tareas de Windows (o cron en Mac) para que corra cada domingo."

---

## Errores comunes de Meta y cómo evitarlos (al publicar y conectar con tu bot)

Cuando tus Reels automáticos salen a Instagram y los conectas con respuestas por DM, ten en cuenta estas reglas de Meta:

1. **Ventana de 7 días:** Si un Reel despega semanas después, Meta no te dejará enviar *Private Replies* a comentarios que tengan más de 7 días de antigüedad. *Cómo evitarlo:* configura tu automatización para responder solo comentarios dentro de la ventana de 7 días y atiende los antiguos manualmente.
2. **No usar botones en Private Replies:** Si tu video cierra diciendo *"Comenta GUIA"*, no intentes enviar un DM inicial con botones de enlace (`web_url`); Meta lo bloqueará. *Cómo evitarlo:* envía el texto con el enlace directo escrito en plano.
3. **App en modo desarrollo:** Si decides publicar o programar tus Reels automáticamente vía Graph API, recuerda que en modo desarrollo las funciones y webhooks tienen restricciones para cuentas externas. *Cómo evitarlo:* usa borradores listos para aprobar o solicita *App Review* antes de escalar.
4. **Límites de llamadas:** Subir muchos videos seguidos o consultar métricas de reproducción cada minuto agota la cuota de Meta y genera bloqueos temporales. *Cómo evitarlo:* programa máximo un Reel por día en horarios separados y espacia las consultas de estadísticas.

---

Si quieres ver estos Reels automáticos funcionando en vivo y aprender más sistemas de IA práctica para creadores, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos allá!
