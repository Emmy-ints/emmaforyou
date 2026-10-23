/**
 * Pure helpers for the inspiration crawler: sitemap parsing, page metadata, link discovery,
 * picking the featured site's real URL, tag/facet classification and duplicate keys.
 * Everything read from external pages is untrusted text: it is length-limited, stripped of markup
 * and only ever rendered as plain text or validated https URLs.
 */

export const decode = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => safeChar(Number(d)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
function safeChar(n: number) { try { return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ""; } catch { return ""; } }
export const text = (s: string, max = 300) => decode(s.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** Only public https(/http) URLs with a real hostname survive. */
export function cleanUrl(raw: string | null | undefined, base?: string | URL): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(decode(raw.trim()), base);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
    if (u.port && !["80", "443"].includes(u.port)) return null;
    const h = u.hostname.toLowerCase();
    if (!h.includes(".") || /^[\d.]+$/.test(h) || h.includes(":") || /(^|\.)(localhost|local|internal|lan|home|corp|test|invalid|example)$/.test(h)) return null;
    u.hash = "";
    return u;
  } catch { return null; }
}
export const hostOf = (u: URL | string) => (typeof u === "string" ? new URL(u) : u).hostname.toLowerCase().replace(/^www\./, "");

// ------------------------------------------------------------------ sitemaps
export interface SitemapEntry { loc: string; lastmod: string | null }
export function parseSitemap(xml: string): { kind: "index" | "urlset" | "unknown"; entries: SitemapEntry[] } {
  const kind = /<sitemapindex[\s>]/i.test(xml) ? "index" : /<urlset[\s>]/i.test(xml) ? "urlset" : "unknown";
  const entries: SitemapEntry[] = [];
  const re = kind === "index" ? /<sitemap>([\s\S]*?)<\/sitemap>/gi : /<url>([\s\S]*?)<\/url>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) && entries.length < 60000) {
    const loc = /<loc>\s*([\s\S]*?)\s*<\/loc>/i.exec(m[1])?.[1];
    if (!loc) continue;
    entries.push({ loc: decode(loc.trim()), lastmod: /<lastmod>\s*([^<]+?)\s*<\/lastmod>/i.exec(m[1])?.[1] ?? null });
  }
  return { kind, entries };
}

/** Child sitemaps to read this run: newest first by lastmod, or (no dates) highest-numbered first. */
export function orderChildSitemaps(entries: SitemapEntry[], pick?: string | null): SitemapEntry[] {
  const list = entries.filter((e) => !pick || e.loc.toLowerCase().includes(pick.toLowerCase()));
  const dated = list.some((e) => e.lastmod);
  const num = (s: string) => Number(/(\d+)(?:\.xml(?:\.gz)?)?$/.exec(s)?.[1] ?? 0);
  return [...list].sort((a, b) => dated ? String(b.lastmod ?? "").localeCompare(String(a.lastmod ?? "")) || num(b.loc) - num(a.loc) : num(b.loc) - num(a.loc));
}

// ------------------------------------------------------------------ page reading
export interface Anchor { href: URL; text: string; rel: string; title: string; img: string | null }
export interface PageMeta {
  title: string | null; description: string | null; image: string | null; canonical: string | null; siteName: string | null;
  published: string | null; anchors: Anchor[]; contentAnchors: Anchor[]; jsonldUrls: string[]; keywords: string[];
}

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : null;
}
function meta(html: string, keys: string[]): string | null {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const k = (attr(m[0], "property") ?? attr(m[0], "name") ?? "").toLowerCase();
    if (keys.includes(k)) { const v = attr(m[0], "content"); if (v && v.trim()) return v.trim(); }
  }
  return null;
}

