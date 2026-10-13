import { EXPERTISE, SERVICES, SERVICE_TO_EXPERTISE } from "./services-data";
import { PROJECTS, projectSlug } from "./portfolio-data";
import { POSTS } from "./blog-data";
import { KNOWLEDGE } from "./knowledge-data";
import { NICHES } from "./niches";
import { CHECKLISTS } from "./checklists";

/**
 * The seven /services/* pages are the primary commercial pages. Expertise pages that show the
 * same content point their canonical at the matching service URL, so the two never compete.
 */
export function canonicalForExpertise(expertiseSlug: string): string {
  const svc = Object.entries(SERVICE_TO_EXPERTISE).find(([, exp]) => exp === expertiseSlug)?.[0];
  return svc ? `/services/${svc}` : `/expertise/${expertiseSlug}`;
}

/** Indexable static pages (private, account and thin generated pages are deliberately excluded). */
export const STATIC_PATHS: { path: string; priority: number; changefreq: string }[] = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/portfolio", priority: 0.9, changefreq: "monthly" },
  { path: "/services", priority: 0.9, changefreq: "monthly" },
  { path: "/why-emmaforyou", priority: 0.8, changefreq: "monthly" },
  { path: "/industries", priority: 0.7, changefreq: "monthly" },
  { path: "/tools", priority: 0.8, changefreq: "monthly" },
  { path: "/contact", priority: 0.7, changefreq: "yearly" },
  { path: "/checklists", priority: 0.7, changefreq: "monthly" },
  { path: "/pricing", priority: 0.9, changefreq: "monthly" },
  { path: "/about", priority: 0.7, changefreq: "monthly" },
  { path: "/website-audit", priority: 0.8, changefreq: "monthly" },
  { path: "/ai-receptionist", priority: 0.8, changefreq: "monthly" },
  { path: "/makeover", priority: 0.7, changefreq: "monthly" },
  { path: "/proposal", priority: 0.7, changefreq: "monthly" },
  { path: "/book", priority: 0.7, changefreq: "monthly" },
  { path: "/smart-contract-check", priority: 0.7, changefreq: "monthly" },
  { path: "/goal-planner", priority: 0.7, changefreq: "monthly" },
  { path: "/analyser", priority: 0.8, changefreq: "monthly" },
  { path: "/roi-calculator", priority: 0.8, changefreq: "monthly" },
  { path: "/growth-quiz", priority: 0.6, changefreq: "monthly" },
  { path: "/email-generator", priority: 0.6, changefreq: "monthly" },
  { path: "/free-resources", priority: 0.6, changefreq: "monthly" },
  { path: "/intake", priority: 0.7, changefreq: "monthly" },
  { path: "/faq", priority: 0.7, changefreq: "monthly" },
  { path: "/blog", priority: 0.6, changefreq: "weekly" },
  { path: "/knowledge-base", priority: 0.7, changefreq: "weekly" },
  { path: "/watch", priority: 0.5, changefreq: "monthly" },
  { path: "/affiliate", priority: 0.4, changefreq: "monthly" },
  { path: "/privacy", priority: 0.2, changefreq: "yearly" },
  { path: "/terms", priority: 0.2, changefreq: "yearly" },
];

export function sitemapPaths(): { path: string; priority: number; changefreq: string }[] {
  const services = SERVICES.map((s) => ({ path: `/services/${s.slug}`, priority: 0.9, changefreq: "monthly" }));
  const expertise = EXPERTISE.filter((e) => canonicalForExpertise(e.slug) === `/expertise/${e.slug}`).map((e) => ({ path: `/expertise/${e.slug}`, priority: 0.7, changefreq: "monthly" }));
  const work = PROJECTS.map((p) => ({ path: `/portfolio/${projectSlug(p.name)}`, priority: 0.7, changefreq: "yearly" }));
  const niches = NICHES.map((n) => ({ path: `/niche/${n.slug}`, priority: 0.6, changefreq: "monthly" }));
  const posts = POSTS.map((p) => ({ path: `/blog/${p.slug}`, priority: 0.5, changefreq: "yearly" }));
  const checklists = CHECKLISTS.map((c) => ({ path: `/checklists/${c.slug}`, priority: 0.6, changefreq: "yearly" }));
  const articles = KNOWLEDGE.map((a) => ({ path: `/knowledge-base/${a.slug}`, priority: 0.6, changefreq: "yearly" }));
  return [...STATIC_PATHS, ...services, ...expertise, ...work, ...niches, ...posts, ...checklists, ...articles];
}

/** Paths that must never be indexed or listed. */
export const PRIVATE_PATHS = ["/dashboard", "/portal", "/api/"];
