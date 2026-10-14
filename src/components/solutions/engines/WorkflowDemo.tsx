import { useState } from "react";
import { Check, Clock, PlayCircle, ShieldCheck, X, Zap } from "lucide-react";
import { Badge, Btn, Panel, Select, SettingsPanel, useDemoSetting, type EngineProps } from "./ui";

type Ev = Record<string, string | number>;
interface Step { id: string; kind: "action" | "condition" | "wait" | "approval"; label: string; on: boolean; field?: string; op?: ">" | "<" | "=" | "contains"; value?: number | string; editable?: "number" | "text"; hours?: number; elseStop?: boolean }
interface Flow { trigger: string; events: [string, Ev][]; steps: Omit<Step, "on">[] }

const F: Record<string, Flow> = {
  nurture: { trigger: "New lead from website form", events: [["Ada — clinic, wants bookings, budget $800", { name: "Ada", industry: "Clinic", budget: 800 }], ["Ben — student, just browsing, budget $0", { name: "Ben", industry: "Other", budget: 0 }]], steps: [
    { id: "a", kind: "action", label: "Add contact to CRM with source = website" }, { id: "b", kind: "action", label: "Send welcome email + WhatsApp" },
    { id: "c", kind: "condition", label: "Budget is above", field: "budget", op: ">", value: 300, editable: "number" }, { id: "d", kind: "action", label: "Alert sales on WhatsApp: hot lead" },
    { id: "e", kind: "wait", label: "Wait", hours: 48 }, { id: "f", kind: "action", label: "Send case study matching their industry" }] },
  outreach: { trigger: "Prospect added to sequence", events: [["Prospect replies after email 1", { name: "Kora Fashion", replied: 1 }], ["Prospect never replies", { name: "Delta Foods", replied: 0 }]], steps: [
    { id: "a", kind: "action", label: "Send personalised email 1" }, { id: "b", kind: "wait", label: "Wait", hours: 72 },
    { id: "c", kind: "condition", label: "Stop if prospect replied (replied =", field: "replied", op: "=", value: 0, elseStop: true }, { id: "d", kind: "action", label: "Send follow-up email 2" },
    { id: "e", kind: "wait", label: "Wait", hours: 96 }, { id: "f", kind: "action", label: "Create call task for rep" }] },
  signature: { trigger: "Contract ready to sign", events: [["Employment contract — Grace N.", { doc: "Employment contract", value: 0 }], ["Supplier agreement — $25,000", { doc: "Supplier agreement", value: 25000 }]], steps: [
    { id: "a", kind: "condition", label: "Needs director countersign if value above", field: "value", op: ">", value: 10000, editable: "number" }, { id: "b", kind: "approval", label: "Director approves sending" },
    { id: "c", kind: "action", label: "Send signing link (email + SMS code verification)" }, { id: "d", kind: "wait", label: "Wait for signature", hours: 24 },
    { id: "e", kind: "action", label: "Store signed PDF with timestamp and audit trail" }, { id: "f", kind: "action", label: "Email copies to all parties" }] },
  approval: { trigger: "Purchase request submitted", events: [["Laptop — $1,450 (IT)", { item: "Laptop", amount: 1450 }], ["Office snacks — $120", { item: "Snacks", amount: 120 }], ["New van — $28,000", { item: "Van", amount: 28000 }]], steps: [
    { id: "a", kind: "approval", label: "Line manager approves" }, { id: "b", kind: "condition", label: "Finance approval if amount above", field: "amount", op: ">", value: 500, editable: "number" },
    { id: "c", kind: "approval", label: "Finance approves" }, { id: "d", kind: "action", label: "Create purchase order and notify supplier" }, { id: "e", kind: "action", label: "Log decision in audit trail" }] },
  agent: { trigger: "Email arrives in support@ inbox", events: [["\"Please cancel my order #1042\"", { intent: "cancel", order: 1042, value: 85 }], ["\"Do you ship to Ghana?\"", { intent: "question", value: 0 }], ["\"Refund my $600 order now\"", { intent: "refund", value: 600 }]], steps: [
    { id: "a", kind: "action", label: "Classify intent and extract order number" }, { id: "b", kind: "condition", label: "Is a question (answer from knowledge base)", field: "intent", op: "=", value: "question" },
    { id: "c", kind: "action", label: "Reply with answer + source link" }, { id: "d", kind: "condition", label: "Needs human approval if value above", field: "value", op: ">", value: 200, editable: "number" },
    { id: "e", kind: "approval", label: "Supervisor approves refund/cancellation" }, { id: "f", kind: "action", label: "Update order system and confirm to customer" }, { id: "g", kind: "action", label: "Log every action and outcome" }] },
  cart: { trigger: "Cart abandoned for 1 hour", events: [["Returning customer, cart $180", { cart: 180, returning: 1 }], ["First-time visitor, cart $35", { cart: 35, returning: 0 }]], steps: [
    { id: "a", kind: "action", label: "Send reminder email with cart contents" }, { id: "b", kind: "wait", label: "Wait", hours: 24 },
    { id: "c", kind: "condition", label: "Offer discount only if cart above", field: "cart", op: ">", value: 100, editable: "number" }, { id: "d", kind: "action", label: "Send WhatsApp with 5% code (max once per customer)" }, { id: "e", kind: "action", label: "Stop when they check out" }] },
  governance: { trigger: "AI agent wants to take an action", events: [["Update a CRM note", { action: "crm_note", risk: 1, cost: 0.01 }], ["Send an email to 500 customers", { action: "bulk_email", risk: 3, cost: 0.4 }], ["Issue a $300 refund", { action: "refund", risk: 3, cost: 0.02 }]], steps: [
    { id: "a", kind: "condition", label: "Action is on the allow-list (risk ≤", field: "risk", op: "<", value: 4, editable: "number", elseStop: true }, { id: "b", kind: "condition", label: "Within daily AI budget (cost <", field: "cost", op: "<", value: 1, editable: "number", elseStop: true },
    { id: "c", kind: "condition", label: "Human approval required if risk ≥", field: "risk", op: ">", value: 2, editable: "number" }, { id: "d", kind: "approval", label: "Human approves" }, { id: "e", kind: "action", label: "Execute action" }, { id: "f", kind: "action", label: "Write audit log (who, what, inputs, outcome)" }] },
  crm: { trigger: "Lead arrives (form, WhatsApp, Meta ad)", events: [["Meta lead ad — Lagos — real estate", { source: "Meta", city: "Lagos", value: 5000 }], ["WhatsApp — duplicate of existing contact", { source: "WhatsApp", city: "Abuja", dup: 1, value: 800 }]], steps: [
    { id: "a", kind: "condition", label: "Skip if already in CRM (duplicate =", field: "dup", op: "=", value: 0, elseStop: true }, { id: "b", kind: "action", label: "Create contact + deal with source tag" },
    { id: "c", kind: "action", label: "Assign owner by city" }, { id: "d", kind: "action", label: "Create follow-up task due in 1 hour" }, { id: "e", kind: "action", label: "Notify owner on WhatsApp" }] },
  routing: { trigger: "New enquiry", events: [["Abuja — property sale — $250k", { city: "Abuja", value: 250000 }], ["Lagos — rental — $2k", { city: "Lagos", value: 2000 }]], steps: [
    { id: "a", kind: "condition", label: "Senior agent if value above", field: "value", op: ">", value: 100000, editable: "number" }, { id: "b", kind: "action", label: "Assign to senior agent (round robin)" },
    { id: "c", kind: "action", label: "Notify the branch team in the lead's city" }, { id: "d", kind: "wait", label: "Wait for first contact", hours: 0.25 }, { id: "e", kind: "action", label: "Escalate to manager if not contacted" }] },
  reminders: { trigger: "Appointment booked", events: [["Check-up tomorrow 10:00", { hoursAway: 20 }], ["Whitening next week", { hoursAway: 170 }]], steps: [
    { id: "a", kind: "action", label: "Send confirmation (WhatsApp + email)" }, { id: "b", kind: "condition", label: "Send 24h reminder if more than 24h away (hours >", field: "hoursAway", op: ">", value: 24 },
    { id: "c", kind: "action", label: "Reminder 24 hours before, with reschedule link" }, { id: "d", kind: "action", label: "Reminder 2 hours before" }, { id: "e", kind: "action", label: "After visit: thank-you + review request" }] },
  payments: { trigger: "Payment webhook received", events: [["Paystack: ₦45,000 success for INV-1042", { status: "success", amount: 45000 }], ["Stripe: $120 failed (card declined)", { status: "failed", amount: 120 }]], steps: [
    { id: "a", kind: "condition", label: "Payment succeeded (status =", field: "status", op: "=", value: "success" }, { id: "b", kind: "action", label: "Mark invoice paid, release order, post to accounting, send receipt" },
    { id: "c", kind: "condition", label: "Payment failed (status =", field: "status", op: "=", value: "failed" }, { id: "d", kind: "action", label: "Schedule retry in 3 days and send the customer a payment link" }, { id: "e", kind: "action", label: "Record the event in the payment log" }] },
  integration: { trigger: "New order in online store", events: [["Order #2219 — 3 items — $96", { items: 3, total: 96 }], ["Order #2220 — 40 items — $2,400 (wholesale)", { items: 40, total: 2400 }]], steps: [
    { id: "a", kind: "action", label: "Map order fields to accounting format" }, { id: "b", kind: "action", label: "Create sales invoice in accounting" },
    { id: "c", kind: "action", label: "Reduce stock in inventory system" }, { id: "d", kind: "condition", label: "Flag for review if total above", field: "total", op: ">", value: 1000, editable: "number" }, { id: "e", kind: "approval", label: "Manager reviews large order" }, { id: "f", kind: "action", label: "Send shipping label request to courier" }] },
};

