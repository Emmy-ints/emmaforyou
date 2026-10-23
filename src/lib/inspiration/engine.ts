/**
 * Inspiration crawler (server only, service role). One tick = one source's discovery and/or a small
 * batch of example pages, plus a few link checks — bounded by time, per-source limits and crawl
 * delays, so no source is ever hammered and one failing source can't stop the others.
 *
 * Politeness: honest user agent (no browser impersonation), robots.txt checked for every request
 * (including each redirect hop), Crawl-delay or the source's minimum gap between requests, no
 * logins, no query-string variants that robots.txt disallows, and no retries on 401/403/429.
 */
import { adminDb } from "@/lib/ai/guard";
import { allowed, parseRobots, USER_AGENT, type RobotsRules } from "./robots";
import { canonicalKey, classify, cleanTitle, cleanUrl, hostOf, orderChildSitemaps, parseSitemap, pickOriginal, readPage, splitEmailTitle, stripTracking, tagsFrom, type Kind, type SitemapEntry } from "./extract";

interface Source {
  id: string; name: string; home_url: string; category: string; default_kind: Kind; method: "sitemap" | "listing" | "manual";
  sitemaps: string[]; sitemap_pick: string | null; listing_pages: string[]; include_pattern: string | null; exclude_pattern: string | null; tag_prefixes: string[];
  platform: string | null; theme: "light" | "dark" | null; enabled: boolean; use_source_images: boolean; max_new_per_run: number; max_sitemaps_per_run: number;
  refresh_hours: number; min_delay_ms: number; status: string; state: Record<string, any>; last_discovery_at: string | null; imported_total: number; discovered_total: number;
}
interface Run { discovered: number; queued: number; imported: number; updated: number; duplicates: number; skipped: number; failed: number; verified: number; broken: number; requests: number; errors: { url?: string; error: string }[]; samples: string[]; notes: string[] }
interface Got { ok: boolean; status: number; body: string; url: URL; error?: string; blocked?: "robots" | "refused" }

const MAX_BYTES = 6_000_000;
const TIME_BUDGET_MS = 75_000;

class Crawler {
  robots = new Map<string, Promise<RobotsRules>>();
  last = new Map<string, number>();
  requests = 0;
  constructor(public deadline: number, public minGapMs: number) {}

  private async rules(u: URL): Promise<RobotsRules> {
    const key = `${u.protocol}//${u.host}`;
    if (!this.robots.has(key)) this.robots.set(key, (async () => {
      try {
        await this.pace(u.host);
        this.requests++;
        const r = await fetch(`${key}/robots.txt`, { headers: { "User-Agent": USER_AGENT, Accept: "text/plain,*/*" }, redirect: "follow", signal: AbortSignal.timeout(10000) });
        if (r.status >= 200 && r.status < 300) return parseRobots((await r.text()).slice(0, 500_000));
        if (r.status >= 400 && r.status < 500) return { rules: [], crawlDelayMs: null, sitemaps: [], status: "none" as const }; // no robots.txt: everything allowed
        return { rules: [], crawlDelayMs: null, sitemaps: [], status: "unreachable" as const }; // 5xx: assume disallowed (RFC 9309)
      } catch { return { rules: [], crawlDelayMs: null, sitemaps: [], status: "unreachable" as const }; }
    })());
    return this.robots.get(key)!;
  }

