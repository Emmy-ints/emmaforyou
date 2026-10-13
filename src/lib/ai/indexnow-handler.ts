import { createServerOnlyFn } from "@tanstack/react-start";
import { INDEXNOW_KEY } from "../indexnow";
import { SITE_URL } from "../seo";
import { sitemapPaths } from "../seo-routes";
import { adminDb, checkOrigin } from "./guard";

/**
 * Owner-only: tell IndexNow search engines (Bing, Yandex, Seznam, Naver…) about every public URL.
 * Bing's index also feeds Microsoft Copilot and ChatGPT search. Requires the live site to serve
 * the key file, so run it after publishing.
 */
export const handleIndexNow = createServerOnlyFn(async (request: Request) => {
  const bad = checkOrigin(request);
  if (bad) return bad.response;
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ message: "Sign in to the dashboard first." }, { status: 401 });
  const db = await adminDb();
  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData?.user) return Response.json({ message: "Your session expired. Sign in again." }, { status: 401 });
  const { data: roles } = await db.from("user_roles").select("role").eq("user_id", userData.user.id);
  if (!roles?.some((r: { role: string }) => r.role === "admin")) return Response.json({ message: "Only the site owner can do this." }, { status: 403 });

  const host = new URL(SITE_URL).host;
  const urlList = sitemapPaths().map((p) => `${SITE_URL}${p.path}`);
  const keyCheck = await fetch(`${SITE_URL}/${INDEXNOW_KEY}.txt`, { signal: AbortSignal.timeout(8000) }).then(async (r) => r.ok && (await r.text()).trim() === INDEXNOW_KEY).catch(() => false);
  if (!keyCheck) return Response.json({ message: `The key file isn't live on ${host} yet. Publish the site in Lovable, then try again.` }, { status: 409 });

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);
  if (!res) return Response.json({ message: "IndexNow didn't respond. Try again later." }, { status: 502 });
  if (res.status === 200 || res.status === 202) return Response.json({ message: `Submitted ${urlList.length} pages to IndexNow (Bing and partners).`, count: urlList.length });
  return Response.json({ message: `IndexNow answered ${res.status}. ${res.status === 403 ? "The key wasn't accepted yet; try again in a few minutes." : res.status === 429 ? "Too many submissions; try again tomorrow." : ""}`.trim() }, { status: 502 });
});
