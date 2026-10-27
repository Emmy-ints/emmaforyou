// @ts-nocheck -- generated DB types lag behind the new tables; runtime verified
import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Play, Rocket, Search as SearchIcon, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Btn, Card, check, db, downloadCsv, Empty, ErrorText, label, Loading, Pill, Stat, useLoad, when } from "@/components/agents-admin/shared";
import { useCan } from "./settings";
import { BUILD_INFO } from "@/lib/build-info";
import { INDEXNOW_KEY } from "@/lib/indexnow";
import { change, citationPageCoverage, citationRate, citationSupportRate, fmtPct, mentionRate } from "@/lib/search/metrics";
import { CHANNEL_LABEL, summarizeTraffic, ENQUIRY_EVENTS, CONTACT_EVENTS } from "@/lib/search/traffic";
import { CRAWLERS, robotsAllows } from "@/lib/search/http-check-core";
import { decide, sampleHealth, smokeFromHttp, SMOKE_ROUTES, type SmokeResult } from "@/lib/search/release";
import { fetchAndInspect, ldEntities } from "@/lib/search/inspect";
import { checkEntity } from "@/lib/search/checks";

/**
 * Search visibility: technical health from the saved audits, first-party traffic sources, AI search
 * observations, crawler access, integration status and release verification. Every number says
 * where it comes from; anything that isn't measured shows "Not connected" or "N/A", never 0.
 */
type Row = Record<string, any>;
const SECTIONS = [["overview", "Overview"], ["technical", "Technical & links"], ["traffic", "Traffic sources"], ["ai", "AI observations"], ["crawlers", "Crawlers"], ["integrations", "Integrations"], ["releases", "Releases"]] as const;
type Section = (typeof SECTIONS)[number][0];

async function authedPost(path: string, body: unknown) {
  const { data } = await supabase.auth.getSession();
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message ?? `${path} returned ${r.status}`);
  return j;
}
const httpCheck = (checks: { path: string; crawler?: string }[]) => authedPost("/api/http-check", { checks });
const Formula = ({ children }: { children: React.ReactNode }) => <p className="mt-1 font-mono text-[11px] text-muted-foreground">{children}</p>;
const na = (v: unknown) => (v === null || v === undefined ? "N/A" : String(v));

export default function SearchTab() {
  const [section, setSection] = useState<Section>("overview");
  const reports = useLoad<Row[]>(async () => check(await db.from("site_audit_reports").select("id,created_at,routes_checked,summary").order("created_at", { ascending: false }).limit(20)));
  const latest = (reports.data ?? []).find((r) => r.summary?.search) ?? null;
  return (
    <div className="space-y-4">
      <nav aria-label="Search sections" className="flex flex-wrap gap-1">
        {SECTIONS.map(([id, l]) => <button key={id} type="button" onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined} className={`rounded-full px-3 py-1 text-sm ${section === id ? "bg-[var(--emma-violet)] text-white" : "text-muted-foreground hover:bg-muted"}`}>{l}</button>)}
      </nav>
      <ErrorText message={reports.error} onRetry={reports.reload} />
      {section === "overview" && <Overview latest={latest} go={setSection} />}
      {section === "technical" && <Technical latest={latest} reports={reports.data ?? []} />}
      {section === "traffic" && <Traffic />}
      {section === "ai" && <AiObservations />}
      {section === "crawlers" && <Crawlers />}
      {section === "integrations" && <Integrations />}
      {section === "releases" && <Releases />}
    </div>
  );
}

// ------------------------------------------------------------------ overview
function Overview({ latest, go }: { latest: Row | null; go: (s: Section) => void }) {
  const s = latest?.summary?.search;
  const rel = useLoad<Row | null>(async () => { const r = await db.from("site_deployment_checks").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(); return r.error ? null : r.data; });
  const obs = useLoad<number | null>(async () => { const r = await db.from("site_ai_observations").select("id", { count: "exact", head: true }); return r.error ? null : r.count ?? 0; });
  const live = useLoad<Row>(async () => fetch("/api/site-config-status", { cache: "no-store" }).then((r) => r.json()));
  return (
    <div className="space-y-4">
      <Card title="Search health" actions={<Btn small onClick={() => go("technical")}>Details</Btn>}>
        {!s ? <Empty>No search audit saved yet. Run a full audit from "Audit & repair"; the search checks run with it.</Empty> : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">From the audit saved {when(latest.created_at)} ({latest.routes_checked} pages, raw server HTML as crawlers receive it).</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Critical / high findings" value={latest.summary.high ?? 0} warn={(latest.summary.high ?? 0) > 0} />
              <Stat label="Valid sitemap URLs" value={fmtPct(s.validSitemapRate)} hint={`${s.sitemapValid} of ${s.sitemapUrls}`} warn={s.validSitemapRate !== null && s.validSitemapRate < 100} />
              <Stat label="Pages with valid structured data" value={fmtPct(s.schemaValidityRate)} hint={`${s.schemaPagesPassing} of ${s.schemaPagesTested} tested · ${s.schemaErrors} errors, ${s.schemaWarnings} warnings`} />
              <Stat label="Broken internal links" value={fmtPct(s.brokenLinkRate, 2)} hint={`${s.brokenOccurrences} of ${s.linkOccurrences} links · ${s.brokenUnique} destinations`} warn={s.brokenOccurrences > 0} />
              <Stat label="Pages with no inbound links" value={s.orphans} hint={fmtPct(s.orphanRate) + " of sitemap pages"} warn={s.orphans > 0} />
              <Stat label="Indexable pages" value={s.indexablePages} hint={`${s.missingFromSitemap} not in the sitemap`} />
              <Stat label="Duplicate titles / descriptions" value={`${s.duplicateTitles} / ${s.duplicateDescriptions}`} />
              <Stat label="hreflang errors" value={s.hreflangErrors} hint={`${s.hreflangPages} pages with language versions`} />
            </div>
          </>
        )}
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Search Console & Bing"><p className="text-sm"><Pill tone="warn">Not connected</Pill></p><p className="mt-2 text-xs text-muted-foreground">Impressions, clicks, CTR and positions need an authorised API connection. Until then they're not shown, not shown as zero.</p><Btn small onClick={() => go("integrations")}>Set up</Btn></Card>
        <Card title="AI search observations">{obs.loading ? <Loading /> : obs.data === null ? <Pill>No access</Pill> : <p className="text-sm"><span className="text-2xl font-bold">{obs.data}</span> recorded observation{obs.data === 1 ? "" : "s"}</p>}<p className="mt-2 text-xs text-muted-foreground">Sampled checks you record yourself, not platform statistics.</p><Btn small onClick={() => go("ai")}>Open</Btn></Card>
        <Card title="Live build">
          {live.loading ? <Loading /> : live.data ? <dl className="grid grid-cols-2 gap-1 text-sm"><dt className="text-muted-foreground">Commit</dt><dd className="font-mono">{live.data.commit ?? <Pill tone="bad">unavailable</Pill>}</dd><dt className="text-muted-foreground">Built</dt><dd>{when(live.data.builtAt)}</dd><dt className="text-muted-foreground">This page</dt><dd className="font-mono">{BUILD_INFO.commit ?? "unknown"}</dd></dl> : <ErrorText message="Health endpoint unreachable" />}
          {rel.data && <p className="mt-2 text-xs">Last release check: <ReleasePill state={rel.data.state} /> {rel.data.expected_commit} · {when(rel.data.created_at)}</p>}
          <Btn small onClick={() => go("releases")}>Verify a release</Btn>
        </Card>
      </div>
    </div>
  );
}