  private async pace(host: string, gap = this.minGapMs) {
    const wait = (this.last.get(host) ?? 0) + gap - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, Math.min(wait, 60_000)));
    this.last.set(host, Date.now());
  }

  timeLeft() { return this.deadline - Date.now(); }

  async get(url: URL, method: "GET" | "HEAD" = "GET"): Promise<Got> {
    let current = url;
    for (let hop = 0; hop < 6; hop++) {
      if (this.timeLeft() < 4000) return { ok: false, status: 0, body: "", url: current, error: "out of time for this run" };
      const rules = await this.rules(current);
      if (!allowed(rules, current.pathname + current.search)) return { ok: false, status: 0, body: "", url: current, error: rules.status === "unreachable" ? "robots.txt unreachable (treated as disallowed)" : "disallowed by robots.txt", blocked: "robots" };
      await this.pace(current.host, Math.max(this.minGapMs, rules.crawlDelayMs ?? 0));
      this.requests++;
      let res: Response;
      try {
        res = await fetch(current.toString(), { method, redirect: "manual", signal: AbortSignal.timeout(15000), headers: { "User-Agent": USER_AGENT, Accept: method === "HEAD" ? "*/*" : "text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.5", "Accept-Language": "en" } });
      } catch (e) { return { ok: false, status: 0, body: "", url: current, error: e instanceof Error && e.name === "TimeoutError" ? "timed out" : "unreachable" }; }
      const loc = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (loc) {
        try { await res.body?.cancel(); } catch { /* ignore */ }
        const next = cleanUrl(loc, current);
        if (!next) return { ok: false, status: res.status, body: "", url: current, error: "redirected to a non-public address" };
        current = next; continue;
      }
      if (res.status === 401 || res.status === 403 || res.status === 429) { try { await res.body?.cancel(); } catch { /* ignore */ } return { ok: false, status: res.status, body: "", url: current, error: `refused (HTTP ${res.status})`, blocked: "refused" }; }
      if (method === "HEAD") { try { await res.body?.cancel(); } catch { /* ignore */ } return { ok: res.ok, status: res.status, body: "", url: current }; }
      let body = "";
      try {
        let stream = res.body;
        const gz = /\.gz$/i.test(current.pathname) && !/gzip/i.test(res.headers.get("content-encoding") ?? "");
        if (stream && gz) stream = stream.pipeThrough(new DecompressionStream("gzip") as any) as ReadableStream<Uint8Array>;
        const reader = stream?.getReader();
        if (reader) { const dec = new TextDecoder(); let size = 0; while (size < MAX_BYTES) { const { done, value } = await reader.read(); if (done || !value) break; size += value.length; body += dec.decode(value, { stream: true }); } try { await reader.cancel(); } catch { /* done */ } }
      } catch { return { ok: false, status: res.status, body: "", url: current, error: "couldn't read the response" }; }
      return { ok: res.ok, status: res.status, body, url: current };
    }
    return { ok: false, status: 0, body: "", url: current, error: "too many redirects" };
  }
}

const re = (p: string | null) => { if (!p) return null; try { return new RegExp(p, "i"); } catch { return null; } };
const nowIso = () => new Date().toISOString();

