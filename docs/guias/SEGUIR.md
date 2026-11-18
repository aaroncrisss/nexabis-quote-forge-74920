# Cómo pedir que te sigan antes de entregar el enlace por DM (con Claude Code)

Regalar guías, plantillas o enlaces por DM apenas alguien comenta funciona muy bien para generar conversación, pero mucha gente toma el recurso y se va sin seguirte. Pedir el follow de forma manual es imposible cuando llegan decenas de comentarios en un día.

Aquí tienes la guía para armar con Claude Code un **flujo automático de dos pasos "seguir antes de recibir"**, usando la API oficial de Meta y una regla de seguridad para no dejar nunca sin respuesta a un seguidor real.

---

## Qué logras con esta guía

- Activar el modo **"seguir antes de recibir"** por campaña, sin afectar tus otras automatizaciones directas.
- Enviar primero un DM amable con un botón de respuesta rápida (*quick reply*), por ejemplo: *"Ya te sigo ✅"*.
- Consultar en tiempo real a la Graph API de Meta (`is_user_follow_business`) si la persona realmente te sigue.
- Recordar el follow si aún no te sigue, o entregar el enlace enseguida si ya te sigue (con respaldo automático si Meta no responde el campo).

---

## Qué necesitas

1. **Tu bot Comment-to-DM funcionando** en Supabase con la Edge Function `instagram-webhook`.
2. **Tabla de campañas (`ig_campaigns`) y contactos (`ig_contacts`)** para guardar en qué paso va cada persona.
3. **Claude Code** para agregar los campos a la base de datos y programar la verificación en dos pasos.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Agrega las opciones de follow a tus campañas
No todas las campañas necesitan pedir el follow (por ejemplo, una campaña de venta directa conviene dejarla en modo directo). Agrega un interruptor para activarlo solo donde tenga sentido.

> **Prompt para Claude Code:**  
> "Crea una migración SQL para agregar a `ig_campaigns` los campos `requiere_seguir` (booleano, por defecto `false`), `mensaje_seguir` (texto del primer DM pidiendo el follow) y `mensaje_no_sigue` (texto recordatorio si toca el botón sin seguirme todavía). Asegúrate de que cuando `requiere_seguir` sea `true`, la campaña use el flujo de dos pasos."

### Paso 2: Envía el primer DM con el botón "Ya te sigo ✅"
Cuando alguien comente la palabra clave en un Reel con esta opción activa, el bot no manda el enlace todavía: envía una respuesta privada invitándolo a seguirte y un botón rápido para confirmar. Recuerda que Meta limita los botones *quick reply* a un máximo de 20 caracteres.

> **Prompt para Claude Code:**  
> "Actualiza `instagram-webhook` para que, cuando una campaña tenga `requiere_seguir = true`, guarde la campaña pendiente en `ig_contacts` y envíe como primer DM el texto de `mensaje_seguir` junto a un botón de respuesta rápida (`quick_reply`) que diga 'Ya te sigo ✅' con un payload identificable."

### Paso 3: Verifica el follow con `is_user_follow_business` y agrega el fallback
Cuando el usuario toca el botón, Meta envía un evento de mensaje entrante a tu Edge Function (o lo recoge tu respaldo cada 2 minutos). En ese instante consultas el perfil del usuario en la API de Meta.

> **Prompt para Claude Code:**  
> "Cuando el usuario toque el botón 'Ya te sigo ✅', consulta en la Graph API de Meta el campo `is_user_follow_business` para ese usuario. Si devuelve `false`, responde con `mensaje_no_sigue` y vuelve a mostrar el botón 'Ya te sigo ✅'. Si devuelve `true`, entrega la oferta y el enlace final. Muy importante: si Meta devuelve `null`, `undefined` o falla al consultar ese campo, entrega el enlace igual como fallback para no frenar ni frustrar a una persona que sí me sigue."

### Paso 4: Prueba ambos escenarios en tu simulador
Antes de publicar un Reel real con este flujo, prueba qué pasa cuando el usuario dice que ya te sigue sin haberlo hecho y qué pasa cuando sí te sigue.

> **Prompt para Claude Code:**  
> "Agrega un parámetro opcional en la acción `simulate` de `instagram-webhook` para simular `is_user_follow_business` como `true`, `false` y `null`, y verifica que en los tres casos el flujo responda el texto y los botones correctos sin errores."

---

## Errores comunes y cómo evitarlos

1. **Bloquear la entrega cuando Meta devuelve `null`:** Por privacidad de ciertas cuentas o fallos temporales, Meta a veces no entrega el valor de `is_user_follow_business`. Si exiges `=== true` estricto, dejarás a seguidores reales atrapados en un bucle infinito. *Cómo evitarlo:* trata solo el `false` explícito como "no sigue"; cualquier `null` o respuesta vacía deja pasar el enlace.
2. **Pasarse de 20 caracteres en el botón:** Meta rechaza botones *quick reply* largos y el DM nunca sale. *Cómo evitarlo:* mantén textos cortos como `"Ya te sigo ✅"` o `"Listo, ya te sigo"`.
3. **Intentar poner botones URL en el primer DM del comentario:** En la respuesta directa a un comentario (*Private Reply*), Meta prohíbe plantillas con botones de enlace. *Cómo evitarlo:* usa texto + *quick reply* en el paso 1, y entrega el enlace en texto plano cuando el usuario toque el botón.

---

Si te sirvió esta guía y quieres ver cómo mido cuántos de esos nuevos seguidores terminan convirtiendo en el CRM, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
