import { useSearchParams } from "react-router-dom";
import { LegalLayout, LEGAL } from "./LegalLayout";

export default function EliminarDatos() {
  const [params] = useSearchParams();
  const codigo = params.get("codigo") ?? params.get("code");

  return (
    <LegalLayout title="Eliminar mis datos">
      {codigo && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm">
          <p className="font-semibold text-foreground">Solicitud de eliminación recibida y procesada</p>
          <p>
            Código de confirmación: <code className="text-foreground">{codigo}</code>. Eliminamos los datos asociados a tu cuenta de
            Instagram en nuestros sistemas. Si tienes dudas, escríbenos a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> indicando
            este código.
          </p>
          <p className="mt-2">
            Data deletion request received and processed. Confirmation code: <code className="text-foreground">{codigo}</code>.
          </p>
        </div>
      )}

      <h1>Eliminar mis datos</h1>
      <p>
        Puedes pedir que eliminemos los datos que guardamos sobre ti por interactuar con {LEGAL.instagram} (usuario, comentarios,
        mensajes y clics). Tienes tres formas:
      </p>

      <h2>1. Por mensaje directo (inmediato)</h2>
      <p>
        Escríbenos por Instagram a {LEGAL.instagram} el mensaje <b>BORRAR MIS DATOS</b>. El sistema elimina tus datos automáticamente y
        te confirma por el mismo chat. Dejaremos de enviarte mensajes automáticos.
      </p>

      <h2>2. Quitando el acceso desde Instagram</h2>
      <ul>
        <li>En Instagram ve a <b>Configuración → Apps y sitios web</b> (o <b>Centro de cuentas → Tu información y permisos</b>).</li>
        <li>Busca <b>{LEGAL.marca}</b> y elimina el acceso.</li>
        <li>Meta nos avisa y borramos tus datos automáticamente. Puedes revisar el estado con el código que te entrega Meta.</li>
      </ul>

      <h2>3. Por correo</h2>
      <p>
        Escribe a <a href={`mailto:${LEGAL.email}?subject=Eliminar%20mis%20datos`}>{LEGAL.email}</a> con el asunto "Eliminar mis datos"
        e indica tu usuario de Instagram. Lo procesamos dentro de 30 días.
      </p>

      <h2>Qué se elimina</h2>
      <ul>
        <li>Tu ficha de contacto de Instagram, el historial de mensajes y los links personalizados que te enviamos.</li>
        <li>Tu usuario y el texto de tus comentarios en nuestros registros (quedan solo estadísticas anónimas).</li>
      </ul>
      <p>
        Si ya eres cliente, conservamos los antecedentes que la ley exige (por ejemplo, facturas o contratos) por el plazo legal.
      </p>

      <hr className="my-10 border-border/60" />

      <h1>Data deletion instructions (English)</h1>
      <ul>
        <li><b>Direct message:</b> send "BORRAR MIS DATOS" (or "DELETE MY DATA") to {LEGAL.instagram} on Instagram. Your data is deleted automatically and you receive a confirmation.</li>
        <li><b>Remove the app:</b> in Instagram go to Settings → Apps and websites, find {LEGAL.marca} and remove it. Meta notifies us and we delete your data automatically.</li>
        <li><b>Email:</b> write to <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> with your Instagram username. We process requests within 30 days.</li>
      </ul>
      <p>
        We delete your contact record, message history and personalized links, and anonymize your comments. Records required by law
        (e.g. invoices) are kept for the legally required period.
      </p>
    </LegalLayout>
  );
}