// ------------------------------------------------------------------ discovery
async function discover(db: any, c: Crawler, s: Source, run: Run): Promise<void> {
  const inc = re(s.include_pattern), exc = re(s.exclude_pattern);
  const home = new URL(s.home_url);
  const matches = (u: URL) => hostOf(u) === hostOf(home) && (!inc || inc.test(u.pathname)) && !(exc && exc.test(u.pathname));
  const found = new Map<string, { lastmod: string | null; hint: Record<string, unknown> }>();
  const seen: string[] = [];
  let refused = 0, robotsBlocked = 0, fetched = 0, rateLimited = 0;

  if (s.method === "sitemap") {
    let roots = s.sitemaps;
    if (!roots.length) {
      const r = await c.get(new URL("/robots.txt", home));
      roots = r.ok ? parseRobots(r.body).sitemaps : [];
    }
    const cursor = Number(s.state.sitemap_cursor ?? 0);
    let nextCursor = cursor;
    const readSitemap = async (loc: string, depth: number): Promise<void> => {
      const u = cleanUrl(loc); if (!u || c.timeLeft() < 15000) return;
      const g = await c.get(u); fetched++;
      if (!g.ok) { if (g.blocked === "robots") robotsBlocked++; if (g.blocked === "refused") { if (g.status === 429) rateLimited++; else refused++; } run.errors.push({ url: u.toString(), error: g.error ?? `HTTP ${g.status}` }); return; }
      const sm = parseSitemap(g.body);
      if (sm.kind === "index" && depth < 2) {
        const ordered = orderChildSitemaps(sm.entries, s.sitemap_pick);
        const first = ordered.slice(0, s.max_sitemaps_per_run);
        // Plus one older sitemap per run (rotating), so the back catalogue is covered gradually.
        const rest = ordered.slice(s.max_sitemaps_per_run);
        const extra = rest.length ? [rest[cursor % rest.length]] : [];
        if (rest.length) nextCursor = (cursor + 1) % rest.length;
        if (!ordered.length) run.notes.push(`sitemap index ${u.pathname} has no child sitemaps matching "${s.sitemap_pick ?? ""}"`);
        for (const e of [...first, ...extra]) await readSitemap(e.loc, depth + 1);
        return;
      }
      for (const e of sm.entries as SitemapEntry[]) {
        const eu = cleanUrl(e.loc); if (!eu) continue;
        if (seen.length < 12) seen.push(eu.pathname);
        if (matches(eu)) found.set(eu.toString(), { lastmod: e.lastmod, hint: {} });
      }
    };
    for (const root of roots.slice(0, 3)) await readSitemap(root, 0);
    await db.from("inspiration_sources").update({ state: { ...s.state, sitemap_cursor: nextCursor } }).eq("id", s.id);
  } else if (s.method === "listing") {
    // Pages to read: the configured listing pages, category pages from the source's sitemap (if set),
    // and category links found on earlier pages (tag_prefixes, no query strings). Six per run, rotating,
    // always starting with the first listing page so the newest entries are picked up.
    const pool = new Set<string>([...s.listing_pages, ...(((s.state.listing_pool as string[]) ?? []))]);
    if (s.sitemaps.length && !s.state.listing_sitemap_read) {
      for (const sm of s.sitemaps.slice(0, 2)) {
        const u = cleanUrl(sm); if (!u || c.timeLeft() < 20000) break;
        const g = await c.get(u); fetched++;
        if (!g.ok) { run.errors.push({ url: u.toString(), error: g.error ?? `HTTP ${g.status}` }); continue; }
        for (const e of parseSitemap(g.body).entries) {
          const eu = cleanUrl(e.loc); if (!eu || eu.search || hostOf(eu) !== hostOf(home)) continue;
          if (s.sitemap_pick && !eu.pathname.includes(s.sitemap_pick)) continue;
          if (pool.size < 400) pool.add(eu.toString());
        }
      }
    }
    const list = [...pool];
    let cursor = Number(s.state.listing_cursor ?? 0) % Math.max(1, list.length);
    const batch = [...new Set([list[0], ...Array.from({ length: Math.min(5, Math.max(0, list.length - 1)) }, (_, i) => list[1 + ((cursor + i) % Math.max(1, list.length - 1))])])].filter(Boolean);
    const nextCursor = cursor + 5;
    const prefixes = s.tag_prefixes.filter((x) => x.startsWith("/") && !x.includes("?"));
    for (const page of batch) {
      const u = cleanUrl(page); if (!u || c.timeLeft() < 15000) break;
      const g = await c.get(u); fetched++;
      if (!g.ok) { if (g.blocked === "robots") robotsBlocked++; if (g.blocked === "refused") { if (g.status === 429) rateLimited++; else refused++; } run.errors.push({ url: u.toString(), error: g.error ?? `HTTP ${g.status}` }); continue; }
      const meta = readPage(g.body, g.url);
      for (const a of meta.anchors) {
        if (hostOf(a.href) === hostOf(home) && seen.length < 12 && !seen.includes(a.href.pathname)) seen.push(a.href.pathname);
        const clean = new URL(a.href.toString()); clean.search = ""; clean.hash = "";
        if (hostOf(clean) === hostOf(home) && !a.href.search && prefixes.some((p) => clean.pathname.startsWith(p)) && pool.size < 400 && !matches(clean)) pool.add(clean.toString());
        if (!matches(clean)) continue;
        if (!found.has(clean.toString())) found.set(clean.toString(), { lastmod: null, hint: { title: a.text || a.title || null } });
      }
    }
    // A full pass is done when the rotation reaches the end of the (possibly grown) pool.
    const finalLen = Math.min(pool.size, 400);
    const wrapped = finalLen <= 1 || nextCursor >= finalLen - 1;
    cursor = finalLen > 1 ? nextCursor % (finalLen - 1) : 0;
    await db.from("inspiration_sources").update({ state: { ...s.state, listing_pool: [...pool].slice(0, 400), listing_cursor: cursor, listing_sitemap_read: true, listing_cycle_done: Boolean(s.state.listing_cycle_done) || wrapped } }).eq("id", s.id);
    run.notes.push(`read ${batch.length} of ${pool.size} listing page(s)`);
  }

  run.discovered += found.size;
  if (!found.size) {
    run.samples = seen;
    if (fetched && rateLimited && rateLimited >= fetched) run.notes.push("rate limited by the site (HTTP 429)");
    else if (fetched && (refused + robotsBlocked) >= fetched) run.notes.push(robotsBlocked ? "discovery blocked by robots.txt" : "the site refused our requests");
    else run.notes.push("no individual example URLs found in the published pages");
  } else run.samples = [...found.keys()].slice(0, 5);

  // Queue new URLs; re-check known ones only when the source says they changed (lastmod).
  const entries = [...found.entries()].sort((a, b) => String(b[1].lastmod ?? "").localeCompare(String(a[1].lastmod ?? ""))).slice(0, 1500);
  for (let i = 0; i < entries.length; i += 150) {
    const chunk = entries.slice(i, i + 150);
    const { data: have } = await db.from("inspiration_queue").select("url,lastmod,status").in("url", chunk.map(([u]) => u));
    const known = new Map<string, any>((have ?? []).map((h: any) => [h.url, h]));
    const fresh = chunk.filter(([u]) => !known.has(u)).map(([url, v]) => ({ url, source_id: s.id, lastmod: v.lastmod, hint: v.hint, status: "pending" }));
    if (fresh.length) { const { error } = await db.from("inspiration_queue").insert(fresh); if (!error) run.queued += fresh.length; else run.errors.push({ error: `queue insert: ${error.message}` }); }
    const changed = chunk.filter(([u, v]) => { const k = known.get(u); return k && k.status === "done" && v.lastmod && k.lastmod && v.lastmod !== k.lastmod; }).map(([u]) => u);
    for (const [u, v] of chunk) if (changed.includes(u)) await db.from("inspiration_queue").update({ status: "pending", lastmod: v.lastmod, next_attempt_at: nowIso(), updated_at: nowIso() }).eq("url", u);
  }
  await db.from("inspiration_sources").update({ last_discovery_at: nowIso(), discovered_total: (s.discovered_total ?? 0) + run.queued }).eq("id", s.id);
}

