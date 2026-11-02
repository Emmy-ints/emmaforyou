import { createServerFn } from "@tanstack/react-start";
import { CARD_FIELDS, type InternCard, type PublicIntern } from "./interns";

/**
 * Public intern data, loaded on the server with the publishable key from the interns_public view.
 * That view only contains published, non-archived profiles and only approved columns — private
 * contact details and internal notes are in a different table the public key can't read.
 */
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

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Every public profile for the directory (cards only), active interns first. */
export async function internCards(): Promise<(InternCard & { updated_at: string; noindex: boolean })[]> {
  return rest(`interns_public?select=${CARD_FIELDS},updated_at,noindex&order=designation.asc,published_at.desc&limit=500`);
}

export const listInterns = createServerFn({ method: "GET" }).handler(async () => internCards());

/** The admin's homepage selection, in their order. */
export const homepageInterns = createServerFn({ method: "GET" }).handler(async () =>
  rest<InternCard>(`interns_public?homepage_featured=is.true&select=${CARD_FIELDS}&order=homepage_order.asc,published_at.asc&limit=12`));

/** One profile, or a redirect when the slug was renamed, or null (404). */
export const getIntern = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => String(slug ?? "").slice(0, 80))
  .handler(async ({ data }): Promise<{ intern: PublicIntern; related: InternCard[] } | { redirect: string } | null> => {
    if (!SLUG.test(data)) return null;
    const rows = await rest<PublicIntern>(`interns_public?slug=eq.${data}&select=*&limit=1`);
    const intern = rows[0];
    if (!intern) {
      const moved = await rest<{ slug: string }>(`interns_public_slugs?old_slug=eq.${data}&select=slug&limit=1`);
      return moved[0] ? { redirect: moved[0].slug } : null;
    }
    const related = (await rest<InternCard>(`interns_public?slug=neq.${data}&select=${CARD_FIELDS}&order=published_at.desc&limit=12`))
      .sort((a, b) => overlap(b, intern) - overlap(a, intern)).slice(0, 3);
    return { intern, related };
  });

function overlap(a: InternCard, b: PublicIntern) {
  const s = new Set([...b.skills, ...b.specialties].map((x) => x.toLowerCase()));
  return [...a.skills, ...a.specialties].filter((x) => s.has(x.toLowerCase())).length;
}