export function readPage(html: string, pageUrl: URL): PageMeta {
  const head = html.slice(0, 400_000);
  const title = meta(head, ["og:title", "twitter:title"]) ?? (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] ?? null);
  const canonicalTag = /<link\b[^>]*rel=["']?canonical["']?[^>]*>/i.exec(head)?.[0];
  const links = (h: string) => {
    const out: Anchor[] = [];
    for (const m of h.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      if (out.length >= 3000) break;
      const href = cleanUrl(attr(m[1], "href"), pageUrl);
      if (!href) continue;
      const img = /<img\b[^>]*>/i.exec(m[2])?.[0];
      out.push({ href, text: text(m[2], 120), rel: (attr(m[1], "rel") ?? "").toLowerCase(), title: (attr(m[1], "title") ?? attr(m[1], "aria-label") ?? "").slice(0, 120), img: img ? (attr(img, "src") ?? attr(img, "data-src")) : null });
    }
    return out;
  };
  const anchors = links(html);
  // Tags are read only from the page's own content, never from site-wide menus, headers or footers.
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html)?.[1] ?? html;
  const contentAnchors = links(main.replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, " "));
  const jsonldUrls: string[] = []; let published: string | null = null;
  for (const m of head.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (o: unknown, depth = 0): void => {
        if (!o || typeof o !== "object" || depth > 5) return;
        if (Array.isArray(o)) { o.forEach((x) => walk(x, depth + 1)); return; }
        const r = o as Record<string, unknown>;
        if (typeof r.datePublished === "string" && !published) published = r.datePublished;
        for (const k of ["sameAs", "mainEntityOfPage", "about", "mentions"]) {
          const v = r[k];
          if (typeof v === "string") jsonldUrls.push(v);
          else if (v && typeof v === "object") walk(v, depth + 1);
        }
        if (r["@graph"]) walk(r["@graph"], depth + 1);
      };
      walk(JSON.parse(m[1].trim()));
    } catch { /* invalid JSON-LD is ignored */ }
  }
  const kw = meta(head, ["keywords"]);
  return {
    title: title ? text(title, 200) : null,
    description: (() => { const d = meta(head, ["og:description", "description", "twitter:description"]); return d ? text(d, 600) : null; })(),
    image: meta(head, ["og:image", "og:image:url", "twitter:image", "twitter:image:src"]),
    canonical: canonicalTag ? attr(canonicalTag, "href") : null,
    siteName: (() => { const s = meta(head, ["og:site_name", "application-name"]); return s ? text(s, 80) : null; })(),
    published: published ?? meta(head, ["article:published_time"]),
    anchors, contentAnchors, jsonldUrls,
    keywords: kw ? kw.split(",").map((x) => text(x, 40).toLowerCase()).filter(Boolean).slice(0, 20) : [],
  };
}

// ------------------------------------------------------------------ finding the real example
const NOT_TARGET = /(^|\.)(facebook|twitter|x|instagram|linkedin|youtube|youtu|pinterest|tiktok|threads|reddit|discord|t|telegram|whatsapp|wa|medium|github|google|apple|bit|goo|ow|buffer|addtoany|sharethis|gravatar|wordpress|wp|cloudflare|gstatic|googleapis|jsdelivr|unpkg|cdnjs|typekit|fonts|doubleclick|googletagmanager|hotjar|intercom|stripe|paypal|patreon|ko-fi|buymeacoffee|gumroad|carbonads|buysellads|mailchimp|substack|beehiiv|convertkit|sendgrid|spotify|vimeo)\.[a-z.]+$/;
const VISIT = /\b(visit|view|launch|open|go to|see|live)\b.{0,12}\b(site|website|store|shop|page|project|live)\b|^(visit|launch site|live site|website|view live)$/i;

/**
 * The featured site's own URL on a gallery page: an external link labelled "Visit site"/"Live site",
 * or one carrying ?ref=<gallery>, scored above incidental outbound links (social, sponsors, tools).
 */
