import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { FlaskConical, Trash2 } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { deleteItem, listItems, saveItem, type Item } from "@/lib/ecom/workspace";
import { Card, ErrorBox, PageIntro, useWorkspace } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/marketing")({
  head: () => pageHead({ title: "Ecommerce Marketing & Traffic Planner — Measurable Experiments | EmmaForYou", description: "Plan marketing experiments for your store with a baseline, hypothesis, action, metric and review date, and check which traffic channels you've covered.", path: "/ecommerce/marketing" }),
  component: Marketing,
});

interface Experiment { hypothesis: string; action: string; metric: string; baseline: string; direction?: string; reviewIn?: string; reviewDate?: string; channel?: string; result?: string; source?: string }

const CHANNELS: { id: string; name: string; what: string; measure: string }[] = [
  { id: "seo", name: "Search (SEO)", what: "Product and category pages that answer what buyers search for; titles, descriptions, product data.", measure: "Search Console clicks and impressions per page" },
  { id: "marketplaces", name: "Marketplaces", what: "Listing the best sellers on Amazon, Jumia, Etsy or similar where buyers already search.", measure: "Marketplace orders and fees vs. your own store" },
  { id: "social", name: "Organic social & short video", what: "Showing the product in use; answering common questions in posts.", measure: "Link clicks and sessions from each platform" },
  { id: "ads", name: "Paid ads", what: "Small tests with one product, one audience and a fixed budget before scaling.", measure: "Cost per purchase vs. your maximum affordable ad cost" },
  { id: "email", name: "Email & SMS / WhatsApp", what: "Welcome message, abandoned-cart reminder, post-purchase follow-up (with consent).", measure: "Revenue per message sent; unsubscribes" },
  { id: "creators", name: "Creators & affiliates", what: "Paying per sale or a fixed fee to people your customers already follow.", measure: "Orders per discount code or tracking link" },
  { id: "referrals", name: "Referrals & reviews", what: "Asking happy customers for reviews and referrals after delivery.", measure: "Review count and referred orders" },
  { id: "retention", name: "Repeat purchases", what: "Reorder reminders, bundles and loyalty for products people buy again.", measure: "Repeat-customer rate from your orders export" },
];

const blank: Experiment = { hypothesis: "", action: "", metric: "", baseline: "", reviewDate: "", channel: "" };

