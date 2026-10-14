import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, List, Plus, Trash2 } from "lucide-react";
import { Badge, Btn, Field, Panel, Select, Stat, daysFromNow, fmtDate, uid, type EngineProps } from "./ui";

type Pri = "High" | "Medium" | "Low";
interface Card { id: string; title: string; who: string; due: number; pri: Pri; col: number; tag?: string; signed?: string }

const P: Record<string, { cols: string[]; people: string[]; item: string; approveCol?: number; signCol?: number; cards: [string, string, number, Pri, number, string?][] }> = {
  projects: { cols: ["To do", "In progress", "Review", "Done"], people: ["Ada", "Tunde", "Chloe", "Ibrahim"], item: "Task", cards: [["Wireframes for homepage", "Chloe", 2, "High", 1, "Design"], ["Set up hosting", "Tunde", -1, "Medium", 0, "Dev"], ["Write service pages", "Ada", 4, "Medium", 0, "Content"], ["Client feedback round 1", "Ibrahim", 1, "High", 2], ["Domain & email", "Tunde", -3, "Low", 3, "Dev"], ["Brand colours", "Chloe", -5, "Low", 3, "Design"]] },
  editorial: { cols: ["Ideas", "Drafting", "Editing", "Scheduled", "Published"], people: ["Editor", "Writer A", "Writer B"], item: "Article", cards: [["10 ways to cut delivery costs", "Writer A", 3, "Medium", 1], ["Interview: local founders", "Writer B", 6, "Low", 0], ["Market report Q4", "Editor", 1, "High", 2], ["Holiday gift guide", "Writer A", 8, "Medium", 3], ["How we test products", "Writer B", -2, "Low", 4]] },
  "client-portal": { cols: ["Planned", "In progress", "Awaiting your approval", "Approved"], people: ["Your team", "Client"], item: "Deliverable", approveCol: 2, cards: [["Homepage design", "Your team", 1, "High", 2], ["Logo refresh", "Your team", 3, "Medium", 1], ["Product photography", "Your team", 7, "Low", 0], ["Brand guidelines PDF", "Your team", -2, "Medium", 3], ["Launch email copy", "Your team", 2, "Medium", 2]] },
  hiring: { cols: ["Applied", "Screening", "Interview", "Offer", "Hired"], people: ["HR", "Hiring manager"], item: "Candidate", cards: [["Amaka O. — Sales lead", "HR", 1, "High", 2], ["David K. — Designer", "Hiring manager", 2, "Medium", 1], ["Fatima B. — Accountant", "HR", 0, "Medium", 0], ["Leo P. — Developer", "Hiring manager", 4, "High", 3], ["Grace N. — Support", "HR", -1, "Low", 0]] },
  social: { cols: ["Ideas", "Drafted", "Needs approval", "Scheduled", "Posted"], people: ["Social lead", "Designer", "Owner"], item: "Post", approveCol: 2, cards: [["Reel: behind the scenes", "Designer", 2, "Medium", 1, "Instagram"], ["Customer story carousel", "Social lead", 1, "High", 2, "LinkedIn"], ["Weekend promo", "Social lead", 4, "Medium", 3, "Facebook"], ["Team intro", "Designer", 6, "Low", 0, "TikTok"]] },
  coaching: { cols: ["This week", "Doing", "Done"], people: ["Client", "Coach"], item: "Homework", cards: [["Call 5 past clients", "Client", 2, "High", 0], ["Draft new offer", "Client", 4, "Medium", 1], ["Review pricing page", "Coach", 1, "Low", 0], ["Book 3 discovery calls", "Client", -1, "High", 2]] },
  compliance: { cols: ["Control", "Evidence needed", "Under review", "Complete"], people: ["Ops", "IT", "Finance"], item: "Control", cards: [["Access reviews (quarterly)", "IT", 5, "High", 1], ["Backup restore test", "IT", -4, "High", 0], ["Vendor risk register", "Ops", 9, "Medium", 2], ["Expense approval policy", "Finance", 2, "Low", 3]] },
  field: { cols: ["Assigned", "On the way", "On site", "Completed"], people: ["Musa", "Kemi", "Joe"], item: "Job", signCol: 3, cards: [["AC service — 12 Allen Ave", "Musa", 0, "High", 1], ["Generator repair — Lekki Ph1", "Kemi", 0, "High", 2], ["Inspection — Ikeja GRA", "Joe", 1, "Medium", 0], ["Install CCTV — VI", "Musa", 2, "Medium", 0]] },
  photo: { cols: ["Booked", "Shot", "Editing", "Proofing", "Delivered"], people: ["Photographer", "Editor"], item: "Shoot", approveCol: 3, cards: [["Wedding — A & T", "Editor", 3, "High", 2], ["Headshots — Law firm", "Photographer", 1, "Medium", 1], ["Product shoot — Skincare", "Editor", 5, "Medium", 3], ["Family portraits", "Photographer", 8, "Low", 0]] },
  legal: { cols: ["Intake", "Open", "Awaiting documents", "Hearing / deadline", "Closed"], people: ["Partner", "Associate", "Paralegal"], item: "Matter", cards: [["Lease dispute — Ola Stores", "Associate", 6, "High", 1], ["Company registration — Nova", "Paralegal", 2, "Medium", 2], ["Employment contract review", "Associate", 1, "Medium", 0], ["Debt recovery — Zed Ltd", "Partner", -1, "High", 3]] },
  construction: { cols: ["Planned", "In progress", "Inspection", "Change order", "Done"], people: ["Site manager", "Electrician", "Plumber"], item: "Work package", cards: [["Foundation pour — Block B", "Site manager", 2, "High", 1], ["First-fix wiring", "Electrician", 5, "Medium", 0], ["Bathroom layout change", "Site manager", 1, "Medium", 3], ["Roof inspection", "Site manager", -1, "High", 2], ["Plumbing rough-in", "Plumber", 3, "Medium", 1]] },
};

