import { LegalLayout, LEGAL } from "./LegalLayout";

export default function Terminos() {
  return (
    <LegalLayout title="Términos y condiciones">
      <h1>Términos y condiciones</h1>
      <p>Última actualización: {LEGAL.actualizado}</p>

      <h2>1. Qué cubren</h2>
      <p>
        Estos términos regulan el uso de los mensajes automáticos de nuestra cuenta de Instagram {LEGAL.instagram}, de los links y
        archivos que compartimos y de la plataforma {LEGAL.sitio}, operados por {LEGAL.marca} ({LEGAL.pais}).
      </p>

      <h2>2. Mensajes automáticos</h2>
      <ul>
        <li>Si comentas una palabra clave en nuestras publicaciones, podemos responderte automáticamente por mensaje directo y públicamente en el comentario.</li>
        <li>Algunas campañas pueden pedirte que sigas la cuenta para recibir el material. Seguirnos es opcional y puedes dejar de hacerlo cuando quieras.</li>
        <li>Si no quieres recibir más mensajes, escribe "STOP" o pídelo por mensaje directo y dejaremos de contactarte.</li>
      </ul>

      <h2>3. Material y links</h2>
      <p>
        Las guías, PDF y demás material que compartimos son informativos y para uso personal. No puedes revenderlos ni publicarlos como
        propios sin autorización. Los links pueden dejar de estar disponibles en cualquier momento.
      </p>

      <h2>4. Servicios y cotizaciones</h2>
      <p>
        La información enviada por mensaje no constituye una oferta vinculante. Cada servicio se cotiza según su alcance y se rige por la
        cotización o el contrato que se firme.
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        Hacemos lo posible para que el servicio funcione sin interrupciones, pero depende de plataformas de terceros (como Instagram) que
        pueden fallar o cambiar sus reglas. No respondemos por esas interrupciones.
      </p>

      <h2>6. Privacidad</h2>
      <p>El tratamiento de tus datos se describe en nuestra <a href="/privacidad">Política de privacidad</a>.</p>

      <h2>7. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República de Chile.</p>

      <h2>8. Contacto</h2>
      <p><a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></p>

      <hr className="my-10 border-border/60" />

      <h1>Terms of Service (English)</h1>
      <p>Last updated: {LEGAL.actualizadoEn}</p>
      <ul>
        <li>If you comment a keyword on our posts, we may automatically reply to you via direct message and publicly on your comment.</li>
        <li>Some campaigns may ask you to follow our account to receive the material. Following is optional.</li>
        <li>Reply "STOP" at any time and we will stop messaging you.</li>
        <li>Shared guides and files are for personal, informational use only. Quotes sent by message are not binding offers.</li>
        <li>The service relies on third-party platforms (such as Instagram) and may be interrupted by them.</li>
        <li>Personal data is handled as described in our <a href="/privacidad">Privacy Policy</a>. These terms are governed by the laws of Chile.</li>
      </ul>
      <p>Contact: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></p>
    </LegalLayout>
  );
}
