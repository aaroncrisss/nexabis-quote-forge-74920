# Guiones a cámara (Parte 2) — nuevo público (IA / Claude "así lo hice")

Continuación de [GUIONES_CAMARA.md](file:///C:/Users/craba/OneDrive/Desktop/Personal/Proyectos/nexabis-quote-forge-74920/docs/GUIONES_CAMARA.md) con 10 guiones nuevos basados en lo que ya está construido y documentado en [CLAUDE.md](file:///C:/Users/craba/OneDrive/Desktop/Personal/Proyectos/nexabis-quote-forge-74920/CLAUDE.md).

**Mezcla de esta tanda (10 guiones):**
- **4** "así lo hice con Claude" (Guiones 4, 5, 6, 7)
- **2** "error/fracaso que me pasó" (Guiones 8, 9)
- **2** "antes vs después / ahorro de plata" (Guiones 10, 11)
- **1** "desafío para el espectador" (Guion 12)
- **1** "opinión polémica sobre IA" (Guion 13)

**Reglas aplicadas:** gancho ≤ 8 palabras con tensión personal o resultado concreto en el 1er segundo, 20–35 s, prueba real en pantalla y palabra única en MAYÚSCULAS que entrega un recurso real.

---

## Guion 4 — "Cada comentario en Instagram entra solo al CRM."
**Categoría:** Así lo hice con Claude · **Palabra:** `EMBUDO` · **Duración:** ~30 s · **Formato:** cara + pantalla

| # | Dices | En pantalla |
|---|---|---|
| 1 | "Cada comentario en Instagram entra solo al CRM." | Tu cara. Texto: **DE COMENTARIO A CLIENTE EN CRM** |
| 2 | "No copio nombres a mano ni uso planillas." | Tu cara negando con la cabeza |
| 3 | "Cuando alguien comenta y recibe el link por DM…" | Celular: llega el DM con link `/r/` rastreable |
| 4 | "…un trigger en Supabase lo crea como lead en mi CRM." | Pantalla: `ig_sync_contact_to_crm` / ficha con `fuente='instagram'` |
| 5 | "Y aquí veo todo el embudo: comentarios, clics, presupuestos e ingresos." | Panel `/instagram`: métricas reales de `ig_funnel_stats()` |
| 6 | "Sé exactamente qué reel trae ventas y cuál no." | Tabla de desglose por campaña en el panel |
| 7 | "Comenta EMBUDO y te mando la plantilla SQL y la guía." | Tu cara. Tarjeta: **Comenta EMBUDO** |

**Caption:**
Dejé de perder leads entre los DMs de Instagram 📉

Cada persona que comenta y recibe mi link entra directo al CRM con su campaña de origen, y veo cuántos terminan en presupuesto o venta.

Comenta EMBUDO y te paso la guía + el SQL para armarlo con Claude 👇

#claudecode #supabase #crm #automatizacion

---

## Guion 5 — "Mi Instagram me avisa cuando un reel despega."
**Categoría:** Así lo hice con Claude · **Palabra:** `DESPEGUE` · **Duración:** ~28 s · **Formato:** cara + pantalla

| # | Dices | En pantalla |
|---|---|---|
| 1 | "Mi Instagram me avisa cuando un reel despega." | Tu cara. Texto: **ALERTA DE REEL VIRAL** |
| 2 | "No entro cada cinco minutos a revisar las vistas." | Tu cara dejando el celular sobre la mesa |
| 3 | "Entre una y cuatro horas después de publicar, mi sistema mide el reel." | Código/log de `checkDespegue()` corriendo en `maintenance()` |
| 4 | "Si supera uno coma cinco veces mi mediana de los últimos veinte…" | Gráfica o tabla `ig_media_stats` con la comparación |
| 5 | "…me llega este WhatsApp con cinco acciones para empujarlo." | WhatsApp real con el aviso de despegue y los pasos |
| 6 | "Y en el Radar me muestra dónde comentar hoy en mi nicho." | Pestaña `?tab=radar`, vista "Comenta hoy" (últimas 48 h) |
| 7 | "Comenta DESPEGUE y te paso el prompt y la lógica." | Tu cara. Tarjeta: **Comenta DESPEGUE** |

**Caption:**
Cuando un reel empieza a despegar tienes una ventana corta para empujarlo 📈

Le pedí a Claude una alerta en Supabase que compara cada reel nuevo contra mi mediana de los últimos 20 y me avisa por WhatsApp si pasa el 1,5×.

Comenta DESPEGUE y te mando cómo lo armé 👇

#claudecode #instagram #ia #creadordecontenido

---

## Guion 6 — "Claude programa mis reels a mi mejor hora."
**Categoría:** Así lo hice con Claude · **Palabra:** `HORARIO` · **Duración:** ~28 s · **Formato:** cara + pantalla

| # | Dices | En pantalla |
|---|---|---|
| 1 | "Claude programa mis reels a mi mejor hora." | Tu cara. Texto: **PUBLICA A TU MEJOR HORA** |
| 2 | "Dejé de adivinar si publicar a las doce o a las ocho." | Tu cara |
| 3 | "En mi panel cruzo tres datos reales de mi cuenta:" | Pestaña Analítica (`?tab=analitica`) |
| 4 | "cuándo están conectados mis seguidores, a qué hora comentan y el alcance." | Heatmap `ig_activity_heatmap` + chips de `computeBestTimes()` |
| 5 | "Toco un chip, pre-llena la fecha y lo publica solo." | Panel Contenido: clic en chip de mejor hora → programado |
| 6 | "Y veinte minutos después sube la historia automática." | Registro de historia automática (`auto_historia`) |
| 7 | "Comenta HORARIO y te mando la fórmula y el SQL." | Tu cara. Tarjeta: **Comenta HORARIO** |

**Caption:**
Publicar "cuando te acuerdas" mata el alcance ⏰

Armé con Claude un cálculo simple (40 % seguidores conectados, 35 % hora de comentarios, 25 % alcance) que me da los 3 mejores horarios de la semana en 1 clic.

Comenta HORARIO y te paso la fórmula + el SQL del heatmap 👇

#claudecode #analitica #instagram #ia

---

## Guion 7 — "Te obligo a seguirme antes del link."
**Categoría:** Así lo hice con Claude · **Palabra:** `SEGUIR` · **Duración:** ~25 s · **Formato:** cara + pantalla

| # | Dices | En pantalla |
|---|---|---|
| 1 | "Te obligo a seguirme antes del link." | Tu cara. Texto: **SEGUIR ANTES DE RECIBIR** |
| 2 | "Así convierto comentarios sueltos en seguidores reales." | Tu cara |
| 3 | "Alguien comenta la palabra clave en un reel." | Celular: comentario de prueba en un reel |
| 4 | "Mi bot le manda un DM con un botón: Ya te sigo." | DM real con el quick reply "Ya te sigo ✅" |
| 5 | "Cuando lo toca, consulta la API oficial de Meta." | Log de `is_user_follow_business` (`true` / `false`) |
| 6 | "Si no me sigue, le recuerda. Si me sigue, le suelta el link." | DM con el enlace enmascarado `/r/<slug>` |
| 7 | "Comenta SEGUIR y te paso la guía de los dos pasos." | Tu cara. Tarjeta: **Comenta SEGUIR** |

**Caption:**
Regalar recursos sin pedir el follow es dejar seguidores en la mesa 👀

Con la API oficial de Meta puedes verificar si quien comentó ya te sigue antes de soltarle el link (y si Meta no responde el campo, igual se lo entregas para no frenar a nadie).

Comenta SEGUIR y te mando cómo configurarlo 👇

#claudecode #instagram #growth #automatizacion

---

## Guion 8 — "Meta me rechazó cien DMs por este error."
**Categoría:** Error/fracaso que me pasó · **Palabra:** `META` · **Duración:** ~32 s · **Formato:** cara + pantalla

| # | Dices | En pantalla |
|---|---|---|
| 1 | "Meta me rechazó cien DMs por este error." | Tu cara. Texto: **EL ERROR QUE BLOQUEÓ MIS DMs** |
| 2 | "Si estás armando tu bot con la API de Instagram, mírate esto." | Tu cara señalando la pantalla |
| 3 | "Primer fallo: mandé un token EAA a graph.instagram.com." | Código en `instagram-webhook/index.ts` mostrando `graph.facebook.com/v21.0` |
| 4 | "Error de autorización al instante. Token de página va a graph.facebook.com." | Texto en pantalla: `EAA... → graph.facebook.com` |
| 5 | "Segundo fallo: quise mandar botón URL en respuesta a comentario." | Error real `#100 Param recipient[comment_id] must not be used with template messages` |
| 6 | "Meta lo prohíbe. En texto plano sí convierte el link en botón." | DM real con el enlace cliqueable en texto plano |
| 7 | "Comenta META y te mando mi lista de errores reales." | Tu cara. Tarjeta: **Comenta META** |

**Caption:**
Dos errores de la Graph API de Meta que me costaron horas de debug 🧯

1. Token `EAA...` siempre apunta a `graph.facebook.com/v21.0`, nunca a `graph.instagram.com`.
2. En Private Reply (`recipient[comment_id]`) Meta rechaza `template: generic` con error `#100`. Manda el link en texto plano.

Comenta META y te paso mi guía completa de errores verificados 👇

#metagraphapi #claudecode #desarrolloweb #ia

---

## Guion 9 — "Mi bot mandó el mismo DM dos veces."
**Categoría:** Error/fracaso que me pasó · **Palabra:** `ESCUDO` · **Duración:** ~30 s · **Formato:** cara + pantalla

| # | Dices | En pantalla |
|---|---|---|
| 1 | "Mi bot mandó el mismo DM dos veces." | Tu cara. Texto: **MI BOT SPAMEÓ A UN CLIENTE** |
| 2 | "Nada quema más la confianza que recibir el mismo mensaje repetido." | Tu cara |
| 3 | "Me pasó cuando el webhook y el cron corrieron en el mismo segundo." | Diagrama en `CLAUDE.md`: Webhook + `pg_cron` cada 2 min |
| 4 | "También un trigger BEFORE INSERT me duplicó clientes en el upsert." | Nota real en `CLAUDE.md` sobre `BEFORE INSERT` vs `AFTER` |
| 5 | "La solución fue doble escudo: chequeo previo y UNIQUE en Postgres." | SQL: `ig_comment_events_comment_id_key UNIQUE (comment_id)` (error `23505`) |
| 6 | "Desde ahí, cero duplicados aunque Meta reintente diez veces." | Tabla `ig_comment_events` limpia en Supabase |
| 7 | "Comenta ESCUDO y te paso el SQL anti-duplicados." | Tu cara. Tarjeta: **Comenta ESCUDO** |

**Caption:**
Un bot que responde dos veces parece spam, aunque tu intención sea buena 😬

Cuando mezclas webhooks en tiempo real + cron de respaldo, el choque en el mismo milisegundo pasa sí o sí.

La única cura real: filtro previo + restricción `UNIQUE (comment_id)` en PostgreSQL + trigger `AFTER` en lugar de `BEFORE`.

Comenta ESCUDO y te mando la plantilla SQL 👇

#supabase #postgresql #claudecode #automatizacion

---

## Guion 10 — "Cero dólares al mes en herramientas de Instagram."
**Categoría:** Antes vs después / ahorro de plata · **Palabra:** `STACK` · **Duración:** ~30 s · **Formato:** cara + pantalla

| # | Dices | En pantalla |
|---|---|---|
| 1 | "Cero dólares al mes en herramientas de Instagram." | Tu cara. Texto: **$0 AL MES EN INSTAGRAM** |
| 2 | "Antes pagabas ManyChat, programador de posts, acortador de links y analítica." | Texto tachado en pantalla: ManyChat / Scheduler / Linktree / Analítica |
| 3 | "Mira lo que reemplacé con Claude en un solo proyecto:" | Panel `/instagram` completo con todas sus pestañas |
| 4 | "Base de datos, cron y Edge Functions en la capa gratis de Supabase." | Dashboard de Supabase (`ig_campaigns`, `ig_posts`, `ig_media_stats`) |
| 5 | "Links cortos propios con rastreo en mi dominio." | Pantalla de `ResourcesManager` y ruta `/r/:code` |
| 6 | "Y la IA para guiones y videos corre local sin API de pago." | Terminal con `agy -p` + Remotion |
| 7 | "Comenta STACK y te mando el mapa completo." | Tu cara. Tarjeta: **Comenta STACK** |

**Caption:**
Antes de pagar 4 suscripciones para manejar tu Instagram, mira esto 💸

Todo mi sistema (Comment-to-DM, programación de reels y carruseles, radar de competencia, links `/r/` y analítica) corre por $0/mes sobre Supabase + código propio hecho con Claude.

Comenta STACK y te paso el mapa de qué reemplaza a cada app 👇

#claudecode #saas #ahorro #ia

---

## Guion 11 — "De cuatro horas editando a solo un clic."
**Categoría:** Antes vs después / ahorro de plata · **Palabra:** `LOTE` · **Duración:** ~30 s · **Formato:** cara + pantalla

| # | Dices | En pantalla |
|---|---|---|
| 1 | "De cuatro horas editando a solo un clic." | Tu cara. Texto: **4 HORAS → 1 CLIC** |
| 2 | "Antes el domingo se me iba escribiendo guiones y editando." | Tu cara cansada frente al PC |
| 3 | "Ahora todos los domingos a las diez corre esta tarea sola." | Programador de tareas de Windows: `NexaBot lote automatico` |
| 4 | "El script lee qué fórmulas funcionaron mejor en mi cuenta…" | Log `auto-lote.log` mostrando selección de 4 fórmulas top + 1 exploración |
| 5 | "…genera cinco guiones, voces, música y los renderiza en Remotion." | Remotion renderizando specs `auNNN` en `auto.tsx` |
| 6 | "Los sube en borrador a mi panel. Yo solo entro y toco Aprobar." | Panel Contenido → botón **Aprobar** |
| 7 | "Comenta LOTE y te mando el flujo completo." | Tu cara. Tarjeta: **Comenta LOTE** |

**Caption:**
Mi domingo antes: 4 horas frente al editor.
Mi domingo hoy: 1 clic en **Aprobar** ⚡

Un script revisa mis estadísticas reales y las del Radar, escribe 5 guiones con `agy -p`, los renderiza en Remotion y me los deja listos en borrador.

Comenta LOTE y te explico la arquitectura paso a paso 👇

#remotion #claudecode #productividad #ia

---

## Guion 12 — "Te reto: arma tu bot en 48 horas."
**Categoría:** Desafío para el espectador · **Palabra:** `RETO` · **Duración:** ~25 s · **Formato:** cara + pantalla

| # | Dices | En pantalla |
|---|---|---|
| 1 | "Te reto: arma tu bot en 48 horas." | Tu cara. Texto: **RETO: TU BOT EN 48H** |
| 2 | "Si sabes usar Claude, no necesitas pagar ManyChat este mes." | Tu cara |
| 3 | "Solo necesitas cuatro tablas en Supabase…" | Esquema en `CLAUDE.md`: `ig_account`, `ig_campaigns`, `ig_contacts`, `ig_comment_events` |
| 4 | "…una Edge Function conectada a la API de Meta…" | Archivo `supabase/functions/instagram-webhook/index.ts` |
| 5 | "…y un simulador local para probar antes de publicarlo." | Simulador en vivo de `/instagram` respondiendo un comentario de prueba |
| 6 | "Si lo armas este finde, etiquétame y lo reviso en historias." | Tu cara señalando a cámara |
| 7 | "Comenta RETO y te mando la guía de inicio rápido." | Tu cara. Tarjeta: **Comenta RETO** |

**Caption:**
Reto de fin de semana: deja de pagar por automatizar DMs 🎯

Con 4 tablas en Supabase, 1 Edge Function y Claude, en 48 horas tienes tu propio Comment-to-DM funcionando con simulador incluido.

Comenta RETO y te mando el checklist + las 4 tablas para empezar hoy 👇

#reto #claudecode #supabase #ia

---

## Guion 13 — "Apagué la IA de mis DMs por esto."
**Categoría:** Opinión polémica sobre IA · **Palabra:** `CRITERIO` · **Duración:** ~30 s · **Formato:** cara + pantalla

| # | Dices | En pantalla |
|---|---|---|
| 1 | "Apagué la IA de mis DMs por esto." | Tu cara. Texto: **APAGUÉ LA IA EN MIS DMs** |
| 2 | "Todo el mundo quiere meter un chatbot con IA a responder todo." | Tu cara |
| 3 | "Yo lo construí con Gemini… y lo dejé apagado a propósito." | Línea real de `CLAUDE.md`: `Nexabot IA (APAGADO, sin pestaña en el panel)` |
| 4 | "Para entregar un link o responder una palabra, la IA sobra y puede alucinar." | Reglas deterministas (`match_mode`) + chips de `ig_respuestas` |
| 5 | "Una regla exacta y respuestas guardadas convierten más rápido y sin costo." | Panel de respuestas guardadas `{username}` en Bandeja |
| 6 | "Y si algún día la prendo, tiene freno automático cuando habla un humano." | Regla `[HUMANO]` y pausa de 12 h en `CLAUDE.md` |
| 7 | "Comenta CRITERIO y te mando cuándo usar reglas vs IA." | Tu cara. Tarjeta: **Comenta CRITERIO** |

**Caption:**
Opinión impopular: no todo necesita un agente de IA 🤖❌

Construí el bot conversacional con Gemini para mis DMs y decidí dejarlo apagado. Para el 90 % de los mensajes, una regla determinista + respuestas guardadas es más rápida, más barata y no alucina precios.

Comenta CRITERIO y te mando mi guía de cuándo usar código vs IA 👇

#ia #automatizacion #claudecode #negocios

---

## Calendario sugerido (2 semanas)

Alterna los **3 guiones existentes** (`BOT`, `VIDEO`, `RADAR`) con los **10 nuevos** en un ciclo de 14 días (13 publicaciones + 1 día de descanso/interacción en historias):

| Día | Guion | Categoría | Palabra | Nota |
|---|---|---|---|---|
| **Sem 1 · Lun** | **Guion 1** (existente) | Así lo hice con Claude | `BOT` | Gancho fuerte de apertura (ManyChat gratis) |
| **Sem 1 · Mar** | **Guion 8** (nuevo) | Error/fracaso que me pasó | `META` | Tensión técnica tras el lanzamiento del bot |
| **Sem 1 · Mié** | **Guion 4** (nuevo) | Así lo hice con Claude | `EMBUDO` | Siguiente paso natural del Comment-to-DM |
| **Sem 1 · Jue** | **Guion 10** (nuevo) | Antes vs después / ahorro | `STACK` | Ahorro de plata ($0/mes) |
| **Sem 1 · Vie** | **Guion 2** (existente) | Así lo hice con Claude | `VIDEO` | Reels que se hacen solos cada domingo |
| **Sem 1 · Sáb** | **Guion 12** (nuevo) | Desafío para el espectador | `RETO` | Ideal para fin de semana ("en 48 horas") |
| **Sem 1 · Dom** | *Descanso / Historias* | — | — | Responder comentarios y mostrar avances del reto |
| **Sem 2 · Lun** | **Guion 11** (nuevo) | Antes vs después / ahorro | `LOTE` | Conecta con el lote automático del domingo |
| **Sem 2 · Mar** | **Guion 3** (existente) | Así lo hice con Claude | `RADAR` | Radar de competencia |
| **Sem 2 · Mié** | **Guion 9** (nuevo) | Error/fracaso que me pasó | `ESCUDO` | Historia real de bug + solución |
| **Sem 2 · Jue** | **Guion 5** (nuevo) | Así lo hice con Claude | `DESPEGUE` | Alerta de reel viral por WhatsApp |
| **Sem 2 · Vie** | **Guion 13** (nuevo) | Opinión polémica sobre IA | `CRITERIO` | Debate en comentarios antes del finde |
| **Sem 2 · Sáb** | **Guion 6** (nuevo) | Así lo hice con Claude | `HORARIO` | Analítica + mejor hora para publicar |
| **Sem 2 · Dom** | **Guion 7** (nuevo) | Así lo hice con Claude | `SEGUIR` | Cierre de ciclo pidiendo follow antes del link |

---

## Recursos necesarios por palabra

Cada palabra debe tener su campaña activa en `/instagram` (con enlace `/r/<slug>` en **Archivos** apuntando a una página/PDF real):

### Palabras de los 10 guiones nuevos
1. **`EMBUDO`** — Guía + plantilla SQL del trigger `ig_sync_contact_to_crm` (cuidando usar `AFTER` y no `BEFORE`) + función `ig_funnel_stats()`.
2. **`DESPEGUE`** — Guía + prompt para Claude de la alerta de despegue (`checkDespegue()` ≥ 1,5× mediana de 20 Reels + notificación WhatsApp con Evolution API).
3. **`HORARIO`** — Guía + fórmula de `computeBestTimes()` (40 % conectados, 35 % comentarios, 25 % alcance) + SQL de `ig_activity_heatmap`.
4. **`SEGUIR`** — Guía del flujo de 2 pasos "seguir antes de recibir" (`requiere_seguir`, quick reply y consulta a `is_user_follow_business` con fallback si devuelve `null`).
5. **`META`** — Guía / checklist de errores reales verificados en Meta Graph API v21.0 (token `EAA...` → `graph.facebook.com`, ventana de 7 días, prohibición de `template: generic` en Private Reply `#100`).
6. **`ESCUDO`** — Plantilla SQL de idempotencia (`ig_comment_events` con `UNIQUE (comment_id)` + manejo de código `23505` + nota de trigger `AFTER` en `upsert`).
7. **`STACK`** — Guía mapa del stack $0/mes (qué herramienta reemplaza a ManyChat, scheduler, Linktree y analítica usando Supabase + dominio propio `/r/` + `agy -p` / Remotion).
8. **`LOTE`** — Guía de arquitectura del lote automático semanal (tarea de Windows + `auto-lote.mjs` + `agy -p` + Remotion `auto.tsx` + botón **Aprobar**).
9. **`RETO`** — Guía de inicio rápido "Tu bot en 48 h" (las 4 tablas SQL mínimas + checklist de Meta Developers + prompt inicial para darle a Claude).
10. **`CRITERIO`** — Guía corta "Reglas deterministas vs IA en automatizaciones" (cuándo usar `match_mode` + `ig_respuestas`, y cómo implementar la pausa automática de 12 h / `[HUMANO]`).

### Palabras de los 3 guiones existentes (referencia)
- **`BOT`** — Guía paso a paso del Comment-to-DM nativo en Supabase sin ManyChat.
- **`VIDEO`** — Guía de cómo armar el pipeline automático semanal con Radar + `agy -p` + Remotion.
- **`RADAR`** — Guía del Radar de competencia con `business_discovery` y score por mediana.