// ------------------------------------------------------------------ one example page
async function processItem(db: any, c: Crawler, s: Source, q: any, run: Run): Promise<void> {
  const url = cleanUrl(q.url);
  const fail = async (msg: string, final = false) => {
    const attempts = (q.attempts ?? 0) + 1;
    const dead = final || attempts >= 3;
    await db.from("inspiration_queue").update({ status: dead ? "failed" : "pending", attempts, last_error: msg.slice(0, 300), next_attempt_at: new Date(Date.now() + 2 ** attempts * 30 * 60_000).toISOString(), updated_at: nowIso() }).eq("url", q.url);
    run.failed++; if (run.errors.length < 25) run.errors.push({ url: q.url, error: msg });
  };
  const skip = async (why: string) => { await db.from("inspiration_queue").update({ status: "skipped", last_error: why.slice(0, 300), updated_at: nowIso() }).eq("url", q.url); run.skipped++; };
  if (!url) return skip("invalid URL");
  const g = await c.get(url);
  if (!g.ok) {
    if (g.status === 404 || g.status === 410) return skip(`page no longer exists (HTTP ${g.status})`);
    return fail(g.error ?? `HTTP ${g.status}`, g.blocked === "robots");
  }
  const meta = readPage(g.body, g.url);
  const external = hostOf(g.url) !== hostOf(new URL(s.home_url));
  const title = cleanTitle(meta.title ?? (q.hint?.title as string | undefined) ?? null, s.name) ?? (external ? meta.siteName : null);
  if (!title) return skip("no title on the page");
  // Vendor template reviews and template/theme catalogues aren't real-world examples.
  if (/\btemplate review\b|^[\w\s]{0,30}\btemplates?$/i.test(meta.title ?? "") && !q.manual) return skip("template listing, not a real example");
  const isEmail = s.default_kind === "email";
  // A manually imported link to the site itself is its own original; gallery pages point to it.
  const original = isEmail ? null : external ? stripTracking(g.url) : pickOriginal(meta, g.url, s.id === "dark-design" ? ["framer.com"] : []);
  const listing = stripTracking(g.url);
  const key = canonicalKey(original ?? listing);
  const { tags, byPrefix } = tagsFrom(meta, g.url, s.tag_prefixes);
  const hintKind = typeof q.hint?.kind === "string" ? (q.hint.kind as Kind) : null;
  const facets = classify({ defaultKind: hintKind ?? s.default_kind, sourcePlatform: s.platform, sourceTheme: s.theme, tags, byPrefix, title, description: meta.description, keywords: meta.keywords });
  if (hintKind) facets.kind = hintKind;
  const img = s.use_source_images || external ? cleanUrl(meta.image, g.url) : null;
  const split = isEmail ? splitEmailTitle(title) : { subject: title, brand: null };
  const brand = split.brand;
  const row = {
    source_id: s.id, listing_url: listing.toString().slice(0, 600), original_url: original ? original.toString().slice(0, 600) : null, canonical_key: key,
    title: split.subject.slice(0, 200), brand, description: meta.description, kind: facets.kind, tags: tags.slice(0, 16), industries: facets.industries, styles: facets.styles,
    colors: facets.colors, theme: facets.theme, platform: facets.platform, image_url: img && img.protocol === "https:" ? img.toString().slice(0, 800) : null,
    image_status: img ? "unknown" : "none", attribution: `Listed on ${s.name}`, source_published_at: (() => { const d = meta.published ?? q.lastmod; const t = d ? Date.parse(d) : NaN; return Number.isFinite(t) ? new Date(t).toISOString() : null; })(),
    manual: Boolean(q.manual), updated_at: nowIso(),
  };
  const { data: same } = await db.from("inspiration_examples").select("id,listing_url,source_id,also_listed_on,edited_by_admin").or(`canonical_key.eq.${JSON.stringify(key)},listing_url.eq.${JSON.stringify(row.listing_url)}`).limit(2);
  const existing = (same ?? [])[0];
  let exampleId: string | null = null;
  if (existing && existing.listing_url !== row.listing_url) {
    // The same site featured by another gallery (or under another listing): keep one record, remember both.
    const also = [...new Set([...(existing.also_listed_on ?? []), row.listing_url])].slice(0, 12);
    await db.from("inspiration_examples").update({ also_listed_on: also }).eq("id", existing.id);
    run.duplicates++; exampleId = existing.id;
  } else if (existing) {
    const patch: Record<string, unknown> = existing.edited_by_admin ? { image_url: row.image_url, source_published_at: row.source_published_at, updated_at: row.updated_at } : { ...row };
    delete patch.canonical_key; delete patch.listing_url;
    const { error } = await db.from("inspiration_examples").update(patch).eq("id", existing.id);
    if (error) return fail(`update failed: ${error.message}`);
    run.updated++; exampleId = existing.id;
  } else {
    const { data: ins, error } = await db.from("inspiration_examples").insert(row).select("id").single();
    if (error) { if (error.code === "23505") { run.duplicates++; await skip("duplicate of an existing example"); return; } return fail(`insert failed: ${error.message}`); }
    run.imported++; exampleId = ins.id;
  }
  await db.from("inspiration_queue").update({ status: "done", attempts: 0, last_error: null, example_id: exampleId, updated_at: nowIso() }).eq("url", q.url);
}

