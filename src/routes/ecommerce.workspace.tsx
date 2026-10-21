import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Plus, Trash2, Pencil, Check } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { createWorkspace, deleteItem, deleteWorkspace, exportWorkspace, listItems, myWorkspaces, updateWorkspace, type Item, type ItemKind, type Workspace } from "@/lib/ecom/workspace";
import { Card, ErrorBox, PageIntro, setActiveWorkspace, useWorkspace } from "@/components/ecom/ui";

export const Route = createFileRoute("/ecommerce/workspace")({
  head: () => pageHead({ title: "My Ecommerce Workspace | EmmaForYou", description: "Your saved ecommerce reports, plans, audits and experiments.", path: "/ecommerce/workspace", noindex: true }),
  component: WorkspacePage,
});

const KIND_LABEL: Record<ItemKind, { label: string; to: string }> = {
  roadmap: { label: "Launch roadmaps", to: "/ecommerce/start" }, research: { label: "Product research", to: "/ecommerce/research" }, product: { label: "Products", to: "/ecommerce/research" },
  audit: { label: "Store audits", to: "/ecommerce/grow" }, diagnosis: { label: "Sales diagnoses", to: "/ecommerce/diagnose" }, profit: { label: "Profit analyses", to: "/ecommerce/profit" },
  competitors: { label: "Competitor comparisons", to: "/ecommerce/competitors" }, experiment: { label: "Experiments", to: "/ecommerce/marketing" }, task: { label: "Tasks", to: "/ecommerce/plan" }, import: { label: "Imports", to: "/ecommerce/diagnose" },
};

