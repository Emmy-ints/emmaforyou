import { createServerOnlyFn } from "@tanstack/react-start";
import { shareRequestSchema, suggestPlan } from "../prototype";
import { adminDb, checkLimits, checkOrigin, hashVisitor, readJson } from "./guard";
import { visitorSalt } from "./provider";
import { verifyPrototype } from "./proto-sign";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function newSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Save a generated prototype so it can be opened on a phone / shared, and tell the owner (lead). */
export const handlePrototypeShare = createServerOnlyFn(async (request: Request) => {
  const bad = checkOrigin(request);
  if (bad) return bad.response;
  const body = await readJson(request, 400000);
  if (!body.ok) return body.response;
  const parsed = shareRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    const msg = parsed.error.issues.find((i) => i.message && !/^(Invalid|Expected|Required)/.test(i.message))?.message;
    return Response.json({ message: msg || "Please add your name and a WhatsApp number or email, and tick the box." }, { status: 400 });
  }
  const v = parsed.data;
  if (!(await verifyPrototype(v.html, v.sig))) {
    return Response.json({ message: "Only prototypes made with the builder on this page can be saved. Please generate it again." }, { status: 400 });
  }
  const limit = await checkLimits(request, "proto-share", { perVisitor: 6, global: 120, label: "saved prototypes", worksWithoutAi: true });
  if (!limit.ok) return limit.response;

  const suggestion = suggestPlan(v.kind, { screens: v.plan?.screens.length, pages: v.pages });
  const title = (v.kind === "app" ? v.plan?.name : v.business) || v.prompt.slice(0, 60);
  const db = await adminDb();
  const visitor = await hashVisitor(request, visitorSalt());
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = newSlug();
    const { error } = await db.from("prototype_shares").insert({
      slug, kind: v.kind, title: title.slice(0, 120), prompt: v.prompt, plan: v.plan ?? (v.pages ? { pages: v.pages } : null),
      html: v.html, logo: v.logo ?? null, platform: v.kind === "app" ? (v.platform ?? "ios") : null,
      name: v.name, business: v.business || null, email: v.email || null, whatsapp: v.whatsapp || null,
      suggested_plan: `${suggestion.tier} (${suggestion.price})`, consent: true, visitor_hash: visitor,
    });
    if (!error) return Response.json({ slug, path: `/p/${slug}`, suggestion }, { headers: { "Cache-Control": "no-store" } });
    if (!/duplicate|unique/i.test(error.message ?? "")) {
      console.error("[prototype-share] insert failed", error.code);
      return Response.json({ message: "We couldn't save your prototype just now. Please try again, or chat with us on WhatsApp." }, { status: 500 });
    }
  }
  return Response.json({ message: "We couldn't save your prototype just now. Please try again." }, { status: 500 });
});