// ------------------------------------------------------------------ link checks
async function verifyLinks(db: any, c: Crawler, limit: number, reverifyDays: number, run: Run): Promise<void> {
  if (limit <= 0) return;
  const before = new Date(Date.now() - reverifyDays * 86400_000).toISOString();
  const { data } = await db.from("inspiration_examples").select("id,original_url,listing_url,image_url,link_status").or(`link_checked_at.is.null,link_checked_at.lt.${before}`).order("link_checked_at", { ascending: true, nullsFirst: true }).limit(limit);
  for (const e of data ?? []) {
    if (c.timeLeft() < 8000) break;
    const target = cleanUrl(e.original_url ?? e.listing_url);
    if (!target) continue;
    let g = await c.get(target, "HEAD");
    if (!g.ok && (g.status === 405 || g.status === 501)) g = await c.get(target, "GET");
    const status = g.blocked === "robots" || g.blocked === "refused" ? "blocked" : g.ok ? (canonicalKey(g.url) !== canonicalKey(target) ? "redirected" : "ok") : (g.status === 404 || g.status === 410 || (g.status === 0 && g.error === "unreachable")) ? "broken" : e.link_status === "broken" ? "broken" : "unknown";
    const patch: Record<string, unknown> = { link_status: status, link_checked_at: nowIso() };
    if (e.image_url && c.timeLeft() > 8000) { const im = cleanUrl(e.image_url); if (im) { const gi = await c.get(im, "HEAD"); patch.image_status = gi.ok ? "ok" : gi.status === 404 || gi.status === 410 ? "broken" : "unknown"; } }
    await db.from("inspiration_examples").update(patch).eq("id", e.id);
    run.verified++; if (status === "broken") run.broken++;
  }
}

// ------------------------------------------------------------------ the tick
type Settings = { enabled: boolean; verify_per_tick: number; reverify_days: number };

