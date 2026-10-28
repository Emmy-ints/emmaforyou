import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, FolderOpen, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/auth/use-account";
import AccountAuthForm from "@/components/auth/AccountAuthForm";
import { PUBLISHING_TOOLS } from "@/lib/publishing-data";
import { GhostBtn, KIND_LABEL, KIND_TOOL, Notice, Panel, type ProjectKind, type ProjectStatus, inputCls } from "./shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
interface Row { id: string; kind: ProjectKind; title: string; status: ProjectStatus; meta: Record<string, unknown>; updated_at: string; created_at: string }
const STATUS: { id: ProjectStatus; label: string }[] = [{ id: "draft", label: "Draft" }, { id: "in_progress", label: "In progress" }, { id: "ready", label: "Ready to publish" }, { id: "published", label: "Published" }, { id: "archived", label: "Archived" }];

export default function AuthorWorkspace() {
  const acct = useAccount();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");
  const [kind, setKind] = useState<ProjectKind | "all">("all");
  const load = useCallback(async () => {
    setErr("");
    const { data, error } = await db.from("book_projects").select("id,kind,title,status,meta,updated_at,created_at").order("updated_at", { ascending: false }).limit(200);
    if (error) setErr("Your projects couldn't be loaded. Please refresh."); else setRows(data as Row[]);
  }, []);
  useEffect(() => { if (acct.signedIn) void load(); }, [acct.signedIn, load]);

  const upd = async (id: string, patch: Partial<Row>) => {
    const { error } = await db.from("book_projects").update(patch).eq("id", id);
    if (error) setErr("That change couldn't be saved."); else setRows((r) => r?.map((x) => (x.id === id ? { ...x, ...patch } : x)) ?? r);
  };
  const del = async (r: Row) => {
    if (!window.confirm(`Delete “${r.title}”? This permanently removes the saved project from your account.`)) return;
    const { error } = await db.from("book_projects").delete().eq("id", r.id);
    if (error) setErr("It couldn't be deleted. Please try again."); else setRows((x) => x?.filter((y) => y.id !== r.id) ?? x);
  };
  const delAll = async () => {
    if (!rows?.length || !window.confirm(`Delete all ${rows.length} book projects from your account? This can't be undone.`)) return;
    const { error } = await db.from("book_projects").delete().in("id", rows.map((r) => r.id));
    if (error) setErr("Not everything could be deleted. Please try again."); else setRows([]);
  };

  const next = useMemo(() => {
    if (!rows) return [];
    const has = (k: ProjectKind) => rows.some((r) => r.kind === k && r.status !== "archived");
    const out: { text: string; to: string }[] = [];
    if (!has("book")) out.push({ text: "Turn your manuscript into an eBook and print-ready PDF", to: "/publishing/ebook-creator" });
    if (!has("cover")) out.push({ text: "Design your eBook cover and paperback wrap", to: "/publishing/cover-designer" });
    if (has("cover") && !has("mockup")) out.push({ text: "Make 3D mockups and launch graphics from your cover", to: "/publishing/mockups" });
    if (!has("marketing")) out.push({ text: "Draft your book description, keywords and author bio", to: "/publishing/book-marketing" });
    if (!has("launch")) out.push({ text: "Plan your launch with dates and a checklist", to: "/publishing/launch-planner" });
    if (has("book") && !has("readiness")) out.push({ text: "Run the readiness check before you upload", to: "/publishing/readiness-checker" });
    return out.slice(0, 4);
  }, [rows]);

  if (!acct.ready) return <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading" /></div>;
  if (!acct.signedIn) return (
    <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-7">
      <h2 className="font-display text-xl font-semibold">Sign in to your author workspace</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">Your saved books, covers, mockups, listing copy and launch plans — private to your account.</p>
      <AccountAuthForm intent="account" next="/account/books" idPrefix="books-auth" />
    </div>
  );
  const shown = (rows ?? []).filter((r) => kind === "all" || r.kind === kind);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PUBLISHING_TOOLS.map((t) => <Link key={t.slug} to={`/publishing/${t.slug}`} className="tsh-chip">{t.icon} New: {t.name}</Link>)}
      </div>
      {next.length > 0 && rows && (
        <Panel title="Suggested next steps">
          <ul className="grid gap-2 sm:grid-cols-2">{next.map((n) => <li key={n.to}><Link to={n.to} className="pbx-tool"><ArrowRight className="mt-0.5 h-4 w-4 text-[color:var(--hue)]" aria-hidden="true" /><span className="text-sm">{n.text}</span></Link></li>)}</ul>
        </Panel>
      )}
      <Panel title={`My projects${rows ? ` · ${rows.length}` : ""}`} actions={<select aria-label="Filter" className={`${inputCls} mt-0 w-auto`} value={kind} onChange={(e) => setKind(e.target.value as ProjectKind | "all")}><option value="all">All types</option>{(Object.keys(KIND_LABEL) as ProjectKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select>}>
        {err && <div className="mb-3"><Notice tone="error">{err}</Notice></div>}
        {!rows ? <p className="py-8 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" aria-hidden="true" />Loading…</p> : !shown.length ? (
          <div className="py-10 text-center text-sm text-muted-foreground"><FolderOpen className="mx-auto mb-2 h-7 w-7" aria-hidden="true" />No saved projects yet. Start with any tool above and press “Save to my projects”.</div>
        ) : (
          <ul className="divide-y divide-border">{shown.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
              {typeof r.meta?.thumb === "string" ? <img src={r.meta.thumb as string} alt="" className="h-14 w-9 rounded object-cover shadow" /> : <span className="grid h-14 w-9 place-items-center rounded bg-muted text-lg" aria-hidden="true">{PUBLISHING_TOOLS.find((t) => t.slug === KIND_TOOL[r.kind])?.icon}</span>}
              <div className="min-w-[180px] flex-1">
                <input aria-label="Project name" className="w-full bg-transparent font-medium outline-none focus:underline" defaultValue={r.title} maxLength={200} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== r.title) void upd(r.id, { title: v }); }} />
                <p className="text-xs text-muted-foreground">{KIND_LABEL[r.kind]} · updated {new Date(r.updated_at).toLocaleDateString()}{summary(r)}</p>
              </div>
              <select aria-label="Status" className={`${inputCls} mt-0 w-auto text-xs`} value={r.status} onChange={(e) => void upd(r.id, { status: e.target.value as ProjectStatus })}>{STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
              <a href={`/publishing/${KIND_TOOL[r.kind]}?project=${r.id}`} className="nav-ghost h-auto px-3 py-1.5 text-sm">Open</a>
              <button type="button" onClick={() => void del(r)} className="rounded-lg p-2 text-muted-foreground hover:text-red-600" aria-label={`Delete ${r.title}`}><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}</ul>
        )}
      </Panel>
      <Panel title="Your files and privacy">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Manuscripts and images are processed in your browser. Downloads are created on your device and aren't uploaded or published at any link.</li>
          <li>When you save a project, its contents are stored in your account and only you can open them. Our team sees counts and error logs for the tools, not your manuscript.</li>
          <li>AI features (descriptions, notes, cover ideas) send the text you choose to our server and AI provider for that request only.</li>
          <li>Delete any project above, or everything at once. To delete your whole account, <Link to="/contact" className="underline underline-offset-4">contact us</Link>.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2"><GhostBtn disabled={!rows?.length} onClick={() => void delAll()}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete all my book projects</GhostBtn><Link to="/publishing/enquiry" className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm">Get professional help <ArrowRight className="h-4 w-4" /></Link></div>
      </Panel>
    </div>
  );
}

function summary(r: Row) {
  const m = r.meta ?? {};
  const bits: string[] = [];
  if (typeof m.words === "number") bits.push(`${m.words.toLocaleString()} words`);
  if (typeof m.chapters === "number") bits.push(`${m.chapters} chapters`);
  if (typeof m.pages === "number") bits.push(`${m.pages} pages`);
  if (typeof m.launchDate === "string") bits.push(`launch ${m.launchDate}`);
  if (typeof m.tasks === "number") bits.push(`${m.done ?? 0}/${m.tasks} tasks done`);
  if (typeof m.fixes === "number") bits.push(`${m.fixes} to fix`);
  return bits.length ? ` · ${bits.join(" · ")}` : "";
}