export function pickOriginal(meta: PageMeta, pageUrl: URL, blockedHosts: string[] = []): URL | null {
  const own = hostOf(pageUrl);
  const blocked = new Set([own, ...blockedHosts.map((h) => h.replace(/^www\./, ""))]);
  let best: { u: URL; score: number } | null = null;
  for (const a of meta.anchors) {
    const h = hostOf(a.href);
    if (blocked.has(h) || h.endsWith(`.${own}`) || NOT_TARGET.test(h)) continue;
    let score = 0;
    const label = `${a.text} ${a.title}`.trim();
    if (VISIT.test(label)) score += 6;
    if ([...a.href.searchParams.keys()].some((k) => k === "ref" || k === "via" || k.startsWith("utm_")) && a.href.search.toLowerCase().includes(own.split(".")[0])) score += 5;
    if (a.rel.includes("sponsored")) score -= 8;
    if (/sponsor|advert|affiliate|promo|partner|hire|jobs?/i.test(label)) score -= 6;
    if (a.href.searchParams.has("via") && !a.href.search.toLowerCase().includes(own.split(".")[0])) score -= 4;
    if (a.rel.includes("nofollow") || a.rel.includes("noopener") || a.rel.includes("external")) score += 1;
    if (a.href.pathname === "/" || a.href.pathname.split("/").filter(Boolean).length <= 1) score += 1;
    if (label && label.length < 40 && hostOf(a.href).startsWith(label.toLowerCase().replace(/\s+/g, ""))) score += 2;
    if (score > (best?.score ?? 0)) best = { u: a.href, score };
  }
  return best && best.score >= 5 ? stripTracking(best.u) : null;
}

export function stripTracking(u: URL): URL {
  const c = new URL(u.toString());
  for (const k of [...c.searchParams.keys()]) if (/^(ref|via|source|utm_.+|fbclid|gclid|mc_[a-z]+|_ga|aff|affiliate)$/i.test(k)) c.searchParams.delete(k);
  return c;
}

