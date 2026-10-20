import { industryById, type Industry } from "./taxonomy";

/**
 * Transparent trend score (0–100), stored with each feed item so the dashboard can show why a
 * topic was picked:
 *   recency   0–40  40 if published in the last 24h, falling linearly to 0 at 7 days
 *   trust     0–30  10 per source trust level (1–3)
 *   relevance 0–20  4 per industry keyword found in the title or summary (max 5)
 *   weight    0–10  2 per industry weight point (e-commerce is 5 → 10)
 * Novelty against already-published titles is applied when picking, not here.
 */
export interface ScoreDetail { recency: number; trust: number; relevance: number; weight: number; matched: string[] }

export function scoreItem(item: { title: string; summary: string; published_at: string | null }, industry: Industry, trust: number, now = Date.now()): { score: number; detail: ScoreDetail; keywords: string[] } {
  const ageH = item.published_at ? Math.max(0, (now - Date.parse(item.published_at)) / 3_600_000) : 24 * 5;
  const recency = ageH <= 24 ? 40 : Math.max(0, Math.round(40 * (1 - (ageH - 24) / (24 * 6))));
  const hay = ` ${`${item.title} ${item.summary}`.toLowerCase().replace(/[^a-z0-9\s-]/g, " ")} `;
  const matched = industry.keywords.filter((k) => hay.includes(` ${k} `) || hay.includes(` ${k}s `)).slice(0, 5);
  const relevance = Math.min(20, matched.length * 4);
  const t = Math.min(30, Math.max(10, trust * 10));
  const weight = Math.min(10, industry.weight * 2);
  return { score: recency + t + relevance + weight, detail: { recency, trust: t, relevance, weight, matched }, keywords: matched };
}

const STOP = new Set("a an and are as at be but by for from has have how in into is it its new of on or our that the their this to was what when why will with you your we us vs".split(" "));
export const tokens = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));

/** Jaccard similarity of meaningful words (0–1). */
export function similarity(a: string, b: string): number {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Stable fingerprint of a title, used as a database-unique key against near-identical articles. */
export const titleFingerprint = (title: string) => [...tokens(title)].sort().slice(0, 12).join("-") || title.toLowerCase();

export const industryLabel = (id: string) => industryById(id)?.label ?? id;
