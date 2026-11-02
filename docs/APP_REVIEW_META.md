# Kit App Review de Meta — Nexabis Technologies (App ID 1508603997825384)

Objetivo: pasar a **Advanced Access** para que los DMs automáticos y los webhooks en tiempo real
funcionen con cualquier persona (hoy solo funcionan con testers de la app).

---

## 1. Configuración básica de la app (App Dashboard → Configuración → Básica)

| Campo | Valor |
| :--- | :--- |
| Nombre visible | Nexabis Technologies |
| Correo de contacto | contacto@nexabistech.com |
| URL de la política de privacidad | `https://ecosistema.nexabistech.com/privacidad` |
| URL de las condiciones del servicio | `https://ecosistema.nexabistech.com/terminos` |
| Instrucciones / URL de eliminación de datos | `https://ecosistema.nexabistech.com/eliminar-datos` |
| Callback de eliminación de datos (si lo pide como URL de callback) | `https://htwuamsbzaznmwuypflt.supabase.co/functions/v1/instagram-webhook` |
| Callback de desautorización | `https://htwuamsbzaznmwuypflt.supabase.co/functions/v1/instagram-webhook?deauthorize=1` |
| Ícono de la app | 1024×1024 PNG (logo Nexabis) |
| Categoría | Empresa y páginas / Business and Pages |
| Dominios de la app | `ecosistema.nexabistech.com` |

Si Meta pide el callback de eliminación como "Data Deletion Request URL", usa la URL de la Edge Function: recibe el
`signed_request`, borra los datos y responde `{ url, confirmation_code }` con el link de estado
`https://ecosistema.nexabistech.com/eliminar-datos?codigo=XXXX`.

**Verificación del negocio** (App Dashboard → Verificación / Business Manager → Centro de seguridad): si aparece como
requisito para Advanced Access, se puede hacer como persona natural con actividad. Documentos que suelen aceptar: inicio de
actividades del SII, una boleta/factura emitida o una cuenta de servicios a tu nombre con la misma dirección. El nombre y la
dirección deben coincidir exactamente en todos los documentos.

---

## 2. Permisos a solicitar y justificación (pegar en inglés)

> Pide solo estos. Pedir permisos que la app no usa es la causa más común de rechazo.

### `instagram_basic`
Our app reads the profile (username, ID) and the list of posts and reels of our own Instagram Business account
(@cris.nexabis) so the account owner can choose, inside our dashboard, which posts an auto-reply campaign applies to. We only
access our own account's data.

### `instagram_manage_comments`
When a person comments a keyword (for example "GUIDE") on one of our own posts or reels, our app reads that comment to detect
the keyword, sends the person a single private reply with the information they requested, and posts a short public reply on
the comment ("I sent you a DM!"). We only read and reply to comments on media owned by our account. Comments are stored only to
avoid duplicated replies and to show the account owner a history in the dashboard.

### `instagram_manage_messages`
We use the Instagram Messaging API to (1) send the private reply to the person who commented a keyword, (2) receive their reply
when they tap the quick-reply button ("Yes, send it" / "I already follow you") and then deliver the requested link or PDF inside
the 24-hour messaging window, and (3) let the account owner see these conversations in the dashboard. We never message people who
have not interacted with our account first. Users can send "STOP" to stop automated messages or "DELETE MY DATA" to have their
data erased immediately.

### `instagram_content_publish`
The account owner uses our dashboard to schedule reels, image posts and stories for our own Instagram account. At the scheduled
time our server creates the media container and publishes it with the Content Publishing API. We only publish to our own account.

### `instagram_manage_insights`
The account owner views, inside our dashboard, the reach, views, saves, shares and profile visits of our own posts and reels,
and the account's 28-day reach and followers, to decide which content to promote. We only read insights of our own account.

### `pages_show_list` y `pages_read_engagement`
Our Instagram Business account is linked to our Facebook Page ("Cris Automatización, DEV & IA"). These permissions are required to
obtain the Page access token that the Instagram Graph API uses for that linked account. We do not read or display Page content.