/** Duplicate key: host without www + path without trailing slash + remaining query, lower-cased. */
export function canonicalKey(u: URL): string {
  const c = stripTracking(u);
  const path = c.pathname.replace(/\/+$/, "") || "";
  const q = [...c.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&");
  return `${hostOf(c)}${path}${q ? `?${q}` : ""}`.toLowerCase().slice(0, 600);
}

/** Remove the gallery's own name from a page title ("Acme | Lapa Ninja" → "Acme"). */
export function cleanTitle(raw: string | null, sourceName: string): string | null {
  if (!raw) return null;
  let t = raw.replace(/\s+/g, " ").trim();
  const name = sourceName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const parts = t.split(/\s+[|–—·•-]\s+|\s+::\s+/);
  if (parts.length > 1) {
    const kept = parts.filter((p) => !p.toLowerCase().replace(/[^a-z0-9]/g, "").includes(name) && !/^(landing page|website|email|inspiration|design|examples?|(desktop|mobile) email view|(one page )?website award|site of the day|honorable mention|developer award|template review( and demo)?)( (design|inspiration|examples?))?$/i.test(p.trim()));
    if (kept.length) t = kept.join(" | ");
  }
  t = t.replace(/^email inspiration from\s+/i, "").replace(/\s*\|?\s*(desktop|mobile) email view$/i, "").replace(/\s+(website|landing page)\s+(design|inspiration)$/i, "");
  return t.slice(0, 200) || null;
}

// ------------------------------------------------------------------ tags and facets
export function tagsFrom(meta: PageMeta, pageUrl: URL, prefixes: string[]): { tags: string[]; byPrefix: Record<string, string[]> } {
  const own = hostOf(pageUrl); const byPrefix: Record<string, string[]> = {}; const tags = new Set<string>();
  if (!prefixes.length) return { tags: [], byPrefix };
  for (const a of meta.contentAnchors) {
    if (hostOf(a.href) !== own) continue;
    const pq = a.href.pathname + a.href.search;
    const p = prefixes.find((x) => pq.toLowerCase().startsWith(x.toLowerCase()));
    if (!p) continue;
    const slug = decodeURIComponent(pq.slice(p.length)).split(/[/?&#]/)[0].replace(/[-_+]+/g, " ").trim();
    const label = (a.text && a.text.length <= 40 ? a.text : slug).toLowerCase().replace(/[^a-z0-9&.+# -]/g, "").replace(/\s+/g, " ").trim();
    if (!label || label.length < 2 || label.length > 40 || /^(all|more|see all|view all|\d+)$/.test(label) || /\b(view all|see all|versions?|load more|next|previous|page \d+)\b/.test(label)) continue;
    (byPrefix[p] ??= []).includes(label) || byPrefix[p].push(label);
    tags.add(label);
    if (tags.size >= 12) break;
  }
  return { tags: [...tags], byPrefix };
}

const INDUSTRY: [string, RegExp][] = [
  ["fashion", /\b(fashion|apparel|clothing|streetwear|jewel+ery|accessor|footwear|shoes?)\b/],
  ["beauty", /\b(beauty|cosmetic|skin ?care|makeup|hair|fragrance|salon)\b/],
  ["food & drink", /\b(food|drink|beverage|coffee|tea|restaurant|bakery|wine|beer|spirits|cafe|recipe|grocery|snack)\b/],
  ["health & wellness", /\b(health|wellness|fitness|gym|medical|clinic|dental|pharma|supplement|yoga|mental|care)\b/],
  ["finance", /\b(finance|fintech|bank|banking|payments?|invest|insurance|accounting|crypto|web3|blockchain|defi|nft)\b/],
  ["technology", /\b(saas|software|tech|developer|api|cloud|startup|app|devtools?|cyber|security|data)\b/],
  ["ai", /\b(ai|artificial intelligence|machine learning|llm|gpt)\b/],
  ["education", /\b(education|course|school|learning|university|edtech|tutor|teacher)\b/],
  ["real estate", /\b(real estate|property|architecture|interior|furniture|home|housing)\b/],
  ["travel", /\b(travel|hotel|tourism|airline|booking|hospitality)\b/],
  ["agency & studio", /\b(agency|studio|design studio|creative|consult)\b/],
  ["portfolio", /\b(portfolio|personal|freelance|designer|photographer|resume)\b/],
  ["media & entertainment", /\b(media|music|film|entertainment|gaming|games?|magazine|news|podcast|event)\b/],
  ["nonprofit", /\b(non-?profit|charity|ngo|foundation|community)\b/],
  ["sports & outdoors", /\b(sports?|outdoor|cycling|running|bike)\b/],
  ["automotive", /\b(auto|automotive|cars?|vehicle|ev|mobility)\b/],
  ["ecommerce & retail", /\b(ecommerce|e-commerce|shop|store|retail|dtc|marketplace)\b/],
];
const STYLE: [string, RegExp][] = [
  ["minimal", /\b(minimal|minimalist|clean|simple|whitespace)\b/], ["bold", /\b(bold|big type|large type|loud)\b/],
  ["dark", /\b(dark|dark mode|black)\b/], ["colourful", /\b(colou?rful|vibrant|bright|gradient)\b/],
  ["illustrative", /\b(illustrat\w*|hand.?drawn|cartoon)\b/], ["3d", /\b(3d|webgl|three\.?js)\b/],
  ["animated", /\b(animat\w*|motion|interactive|scroll(ing)? effects?|parallax)\b/], ["typographic", /\b(typograph\w*|type.?driven|serif|font)\b/],
  ["retro", /\b(retro|vintage|y2k|nostalg\w*)\b/], ["playful", /\b(playful|fun|quirky|whimsical)\b/],
  ["elegant", /\b(elegant|luxury|premium|editorial)\b/], ["flat", /\b(flat design|flat)\b/], ["brutalist", /\b(brutalis\w*|raw)\b/],
  ["photographic", /\b(photograph\w*|imagery|full.?screen image)\b/], ["grid", /\b(grid|bento|masonry)\b/],
];
const PLATFORMS: [string, RegExp][] = [
  ["Shopify", /\bshopify\b/], ["Webflow", /\bwebflow\b/], ["Framer", /\bframer\b/], ["WordPress", /\bwordpress\b/], ["Squarespace", /\bsquarespace\b/],
  ["Wix", /\bwix\b/], ["Next.js", /\bnext\.?js\b/], ["Gatsby", /\bgatsby\b/], ["Ghost", /\bghost\b/], ["Carrd", /\bcarrd\b/], ["Notion", /\bnotion\b/], ["Klaviyo", /\bklaviyo\b/],
];
const COLORS = ["black", "white", "grey", "gray", "red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "beige", "teal", "navy", "gold", "cream"];

export type Kind = "ecommerce" | "email" | "landing_page" | "website" | "saas" | "dashboard" | "mobile_app" | "component" | "portfolio" | "design_concept";
export const KINDS: Kind[] = ["ecommerce", "email", "landing_page", "website", "saas", "dashboard", "mobile_app", "component", "portfolio", "design_concept"];

export interface Facets { kind: Kind; industries: string[]; styles: string[]; colors: string[]; theme: "light" | "dark" | null; platform: string | null }
/**
 * Facets come only from labels the source itself published (tags, categories, title/description words);
 * platform only when the source names it (never guessed from looks).
 */
export function classify(opts: { defaultKind: Kind; sourcePlatform: string | null; sourceTheme: "light" | "dark" | null; tags: string[]; byPrefix: Record<string, string[]>; title: string; description: string | null; keywords: string[] }): Facets {
  const tagText = [...opts.tags, ...opts.keywords].join(" | ").toLowerCase();
  const all = `${tagText} | ${opts.title} | ${opts.description ?? ""}`.toLowerCase();
  const industries = INDUSTRY.filter(([, re]) => re.test(tagText) || re.test(opts.title.toLowerCase())).map(([n]) => n).slice(0, 4);
  const styles = STYLE.filter(([, re]) => re.test(tagText)).map(([n]) => n).slice(0, 5);
  const colorTags = Object.entries(opts.byPrefix).filter(([p]) => /colou?r/.test(p)).flatMap(([, v]) => v);
  const colors = [...new Set([...colorTags, ...opts.tags.filter((t) => COLORS.includes(t))].map((c) => c.replace("gray", "grey")))].filter((c) => COLORS.includes(c) || c === "grey").slice(0, 5);
  const platformTags = Object.entries(opts.byPrefix).filter(([p]) => /platform|tech|built/.test(p)).flatMap(([, v]) => v).join(" ");
  const platform = opts.sourcePlatform ?? PLATFORMS.find(([, re]) => re.test(platformTags))?.[0] ?? null;
  const theme = opts.sourceTheme ?? (/\bdark( mode| theme| design)?\b/.test(tagText) ? "dark" : /\blight( mode| theme)\b/.test(tagText) ? "light" : null);
  let kind = opts.defaultKind;
  if (kind !== "email") {
    if (/\b(dashboard|admin panel|analytics app)\b/.test(all)) kind = "dashboard";
    else if (/\b(ios|android|mobile app)\b/.test(tagText)) kind = "mobile_app";
    else if (/\bportfolio\b/.test(tagText)) kind = kind === "design_concept" ? kind : "portfolio";
    else if (/\b(shopify|ecommerce|e-commerce|online store|shop)\b/.test(tagText) && kind !== "component") kind = "ecommerce";
    else if (/\b(ui kit|component|design system|wireframe kit)\b/.test(all) && kind !== "saas") kind = "component";
    else if (/\b(landing page|one page|single page)\b/.test(tagText) && kind === "website") kind = "landing_page";
    else if (/\b(saas)\b/.test(tagText) && (kind === "website" || kind === "landing_page")) kind = "saas";
  }
  return { kind, industries, styles: theme === "dark" && !styles.includes("dark") ? [...styles, "dark"].slice(0, 5) : styles, colors, theme, platform };
}

/** Email titles often read "<subject> from <Brand>": split them so the brand is filterable. */
export function splitEmailTitle(title: string): { subject: string; brand: string | null } {
  const m = /^(.{3,180}?)\s+from\s+([^|]{2,60})$/i.exec(title.trim());
  if (m) return { subject: m[1].trim(), brand: m[2].trim() };
  return { subject: title, brand: null };
}