export default function KanbanDemo({ preset }: EngineProps) {
  const cfg = P[preset] ?? P.projects;
  const [cards, setCards] = useState<Card[]>(() => cfg.cards.map(([title, who, due, pri, col, tag]) => ({ id: uid(), title, who, due, pri, col, tag })));
  const [view, setView] = useState<"board" | "list">("board");
  const [who, setWho] = useState("Everyone");
  const [pri, setPri] = useState("Any");
  const [draft, setDraft] = useState({ title: "", who: cfg.people[0], due: "3", pri: "Medium" as Pri });
  const [signing, setSigning] = useState<string | null>(null);
  const [sig, setSig] = useState("");
  const [msg, setMsg] = useState("");

  const shown = useMemo(() => cards.filter((c) => (who === "Everyone" || c.who === who) && (pri === "Any" || c.pri === pri)), [cards, who, pri]);
  const last = cfg.cols.length - 1;
  const done = cards.filter((c) => c.col === last).length;
  const overdue = cards.filter((c) => c.due < 0 && c.col !== last).length;

  const setCol = (id: string, col: number) => {
    if (cfg.signCol !== undefined && col === cfg.signCol) { setSigning(id); return; }
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, col } : c)));
  };
  const approve = (id: string) => { setCards((cs) => cs.map((c) => (c.id === id ? { ...c, col: (cfg.approveCol ?? 0) + 1 } : c))); setMsg("Approved. In a live portal the team is notified and the next step starts."); };

  const cardEl = (c: Card) => (
    <article key={c.id} className="rounded-xl border border-border bg-card p-2.5 text-sm shadow-sm">
      <p className="font-semibold text-foreground">{c.title}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <Badge tone={c.pri === "High" ? "bad" : c.pri === "Medium" ? "warn" : "neutral"}>{c.pri}</Badge>
        {c.tag && <Badge tone="accent">{c.tag}</Badge>}
        {c.signed && <Badge tone="good">Signed: {c.signed}</Badge>}
      </div>
      <p className={`mt-1 text-[11px] ${c.due < 0 && c.col !== last ? "font-semibold text-red-600" : "text-muted-foreground"}`}>{c.who} · due {fmtDate(daysFromNow(c.due))}{c.due < 0 && c.col !== last ? " · overdue" : ""}</p>
      {cfg.approveCol === c.col && (
        <div className="mt-2 flex gap-1.5"><Btn onClick={() => approve(c.id)} className="!px-2.5 !py-1 !text-xs">Approve</Btn><Btn variant="ghost" onClick={() => { setCol(c.id, Math.max(0, c.col - 1)); setMsg("Changes requested. The item goes back to the team with your note."); }} className="!px-2.5 !py-1 !text-xs">Request changes</Btn></div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <button type="button" aria-label={`Move "${c.title}" back`} disabled={c.col === 0} onClick={() => setCol(c.id, c.col - 1)} className="rounded-full p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" aria-label={`Delete "${c.title}"`} onClick={() => setCards((cs) => cs.filter((x) => x.id !== c.id))} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
        <button type="button" aria-label={`Move "${c.title}" forward`} disabled={c.col === last} onClick={() => setCol(c.id, c.col + 1)} className="rounded-full p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </article>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={`${cfg.item}s`} value={cards.length} />
        <Stat label={cfg.cols[last]} value={done} />
        <Stat label="Progress" value={`${cards.length ? Math.round((done / cards.length) * 100) : 0}%`} />
        <Stat label="Overdue" value={overdue} hint={overdue ? "Flagged in red" : "On track"} />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={cards.length ? Math.round((done / cards.length) * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress"><div className="h-full bg-[var(--demo-accent)] transition-all" style={{ width: `${cards.length ? (done / cards.length) * 100 : 0}%` }} /></div>

      <Panel title={`New ${cfg.item.toLowerCase()}`}>
        <form onSubmit={(e) => { e.preventDefault(); if (!draft.title.trim()) return; setCards((cs) => [...cs, { id: uid(), title: draft.title.trim(), who: draft.who, due: Number(draft.due), pri: draft.pri, col: 0 }]); setDraft({ ...draft, title: "" }); }} className="grid gap-2 sm:grid-cols-[1fr_150px_130px_110px_auto] sm:items-end">
          <Field label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={70} placeholder={`Describe the ${cfg.item.toLowerCase()}`} />
          <Select label="Assigned to" value={draft.who} onChange={(e) => setDraft({ ...draft, who: e.target.value })} options={cfg.people} />
          <Select label="Due" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} options={[["0", "Today"], ["1", "Tomorrow"], ["3", "In 3 days"], ["7", "Next week"]]} />
          <Select label="Priority" value={draft.pri} onChange={(e) => setDraft({ ...draft, pri: e.target.value as Pri })} options={["High", "Medium", "Low"]} />
          <Btn type="submit" disabled={!draft.title.trim()}><Plus className="h-4 w-4" />Add</Btn>
        </form>
      </Panel>

      <div className="flex flex-wrap items-end gap-3">
        <Select label="Person" value={who} onChange={(e) => setWho(e.target.value)} options={["Everyone", ...cfg.people]} className="w-44" />
        <Select label="Priority" value={pri} onChange={(e) => setPri(e.target.value)} options={["Any", "High", "Medium", "Low"]} className="w-32" />
        <div className="ml-auto flex rounded-full border border-border p-0.5" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "board"} onClick={() => setView("board")} className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${view === "board" ? "bg-[var(--demo-accent)] text-white" : "text-muted-foreground"}`}><LayoutGrid className="h-3.5 w-3.5" />Board</button>
          <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${view === "list" ? "bg-[var(--demo-accent)] text-white" : "text-muted-foreground"}`}><List className="h-3.5 w-3.5" />List</button>
        </div>
      </div>
      {msg && <p role="status" className="rounded-xl bg-[color-mix(in_srgb,var(--demo-accent)_10%,transparent)] px-3 py-2 text-sm text-foreground">{msg}</p>}

      {view === "board" ? (
        <div className="grid gap-3 overflow-x-auto pb-1" style={{ gridTemplateColumns: `repeat(${cfg.cols.length}, minmax(190px, 1fr))` }}>
          {cfg.cols.map((col, ci) => (
            <div key={col} className="rounded-2xl bg-muted/60 p-2.5">
              <p className="mb-2 px-1 text-xs font-semibold text-foreground">{col} <span className="font-normal text-muted-foreground">({shown.filter((c) => c.col === ci).length})</span></p>
              <div className="space-y-2">{shown.filter((c) => c.col === ci).map(cardEl)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground"><tr><th className="p-2.5">{cfg.item}</th><th className="p-2.5">Owner</th><th className="p-2.5">Due</th><th className="p-2.5">Priority</th><th className="p-2.5">Status</th></tr></thead>
            <tbody>{shown.slice().sort((a, b) => a.due - b.due).map((c) => (
              <tr key={c.id} className="border-t border-border"><td className="p-2.5 font-medium">{c.title}</td><td className="p-2.5">{c.who}</td><td className={`p-2.5 ${c.due < 0 && c.col !== last ? "text-red-600" : ""}`}>{fmtDate(daysFromNow(c.due))}</td><td className="p-2.5">{c.pri}</td>
                <td className="p-2.5"><select aria-label={`Status of ${c.title}`} value={c.col} onChange={(e) => setCol(c.id, Number(e.target.value))} className="rounded-lg border border-border bg-background px-2 py-1 text-xs">{cfg.cols.map((s, i) => <option key={s} value={i}>{s}</option>)}</select></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {signing && (
        <Panel title="Customer sign-off" actions={<Btn variant="ghost" onClick={() => setSigning(null)}>Cancel</Btn>}>
          <p className="text-sm text-muted-foreground">In the app the customer signs on the technician's phone. Type a name to sign this demo job off.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (!sig.trim()) return; setCards((cs) => cs.map((c) => (c.id === signing ? { ...c, col: cfg.signCol!, signed: sig.trim() } : c))); setSigning(null); setSig(""); setMsg("Job completed with signature. The office sees it instantly."); }} className="mt-2 flex gap-2">
            <input value={sig} onChange={(e) => setSig(e.target.value)} maxLength={40} placeholder="Customer name" aria-label="Customer name" className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 font-[cursive] text-lg outline-none focus:border-[var(--demo-accent)]" />
            <Btn type="submit" disabled={!sig.trim()}>Sign & complete</Btn>
          </form>
        </Panel>
      )}
    </div>
  );
}
