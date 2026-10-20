import { createServerFn } from "@tanstack/react-start";

/**
 * Link previews for community posts, fetched on the server. Only public http(s) sites are fetched
 * (no IP addresses, local or internal hostnames, or non-standard ports), with a short timeout and a
 * size cap, so this can't be used to probe internal services. Results are cached per worker.
 */
export interface LinkPreview { url: string; host: string; title: string | null; description: string | null; image: string | null }

const cache = new Map<string, { at: number; value: LinkPreview | null }>();
const TTL = 60 * 60 * 1000;

function publicUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
    if (u.port && !["80", "443"].includes(u.port)) return null;
    const h = u.hostname.toLowerCase();
    if (!h.includes(".") || /^[\d.]+$/.test(h) || h.includes(":") || /(^|\.)(localhost|local|internal|lan|home|corp|test|invalid)$/.test(h)) return null;
    u.hash = "";
    return u;
  } catch { return null; }
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
function meta(html: string, key: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const t of tags) {
    if (new RegExp(`(?:property|name)\\s*=\\s*["']?${key.replace(":", "\\:")}["'\\s/>]`, "i").test(t)) {
      const m = t.match(/content\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i);
      const v = m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
      if (v.trim()) return decode(v).slice(0, 300);
    }
  }
  return null;
}

export const getLinkPreview = createServerFn({ method: "GET" })
  .inputValidator((url: string) => String(url ?? "").slice(0, 500))
  .handler(async ({ data }): Promise<LinkPreview | null> => {
    const target = publicUrl(data);
    if (!target) return null;
    const key = target.toString();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.value;
    let value: LinkPreview | null = null;
    try {
      const res = await fetch(key, { redirect: "follow", signal: AbortSignal.timeout(6000), headers: { "User-Agent": "Mozilla/5.0 (compatible; EmmaForYouLinkPreview/1.0)", Accept: "text/html" } });
      const final = publicUrl(res.url || key);
      if (res.ok && final && /html/i.test(res.headers.get("content-type") || "")) {
        const reader = res.body?.getReader();
        let html = "";
        if (reader) {
          const dec = new TextDecoder();
          while (html.length < 400_000) { const { done, value: chunk } = await reader.read(); if (done || !chunk) break; html += dec.decode(chunk, { stream: true }); if (/<\/head>/i.test(html)) break; }
          try { await reader.cancel(); } catch { /* done */ }
        }
        const image = meta(html, "og:image") || meta(html, "twitter:image");
        const imageUrl = image ? (() => { try { const u = new URL(image, final); return u.protocol === "https:" ? u.toString() : null; } catch { return null; } })() : null;
        value = {
          url: final.toString(), host: final.hostname.replace(/^www\./, ""),
          title: meta(html, "og:title") || meta(html, "twitter:title") || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ? decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)![1]).slice(0, 200) : null),
          description: meta(html, "og:description") || meta(html, "description"),
          image: imageUrl,
        };
      }
    } catch { value = null; }
    if (cache.size > 500) cache.clear();
    cache.set(key, { at: Date.now(), value });
    return value;
  });
