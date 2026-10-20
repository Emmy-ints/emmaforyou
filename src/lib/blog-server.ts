import { createServerFn } from "@tanstack/react-start";
import type { BlogPost } from "./blog-data";

/**
 * Blog posts are loaded on the server so the browser receives only the post being read and short
 * summaries (see knowledge-server.ts for why loaders must not read the full lists).
 *
 * Two sources are merged: the hand-written posts in blog-data (unchanged URLs) and articles from
 * the automated pipeline (blog_articles, published rows only, read with the public key so
 * row-level security applies). A static post always wins if a slug ever matched both.
 */
export type PostSummary = Omit<BlogPost, "body">;
const summary = ({ body: _body, ...meta }: BlogPost): PostSummary => meta;

export const AUTO_AUTHOR = { name: "EmmaForYou Editorial", role: "AI-assisted, source-checked", initials: "EF" };

interface ArticleRow {
  slug: string; title: string; seo_title: string | null; category: string; excerpt: string; body: string; read_minutes: number;
  cover: { from?: string; to?: string; emoji?: string } | null; sources: BlogPost["sources"]; published_at: string; updated_at: string;
}

function env() {
  const url = process.env.SUPABASE_URL || (import.meta.env.VITE_SUPABASE_URL as string | undefined);
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);
  return url && key ? { url, key } : null;
}

async function rest<T>(path: string): Promise<T[]> {
  const e = env();
  if (!e) return [];
  try {
    const res = await fetch(`${e.url}/rest/v1/${path}`, { headers: { apikey: e.key, Authorization: `Bearer ${e.key}` }, signal: AbortSignal.timeout(5000) });
    return res.ok ? ((await res.json()) as T[]) : [];
  } catch { return []; }
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function toPost(r: ArticleRow): BlogPost {
  return {
    slug: r.slug, title: r.title, seoTitle: r.seo_title ?? undefined, category: r.category, excerpt: r.excerpt, body: r.body,
    read: `${r.read_minutes} min`, date: fmt(r.published_at), author: AUTO_AUTHOR,
    cover: { from: r.cover?.from ?? "#7c3aed", to: r.cover?.to ?? "#db2777", emoji: r.cover?.emoji ?? "📰" },
    sources: Array.isArray(r.sources) ? r.sources : [], automated: true, publishedAt: r.published_at,
  };
}

const LIST_FIELDS = "slug,title,seo_title,category,excerpt,read_minutes,cover,published_at";

/** Published automated articles, newest first (summaries only). */
export async function autoSummaries(limit = 200): Promise<PostSummary[]> {
  const rows = await rest<Omit<ArticleRow, "body" | "sources" | "updated_at">>(`blog_articles?status=eq.published&select=${LIST_FIELDS}&order=published_at.desc&limit=${limit}`);
  return rows.map((r) => summary(toPost({ ...r, body: "", sources: [], updated_at: r.published_at } as ArticleRow)));
}

export const getBlogPost = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => String(slug ?? "").slice(0, 160))
  .handler(async ({ data }) => {
    const { POSTS, getPost } = await import("./blog-data");
    let post: BlogPost | undefined = getPost(data);
    if (!post && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(data)) {
      const rows = await rest<ArticleRow>(`blog_articles?slug=eq.${data}&status=eq.published&select=${LIST_FIELDS},body,sources,updated_at&limit=1`);
      if (rows[0]) post = toPost(rows[0]);
    }
    if (!post) return null;
    const auto = post.automated ? (await autoSummaries(40)).filter((p) => p.slug !== post!.slug) : [];
    const pool: PostSummary[] = [...auto, ...POSTS.map(summary)].filter((p) => p.slug !== post!.slug);
    const sameTopic = pool.filter((p) => p.category === post!.category).slice(0, 3);
    const related = sameTopic.length ? sameTopic : pool.slice(0, 3);
    return { post, related };
  });

/** Every post for the blog index: automated articles first (newest), then the hand-written posts. */
export const listBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { POSTS } = await import("./blog-data");
  const auto = await autoSummaries(200);
  const staticSlugs = new Set(POSTS.map((p) => p.slug));
  return [...auto.filter((p) => !staticSlugs.has(p.slug)), ...POSTS.map(summary)];
});

/** Newest few posts (automated and hand-written) for side panels such as the community. */
export const latestBlogPosts = createServerFn({ method: "GET" })
  .inputValidator((n: number) => Math.max(1, Math.min(6, Number(n) || 3)))
  .handler(async ({ data }) => {
    const { POSTS } = await import("./blog-data");
    const auto = await autoSummaries(data);
    return [...auto, ...POSTS.map(summary)].slice(0, data).map((p) => ({ slug: p.slug, title: p.title, category: p.category, date: p.date }));
  });