function Marketing() {
  const { uid, workspace, signedIn, ready } = useWorkspace();
  const [items, setItems] = useState<Item<Experiment>[]>([]);
  const [form, setForm] = useState<Experiment>(blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [covered, setCovered] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);

  async function load() {
    if (!workspace) return;
    const [ex, ch] = await Promise.all([listItems<Experiment>(workspace.id, "experiment"), listItems<{ channels: string[] }>(workspace.id, "task")]);
    setItems(ex);
    const c = ch.find((x) => x.title === "Marketing channels");
    if (c) { setCovered(c.data.channels ?? []); setProfileId(c.id); }
  }
  useEffect(() => { void load().catch(() => undefined); }, [workspace]); // eslint-disable-line react-hooks/exhaustive-deps

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!uid || !workspace) return;
    if (!form.hypothesis.trim() || !form.action.trim() || !form.metric.trim()) return setError("Add a hypothesis, the action you'll take and the metric you'll watch.");
    setBusy(true); setError("");
    try { await saveItem(uid, workspace.id, "experiment", form.hypothesis.slice(0, 200), form); setForm(blank); await load(); }
    catch (er) { setError(er instanceof Error ? er.message : "Couldn't save."); } finally { setBusy(false); }
  }
  async function update(it: Item<Experiment>, patch: Partial<Experiment>, status?: Item["status"]) {
    if (!uid || !workspace) return;
    const next = { ...it.data, ...patch };
    setItems((x) => x.map((y) => (y.id === it.id ? { ...y, data: next, status: status ?? y.status } : y)));
    await saveItem(uid, workspace.id, "experiment", it.title, next, it.id, status ?? it.status).catch(() => undefined);
  }
  async function toggleChannel(id: string) {
    const next = covered.includes(id) ? covered.filter((c) => c !== id) : [...covered, id];
    setCovered(next);
    if (uid && workspace) { const it = await saveItem(uid, workspace.id, "task", "Marketing channels", { channels: next, internal: true }, profileId ?? undefined).catch(() => null); if (it) setProfileId(it.id); }
  }

  return (
    <div>
      <PageIntro eyebrow="Marketing & traffic" title="Plan experiments, not guesses">Each experiment needs a starting number (baseline), what you'll change, the metric that tells you if it worked and a date to check. Run one change at a time so you know what caused the result.</PageIntro>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {ready && !signedIn ? (
            <Card><p className="text-sm">Sign in to save experiments and track results. <Link to="/login" search={{ next: "/ecommerce/marketing" }} className="font-semibold underline">Sign in or create an account</Link></p></Card>
          ) : (
            <Card title="New experiment">
              <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
                <Field id="mx-h" label="Hypothesis" placeholder="If we add delivery times to product pages, more visitors will add to cart" value={form.hypothesis} onChange={(v) => setForm((f) => ({ ...f, hypothesis: v }))} wide />
                <Field id="mx-a" label="Action" placeholder="Add 'Delivered in 2–4 days in Lagos' under the price" value={form.action} onChange={(v) => setForm((f) => ({ ...f, action: v }))} wide />
                <Field id="mx-b" label="Baseline (today's number)" placeholder="Add-to-cart rate 3.1% (last 14 days)" value={form.baseline} onChange={(v) => setForm((f) => ({ ...f, baseline: v }))} />
                <Field id="mx-m" label="Metric to watch" placeholder="Add-to-cart rate" value={form.metric} onChange={(v) => setForm((f) => ({ ...f, metric: v }))} />
                <div><label htmlFor="mx-c" className="text-sm font-medium">Channel</label><select id="mx-c" className="input mt-1" value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}><option value="">On-site / other</option>{CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label htmlFor="mx-d" className="text-sm font-medium">Review date</label><input id="mx-d" type="date" className="input mt-1" value={form.reviewDate} onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))} /></div>
                {error && <div className="sm:col-span-2"><ErrorBox message={error} /></div>}
                <div className="sm:col-span-2"><button type="submit" disabled={busy || !workspace} className="btn-primary-gradient inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white disabled:opacity-60"><FlaskConical className="h-4 w-4" aria-hidden="true" />{busy ? "Saving…" : "Add experiment"}</button></div>
              </form>
            </Card>
          )}
          {items.length > 0 && (
            <ul className="space-y-3">{items.map((it) => {
              const overdue = it.status !== "done" && it.data.reviewDate && new Date(it.data.reviewDate) < new Date();
              return (
                <li key={it.id}><Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0"><p className="text-xs text-muted-foreground">{it.data.source ?? (CHANNELS.find((c) => c.id === it.data.channel)?.name || "On-site")}{it.data.reviewDate ? ` · review ${new Date(it.data.reviewDate).toLocaleDateString()}` : it.data.reviewIn ? ` · review in ${it.data.reviewIn}` : ""}{overdue ? " · due" : ""}</p><h3 className="mt-0.5 font-display text-base font-bold">{it.data.hypothesis}</h3></div>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`st-${it.id}`} className="sr-only">Status</label>
                      <select id={`st-${it.id}`} className="input !w-auto !py-1.5 text-sm" value={it.status} onChange={(e) => update(it, {}, e.target.value as Item["status"])}><option value="open">Planned</option><option value="in_progress">Running</option><option value="done">Finished</option><option value="archived">Dropped</option></select>
                      <button type="button" aria-label="Delete experiment" onClick={async () => { await deleteItem(it.id).catch(() => undefined); setItems((x) => x.filter((y) => y.id !== it.id)); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                    </div>
                  </div>
                  <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[110px_minmax(0,1fr)]">
                    <dt className="text-muted-foreground">Action</dt><dd>{it.data.action}</dd>
                    <dt className="text-muted-foreground">Metric</dt><dd>{it.data.metric}{it.data.direction ? ` (${it.data.direction})` : ""}</dd>
                    <dt className="text-muted-foreground">Baseline</dt><dd>{it.data.baseline || <span className="text-amber-700 dark:text-amber-300">Add a baseline before you start</span>}</dd>
                  </dl>
                  {(it.status === "in_progress" || it.status === "done") && (
                    <div className="mt-2"><label htmlFor={`res-${it.id}`} className="text-sm font-medium">Result</label><textarea id={`res-${it.id}`} rows={2} className="input mt-1" placeholder="What changed? e.g. add-to-cart 3.1% → 3.6% over 14 days" defaultValue={it.data.result ?? ""} onBlur={(e) => e.target.value !== (it.data.result ?? "") && update(it, { result: e.target.value.slice(0, 1000) })} /></div>
                  )}
                </Card></li>
              );
            })}</ul>
          )}
        </div>
        <Card title="Traffic channels" className="lg:self-start">
          <p className="mb-3 text-xs text-muted-foreground">Tick what you already do well. We don't estimate how much traffic a channel will bring; test it and measure.</p>
          <ul className="space-y-3">{CHANNELS.map((c) => (
            <li key={c.id}><label className="flex gap-2.5"><input type="checkbox" checked={covered.includes(c.id)} onChange={() => void toggleChannel(c.id)} disabled={!workspace} className="mt-1 h-4 w-4 shrink-0 accent-[var(--emma-violet)]" /><span className="text-sm"><span className="font-semibold">{c.name}</span><span className="block text-muted-foreground">{c.what}</span><span className="block text-xs text-muted-foreground">Measure: {c.measure}</span></span></label></li>
          ))}</ul>
        </Card>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, placeholder, wide }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><label htmlFor={id} className="text-sm font-medium">{label}</label><input id={id} className="input mt-1" value={value} maxLength={300} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></div>;
}
