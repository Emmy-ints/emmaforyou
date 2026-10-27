/**
 * Pure helpers for the server-side HTTP checker: input validation (only paths on this site, so it
 * can never reach internal or third-party hosts), crawler user agents, and the light HTML reading
 * done on the server (no DOM there). Tested in isolation; the handler adds auth and fetching.
 */

/** Official user-agent strings, as each operator publishes them (OpenAI's checked 27 Oct 2026 at developers.openai.com/api/docs/bots). */
export const CRAWLERS = {
  browser: { ua: "Mozilla/5.0 (compatible; EmmaForYou-site-check/1.0; +https://emmaforyou.lovable.app)", purpose: "Plain request (no crawler identity)" },
  googlebot: { ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", purpose: "Google Search (also feeds Google's AI features)" },
  bingbot: { ua: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)", purpose: "Bing search (also feeds Microsoft Copilot)" },
  "oai-searchbot": { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot", purpose: "ChatGPT search results (not model training)" },
  "chatgpt-user": { ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot", purpose: "A person asked ChatGPT to open a page (user-initiated; robots.txt may not apply)" },
  gptbot: { ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot", purpose: "OpenAI model training (separate from search)" },
  perplexitybot: { ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)", purpose: "Perplexity search index" },
  claudebot: { ua: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)", purpose: "Anthropic model training" },
} as const;
export type CrawlerId = keyof typeof CRAWLERS;

export interface CheckRequest { path: string; crawler?: CrawlerId; method?: "GET" | "HEAD" }
export interface Hop { url: string; status: number; location: string | null; deploymentId: string | null }
export interface CheckResult {
  path: string; crawler: CrawlerId; method: string;
  hops: Hop[];
  finalStatus: number; finalUrl: string; redirects: number;
  stoppedOffsite: boolean; loop: boolean;
  contentType: string | null; xRobots: string | null; cacheControl: string | null;
  html?: { title: string; robots: string; canonical: string; h1: number; jsonld: number; bytes: number };
  error?: string;
}

const PATH_RE = /^\/(?!\/)[A-Za-z0-9/_\-.~%?=&+:,]*$/;

/** Validate a request list: same-site paths only, at most `max`, known crawlers only. */
export function validateChecks(input: unknown, max = 30): { ok: true; checks: Required<CheckRequest>[] } | { ok: false; message: string } {
  if (!input || typeof input !== "object" || !Array.isArray((input as { checks?: unknown }).checks)) return { ok: false, message: "Send { checks: [{ path }] }." };
  const raw = (input as { checks: unknown[] }).checks;
  if (!raw.length) return { ok: false, message: "No checks." };
  if (raw.length > max) return { ok: false, message: `At most ${max} checks per request.` };
  const out: Required<CheckRequest>[] = [];
  for (const c of raw) {
    const r = (c ?? {}) as Partial<CheckRequest>;
    if (typeof r.path !== "string" || r.path.length > 300 || !PATH_RE.test(r.path) || /\.\.|\\/.test(r.path)) return { ok: false, message: `Not a path on this site: ${String(r.path).slice(0, 60)}` };
    const crawler = (r.crawler ?? "browser") as CrawlerId;
    if (!(crawler in CRAWLERS)) return { ok: false, message: `Unknown crawler ${String(r.crawler)}` };
    const method = r.method === "HEAD" ? "HEAD" : "GET";
    out.push({ path: r.path, crawler, method });
  }
  return { ok: true, checks: out };
}

/** Resolve a Location header against the current URL; null if it leaves this origin. */
export function nextHop(location: string, current: string, origin: string): string | null {
  try { const u = new URL(location, current); return u.origin === origin ? u.toString() : null; } catch { return null; }
}

/** Minimal server-side HTML reading (regex; the browser audit does the full DOM parse). */
export function readHtml(html: string): NonNullable<CheckResult["html"]> {
  const head = html.slice(0, 200000);
  const attr = (re: RegExp) => (head.match(re)?.[1] ?? "").replace(/&amp;/g, "&").trim();
  return {
    title: attr(/<title[^>]*>([^<]*)<\/title>/i),
    robots: attr(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i) || attr(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']robots["']/i),
    canonical: attr(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i),
    h1: (head.match(/<h1[\s>]/gi) ?? []).length,
    jsonld: (head.match(/<script[^>]+type=["']application\/ld\+json["']/gi) ?? []).length,
    bytes: html.length,
  };
}

/** Very small robots.txt evaluator (longest-match rule, Allow wins ties) for one user agent token. */
export function robotsAllows(robotsTxt: string, agentToken: string, path: string): { allowed: boolean; group: string; rule: string | null } {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let cur: (typeof groups)[number] | null = null; let lastWasAgent = false;
  for (const line of robotsTxt.split(/\r?\n/)) {
    const l = line.replace(/#.*/, "").trim(); if (!l) continue;
    const m = l.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") { if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); lastWasAgent = true; continue; }
    lastWasAgent = false;
    if (!cur) continue;
    if (k === "allow" || k === "disallow") { if (v || k === "allow") cur.rules.push({ allow: k === "allow", path: v }); }
  }
  const token = agentToken.toLowerCase();
  const g = groups.find((x) => x.agents.includes(token)) ?? groups.find((x) => x.agents.includes("*"));
  if (!g) return { allowed: true, group: "(none)", rule: null };
  const toRe = (p: string) => new RegExp("^" + p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
  let best: { allow: boolean; path: string } | null = null;
  for (const r of g.rules) if (r.path && toRe(r.path).test(path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
  return { allowed: best ? best.allow : true, group: g.agents.includes(token) ? agentToken : "*", rule: best ? `${best.allow ? "Allow" : "Disallow"}: ${best.path}` : null };
}
