import type { Pillar } from "./audit";

/** Audits a visitor ran, kept in their browser so a re-check can show what changed. */
export interface AuditSnapshot { host: string; at: string; score: number; pillars: Record<Pillar, number> }

const KEY = "efy_audit_history";
const MAX_PER_HOST = 12;

export const hostOf = (url: string) => { try { return new URL(url).host.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };

export function loadHistory(): AuditSnapshot[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}

/** Snapshots for one site, oldest first. */
export const historyFor = (all: AuditSnapshot[], host: string) => all.filter((s) => s.host === host).sort((a, b) => a.at.localeCompare(b.at));

/** Add a snapshot (pure): returns the new list, capped per site. */
export function addSnapshot(all: AuditSnapshot[], snap: AuditSnapshot): AuditSnapshot[] {
  const mine = historyFor(all, snap.host).filter((s) => s.at !== snap.at);
  const kept = [...mine, snap].slice(-MAX_PER_HOST);
  return [...all.filter((s) => s.host !== snap.host), ...kept];
}

export function recordAudit(snap: AuditSnapshot): AuditSnapshot | null {
  const all = loadHistory();
  const prev = historyFor(all, snap.host).at(-1) ?? null;
  try { localStorage.setItem(KEY, JSON.stringify(addSnapshot(all, snap))); } catch { /* storage blocked */ }
  return prev;
}

export interface AuditDelta { score: number; pillars: Partial<Record<Pillar, number>>; days: number }
export function compare(prev: AuditSnapshot, now: AuditSnapshot): AuditDelta {
  const pillars: Partial<Record<Pillar, number>> = {};
  for (const k of Object.keys(now.pillars) as Pillar[]) if (typeof prev.pillars?.[k] === "number") pillars[k] = now.pillars[k] - prev.pillars[k];
  const days = Math.max(0, Math.round((new Date(now.at).getTime() - new Date(prev.at).getTime()) / 864e5));
  return { score: now.score - prev.score, pillars, days };
}

/** Who leads on each pillar in a side-by-side comparison. */
export function headToHead(a: Record<Pillar, number>, b: Record<Pillar, number>) {
  const keys = Object.keys(a) as Pillar[];
  const rows = keys.map((k) => ({ pillar: k, a: a[k], b: b[k] ?? 0, lead: a[k] === (b[k] ?? 0) ? "tie" as const : a[k] > (b[k] ?? 0) ? "a" as const : "b" as const }));
  return { rows, aWins: rows.filter((r) => r.lead === "a").length, bWins: rows.filter((r) => r.lead === "b").length };
}
