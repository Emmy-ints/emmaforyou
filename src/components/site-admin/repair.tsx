// @ts-nocheck -- generated DB types lag behind; runtime verified
import { useMemo, useState } from "react";
import { Bot, Check, RotateCcw, Wand2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Btn, check, db, ErrorText, Pill, when } from "@/components/agents-admin/shared";
import { pageIndex } from "@/lib/page-index";
import type { Finding } from "@/lib/site-audit";
import { refreshSettings } from "@/lib/site-settings";
import { useCan, type Row } from "./settings";

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…`);
const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));

/** Closest existing page for a broken address (shared words in the path, same section first). */
export function bestRoute(target: string): string | null {
  const t = words(target); const sec = target.split("/")[1];
  let best: { href: string; s: number } | null = null;
  for (const p of pageIndex()) {
    const w = words(`${p.href} ${p.title}`); let s = 0; for (const x of t) if (w.has(x)) s += 1;
    if (p.href.split("/")[1] === sec) s += 0.5;
    if (s > (best?.s ?? 0)) best = { href: p.href, s };
  }
  return best && best.s >= 1 ? best.href : null;
}

export const FIXABLE: Record<string, "seo" | "redirect" | "manual"> = { title: "seo", description: "seo", "dup-title": "seo", link: "redirect", image: "manual", h1: "manual", route: "manual", slow: "manual", noindex: "manual", asset: "manual" };
const MANUAL: Record<string, string> = {
  image: "Upload the replacement under Content → Media and set it on the project under Content → Portfolio (no code change). For images built into the code, replace the file in the repository.",
  h1: "Needs a code change: give the page exactly one <h1> in its route component.",
  route: "Needs a code change or a redirect: restore the page, or add a redirect from this address under Redirects.",
  slow: "Needs investigation in the code: check the route's loader and server calls.",
  noindex: "If intended, ignore this finding with a reason. Otherwise turn noindex off for the page under Content → Pages & SEO.",
  asset: "Upload the client's real screenshot under Content → Media, then set it on the project under Content → Portfolio and tick 'real screenshot'.",
};

/** Propose, review, apply, reject and roll back a fix for one finding. */
export function RepairPanel({ f, repairs, onDone }: { f: Finding; repairs: Row[]; onDone: () => void }) {
  const can = useCan();
  const kind = FIXABLE[f.type] ?? "manual";
  const targets = f.type === "dup-title" ? (f.data?.routes ?? [f.route]) : [f.route];
  const [route, setRoute] = useState(targets[0]);
  const entry = useMemo(() => pageIndex().find((p) => p.href === route), [route]);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [to, setTo] = useState(f.data?.target ? bestRoute(f.data.target) ?? "" : "");
  const [source, setSource] = useState<"rule" | "ai" | "person">("rule"); const [rationale, setRationale] = useState("");
  const [current, setCurrent] = useState<Row | null>(f.data ?? null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [msg, setMsg] = useState("");

  function ruleBased() {
    const base = entry ? `${entry.title}${f.type === "dup-title" && entry.kind ? ` (${entry.kind})` : ""}` : route.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ?? "EmmaForYou";
    setTitle(clip(`${base} | EmmaForYou`, 60));
    setDesc(clip(entry?.hint ? `${entry.hint}. ${entry.title} from EmmaForYou: see how it works and book a free call.` : `${base} from EmmaForYou. See what's included and book a free strategy call.`, 155));
    setSource("rule"); setRationale("Built from the page's title and summary in the site's page index.");
  }
  async function ai() {
    setBusy(true); setErr("");
    try {
      const { data } = await supabase.auth.getSession();
      const r = await fetch("/api/site-repair", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` }, body: JSON.stringify({ route, issue: f.title }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message ?? `AI request failed (${r.status})`);
      setTitle(j.proposal.title); setDesc(j.proposal.description); setCurrent(j.current); setSource("ai"); setRationale(j.rationale || "Proposed by AI from the live page's own text.");
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function propose() {
    setBusy(true); setErr(""); setMsg("");
    try {
      const { data: u } = await supabase.auth.getUser();
      const row = kind === "seo"
        ? { finding_key: f.key, kind: "seo", target: route, current: { title: current?.title ?? null, description: current?.description ?? null }, proposal: Object.fromEntries(Object.entries({ title: title.trim(), description: desc.trim() }).filter(([, v]) => v)), source, rationale, created_by: u.user?.id }
        : { finding_key: f.key, kind: "redirect", target: f.data?.target ?? route, current: { status: "broken" }, proposal: { to: to.trim() }, source: source === "ai" ? "rule" : source, rationale: rationale || "Closest existing page by shared words in the address.", created_by: u.user?.id };
      if (kind === "seo" && !row.proposal.title && !row.proposal.description) throw new Error("Write or generate a title or description first.");
      if (kind === "redirect" && !/^\/[A-Za-z0-9/_.\-]*$/.test(row.proposal.to)) throw new Error("Pick a page on this site to redirect to.");
      check(await db.from("site_repairs").insert(row).select("id").single());
      setMsg("Proposal saved for review."); onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function decide(r: Row, action: "apply" | "reject" | "rollback") {
    setErr("");
    try {
      if (action === "apply") { const outcome = window.prompt("Apply this fix to the live site now? Add a note for the record (optional).", ""); if (outcome === null) return; check(await db.rpc("site_repair_apply", { _id: r.id, _outcome: outcome || null })); refreshSettings(); }
      if (action === "reject") check(await db.from("site_repairs").update({ status: "rejected", decided_at: new Date().toISOString() }).eq("id", r.id).select("id").single());
      if (action === "rollback") { if (!window.confirm("Undo this fix and put the previous value back?")) return; check(await db.rpc("site_repair_rollback", { _id: r.id })); refreshSettings(); }
      onDone();
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3 text-sm">
      {repairs.length > 0 && <ul className="mb-3 space-y-2">{repairs.map((r) => (
        <li key={r.id} className="rounded-lg border border-border bg-background p-2">
          <p className="text-xs"><Pill tone={r.status === "applied" ? "good" : r.status === "proposed" ? "warn" : "muted"}>{(r.status ?? "proposed").replace("_", " ")}</Pill> {r.kind === "seo" ? "Metadata" : "Redirect"} for <code>{r.target}</code> · {r.source === "ai" ? "AI proposal" : r.source === "rule" ? "Rule-based" : "Written by staff"} · {when(r.created_at)}{r.outcome ? ` · ${r.outcome}` : ""}</p>
          <Diff kind={r.kind} current={r.current} proposal={r.proposal} />
          {r.rationale && <p className="mt-1 text-xs text-muted-foreground">Why: {r.rationale}</p>}
          <div className="mt-1 flex flex-wrap gap-1">
            {r.status === "proposed" && can("repair.apply") && <Btn small tone="primary" onClick={() => decide(r, "apply")}><Check className="h-3 w-3" aria-hidden="true" />Apply</Btn>}
            {r.status === "proposed" && can("repair.propose") && <Btn small onClick={() => decide(r, "reject")}><X className="h-3 w-3" aria-hidden="true" />Reject</Btn>}
            {r.status === "applied" && can("repair.apply") && <Btn small onClick={() => decide(r, "rollback")}><RotateCcw className="h-3 w-3" aria-hidden="true" />Roll back</Btn>}
          </div>
        </li>))}</ul>}

      {kind === "manual" ? <p className="text-xs">{MANUAL[f.type] ?? "Needs a code change."}</p> : can("repair.propose") ? (
        <div className="space-y-2">
          {kind === "seo" && <>
            {targets.length > 1 && <select className="input h-8 w-auto text-xs" value={route} onChange={(e) => setRoute(e.target.value)} aria-label="Page">{targets.map((t) => <option key={t}>{t}</option>)}</select>}
            <div className="flex flex-wrap gap-1"><Btn small onClick={ruleBased}><Wand2 className="h-3 w-3" aria-hidden="true" />Suggest (rules)</Btn><Btn small onClick={ai} disabled={busy}><Bot className="h-3 w-3" aria-hidden="true" />{busy ? "Asking AI…" : "Ask AI"}</Btn></div>
            <input className="input h-8 w-full text-sm" maxLength={70} placeholder="Proposed title" value={title} onChange={(e) => { setTitle(e.target.value); setSource("person"); }} aria-label="Proposed title" />
            <textarea className="input min-h-[52px] w-full text-sm" maxLength={170} placeholder="Proposed description" value={desc} onChange={(e) => { setDesc(e.target.value); setSource("person"); }} aria-label="Proposed description" />
            <p className="text-[11px] text-muted-foreground">{title.length}/60 · {desc.length}/155 characters</p>
            {(title || desc) && <Diff kind="seo" current={current} proposal={{ title, description: desc }} />}
          </>}
          {kind === "redirect" && <div className="flex flex-wrap items-center gap-2"><code>{f.data?.target}</code> → <input className="input h-8 w-64 text-sm" value={to} onChange={(e) => setTo(e.target.value)} placeholder="/existing-page" aria-label="Redirect to" />{!to && <span className="text-xs text-muted-foreground">No close match found; type a page.</span>}</div>}
          <Btn small tone="primary" onClick={propose} disabled={busy}>Save proposal for review</Btn>
          <p className="text-[11px] text-muted-foreground">Applying publishes the change with a checkpoint you can roll back. Metadata fixes are rendered into the server HTML within about a minute; use Re-check to confirm.</p>
        </div>
      ) : <p className="text-xs text-muted-foreground">Your role can view proposals but not create them.</p>}
      {msg && <p role="status" className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">{msg}</p>}
      <ErrorText message={err} />
    </div>
  );
}

function Diff({ kind, current, proposal }: { kind: string; current: Row | null; proposal: Row }) {
  if (kind === "redirect") return <p className="mt-1 text-xs"><span className="text-red-600 line-through">{current?.status ?? "broken"}</span> → redirect to <code>{proposal?.to}</code></p>;
  return (
    <table className="mt-1 w-full text-xs"><tbody>
      {["title", "description"].map((k) => proposal?.[k] ? <tr key={k} className="align-top"><th className="w-20 py-0.5 pr-2 text-left font-medium text-muted-foreground">{k}</th><td className="py-0.5"><span className="block text-red-700 line-through decoration-red-400/70 dark:text-red-300">{current?.[k] || "(empty)"}</span><span className="block text-emerald-700 dark:text-emerald-300">{proposal[k]}</span></td></tr> : null)}
    </tbody></table>
  );
}
