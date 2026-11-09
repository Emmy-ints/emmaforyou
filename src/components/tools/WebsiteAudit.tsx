import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Download, Globe, Loader2, MessageCircle, Search, Swords, XCircle } from "lucide-react";
import { compare, headToHead, historyFor, hostOf, loadHistory, recordAudit, type AuditSnapshot } from "@/lib/audit-history";
import { PILLAR_LABELS, scoreBand, type AuditResult, type CheckStatus, type Pillar } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";
import { buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { ShowcaseOptIn, ShowcasePublished, publishToShowcase, useShowcaseChoice } from "../showcase/ShowcaseOptIn";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

const STAGES = [
  "Fetching your page the way a visitor's browser would…",
  "Checking titles, headings, structured data and sitemap…",
  "Looking for WhatsApp, call buttons, forms and reviews…",
  "Running Google Lighthouse on a simulated phone (this can take up to a minute)…",
  "Writing your prioritised action plan…",
];

const TONE = { good: "#16a34a", ok: "#d97706", poor: "#dc2626" } as const;

function StatusIcon({ s }: { s: CheckStatus }) {
  if (s === "pass") return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Pass" />;
  if (s === "warn") return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-label="Could be better" />;
  return <XCircle className="h-4 w-4 shrink-0 text-red-600" aria-label="Problem" />;
}

function ScoreRing({ score }: { score: number }) {
  const band = scoreBand(score);
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke={TONE[band.tone]} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-4xl font-semibold text-foreground">{score}</p>
          <p className="text-xs font-medium" style={{ color: TONE[band.tone] }}>{band.label}</p>
        </div>
      </div>
    </div>
  );
}

