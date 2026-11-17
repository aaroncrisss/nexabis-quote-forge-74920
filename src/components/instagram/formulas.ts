/**
 * Fórmulas virales detectadas por texto (sin IA). Misma lista que `detectFormulas` en la Edge Function.
 * Sirve para comparar qué fórmula funciona en el nicho (Radar) y en tu propia cuenta (Laboratorio).
 */
export const FORMULAS: [string, RegExp][] = [
  ["comenta_palabra", /coment[aá]\s*(la palabra\s*)?["“«']?[A-ZÁÉÍÓÚÑ]{3,}/],
  ["gratis", /gratis|free|open source|c[oó]digo abierto|sin pagar/i],
  ["github_repo", /github|repositorio|\brepo\b|estrellas/i],
  ["rubro", /^\W*si (eres|tienes|trabajas)/i],
  ["gancho_tu", /^\W*(tu|tus|te|ya puedes|deja de)\b/i],
  ["lista_numero", /^\W*\d+\s/],
  ["pov", /^\W*pov\b/i],
  ["pregunta", /^\W*¿/],
  ["mandaselo", /m[aá]nd[aá]selo|comp[aá]rtelo|etiqueta a/i],
  ["guardalo", /gu[aá]rd[aá]lo/i],
  ["noticia", /acaba de|lanz[oó]|nuevo modelo|ayer|hoy sali[oó]|hoy sale|se filtr/i],
  ["historia_personal", /^\W*(yo |mi |me |hace \d|cuando yo|llevo )/i],
  ["desafio", /prueba (esto|ahora)|haz esta prueba|abre tu|cuenta (tus|los)|comenta tu (n[uú]mero|tarea)/i],
];

export const detectFormulas = (caption: string | null | undefined) => {
  const c = (caption ?? "").trim();
  return FORMULAS.filter(([, re]) => re.test(c)).map(([k]) => k);
};

/** Métricas que Instagram confirmó que pesan (Mosseri, 2025): visualización, me gusta por alcance y envíos por alcance. */
export type PostStat = {
  media_id: string;
  caption: string | null;
  permalink: string | null;
  publicado_at: string | null;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saved: number | null;
  avg_watch_ms: number | null;
};

/** Puntaje viral 0–100: envíos/alcance (40 %), guardados+comentarios/alcance (25 %), me gusta/alcance (15 %), visualización (20 %). */
export const viralScore = (p: PostStat) => {
  const r = Math.max(1, Number(p.reach ?? 0));
  const send = Number(p.shares ?? 0) / r; // 5 % ya es excelente
  const keep = (Number(p.saved ?? 0) + Number(p.comments ?? 0)) / r; // 5 %
  const like = Number(p.likes ?? 0) / r; // 10 %
  const watch = Number(p.avg_watch_ms ?? 0) / 1000; // 10 s
  const s = 40 * Math.min(1, send / 0.05) + 25 * Math.min(1, keep / 0.05) + 15 * Math.min(1, like / 0.1) + 20 * Math.min(1, watch / 10);
  return Math.round(s);
};
