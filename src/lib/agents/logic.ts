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

/** Content words of a text, lightly stemmed (plural/-ing/-ed) so "stores" and "store" match. */
export function contentWords(text: string): Set<string> {
  const stem = (w: string) => w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "").replace(/(.)\1$/, "$1");
  return new Set(text.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w) && !EXTRA_STOP.has(w)).map(stem).filter((w) => w.length > 2));
}
const EXTRA_STOP = new Set(["the", "and", "for", "you", "are", "how", "why", "can", "our", "its", "it's", "into", "out", "your", "yours", "way", "ways", "tips", "guide", "step", "steps", "simple", "practical", "small", "business", "businesses", "owners", "today", "need", "know"]);

/**
 * Similarity of two titles (0..1). Jaccard over stemmed content words, but titles that share fewer
 * than 3 meaningful words are never treated as duplicates (so "Shopify speed" doesn't block every Shopify post).
 */
export function similarity(a: string, b: string): number {
  const A = contentWords(a), B = contentWords(b);
  if (!A.size || !B.size) return 0;
  let inter = 0; A.forEach((w) => { if (B.has(w)) inter++; });
  if (inter < Math.min(3, A.size, B.size)) return inter / Math.max(A.size, B.size) * 0.5;
  const jaccard = inter / (A.size + B.size - inter);
  const containment = inter / Math.min(A.size, B.size);
  return Math.max(jaccard, containment * 0.95);
}

/** Body overlap (0..1) between two posts, used against the same agent's recent posts to catch disguised duplicates. */
export function bodyOverlap(a: string, b: string): number {
  const A = contentWords(a.slice(0, 2500)), B = contentWords(b.slice(0, 2500));
  if (A.size < 20 || B.size < 20) return 0;
  let inter = 0; A.forEach((w) => { if (B.has(w)) inter++; });
  return inter / (A.size + B.size - inter);
}

