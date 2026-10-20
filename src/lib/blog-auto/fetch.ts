/**
 * Server-only fetching for the automated blog: RSS/Atom feeds and the text of source articles.
 * Only public https URLs on real hostnames are fetched, with timeouts and size caps.
 */
const UA = "Mozilla/5.0 (compatible; EmmaForYouBlogBot/1.0; +https://emmaforyou.lovable.app/blog)";

export function safeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
    if (u.port && !["80", "443"].includes(u.port)) return null;
    const h = u.hostname.toLowerCase();
    if (!h.includes(".") || /^[\d.]+$/.test(h) || h.includes(":") || /(^|\.)(localhost|local|internal|lan|home|corp|test|invalid)$/.test(h)) return null;
    u.hash = "";
    for (const k of [...u.searchParams.keys()]) if (/^utm_|^(fbclid|gclid|mc_cid|mc_eid)$/i.test(k)) u.searchParams.delete(k);
    return u;
  } catch { return null; }
}

async function getText(url: string, accept: string, maxChars: number, timeoutMs: number): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  const u = safeUrl(url);
  if (!u) return { ok: false, status: 0, text: "", finalUrl: url };
  try {
    const res = await fetch(u.toString(), { redirect: "follow", signal: AbortSignal.timeout(timeoutMs), headers: { "User-Agent": UA, Accept: accept } });
    const final = safeUrl(res.url || u.toString());
    if (!final) return { ok: false, status: res.status, text: "", finalUrl: u.toString() };
    let text = "";
    const reader = res.body?.getReader();
    if (reader) {
      const dec = new TextDecoder();
      while (text.length < maxChars) { const { done, value } = await reader.read(); if (done || !value) break; text += dec.decode(value, { stream: true }); }
      try { await reader.cancel(); } catch { /* done */ }
    }
    return { ok: res.ok, status: res.status, text: text.slice(0, maxChars), finalUrl: final.toString() };
  } catch {
    return { ok: false, status: 0, text: "", finalUrl: u.toString() };
  }
}

export const decodeEntities = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&rsquo;|&lsquo;/g, "'").replace(/&rdquo;|&ldquo;/g, '"').replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&hellip;/g, "…");

export const stripHtml = (s: string) => decodeEntities(decodeEntities(s)
  .replace(/<(script|style|noscript|svg|iframe|form|nav|footer|header|aside)\b[\s\S]*?<\/\1>/gi, " ")
  .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, "\n")
  .replace(/<[^>]+>/g, " "))
  .replace(/[ \t\f\v]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();

export interface FeedItem { title: string; url: string; summary: string; published_at: string | null }

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : null;
}

/** Parse RSS 2.0 or Atom. Returns at most 30 items with a title and a public link. */
export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  for (const b of blocks.slice(0, 30)) {
    const title = stripHtml(tag(b, "title") ?? "").slice(0, 250);
    let link = stripHtml(tag(b, "link") ?? "");
    if (!link) {
      const alt = b.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) ?? b.match(/<link\b[^>]*href=["']([^"']+)["']/i);
      link = alt ? decodeEntities(alt[1]) : "";
    }
    const u = safeUrl(link);
    if (!title || !u) continue;
    const summary = stripHtml(tag(b, "description") ?? tag(b, "summary") ?? tag(b, "content:encoded") ?? tag(b, "content") ?? "").slice(0, 1200);
    const date = stripHtml(tag(b, "pubDate") ?? tag(b, "published") ?? tag(b, "updated") ?? tag(b, "dc:date") ?? "");
    const t = date ? Date.parse(date) : NaN;
    items.push({ title, url: u.toString(), summary, published_at: Number.isFinite(t) ? new Date(t).toISOString() : null });
  }
  return items;
}

export async function fetchFeed(feedUrl: string): Promise<{ ok: boolean; status: number; items: FeedItem[]; error?: string }> {
  const r = await getText(feedUrl, "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5", 1_500_000, 8000);
  if (!r.ok) return { ok: false, status: r.status, items: [], error: r.status ? `HTTP ${r.status}` : "unreachable" };
  const items = parseFeed(r.text);
  return items.length ? { ok: true, status: r.status, items } : { ok: false, status: r.status, items: [], error: "no items found" };
}

/** Readable text of a source article (for evidence). Returns null when it can't be fetched. */
export async function fetchArticleText(url: string): Promise<{ url: string; title: string | null; text: string } | null> {
  const r = await getText(url, "text/html,application/xhtml+xml", 800_000, 9000);
  if (!r.ok || r.text.length < 200) return null;
  const title = stripHtml(r.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").slice(0, 200) || null;
  const main = r.text.match(/<article\b[\s\S]*?<\/article>/i)?.[0] ?? r.text.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? r.text.match(/<body\b[\s\S]*<\/body>/i)?.[0] ?? r.text;
  const text = stripHtml(main).split("\n").map((l) => l.trim()).filter((l) => l.length > 40).join("\n").slice(0, 9000);
  return text.length >= 300 ? { url: r.finalUrl, title, text } : null;
}
