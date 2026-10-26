/**
 * Website auditor that runs in the admin's browser against the live site: fetches every public
 * page as a visitor would (server-rendered HTML), then checks status, title, description, h1,
 * canonical, noindex, every image on the page and every internal link. Every finding carries the
 * evidence it was based on; nothing is guessed. Results can be saved to `site_audit_reports`.
 */
import { pageIndex } from "./page-index";
import { PROJECTS, featuredFor, projectSlug } from "./portfolio-data";

export type Severity = "high" | "medium" | "low" | "info";
export interface Finding { key: string; type: string; severity: Severity; route: string; title: string; evidence: string; fix: string; confirmed: boolean }
export interface PageResult { route: string; status: number; ms: number; title: string; description: string; h1: number; canonical: string; noindex: boolean; images: string[]; links: string[]; error?: string }
export interface AuditRun { pages: PageResult[]; findings: Finding[]; images: { src: string; ok: boolean; pages: string[] }[]; startedAt: string; finishedAt: string }

const SKIP_LINK = /^\/(api|dashboard|portal|account|login|community\/(settings|messages|notifications|saved|moderation|inbox))/;

async function fetchPage(route: string): Promise<PageResult> {
  const t0 = performance.now();
  try {
    const res = await fetch(route, { credentials: "omit", redirect: "follow", headers: { Accept: "text/html" } });
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const meta = (n: string) => doc.querySelector(`meta[name="${n}"]`)?.getAttribute("content")?.trim() ?? "";
    const images = Array.from(doc.querySelectorAll("img[src]")).map((i) => i.getAttribute("src")!).filter((s) => !s.startsWith("data:"));
    const links = Array.from(doc.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")!).filter((h) => h.startsWith("/") && !h.startsWith("//")).map((h) => h.split("#")[0].split("?")[0] || "/");
    return {
      route, status: res.status, ms: Math.round(performance.now() - t0), title: doc.title.trim(), description: meta("description"), h1: doc.querySelectorAll("h1").length,
      canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "", noindex: /noindex/i.test(meta("robots")), images: [...new Set(images)], links: [...new Set(links)],
    };
  } catch (e) {
    return { route, status: 0, ms: Math.round(performance.now() - t0), title: "", description: "", h1: 0, canonical: "", noindex: false, images: [], links: [], error: e instanceof Error ? e.message : "Request failed" };
  }
}

function checkImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image(); const timer = window.setTimeout(() => resolve(false), 10000);
    img.onload = () => { window.clearTimeout(timer); resolve(img.naturalWidth > 0); };
    img.onerror = () => { window.clearTimeout(timer); resolve(false); };
    img.referrerPolicy = "no-referrer"; img.src = src;
  });
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>, onDone: () => void): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); onDone(); } }));
  return out;
}

