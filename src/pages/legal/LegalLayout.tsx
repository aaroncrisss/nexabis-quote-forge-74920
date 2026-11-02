import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

export const LEGAL = {
  marca: "Nexabis Technologies",
  sitio: "https://ecosistema.nexabistech.com",
  email: "contacto@nexabistech.com",
  instagram: "@cris.nexabis",
  pais: "Chile",
  actualizado: "1 de noviembre de 2026",
  actualizadoEn: "November 1, 2026",
};

/** Contenedor común de las páginas legales (públicas, sin login). */
export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · ${LEGAL.marca}`;
  }, [title]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <a href="https://nexabistech.com" className="font-semibold">{LEGAL.marca}</a>
          <nav className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/privacidad" className="hover:text-foreground">Privacidad</Link>
            <Link to="/terminos" className="hover:text-foreground">Términos</Link>
            <Link to="/eliminar-datos" className="hover:text-foreground">Eliminar datos</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6 text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h3]:font-semibold [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_a]:text-primary [&_a:hover]:underline">
        {children}
      </main>
      <footer className="border-t border-border/60">
        <div className="max-w-3xl mx-auto px-5 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {LEGAL.marca} · {LEGAL.pais} · <a href={`mailto:${LEGAL.email}`} className="hover:underline">{LEGAL.email}</a>
        </div>
      </footer>
    </div>
  );
}
