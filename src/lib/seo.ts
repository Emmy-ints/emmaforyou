/**
 * Central SEO helpers. Every public route builds its <head> with `pageHead()` so titles,
 * descriptions, canonicals, social tags and JSON-LD stay consistent and unique.
 *
 * SITE_URL: set VITE_SITE_URL when a custom domain goes live; canonicals, sitemap,
 * robots.txt, llms.txt and structured data all follow it.
 */

export const SITE_URL = String(
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) || "https://emmaforyou.lovable.app",
).replace(/\/+$/, "");

export const SITE_NAME = "EmmaForYou";
export const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";
export const DEFAULT_OG_IMAGE = "/og/emmaforyou-og.png";

export const FOUNDER = {
  name: "Emmanuel Akinloye Oluwaseun",
  jobTitle: "Founder & CEO",
  image: "/images/emmanuel.jpg",
};

/** One-sentence entity description, used verbatim wherever the business is described. */
export const ORG_DESCRIPTION =
  "EmmaForYou is an AI automation and digital growth agency founded by Emmanuel Akinloye Oluwaseun. It builds AI chat and booking automation, websites, ecommerce stores, email marketing, social media and paid advertising for small and growing businesses in Nigeria, the USA, Europe and Africa.";

export const SERVICES_OFFERED = [
  "AI automation and chatbots",
  "Website design and development",
  "Ecommerce and Shopify development",
  "Email marketing and automation",
  "Social media management",
  "Paid advertising (Meta and Google)",
  "Search engine optimisation",
  "Lead generation and sales funnels",
  "CRM setup",
  "App development",
];

export const AREAS_SERVED = ["Nigeria", "United States", "United Kingdom", "France", "Germany", "South Africa", "Ghana"];

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

type JsonLd = Record<string, unknown>;

/** Trim text for a meta description: whole sentences if possible, otherwise whole words. */
export function clip(text: string, max = 155): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const sentences = t.match(/[^.!?]+[.!?]+/g) || [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  if (out.trim().length >= 70) return out.trim();
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s—–-]+$/, "") + "…";
}

export interface PageHeadInput {
  title: string;
  description: string;
  /** Social share text, when it should differ from the search description. */
  ogDescription?: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
  publishedTime?: string;
}

/** Add the brand to a title only when it still fits in a search result (~60 characters). */
export function withBrand(title: string, suffix = " | EmmaForYou"): string {
  return title.length + suffix.length <= 62 ? `${title}${suffix}` : title;
}

/**
 * A meta description from an excerpt, topped up with the opening paragraph of a markdown body
 * when the excerpt alone is too thin to describe the page.
 */
export function describe(excerpt: string, markdownBody = ""): string {
  const clean = (t: string) => t.replace(/[#*_`>\[\]]/g, "").replace(/\(https?:[^)]*\)/g, "").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
  let text = clean(excerpt);
  if (text.length < 110 && markdownBody) {
    const paras = markdownBody.replace(/\\n/g, "\n").split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !p.startsWith("#") && !/^[-*\d]/.test(p));
    if (paras[0]) text = `${text.replace(/[.!?]?$/, ".")} ${clean(paras[0])}`;
  }
  return clip(text, 158);
}

/** Build a TanStack Router head object for a page. */
export function pageHead(p: PageHeadInput) {
  const url = absoluteUrl(p.path);
  const image = absoluteUrl(p.image || DEFAULT_OG_IMAGE);
  const meta: Record<string, string>[] = [
    { title: p.title },
    { name: "description", content: p.description },
    { name: "robots", content: p.noindex ? "noindex, follow" : "index, follow, max-image-preview:large" },
    { property: "og:type", content: p.type || "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: p.title },
    { property: "og:description", content: p.ogDescription || p.description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: p.imageAlt || p.title },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: p.title },
    { name: "twitter:description", content: p.ogDescription || p.description },
    { name: "twitter:image", content: image },
  ];
  if (p.publishedTime) meta.push({ property: "article:published_time", content: p.publishedTime });
  const ld = p.jsonLd ? (Array.isArray(p.jsonLd) ? p.jsonLd : [p.jsonLd]) : [];
  return {
    meta,
    links: p.noindex ? [] : [{ rel: "canonical", href: url }],
    scripts: ld.map((x) => ({ type: "application/ld+json", children: JSON.stringify(x) })),
  };
}

/* ------------------------------------------------------------------ */
/* Structured data builders                                            */
/* ------------------------------------------------------------------ */

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const FOUNDER_ID = `${SITE_URL}/#founder`;

export function organizationLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icons/icon-512.png"),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description: ORG_DESCRIPTION,
    founder: { "@id": FOUNDER_ID },
    areaServed: AREAS_SERVED.map((name) => ({ "@type": "Country", name })),
    knowsAbout: SERVICES_OFFERED,
    contactPoint: [{ "@type": "ContactPoint", contactType: "sales", url: WHATSAPP_URL, availableLanguage: ["English", "French", "Spanish", "German"] }],
  };
}

