/**
 * Where to send someone after signing in. Only paths on this site that belong to an
 * account area are allowed, so a crafted link can't bounce people to another website.
 */
const ALLOWED = ["/account", "/portal", "/dashboard", "/community", "/inspiration"];

export function safeNext(raw: unknown, fallback = "/account"): string {
  if (typeof raw !== "string") return fallback;
  const v = raw.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\") || /[\u0000-\u001f]/.test(v)) return fallback;
  let url: URL;
  try { url = new URL(v, "https://emmaforyou.invalid"); } catch { return fallback; }
  if (url.origin !== "https://emmaforyou.invalid") return fallback;
  const ok = ALLOWED.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));
  return ok ? `${url.pathname}${url.search}` : fallback;
}

/** Absolute URL of the shared sign-in page, used for email confirmation and password-reset links. */
export function loginUrl(params: { mode?: "signin" | "signup" | "forgot" | "reset"; next?: string } = {}): string {
  const q = new URLSearchParams();
  if (params.mode && params.mode !== "signin") q.set("mode", params.mode);
  if (params.next) q.set("next", safeNext(params.next));
  const s = q.toString();
  return `${typeof window !== "undefined" ? window.location.origin : ""}/login${s ? `?${s}` : ""}`;
}
