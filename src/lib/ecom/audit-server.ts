/**
 * Public store audit (server-only). Fetches a small, bounded set of public pages — the address
 * given, up to two product pages, robots.txt, the sitemap and a sample of internal links — and turns
 * what it sees into findings. Every finding is an observation of the public page; the audit never
 * claims to know private data such as traffic, conversion rate or sales.
 */
import { detectPlatform, type Adapter } from "./platforms";
import { productLinks, readPage, type PageFacts } from "./extract";

const UA = "Mozilla/5.0 (compatible; EmmaForYouStoreAudit/1.0; +https://emmaforyou.lovable.app/ecommerce)";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const MAX_BYTES = 2_500_000;

export function publicUrl(raw: string): URL | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
    if (u.port && !["80", "443"].includes(u.port)) return null;
    const h = u.hostname.toLowerCase();
    if (!h.includes(".") || /^[\d.]+$/.test(h) || h.includes(":") || /(^|\.)(localhost|local|internal|lan|home|corp|test|invalid|example)$/.test(h)) return null;
    u.hash = "";
    return u;
  } catch { return null; }
}

export interface Fetched { ok: boolean; status: number; url: URL; html: string; headers: Headers | null; ms: number; redirected: boolean; error?: string }
export async function fetchPage(url: URL, ms = 12000, method: "GET" | "HEAD" = "GET"): Promise<Fetched> {
  const t0 = Date.now();
  for (const ua of [UA, BROWSER_UA]) {
    try {
      // Redirects are followed by hand so every hop is checked before it is requested (SSRF protection).
      const signal = AbortSignal.timeout(ms);
      let current = url; let res: Response | null = null; let hops = 0;
      for (;;) {
        res = await fetch(current.toString(), { method, redirect: "manual", signal, headers: { "User-Agent": ua, Accept: "text/html,application/xhtml+xml,*/*;q=0.8", "Accept-Language": "en;q=0.9,*;q=0.5" } });
        const loc = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
        if (!loc) break;
        try { await res.body?.cancel(); } catch { /* ignore */ }
        const next = (() => { try { return publicUrl(new URL(loc, current).toString()); } catch { return null; } })();
        if (!next) return { ok: false, status: res.status, url, html: "", headers: null, ms: Date.now() - t0, redirected: true, error: "redirected to a non-public address" };
        if (++hops > 5) return { ok: false, status: res.status, url, html: "", headers: null, ms: Date.now() - t0, redirected: true, error: "too many redirects" };
        current = next;
      }
      const final = current;
      if ((res.status === 403 || res.status === 429 || res.status === 503) && ua === UA) continue;
      let html = "";
      if (method === "GET") {
        const reader = res.body?.getReader();
        if (reader) { const dec = new TextDecoder(); let size = 0; while (size < MAX_BYTES) { const { done, value } = await reader.read(); if (done || !value) break; size += value.length; html += dec.decode(value, { stream: true }); } try { await reader.cancel(); } catch { /* done */ } }
      }
      return { ok: res.ok, status: res.status, url: final, html, headers: res.headers, ms: Date.now() - t0, redirected: hops > 0 };
    } catch (e) {
      if (ua === BROWSER_UA) return { ok: false, status: 0, url, html: "", headers: null, ms: Date.now() - t0, redirected: false, error: e instanceof Error && e.name === "TimeoutError" ? "timed out" : "unreachable" };
    }
  }
  return { ok: false, status: 0, url, html: "", headers: null, ms: Date.now() - t0, redirected: false, error: "blocked" };
}