export function websiteLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: ORG_DESCRIPTION,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function founderLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: FOUNDER.name,
    jobTitle: FOUNDER.jobTitle,
    image: absoluteUrl(FOUNDER.image),
    worksFor: { "@id": ORG_ID },
    url: absoluteUrl("/about"),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function serviceLd(s: { name: string; description: string; path: string; serviceType?: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(s.path)}#service`,
    name: s.name,
    serviceType: s.serviceType || s.name,
    description: s.description,
    url: absoluteUrl(s.path),
    provider: { "@id": ORG_ID },
    areaServed: AREAS_SERVED.map((name) => ({ "@type": "Country", name })),
  };
}

/** Convert dates like "Apr 18, 2026" to ISO (YYYY-MM-DD). Returns undefined if unparseable. */
export function isoDate(input: string): string | undefined {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
}

export function articleLd(a: { headline: string; description: string; path: string; datePublished?: string; authorName?: string; authorRole?: string; section?: string; type?: "Article" | "BlogPosting" }): JsonLd {
  const isFounder = a.authorName === FOUNDER.name;
  return {
    "@context": "https://schema.org",
    "@type": a.type || "Article",
    headline: a.headline.slice(0, 110),
    description: a.description,
    mainEntityOfPage: absoluteUrl(a.path),
    url: absoluteUrl(a.path),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.section ? { articleSection: a.section } : {}),
    author: isFounder
      ? { "@id": FOUNDER_ID }
      : a.authorName
        ? { "@type": "Person", name: a.authorName, ...(a.authorRole ? { jobTitle: a.authorRole } : {}), worksFor: { "@id": ORG_ID } }
        : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function creativeWorkLd(w: { name: string; description: string; path: string; image: string; about?: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${w.name} — client project`,
    description: w.description,
    url: absoluteUrl(w.path),
    image: absoluteUrl(w.image),
    creator: { "@id": ORG_ID },
    ...(w.about ? { about: w.about } : {}),
  };
}

export function itemListLd(name: string, items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: absoluteUrl(it.path) })),
  };
}

/**
 * Search Console / Bing Webmaster verification. Paste the token from each tool into the
 * environment variables VITE_GOOGLE_SITE_VERIFICATION and VITE_BING_SITE_VERIFICATION.
 */
/** Google Search Console token for https://emmaforyou.lovable.app (public by design; it only proves ownership). */
const GOOGLE_SITE_VERIFICATION = String(import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || "j6roLB7t3mG0xjG29kUy-hB6o5zNN4ZtBlyJ1YKgNhw");

export const VERIFICATION_META = [
  GOOGLE_SITE_VERIFICATION ? { name: "google-site-verification", content: GOOGLE_SITE_VERIFICATION } : null,
  import.meta.env.VITE_BING_SITE_VERIFICATION ? { name: "msvalidate.01", content: String(import.meta.env.VITE_BING_SITE_VERIFICATION) } : null,
].filter((x): x is { name: string; content: string } => Boolean(x));