export default function WebsiteAudit() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const { lang } = useI18n();
  const [showChoice, setShowChoice] = useShowcaseChoice("audit");
  const [shown, setShown] = useState<string | null>(null);
  const [prev, setPrev] = useState<AuditSnapshot | null>(null);

  useEffect(() => {
    if (!busy) return;
    setStage(0);
    const id = window.setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 5500);
    return () => window.clearInterval(id);
  }, [busy]);

  async function run(e?: React.FormEvent, again?: string) {
    e?.preventDefault();
    const target = (again ?? url).trim();
    if (!target || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    setShown(null);
    try {
      const res = await fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: target }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "The audit couldn't run. Please try again.");
      setResult(data as AuditResult);
      const r0 = data as AuditResult;
      setPrev(recordAudit({ host: hostOf(r0.finalUrl), at: r0.fetchedAt || new Date().toISOString(), score: r0.score, pillars: r0.pillars }));
      track("audit_run", { score: data.score, lighthouse: Boolean(data.vitals) });
      const sc = (data as { showcase?: { content: unknown; sig: string } }).showcase;
      if (sc?.sig && showChoice.show) void publishToShowcase({ kind: "audit", sig: sc.sig, content: sc.content, choice: showChoice }, lang).then((r) => r && setShown(r.slug));
      window.setTimeout(() => document.getElementById("audit-report")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The audit couldn't run.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={run} className="no-print flex flex-col gap-3 rounded-[24px] border border-border bg-card p-3 shadow-[var(--shadow-card-hover)] sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 px-3">
          <Globe className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="audit-url" className="sr-only">Website address</label>
          <input id="audit-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourbusiness.com" inputMode="url" autoComplete="url" maxLength={300}
            className="h-12 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
        </div>
        <button disabled={busy || !url.trim()} className="btn-primary-gradient inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />} {busy ? "Auditing…" : "Audit my website"}
        </button>
      </form>
      <div className="no-print mt-3"><ShowcaseOptIn kind="audit" choice={showChoice} onChange={setShowChoice} /></div>
      {shown && <div className="no-print mt-3"><ShowcasePublished key={shown} slug={shown} /></div>}
      <p className="no-print mt-3 text-xs text-muted-foreground">Free. Checks your homepage only. Takes 20–60 seconds. We don't store the report unless you ask for an expert review.</p>

      {busy && (
        <div className="no-print mt-8 rounded-[20px] border border-border bg-card p-6" role="status" aria-live="polite">
          <ol className="space-y-3">
            {STAGES.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 text-sm transition ${i <= stage ? "text-foreground" : "text-muted-foreground/50"}`}>
                {i < stage ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : i === stage ? <Loader2 className="h-4 w-4 animate-spin text-[var(--emma-violet)]" /> : <span className="h-4 w-4 rounded-full border border-border" />}
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
      {error && <p role="alert" className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}

      {result && <Report r={result} prev={prev} onRecheck={() => { setUrl(result.finalUrl); window.scrollTo({ top: 0, behavior: "smooth" }); void run(undefined, result.finalUrl); }} />}
    </div>
  );
}

const Delta = ({ v }: { v: number }) => v === 0 ? <span className="text-muted-foreground">no change</span> : (
  <span className={`inline-flex items-center gap-0.5 font-semibold ${v > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
    {v > 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}{v > 0 ? "+" : ""}{v}
  </span>
);

/** Re-check: what changed since this browser last audited the same site, plus the score trend. */
function Progress({ r, prev }: { r: AuditResult; prev: AuditSnapshot }) {
  const now: AuditSnapshot = { host: hostOf(r.finalUrl), at: r.fetchedAt, score: r.score, pillars: r.pillars };
  const d = compare(prev, now);
  const trend = historyFor(loadHistory(), now.host).slice(-8);
  const max = 100, w = 160, h = 40;
  const pts = trend.map((s, i) => `${trend.length === 1 ? w / 2 : (i / (trend.length - 1)) * w},${h - (s.score / max) * h}`).join(" ");
  return (
    <div className="rounded-[24px] border border-border bg-card p-5 shadow-[var(--shadow-card)]" data-audit-progress>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--emma-violet)]">Since your last check{d.days ? ` ${d.days} day${d.days === 1 ? "" : "s"} ago` : " earlier today"}</p>
          <p className="mt-1 font-display text-xl font-semibold">{prev.score} → {r.score} <span className="text-base"><Delta v={d.score} /></span></p>
        </div>
        {trend.length > 1 && (
          <svg width={w} height={h + 4} viewBox={`0 -2 ${w} ${h + 4}`} role="img" aria-label={`Score trend: ${trend.map((s) => s.score).join(", ")}`}>
            <polyline points={pts} fill="none" stroke="var(--emma-violet)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {trend.map((s, i) => <circle key={s.at} cx={trend.length === 1 ? w / 2 : (i / (trend.length - 1)) * w} cy={h - (s.score / max) * h} r="2.5" fill="var(--emma-violet)" />)}
          </svg>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {(Object.keys(PILLAR_LABELS) as Pillar[]).map((p) => typeof d.pillars[p] === "number" && <li key={p}><span className="text-muted-foreground">{PILLAR_LABELS[p]}</span> <Delta v={d.pillars[p]!} /></li>)}
      </ul>
    </div>
  );
}

/** Audit a competitor's homepage and compare pillar by pillar. */
function Compare({ r }: { r: AuditResult }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [other, setOther] = useState<AuditResult | null>(null);
  async function run(e?: React.FormEvent, again?: string) {
    e?.preventDefault();
    const target = (again ?? url).trim();
    if (!target || busy) return;
    setBusy(true); setErr(""); setOther(null);
    try {
      const res = await fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "That site couldn't be audited.");
      if (hostOf((data as AuditResult).finalUrl) === hostOf(r.finalUrl)) throw new Error("That's the same website. Enter a competitor's address.");
      setOther(data as AuditResult);
      track("audit_compare", { mine: r.score, theirs: data.score });
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "That site couldn't be audited."); } finally { setBusy(false); }
  }
  const mine = hostOf(r.finalUrl), theirs = other ? hostOf(other.finalUrl) : "";
  const h2h = other ? headToHead(r.pillars, other.pillars) : null;
  return (
    <div className="no-print rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)]" data-audit-compare>
      <h3 className="flex items-center gap-2 font-display text-xl font-semibold"><Swords className="h-5 w-5 text-[var(--emma-violet)]" aria-hidden="true" /> Compare with a competitor</h3>
      <p className="mt-1 text-sm text-muted-foreground">See where they're ahead and where you can win. Runs the same checks on their homepage.</p>
      <form onSubmit={run} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="audit-compare" className="sr-only">Competitor's website</label>
        <input id="audit-compare" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="competitor.com" inputMode="url" maxLength={300} className="input min-w-0 flex-1" />
        <button disabled={busy || !url.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {busy ? "Checking…" : "Compare"}
        </button>
      </form>
      {err && <p role="alert" className="mt-3 text-sm text-red-600">{err}</p>}
      {other && h2h && (
        <div className="mt-5" data-compare-result>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-2 text-sm">
            <span />
            <span className="max-w-[9rem] truncate text-right text-xs font-semibold" title={mine}>{mine}</span>
            <span className="max-w-[9rem] truncate text-right text-xs font-semibold text-muted-foreground" title={theirs}>{theirs}</span>
            <span className="font-semibold">Overall</span>
            <span className="text-right font-display text-lg font-semibold">{r.score}</span>
            <span className="text-right font-display text-lg font-semibold text-muted-foreground">{other.score}</span>
            {h2h.rows.map((row) => (
              <div key={row.pillar} className="contents">
                <span className="text-muted-foreground">{PILLAR_LABELS[row.pillar]}</span>
                <span className={`text-right tabular-nums ${row.lead === "a" ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}`}>{row.a}</span>
                <span className={`text-right tabular-nums ${row.lead === "b" ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>{row.b}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm">
            {h2h.aWins > h2h.bWins ? `You're ahead on ${h2h.aWins} of ${h2h.rows.length} areas.` : h2h.bWins > h2h.aWins ? `They're ahead on ${h2h.bWins} of ${h2h.rows.length} areas.` : "You're level overall."}
            {h2h.rows.some((x) => x.lead === "b") && ` Close the gap on ${h2h.rows.filter((x) => x.lead === "b").map((x) => PILLAR_LABELS[x.pillar].toLowerCase()).join(", ")}.`}
          </p>
          <a href={buildWa(`Hi Emmanuel, I compared ${mine} (${r.score}/100) with ${theirs} (${other.score}/100) on your site. Can you help me get ahead?`)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-2.5 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> Help me get ahead</a>
        </div>
      )}
    </div>
  );
}

function Report({ r, prev, onRecheck }: { r: AuditResult; prev: AuditSnapshot | null; onRecheck: () => void }) {
  const host = new URL(r.finalUrl).host;
  const pillars = Object.keys(PILLAR_LABELS) as Pillar[];
  return (
    <section id="audit-report" className="print-area mt-10 scroll-mt-28 space-y-6" aria-labelledby="audit-heading">
      {prev && <Progress r={r} prev={prev} />}
      <div className="rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-violet)]">Website audit · {new Date(r.fetchedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center">
          <ScoreRing score={r.score} />
          <div className="min-w-0">
            <h2 id="audit-heading" className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{r.headline}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{host}{r.title ? ` · ${r.title}` : ""}</p>
            <p className="mt-3 text-muted-foreground">{r.summary}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map((p) => {
            const v = r.pillars[p];
            const tone = scoreBand(v).tone;
            return (
              <div key={p} className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">{PILLAR_LABELS[p]}</p>
                <p className="mt-1 font-display text-2xl font-semibold text-foreground">{v}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${v}%`, background: TONE[tone] }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-display text-xl font-semibold">Fix these first</h3>
          <ol className="mt-4 space-y-4">
            {r.priorities.map((p, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--emma-violet)] text-sm font-semibold text-white">{i + 1}</span>
                <div>
                  <p className="font-semibold text-foreground">{p.title} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${p.impact === "high" ? "bg-red-500/10 text-red-600" : p.impact === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}>{p.impact} impact</span></p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.why}</p>
                  <p className="mt-1 text-sm text-foreground"><strong>Fix:</strong> {p.fix}</p>
                </div>
              </li>
            ))}
          </ol>
          {!r.aiWritten && <p className="mt-4 text-xs text-muted-foreground">Rule-based summary: our AI write-up is unavailable right now, so the priorities below come directly from the checks that failed.</p>}
        </div>

        <div className="space-y-4">
          {r.screenshot ? (
            <figure className="rounded-[24px] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="mx-auto w-[180px] overflow-hidden rounded-[22px] border-[6px] border-[#0b0d24] bg-white">
                <img src={r.screenshot} alt={`How ${host} looks on a phone`} className="block w-full" width={180} height={320} />
              </div>
              <figcaption className="mt-3 text-center text-xs text-muted-foreground">Your homepage on a phone, captured by Google Lighthouse</figcaption>
            </figure>
          ) : null}
          {r.vitals ? (
            <div className="rounded-[24px] border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="font-semibold text-foreground">Google Lighthouse (mobile)</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {([["Performance", r.vitals.performance], ["Accessibility", r.vitals.accessibility], ["SEO", r.vitals.seo], ["Best practices", r.vitals.bestPractices]] as const).map(([k, v]) => v !== undefined && (
                  <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-display text-xl font-semibold" style={{ color: TONE[scoreBand(v).tone] }}>{v}</dd></div>
                ))}
              </dl>
              <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
                {([["Largest contentful paint", r.vitals.lcp], ["Layout shift", r.vitals.cls], ["Blocking time", r.vitals.tbt], ["First paint", r.vitals.fcp]] as const).map(([k, v]) => v && (
                  <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-foreground">{v}</dd></div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="rounded-[24px] border border-border bg-card p-5 text-sm text-muted-foreground">Google Lighthouse speed data wasn't available for this audit, so the speed score is based on server response time, page weight, compression and scripts.</p>
          )}
        </div>
      </div>

      <div className="rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h3 className="font-display text-xl font-semibold">All {r.checks.length} checks</h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {pillars.map((p) => (
            <div key={p}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{PILLAR_LABELS[p]}</h4>
              <ul className="mt-2 space-y-2.5">
                {r.checks.filter((c) => c.pillar === p).map((c) => (
                  <li key={c.id} className="flex gap-2.5 text-sm">
                    <StatusIcon s={c.status} />
                    <div><p className="font-medium text-foreground">{c.label}</p><p className="text-muted-foreground">{c.detail}</p></div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Automated checks of the homepage HTML at {r.finalUrl}, plus Google PageSpeed Insights where available. Scores are indicators to prioritise work, not guarantees of rankings or sales. Report by EmmaForYou · emmaforyou.lovable.app</p>
      </div>

      <Compare r={r} />

      <div className="no-print flex flex-wrap gap-3">
        <button type="button" onClick={onRecheck} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:border-[var(--emma-violet)]">
          Re-check after changes
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:border-[var(--emma-violet)]">
          <Download className="h-4 w-4" /> Download PDF report
        </button>
        <a href={buildWa(`Hi Emmanuel, I just audited ${host} on your site and scored ${r.score}/100. Can you help me fix the top issues?`)} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 text-sm font-semibold text-white">
          <MessageCircle className="h-4 w-4" /> Discuss on WhatsApp
        </a>
      </div>
      <ExpertReview r={r} />
    </section>
  );
}

function ExpertReview({ r }: { r: AuditResult }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || (!whatsapp.trim() && !email.trim())) return;
    setState("saving");
    const { error } = await db.from("site_audits").insert({
      url: r.finalUrl.slice(0, 300), score: r.score, summary: `${r.headline}. ${r.summary}`.slice(0, 2000),
      name: name.trim().slice(0, 120), whatsapp: whatsapp.trim().slice(0, 40) || null, email: email.trim().slice(0, 200) || null,
    });
    if (error) { setState("error"); return; }
    track("audit_requested", { score: r.score });
    setState("done");
  }

  if (state === "done") {
    return <p className="no-print rounded-[24px] border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-foreground">Thanks {name.split(" ")[0]}. Emmanuel will review {new URL(r.finalUrl).host} and get back to you with what to fix first.</p>;
  }
  return (
    <form onSubmit={submit} className="no-print rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <h3 className="font-display text-xl font-semibold">Want a human to look at it?</h3>
      <p className="mt-1 text-sm text-muted-foreground">Get a free expert review: a short screen-recorded walkthrough of what to fix first and what it would take.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm"><span className="sr-only">Your name</span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={120} className="roi-input" /></label>
        <label className="text-sm"><span className="sr-only">WhatsApp number</span><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" inputMode="tel" maxLength={40} className="roi-input" /></label>
        <label className="text-sm"><span className="sr-only">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" maxLength={200} className="roi-input" /></label>
      </div>
      <button disabled={state === "saving" || !name.trim() || (!whatsapp.trim() && !email.trim())} className="btn-primary-gradient mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" />} Request my free expert review
      </button>
      {state === "error" && <p role="alert" className="mt-3 text-sm text-red-600">That didn't send. Please try again or message us on WhatsApp.</p>}
    </form>
  );
}