async function pageSpeed(url: string): Promise<{ performance?: number; accessibility?: number; seo?: number; lcp?: string; cls?: string; tbt?: string } | null> {
  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", url); api.searchParams.set("strategy", "mobile");
  for (const c of ["performance", "accessibility", "seo"]) api.searchParams.append("category", c);
  const key = process.env["PAGESPEED_API_KEY"]; if (key) api.searchParams.set("key", key);
  try {
    const res = await fetch(api.toString(), { signal: AbortSignal.timeout(50000) });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lh: any = (await res.json())?.lighthouseResult;
    if (!lh) return null;
    const pct = (k: string) => (typeof lh.categories?.[k]?.score === "number" ? Math.round(lh.categories[k].score * 100) : undefined);
    return { performance: pct("performance"), accessibility: pct("accessibility"), seo: pct("seo"), lcp: lh.audits?.["largest-contentful-paint"]?.displayValue, cls: lh.audits?.["cumulative-layout-shift"]?.displayValue, tbt: lh.audits?.["total-blocking-time"]?.displayValue };
  } catch { return null; }
}

export type Category = "technical" | "seo" | "conversion" | "product";
export interface AuditFinding {
  id: string; category: Category; title: string; severity: "high" | "medium" | "low"; pass: boolean;
  confidence: "observed" | "partly observed"; evidence: string; affected: string[]; impact: string; fix: string; steps: string[]; effort: "quick" | "moderate" | "larger"; verify: string;
}
export interface StoreAudit {
  url: string; finalUrl: string; scannedAt: string;
  platform: { id: string; name: string; kind: Adapter["kind"]; signals: string[]; notes?: string; connected: Adapter["caps"]["connected"] };
  pages: { url: string; status: number; ms: number; kind: string; error?: string }[];
  pagespeed: Awaited<ReturnType<typeof pageSpeed>> | "unavailable";
  scores: Record<Category, number>; overall: number;
  findings: AuditFinding[]; product: PageFacts["product"]; limits: string[];
}

