import { createServerOnlyFn } from "@tanstack/react-start";
import { scrub, showcaseRequestSchema, unsuitable, type ShowcaseKind } from "../showcase";
import { buildShowcaseItem } from "../showcase-build";
import { adminDb, checkLimits, checkOrigin, hashVisitor, readJson } from "./guard";
import { visitorSalt } from "./provider";
import { verifyPrototype } from "./proto-sign";
import { verifyContent } from "./content-sign";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const rand = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => ALPHABET[b % ALPHABET.length]).join("");
async function sha256(t: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}
const bad = (message: string, status = 400) => Response.json({ message }, { status });

/**
 * POST /api/showcase — publish something a visitor made (they chose to). Only signed tool output is accepted; contact
 * details are scrubbed and names removed unless the visitor ticked "show my business name". Items appear at once.
 * DELETE /api/showcase — the visitor removes their own item with the private token they were given.
 */
export const handleShowcase = createServerOnlyFn(async (request: Request) => {
  const origin = checkOrigin(request);
  if (origin) return origin.response;

  if (request.method === "DELETE") {
    const body = await readJson(request, 400);
    if (!body.ok) return body.response;
    const { slug, token } = (body.value ?? {}) as { slug?: string; token?: string };
    if (typeof slug !== "string" || typeof token !== "string" || !/^[A-Za-z0-9]{10,16}$/.test(slug) || token.length < 20 || token.length > 64) return bad("That link isn't valid.");
    const db = await adminDb();
    const { data, error } = await db.from("showcase_items").delete().eq("slug", slug).eq("remove_hash", await sha256(token)).select("slug");
    if (error) return bad("We couldn't remove it just now. Please try again.", 500);
    if (!data?.length) return bad("We couldn't find that item, or it was already removed.", 404);
    return Response.json({ removed: true });
  }

  const body = await readJson(request, 400000);
  if (!body.ok) return body.response;
  const parsed = showcaseRequestSchema.safeParse(body.value);
  if (!parsed.success) return bad("That item can't be added to the showcase.");
  const v = parsed.data;
  const kind = v.kind as ShowcaseKind;
  const c = v.content as Record<string, unknown>;

  // 1. Only real tool output.
  let ok = false;
  if (kind === "app" || kind === "website") ok = typeof c?.html === "string" && (await verifyPrototype(c.html as string, v.sig));
  else ok = await verifyContent(kind, c, v.sig);
  if (!ok) return bad("Only results made with our free tools on this website can be added to the showcase.");

  const limit = await checkLimits(request, "showcase", { perVisitor: 20, global: 500, label: "showcase items", worksWithoutAi: true });
  if (!limit.ok) return limit.response;

  // 2. Build a privacy-safe item per kind.
  const built = buildShowcaseItem(v);
  if ("error" in built) return bad(built.error);
  const item = built;

  // 3. Not suitable for a public wall.
  if (unsuitable(item.title, item.summary, v.prompt, JSON.stringify(item.payload).slice(0, 20000))) return bad("This item can't be shown publicly.", 422);

  const token = rand(24);
  const db = await adminDb();
  const visitor = await hashVisitor(request, visitorSalt());
  for (let i = 0; i < 3; i++) {
    const slug = rand(12);
    const { error } = await db.from("showcase_items").insert({
      slug, kind, title: item.title, summary: item.summary, industry: item.industry, place: v.place ? scrub(v.place, { max: 60 }) : null,
      business: item.business, payload: item.payload, lang: v.lang, remove_hash: await sha256(token), visitor_hash: visitor,
    });
    if (!error) return Response.json({ slug, token, title: item.title, path: `/showcase/${slug}` }, { headers: { "Cache-Control": "no-store" } });
    if (!/duplicate|unique/i.test(error.message ?? "")) { console.error("[showcase] insert", error.code); return bad("We couldn't add it to the showcase just now.", 500); }
  }
  return bad("We couldn't add it to the showcase just now.", 500);
});