function WorkspacePage() {
  const { uid, workspace, signedIn, ready, error: wsError } = useWorkspace();
  const [list, setList] = useState<Workspace[]>([]);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [newName, setNewName] = useState("");
  const [newStage, setNewStage] = useState<Workspace["stage"]>("starting");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { if (signedIn) myWorkspaces().then(setList).catch(() => undefined); }, [signedIn, workspace]);
  useEffect(() => { if (workspace) { setName(workspace.name); setItems(null); listItems(workspace.id).then(setItems).catch((e) => setError(e.message)); } }, [workspace]);

  if (ready && !signedIn) return (
    <div><PageIntro eyebrow="Workspace" title="Your workspace">Saved reports, plans and audits live here, private to your account.</PageIntro>
      <Card><p className="text-sm"><Link to="/login" search={{ next: "/ecommerce/workspace" }} className="font-semibold underline">Sign in or create an account</Link> to save and view your work. The same account works across the Community, client portal and here.</p></Card></div>
  );

  async function rename() {
    if (!workspace || !name.trim()) return;
    try { await updateWorkspace(workspace.id, { name: name.trim().slice(0, 80) }); setActiveWorkspace({ ...workspace, name: name.trim().slice(0, 80) }); setEditing(false); } catch (e) { setError((e as Error).message); }
  }
  async function create() {
    if (!uid) return;
    try { const w = await createWorkspace(uid, newName || "New business", newStage); setNewName(""); setActiveWorkspace(w); } catch (e) { setError((e as Error).message); }
  }
  async function removeWorkspace() {
    if (!workspace || !uid) return;
    try {
      await deleteWorkspace(workspace.id);
      const rest = (await myWorkspaces()).filter((w) => w.id !== workspace.id);
      setList(rest); setConfirmDelete(false);
      setActiveWorkspace(rest[0] ?? (await createWorkspace(uid, "My business", "starting")));
    } catch (e) { setError((e as Error).message); }
  }

  const groups = (Object.keys(KIND_LABEL) as ItemKind[]).map((k) => ({ kind: k, rows: (items ?? []).filter((i) => i.kind === k && !(i.data as { internal?: boolean }).internal) })).filter((g) => g.rows.length);

  return (
    <div>
      <PageIntro eyebrow="Workspace" title={workspace?.name ?? "Your workspace"}>Everything you save is private to your account. Export a full copy as JSON or delete anything at any time.</PageIntro>
      {(error || wsError) && <div className="mb-4"><ErrorBox message={error || wsError} /></div>}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {items === null ? <Card><p className="text-sm text-muted-foreground">Loading…</p></Card> : groups.length === 0 ? (
            <Card className="border-dashed"><p className="text-sm text-muted-foreground">Nothing saved yet. Start with the <Link to="/ecommerce/start" className="underline">launch guide</Link> or a <Link to="/ecommerce/grow" className="underline">store audit</Link>, then choose "Save to workspace".</p></Card>
          ) : groups.map((g) => (
            <Card key={g.kind} title={`${KIND_LABEL[g.kind].label} (${g.rows.length})`} actions={<Link to={KIND_LABEL[g.kind].to as "/ecommerce"} className="text-sm font-semibold text-[var(--emma-violet)]">Open tool</Link>}>
              <ul className="divide-y divide-border">{g.rows.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{i.title}</p><p className="text-xs text-muted-foreground">Updated {new Date(i.updated_at).toLocaleString()}{i.status !== "open" ? ` · ${i.status.replace("_", " ")}` : ""}</p></div>
                  <button type="button" aria-label={`Delete ${i.title}`} onClick={async () => { if (!window.confirm(`Delete "${i.title}"? This can't be undone.`)) return; try { await deleteItem(i.id); setItems((x) => (x ?? []).filter((y) => y.id !== i.id)); } catch (e) { setError((e as Error).message); } }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </li>
              ))}</ul>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {workspace && (
            <Card title="This workspace">
              {editing ? (
                <form onSubmit={(e) => { e.preventDefault(); void rename(); }} className="flex gap-2"><label htmlFor="ws-name" className="sr-only">Workspace name</label><input id="ws-name" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /><button type="submit" aria-label="Save name" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border hover:bg-muted"><Check className="h-4 w-4" aria-hidden="true" /></button></form>
              ) : (
                <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold"><Pencil className="h-4 w-4" aria-hidden="true" />Rename</button>
              )}
              <div className="mt-3"><label htmlFor="ws-stage" className="text-sm font-medium">Stage</label><select id="ws-stage" className="input mt-1" value={workspace.stage} onChange={async (e) => { const stage = e.target.value as Workspace["stage"]; await updateWorkspace(workspace.id, { stage }).catch(() => undefined); setActiveWorkspace({ ...workspace, stage }); }}><option value="starting">Starting a business</option><option value="growing">Growing an existing store</option></select></div>
              {workspace.store_url && <p className="mt-2 break-all text-xs text-muted-foreground">Store: {workspace.store_url}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => exportWorkspace(workspace).catch((e) => setError(e.message))} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"><Download className="h-4 w-4" aria-hidden="true" />Export JSON</button>
                {!confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-red-500/40 px-4 text-sm font-semibold text-red-600 hover:bg-red-500/10"><Trash2 className="h-4 w-4" aria-hidden="true" />Delete workspace</button>
                  : <span className="flex flex-wrap items-center gap-2 text-sm"><span>Delete everything in it?</span><button type="button" onClick={removeWorkspace} className="rounded-full bg-red-600 px-3 py-1.5 font-semibold text-white">Delete</button><button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full border border-border px-3 py-1.5 font-semibold">Cancel</button></span>}
              </div>
            </Card>
          )}
          <Card title="Switch or add">
            {list.length > 1 && <ul className="mb-3 space-y-1">{list.map((w) => <li key={w.id}><button type="button" onClick={() => setActiveWorkspace(w)} aria-current={w.id === workspace?.id ? "true" : undefined} className={`w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted ${w.id === workspace?.id ? "bg-muted font-semibold" : ""}`}>{w.name}<span className="block text-xs font-normal text-muted-foreground">{w.stage === "growing" ? "Growing a store" : "Starting"}</span></button></li>)}</ul>}
            <form onSubmit={(e) => { e.preventDefault(); void create(); }} className="space-y-2">
              <label htmlFor="ws-new" className="text-sm font-medium">New workspace</label>
              <input id="ws-new" className="input" placeholder="e.g. Second brand" value={newName} maxLength={80} onChange={(e) => setNewName(e.target.value)} />
              <label htmlFor="ws-new-stage" className="sr-only">Stage</label>
              <select id="ws-new-stage" className="input" value={newStage} onChange={(e) => setNewStage(e.target.value as Workspace["stage"])}><option value="starting">Starting a business</option><option value="growing">Growing an existing store</option></select>
              <button type="submit" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"><Plus className="h-4 w-4" aria-hidden="true" />Create</button>
              <p className="text-xs text-muted-foreground">Up to 10 workspaces per account.</p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
