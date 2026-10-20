import { createServerFn } from "@tanstack/react-start";

/**
 * Page titles and descriptions for public community pages, read on the server with the public
 * (anonymous) key, so row-level security returns only what any visitor may see: published,
 * public posts and public profiles of members who are not suspended. Members-only content
 * returns null here and is loaded in the browser with the member's own session instead.
 */
export interface PostMeta { title: string; description: string; author: string; username: string; published_at: string | null; kind: string }
export interface ProfileMeta { name: string; username: string; headline: string | null; bio: string | null; avatar: string | null }

function env() {
  const url = process.env.SUPABASE_URL || (import.meta.env.VITE_SUPABASE_URL as string | undefined);
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);
  return url && key ? { url, key } : null;
}

async function rest<T>(path: string): Promise<T[] | null> {
  const e = env();
  if (!e) return null;
  try {
    const res = await fetch(`${e.url}/rest/v1/${path}`, { headers: { apikey: e.key, Authorization: `Bearer ${e.key}` }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch { return null; }
}

const clean = (s: string, n: number) => {
  const t = s.replace(/\*\*|`/g, "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getPostMeta = createServerFn({ method: "GET" })
  .inputValidator((id: string) => String(id ?? ""))
  .handler(async ({ data }): Promise<PostMeta | null> => {
    if (!UUID.test(data)) return null;
    const rows = await rest<{ title: string | null; body: string; kind: string; published_at: string | null; author: { display_name: string; username: string } | null }>(
      `community_posts?id=eq.${data}&status=eq.published&visibility=eq.public&select=title,body,kind,published_at,author:community_profiles(display_name,username)&limit=1`,
    );
    const r = rows?.[0];
    if (!r || !r.author) return null;
    const title = clean(r.title || r.body.split("\n")[0] || "Community post", 70);
    return { title, description: clean(r.body, 158), author: r.author.display_name, username: r.author.username, published_at: r.published_at, kind: r.kind };
  });

export const getProfileMeta = createServerFn({ method: "GET" })
  .inputValidator((username: string) => String(username ?? "").toLowerCase().slice(0, 24))
  .handler(async ({ data }): Promise<ProfileMeta | null> => {
    if (!/^[a-z0-9_]{3,24}$/.test(data)) return null;
    const rows = await rest<{ display_name: string; username: string; headline: string | null; bio: string | null; avatar_url: string | null }>(
      `community_profiles?username=eq.${data}&visibility=eq.public&select=display_name,username,headline,bio,avatar_url&limit=1`,
    );
    const r = rows?.[0];
    return r ? { name: r.display_name, username: r.username, headline: r.headline, bio: r.bio ? clean(r.bio, 158) : null, avatar: r.avatar_url } : null;
  });