/** Claim up to `max` sources for this tick: due ones first, then any with pages waiting (incl. manual imports). */
async function claimSources(db: any, max: number): Promise<Source[]> {
  const out: Source[] = [];
  const { data: due } = await db.from("inspiration_sources").select("*").eq("enabled", true).neq("method", "manual").lte("next_run_at", nowIso()).order("next_run_at").limit(10);
  const { data: q } = await db.from("inspiration_queue").select("source_id,manual").eq("status", "pending").lte("next_attempt_at", nowIso()).order("next_attempt_at").limit(200);
  const { data: all } = await db.from("inspiration_sources").select("*");
  const waiting = [...new Set((q ?? []).filter((x: any) => { const s = (all ?? []).find((y: any) => y.id === x.source_id); return s && (s.enabled || x.manual); }).map((x: any) => x.source_id))];
  const candidates: { s: Source; due: boolean }[] = [...(due ?? []).map((s: Source) => ({ s, due: true })), ...waiting.filter((id) => !(due ?? []).some((d: Source) => d.id === id)).map((id) => ({ s: (all ?? []).find((y: any) => y.id === id) as Source, due: false }))];
  for (const c of candidates) {
    if (out.length >= max) break;
    // Atomic claim: only one tick can move next_run_at forward from its current value.
    const { data: claimed } = await db.from("inspiration_sources").update({ next_run_at: new Date(Date.now() + 15 * 60_000).toISOString(), last_run_at: nowIso() }).eq("id", c.s.id).eq("next_run_at", (c.s as any).next_run_at).select("*");
    if (claimed?.length) out.push({ ...(claimed[0] as Source), state: c.s.state, _due: c.due } as Source);
  }
  return out;
}

