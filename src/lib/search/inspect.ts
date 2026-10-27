/**
 * Reads one page's raw server HTML (as a search crawler receives it, before any JavaScript runs)
 * and extracts every fact the search audit checks. Pure: takes a parsed Document, so it runs the
 * same in the admin's browser (DOMParser), in tests and in a one-off baseline script.
 */

export interface JsonLdBlock { types: string[]; ids: string[]; error?: string; raw?: unknown }
export interface PageRecord {
  path: string;
  status: number;
  /** Path after following redirects (same as `path` when there were none). */
  finalPath: string;
  redirected: boolean;
  ms: number;
  lang: string;
  title: string;
  description: string;
  robots: string;
  noindex: boolean;
  nofollow: boolean;
  canonical: string;
  og: { title: string; description: string; image: string; url: string; type: string };
  twitterCard: string;
  h1: string[];
  hreflang: { lang: string; href: string }[];
  jsonld: JsonLdBlock[];
  /** Internal links (normalised paths, no query or hash), in document order, unique. */
  links: string[];
  /** Image sources in the server HTML (data: URIs excluded). */
  images: string[];
  /** Visible words in <main> (or <body>) of the server HTML. */
  words: number;
  error?: string;
}

/** Normalise an internal href to a path: strips origin, query, hash and the trailing slash. */
export function normalisePath(href: string, origin: string): string | null {
  if (!href || href.startsWith("#") || /^(mailto|tel|javascript|data|sms|whatsapp):/i.test(href)) return null;
  let u: URL;
  try { u = new URL(href, origin + "/"); } catch { return null; }
  if (u.origin !== origin) return null;
  const p = decodeURI(u.pathname).replace(/\/+$/, "") || "/";
  return p;
}

const typesOf = (node: unknown): string[] => {
  if (!node || typeof node !== "object") return [];
  const t = (node as Record<string, unknown>)["@type"];
  return Array.isArray(t) ? t.map(String) : t ? [String(t)] : [];
};

/** Flatten a JSON-LD value into its top-level entities (arrays and @graph). */
export function ldEntities(v: unknown): Record<string, unknown>[] {
  if (Array.isArray(v)) return v.flatMap(ldEntities);
  if (v && typeof v === "object") {
    const g = (v as Record<string, unknown>)["@graph"];
    return Array.isArray(g) ? g.flatMap(ldEntities) : [v as Record<string, unknown>];
  }
  return [];
}

export function inspectDocument(doc: Document, path: string, origin: string): Omit<PageRecord, "status" | "finalPath" | "redirected" | "ms"> {
  const meta = (attr: "name" | "property", n: string) => doc.querySelector(`meta[${attr}="${n}"]`)?.getAttribute("content")?.trim() ?? "";
  const robots = meta("name", "robots");
  const jsonld: JsonLdBlock[] = [];
  for (const s of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    const text = s.textContent ?? "";
    try {
      const v = JSON.parse(text);
      const ents = ldEntities(v);
      jsonld.push({ types: ents.flatMap(typesOf), ids: ents.map((e) => String(e["@id"] ?? "")).filter(Boolean), raw: v });
    } catch (e) {
      jsonld.push({ types: [], ids: [], error: e instanceof Error ? e.message.slice(0, 120) : "Invalid JSON" });
    }
  }
  const links: string[] = [];
  const seen = new Set<string>();
  for (const a of Array.from(doc.querySelectorAll("a[href]"))) {
    const p = normalisePath(a.getAttribute("href") ?? "", origin);
    if (p && !seen.has(p)) { seen.add(p); links.push(p); }
  }
  const images = [...new Set(Array.from(doc.querySelectorAll("img[src]")).map((i) => i.getAttribute("src") ?? "").filter((x) => x && !x.startsWith("data:")))];
  const main = doc.querySelector("main") ?? doc.body;
  const text = (main?.textContent ?? "").replace(/\s+/g, " ").trim();
  return {
    path,
    lang: doc.documentElement.getAttribute("lang") ?? "",
    title: (doc.querySelector("title")?.textContent ?? "").trim(),
    description: meta("name", "description"),
    robots,
    noindex: /noindex/i.test(robots),
    nofollow: /nofollow/i.test(robots),
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
    og: { title: meta("property", "og:title"), description: meta("property", "og:description"), image: meta("property", "og:image"), url: meta("property", "og:url"), type: meta("property", "og:type") },
    twitterCard: meta("name", "twitter:card"),
    h1: Array.from(doc.querySelectorAll("h1")).map((h) => (h.textContent ?? "").replace(/\s+/g, " ").trim()),
    hreflang: Array.from(doc.querySelectorAll('link[rel="alternate"][hreflang]')).map((l) => ({ lang: l.getAttribute("hreflang") ?? "", href: l.getAttribute("href") ?? "" })),
    jsonld,
    links,
    images,
    words: text ? text.split(" ").length : 0,
  };
}

/** Fetch a page as a crawler would (no cookies) and inspect it. Needs a DOMParser (browser). */
export async function fetchAndInspect(path: string, origin: string, parse: (html: string) => Document, fetcher: typeof fetch = fetch): Promise<PageRecord> {
  const t0 = Date.now();
  try {
    const res = await fetcher(origin + path, { credentials: "omit", redirect: "follow", headers: { Accept: "text/html" } });
    const finalPath = normalisePath(res.url || origin + path, origin) ?? path;
    const html = await res.text();
    const base = inspectDocument(parse(html), path, origin);
    return { ...base, status: res.status, finalPath, redirected: res.redirected || finalPath !== path, ms: Date.now() - t0 };
  } catch (e) {
    return { path, status: 0, finalPath: path, redirected: false, ms: Date.now() - t0, lang: "", title: "", description: "", robots: "", noindex: false, nofollow: false, canonical: "", og: { title: "", description: "", image: "", url: "", type: "" }, twitterCard: "", h1: [], hreflang: [], jsonld: [], links: [], images: [], words: 0, error: e instanceof Error ? e.message : "Request failed" };
  }
}
