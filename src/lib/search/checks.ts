/**
 * Search audit checks over inspected pages (see inspect.ts). Covers what the base site audit
 * doesn't: canonicals, sitemap validity, structured data, hreflang, Open Graph, html lang,
 * duplicate descriptions and the internal-link graph. Every finding carries the evidence it was
 * based on. Titles, h1s, broken links and images stay in site-audit.ts so nothing is reported twice.
 */
import type { Finding, Severity } from "../site-audit";
import { ldEntities, type PageRecord } from "./inspect";
import { brokenLinkRate, orphanRate, schemaValidityRate, validSitemapRate } from "./metrics";

export interface SearchMetrics {
  checkedAt: string;
  pagesChecked: number;
  sitemapUrls: number;
  sitemapValid: number;
  validSitemapRate: number | null;
  indexablePages: number;
  orphans: number;
  orphanRate: number | null;
  linkOccurrences: number;
  brokenOccurrences: number;
  brokenUnique: number;
  brokenLinkRate: number | null;
  redirectingLinkOccurrences: number;
  schemaPagesTested: number;
  schemaPagesPassing: number;
  schemaValidityRate: number | null;
  schemaErrors: number;
  schemaWarnings: number;
  schemaTypes: Record<string, number>;
  duplicateTitles: number;
  duplicateDescriptions: number;
  missingCanonical: number;
  hreflangPages: number;
  hreflangErrors: number;
  /** Indexable pages linked from the site but missing from the sitemap. */
  missingFromSitemap: number;
  inbound: Record<string, number>;
}

/** Private or utility areas: never expected in the sitemap or the link graph. */
export const PRIVATE_PATH = /^\/(api|dashboard|portal|account|login|unsubscribe|community\/(settings|messages|notifications|saved|moderation|inbox|search)|ecommerce\/workspace)(\/|$)/;

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const isAbs = (u: string) => /^https?:\/\//i.test(u);

function canonicalPath(p: PageRecord, origin: string): string | null {
  if (!p.canonical) return null;
  try { const u = new URL(p.canonical, origin); return u.origin === origin ? (u.pathname.replace(/\/+$/, "") || "/") : null; } catch { return null; }
}

type Ent = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const has = (e: Ent, k: string) => e[k] !== undefined && e[k] !== null && e[k] !== "";

/** Validate one JSON-LD entity against the properties this site relies on. */
export function checkEntity(e: Ent, origin: string): { level: "error" | "warning"; msg: string }[] {
  const out: { level: "error" | "warning"; msg: string }[] = [];
  const t = ([] as unknown[]).concat(e["@type"] ?? []).map(String);
  const err = (msg: string) => out.push({ level: "error", msg });
  const warn = (msg: string) => out.push({ level: "warning", msg });
  if (!t.length) err("entity has no @type");
  const url = (k: string) => { const v = str(e[k]); if (v && !isAbs(v)) err(`${k} is not an absolute URL (${v.slice(0, 60)})`); };
  for (const k of ["url", "logo", "image", "mainEntityOfPage"]) if (typeof e[k] === "string") url(k);
  if (t.some((x) => ["Organization", "ProfessionalService", "LocalBusiness"].includes(x))) {
    if (!has(e, "name")) err(`${t[0]} without name`);
    if (!has(e, "url")) err(`${t[0]} without url`);
    if (t.includes("LocalBusiness") && !has(e, "address")) err("LocalBusiness without a verified address");
  }
  if (t.includes("WebSite") && (!has(e, "name") || !has(e, "url"))) err("WebSite needs name and url");
  if (t.includes("Person") && !has(e, "name")) err("Person without name");
  if (t.includes("Service")) { if (!has(e, "name")) err("Service without name"); if (!has(e, "provider")) warn("Service without provider"); }
  if (t.some((x) => x === "Article" || x === "BlogPosting" || x === "NewsArticle")) {
    if (!has(e, "headline")) err(`${t[0]} without headline`); else if (str(e.headline).length > 110) warn("headline longer than 110 characters");
    if (!has(e, "datePublished")) warn(`${t[0]} without datePublished`);
    else if (Number.isNaN(Date.parse(str(e.datePublished)))) err(`datePublished is not a date (${str(e.datePublished)})`);
    if (has(e, "dateModified") && has(e, "datePublished") && Date.parse(str(e.dateModified)) < Date.parse(str(e.datePublished))) err("dateModified is before datePublished");
    if (!has(e, "author")) warn(`${t[0]} without author`);
    if (!has(e, "image")) warn(`${t[0]} without image`);
  }
  if (t.includes("BreadcrumbList") || t.includes("ItemList")) {
    const items = Array.isArray(e.itemListElement) ? (e.itemListElement as Ent[]) : [];
    if (!items.length) err(`${t[0]} has no items`);
    items.forEach((it, i) => {
      if (Number(it.position) !== i + 1) err(`${t[0]} item ${i + 1} has position ${String(it.position)}`);
      const href = str(it.item) || str(it.url);
      if (t.includes("BreadcrumbList") && !has(it, "name")) err(`breadcrumb item ${i + 1} has no name`);
      if (href && (!isAbs(href) || !href.startsWith(origin))) err(`${t[0]} item ${i + 1} links off-site or relative (${href.slice(0, 60)})`);
      if (t.includes("BreadcrumbList") && !href && i < items.length - 1) err(`breadcrumb item ${i + 1} has no URL`);
    });
  }
  if (t.includes("FAQPage")) {
    const q = Array.isArray(e.mainEntity) ? (e.mainEntity as Ent[]) : [];
    if (!q.length) err("FAQPage without questions");
    q.forEach((x, i) => { if (!has(x, "name") || !has((x.acceptedAnswer as Ent) ?? {}, "text")) err(`FAQ item ${i + 1} needs a question and an answer`); });
  }
  if (t.includes("AggregateRating") || has(e, "aggregateRating")) warn("aggregateRating present: only allowed for genuine, collected ratings shown on the page");
  if (t.includes("Review") || has(e, "review")) warn("review markup present: only allowed for genuine reviews shown on the page");
  return out;
}