export async function runAudit(opts: { routes?: string[]; onProgress?: (done: number, total: number, phase: string) => void; signal?: { cancelled: boolean } } = {}): Promise<AuditRun> {
  const startedAt = new Date().toISOString();
  const routes = opts.routes ?? [...new Set(pageIndex().map((p) => p.href).filter((h) => h.startsWith("/")))];
  let done = 0; const total = routes.length;
  const pages = await pool(routes, 4, (r) => (opts.signal?.cancelled ? Promise.resolve({ route: r, status: -1, ms: 0, title: "", description: "", h1: 0, canonical: "", noindex: false, images: [], links: [] } as PageResult) : fetchPage(r)), () => opts.onProgress?.(++done, total, "Pages"));

  // Internal links that point outside the scanned set get checked too.
  const scanned = new Set(routes);
  const extra = [...new Set(pages.flatMap((p) => p.links))].filter((l) => !scanned.has(l) && !SKIP_LINK.test(l)).slice(0, 300);
  done = 0;
  const extraPages = await pool(extra, 4, (r) => fetchPage(r), () => opts.onProgress?.(++done, extra.length, "Linked pages"));
  const statusOf = new Map([...pages, ...extraPages].map((p) => [p.route, p.status]));

  const imgPages = new Map<string, string[]>();
  for (const p of pages) for (const src of p.images) imgPages.set(src, [...(imgPages.get(src) ?? []), p.route]);
  const srcs = [...imgPages.keys()];
  done = 0;
  const imgOk = await pool(srcs, 6, checkImage, () => opts.onProgress?.(++done, srcs.length, "Images"));
  const images = srcs.map((src, i) => ({ src, ok: imgOk[i], pages: imgPages.get(src)! }));

  const findings: Finding[] = [];
  const add = (f: Omit<Finding, "key">) => findings.push({ ...f, key: `${f.type}:${f.route}:${f.evidence}`.slice(0, 300) });
  const titles = new Map<string, string[]>();
  for (const p of pages) {
    if (p.status === -1) continue;
    if (p.status === 0 || p.status >= 400) { add({ type: "route", severity: "high", route: p.route, title: `Page returns ${p.status || "no response"}`, evidence: p.error ?? `HTTP ${p.status}`, fix: "Check the route and its loader; restore the page or add a redirect.", confirmed: true }); continue; }
    if (!p.title) add({ type: "title", severity: "medium", route: p.route, title: "Missing page title", evidence: "<title> is empty", fix: "Set a title in the route's head().", confirmed: true });
    else titles.set(p.title, [...(titles.get(p.title) ?? []), p.route]);
    if (!p.description) add({ type: "description", severity: "low", route: p.route, title: "Missing meta description", evidence: 'No <meta name="description">', fix: "Add a description in pageHead().", confirmed: true });
    if (p.h1 !== 1) add({ type: "h1", severity: "medium", route: p.route, title: p.h1 === 0 ? "No main heading (h1)" : `${p.h1} main headings (h1)`, evidence: `${p.h1} <h1> elements in the server HTML`, fix: "Each page should have exactly one h1.", confirmed: true });
    if (p.noindex && !/^\/(inspiration\/|community\/|dashboard|portal|account|login|unsubscribe)/.test(p.route)) add({ type: "noindex", severity: "info", route: p.route, title: "Page is hidden from search engines", evidence: "robots meta contains noindex", fix: "Confirm this is intended.", confirmed: true });
    if (p.ms > 4000) add({ type: "slow", severity: "low", route: p.route, title: `Slow server response (${(p.ms / 1000).toFixed(1)} s)`, evidence: `${p.ms} ms to first full HTML from your browser`, fix: "Check the route's loader and any server calls.", confirmed: true });
    for (const l of p.links) { const st = statusOf.get(l); if (st !== undefined && (st === 0 || st >= 400)) add({ type: "link", severity: "high", route: p.route, title: `Broken internal link to ${l}`, evidence: `${l} returned ${st || "no response"}`, fix: "Point the link at an existing route.", confirmed: true }); }
  }
  for (const [t, rs] of titles) if (rs.length > 1) add({ type: "dup-title", severity: "low", route: rs[0], title: `${rs.length} pages share the same title`, evidence: `"${t.slice(0, 80)}" on ${rs.slice(0, 4).join(", ")}${rs.length > 4 ? "…" : ""}`, fix: "Give each page a distinct title.", confirmed: true });
  for (const im of images) if (!im.ok) add({ type: "image", severity: "high", route: im.pages[0], title: "Image fails to load", evidence: `${im.src.slice(0, 160)} (on ${im.pages.length} page${im.pages.length > 1 ? "s" : ""})`, fix: "Replace the file or URL; cards now fall back to a labelled preview meanwhile.", confirmed: true });
  // Asset completeness (from the owner's portfolio records, not from the scan).
  for (const p of PROJECTS) if (!featuredFor(p.name)) add({ type: "asset", severity: "info", route: `/portfolio/${projectSlug(p.name)}`, title: `${p.name}: stock photo instead of a real screenshot`, evidence: "portfolio-data marks PROJECTS images as stand-ins", fix: "Add the client's own screenshot to portfolio-data.", confirmed: true });

  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2, info: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return { pages: [...pages, ...extraPages], findings, images, startedAt, finishedAt: new Date().toISOString() };
}