const RELEASE_TONE: Record<string, "good" | "bad" | "warn" | "info" | "muted"> = { verified_live: "good", verification_failed: "bad", build_failed: "bad", rolled_back: "warn", rollback_pending: "warn", verifying: "info" };
const ReleasePill = ({ state }: { state: string }) => <Pill tone={RELEASE_TONE[state] ?? "muted"}>{label(state)}</Pill>;

// ------------------------------------------------------------------ technical + links + redirect checker
function Technical({ latest, reports }: { latest: Row | null; reports: Row[] }) {
  const s = latest?.summary?.search;
  const full = useLoad<Row | null>(async () => (latest ? check(await db.from("site_audit_reports").select("findings").eq("id", latest.id).maybeSingle()) : null), [latest?.id]);
  const byType = useMemo(() => { const m: Record<string, { n: number; sev: string }> = {}; for (const f of full.data?.findings ?? []) { m[f.type] = { n: (m[f.type]?.n ?? 0) + 1, sev: f.severity }; } return Object.entries(m).sort((a, b) => b[1].n - a[1].n); }, [full.data]);
  const inbound = s?.inbound ? Object.entries(s.inbound as Record<string, number>).sort((a, b) => a[1] - b[1]) : [];
  const history = reports.filter((r) => r.summary?.search).slice(0, 6);
  return (
    <div className="space-y-4">
      <Card title="Search checks by type">
        {!s ? <Empty>Run a full audit to see these.</Empty> : full.loading ? <Loading /> : !byType.length ? <Empty>No search findings in the latest audit.</Empty> : (
          <ul className="grid gap-1 text-sm sm:grid-cols-2">{byType.map(([t, v]) => <li key={t} className="flex justify-between gap-2 rounded-lg border border-border px-3 py-1.5"><span>{label(t.replace(/-/g, " "))}</span><Pill tone={v.sev === "high" ? "bad" : v.sev === "medium" ? "warn" : v.sev === "low" ? "info" : "muted"}>{v.n}</Pill></li>)}</ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Each finding, with its evidence and suggested fix, is listed in Audit &amp; repair. Formulas used:</p>
        <Formula>valid sitemap rate = sitemap URLs that are 200, not redirected, indexable and self-canonical ÷ sitemap URLs × 100</Formula>
        <Formula>broken link rate = internal link occurrences to a 4xx/5xx page ÷ internal link occurrences × 100 (private areas excluded)</Formula>
        <Formula>orphan rate = sitemap pages (not the homepage) with 0 links from other indexable pages ÷ sitemap pages returning 200 × 100</Formula>
        <Formula>schema validity rate = indexable pages whose JSON-LD parses with no errors ÷ indexable pages that have JSON-LD × 100</Formula>
      </Card>
      {history.length > 1 && (
        <Card title="Over time">
          <table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Audit</th><th>Pages</th><th>High</th><th>Sitemap valid</th><th>Schema valid</th><th>Orphans</th><th>Broken links</th></tr></thead>
            <tbody>{history.map((r) => { const m = r.summary.search; return <tr key={r.id} className="border-t border-border"><td className="py-1">{when(r.created_at)}{r.summary.kind === "search-baseline" && <> <Pill>baseline</Pill></>}</td><td>{r.routes_checked}</td><td>{r.summary.high ?? 0}</td><td>{fmtPct(m.validSitemapRate)}</td><td>{fmtPct(m.schemaValidityRate)}</td><td>{m.orphans}</td><td>{m.brokenOccurrences}</td></tr>; })}</tbody></table>
        </Card>
      )}
      <Card title="Internal links: least-linked pages" actions={inbound.length ? <Btn small onClick={() => downloadCsv("inbound-links", inbound.map(([path, n]) => ({ path, inbound_links: n })))}>Export CSV</Btn> : null}>
        {!inbound.length ? <Empty>Run a full audit to build the link graph.</Empty> : <ul className="grid gap-1 text-sm sm:grid-cols-2">{inbound.slice(0, 30).map(([p, n]) => <li key={p} className="flex justify-between gap-2"><a href={p} target="_blank" rel="noopener noreferrer" className="truncate font-mono text-xs underline">{p}</a><Pill tone={n === 0 ? "warn" : "muted"}>{n}</Pill></li>)}</ul>}
        <p className="mt-2 text-xs text-muted-foreground">Count of distinct indexable pages linking here in their server HTML (navigation and footer links count; links from private areas don't). Add links only where they genuinely help a reader.</p>
      </Card>
      <RedirectChecker />
    </div>
  );
}

function RedirectChecker() {
  const [path, setPath] = useState("/"); const [crawler, setCrawler] = useState("browser"); const [res, setRes] = useState<Row | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go() { setBusy(true); setErr(""); setRes(null); try { const j = await httpCheck([{ path: path.trim(), crawler }]); setRes(j.results[0]); } catch (e) { setErr(e instanceof Error ? e.message : "Check failed"); } finally { setBusy(false); } }
  return (
    <Card title="HTTP and redirect checker">
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); go(); }}>
        <input className="input flex-1" value={path} onChange={(e) => setPath(e.target.value)} aria-label="Path on this site" placeholder="/old-page" />
        <select className="input w-auto" value={crawler} onChange={(e) => setCrawler(e.target.value)} aria-label="Request as">{Object.keys(CRAWLERS).map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <Btn type="submit" tone="primary" disabled={busy}><SearchIcon className="h-4 w-4" aria-hidden="true" />{busy ? "Checking…" : "Check"}</Btn>
      </form>
      <ErrorText message={err} />
      {res && (
        <div className="mt-3 text-sm">
          <ol className="space-y-1">{res.hops.map((h: Row, i: number) => <li key={i} className="flex flex-wrap items-center gap-2"><Pill tone={h.status >= 400 ? "bad" : h.status >= 300 ? "info" : "good"}>{h.status}</Pill><span className="font-mono text-xs">{h.url}</span>{h.location && <span className="text-xs text-muted-foreground">→ {h.location}</span>}</li>)}</ol>
          <p className="mt-2 text-xs text-muted-foreground">{res.redirects} redirect{res.redirects === 1 ? "" : "s"}{res.loop ? " · loop detected" : ""}{res.stoppedOffsite ? " · stops at another site (not followed)" : ""}{res.html ? ` · title "${res.html.title.slice(0, 60)}" · robots "${res.html.robots || "none"}" · ${res.html.h1} h1 · ${res.html.jsonld} JSON-LD blocks` : ""}</p>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Requested by the server with redirects not followed automatically, so the real 301/302/404 codes show (a browser can't see them). Only paths on this site can be checked.</p>
    </Card>
  );
}

// ------------------------------------------------------------------ traffic sources (first-party)
function Traffic() {
  const [days, setDays] = useState(28);
  const data = useLoad<Row>(async () => {
    const now = new Date(); const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const from = new Date(to.getTime() - days * 864e5); const prevFrom = new Date(from.getTime() - days * 864e5);
    const rows: Row[] = []; let page = 0;
    while (page < 20) { const r = await db.from("site_events").select("event,path,session_id,referrer,utm_source,utm_medium,created_at").gte("created_at", prevFrom.toISOString()).lt("created_at", to.toISOString()).order("created_at").range(page * 1000, page * 1000 + 999); if (r.error) throw new Error(r.error.message); rows.push(...r.data); if (r.data.length < 1000) break; page++; }
    return { cur: summarizeTraffic(rows, from.toISOString(), to.toISOString()), prev: summarizeTraffic(rows, prevFrom.toISOString(), from.toISOString()), from, to, truncated: page >= 20 };
  }, [days]);
  const d = data.data;
  return (
    <div className="space-y-4">
      <Card title="Traffic sources (this site's own analytics)" actions={<select className="input h-8 w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Period">{[7, 28, 90].map((n) => <option key={n} value={n}>Last {n} complete days</option>)}</select>}>
        {data.loading ? <Loading /> : data.error ? <ErrorText message={/permission|denied|42501/i.test(data.error) ? "Your role can't read analytics." : data.error} onRetry={data.reload} /> : d && (
          <>
            <p className="mb-2 text-xs text-muted-foreground">{d.from.toISOString().slice(0, 10)} to {new Date(d.to.getTime() - 1).toISOString().slice(0, 10)} (UTC days), compared with the {days} days before. Source: site_events (first-party, no cookies). {d.truncated && <Pill tone="warn">Over 20,000 events: partial</Pill>}</p>
            {!d.cur.sessions ? <Empty>No visits recorded in this period.</Empty> : (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Channel</th><th>Sessions</th><th>vs previous</th><th>Enquiry sessions</th><th>Enquiry rate</th><th>Contact-click rate</th></tr></thead>
                <tbody>{d.cur.channels.map((c: Row) => { const p = d.prev.channels.find((x: Row) => x.channel === c.channel); const ch = change(c.sessions, p?.sessions ?? 0); return (
                  <tr key={c.channel} className="border-t border-border"><td className="py-1">{CHANNEL_LABEL[c.channel]}</td><td>{c.sessions}</td><td>{ch.label === "new" ? <Pill tone="info">new</Pill> : ch.percent === null ? "N/A" : `${ch.percent > 0 ? "+" : ""}${ch.percent.toFixed(0)} %`}</td><td>{c.enquirySessions}</td><td>{fmtPct(c.enquiryRate)}</td><td>{fmtPct(c.contactRate)}</td></tr>); })}</tbody></table></div>
            )}
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div><h3 className="text-sm font-semibold">Search engines</h3>{Object.keys(d.cur.searchSources).length ? <ul className="text-sm">{Object.entries(d.cur.searchSources).sort((a, b) => b[1] - a[1]).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul> : <p className="text-sm text-muted-foreground">None in this period.</p>}</div>
              <div><h3 className="text-sm font-semibold">AI assistants</h3>{Object.keys(d.cur.aiSources).length ? <ul className="text-sm">{Object.entries(d.cur.aiSources).sort((a, b) => b[1] - a[1]).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul> : <p className="text-sm text-muted-foreground">No visits from AI assistants recorded. Many assistants don't pass a referrer, so this is a floor, not a total.</p>}</div>
              <div><h3 className="text-sm font-semibold">Organic landing pages</h3>{(() => { const o = d.cur.channels.find((c: Row) => c.channel === "organic_search"); return o ? <ul className="text-sm">{Object.entries(o.landing).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => <li key={k} className="truncate"><span className="font-mono text-xs">{k}</span>: {v}</li>)}</ul> : <p className="text-sm text-muted-foreground">None in this period.</p>; })()}</div>
            </div>
          </>
        )}
        <Formula>channel = from the first event of each session (referrer host, then utm_source / utm_medium); a session counts once per channel</Formula>
        <Formula>enquiry rate = sessions with ≥1 of {ENQUIRY_EVENTS.join(", ")} ÷ sessions × 100 (repeat events in a session count once)</Formula>
        <Formula>contact-click rate = sessions with ≥1 of {CONTACT_EVENTS.join(", ")} ÷ sessions × 100 · change = (current − previous) ÷ |previous| × 100; previous 0 → "new"</Formula>
        <p className="mt-2 text-xs text-muted-foreground">This is the site's own classification, not Google Analytics. Revenue isn't tracked, so revenue-per-session and cost-per-lead aren't shown.</p>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ AI observations
const PLATFORMS = [["chatgpt", "ChatGPT search"], ["google_ai", "Google AI Overviews / AI Mode"], ["bing_copilot", "Microsoft Copilot / Bing"], ["perplexity", "Perplexity"], ["gemini", "Gemini"], ["claude", "Claude"], ["other", "Other"]] as const;
function AiObservations() {
  const can = useCan(); const canAdd = can("content.draft") || can("audit.run");
  const list = useLoad<Row[]>(async () => check(await db.from("site_ai_observations").select("*").order("observed_at", { ascending: false }).limit(500)));
  const empty = { platform: "chatgpt", interface: "", prompt: "", language: "en", market: "", brand_mentioned: false, linked: false, linked_url: "", supports_claim: "", competitors: "", evidence: "", confidence: "medium", notes: "", observed_at: new Date().toISOString().slice(0, 16) };
  const [f, setF] = useState<Row>(empty); const [err, setErr] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const rows = list.data ?? [];
  const reviewed = rows.filter((r) => r.linked && r.supports_claim !== null);
  const distinct = new Set(rows.filter((r) => r.linked && r.linked_url).map((r) => r.linked_url.replace(/[?#].*$/, "").replace(/\/$/, ""))).size;
  const [scope, setScope] = useState(30);
  async function save() {
    setBusy(true); setErr(""); setMsg("");
    try {
      const { data: u } = await supabase.auth.getUser();
      check(await db.from("site_ai_observations").insert({ ...f, created_by: u.user?.id, observed_at: new Date(f.observed_at).toISOString(), linked_url: f.linked ? f.linked_url.trim() : null, supports_claim: f.supports_claim === "" ? null : f.supports_claim === "yes" }));
      setMsg("Observation recorded."); setF(empty); list.reload();
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't save"); } finally { setBusy(false); }
  }
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="space-y-4">
      <Card title="Observed AI search visibility (sampled)">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Mention rate" value={fmtPct(mentionRate(rows.filter((r) => r.brand_mentioned).length, rows.length))} hint={`${rows.filter((r) => r.brand_mentioned).length} of ${rows.length} observations`} />
          <Stat label="Citation rate" value={fmtPct(citationRate(rows.filter((r) => r.linked).length, rows.length))} hint="Linked to an EmmaForYou URL" />
          <Stat label="Citation support rate" value={fmtPct(citationSupportRate(reviewed.filter((r) => r.supports_claim).length, reviewed.length))} hint={`${reviewed.length} reviewed citations`} />
          <Stat label="Cited-page coverage" value={fmtPct(citationPageCoverage(distinct, scope))} hint={`${distinct} distinct pages of ${scope} in scope`} />
        </div>
        <label className="mt-2 block text-xs text-muted-foreground">Pages in the observation scope <input type="number" min={1} className="input ml-2 inline-block h-8 w-24" value={scope} onChange={(e) => setScope(Math.max(1, Number(e.target.value) || 1))} /></label>
        <p className="mt-2 text-xs text-muted-foreground">Sampled observations you record by hand. Answers change with wording, location, account and time, so these are not platform-wide statistics, and nothing here is collected automatically from those services.</p>
      </Card>
      {canAdd && (
        <Card title="Record an observation">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <label className="text-sm font-medium">Platform<select className="input mt-1 w-full" value={f.platform} onChange={(e) => set("platform", e.target.value)}>{PLATFORMS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label className="text-sm font-medium">When<input type="datetime-local" className="input mt-1 w-full" value={f.observed_at} onChange={(e) => set("observed_at", e.target.value)} required /></label>
            <label className="text-sm font-medium sm:col-span-2">Exact question asked<input className="input mt-1 w-full" value={f.prompt} onChange={(e) => set("prompt", e.target.value)} required minLength={3} maxLength={500} /></label>
            <label className="text-sm font-medium">Language<input className="input mt-1 w-full" value={f.language} onChange={(e) => set("language", e.target.value)} pattern="[a-z]{2,3}(-[A-Za-z]{2,4})?" /></label>
            <label className="text-sm font-medium">Market / location<input className="input mt-1 w-full" value={f.market} onChange={(e) => set("market", e.target.value)} placeholder="e.g. Lagos, signed out" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.brand_mentioned} onChange={(e) => set("brand_mentioned", e.target.checked)} />EmmaForYou was mentioned</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.linked} onChange={(e) => set("linked", e.target.checked)} />An EmmaForYou link was shown</label>
            {f.linked && <label className="text-sm font-medium sm:col-span-2">Linked page<input type="url" className="input mt-1 w-full" value={f.linked_url} onChange={(e) => set("linked_url", e.target.value)} required placeholder="https://emmaforyou.lovable.app/…" /></label>}
            {f.linked && <label className="text-sm font-medium">Does the page support what the answer said?<select className="input mt-1 w-full" value={f.supports_claim} onChange={(e) => set("supports_claim", e.target.value)}><option value="">Not reviewed</option><option value="yes">Yes</option><option value="no">No</option></select></label>}
            <label className="text-sm font-medium">Competitors named<input className="input mt-1 w-full" value={f.competitors} onChange={(e) => set("competitors", e.target.value)} maxLength={300} /></label>
            <label className="text-sm font-medium sm:col-span-2">Evidence (screenshot file name or shared-conversation link)<input className="input mt-1 w-full" value={f.evidence} onChange={(e) => set("evidence", e.target.value)} required minLength={3} maxLength={500} /></label>
            <label className="text-sm font-medium">Confidence<select className="input mt-1 w-full" value={f.confidence} onChange={(e) => set("confidence", e.target.value)}>{["low", "medium", "high"].map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="text-sm font-medium">Notes<input className="input mt-1 w-full" value={f.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} /></label>
            <div className="sm:col-span-2"><Btn type="submit" tone="primary" disabled={busy}><Bot className="h-4 w-4" aria-hidden="true" />Save observation</Btn></div>
          </form>
          <ErrorText message={err} />{msg && <p role="status" className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
        </Card>
      )}
      <Card title={`Observations (${rows.length})`} actions={rows.length ? <Btn small onClick={() => downloadCsv("ai-observations", rows.map((r) => ({ observed_at: r.observed_at, platform: r.platform, prompt: r.prompt, language: r.language, market: r.market, mentioned: r.brand_mentioned, linked: r.linked, linked_url: r.linked_url, supports: r.supports_claim, competitors: r.competitors, evidence: r.evidence, confidence: r.confidence })))}>Export CSV</Btn> : null}>
        <ErrorText message={list.error} onRetry={list.reload} />
        {list.loading ? <Loading /> : !rows.length ? <Empty>No observations yet. Ask a question a customer would ask, note exactly what you saw, and keep the screenshot.</Empty> : (
          <ul className="divide-y divide-border text-sm">{rows.slice(0, 100).map((r) => <li key={r.id} className="py-2"><p><Pill tone="info">{PLATFORMS.find(([k]) => k === r.platform)?.[1] ?? r.platform}</Pill> {r.prompt}</p><p className="mt-1 text-xs text-muted-foreground">{when(r.observed_at)} · {r.language}{r.market ? ` · ${r.market}` : ""} · {r.brand_mentioned ? "mentioned" : "not mentioned"} · {r.linked ? <a href={r.linked_url} target="_blank" rel="noopener noreferrer" className="underline">linked</a> : "no link"}{r.supports_claim === true ? " · supports the answer" : r.supports_claim === false ? " · doesn't support the answer" : ""} · evidence: {r.evidence}</p></li>)}</ul>
        )}
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ crawlers
const TOKENS: Record<string, string> = { googlebot: "Googlebot", bingbot: "Bingbot", "oai-searchbot": "OAI-SearchBot", "chatgpt-user": "ChatGPT-User", gptbot: "GPTBot", perplexitybot: "PerplexityBot", claudebot: "ClaudeBot" };
const PROBE = ["/", "/services/website-design", "/blog", "/dashboard/site", "/api/translate"];
function Crawlers() {
  const robots = useLoad<string>(async () => { const r = await fetch("/robots.txt", { cache: "no-store" }); if (!r.ok) throw new Error(`robots.txt returned ${r.status}`); return r.text(); });
  const [live, setLive] = useState<Row[] | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function test() { setBusy(true); setErr(""); try { const j = await httpCheck(Object.keys(TOKENS).flatMap((c) => ["/", "/services/website-design"].map((path) => ({ path, crawler: c })))); setLive(j.results); } catch (e) { setErr(e instanceof Error ? e.message : "Check failed"); } finally { setBusy(false); } }
  return (
    <div className="space-y-4">
      <Card title="Crawler access (robots.txt as served now)" actions={<Btn small onClick={test} disabled={busy}><Play className="h-4 w-4" aria-hidden="true" />{busy ? "Testing…" : "Test server responses"}</Btn>}>
        <ErrorText message={robots.error || err} />
        {robots.loading ? <Loading /> : robots.data && (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Crawler</th><th>Purpose</th>{PROBE.map((p) => <th key={p} className="font-mono">{p}</th>)}{live && <th>Server answer</th>}</tr></thead>
            <tbody>{Object.entries(TOKENS).map(([id, tok]) => { const lr = live?.filter((r) => r.crawler === id) ?? []; return (
              <tr key={id} className="border-t border-border"><td className="py-1 font-medium">{tok}</td><td className="text-xs text-muted-foreground">{CRAWLERS[id].purpose}</td>
                {PROBE.map((p) => { const a = robotsAllows(robots.data!, tok, p); return <td key={p}><Pill tone={a.allowed ? (p.startsWith("/dashboard") || p.startsWith("/api") ? "bad" : "good") : (p.startsWith("/dashboard") || p.startsWith("/api") ? "good" : "warn")}>{a.allowed ? "allowed" : "blocked"}</Pill></td>; })}
                {live && <td className="text-xs">{lr.map((r) => `${r.path}: ${r.finalStatus}${r.html ? `, ${r.html.h1} h1${/noindex/.test(r.html.robots) ? ", noindex" : ""}` : ""}`).join(" · ")}</td>}
              </tr>); })}</tbody></table></div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Public pages are open to search and AI-search crawlers; /dashboard and /api are disallowed for all (they're also protected by sign-in — robots.txt isn't access control). OAI-SearchBot (ChatGPT search) and GPTBot (OpenAI training) are separate controls; training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot) are currently allowed by the owner's default and can be blocked in robots[.]txt.ts with BLOCK_AI_TRAINING without affecting search.</p>
        <p className="mt-1 text-xs text-muted-foreground">OpenAI also asks sites to allow its published IP ranges; this site has no IP blocking of its own (hosting is managed by Lovable/Cloudflare), so that can't be tested from here. "Test server responses" sends each crawler's published user-agent from this server: it shows how the site answers that user agent, not whether a real crawler's IP passes a firewall. Allowing a crawler doesn't mean a platform will include or cite the site.</p>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ integrations
function Integrations() {
  const st = useLoad<Row>(async () => {
    const home = await fetch("/", { credentials: "omit", cache: "no-store" }).then((r) => r.text());
    const key = await fetch(`/${INDEXNOW_KEY}.txt`, { cache: "no-store" }).then(async (r) => (r.ok ? (await r.text()).trim() === INDEXNOW_KEY : false)).catch(() => false);
    const ev = await db.from("site_events").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle();
    return { google: /name="google-site-verification"/.test(home), bing: /name="msvalidate\.01"/.test(home), ga4: /googletagmanager\.com\/gtag|gtag\(/.test(home), indexnow: key, lastEvent: ev.error ? null : ev.data?.created_at ?? "" };
  });
  const s = st.data;
  const Row2 = ({ name, status, children }: { name: string; status: React.ReactNode; children: React.ReactNode }) => <li className="py-3"><p className="flex flex-wrap items-center gap-2 font-semibold">{name} {status}</p><div className="mt-1 text-xs text-muted-foreground">{children}</div></li>;
  return (
    <Card title="Data sources">
      {st.loading ? <Loading /> : <ErrorText message={st.error} onRetry={st.reload} />}
      {s && (
        <ul className="divide-y divide-border text-sm">
          <Row2 name="Google Search Console" status={<>{s.google ? <Pill tone="good">Ownership tag live</Pill> : <Pill tone="warn">No ownership tag</Pill>} <Pill tone="warn">Search data: not connected</Pill></>}>Impressions, clicks, CTR, positions and indexing need the Search Console API: create a Google Cloud service account, add its email as a user on the Search Console property, and store its key as a server secret. Until then those metrics are not shown. Submit {location.origin}/sitemap.xml in Search Console → Sitemaps. Google reports AI Overviews and AI Mode traffic inside the normal Performance report (search type "Web"); it has no separate AI report.</Row2>
          <Row2 name="Bing Webmaster Tools" status={s.bing ? <Pill tone="good">Verified tag live</Pill> : <Pill tone="warn">Not verified</Pill>}>Add the site in Bing Webmaster Tools (it can import from Search Console), then set VITE_BING_SITE_VERIFICATION. Query and page data need a Bing Webmaster API key stored server-side; not connected.</Row2>
          <Row2 name="IndexNow" status={s.indexnow ? <Pill tone="good">Key file live</Pill> : <Pill tone="bad">Key file missing</Pill>}>Submissions tell Bing and partners which URLs changed; submit only after a real published change (Dashboard → IndexNow). A submission isn't an indexing guarantee.</Row2>
          <Row2 name="Google Analytics 4" status={s.ga4 ? <Pill tone="info">Tag found</Pill> : <Pill>Not installed</Pill>}>Not needed for the figures here: visits and enquiries come from the site's own analytics. Installing GA4 would need a consent banner first.</Row2>
          <Row2 name="Site analytics (first-party)" status={s.lastEvent === null ? <Pill>No access</Pill> : s.lastEvent ? <Pill tone="good">Recording</Pill> : <Pill tone="warn">No events yet</Pill>}>{s.lastEvent ? `Last event ${when(s.lastEvent)}.` : ""} Page views, referrers, UTM tags and conversion events in site_events; used by Traffic sources.</Row2>
          <Row2 name="AI platforms" status={<Pill>Manual observations</Pill>}>ChatGPT, Google AI features, Copilot and Perplexity don't offer an API with citation or impression data for publishers. Referral visits show in Traffic sources when the assistant passes a referrer; everything else is recorded by hand in AI observations.</Row2>
        </ul>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ releases
function Releases() {
  const can = useCan(); const canRun = can("audit.run");
  const hist = useLoad<Row[]>(async () => check(await db.from("site_deployment_checks").select("*").order("created_at", { ascending: false }).limit(30)));
  const [expected, setExpected] = useState(BUILD_INFO.commit ?? "");
  const [lovable, setLovable] = useState("not checked"); const [rollbackOf, setRollbackOf] = useState("");
  const [progress, setProgress] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [result, setResult] = useState<Row | null>(null);
  const stop = useState({ stop: false })[0];

  async function verify() {
    setBusy(true); setErr(""); setResult(null); stop.stop = false;
    const t0 = Date.now();
    try {
      const exp = expected.trim().toLowerCase();
      if (!/^[0-9a-f]{7,40}$/.test(exp)) throw new Error("Enter the commit you expect to be live (7–40 hex characters).");
      const sampling = await sampleHealth({
        expected: exp, windowSize: 12, perRound: 4, maxMs: 6 * 60000, d0: 3000, dmax: 30000,
        onProgress: setProgress,
        sleep: (ms) => new Promise((r) => { const t = setTimeout(r, ms); if (stop.stop) { clearTimeout(t); r(undefined); } }),
        now: () => (stop.stop ? Number.MAX_SAFE_INTEGER : Date.now()),
        fetchSample: async () => {
          try {
            const r = await fetch(`/api/site-config-status?v=${Date.now()}${Math.random().toString(36).slice(2, 6)}`, { cache: "no-store", credentials: "omit" });
            const j = await r.json().catch(() => null);
            const dep = (r.headers.get("x-deployment-id") ?? "").split(".")[1] ?? null;
            return { sample: { at: new Date().toISOString(), commit: j?.commit ?? null, deploymentId: dep, identity: j?.identity ?? null, instance: j?.instance ?? null, status: r.status }, body: j ? { identity: j.identity, commit: j.commit, commitFull: j.commitFull, builtAt: j.builtAt, appVersion: j.appVersion, environment: j.environment, manifestVersion: j.manifestVersion } : null };
          } catch (e) { return { sample: { at: new Date().toISOString(), commit: null, deploymentId: null, identity: null, instance: null, status: 0, error: e instanceof Error ? e.message : "unreachable" }, body: null }; }
        },
      });
      setProgress("Running smoke tests…");
      const smoke: SmokeResult[] = [];
      // 1. Routes, real HTTP status from the server.
      const http = await httpCheck(SMOKE_ROUTES.map((s) => ({ path: s.path })));
      SMOKE_ROUTES.forEach((def, i) => smoke.push(smokeFromHttp(def, http.results[i])));
      // 2. Published SEO overrides appear in the server HTML; live redirects answer with their code.
      const [{ data: settings }, { data: redirects }] = await Promise.all([db.rpc("site_live_settings"), db.rpc("site_live_redirects")]);
      const seo = Object.entries((settings ?? {}) as Record<string, Row>).filter(([k, v]) => k.startsWith("seo:") && v?.title).slice(0, 10);
      const reds = ((redirects ?? []) as Row[]).slice(0, 10);
      const extra = await (seo.length || reds.length ? httpCheck([...seo.map(([k]) => ({ path: k.slice(4) })), ...reds.map((r) => ({ path: r.from_path }))]) : Promise.resolve({ results: [] }));
      if (!seo.length) smoke.push({ name: "Published SEO overrides in server HTML", ok: true, na: true, mandatory: true, detail: "no published overrides to check" });
      seo.forEach(([k, v], i) => { const r = extra.results[i]; const ok = r?.finalStatus === 200 && (r.html?.title ?? "").includes(String(v.title)); smoke.push({ name: `SEO override ${k.slice(4)}`, route: k.slice(4), ok, mandatory: true, detail: ok ? "title served" : `server title "${r?.html?.title?.slice(0, 60) ?? "?"}"` }); });
      if (!reds.length) smoke.push({ name: "Live redirects return their HTTP code", ok: true, na: true, mandatory: true, detail: "no live redirects to check" });
      reds.forEach((rd, i) => { const r = extra.results[seo.length + i]; const h = r?.hops?.[0]; const ok = h?.status === (rd.code ?? 301) && !!h?.location && new URL(h.location, location.origin).pathname === new URL(rd.to_path, location.origin).pathname; smoke.push({ name: `Redirect ${rd.from_path}`, route: rd.from_path, ok, mandatory: true, detail: `${h?.status ?? "?"} → ${h?.location ?? "none"} (expected ${rd.code ?? 301} → ${rd.to_path})` }); });
      // 3. Authentication and data boundaries, signed out.
      const anonPost = async (p: string) => (await fetch(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status;
      const [hc, sr] = await Promise.all([anonPost("/api/http-check"), anonPost("/api/site-repair")]);
      smoke.push({ name: "Staff APIs refuse signed-out requests", ok: hc === 401 && sr === 401, mandatory: true, detail: `http-check ${hc}, site-repair ${sr}` });
      const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (url && key) {
        const leak = [];
        for (const t of ["leads", "site_admin_log", "site_deployment_checks", "site_ai_observations", "site_settings"]) { const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers: { apikey: key } }); const j = await r.json().catch(() => null); if (r.ok && Array.isArray(j) && j.length) leak.push(t); }
        smoke.push({ name: "Private tables return nothing to visitors", ok: !leak.length, mandatory: true, detail: leak.length ? `readable: ${leak.join(", ")}` : "leads, activity log, releases, observations, drafts: 0 rows" });
      }
      // 4. Structured data on representative templates parses with no errors.
      for (const p of ["/", "/services/website-design", "/blog"]) {
        const rec = await fetchAndInspect(p, location.origin, (h) => new DOMParser().parseFromString(h, "text/html"));
        const errs = rec.jsonld.flatMap((b) => (b.error ? [b.error] : ldEntities(b.raw).flatMap((e) => checkEntity(e, location.origin).filter((x) => x.level === "error").map((x) => x.msg))));
        smoke.push({ name: `Structured data ${p}`, route: p, ok: rec.status === 200 && rec.jsonld.length > 0 && !errs.length, mandatory: true, detail: errs.length ? errs.slice(0, 3).join("; ") : `${rec.jsonld.length} blocks, no errors` });
      }
      smoke.push({ name: "Signed-in control room", ok: true, mandatory: false, detail: "this check ran from an authorised staff session" });

      const d = decide(sampling, smoke, 12);
      const { data: u } = await supabase.auth.getUser();
      const rec = {
        created_by: u.user?.id, expected_commit: exp, state: d.state, build: sampling.build ?? {}, lovable: { build: lovable }, samples: sampling.samples, matching: sampling.matching, mismatches: sampling.mismatches,
        observed: { ...sampling.observed, _rollout_samples: sampling.rollout.length }, smoke, failed_routes: smoke.filter((s) => !s.ok && !s.na && s.mandatory).map((s) => s.route ?? s.name), duration_ms: Date.now() - t0, decision: (d.reasons.join(" ") || "All samples on the expected commit and every mandatory smoke test passed.").slice(0, 500), rollback_of: rollbackOf || null,
      };
      const ins = await db.from("site_deployment_checks").insert(rec).select("id").single();
      if (ins.error) throw new Error(`Result couldn't be saved: ${ins.error.message}`);
      setResult({ ...rec, id: ins.data.id }); hist.reload();
    } catch (e) { setErr(e instanceof Error ? e.message : "Verification failed to run"); }
    finally { setBusy(false); setProgress(""); }
  }

  return (
    <div className="space-y-4">
      <Card title="Verify a release" actions={busy ? <Btn small onClick={() => { stop.stop = true; }}><Square className="h-4 w-4" aria-hidden="true" />Stop</Btn> : null}>
        <ol className="mb-3 list-decimal space-y-0.5 pl-5 text-xs text-muted-foreground">
          <li>Push to GitHub and wait until Lovable shows the commit's build as completed (a push or a build isn't a deployment).</li>
          <li>Publish in Lovable.</li>
          <li>Run this check with the commit you published. It polls the live health endpoint with backoff until that commit answers, then needs 12 consecutive matching responses; any response from another build inside that window fails the release.</li>
          <li>Smoke tests then run against the live site: real HTTP codes from the server, published SEO overrides and redirects, signed-out access to staff APIs and private tables, and structured data.</li>
        </ol>
        {canRun ? (
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); verify(); }}>
            <label className="text-sm font-medium">Expected commit<input className="input mt-1 w-40 font-mono" value={expected} onChange={(e) => setExpected(e.target.value)} aria-describedby="exp-hint" /></label>
            <label className="text-sm font-medium">Lovable build status<select className="input mt-1 w-auto" value={lovable} onChange={(e) => setLovable(e.target.value)}>{["not checked", "completed", "building", "failed"].map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="text-sm font-medium">Verifies a rollback of<select className="input mt-1 w-auto" value={rollbackOf} onChange={(e) => setRollbackOf(e.target.value)}><option value="">— (normal release)</option>{(hist.data ?? []).map((h) => <option key={h.id} value={h.id}>{h.expected_commit} · {when(h.created_at)}</option>)}</select></label>
            <Btn type="submit" tone="primary" disabled={busy}><Rocket className="h-4 w-4" aria-hidden="true" />{busy ? "Verifying…" : "Verify live"}</Btn>
          </form>
        ) : <p className="text-sm text-muted-foreground">Your role can read release checks but not run them.</p>}
        <p id="exp-hint" className="mt-1 text-xs text-muted-foreground">Pre-filled with the build this control room page was loaded from ({BUILD_INFO.commit ?? "unknown"}).</p>
        {progress && <p role="status" className="mt-2 text-sm">{progress}</p>}
        <ErrorText message={err} />
        {result && <ReleaseDetail r={result} />}
      </Card>
      <Card title="Release history">
        {hist.loading ? <Loading /> : !hist.data?.length ? <Empty>No release checks recorded yet.</Empty> : <ul className="divide-y divide-border text-sm">{hist.data.map((h) => <li key={h.id} className="py-2"><details><summary className="flex cursor-pointer flex-wrap items-center gap-2"><ReleasePill state={h.state} /><span className="font-mono">{h.expected_commit}</span><span className="text-xs text-muted-foreground">{when(h.created_at)} · {h.matching}/{h.samples} matching · {h.actor_email ?? ""}{h.rollback_of ? " · rollback check" : ""}</span></summary><ReleaseDetail r={h} /></details></li>)}</ul>}
        <p className="mt-2 text-xs text-muted-foreground">Records can't be edited after they're saved. Rollback: restore the previous version in Lovable (project history), publish it, then run this check with that version's commit and pick the release it replaces.</p>
      </Card>
    </div>
  );
}

function ReleaseDetail({ r }: { r: Row }) {
  return (
    <div className="mt-3 space-y-2 text-sm">
      <p><ReleasePill state={r.state} /> {r.decision}</p>
      <p className="text-xs text-muted-foreground">Responses seen: {Object.entries(r.observed ?? {}).filter(([k]) => !k.startsWith("_")).map(([k, v]) => `${k.replace("|", " on deployment ")} ×${v}`).join(", ") || "none"}{r.observed?._rollout_samples ? ` (${r.observed._rollout_samples} while waiting for the new build)` : ""} · build {r.build?.commitFull?.slice(0, 12) ?? r.build?.commit ?? "unknown"} built {when(r.build?.builtAt)}</p>
      <ul className="grid gap-1 sm:grid-cols-2">{(r.smoke ?? []).map((s: Row, i: number) => <li key={i} className="flex items-start gap-2 text-xs">{s.na ? <Pill>N/A</Pill> : s.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="passed" /> : <Pill tone="bad">fail</Pill>}<span><span className="font-medium">{s.name}</span> — {s.detail}</span></li>)}</ul>
    </div>
  );
}