export function searchChecks(pages: PageRecord[], opts: { origin: string; sitemap: string[] }): { findings: Finding[]; metrics: SearchMetrics } {
  const { origin } = opts;
  const findings: Finding[] = [];
  const add = (f: Omit<Finding, "key" | "confirmed">) => findings.push({ ...f, confirmed: true, key: `${f.type}:${f.route}:${f.evidence}`.slice(0, 300) });
  const byPath = new Map(pages.map((p) => [p.path, p]));
  const sitemap = [...new Set(opts.sitemap)];
  const sitemapSet = new Set(sitemap);
  const okPage = (p?: PageRecord) => !!p && p.status === 200 && !p.redirected;
  const indexable = pages.filter((p) => okPage(p) && !p.noindex && !PRIVATE_PATH.test(p.path));

  // --- Canonicals, Open Graph, lang
  let missingCanonical = 0;
  for (const p of indexable) {
    const cp = canonicalPath(p, origin);
    if (!p.canonical) { missingCanonical++; add({ type: "canonical-missing", severity: "medium", route: p.path, title: "Indexable page has no canonical URL", evidence: 'No <link rel="canonical"> in the server HTML', fix: "pageHead() adds one unless the page is noindex; check the route's head()." }); continue; }
    if (!isAbs(p.canonical) || (!p.canonical.startsWith(origin + "/") && p.canonical !== origin)) add({ type: "canonical-origin", severity: "high", route: p.path, title: "Canonical points to another origin or is relative", evidence: p.canonical, fix: `Canonicals must be absolute ${origin} URLs (SITE_URL).` });
    else if (/[?#]/.test(p.canonical)) add({ type: "canonical-query", severity: "medium", route: p.path, title: "Canonical URL contains a query or fragment", evidence: p.canonical, fix: "Use the clean path as the canonical." });
    else if (cp && cp !== p.path) {
      const target = byPath.get(cp);
      if (cp === "/") add({ type: "canonical-home", severity: "high", route: p.path, title: "Canonical points an unrelated page at the homepage", evidence: p.canonical, fix: "Give the page a self-referencing canonical." });
      else if (target && (!okPage(target) || target.noindex)) add({ type: "canonical-target", severity: "high", route: p.path, title: `Canonical target ${cp} isn't an indexable 200 page`, evidence: `${cp}: HTTP ${target.status}${target.noindex ? ", noindex" : ""}${target.redirected ? ", redirects" : ""}`, fix: "Point the canonical at the live page that should rank." });
      else if (target && canonicalPath(target, origin) !== cp) add({ type: "canonical-chain", severity: "medium", route: p.path, title: "Canonical chain", evidence: `${p.path} → ${cp} → ${canonicalPath(target, origin)}`, fix: "Point the canonical straight at the final page." });
      else add({ type: "canonical-other", severity: "info", route: p.path, title: `Canonical points to ${cp}`, evidence: p.canonical, fix: "Fine when this page duplicates the target on purpose (e.g. expertise → service); otherwise make it self-referencing." });
    }
    if (p.og.url && p.canonical && p.og.url !== p.canonical) add({ type: "og-url", severity: "low", route: p.path, title: "og:url differs from the canonical", evidence: `og:url ${p.og.url} vs canonical ${p.canonical}`, fix: "Share URLs should match the canonical." });
    if (!p.og.title || !p.og.image) add({ type: "og-missing", severity: "low", route: p.path, title: "Missing Open Graph title or image", evidence: `og:title ${p.og.title ? "set" : "missing"}, og:image ${p.og.image ? "set" : "missing"}`, fix: "pageHead() sets both; check the route." });
    if (!p.lang) add({ type: "lang", severity: "low", route: p.path, title: "No html lang attribute", evidence: "<html> has no lang", fix: "Set the document language." });
  }

  // --- Duplicate descriptions (titles are checked by the base audit)
  const descs = new Map<string, string[]>();
  for (const p of indexable) if (p.description && (canonicalPath(p, origin) ?? p.path) === p.path) descs.set(norm(p.description), [...(descs.get(norm(p.description)) ?? []), p.path]);
  let duplicateDescriptions = 0;
  for (const [d, rs] of descs) if (rs.length > 1) { duplicateDescriptions++; add({ type: "dup-description", severity: "low", route: rs[0], title: `${rs.length} pages share one meta description`, evidence: `"${d.slice(0, 80)}" on ${rs.slice(0, 4).join(", ")}${rs.length > 4 ? "…" : ""}`, fix: "Describe each page's own content.", data: { routes: rs } }); }
  const titles = new Map<string, number>();
  for (const p of indexable) if (p.title && (canonicalPath(p, origin) ?? p.path) === p.path) titles.set(norm(p.title), (titles.get(norm(p.title)) ?? 0) + 1);
  const duplicateTitles = [...titles.values()].filter((n) => n > 1).length;

  // --- Sitemap validity
  let sitemapValid = 0;
  for (const s of sitemap) {
    const p = byPath.get(s);
    const problems: string[] = [];
    if (!p) problems.push("not fetched");
    else {
      if (p.status !== 200) problems.push(`HTTP ${p.status || "no response"}`);
      if (p.redirected) problems.push(`redirects to ${p.finalPath}`);
      if (p.noindex) problems.push("noindex");
      const cp = canonicalPath(p, origin);
      if (p.status === 200 && !p.noindex && cp !== s) problems.push(cp ? `canonical is ${cp}` : "no canonical");
      if (PRIVATE_PATH.test(s)) problems.push("private area");
    }
    if (!problems.length) sitemapValid++;
    else add({ type: "sitemap", severity: problems.some((x) => /HTTP|noindex|private/.test(x)) ? "high" : "medium", route: s, title: "Sitemap URL isn't a clean, indexable canonical page", evidence: problems.join("; "), fix: "List only canonical, indexable 200 pages in the sitemap (seo-routes.ts)." });
  }

  // --- Link graph
  const inbound: Record<string, number> = Object.fromEntries(sitemap.map((s) => [s, 0]));
  let linkOccurrences = 0, brokenOccurrences = 0, redirectingLinkOccurrences = 0;
  const brokenTargets = new Set<string>();
  for (const p of pages) {
    if (!okPage(p) || p.noindex || PRIVATE_PATH.test(p.path)) continue;
    for (const l of p.links) {
      if (PRIVATE_PATH.test(l) || l === p.path) continue;
      linkOccurrences++;
      if (l in inbound) inbound[l]++;
      const t = byPath.get(l);
      if (!t) continue;
      if (t.status === 0 || t.status >= 400) { brokenOccurrences++; brokenTargets.add(l); }
      else if (t.redirected) { redirectingLinkOccurrences++; add({ type: "link-redirect", severity: "low", route: p.path, title: `Internal link goes through a redirect (${l})`, evidence: `${l} → ${t.finalPath}`, fix: `Link straight to ${t.finalPath}.`, data: { target: l } }); }
      else { const cp = canonicalPath(t, origin); if (t.status === 200 && !t.noindex && cp && cp !== l) add({ type: "link-noncanonical", severity: "info", route: p.path, title: `Internal link to a non-canonical URL (${l})`, evidence: `${l} canonicalises to ${cp}`, fix: `Link to ${cp} where it makes sense.`, data: { target: l } }); }
    }
  }
  const orphanList = sitemap.filter((s) => s !== "/" && inbound[s] === 0 && okPage(byPath.get(s)));
  for (const o of orphanList) add({ type: "orphan", severity: "medium", route: o, title: "No internal links point to this page", evidence: "0 links from other indexable pages in the server HTML", fix: "Link to it from a related service, category or article where it genuinely helps." });
  let missingFromSitemap = 0;
  for (const p of indexable) if (!sitemapSet.has(p.path) && (canonicalPath(p, origin) ?? p.path) === p.path) { missingFromSitemap++; add({ type: "sitemap-missing", severity: "info", route: p.path, title: "Indexable page isn't in the sitemap", evidence: "200, indexable, self-canonical, linked from the site", fix: "Add it to seo-routes.ts if it should be found in search, or mark it noindex." }); }

  // --- Structured data
  let schemaPagesTested = 0, schemaPagesPassing = 0, schemaErrors = 0, schemaWarnings = 0;
  const schemaTypes: Record<string, number> = {};
  for (const p of indexable) {
    if (!p.jsonld.length) continue;
    schemaPagesTested++;
    let pageErr = 0;
    const idTypes = new Map<string, string>();
    for (const b of p.jsonld) {
      if (b.error) { pageErr++; schemaErrors++; add({ type: "schema-parse", severity: "high", route: p.path, title: "Structured data isn't valid JSON", evidence: b.error, fix: "Fix the JSON-LD builder for this page." }); continue; }
      for (const e of ldEntities(b.raw)) {
        const t = ([] as unknown[]).concat(e["@type"] ?? []).map(String).join(",");
        for (const x of t.split(",").filter(Boolean)) schemaTypes[x] = (schemaTypes[x] ?? 0) + 1;
        const id = str(e["@id"]);
        if (id) { const prev = idTypes.get(id); if (prev && prev !== t) { schemaWarnings++; add({ type: "schema-conflict", severity: "medium", route: p.path, title: "One @id is described with two different types", evidence: `${id}: ${prev} vs ${t}`, fix: "Emit each entity once per page with one type." }); } idTypes.set(id, t); }
        for (const r of checkEntity(e, origin)) {
          if (r.level === "error") { pageErr++; schemaErrors++; } else schemaWarnings++;
          add({ type: r.level === "error" ? "schema-error" : "schema-warning", severity: (r.level === "error" ? "medium" : "low") as Severity, route: p.path, title: `${t || "Structured data"}: ${r.msg}`, evidence: `${t}${id ? ` ${id}` : ""}`, fix: "Correct the JSON-LD builder (lib/seo.ts) so it matches the visible page." });
        }
      }
    }
    if (!pageErr) schemaPagesPassing++;
  }

  // --- hreflang
  let hreflangPages = 0, hreflangErrors = 0;
  for (const p of indexable) {
    if (!p.hreflang.length) continue;
    hreflangPages++;
    const bad = (msg: string) => { hreflangErrors++; add({ type: "hreflang", severity: "medium", route: p.path, title: "hreflang problem", evidence: msg, fix: "Every language version lists all versions, including itself, with absolute URLs, and the others list it back." }); };
    const selfUrl = p.canonical;
    if (!p.hreflang.some((h) => h.href === selfUrl)) bad("doesn't list itself");
    if (!p.hreflang.some((h) => h.lang === "x-default")) bad("no x-default");
    for (const h of p.hreflang) {
      if (!/^(x-default|[a-z]{2,3}(-[A-Za-z]{2,4})?)$/.test(h.lang)) bad(`invalid language code "${h.lang}"`);
      if (!isAbs(h.href)) { bad(`relative URL ${h.href}`); continue; }
      let tp: string; try { tp = new URL(h.href).pathname.replace(/\/+$/, "") || "/"; } catch { bad(`bad URL ${h.href}`); continue; }
      const t = byPath.get(tp);
      if (h.lang !== "x-default" && t && okPage(t) && !t.hreflang.some((x) => x.href === selfUrl)) bad(`${tp} (${h.lang}) doesn't link back`);
      if (t && !okPage(t)) bad(`${tp} returns ${t.status}`);
    }
    const selfLang = p.hreflang.find((h) => h.href === selfUrl)?.lang;
    if (selfLang && selfLang !== "x-default" && p.lang && p.lang.split("-")[0] !== selfLang.split("-")[0]) bad(`html lang "${p.lang}" but hreflang says "${selfLang}"`);
  }

  const metrics: SearchMetrics = {
    checkedAt: new Date().toISOString(),
    pagesChecked: pages.length,
    sitemapUrls: sitemap.length,
    sitemapValid,
    validSitemapRate: validSitemapRate(sitemapValid, sitemap.length),
    indexablePages: indexable.length,
    orphans: orphanList.length,
    orphanRate: orphanRate(orphanList.length, sitemap.filter((s) => okPage(byPath.get(s))).length),
    linkOccurrences, brokenOccurrences, brokenUnique: brokenTargets.size,
    brokenLinkRate: brokenLinkRate(brokenOccurrences, linkOccurrences),
    redirectingLinkOccurrences,
    schemaPagesTested, schemaPagesPassing,
    schemaValidityRate: schemaValidityRate(schemaPagesPassing, schemaPagesTested),
    schemaErrors, schemaWarnings, schemaTypes,
    duplicateTitles, duplicateDescriptions, missingCanonical,
    hreflangPages, hreflangErrors, missingFromSitemap,
    inbound,
  };
  return { findings, metrics };
}

/** Parse sitemap XML into normalised paths on this origin. */
export function sitemapPathsFromXml(xml: string, origin: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&")).filter((u) => u.startsWith(origin)).map((u) => new URL(u).pathname.replace(/\/+$/, "") || "/");
}