export async function auditStore(input: string): Promise<{ ok: true; audit: StoreAudit } | { ok: false; error: string }> {
  const start = publicUrl(input);
  if (!start) return { ok: false, error: "Enter a public web address, for example https://yourstore.com." };
  const psPromise = pageSpeed(start.toString());
  const home = await fetchPage(start, 15000);
  if (!home.ok || !home.html) {
    return { ok: false, error: home.status ? `The page answered with HTTP ${home.status}${home.status === 403 || home.status === 503 ? ": the site blocks automated visits. You can paste the product details into Product Research instead." : "."}` : `We couldn't reach that address (${home.error ?? "unreachable"}). Check it opens in your browser.` };
  }
  const { adapter, signals } = detectPlatform(home.url, home.html, home.headers ?? {});
  const homeFacts = readPage(home.url, home.html);
  const pages: StoreAudit["pages"] = [{ url: home.url.toString(), status: home.status, ms: home.ms, kind: "Page you entered" }];
  const limits: string[] = ["A public scan can't see your traffic, conversion rate, orders or profit. Use Sales Diagnosis and the Profit Analyzer with your own numbers for those."];
  if (adapter.caps.notes) limits.push(adapter.caps.notes);

  // Product pages: the address itself if it is one, else up to two linked from it.
  const isProduct = Boolean(homeFacts.product) || (adapter.productPath?.test(home.url.pathname) ?? false);
  const productFacts: PageFacts[] = isProduct ? [homeFacts] : [];
  if (!isProduct) {
    for (const href of productLinks(homeFacts, adapter.productPath, 2)) {
      const u = publicUrl(href); if (!u) continue;
      const r = await fetchPage(u, 10000);
      pages.push({ url: u.toString(), status: r.status, ms: r.ms, kind: "Product page", error: r.error });
      if (r.ok && r.html) productFacts.push(readPage(r.url, r.html));
    }
    if (!productFacts.length) limits.push("No product page was found from this address, so product-page checks were skipped. Audit a product page's address to include them.");
  }

  // robots.txt, sitemap and a sample of internal links (HEAD, bounded).
  const origin = `${home.url.protocol}//${home.url.host}`;
  const [robots, sitemap] = await Promise.all([fetchPage(new URL("/robots.txt", origin), 6000), fetchPage(new URL("/sitemap.xml", origin), 6000, "HEAD")]);
  const sample = homeFacts.internalLinks.filter((h) => !/\/(cart|checkout|account|login|search)\b/i.test(h)).slice(0, 10);
  const linkResults = await Promise.all(sample.map(async (h) => { const u = publicUrl(h); if (!u) return null; const r = await fetchPage(u, 6000, "HEAD"); return { url: h, status: r.status }; }));
  const broken = linkResults.filter((r): r is { url: string; status: number } => Boolean(r) && (r!.status === 404 || r!.status === 410 || r!.status >= 500));
  const ps = await psPromise;

  const F: AuditFinding[] = [];
  const add = (f: Omit<AuditFinding, "confidence"> & { confidence?: AuditFinding["confidence"] }) => F.push({ confidence: "observed", ...f });
  const homeUrl = home.url.toString();
  const pf = productFacts[0];

  // Technical
  add({ id: "https", category: "technical", title: "Served securely over HTTPS", severity: "high", pass: home.url.protocol === "https:", evidence: home.url.protocol === "https:" ? "The page loads over HTTPS." : "The page loads over plain HTTP.", affected: [homeUrl], impact: "Browsers warn shoppers on insecure pages, which stops many from buying.", fix: "Turn on SSL for the domain and redirect all HTTP traffic to HTTPS.", steps: ["Enable the free SSL certificate in your platform or host settings", "Force HTTPS redirects", "Re-run this audit"], effort: "quick", verify: "The address starts with https:// and shows a padlock." });
  add({ id: "mixed", category: "technical", title: "No insecure (http://) files on secure pages", severity: "medium", pass: homeFacts.mixedContent === 0, evidence: homeFacts.mixedContent ? `${homeFacts.mixedContent} image/script/link addresses use http:// on an https page.` : "No insecure file addresses found.", affected: [homeUrl], impact: "Insecure files can be blocked by the browser or trigger security warnings.", fix: "Change those file addresses to https://.", steps: ["Search your theme and content for http:// links", "Replace them with https://"], effort: "quick", verify: "Re-run the audit: 0 insecure files." });
  add({ id: "speed-response", category: "technical", title: "Server responds quickly", severity: "medium", pass: home.ms < 1500, evidence: `First page answered in ${(home.ms / 1000).toFixed(1)}s from our server.`, affected: [homeUrl], impact: "Slow first responses delay everything else on the page.", fix: "Use your platform's CDN/caching and remove heavy apps or redirects.", steps: ["Remove apps you don't use", "Enable caching/CDN", "Avoid redirect chains on the home page"], effort: "moderate", verify: "Response under 1.5s on re-scan." });
  add({ id: "weight", category: "technical", title: "Page HTML is a reasonable size", severity: "low", pass: homeFacts.sizeKb < 600, evidence: `The page's HTML is ${homeFacts.sizeKb} KB with ${homeFacts.scripts} script tags.`, affected: [homeUrl], impact: "Very large pages load slowly on mobile data.", fix: "Remove unused sections, apps and inline scripts.", steps: ["Audit installed apps and theme sections", "Remove what you don't use"], effort: "moderate", verify: "HTML under 600 KB on re-scan." });
  add({ id: "viewport", category: "technical", title: "Set up for mobile screens", severity: "high", pass: homeFacts.viewport, evidence: homeFacts.viewport ? "A mobile viewport tag is present." : "No mobile viewport tag: phones will show a zoomed-out desktop page.", affected: [homeUrl], impact: "Most shoppers browse on phones.", fix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> or use a mobile-ready theme.", steps: ["Switch to a responsive theme or add the viewport tag"], effort: "quick", verify: "The tag appears on re-scan; the page fits a phone screen." });
  if (ps && typeof ps.performance === "number") {
    add({ id: "pagespeed", category: "technical", title: "Mobile performance (Google PageSpeed)", severity: ps.performance < 50 ? "high" : "medium", pass: ps.performance >= 70, evidence: `Google PageSpeed mobile score ${ps.performance}/100${ps.lcp ? `; largest content shown after ${ps.lcp}` : ""}${ps.tbt ? `; blocking time ${ps.tbt}` : ""}.`, affected: [homeUrl], impact: "Slow mobile pages lose visitors before they see products.", fix: "Compress and resize images, lazy-load below-the-fold images, remove unused apps and scripts.", steps: ["Convert large images to WebP and resize to display size", "Remove or defer third-party scripts", "Re-test with PageSpeed"], effort: "moderate", verify: "Score of 70+ on re-scan." });
  } else limits.push("Google PageSpeed didn't return a result for this page in time, so speed scores aren't included.");
  const robotsBlocks = robots.ok && /user-agent:\s*\*[\s\S]*?disallow:\s*\/\s*($|\n)/i.test(robots.html);
  add({ id: "robots", category: "technical", title: "Search engines may crawl the store", severity: "high", pass: !robotsBlocks && !/noindex/i.test(homeFacts.robots), evidence: robotsBlocks ? "robots.txt blocks all crawlers (Disallow: /)." : /noindex/i.test(homeFacts.robots) ? `The page says robots "${homeFacts.robots}".` : robots.ok ? "robots.txt allows crawling and the page isn't set to noindex." : "No robots.txt found (crawling is allowed by default).", affected: [homeUrl], impact: "Blocked pages can't appear in Google.", fix: "Remove the site-wide Disallow or the noindex tag (many platforms set it while a store is password-protected).", steps: ["Check store visibility/password settings", "Remove noindex", "Request indexing in Google Search Console"], effort: "quick", verify: "No blocking rule on re-scan." });
  add({ id: "sitemap", category: "technical", title: "Sitemap available", severity: "low", pass: sitemap.ok || /sitemap:/i.test(robots.html), evidence: sitemap.ok ? "/sitemap.xml answers." : /sitemap:/i.test(robots.html) ? "robots.txt lists a sitemap." : "No sitemap found at /sitemap.xml or in robots.txt.", affected: [origin], impact: "Sitemaps help search engines find every product.", fix: "Publish a sitemap (most platforms do this automatically) and submit it in Search Console.", steps: ["Find your platform's sitemap setting", "Submit it in Google Search Console"], effort: "quick", verify: "/sitemap.xml opens." });
  add({ id: "broken", category: "technical", title: "Internal links work", severity: broken.length > 2 ? "high" : "medium", pass: broken.length === 0, evidence: sample.length ? `${broken.length} of ${linkResults.filter(Boolean).length} sampled links failed.` : "No internal links to sample.", affected: broken.map((b) => `${b.url} (HTTP ${b.status})`), impact: "Broken links frustrate shoppers and waste search engine crawling.", fix: "Fix or redirect each broken link.", steps: ["Open each listed link", "Update the menu/link or add a redirect"], effort: "quick", verify: "0 broken links on re-scan." });

  // SEO
  const t = homeFacts.title;
  add({ id: "title", category: "seo", title: "Clear page title", severity: "medium", pass: t.length >= 15 && t.length <= 65, evidence: t ? `"${t.slice(0, 90)}" (${t.length} characters).` : "No title.", affected: [homeUrl], impact: "The title is the headline shown in Google results.", fix: "Write a 30–60 character title: what you sell + your brand.", steps: ["Edit the page's SEO title in your platform"], effort: "quick", verify: "Title between 15 and 65 characters." });
  add({ id: "meta", category: "seo", title: "Meta description present", severity: "low", pass: homeFacts.description.length >= 50, evidence: homeFacts.description ? `${homeFacts.description.length} characters.` : "Missing.", affected: [homeUrl], impact: "A good description earns more clicks from search results.", fix: "Write a 120–160 character description with your offer and a reason to click.", steps: ["Edit the SEO description"], effort: "quick", verify: "Description present on re-scan." });
  add({ id: "h1", category: "seo", title: "One main heading (H1)", severity: "low", pass: homeFacts.h1.length === 1, evidence: homeFacts.h1.length ? `${homeFacts.h1.length} H1 heading(s): "${homeFacts.h1[0].slice(0, 70)}".` : "No H1 heading.", affected: [homeUrl], impact: "A clear main heading helps shoppers and search engines understand the page.", fix: "Use exactly one H1 that says what the page offers.", steps: ["Adjust the theme heading settings"], effort: "quick", verify: "One H1 on re-scan." });
  add({ id: "alt", category: "seo", title: "Images have descriptions (alt text)", severity: "low", pass: homeFacts.images === 0 || homeFacts.imagesNoAlt / homeFacts.images <= 0.2, evidence: `${homeFacts.imagesNoAlt} of ${homeFacts.images} images have no alt text.`, affected: [homeUrl], impact: "Alt text helps image search and shoppers using screen readers.", fix: "Add short, specific alt text to product and banner images.", steps: ["Edit each image's alt text in your platform"], effort: "moderate", verify: "Under 20% of images without alt text." });
  add({ id: "canonical", category: "seo", title: "Canonical address set", severity: "low", pass: Boolean(homeFacts.canonical), evidence: homeFacts.canonical ? `Canonical: ${homeFacts.canonical.slice(0, 100)}` : "No canonical link.", affected: [homeUrl], impact: "Prevents duplicate versions of a page competing in search.", fix: "Most platforms add this automatically; check your theme.", steps: ["Add a canonical link tag"], effort: "quick", verify: "Canonical present on re-scan." });
  add({ id: "org", category: "seo", title: "Business details for search engines", severity: "low", pass: homeFacts.organization, evidence: homeFacts.organization ? "Organization/Store structured data found." : "No Organization or Store structured data.", affected: [homeUrl], impact: "Helps Google show your brand name, logo and contact details.", fix: "Add Organization structured data (many SEO apps do this).", steps: ["Add Organization JSON-LD with name, logo, URL and contact"], effort: "quick", verify: "Detected on re-scan." });
  if (pf) {
    add({ id: "product-schema", category: "seo", title: "Product details for search engines", severity: "medium", pass: Boolean(pf.product?.price && pf.product?.name), evidence: pf.product ? `Product data found: ${pf.product.name ?? "unnamed"}${pf.product.price ? `, ${pf.product.currency ?? ""} ${pf.product.price}` : ", no price"}.` : "No Product structured data on the product page.", affected: [pf.url], impact: "Product data lets Google show price, stock and ratings in results.", fix: "Add Product structured data with name, price, currency, availability and reviews.", steps: ["Enable structured data in your theme/SEO app", "Test with Google's Rich Results Test"], effort: "moderate", verify: "Product data with price detected on re-scan." });
    add({ id: "thin", category: "product", title: "Product page has enough useful detail", severity: "medium", pass: pf.words >= 250, evidence: `About ${pf.words} words on the product page.`, affected: [pf.url], impact: "Shoppers need benefits, specs, sizing, delivery and care details to buy with confidence.", fix: "Add benefit-led key points, specifications, sizing, delivery time and FAQs.", steps: ["List the 5 questions customers ask most", "Answer them on the page"], effort: "moderate", verify: "250+ words of useful detail." });
    add({ id: "product-images", category: "product", title: "Several product images", severity: "medium", pass: (pf.product?.images ?? 0) >= 3 || pf.images >= 6, evidence: pf.product?.images ? `${pf.product.images} images in the product data.` : `${pf.images} images on the page.`, affected: [pf.url], impact: "Shoppers can't touch the product; images do the selling.", fix: "Show at least 4–6 images: front, detail, scale, in use.", steps: ["Add lifestyle and detail photos", "Keep the same background style"], effort: "moderate", verify: "3+ product images detected." });
    add({ id: "stock", category: "product", title: "Availability shown", severity: "low", pass: Boolean(pf.product?.availability), evidence: pf.product?.availability ? `Availability: ${pf.product.availability}.` : "No availability in the product data.", affected: [pf.url], impact: "Clear stock status avoids disappointment and helps search listings.", fix: "Publish stock status in the product data.", steps: ["Enable inventory tracking", "Show 'In stock' on the page"], effort: "quick", verify: "Availability detected." });
    add({ id: "cart", category: "conversion", title: "Clear add-to-cart button", severity: "high", pass: pf.addToCart, evidence: pf.addToCart ? "An add-to-cart / buy button was found." : "No add-to-cart or buy button was found in the page's code.", affected: [pf.url], impact: "Without an obvious buy button, interested visitors leave.", fix: "Make one prominent 'Add to cart' button visible without scrolling on mobile.", steps: ["Check the product template", "Test on a phone"], effort: "quick", verify: "Button found on re-scan.", confidence: "partly observed" });
    add({ id: "price", category: "conversion", title: "Price visible", severity: "high", pass: pf.priceVisible, evidence: pf.priceVisible ? "A price is visible." : "No price found on the product page.", affected: [pf.url], impact: "Hidden prices stop most online purchases.", fix: "Show the price (and any delivery cost) clearly near the button.", steps: ["Show price in the product template"], effort: "quick", verify: "Price detected." });
  }
  // Conversion & trust (site-wide signals from the page entered and the product page)
  const any = (k: keyof PageFacts["trust"]) => homeFacts.trust[k] || productFacts.some((p) => p.trust[k]);
  add({ id: "shipping", category: "conversion", title: "Shipping and delivery information", severity: "high", pass: any("shipping"), evidence: any("shipping") ? "Shipping/delivery information or a link to it was found." : "No shipping or delivery information found on the pages scanned.", affected: [homeUrl], impact: "Unknown delivery cost and time is one of the most common reasons people abandon carts.", fix: "Show delivery cost and time on product pages and link a shipping policy in the footer.", steps: ["Write a shipping policy page", "Add 'Delivery: X–Y days' near the buy button"], effort: "quick", verify: "Detected on re-scan." });
  add({ id: "returns", category: "conversion", title: "Returns and refunds policy", severity: "medium", pass: any("returns"), evidence: any("returns") ? "A returns/refund link or statement was found." : "No returns or refunds information found.", affected: [homeUrl], impact: "A clear returns promise reduces the risk of buying from a new store.", fix: "Publish a simple returns policy and link it from product pages and the footer.", steps: ["Write the policy", "Link it in the footer and near the buy button"], effort: "quick", verify: "Detected on re-scan." });
  add({ id: "reviews", category: "conversion", title: "Customer reviews or ratings", severity: "medium", pass: any("reviews"), evidence: any("reviews") ? "Reviews or ratings were found." : "No reviews, ratings or review apps found on the pages scanned.", affected: pf ? [pf.url] : [homeUrl], impact: "Reviews are the strongest trust signal for a store shoppers don't know.", fix: "Collect reviews from real buyers and show them on product pages. Never use fake reviews.", steps: ["Install a review app", "Email past customers asking for a review"], effort: "moderate", verify: "Reviews detected on re-scan." });
  add({ id: "contact", category: "conversion", title: "Easy to contact", severity: "medium", pass: any("contact"), evidence: any("contact") ? "Contact link, email, phone or WhatsApp found." : "No contact information found.", affected: [homeUrl], impact: "Shoppers want to know a real business is behind the store.", fix: "Add a contact page and WhatsApp/email link in the header or footer.", steps: ["Create a contact page", "Link it in the footer"], effort: "quick", verify: "Detected on re-scan." });
  add({ id: "policies", category: "conversion", title: "About, privacy and terms pages", severity: "low", pass: any("about") && any("privacy"), evidence: `About: ${any("about") ? "yes" : "no"} · Privacy: ${any("privacy") ? "yes" : "no"} · Terms: ${any("terms") ? "yes" : "no"}.`, affected: [homeUrl], impact: "Basic pages build trust and are required by many payment providers.", fix: "Publish About, Privacy and Terms pages and link them in the footer.", steps: ["Use your platform's policy generator, then edit"], effort: "quick", verify: "All three linked on re-scan." });
  const pays = [...new Set([...homeFacts.payments, ...productFacts.flatMap((p) => p.payments)])];
  add({ id: "payments", category: "conversion", title: "Payment options shown", severity: "low", pass: pays.length >= 2, evidence: pays.length ? `Visible payment methods: ${pays.join(", ")}.` : "No payment methods are shown on the pages scanned (they may only appear at checkout).", affected: [homeUrl], impact: "Showing familiar payment logos early reassures shoppers.", fix: "Show accepted payment methods in the footer and near the buy button.", steps: ["Enable payment icons in your theme"], effort: "quick", verify: "2+ payment methods visible.", confidence: "partly observed" });

  const cats: Category[] = ["technical", "seo", "conversion", "product"];
  const weight = { high: 25, medium: 12, low: 5 } as const;
  const scores = Object.fromEntries(cats.map((c) => {
    const items = F.filter((f) => f.category === c);
    if (!items.length) return [c, -1];
    const max = items.reduce((s, f) => s + weight[f.severity], 0);
    const got = items.filter((f) => f.pass).reduce((s, f) => s + weight[f.severity], 0);
    return [c, Math.round((got / max) * 100)];
  })) as Record<Category, number>;
  const valid = cats.filter((c) => scores[c] >= 0);
  const overall = valid.length ? Math.round(valid.reduce((s, c) => s + scores[c], 0) / valid.length) : 0;
  const order = { high: 0, medium: 1, low: 2 } as const;
  F.sort((a, b) => Number(a.pass) - Number(b.pass) || order[a.severity] - order[b.severity]);

  return { ok: true, audit: {
    url: start.toString(), finalUrl: homeUrl, scannedAt: new Date().toISOString(),
    platform: { id: adapter.id, name: adapter.name, kind: adapter.kind, signals, notes: adapter.caps.notes, connected: adapter.caps.connected },
    pages: [...pages, { url: new URL("/robots.txt", origin).toString(), status: robots.status, ms: robots.ms, kind: "robots.txt" }, { url: new URL("/sitemap.xml", origin).toString(), status: sitemap.status, ms: sitemap.ms, kind: "Sitemap" }],
    pagespeed: ps ?? "unavailable", scores, overall, findings: F, product: pf?.product ?? null, limits,
  } };
}

/** Observable product data from a competitor/product address (for side-by-side comparison). */
export async function scanProduct(input: string) {
  const u = publicUrl(input);
  if (!u) return { url: input, ok: false as const, error: "Not a public web address." };
  const r = await fetchPage(u, 12000);
  if (!r.ok || !r.html) return { url: u.toString(), ok: false as const, error: r.status ? `HTTP ${r.status}${r.status === 403 ? " (the site blocks automated visits)" : ""}` : r.error ?? "unreachable" };
  const { adapter } = detectPlatform(r.url, r.html, r.headers ?? {});
  const f = readPage(r.url, r.html);
  return {
    url: r.url.toString(), ok: true as const, scannedAt: new Date().toISOString(), platform: adapter.name,
    title: f.title, h1: f.h1[0] ?? null, description: f.description, product: f.product,
    priceVisible: f.priceVisible, reviews: f.trust.reviews, shipping: f.trust.shipping, returns: f.trust.returns, payments: f.payments,
    words: f.words, images: f.product?.images || f.images,
  };
}
