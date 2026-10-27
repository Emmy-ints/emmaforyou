import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL, isoDate } from "@/lib/seo";
import { sitemapPaths } from "@/lib/seo-routes";
import { autoSummaries } from "@/lib/blog-server";
import { liveConfig } from "@/lib/live-config";

async function xml(): Promise<string> {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Automated blog articles come from the database (published rows only).
  const auto = (await autoSummaries(1000)).map((p) => ({ path: `/blog/${p.slug}`, priority: 0.6, changefreq: "monthly", lastmod: isoDate(p.date) }));
  const known = new Set(sitemapPaths().map((u) => u.path));
  // Pages the owner set to noindex in the control room are left out of the sitemap.
  const live = await liveConfig().catch(() => ({ settings: {} as Record<string, { noindex?: boolean }> }));
  const urls = [...sitemapPaths(), ...auto.filter((u) => !known.has(u.path))]
    .filter((u) => !live.settings[`seo:${u.path}`]?.noindex)
    .map((u) => `  <url>\n    <loc>${esc(SITE_URL + (u.path === "/" ? "/" : u.path))}</loc>${"lastmod" in u && u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(1)}</priority>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => new Response(await xml(), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } }),
    },
  },
});
