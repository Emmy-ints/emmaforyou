import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, List, Plus, Trash2 } from "lucide-react";
import { Badge, Btn, Field, ListEditor, Outbox, Panel, RoleBar, Select, SettingsPanel, Stat, Toggles, daysFromNow, fmtDate, uid, useDemoSetting, type EngineProps, type OutboxItem } from "./ui";

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

const NOTIFY: [string, string][] = [["assign", "Notify people when work is assigned to them"], ["move", "Notify the owner when an item changes status"], ["approve", "Notify the team about approvals and change requests"]];

export default function KanbanDemo(props: EngineProps) {
  const { preset } = props;
  const base = P[preset] ?? P.projects;
  const [cols, setCols] = useDemoSetting<string[]>(props, "cols", base.cols);
  const [people, setPeople] = useDemoSetting<string[]>(props, "people", base.people);
  const [wip, setWip] = useDemoSetting(props, "wip", 0);
  const [notify, setNotify] = useDemoSetting<string[]>(props, "notify", ["assign", "approve"]);
  const [role, setRole] = useDemoSetting(props, "role", "manager");
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const push = (channel: string, to: string, text: string) => setOutbox((o) => [...o, { id: uid(), channel, to, text }].slice(-30));
  const clampCol = (i: number | undefined) => (i === undefined ? undefined : Math.min(i, cols.length - 1));
  const cfg = { ...base, cols, people, approveCol: clampCol(base.approveCol), signCol: clampCol(base.signCol) };
  const member = people[0];
  const guestLabel = base.approveCol !== undefined ? "Client" : "Guest";
  const ROLES = [
    { id: "manager", label: "Manager", can: "Full access: add, assign, move and delete any item, and change settings." },
    { id: "member", label: `Team member (${member})`, can: `Can add items and move only items assigned to ${member}. Cannot delete.` },
    { id: "guest", label: `${guestLabel} (view${base.approveCol !== undefined ? " + approve" : " only"})`, can: base.approveCol !== undefined ? `Sees progress and can approve or request changes on items in "${cols[cfg.approveCol!]}". Cannot edit anything else.` : "Read-only: sees the board and progress but cannot change anything." },
  ];
  const canAdd = role !== "guest";
  const canMove = (c: Card) => role === "manager" || (role === "member" && c.who === member);
  const canDelete = role === "manager";
  const [rawCards, setCards] = useState<Card[]>(() => base.cards.map(([title, who, due, pri, col, tag]) => ({ id: uid(), title, who, due, pri, col, tag })));
  // Items in removed columns move to the last column; items assigned to removed people show as unassigned.
  const cards = rawCards.map((c) => ({ ...c, col: Math.min(c.col, cols.length - 1), who: people.includes(c.who) ? c.who : "Unassigned" }));
  const [view, setView] = useState<"board" | "list">("board");
  const [who, setWho] = useState("Everyone");
  const [pri, setPri] = useState("Any");
  const [draftRaw, setDraft] = useState({ title: "", who: base.people[0], due: "3", pri: "Medium" as Pri });
  const draft = { ...draftRaw, who: people.includes(draftRaw.who) ? draftRaw.who : people[0] };
  const [signing, setSigning] = useState<string | null>(null);
  const [sig, setSig] = useState("");
  const [msg, setMsg] = useState("");

  const shown = useMemo(() => cards.filter((c) => (who === "Everyone" || c.who === who) && (pri === "Any" || c.pri === pri)), [cards, who, pri]);
  const last = cfg.cols.length - 1;
  const done = cards.filter((c) => c.col === last).length;
  const overdue = cards.filter((c) => c.due < 0 && c.col !== last).length;

  const setCol = (id: string, col: number, force = false) => {
    const c = cards.find((x) => x.id === id);
    if (!c || col < 0 || col > last) return;
    if (!force && !canMove(c)) { setMsg(role === "guest" ? "View-only role: switch to Manager to move items." : `Only ${c.who === "Unassigned" ? "a manager" : c.who} or a manager can move this item.`); return; }
    if (wip > 0 && col !== last && col > c.col && cards.filter((x) => x.col === col).length >= wip) { setMsg(`"${cols[col]}" is at its limit of ${wip}. Finish something there first (WIP limit in Demo settings).`); return; }
    if (cfg.signCol !== undefined && col === cfg.signCol && !force) { setSigning(id); return; }
    setCards((cs) => cs.map((x) => (x.id === id ? { ...x, col } : x)));
    setMsg("");
    if (notify.includes("move") && c.who !== "Unassigned") push("Email", c.who, `"${c.title}" moved from ${cols[c.col]} to ${cols[col]}.`);
  };
  const approve = (id: string) => {
    const c = cards.find((x) => x.id === id); if (!c) return;
    const next = Math.min(last, (cfg.approveCol ?? 0) + 1);
    setCards((cs) => cs.map((x) => (x.id === id ? { ...x, col: next } : x)));
    setMsg(`Approved: "${c.title}" moved to ${cols[next]}.`);
    if (notify.includes("approve")) push("WhatsApp", "Your team", `Approved by the ${role === "guest" ? "client" : "manager"}: "${c.title}". Next step: ${cols[next]}.`);
  };
  const requestChanges = (id: string) => {
    const c = cards.find((x) => x.id === id); if (!c) return;
    setCards((cs) => cs.map((x) => (x.id === id ? { ...x, col: Math.max(0, c.col - 1) } : x)));
    setMsg("Changes requested. The item goes back to the team.");
    if (notify.includes("approve")) push("WhatsApp", c.who, `Changes requested on "${c.title}".`);
  };

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
        <div className="mt-2 flex gap-1.5"><Btn onClick={() => approve(c.id)} className="!px-2.5 !py-1 !text-xs">Approve</Btn><Btn variant="ghost" onClick={() => requestChanges(c.id)} className="!px-2.5 !py-1 !text-xs">Request changes</Btn></div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <button type="button" aria-label={`Move "${c.title}" back`} disabled={c.col === 0 || !canMove(c)} onClick={() => setCol(c.id, c.col - 1)} className="rounded-full p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        {canDelete ? <button type="button" aria-label={`Delete "${c.title}"`} onClick={() => setCards((cs) => cs.filter((x) => x.id !== c.id))} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button> : <span />}
        <button type="button" aria-label={`Move "${c.title}" forward`} disabled={c.col === last || !canMove(c)} onClick={() => setCol(c.id, c.col + 1)} className="rounded-full p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </article>
  );

  return (
    <div className="space-y-4">
      <SettingsPanel summary={`${cols.length} columns · ${people.length} people${wip ? ` · WIP limit ${wip}` : ""}`}>
        <ListEditor label="Columns (workflow stages)" items={cols} onChange={setCols} min={2} max={7} placeholder="e.g. QA" help="The last column counts as done." />
        <ListEditor label="People" items={people} onChange={setPeople} min={1} max={6} placeholder="e.g. Kemi" />
        <Select label="Work-in-progress limit per column" value={String(wip)} onChange={(e) => setWip(Number(e.target.value))} options={[["0", "No limit"], ["1", "1 item"], ["2", "2 items"], ["3", "3 items"]]} className="max-w-[260px]" />
        <Toggles label="Notifications" options={NOTIFY} value={notify} onChange={setNotify} />
      </SettingsPanel>
      <RoleBar roles={ROLES} value={role} onChange={(v) => { setRole(v); setMsg(""); }} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={`${cfg.item}s`} value={cards.length} />
        <Stat label={cfg.cols[last]} value={done} />
        <Stat label="Progress" value={`${cards.length ? Math.round((done / cards.length) * 100) : 0}%`} />
        <Stat label="Overdue" value={overdue} hint={overdue ? "Flagged in red" : "On track"} />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={cards.length ? Math.round((done / cards.length) * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress"><div className="h-full bg-[var(--demo-accent)] transition-all" style={{ width: `${cards.length ? (done / cards.length) * 100 : 0}%` }} /></div>

      {canAdd && <Panel title={`New ${cfg.item.toLowerCase()}`}>
        <form onSubmit={(e) => { e.preventDefault(); if (!draft.title.trim()) return; setCards((cs) => [...cs, { id: uid(), title: draft.title.trim(), who: draft.who, due: Number(draft.due), pri: draft.pri, col: 0 }]); if (notify.includes("assign")) push("Email", draft.who, `New ${cfg.item.toLowerCase()} assigned to you: "${draft.title.trim()}", due ${fmtDate(daysFromNow(Number(draft.due)))}.`); setDraft({ ...draft, title: "" }); }} className="grid gap-2 sm:grid-cols-[1fr_150px_130px_110px_auto] sm:items-end">
          <Field label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={70} placeholder={`Describe the ${cfg.item.toLowerCase()}`} />
          <Select label="Assigned to" value={draft.who} onChange={(e) => setDraft({ ...draft, who: e.target.value })} options={cfg.people} />
          <Select label="Due" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} options={[["0", "Today"], ["1", "Tomorrow"], ["3", "In 3 days"], ["7", "Next week"]]} />
          <Select label="Priority" value={draft.pri} onChange={(e) => setDraft({ ...draft, pri: e.target.value as Pri })} options={["High", "Medium", "Low"]} />
          <Btn type="submit" disabled={!draft.title.trim()}><Plus className="h-4 w-4" />Add</Btn>
        </form>
      </Panel>}

      <div className="flex flex-wrap items-end gap-3">
        <Select label="Person" value={who} onChange={(e) => setWho(e.target.value)} options={["Everyone", ...cfg.people, "Unassigned"]} className="w-44" />
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
            <div key={`${ci}-${col}`} role="region" aria-label={col} className="rounded-2xl bg-muted/60 p-2.5">
              <p className="mb-2 px-1 text-xs font-semibold text-foreground">{col} <span className="font-normal text-muted-foreground">({shown.filter((c) => c.col === ci).length}{wip && ci !== last ? `/${wip}` : ""})</span></p>
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
                <td className="p-2.5"><select aria-label={`Status of ${c.title}`} disabled={!canMove(c)} value={c.col} onChange={(e) => setCol(c.id, Number(e.target.value))} className="rounded-lg border border-border bg-background px-2 py-1 text-xs">{cfg.cols.map((s, i) => <option key={`${i}-${s}`} value={i}>{s}</option>)}</select></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {signing && (
        <Panel title="Customer sign-off" actions={<Btn variant="ghost" onClick={() => setSigning(null)}>Cancel</Btn>}>
          <p className="text-sm text-muted-foreground">In the app the customer signs on the technician's phone. Type a name to sign this demo job off.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (!sig.trim()) return; setCards((cs) => cs.map((c) => (c.id === signing ? { ...c, col: cfg.signCol!, signed: sig.trim() } : c))); setSigning(null); setSig(""); setMsg("Job completed with signature. In the live app the office sees it instantly."); if (notify.includes("move")) push("Email", "Office", `Job signed off by ${sig.trim()}.`); }} className="mt-2 flex gap-2">
            <input value={sig} onChange={(e) => setSig(e.target.value)} maxLength={40} placeholder="Customer name" aria-label="Customer name" className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 font-[cursive] text-lg outline-none focus:border-[var(--demo-accent)]" />
            <Btn type="submit" disabled={!sig.trim()}>Sign & complete</Btn>
          </form>
        </Panel>
      )}
      <Outbox items={outbox} onClear={() => setOutbox([])} />
    </div>
  );
}
