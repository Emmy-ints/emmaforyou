/**
 * Pure decision logic for the agent team (no I/O), shared by the worker and unit tests:
 * relevance scoring and routing, link sanitising, duplicate fingerprints, safety screens.
 */

export interface AgentLite { id: string; slug: string; name: string; kind: "specialist" | "general"; keywords: string[]; topics: string[]; enabled: boolean }

const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9@#+.\- ]+/g, " ").replace(/\s+/g, " ")} `;

/** Score each enabled agent for a piece of community text. Multi-word keywords count more; title and tags weigh double. */
export function scoreAgents(agents: AgentLite[], text: { title?: string | null; body: string; tags?: string[]; topic?: string | null }): { agent: AgentLite; score: number; hits: string[] }[] {
  const head = norm(`${text.title ?? ""} ${(text.tags ?? []).join(" ")}`);
  const body = norm(text.body);
  return agents.filter((a) => a.enabled).map((agent) => {
    let score = 0; const hits: string[] = [];
    for (const raw of agent.keywords) {
      const k = raw.toLowerCase().trim(); if (!k) continue;
      const re = new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
      const inHead = (head.match(re) ?? []).length, inBody = Math.min((body.match(re) ?? []).length, 3);
      if (inHead || inBody) { const w = k.includes(" ") ? 2 : 1; score += w * (inHead * 2 + inBody); hits.push(k); }
    }
    if (text.topic && agent.topics.includes(text.topic)) score += 1.5;
    if (agent.kind === "general") score = Math.max(score * 0.5, 0.5); // the coordinator is the fallback, not the default
    return { agent, score: Math.round(score * 100) / 100, hits };
  }).sort((a, b) => b.score - a.score);
}

/** Candidates for the coordinator: up to 3 specialists with a real signal, plus the general agent. */
export function candidates(scored: ReturnType<typeof scoreAgents>): { primary: AgentLite; list: AgentLite[]; confident: boolean } {
  const general = scored.find((s) => s.agent.kind === "general")?.agent;
  const specialists = scored.filter((s) => s.agent.kind === "specialist" && s.score >= 1).slice(0, 3);
  const list = [...specialists.map((s) => s.agent), ...(general ? [general] : [])];
  const top = specialists[0];
  const confident = Boolean(top && (top.score >= 3 || (specialists[1] ? top.score >= specialists[1].score * 1.6 : top.score >= 2)));
  const primary = top?.agent ?? general ?? scored[0]?.agent;
  return { primary: primary!, list: list.length ? list : scored.slice(0, 1).map((s) => s.agent), confident };
}

/** Keep only links to real pages: internal paths that exist and the site's own domain. Unknown links are removed (text kept). */
export function sanitizeLinks(text: string, allowed: Set<string>, siteHost = "emmaforyou.lovable.app"): { text: string; removed: string[] } {
  const removed: string[] = [];
  const isOk = (path: string) => { const p = path.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/"; return allowed.has(p); };
  let out = text.replace(/\[([^\]]{1,120})\]\(([^)\s]{1,300})\)/g, (_m, label: string, href: string) => {
    const path = href.startsWith("/") ? href : (() => { try { const u = new URL(href); return u.hostname === siteHost ? u.pathname : null; } catch { return null; } })();
    if (path && isOk(path)) return `${label} (${path})`;
    removed.push(href); return label;
  });
  out = out.replace(/https?:\/\/[^\s)]+/g, (raw) => {
    const url = raw.replace(/[.,;:!?'"]+$/, ""); const tail = raw.slice(url.length);
    try { const u = new URL(url); if (u.hostname === siteHost && isOk(u.pathname)) return u.pathname + tail; } catch { /* fallthrough */ }
    removed.push(url); return tail;
  });
  out = out.replace(/(^|[\s(])(\/[a-z0-9][a-z0-9/_-]{1,120})(?=[\s).,;:!?]|$)/gi, (m, pre: string, path: string) => {
    if (isOk(path)) return m;
    removed.push(path); return pre;
  });
  return { text: out.replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " ").trim(), removed };
}

