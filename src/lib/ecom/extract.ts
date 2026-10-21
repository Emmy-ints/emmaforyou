/**
 * Reads what a public store page shows (pure HTML parsing, no network). Used by the store audit and
 * competitor scans. Everything here is an observation of the page; nothing is inferred.
 */
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, " ").trim();
const attr = (tag: string, name: string) => { const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i")); return m ? decode(m[1] ?? m[2] ?? m[3] ?? "") : ""; };
const metaBy = (html: string, key: string, val: string) => { const tag = (html.match(/<meta\b[^>]*>/gi) || []).find((t) => attr(t, key).toLowerCase() === val); return tag ? attr(tag, "content") : ""; };
const text = (html: string) => decode(html.replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "));

export interface ProductData { name: string | null; price: number | null; currency: string | null; availability: string | null; rating: number | null; reviewCount: number | null; brand: string | null; sku: string | null; images: number; description: string | null }
export interface PageFacts {
  url: string; title: string; description: string; canonical: string; robots: string; lang: string; viewport: boolean; h1: string[]; h2Count: number;
  ogImage: boolean; jsonLdTypes: string[]; product: ProductData | null; organization: boolean; breadcrumbs: boolean;
  images: number; imagesNoAlt: number; links: { href: string; text: string }[]; internalLinks: string[]; words: number;
  trust: { shipping: boolean; returns: boolean; contact: boolean; reviews: boolean; about: boolean; privacy: boolean; terms: boolean; secureBadge: boolean };
  payments: string[]; addToCart: boolean; priceVisible: boolean; mixedContent: number; scripts: number; sizeKb: number;
}

function jsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  for (const m of html.matchAll(/<script[^>]+type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const v = JSON.parse(m[1].trim());
      const push = (x: unknown) => { if (Array.isArray(x)) x.forEach(push); else if (x && typeof x === "object") { out.push(x); const g = (x as Record<string, unknown>)["@graph"]; if (g) push(g); } };
      push(v);
    } catch { /* invalid JSON-LD is itself a finding, counted by the caller */ }
  }
  return out;
}
const types = (o: unknown): string[] => { const t = (o as Record<string, unknown>)?.["@type"]; return Array.isArray(t) ? t.map(String) : t ? [String(t)] : []; };
const num = (v: unknown) => { const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[^\d.]/g, "")) : NaN; return Number.isFinite(n) && n > 0 ? n : null; };

function productFrom(objs: unknown[]): ProductData | null {
  const p = objs.find((o) => types(o).some((t) => /^(Product|ProductGroup|IndividualProduct)$/i.test(t))) as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!p) return null;
  const offersRaw = p.offers ?? p.hasVariant?.[0]?.offers;
  const offer = Array.isArray(offersRaw) ? offersRaw[0] : offersRaw;
  const price = num(offer?.price ?? offer?.lowPrice ?? offer?.priceSpecification?.price);
  const agg = p.aggregateRating;
  return {
    name: typeof p.name === "string" ? decode(p.name).slice(0, 200) : null,
    price, currency: typeof (offer?.priceCurrency ?? offer?.priceSpecification?.priceCurrency) === "string" ? String(offer?.priceCurrency ?? offer?.priceSpecification?.priceCurrency).toUpperCase().slice(0, 3) : null,
    availability: typeof offer?.availability === "string" ? offer.availability.replace(/^https?:\/\/schema\.org\//i, "") : null,
    rating: num(agg?.ratingValue), reviewCount: num(agg?.reviewCount ?? agg?.ratingCount),
    brand: typeof p.brand === "string" ? p.brand : typeof p.brand?.name === "string" ? p.brand.name : null,
    sku: typeof p.sku === "string" ? p.sku : null,
    images: Array.isArray(p.image) ? p.image.length : p.image ? 1 : 0,
    description: typeof p.description === "string" ? decode(p.description).slice(0, 600) : null,
  };
}

const PAYMENTS: [string, RegExp][] = [["Visa/Mastercard", /\bvisa\b|mastercard/i], ["PayPal", /paypal/i], ["Apple Pay", /apple\s?pay/i], ["Google Pay", /google\s?pay|gpay/i], ["Shop Pay", /shop\s?pay/i], ["Klarna", /klarna/i], ["Afterpay/Clearpay", /afterpay|clearpay/i], ["Paystack", /paystack/i], ["Flutterwave", /flutterwave/i], ["M-Pesa", /m-?pesa/i], ["Stripe", /stripe/i], ["Cash on delivery", /cash on delivery|pay on delivery/i], ["Bank transfer", /bank transfer/i]];

