import { useCallback, useEffect, useState } from "react";
import { supabaseCRM } from "@/integrations/supabase/crm-client";

export const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export type Slot = { dow: number; hour: number; score: number };

export type BestTimes = {
  /** score 0..1 por [dow][hour] */
  grid: number[][];
  top: Slot[];
  sources: { comentarios: number; audiencia: boolean; posts: number };
};

type HeatRow = { dow: number; hora: number; n: number };
type PostRow = { publicado_at: string | null; reach: number | null; interactions: number | null };

const empty = () => Array.from({ length: 7 }, () => Array(24).fill(0));

const normalize = (g: number[][]) => {
  const max = Math.max(0, ...g.flat());
  return max ? g.map((r) => r.map((v) => v / max)) : g;
};

/**
 * Mejores horarios para publicar (hora local del navegador = Chile):
 *   40% seguidores conectados (Meta online_followers, si existe)
 *   35% cuándo comenta tu audiencia (ig_comment_events, 90 días)
 *   25% rendimiento de tus posts según la hora en que los publicaste (alcance)
 * Los pesos se reparten entre las fuentes disponibles.
 */
export function computeBestTimes(
  heat: HeatRow[],
  audiencia: { horas: number[] | null; dias: number[] | null },
  posts: PostRow[],
): BestTimes {
  const comments = empty();
  let nComments = 0;
  for (const r of heat) {
    // suaviza a la hora anterior: se publica un poco antes de que la gente llegue
    comments[r.dow][r.hora] += r.n;
    comments[r.dow][(r.hora + 23) % 24] += r.n * 0.5;
    nComments += r.n;
  }

  const aud = empty();
  const hasAud = !!audiencia.horas?.some((v) => v > 0);
  if (hasAud) {
    const dias = audiencia.dias?.some((v) => v > 0) ? audiencia.dias! : Array(7).fill(1);
    for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) aud[d][h] = (audiencia.horas![h] ?? 0) * (dias[d] || 1);
  }

  const perf = empty();
  const perfN = empty();
  const withReach = posts.filter((p) => p.publicado_at && (p.reach ?? p.interactions) != null);
  for (const p of withReach) {
    const d = new Date(p.publicado_at!);
    const v = p.reach ?? (p.interactions ?? 0) * 10;
    // reparte en ±1 h para no depender de un solo post
    for (const dh of [-1, 0, 1]) {
      const h = (d.getHours() + dh + 24) % 24;
      perf[d.getDay()][h] += dh === 0 ? v : v * 0.4;
      perfN[d.getDay()][h] += dh === 0 ? 1 : 0.4;
    }
  }
  const perfAvg = perf.map((r, d) => r.map((v, h) => (perfN[d][h] ? v / perfN[d][h] : 0)));

  const sources: [number[][], number][] = [];
  if (hasAud) sources.push([normalize(aud), 0.4]);
  if (nComments >= 5) sources.push([normalize(comments), 0.35]);
  if (withReach.length >= 3) sources.push([normalize(perfAvg), 0.25]);
  // Sin datos: horarios típicos de alta actividad en Instagram (Chile)
  if (!sources.length) {
    const g = empty();
    for (let d = 0; d < 7; d++)
      for (let h = 0; h < 24; h++) g[d][h] = h >= 19 && h <= 22 ? 1 : h >= 12 && h <= 14 ? 0.7 : h >= 8 && h <= 9 ? 0.5 : 0.1;
    sources.push([g, 1]);
  }
  const wsum = sources.reduce((a, [, w]) => a + w, 0);
  const grid = empty().map((r, d) => r.map((_, h) => sources.reduce((a, [g, w]) => a + g[d][h] * (w / wsum), 0)));

  // Top 3 en días distintos (más útil para planificar la semana)
  const all: Slot[] = [];
  grid.forEach((r, d) => r.forEach((score, h) => all.push({ dow: d, hour: h, score })));
  all.sort((a, b) => b.score - a.score);
  const top: Slot[] = [];
  for (const s of all) {
    if (top.length >= 3) break;
    if (s.hour < 7) continue; // nunca de madrugada
    if (top.some((t) => t.dow === s.dow)) continue;
    top.push(s);
  }
  return { grid, top, sources: { comentarios: nComments, audiencia: hasAud, posts: withReach.length } };
}

/** Próxima fecha (desde ahora + 15 min) que cae en ese día/hora. */
export function nextOccurrence(s: { dow: number; hour: number }): Date {
  const d = new Date(Date.now() + 15 * 60_000);
  const res = new Date(d);
  res.setMinutes(0, 0, 0);
  res.setHours(s.hour);
  let add = (s.dow - d.getDay() + 7) % 7;
  if (add === 0 && res.getTime() <= d.getTime()) add = 7;
  res.setDate(res.getDate() + add);
  return res;
}

export const slotLabel = (s: { dow: number; hour: number }) => `${DIAS[s.dow]} ${String(s.hour).padStart(2, "0")}:00`;

/** Carga los datos y calcula los mejores horarios. */
export function useBestTimes(enabled = true) {
  const [best, setBest] = useState<BestTimes | null>(null);
  const reload = useCallback(async () => {
    if (!enabled) return;
    const [hm, st, ps] = await Promise.all([
      supabaseCRM.rpc("ig_activity_heatmap", { p_dias: 90 }),
      supabaseCRM.from("ig_settings").select("audiencia_horas, audiencia_dias").eq("id", 1).maybeSingle(),
      supabaseCRM.from("ig_media_stats").select("publicado_at, reach, interactions"),
    ]);
    if (hm.error && st.error) return setBest(null); // migración no aplicada
    setBest(
      computeBestTimes(
        (hm.data as HeatRow[]) ?? [],
        { horas: (st.data?.audiencia_horas as number[] | null) ?? null, dias: (st.data?.audiencia_dias as number[] | null) ?? null },
        (ps.data as PostRow[]) ?? [],
      ),
    );
  }, [enabled]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { best, reload };
}
