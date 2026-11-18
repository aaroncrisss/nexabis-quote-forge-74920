# Cómo blindar tu bot de Instagram para que jamás mande el mismo DM dos veces (con Claude Code)

Cuando automatizas mensajes en Instagram, hay un error silencioso que destruye la confianza de golpe: que tu bot le mande el mismo DM dos o tres veces seguidas a la misma persona. En segundos pasas de verte profesional a parecer spam.

La causa casi siempre es la misma: dos procesos corren en el mismo milisegundo (por ejemplo, el aviso en tiempo real de Meta y tu respaldo automático cada 2 minutos) o una actualización en la base de datos dispara un registro repetido. Aquí tienes cómo construir un **doble escudo anti-duplicados** con Claude Code.

---

## Qué logras con esta guía

- Garantizar que cada comentario en tus Reels o publicaciones se responda **una sola vez**, aunque Meta reintente el aviso diez veces.
- Evitar choques cuando el webhook en tiempo real y el cron de respaldo (`pg_cron`) se ejecutan al mismo segundo.
- Impedir que tus triggers automáticos dupliquen contactos o clientes en tu CRM al actualizar un registro.
- Tener un flujo limpio y confiable sin pagar plataformas externas.

---

## Qué necesitas

1. **Tu proyecto en Supabase** (base de datos PostgreSQL + Edge Functions en la capa gratuita).
2. **Un bot Comment-to-DM básico** o estar armándolo con Claude Code.
3. **Claude Code** (o tu asistente de IA) para generar el SQL y la lógica de control sin escribir código a mano.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Entiende dónde nacen los duplicados
Antes de tocar nada, pídele a Claude que revise tu flujo actual. Los duplicados ocurren en dos puntos: cuando dos procesos leen el mismo comentario al mismo tiempo, y cuando un trigger de base de datos se dispara *antes* de guardar (`BEFORE INSERT`) durante un `upsert`.

> **Prompt para Claude Code:**  
> "Revisa el flujo de mi bot de Instagram en Supabase y dime en qué puntos podrían enviarse dos DMs por un mismo comentario o crearse contactos duplicados si el webhook de Meta y el respaldo con pg_cron corren al mismo milisegundo."

### Paso 2: Crea el Escudo 1 (filtro previo antes de llamar a Meta)
Tu función nunca debe hablar con la API de Meta sin revisar primero si ese comentario ya existe en tu historial. Este primer chequeo ahorra tiempo, llamadas a la API y evita el 95 % de los choques.

> **Prompt para Claude Code:**  
> "En mi Edge Function `instagram-webhook`, agrega una verificación previa antes de enviar cualquier DM o respuesta pública: consulta la tabla `ig_comment_events` contando si ya existe el `comment_id` actual. Si el conteo es mayor a 0, salta ese comentario de inmediato sin llamar a Meta."

### Paso 3: Crea el Escudo 2 (candado `UNIQUE` en PostgreSQL)
¿Qué pasa si dos procesos hacen el chequeo del Paso 2 en el mismo milisegundo y ambos ven que el comentario no existe? Ahí entra el segundo escudo: la base de datos manda. Le pondremos una restricción `UNIQUE` al `comment_id` para que PostgreSQL bloquee el segundo intento con el código de error `23505`.

> **Prompt para Claude Code:**  
> "Crea una migración SQL para Supabase donde la tabla `ig_comment_events` tenga una restricción `UNIQUE (comment_id)` (por ejemplo `ig_comment_events_comment_id_key`). Además, modifica mi Edge Function para que inserte el evento antes o de forma atómica al procesar el comentario: si Postgres devuelve el error `23505` por duplicado, debe capturar el error de forma limpia, registrar que ya fue procesado y NO enviar el DM."

### Paso 4: Evita duplicar clientes con triggers `AFTER`
Si además sincronizas tus contactos de Instagram con una tabla de clientes o CRM, ten mucho cuidado con los triggers. Cuando usas `upsert` (insertar o actualizar si ya existe), un trigger `BEFORE INSERT` puede ejecutarse aunque la fila ya exista y terminar creando dos fichas para la misma persona.

> **Prompt para Claude Code:**  
> "Necesito sincronizar `ig_contacts` con mi tabla de clientes en el CRM cada vez que se entregue una oferta (`oferta_enviada_at`). Crea el trigger SQL usando `AFTER INSERT OR UPDATE` (nunca `BEFORE INSERT`) para evitar que un `upsert` duplique clientes, y asegúrate de guardar el ID del cliente creado en `ig_contacts` para no volver a crearlo."

### Paso 5: Limita campañas a una vez por usuario (opcional)
Si una persona comenta tres veces *"guía"* en el mismo Reel para ayudar al algoritmo, no querrás llenarle la bandeja con tres copias del mismo enlace.

> **Prompt para Claude Code:**  
> "Agrega un campo booleano `una_vez_por_usuario` en `ig_campaigns` y actualiza la lógica de mi Edge Function para que, cuando esté activo, revise si ese usuario ya recibió esa campaña antes en `ig_comment_events` antes de mandarle otro DM."

### Paso 6: Simula un choque real para comprobar que funciona
No esperes a publicar un Reel viral para saber si tu escudo aguanta. Ponlo a prueba ahora.

> **Prompt para Claude Code:**  
> "Arma un script o prueba rápida que envíe dos peticiones simultáneas con el mismo `comment_id` ficticio hacia mi flujo de procesamiento y verifica que solo pase una y la segunda sea frenada por el código `23505`."

---

## Errores comunes y cómo evitarlos

1. **Confiar solo en `if (yaExiste)` en el código:** Cuando dos peticiones llegan juntas, ambas leen "no existe" antes de que la otra termine de escribir. *Cómo evitarlo:* usa siempre la restricción `UNIQUE (comment_id)` en PostgreSQL como juez final.
2. **Usar `BEFORE INSERT` en triggers sobre tablas con `upsert`:** En Postgres, un `upsert` evalúa la inserción antes de resolver el conflicto y puede disparar efectos secundarios duplicados. *Cómo evitarlo:* usa triggers `AFTER` y valida si el vínculo ya existe.
3. **No manejar el error `23505` en la función:** Si la base de datos bloquea el duplicado pero tu código no atrapa el error `23505`, la función puede caer y marcar fallos falsos en tus logs. *Cómo evitarlo:* trata el `23505` como un "ya procesado, todo en orden".
4. **Enviar el DM antes de guardar el registro:** Si primero mandas el mensaje a Meta y después guardas en Supabase, un fallo de red puede dejar el DM enviado sin registro. *Cómo evitarlo:* reserva el `comment_id` en la base de datos primero y luego envía el DM.

---

Si te sirvió esta guía y quieres ver cómo protejo y escalo mis automatizaciones reales en Instagram, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