async function runSource(db: any, s: Source, trigger: string, deadline: number): Promise<Run & { source: string }> {
  const run: Run = { discovered: 0, queued: 0, imported: 0, updated: 0, duplicates: 0, skipped: 0, failed: 0, verified: 0, broken: 0, requests: 0, errors: [], samples: [], notes: [] };
  const c = new Crawler(deadline, s.min_delay_ms ?? 1500);
  const { data: r } = await db.from("inspiration_runs").insert({ source_id: s.id, trigger }).select("id").single();
  const runId = r?.id ?? null;
  try {
    // Listing sources keep reading new category pages each run until they've covered them all once.
    const listingBackfill = s.method === "listing" && !s.state?.listing_cycle_done && (((s.state?.listing_pool as string[] | undefined)?.length ?? 0) > 1 || s.tag_prefixes.some((x) => x.startsWith("/") && !x.includes("?")) || s.sitemaps.length > 0 || s.listing_pages.length > 1);
    const discoveryDue = s.method !== "manual" && s.enabled && (listingBackfill || !s.last_discovery_at || Date.now() - Date.parse(s.last_discovery_at) > s.refresh_hours * 3600_000 || (trigger === "admin" && !s.state?.discovery_done && Boolean((s as any)._due)));
    if (discoveryDue) await discover(db, c, s, run);
    let q = db.from("inspiration_queue").select("*").eq("source_id", s.id).eq("status", "pending").lte("next_attempt_at", nowIso()).order("manual", { ascending: false }).order("created_at").limit(Math.max(1, s.max_new_per_run));
    if (!s.enabled) q = q.eq("manual", true);
    const { data: items } = await q;
    for (const it of items ?? []) { if (c.timeLeft() < 12000) break; await processItem(db, c, s, it, run); }
  } catch (e) {
    run.errors.push({ error: e instanceof Error ? e.message.slice(0, 300) : "run failed" });
  }
  // Status from what actually happened, never from intent.
  const { count: pending } = await db.from("inspiration_queue").select("url", { count: "exact", head: true }).eq("source_id", s.id).eq("status", "pending");
  const { count: total } = await db.from("inspiration_examples").select("id", { count: "exact", head: true }).eq("source_id", s.id);
  const { count: withOriginal } = await db.from("inspiration_examples").select("id", { count: "exact", head: true }).eq("source_id", s.id).not("original_url", "is", null);
  const rateLimitedNote = run.notes.includes("rate limited by the site (HTTP 429)");
  const blockedNote = run.notes.find((n) => /blocked|refused/.test(n));
  let status = s.status, reason: string | null = (s as any).status_reason ?? null;
  if (s.method === "manual") { status = "blocked"; reason = null; }
  else if ((total ?? 0) === 0 && (pending ?? 0) > 0) { status = "not_started"; reason = `${pending} example page(s) found and waiting to be read.`; }
  else if ((total ?? 0) === 0 && rateLimitedNote) { status = "partial"; reason = "The site asked us to slow down (HTTP 429). We wait and try again at the next refresh."; }
  else if ((total ?? 0) === 0 && blockedNote) { status = "blocked"; reason = blockedNote === "the site refused our requests" ? "The site refuses automated requests (HTTP 403/429), so nothing can be collected without permission." : "robots.txt doesn't allow these pages to be read (or couldn't be read, which counts as no)."; }
  else if ((total ?? 0) === 0 && run.notes.some((n) => n.startsWith("no individual"))) { status = "blocked"; reason = "No individual example links are published in pages we're allowed to read (the site renders them in the browser or hides them)."; }
  else if ((total ?? 0) > 0) {
    const expectsOriginal = s.default_kind !== "email" && s.category !== "design";
    const lowOriginal = expectsOriginal && (withOriginal ?? 0) < (total ?? 0) * 0.5;
    status = run.failed > run.imported + run.updated + run.duplicates || lowOriginal ? "partial" : "working";
    reason = lowOriginal ? `Only ${withOriginal} of ${total} examples have a verified link to the original site; the others link to the gallery page.` : run.failed ? `${run.failed} page(s) failed in the last run and will be retried.` : null;
  }
  const ok = run.imported + run.updated + run.duplicates > 0 || (run.discovered > 0 && run.failed === 0);
  await db.from("inspiration_sources").update({
    status, status_reason: reason, imported_total: total ?? 0,
    next_run_at: new Date(Date.now() + (rateLimitedNote ? 6 * 3600_000 : (pending ?? 0) > 0 || (s.method === "listing" && !s.state?.listing_cycle_done && run.discovered > 0) ? 10 * 60_000 : s.refresh_hours * 3600_000)).toISOString(),
    ...(rateLimitedNote ? { last_discovery_at: null } : {}),
    ...(ok ? { last_success_at: nowIso() } : {}), updated_at: nowIso(),
  }).eq("id", s.id);
  run.requests = c.requests;
  if (runId) await db.from("inspiration_runs").update({ finished_at: nowIso(), ok: run.failed === 0 || run.imported + run.updated > 0, discovered: run.discovered, queued: run.queued, imported: run.imported, updated: run.updated, duplicates: run.duplicates, skipped: run.skipped, failed: run.failed, verified: 0, broken: 0, requests: run.requests, notes: run.notes.join("; ") || null, errors: run.errors.slice(0, 25), samples: run.samples }).eq("id", runId);
  return { ...run, source: s.id };
}

/** One tick: up to 3 sources in parallel (different sites, each with its own polite pacing), then link checks. */
export async function inspirationTick(trigger: string): Promise<Record<string, unknown>> {
  const db = await adminDb();
  const { data: settings } = await db.from("inspiration_settings").select("*").eq("id", 1).maybeSingle() as { data: Settings | null };
  if (!settings?.enabled) return { ok: true, skipped: "library crawling is switched off" };
  const deadline = Date.now() + TIME_BUDGET_MS;
  const sources = await claimSources(db, 3);
  const results = await Promise.all(sources.map((s) => runSource(db, s, trigger, deadline).catch((e) => ({ source: s.id, error: e instanceof Error ? e.message : "failed" }))));
  const check: Run = { discovered: 0, queued: 0, imported: 0, updated: 0, duplicates: 0, skipped: 0, failed: 0, verified: 0, broken: 0, requests: 0, errors: [], samples: [], notes: [] };
  const c = new Crawler(deadline + 20_000, 1500);
  await verifyLinks(db, c, settings.verify_per_tick ?? 6, settings.reverify_days ?? 14, check);
  if (check.verified) await db.from("inspiration_runs").insert({ source_id: null, trigger: "verify", finished_at: nowIso(), ok: true, verified: check.verified, broken: check.broken, requests: c.requests });
  return { ok: true, sources: results.map((r: any) => ({ source: r.source, discovered: r.discovered, queued: r.queued, imported: r.imported, updated: r.updated, duplicates: r.duplicates, skipped: r.skipped, failed: r.failed, notes: r.notes?.join?.("; ") || r.error || null })), verified: check.verified, broken: check.broken };
}