/** Sources may only be real http(s) URLs that came from the research item or the shared feed. */
export function cleanSources(list: unknown, permitted: Set<string>): { title: string; url: string }[] {
  if (!Array.isArray(list)) return [];
  return list.filter((s): s is { title?: unknown; url: unknown } => Boolean(s && typeof s === "object" && "url" in s))
    .map((s) => ({ title: String(s.title ?? "").slice(0, 200), url: String(s.url) }))
    .filter((s) => /^https?:\/\//.test(s.url) && permitted.has(s.url)).slice(0, 5);
}

export function fingerprint(text: string): string {
  const words = text.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
  return [...new Set(words)].sort().slice(0, 12).join("-").slice(0, 180) || "empty";
}
const STOP = new Set(["this", "that", "with", "your", "from", "have", "what", "when", "will", "about", "they", "their", "there", "into", "more", "than", "just", "like", "help", "need", "does", "make", "best", "good", "some", "here", "much", "very", "should", "could", "would"]);

/** Word-overlap similarity between two titles (0..1), used to stop near-duplicate posts. */
export function similarity(a: string, b: string): number {
  const A = new Set(fingerprint(a).split("-")), B = new Set(fingerprint(b).split("-"));
  if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach((w) => { if (B.has(w)) inter++; });
  return inter / Math.min(A.size, B.size);
}

/** Members can opt out in plain words; checked before any AI call. */
export function optOutIntent(text: string): "replies" | "followups" | null {
  const t = text.toLowerCase();
  if (/\b(stop|don'?t|do not|no more)\b.{0,30}\b(follow[- ]?ups?|following up|messag|remind)/.test(t)) return "followups";
  if (/\b(stop|don'?t|do not|no more|quit)\b.{0,30}\b(repl(y|ies|ying)|answer|comment|ai|bot|agent)s?\b/.test(t) || /\bleave me alone\b|\bopt[ -]?out\b|\bunsubscribe\b/.test(t)) return "replies";
  return null;
}

/** Topics that must go to a person (checked in code as well as by the model). */
export function sensitive(text: string): string | null {
  const t = text.toLowerCase();
  // Only the member's own disputes, not questions about the topic ("how do I write a refund policy?").
  if (/\b(charged twice|double[- ]charged|chargeback|dispute (a|the|my) (payment|charge))\b/.test(t)
    || /\b(i|we)\b[^.?!]{0,40}\b(want|need|demand|request(ed)?|waiting for|didn'?t get|never got|haven'?t (got|received))\b[^.?!]{0,25}\brefund\b/.test(t)
    || /\b(i|we)\b[^.?!]{0,20}\b(was|were|got|have been|been)\s+(scammed|defrauded|ripped off|cheated)\b/.test(t)) return "payment dispute";
  if (/\b(sue|suing|lawsuit|legal action|my lawyer|our lawyer|small claims)\b/.test(t)) return "legal matter";
  if (/\b(complain(t|ing)?|unhappy|disappointed|terrible service|worst service)\b[^.?!]{0,60}\b(emmaforyou|your (team|company|service|agency)|you guys)\b/.test(t)
    || /\b(emmaforyou|your (team|company|agency))\b[^.?!]{0,60}\b(never delivered|didn'?t deliver|ghosted|took my money)\b/.test(t)) return "complaint about EmmaForYou";
  if (/\b(suicid|self[- ]harm|kill myself)\b/.test(t)) return "personal safety";
  return null;
}

/** Remove claims an automated agent must never make about itself. */
export function screenReply(text: string): { ok: boolean; reason?: string } {
  const t = text.toLowerCase();
  if (/\b(i am|i'm) (a )?(human|real person|person on the team|employee)\b/.test(t)) return { ok: false, reason: "claims to be human" };
  if (/\b(when i (worked|ran|built|was at)|in my (years|career|experience as)|my (clients|customers) (told|saw))\b/.test(t)) return { ok: false, reason: "claims personal experience" };
  if (/\bguarantee(d|s)?\b/.test(t) && !/\b(no|not|can'?t|cannot|never|won'?t)\b[^.]{0,40}\bguarantee/.test(t)) return { ok: false, reason: "guarantees an outcome" };
  if (text.trim().length < 20) return { ok: false, reason: "too short" };
  return { ok: true };
}

export function estimateCost(inTok: number | null, outTok: number | null, priceIn: number | null, priceOut: number | null): number | null {
  if (priceIn == null || priceOut == null || inTok == null || outTok == null) return null;
  return Math.round(((inTok / 1e6) * priceIn + (outTok / 1e6) * priceOut) * 1e6) / 1e6;
}
