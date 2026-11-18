# Por qué apagué la IA de mis DMs: guía práctica de cuándo usar reglas vs inteligencia artificial

Hoy todo el mundo quiere poner un agente con inteligencia artificial a responder sus mensajes de Instagram. Suena moderno, pero cuando lo llevas a un negocio real pasa algo curioso: yo construí el chatbot con Gemini para mis DMs… y decidí dejarlo **apagado** a propósito.

¿La razón? Para el 90 % de los mensajes que llegan después de un Reel, una regla exacta es más rápida, cuesta $0, convierte mejor y jamás inventa un precio ni un enlace que no existe. Aquí tienes el criterio claro para saber cuándo usar código determinista y cuándo prender la IA.

---

## Qué logras con esta guía

- Tomar mejores decisiones de automatización sin meter IA a la fuerza donde no aporta valor.
- Configurar reglas deterministas (`match_mode`) y respuestas guardadas con `{username}` que cierran más rápido.
- Saber exactamente cómo blindar un bot con IA (pausa humana de **12 horas**, señal `[HUMANO]` y límite diario) si decides activarlo más adelante.

---

## Qué necesitas

1. **Tu sistema de DMs en Supabase** (tablas de campañas, mensajes y configuración).
2. **Claridad sobre tus preguntas frecuentes:** qué mensajes llegan tras tus Reels y qué necesita recibir el usuario.
3. **Claude Code** para implementar las reglas, las respuestas rápidas y los frenos de seguridad.

---

## Reglas vs IA: el criterio en 30 segundos

- **Usa reglas deterministas cuando:**
  - Entregas un recurso, guía, link o lead magnet por palabra clave.
  - La pregunta tiene respuesta fija (horarios, precio único, dónde agendar).
  - No puedes arriesgarte a que el bot cambie un enlace o prometa algo falso.
- **Usa IA solo cuando:**
  - El cliente hace preguntas abiertas y variadas sobre un servicio complejo.
  - Ya tienes un freno humano obligatorio y un límite de mensajes por persona.

---

## Paso a paso con prompts listos para Claude Code

### Paso 1: Configura reglas deterministas (`match_mode`)
En vez de pedirle a un modelo de IA que "interprete" si alguien quiere tu guía, usa modos de coincidencia claros en tus campañas: `exacta` (solo esa palabra), `contiene` (la palabra dentro de una frase) o `cualquiera` (cualquier comentario en ese post específico).

> **Prompt para Claude Code:**  
> "Asegúrate de que mi tabla `ig_campaigns` soporte `match_mode` con las opciones `'contiene'`, `'exacta'` y `'cualquiera'`, y escribe una función limpia en TypeScript que evalúe primero las campañas específicas del post y luego las generales sin usar ninguna llamada a IA."

### Paso 2: Usa respuestas guardadas con `{username}` para el resto
Para ese 10 % de dudas reales en bandeja de entrada, no necesitas un bot autónomo que hable solo: te basta con botones de respuestas guardadas que saluden a la persona por su nombre en un clic.

> **Prompt para Claude Code:**  
> "Crea una tabla `ig_respuestas` en Supabase para guardar mis plantillas de respuesta rápida con un título corto y el texto del mensaje usando la variable `{username}`, y muéstralas como botones clicables en mi bandeja para responder DMs en segundos."

### Paso 3: Deja la IA apagada por defecto con un interruptor seguro
Si quieres construir la integración con IA (por ejemplo usando la capa gratuita de Gemini) para tenerla lista, mantenla controlada por una bandera `ai_enabled = false` en tu tabla de configuración (`ig_settings`) y ponle un límite máximo de turnos diarios por persona (`ai_max_turnos_dia`).

> **Prompt para Claude Code:**  
> "Crea una tabla de configuración `ig_settings` con `ai_enabled` (por defecto en `false`) y `ai_max_turnos_dia`. Haz que la función de IA solo se ejecute si `ai_enabled` es `true`, el mensaje no coincide con ninguna campaña determinista y el usuario no superó su límite diario."

### Paso 4: Instala el freno automático de 12 horas cuando habla un humano
El peor papelón de un bot con IA es interrumpirte mientras tú estás conversando manualmente con un cliente desde el celular. Si la bandeja detecta un mensaje enviado por ti directamente desde Instagram, el bot debe callarse por 12 horas.

> **Prompt para Claude Code:**  
> "En el historial `ig_messages`, distingue el origen del mensaje (`usuario`, `campaña`, `ia`, `humano`). Si el sistema detecta un mensaje saliente en la conversación que no fue enviado por el bot ni por una campaña, regístralo como `humano` y pausa automáticamente las respuestas de la IA para ese contacto durante 12 horas."

### Paso 5: Agrega la palabra clave `[HUMANO]` para derivar casos difíciles
Enséñale al prompt de tu IA que, cuando no esté 100 % segura de la respuesta o el cliente pida hablar con una persona, devuelva la etiqueta `[HUMANO]`. Tu código detecta esa etiqueta, pausa la IA 24 horas y te avisa.

> **Prompt para Claude Code:**  
> "Actualiza el flujo de `aiReply()` para que, si la respuesta del modelo contiene `[HUMANO]`, no le envíe esa etiqueta al cliente, pause la IA para ese contacto por 24 horas y me mande una notificación de aviso para tomar la conversación."

### Paso 6: Prueba con un simulador antes de prender nada
Nunca pruebes un bot con IA directo sobre clientes reales.

> **Prompt para Claude Code:**  
> "Agrega una acción `simulate_ai` que me permita escribir un mensaje de prueba y ver exactamente qué respondería la IA con el contexto actual, sin enviar nada por Instagram ni cambiar el estado real del contacto."

---

## Errores comunes y cómo evitarlos

1. **Usar IA para entregar un link:** Gasta latencia, puede deformar la URL y no aporta nada frente a una regla exacta. *Cómo evitarlo:* usa campañas deterministas con `match_mode` para todo lo que sea entrega de recursos.
2. **Dejar que la IA responda sin límite de turnos:** Un usuario curioso puede hacer 50 preguntas seguidas y consumir tu cuota. *Cómo evitarlo:* define `ai_max_turnos_dia` por contacto.
3. **No pausar el bot cuando respondes desde el teléfono:** Si contestas desde la app de Instagram y el bot responde encima 10 segundos después, la experiencia se rompe. *Cómo evitarlo:* implementa la pausa automática de 12 horas al detectar actividad humana.
4. **Conectar APIs de pago sin validar el retorno:** Pagar por cada mensaje de bienvenida rara vez se justifica al inicio. *Cómo evitarlo:* prioriza reglas gratuitas y, si usas IA, parte con modelos de capa gratuita y un interruptor `ai_enabled`.

---

Si te sirvió este enfoque y quieres ver cómo combino automatizaciones simples con resultados reales en Instagram, sígueme en Instagram como **@cris.nexabis**. ¡Nos vemos por allá!
