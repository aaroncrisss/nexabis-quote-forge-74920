# Cómo conectar cada comentario de Instagram directo a tu CRM (con Claude Code)

Responder comentarios con un DM automático es solo la mitad del trabajo. Si después tienes que copiar nombres a mano en una planilla para saber quién preguntó, quién hizo clic y quién terminó comprando, sigues perdiendo tiempo y ventas.

Aquí tienes la guía paso a paso para convertir tu bot de Instagram en un **embudo automático conectado a tu CRM**, usando Claude Code para crear las tablas, el enlace rastreable y el panel de métricas sin escribir código a mano.

---

## Qué logras con esta guía

- Pasar automáticamente a tu CRM a cada persona que comenta tu palabra clave y recibe tu enlace por DM.
- Evitar leads duplicados cuando un mismo usuario comenta varias veces o se actualiza su ficha.
- Medir clics reales con enlaces cortos propios (`/r/`) y parámetros UTM por campaña.
- Ver el embudo completo en un solo lugar: comentarios, DMs, ofertas enviadas, clics, leads, presupuestos e ingresos por cada Reel.

---

## Qué necesitas

1. **Tu bot Comment-to-DM funcionando en Supabase** (con las tablas `ig_campaigns`, `ig_contacts` e `ig_comment_events`).
2. **Un CRM en la misma base de datos** (por ejemplo, tablas de `clientes` y `oportunidades`, o las que ya uses en tu proyecto).
3. **Tu dominio propio** para servir enlaces cortos del tipo `/r/tu-recurso`.
4. **Claude Code** abierto en la carpeta de tu proyecto para generar las migraciones SQL y las funciones.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Prepara el enlace rastreable de tu recurso
Antes de conectar el CRM, necesitas saber quién hace clic en el enlace que envías por DM. En lugar de mandar una URL genérica, crea un sistema de enlaces cortos propios que registre cada clic y agregue etiquetas UTM automáticamente.

> **Prompt para Claude Code:**  
> "Crea una tabla `ig_links` en Supabase y una función RPC `ig_register_click` para generar enlaces cortos rastreables en mi dominio bajo la ruta `/r/<token>`. Cuando envíe una oferta por DM, agrega parámetros UTM con la campaña y el post de origen (excepto si el enlace es de WhatsApp) y redirige al destino final al hacer clic."

### Paso 2: Conecta `ig_contacts` con tu CRM usando un trigger `AFTER`
Cuando el bot entrega una oferta por DM, guarda la fecha en `ig_contacts.oferta_enviada_at`. Ese momento exacto debe disparar la creación del lead en tu CRM, registrando que llegó desde Instagram y asociándolo a su campaña.

> **Prompt para Claude Code:**  
> "Crea una migración SQL con un trigger llamado `ig_sync_contact_to_crm` que se ejecute `AFTER INSERT OR UPDATE` sobre `ig_contacts.oferta_enviada_at`. Es muy importante que sea `AFTER` y no `BEFORE`, porque al hacer `upsert` un trigger `BEFORE` puede duplicar clientes. Cuando `oferta_enviada_at` pase a tener fecha y no exista `cliente_id`, crea el registro en `clientes` con `fuente='instagram'` y `etapa_ciclo='lead'`, crea una oportunidad en la primera etapa del pipeline y guarda el `cliente_id` de vuelta en `ig_contacts`."

### Paso 3: Crea la función SQL del embudo completo
Ahora que tienes comentarios, DMs, clics y leads conectados por el mismo `cliente_id` y la misma campaña, pídele a Claude una función en PostgreSQL que resuma todo en números claros.

> **Prompt para Claude Code:**  
> "Escríbeme una función RPC en Supabase llamada `ig_funnel_stats()` que devuelva las métricas totales del embudo: comentarios recibidos, DMs enviados, ofertas entregadas, clics en enlaces, leads creados en el CRM, presupuestos generados, presupuestos aprobados e ingresos cerrados, además de un desglose por cada campaña de `ig_campaigns`."

### Paso 4: Agrega la vista del embudo a tu panel
Con la función `ig_funnel_stats()` lista, solo falta mostrar esos números de forma visual para saber en segundos qué Reel trae clientes reales y cuál solo trae curiosos.

> **Prompt para Claude Code:**  
> "Conecta mi panel de Instagram en el frontend con la RPC `ig_funnel_stats()`. Muéstrame tarjetas con los totales del embudo arriba y una tabla debajo con el rendimiento por campaña, incluyendo la tasa de conversión de comentario a clic y de clic a venta."

---

## Errores comunes y cómo evitarlos

1. **Usar un trigger `BEFORE INSERT` con `upsert`:** Si actualizas el contacto con `upsert`, PostgreSQL puede disparar el trigger antes de resolver el conflicto y crear dos fichas repetidas en tu CRM. *Cómo evitarlo:* usa siempre un trigger `AFTER` y verifica que `cliente_id` siga vacío antes de insertar.
2. **Mandar links largos de tracking en el DM:** Los enlaces con parámetros largos o dominios raros generan desconfianza y reciben menos clics. *Cómo evitarlo:* envuelve el destino detrás de tu propio enlace corto `/r/` y aplica los UTM al redirigir.
3. **Medir solo comentarios y likes:** Un Reel con cien comentarios puede traer cero ventas si el público no califica. *Cómo evitarlo:* revisa cada semana el desglose por campaña en `ig_funnel_stats()` para duplicar los temas que sí generan presupuestos.

---

Si te sirvió esta guía y quieres ver cómo conecto este embudo con alertas de Reels virales y publicación automática, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
