import { useEffect, useState } from "react";
import { Check, Download, Loader2, Star, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PROJECTS, projectSlug } from "@/lib/portfolio-data";
import type { CaseStudy } from "@/lib/case-studies";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

/* ------------------------------ Case study editor ------------------------------ */

const EMPTY = (slug: string): CaseStudy => ({ slug, published: false, client_role: "", challenge: "", approach: "", deliverables: [], results: "", timeline: "", quote: "", quote_author: "", screenshots: [], updated_at: "" });

export function CaseStudyEditor() {
  const [slug, setSlug] = useState(projectSlug(PROJECTS[0].name));
  const [cs, setCs] = useState<CaseStudy>(EMPTY(slug));
  const [deliverablesText, setDeliverablesText] = useState("");
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadAll() {
    const { data } = await db.from("case_studies").select("slug,published");
    setStatus(Object.fromEntries(((data as { slug: string; published: boolean }[]) || []).map((r) => [r.slug, r.published])));
  }
  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    setMsg("");
    db.from("case_studies").select("*").eq("slug", slug).maybeSingle().then(({ data }: { data: CaseStudy | null }) => {
      const next = data ?? EMPTY(slug);
      setCs(next);
      setDeliverablesText(next.deliverables.join("\n"));
    });
  }, [slug]);

  const set = <K extends keyof CaseStudy>(k: K, v: CaseStudy[K]) => setCs((c) => ({ ...c, [k]: v }));

  async function upload(file: File | undefined) {
    if (!file) return;
    if (cs.screenshots.length >= 8) { setMsg("Up to 8 screenshots."); return; }
    setBusy(true);
    const path = `${slug}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_").slice(-60)}`;
    const { error } = await supabase.storage.from("case-study-media").upload(path, file, { contentType: file.type });
    if (error) { setMsg(error.message); setBusy(false); return; }
    const { data } = supabase.storage.from("case-study-media").getPublicUrl(path);
    set("screenshots", [...cs.screenshots, data.publicUrl]);
    setBusy(false);
  }

  async function save(publish?: boolean) {
    setBusy(true); setMsg("");
    const row = {
      ...cs,
      published: publish ?? cs.published,
      deliverables: deliverablesText.split("\n").map((d) => d.trim()).filter(Boolean).slice(0, 15),
      updated_at: new Date().toISOString(),
    };
    const { error } = await db.from("case_studies").upsert(row, { onConflict: "slug" });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setCs(row);
    setMsg(row.published ? "Saved and published. It's live on the project page." : "Saved as a draft (not visible on the site).");
    loadAll();
  }

  const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  return (
    <section className="dash-card mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="dash-h2">Case studies</h2>
          <p className="mt-1 text-xs text-muted-foreground">Write the full story for each portfolio project. Only facts you can stand behind; it appears on the project page when published.</p>
        </div>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm">
          {PROJECTS.map((p) => { const s = projectSlug(p.name); return <option key={s} value={s}>{p.name}{status[s] ? " ✓ live" : status[s] === false ? " · draft" : ""}</option>; })}
        </select>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <label className="text-xs text-muted-foreground">The challenge (what the client was struggling with)<textarea rows={4} value={cs.challenge || ""} onChange={(e) => set("challenge", e.target.value)} className={field} /></label>
        <label className="text-xs text-muted-foreground">What we did<textarea rows={4} value={cs.approach || ""} onChange={(e) => set("approach", e.target.value)} className={field} /></label>
        <label className="text-xs text-muted-foreground">Deliverables (one per line)<textarea rows={4} value={deliverablesText} onChange={(e) => setDeliverablesText(e.target.value)} className={field} /></label>
        <label className="text-xs text-muted-foreground">Results (numbers, timeframe and how they were measured)<textarea rows={4} value={cs.results || ""} onChange={(e) => set("results", e.target.value)} className={field} /></label>
        <label className="text-xs text-muted-foreground">Timeline<input value={cs.timeline || ""} onChange={(e) => set("timeline", e.target.value)} placeholder="e.g. 6 weeks, launched March 2026" className={field} /></label>
        <label className="text-xs text-muted-foreground">Client quote (with their permission)<textarea rows={2} value={cs.quote || ""} onChange={(e) => set("quote", e.target.value)} className={field} /></label>
        <label className="text-xs text-muted-foreground">Quote author<input value={cs.quote_author || ""} onChange={(e) => set("quote_author", e.target.value)} placeholder="e.g. Ada Okafor" className={field} /></label>
        <label className="text-xs text-muted-foreground">Their role<input value={cs.client_role || ""} onChange={(e) => set("client_role", e.target.value)} placeholder="e.g. Founder, Lagos Couture" className={field} /></label>
      </div>
      <div className="mt-4">
        <p className="text-xs text-muted-foreground">Screenshots (PNG, JPG or WebP, up to 5 MB each, max 8)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {cs.screenshots.map((src) => (
            <div key={src} className="relative">
              <img src={src} alt="" className="h-20 w-32 rounded-lg border border-border object-cover" />
              <button onClick={() => set("screenshots", cs.screenshots.filter((x) => x !== src))} aria-label="Remove screenshot" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <label className="grid h-20 w-32 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-muted">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="flex items-center gap-1"><Upload className="h-3.5 w-3.5" /> Add</span>}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button disabled={busy} onClick={() => save(false)} className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted">Save draft</button>
        <button disabled={busy} onClick={() => save(true)} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"><Check className="h-3.5 w-3.5" /> Save & publish</button>
        {cs.published && <button disabled={busy} onClick={() => save(false)} className="text-xs text-muted-foreground underline">Unpublish</button>}
        <a href={`/portfolio/${slug}`} target="_blank" rel="noopener" className="text-xs text-muted-foreground underline">View page</a>
        {msg && <span className="text-xs">{msg}</span>}
      </div>
    </section>
  );
}

/* ------------------------------ Newsletter ------------------------------ */

interface Sub { email: string; name: string | null; source: string | null; language: string; status: string; welcomed_at: string | null; created_at: string }

export function NewsletterPanel() {
  const [subs, setSubs] = useState<Sub[] | null>(null);
  useEffect(() => {
    db.from("newsletter_subscribers").select("email,name,source,language,status,welcomed_at,created_at").order("created_at", { ascending: false }).limit(5000)
      .then(({ data }: { data: Sub[] | null }) => setSubs(data || []));
  }, []);
  const active = subs?.filter((s) => s.status === "subscribed") ?? [];
  function exportCsv() {
    const rows = [["email", "name", "language", "source", "subscribed_at"], ...active.map((s) => [s.email, s.name || "", s.language, s.source || "", s.created_at])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "newsletter-subscribers.csv";
    a.click();
  }
  return (
    <section className="dash-card mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="dash-h2">Newsletter</h2>
          <p className="mt-1 text-xs text-muted-foreground">{subs ? `${active.length} subscribed · ${subs.length - active.length} unsubscribed · ${subs.filter((s) => s.welcomed_at).length} welcome emails sent` : "Loading…"}</p>
        </div>
        <button onClick={exportCsv} disabled={!active.length} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"><Download className="h-3.5 w-3.5" /> Export CSV</button>
      </div>
      {subs && subs.length > 0 && subs.every((s) => !s.welcomed_at) && (
        <p className="mt-3 rounded-xl bg-muted p-3 text-xs">Welcome emails aren't sending yet: verify your domain in Resend, then add the Vault secret <code>newsletter_from</code> (for example <code>EmmaForYou &lt;hello@yourdomain.com&gt;</code>).</p>
      )}
      {active.length > 0 && (
        <ul className="mt-3 max-h-48 divide-y divide-border overflow-y-auto text-sm">
          {active.slice(0, 50).map((s) => <li key={s.email} className="flex justify-between gap-3 py-1.5"><span>{s.email}{s.name ? ` · ${s.name}` : ""}</span><span className="text-xs text-muted-foreground">{s.language.toUpperCase()} · {new Date(s.created_at).toLocaleDateString()}</span></li>)}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------ Client reviews ------------------------------ */

interface Review { id: string; rating: number; body: string; display_name: string; business: string | null; may_publish: boolean; approved: boolean; created_at: string }

export function ReviewsPanel() {
  const [rows, setRows] = useState<Review[] | null>(null);
  async function load() {
    const { data } = await db.from("client_testimonials").select("*").order("created_at", { ascending: false }).limit(200);
    setRows(data || []);
  }
  useEffect(() => { load(); }, []);
  async function toggle(r: Review) {
    await db.from("client_testimonials").update({ approved: !r.approved }).eq("id", r.id);
    load();
  }
  return (
    <section className="dash-card mt-4">
      <h2 className="dash-h2">Client reviews</h2>
      <p className="mt-1 text-xs text-muted-foreground">Reviews clients leave in the portal after approving work. Approve the ones they allowed you to publish to show them as verified reviews on the testimonials page.</p>
      {!rows ? <Loader2 className="mt-3 h-4 w-4 animate-spin" /> : rows.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p> : (
        <ul className="mt-3 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />)} <span className="ml-2 font-medium">{r.display_name}{r.business ? `, ${r.business}` : ""}</span></span>
                {r.may_publish ? (
                  <button onClick={() => toggle(r)} className={`rounded-full px-3 py-1 text-xs font-semibold ${r.approved ? "bg-emerald-500/10 text-emerald-600" : "border border-border"}`}>{r.approved ? "Shown on site ✓" : "Show on site"}</button>
                ) : <span className="text-xs text-muted-foreground">Private (not for publishing)</span>}
              </div>
              <p className="mt-1.5 text-muted-foreground">“{r.body}”</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