/** Figures (percentages, money, large numbers) in a sourced post must appear in its sources. */
export function figuresNotInSources(body: string, sourceText: string): string[] {
  const norm = (x: string) => x.replace(/[,\s]/g, "").toLowerCase();
  const src = norm(sourceText);
  const figs = body.match(/(\$|€|£|₦)\s?\d[\d,.]*\s?(k|m|bn|billion|million|thousand)?|\b\d[\d,.]*\s?%|\b\d{1,3}(,\d{3})+\b|\b\d+(\.\d+)?\s?(million|billion|thousand)\b/gi) ?? [];
  return [...new Set(figs.map((f) => f.trim()))].filter((f) => { const n = norm(f).replace(/^[$€£₦]/, "").replace(/(k|m|bn|billion|million|thousand|%)$/, ""); return n.length > 0 && !src.includes(n); }).slice(0, 5);
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

/** A guarantee of results ("we guarantee first-page rankings"), as opposed to honest negations ("rankings aren't guaranteed"). */
export function promisesOutcome(t: string): boolean {
  const sentences = t.toLowerCase().split(/(?<=[.!?\n])\s+/);
  const NEG = /\b(no|not|n'?t|never|nobody|no one|without|nothing|impossible|isn'?t|aren'?t|doesn'?t|don'?t|won'?t|can'?t|cannot|couldn'?t|wouldn'?t|shouldn'?t|beware|avoid|anyone who|anybody who|be wary|red flag|claims? to)\b/;
  return sentences.some((s) => /\bguarantee(d|s|ing)?\b/.test(s) && !NEG.test(s.split(/\bguarantee/)[0]) && !/\bguarantee(d|s)?\b[^.]{0,30}\b(isn'?t|aren'?t|not|never)\b/.test(s) && !/\b(money-back|satisfaction|refund) guarantee\b/.test(s));
}

/** Remove claims an automated agent must never make about itself. */
export function screenReply(text: string): { ok: boolean; reason?: string } {
  const t = text.toLowerCase();
  if (/\b(i am|i'm) (a )?(human|real person|person on the team|employee)\b/.test(t)) return { ok: false, reason: "claims to be human" };
  if (/\b(when i (worked|ran|built|was at)|in my (years|career|experience as)|my (clients|customers) (told|saw))\b/.test(t)) return { ok: false, reason: "claims personal experience" };
  if (promisesOutcome(t)) return { ok: false, reason: "guarantees an outcome" };
  if (text.trim().length < 20) return { ok: false, reason: "too short" };
  return { ok: true };
}

export function estimateCost(inTok: number | null, outTok: number | null, priceIn: number | null, priceOut: number | null): number | null {
  if (priceIn == null || priceOut == null || inTok == null || outTok == null) return null;
  return Math.round(((inTok / 1e6) * priceIn + (outTok / 1e6) * priceOut) * 1e6) / 1e6;
}

/* ------------------------------------------------------------------ v2: natural replies, opportunities, daily posts */

/** Stock chatbot openers/closers are removed rather than rejected (the rest of the reply is usually fine). */
const STOCK_OPENERS = /^\s*(great|good|excellent|fantastic|awesome) question[!.,]*\s*|^\s*(absolutely|certainly|of course|sure thing)[!.,]+\s*|^\s*i (completely|totally|fully) understand[^.!?\n]*[.!?]\s*|^\s*thanks? (so much )?for (sharing|asking|reaching out|your question)[^.!?\n]*[.!?]\s*/i;
const STOCK_CLOSERS = /\s*(let me know if (you (have|need)|there'?s) (any(thing)? (else|other questions?)|more questions?)[^.!?\n]*[.!?]?|feel free to (ask|reach out)[^.!?\n]*[.!?]?|hope (this|that) helps[!.]?|happy to help[!.]?)\s*$/i;
export function stripStock(text: string): string {
  let t = text.trim();
  for (let i = 0; i < 2; i++) { const n = t.replace(STOCK_OPENERS, ""); if (n === t) break; t = n.replace(/^[a-z]/, (c) => c.toUpperCase()); }
  for (let i = 0; i < 2; i++) { const n = t.replace(STOCK_CLOSERS, ""); if (n === t) break; t = n; }
  return t.trim();
}

/** Replies that close the door on a possible customer (the agent must refer to Emmanuel instead). */
export function turnsCustomerAway(text: string): boolean {
  const t = text.toLowerCase();
  return /\b(we|emmaforyou|i)\s+(don'?t|do not|can'?t|cannot|won'?t)\s+(offer|provide|do|help with|handle|support|build|take on)\b/.test(t)
    || /\bnot (one of )?(our|a) services?\b|\bnot something we (offer|do)\b|\b(find|try|look for) (someone|somebody|another (agency|provider|company)) else\b|\blook elsewhere\b|\boutside (of )?(our|what we) (offer|do)\b/.test(t);
}

/** Cheap signals on a member comment, used to decide whether an uninvolved comment deserves the team's attention. */
export function commentSignals(text: string): { question: boolean; help: boolean; buying: boolean; frustration: boolean; any: boolean } {
  const t = ` ${text.toLowerCase()} `;
  const question = /\?/.test(t) || /\b(how (do|can|should|would)|what('?s| is| are| should)|which|why (is|does|do|won'?t)|is there|can (i|you|someone|anyone)|anyone know|any (tips|advice|ideas))\b/.test(t);
  const help = /\b(help|stuck|struggl|not working|doesn'?t work|broken|error|issue|problem|can'?t figure|confused)\b/.test(t);
  const buying = /\b(how much|price|pricing|cost|quote|budget|hire|hiring|looking for (a|an|someone)|need (a|an|someone) (to|who)|can you (build|make|do|help)|do you (offer|do|build)|available for|freelancer|agency|developer|designer)\b/.test(t);
  const frustration = /\b(frustrat|annoy|fed up|tired of|wasted|nothing works|so hard|giving up|disappointed|ugh)\b/.test(t);
  return { question, help, buying, frustration, any: question || help || buying || frustration };
}

/** Good news worth a short, natural congratulation (only when the member shared it themselves). */
export function sharesAchievement(text: string): boolean {
  return /\b(just (launched|hit|reached|got|made|closed|finished|shipped|opened)|we launched|i launched|finally (launched|live|done|got)|first (sale|order|client|customer|1000|100)|milestone|went live|is live|celebrat|proud to (share|announce)|excited to (share|announce))\b/i.test(text);
}

/** Evergreen posts (no sources) must not contain statistics, studies or news claims. */
export function unsourcedClaims(text: string): string | null {
  if (/\b\d{1,3}(\.\d+)?\s?%/.test(text)) return "contains a percentage without a source";
  if (/\b(according to|a (recent )?(study|survey|report) (by|from|found)|research shows|studies show|statistics show|data shows)\b/i.test(text)) return "cites research without a source";
  if (/\b(this (week|month)|yesterday|recently announced|just announced|breaking)\b/i.test(text)) return "makes a news claim without a source";
  return null;
}

/** Post formats, rotated so daily posts don't all read alike. */
export const POST_FORMATS: { id: string; kind: "tutorial" | "discussion"; brief: string; minChars: number }[] = [
  { id: "how-to", kind: "tutorial", brief: "a practical step-by-step how-to for one specific task", minChars: 600 },
  { id: "checklist", kind: "tutorial", brief: "a short, scannable checklist people can work through today", minChars: 450 },
  { id: "mistakes", kind: "tutorial", brief: "common mistakes in your niche, why they happen and what to do instead", minChars: 550 },
  { id: "troubleshooting", kind: "tutorial", brief: "a troubleshooting guide for a frequent problem: symptoms → likely causes → fixes", minChars: 550 },
  { id: "comparison", kind: "tutorial", brief: "a fair comparison of two common options and when each fits", minChars: 550 },
  { id: "observation", kind: "discussion", brief: "a short, thoughtful observation about a real problem your audience has, ending with a genuine question", minChars: 300 },
  { id: "question", kind: "discussion", brief: "a discussion starter: frame a real decision your audience faces, give your view briefly, and invite their experience", minChars: 300 },
];
export function formatFor(dayIndex: number, agentIndex: number) { return POST_FORMATS[(dayIndex + agentIndex * 3) % POST_FORMATS.length]; }

/* --------------------------- timezone helpers (no library; Intl only) */
export function localDay(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
/** The UTC instant for local wall-clock time hh:mm on a YYYY-MM-DD day in `tz`. */
export function zonedTime(day: string, hour: number, minute: number, tz: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess));
  const get = (k: string) => Number(parts.find((p) => p.type === k)?.value);
  const asLocal = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess - (asLocal - guess));
}
/** Spread agents' daily slots across the posting window (stable order, small deterministic offset per agent). */
export function dailySlot(day: string, index: number, count: number, startHour: number, endHour: number, tz: string, seed: string): Date {
  const start = zonedTime(day, startHour, 0, tz).getTime(), end = zonedTime(day, Math.min(endHour, 23), endHour >= 24 ? 59 : 0, tz).getTime();
  const span = Math.max(end - start, 3600_000);
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const jitter = ((h % 1000) / 1000 - 0.5) * Math.min(span / Math.max(count, 1), 40 * 60_000) * 0.8;
  return new Date(start + span * ((index + 0.5) / Math.max(count, 1)) + jitter);
}
