/**
 * robots.txt parsing and matching (RFC 9309): the most specific user-agent group that names us wins,
 * otherwise "*"; within a group the longest matching rule wins and Allow wins a tie. "*" and "$" are
 * supported in paths. Crawl-delay is honoured as a minimum gap between requests.
 */
export const BOT_TOKEN = "emmaforyouinspiration";
export const USER_AGENT = "Mozilla/5.0 (compatible; EmmaForYouInspiration/1.0; +https://emmaforyou.lovable.app/inspiration)";

export interface RobotsRules { rules: { allow: boolean; path: string }[]; crawlDelayMs: number | null; sitemaps: string[]; status: "ok" | "none" | "unreachable" }

export function parseRobots(txt: string, token = BOT_TOKEN): RobotsRules {
  const sitemaps: string[] = [];
  type Group = { agents: string[]; rules: { allow: boolean; path: string }[]; delay: number | null };
  const groups: Group[] = [];
  let cur: Group | null = null; let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase(); const val = m[2].trim();
    if (key === "sitemap") { if (/^https?:\/\//i.test(val)) sitemaps.push(val); continue; }
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [], delay: null }; groups.push(cur); }
      cur.agents.push(val.toLowerCase()); lastWasAgent = true; continue;
    }
    lastWasAgent = false;
    if (!cur) continue;
    if (key === "allow" || key === "disallow") { if (val || key === "allow") cur.rules.push({ allow: key === "allow", path: val }); }
    else if (key === "crawl-delay") { const n = Number(val); if (Number.isFinite(n) && n >= 0) cur.delay = Math.min(n, 60) * 1000; }
  }
  const named = groups.filter((g) => g.agents.some((a) => a !== "*" && a.replace(/\/.*$/, "") === token));
  const chosen = named.length ? named : groups.filter((g) => g.agents.includes("*"));
  return {
    rules: chosen.flatMap((g) => g.rules),
    crawlDelayMs: chosen.reduce<number | null>((d, g) => (g.delay == null ? d : Math.max(d ?? 0, g.delay)), null),
    sitemaps, status: "ok",
  };
}

function ruleRegex(path: string): RegExp {
  const anchored = path.endsWith("$");
  const body = (anchored ? path.slice(0, -1) : path).split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

/** Is this path (+query) allowed? Empty rule sets allow everything. */
export function allowed(robots: RobotsRules, pathAndQuery: string): boolean {
  if (robots.status === "unreachable") return false;
  let best: { len: number; allow: boolean } | null = null;
  let p = pathAndQuery || "/";
  try { p = decodeURI(p); } catch { /* keep raw */ }
  for (const r of robots.rules) {
    if (!r.path) continue;
    if (!ruleRegex(r.path).test(p)) continue;
    const len = r.path.length;
    if (!best || len > best.len || (len === best.len && r.allow)) best = { len, allow: r.allow };
  }
  return best ? best.allow : true;
}