export function readPage(url: URL, html: string): PageFacts {
  const objs = jsonLd(html);
  const allTypes = [...new Set(objs.flatMap(types))];
  const anchors = [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({ href: attr(m[0], "href"), text: decode(m[1].replace(/<[^>]+>/g, " ")).slice(0, 80) })).filter((l) => l.href && !l.href.startsWith("#") && !/^(javascript|mailto|tel):/i.test(l.href));
  const internal: string[] = [];
  for (const l of anchors) { try { const u = new URL(l.href, url); if (u.hostname === url.hostname) { u.hash = ""; internal.push(u.toString()); } } catch { /* skip */ } }
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const body = text(html);
  const lowerLinks = anchors.map((l) => `${l.href} ${l.text}`.toLowerCase()).join(" ");
  const lower = body.toLowerCase();
  const product = productFrom(objs);
  return {
    url: url.toString(),
    title: decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""),
    description: metaBy(html, "name", "description"),
    canonical: attr((html.match(/<link\b[^>]*rel\s*=\s*["']?canonical["']?[^>]*>/i) || [""])[0], "href"),
    robots: metaBy(html, "name", "robots"),
    lang: attr((html.match(/<html\b[^>]*>/i) || [""])[0], "lang"),
    viewport: Boolean(metaBy(html, "name", "viewport")),
    h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, " "))).filter(Boolean).slice(0, 5),
    h2Count: (html.match(/<h2\b/gi) || []).length,
    ogImage: Boolean(metaBy(html, "property", "og:image")),
    jsonLdTypes: allTypes,
    product,
    organization: allTypes.some((t) => /Organization|Store|LocalBusiness/i.test(t)),
    breadcrumbs: allTypes.includes("BreadcrumbList"),
    images: imgs.length,
    imagesNoAlt: imgs.filter((t) => !/\balt\s*=/i.test(t) || /\balt\s*=\s*(""|'')/i.test(t)).length,
    links: anchors.slice(0, 400),
    internalLinks: [...new Set(internal)].slice(0, 400),
    words: body.split(/\s+/).filter(Boolean).length,
    trust: {
      shipping: /shipping|delivery|dispatch/.test(lowerLinks) || /\b(free shipping|delivery in|ships in|dispatch)\b/.test(lower),
      returns: /return|refund|exchange/.test(lowerLinks) || /\b(returns?|refunds?) (policy|within)\b/.test(lower),
      contact: /contact/.test(lowerLinks) || /mailto:|tel:|wa\.me/i.test(html),
      reviews: Boolean(product?.reviewCount) || /\b\d[\d,]* reviews?\b|★|judge\.me|trustpilot|yotpo|loox|okendo|stamped/i.test(html),
      about: /about/.test(lowerLinks),
      privacy: /privacy/.test(lowerLinks),
      terms: /terms|conditions/.test(lowerLinks),
      secureBadge: /secure checkout|ssl secure|safe checkout/i.test(lower),
    },
    payments: PAYMENTS.filter(([, re]) => re.test(html)).map(([n]) => n),
    addToCart: /add[ -]?to[ -]?(cart|bag|basket)|buy now|\/cart\/add|name\s*=\s*["']?add/i.test(html),
    priceVisible: Boolean(product?.price) || /(?:[$€£₦]|NGN|USD|EUR|GBP|KES|GHS|ZAR)\s?\d[\d,.]*/.test(body),
    mixedContent: url.protocol === "https:" ? (html.match(/\b(src|href)\s*=\s*["']?http:\/\/(?!localhost)/gi) || []).length : 0,
    scripts: (html.match(/<script\b/gi) || []).length,
    sizeKb: Math.round(new TextEncoder().encode(html).length / 1024),
  };
}

/** Pick likely product pages from a home page's links (platform pattern first, then common shapes). */
export function productLinks(facts: PageFacts, pattern?: RegExp, limit = 2): string[] {
  const generic = /\/(products?|item|itm|p|dp|listing|shop\/p|product-page)\/[^/?#]{3,}/i;
  const picks = facts.internalLinks.filter((h) => { try { const p = new URL(h).pathname; return (pattern ?? generic).test(p) || generic.test(p); } catch { return false; } });
  return [...new Set(picks)].slice(0, limit);
}