### `pages_manage_metadata`
Required to subscribe our Facebook Page / Instagram account to webhooks (comments, messages, messaging_postbacks) so we receive
new comments and message replies in real time.

### `business_management` (solo si Meta lo exige para ver la página)
Only needed because our Page and Instagram account are managed inside a Business portfolio; used exclusively to access our own
assets. Si la app funciona sin él, **no lo pidas**.

---

## 3. Guion del screencast (1 video por permiso o 1 video completo, 2–4 min)

Graba la pantalla en 1080p, con el idioma de la interfaz en **inglés** si puedes (o agrega subtítulos en inglés). Muestra el
cursor y no cortes entre pasos.

1. **Login**: abre `https://ecosistema.nexabistech.com/login`, inicia sesión y entra a `/instagram`.
2. **Conexión** (instagram_basic, pages_*): muestra la tarjeta "Conectado como @cris.nexabis" y presiona "Elegir reels" en una
   campaña para que se vean las miniaturas de tus publicaciones.
3. **Crear campaña** (instagram_manage_comments / messages): crea una campaña con palabra clave `GUIA`, modo dos pasos, mensaje y
   link a un PDF de la pestaña Archivos (`ecosistema.nexabistech.com/r/...`). Guarda y actívala.
4. **Flujo real** (con el celular de una cuenta tester visible en pantalla o en un segundo video):
   - Desde la cuenta tester, comenta `GUIA` en el reel.
   - Muestra que llega el DM privado con el botón y la respuesta pública en el comentario.
   - Toca el botón y muestra que llega el link; ábrelo y muestra que se descarga el PDF.
   - Vuelve al panel y muestra el comentario en "Actividad" y la persona en "Leads".
5. **STOP / borrar datos**: desde la cuenta tester escribe `STOP` y muestra la confirmación; luego `BORRAR MIS DATOS` y muestra el
   código de confirmación y la página `/eliminar-datos?codigo=...`.
6. **Publicación programada** (instagram_content_publish): en la pestaña "Contenido" sube una imagen JPG, presiona "Ahora" y
   muestra que aparece publicada en el perfil de Instagram (abre el link "Ver en Instagram").
7. **Webhooks** (pages_manage_metadata): muestra el botón de re-suscribir webhooks y el estado "suscrito".
8. Termina mostrando las páginas `/privacidad`, `/terminos` y `/eliminar-datos`.

---

## 4. Instrucciones para el revisor (campo "App Verification / Reviewer instructions")

```
1. Go to https://ecosistema.nexabistech.com/login and sign in with:
   Email: <usuario-revisor@...>   Password: <contraseña>
2. Open the "Instagram" section (/instagram). The connected account is @cris.nexabis.
3. From any Instagram account, comment the word GUIA on the most recent reel of @cris.nexabis.
   Within 1-2 minutes you will receive a direct message with a button; tap it to receive the link.
4. Send "STOP" to stop automated messages, or "DELETE MY DATA" to erase your data.
5. Scheduled publishing can be tested in the "Contenido" tab with any JPG image (button "Ahora").
```

Antes de enviar: crea un usuario de prueba para el revisor en el ecosistema (rol miembro, sin acceso a datos sensibles del CRM si es
posible) y deja **una campaña activa con la palabra GUIA** sobre el reel más reciente.

---

## 5. Checklist antes de enviar

- [ ] Páginas `/privacidad`, `/terminos`, `/eliminar-datos` abren sin login.
- [ ] URLs cargadas en Configuración → Básica; ícono y categoría completos.
- [ ] Verificación del negocio completa (si la pide).
- [ ] Campaña de demo `GUIA` activa y probada con una cuenta tester.
- [ ] Usuario revisor creado y probado en una ventana de incógnito.
- [ ] Un video por permiso (o uno completo) mostrando el uso exacto.
- [ ] Solo los permisos de la sección 2.
- [ ] Al aprobar: pasar la app a modo **Live** (en vivo) y volver a suscribir webhooks desde el panel.

Si rechazan: Meta indica el permiso y el motivo. Corrige solo eso, regraba ese video y reenvía.