interface LogLine { t: number; text: string; tone: "good" | "warn" | "bad" | "neutral" | "accent" }

export default function WorkflowDemo(props: EngineProps) {
  const { preset } = props;
  const flow = F[preset] ?? F.nurture;
  const [steps, setSteps] = useDemoSetting<Step[]>(props, "steps", flow.steps.map((s) => ({ ...s, on: true })));
  const [retries, setRetries] = useDemoSetting(props, "retries", 2);
  const [alertTo, setAlertTo] = useDemoSetting(props, "alertTo", "Email to the ops team");
  const [failAt, setFailAt] = useState("");
  const [ev, setEv] = useState(0);
  // A custom test event: start from the selected sample and edit its values.
  const [custom, setCustom] = useState<Ev | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const [pending, setPending] = useState<{ index: number; t: number } | null>(null);
  const [runs, setRuns] = useState(0);

  const test = (s: Step, e: Ev) => {
    const v = e[s.field ?? ""] ?? (s.op === "=" && typeof s.value === "number" ? 0 : "");
    if (s.op === ">") return Number(v) > Number(s.value);
    if (s.op === "<") return Number(v) < Number(s.value);
    if (s.op === "contains") return String(v).includes(String(s.value));
    return String(v) === String(s.value);
  };

  const run = (from = 0, t0 = 0, prev: LogLine[] = []) => {
    const e = custom ?? flow.events[ev][1];
    const out = [...prev];
    if (from === 0) out.push({ t: 0, text: `Trigger: ${flow.trigger} — ${custom ? `custom event ${JSON.stringify(custom)}` : flow.events[ev][0]}`, tone: "accent" });
    let t = t0;
    for (let i = from; i < steps.length; i++) {
      const s = steps[i];
      if (!s.on) { out.push({ t, text: `Skipped (disabled): ${s.label}`, tone: "neutral" }); continue; }
      if (s.kind === "wait") { t += (s.hours ?? 1) * 60; out.push({ t, text: `Waited ${s.hours! >= 1 ? `${s.hours} h` : `${Math.round((s.hours ?? 0) * 60)} min`}`, tone: "neutral" }); continue; }
      if (s.kind === "approval") { out.push({ t, text: `Paused: ${s.label}`, tone: "warn" }); setLog(out); setPending({ index: i, t }); return; }
      if (s.kind === "condition") {
        const ok = test(s, e);
        out.push({ t, text: `Check: ${s.label} ${s.value} → ${ok ? "yes" : "no"}`, tone: ok ? "good" : "warn" });
        if (!ok) {
          if (s.elseStop) { out.push({ t, text: "Stopped: condition not met.", tone: "bad" }); break; }
          // Skip the step that depends on this condition.
          if (steps[i + 1]) { out.push({ t, text: `Skipped: ${steps[i + 1].label}`, tone: "neutral" }); i++; }
        }
        continue;
      }
      if (failAt === s.id) {
        // Simulated outage of the connected app: retry with backoff, then alert and stop.
        for (let r = 1; r <= retries; r++) { t += 2 ** r; out.push({ t, text: `Error: ${s.label} failed (connected app returned 503). Retry ${r}/${retries} in ${2 ** r} min…`, tone: "warn" }); }
        out.push({ t, text: `Failed after ${retries} retr${retries === 1 ? "y" : "ies"}. Alert sent: ${alertTo} (simulated). Run paused for manual fix.`, tone: "bad" });
        out.push({ t, text: "Stopped: step failed.", tone: "bad" });
        break;
      }
      t += 1; out.push({ t, text: `Done: ${s.label}`, tone: "good" });
    }
    if (!out.some((l) => l.text.startsWith("Stopped"))) out.push({ t, text: "Workflow complete ✓", tone: "accent" });
    setLog(out); setPending(null); setRuns((r) => r + (from === 0 ? 1 : 0));
  };
  const decide = (yes: boolean) => {
    if (!pending) return;
    const l = [...log, { t: pending.t + 30, text: yes ? `Approved by a person: ${steps[pending.index].label}` : "Rejected by a person. Workflow stopped and requester notified.", tone: yes ? "good" as const : "bad" as const }];
    if (yes) run(pending.index + 1, pending.t + 30, l); else { setLog(l); setPending(null); }
  };
  const fmtT = (m: number) => (m < 60 ? `+${Math.round(m)}m` : m < 1440 ? `+${(m / 60).toFixed(m % 60 ? 1 : 0)}h` : `+${(m / 1440).toFixed(1)}d`);
  const icon = (k: Step["kind"]) => (k === "action" ? <Zap className="h-4 w-4" /> : k === "wait" ? <Clock className="h-4 w-4" /> : k === "approval" ? <ShieldCheck className="h-4 w-4" /> : <span className="text-xs font-bold">IF</span>);

  const fields = Object.keys(flow.events[ev][1]);
  return (
    <div className="space-y-4">
    <SettingsPanel summary={`${retries} retries · alerts: ${alertTo}`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select label="Retries when a connected app fails" value={String(retries)} onChange={(e) => setRetries(Number(e.target.value))} options={[["0", "No retries"], ["1", "1 retry"], ["2", "2 retries"], ["3", "3 retries"]]} />
        <Select label="Failure alerts go to" value={alertTo} onChange={(e) => setAlertTo(e.target.value)} options={["Email to the ops team", "WhatsApp to the owner", "Slack #alerts"]} />
        <Select label="Simulate an outage at step" value={failAt} onChange={(e) => setFailAt(e.target.value)} options={[["", "No outage"], ...steps.filter((x) => x.kind === "action").map((x) => [x.id, x.label.slice(0, 40)] as [string, string])]} />
      </div>
      <p className="text-[11px] text-muted-foreground">Step values, waits and on/off switches (in the workflow below) are saved in this browser. Reset demo restores them.</p>
    </SettingsPanel>
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Panel title="Workflow" actions={<Badge tone="accent">{runs} test run{runs === 1 ? "" : "s"}</Badge>}>
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--demo-accent)_10%,transparent)] px-3 py-2 text-sm font-semibold"><Zap className="h-4 w-4 text-[var(--demo-accent)]" />When: {flow.trigger}</p>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.id} className={`flex items-start gap-2 rounded-xl border p-2.5 text-sm ${s.on ? "border-border" : "border-dashed border-border opacity-50"} ${pending?.index === i ? "ring-2 ring-amber-500" : ""}`}>
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.kind === "approval" ? "bg-amber-500/15 text-amber-600" : s.kind === "condition" ? "bg-sky-500/15 text-sky-600" : s.kind === "wait" ? "bg-muted text-muted-foreground" : "bg-[color-mix(in_srgb,var(--demo-accent)_14%,transparent)] text-[var(--demo-accent)]"}`}>{icon(s.kind)}</span>
              <div className="flex-1">
                <p className="text-foreground">{s.label}{s.kind === "condition" && !s.editable ? ` ${s.value}` : ""}{s.kind === "condition" && s.label.includes("(") ? ")" : ""}</p>
                {s.kind === "condition" && s.editable && <input aria-label={`Value for: ${s.label}`} type="number" value={String(s.value)} onChange={(e) => setSteps((ss) => ss.map((x) => (x.id === s.id ? { ...x, value: Number(e.target.value) } : x)))} className="mt-1 w-28 rounded-md border border-border bg-background px-2 py-0.5 text-sm" />}
                {s.kind === "wait" && <select aria-label="Wait time" value={s.hours} onChange={(e) => setSteps((ss) => ss.map((x) => (x.id === s.id ? { ...x, hours: Number(e.target.value) } : x)))} className="mt-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs">{[0.25, 1, 24, 48, 72, 96, 168].map((h) => <option key={h} value={h}>{h < 1 ? `${h * 60} minutes` : h < 24 ? `${h} hour` : `${h / 24} day${h > 24 ? "s" : ""}`}</option>)}{![0.25, 1, 24, 48, 72, 96, 168].includes(s.hours ?? 0) && <option value={s.hours}>{s.hours} h</option>}</select>}
              </div>
              <label className="flex items-center gap-1 text-[11px] text-muted-foreground"><input type="checkbox" checked={s.on} onChange={(e) => setSteps((ss) => ss.map((x) => (x.id === s.id ? { ...x, on: e.target.checked } : x)))} className="accent-[var(--demo-accent)]" />On</label>
            </li>
          ))}
        </ol>
      </Panel>
      <div className="space-y-4">
        <Panel title="Test it">
          <Select label="Sample event" value={String(ev)} onChange={(e) => { setEv(Number(e.target.value)); setCustom(null); setLog([]); setPending(null); }} options={flow.events.map(([l], i) => [String(i), l] as [string, string])} />
          <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={!!custom} onChange={(e) => setCustom(e.target.checked ? { ...flow.events[ev][1] } : null)} className="accent-[var(--demo-accent)]" />Edit the event values</label>
          {custom && <div className="mt-2 grid grid-cols-2 gap-2">{fields.map((k) => (
            <label key={k} className="text-xs text-muted-foreground">{k}<input aria-label={`Event ${k}`} value={String(custom[k] ?? "")} onChange={(e) => setCustom({ ...custom, [k]: typeof flow.events[ev][1][k] === "number" ? Number(e.target.value) || 0 : e.target.value })} className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground" /></label>
          ))}</div>}
          <Btn className="mt-3" onClick={() => run()} disabled={!!pending}><PlayCircle className="h-4 w-4" />Run test</Btn>
        </Panel>
        <Panel title="Run log">
          {log.length === 0 ? <p className="text-sm text-muted-foreground">Run a test to see each step, decision and timing.</p> : (
            <ol className="space-y-1.5 font-mono text-xs" aria-live="polite">{log.map((l, i) => <li key={i} className="flex gap-2"><span className="w-12 shrink-0 text-muted-foreground">{fmtT(l.t)}</span><span className={l.tone === "good" ? "text-emerald-600" : l.tone === "bad" ? "text-red-600" : l.tone === "warn" ? "text-amber-600" : l.tone === "accent" ? "text-[var(--demo-accent)]" : "text-muted-foreground"}>{l.text}</span></li>)}</ol>
          )}
          {pending && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-sm"><ShieldCheck className="h-4 w-4 text-amber-600" />Waiting for approval<Btn onClick={() => decide(true)}><Check className="h-4 w-4" />Approve</Btn><Btn variant="danger" onClick={() => decide(false)}><X className="h-4 w-4" />Reject</Btn></div>}
        </Panel>
      </div>
    </div>
    </div>
  );
}
