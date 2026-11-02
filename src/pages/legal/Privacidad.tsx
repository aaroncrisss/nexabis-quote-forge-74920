import { LegalLayout, LEGAL } from "./LegalLayout";

export default function Privacidad() {
  return (
    <LegalLayout title="Política de privacidad">
      <h1>Política de privacidad</h1>
      <p>Última actualización: {LEGAL.actualizado}</p>

      <p>
        Esta política explica cómo {LEGAL.marca} ("nosotros") trata los datos personales cuando interactúas con nuestra cuenta de
        Instagram {LEGAL.instagram}, con nuestros links y con la plataforma {LEGAL.sitio}. Aplicamos la Ley N° 19.628 sobre
        Protección de la Vida Privada de Chile y, en lo que corresponda, la Ley N° 21.719.
      </p>

      <h2>1. Quién es responsable</h2>
      <p>
        {LEGAL.marca}, {LEGAL.pais}. Contacto para cualquier tema de privacidad: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li><b>Datos públicos de Instagram</b>: tu nombre de usuario y el identificador que Instagram asigna a tu cuenta para nuestra app.</li>
        <li><b>Comentarios</b> que escribes en nuestras publicaciones y reels.</li>
        <li><b>Mensajes directos</b> que intercambias con nuestra cuenta.</li>
        <li><b>Si sigues nuestra cuenta</b> (solo cuando una campaña lo pide y tú tocas el botón para confirmarlo).</li>
        <li><b>Clics</b> en los links que te enviamos (fecha y cantidad).</li>
        <li>Si decides avanzar con un servicio: los datos de contacto que tú mismo nos entregues (nombre, correo, teléfono, empresa).</li>
      </ul>
      <p>No accedemos a tu contraseña, a tus mensajes con otras personas ni a información que no compartas con nuestra cuenta.</p>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Responder automáticamente cuando comentas una palabra clave y enviarte por mensaje directo la información o el material que pediste.</li>
        <li>Responder tus consultas y darte seguimiento comercial si te interesan nuestros servicios.</li>
        <li>Medir qué publicaciones y campañas funcionan mejor (estadísticas agregadas).</li>
        <li>Programar y publicar contenido en nuestra propia cuenta de Instagram.</li>
      </ul>
      <p>
        La base de tratamiento es tu consentimiento: tú inicias la interacción al comentar o escribirnos. No enviamos mensajes a personas
        que no hayan interactuado antes con nuestra cuenta.
      </p>

      <h2>4. Con quién los compartimos</h2>
      <p>No vendemos ni arrendamos tus datos. Solo los procesan los proveedores necesarios para operar el servicio:</p>
      <ul>
        <li><b>Meta Platforms</b> (Instagram), plataforma donde ocurre la conversación.</li>
        <li><b>Supabase</b>, base de datos y servidores donde guardamos la información de forma segura.</li>
        <li><b>Hostinger</b>, alojamiento de este sitio web.</li>
      </ul>
      <p>Estos proveedores pueden almacenar datos fuera de Chile, con medidas de seguridad propias.</p>

      <h2>5. Cuánto tiempo los guardamos</h2>
      <p>
        Mientras exista una conversación o relación comercial activa, o hasta que pidas eliminarlos. Los antecedentes necesarios por
        obligaciones legales o tributarias (por ejemplo, facturas) se conservan el plazo que exige la ley.
      </p>

      <h2>6. Seguridad</h2>
      <p>
        Usamos conexiones cifradas (HTTPS), control de acceso por roles y credenciales guardadas como secretos del servidor. Solo el
        equipo de {LEGAL.marca} puede ver la información.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes pedir acceso, rectificación, eliminación u oposición al tratamiento de tus datos en cualquier momento. Revisa cómo en{" "}
        <a href="/eliminar-datos">Eliminar mis datos</a> o escríbenos a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Responderemos
        dentro de 30 días.
      </p>

      <h2>8. Menores de edad</h2>
      <p>Nuestros servicios están dirigidos a negocios y personas mayores de 18 años.</p>

      <h2>9. Cambios</h2>
      <p>Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha de actualización.</p>

      <hr className="my-10 border-border/60" />

      <h1>Privacy Policy (English)</h1>
      <p>Last updated: {LEGAL.actualizadoEn}</p>
      <p>
        {LEGAL.marca} ("we") operates the Instagram account {LEGAL.instagram} and the platform {LEGAL.sitio}. This policy explains how we
        handle personal data when you interact with us.
      </p>
      <h3>Data we process</h3>
      <ul>
        <li>Your Instagram username and the Instagram-scoped ID assigned to your account for our app.</li>
        <li>Comments you post on our posts and reels, and direct messages you exchange with our account.</li>
        <li>Whether you follow our account (only when a campaign requires it and you tap the button to confirm).</li>
        <li>Clicks on links we send you, and any contact details you voluntarily provide.</li>
      </ul>
      <h3>How we use it</h3>
      <ul>
        <li>To automatically reply to comments containing a keyword and send you, via direct message, the information you requested.</li>
        <li>To answer your questions and follow up commercially if you are interested in our services.</li>
        <li>To measure campaign performance (aggregated statistics) and to publish content on our own Instagram account.</li>
      </ul>
      <p>We only message people who first interacted with our account. We never sell or rent personal data.</p>
      <h3>Processors</h3>
      <p>Meta Platforms (Instagram), Supabase (database and servers) and Hostinger (web hosting). Data may be stored outside Chile.</p>
      <h3>Retention and your rights</h3>
      <p>
        We keep data while there is an active conversation or business relationship, or until you request deletion. You may request
        access, correction or deletion at any time at <a href="/eliminar-datos">Data deletion</a> or by email at{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. We respond within 30 days.
      </p>
      <h3>Contact</h3>
      <p>{LEGAL.marca}, {LEGAL.pais} · <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></p>
    </LegalLayout>
  );
}
