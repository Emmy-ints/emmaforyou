import { useState } from "react";
import { AlertTriangle, Check, Search } from "lucide-react";
import { Badge, Btn, Field, ListEditor, Outbox, Panel, Select, SettingsPanel, Toast, Toggles, uid, useDemoSetting, type EngineProps, type OutboxItem } from "./ui";

interface Item { id: string; code: string; title: string; who: string; step: number; driver?: string; exception?: string; proof?: string }
const P: Record<string, { steps: string[]; whoLabel: string; drivers?: string[]; driverLabel?: string; items: [string, string, string, number][] ; finalNeedsProof?: boolean; codeLabel: string }> = {
  orders: { steps: ["Ordered", "Packed", "Shipped", "Out for delivery", "Delivered"], whoLabel: "Customer", codeLabel: "Order number", drivers: ["Warehouse Lagos", "Warehouse Abuja"], driverLabel: "Fulfil from", items: [["#2219", "3 items · $96", "Ada O.", 1], ["#2220", "Wholesale · 40 items", "Prime Mart", 2], ["#2221", "1 item · $35", "Leo P.", 0], ["#2222", "2 items · $58", "Sara K.", 3]] },
  delivery: { steps: ["Order placed", "Driver assigned", "Picked up", "On the way", "Delivered"], whoLabel: "Customer", codeLabel: "Tracking code", drivers: ["Musa (bike)", "Kemi (bike)", "Joe (van)"], driverLabel: "Driver", finalNeedsProof: true, items: [["DLV-301", "2× jollof, 1× chapman", "Ngozi, Lekki Ph1", 0], ["DLV-302", "Pharmacy order", "Mr Bello, Ikoyi", 2], ["DLV-303", "Parcel 4kg", "Kora Fashion, VI", 3]] },
  vendor: { steps: ["PO sent", "Confirmed by supplier", "Invoice uploaded", "Delivered", "Paid"], whoLabel: "Supplier", codeLabel: "PO number", items: [["PO-7781", "Printer paper + toner", "Delta Office Supplies", 2], ["PO-7790", "Steel sheets ×40", "Apex Metals", 1], ["PO-7795", "Cleaning service (Oct)", "SparkleCo", 3]] },
  trip: { steps: ["Booked", "Documents sent", "Flights", "Hotel check-in", "Tours", "Home"], whoLabel: "Traveller", codeLabel: "Booking ref", items: [["TRV-88", "Zanzibar, 6 nights", "The Okafor family", 2], ["TRV-91", "Dubai business trip", "A. Shaw", 1], ["TRV-95", "Cape Town honeymoon", "T & A", 4]] },
};

export default function TrackerDemo(props: EngineProps) {
  const { preset, brand } = props;
  const base = P[preset] ?? P.orders;
  const [steps, setSteps] = useDemoSetting<string[]>(props, "steps", base.steps);
  const [drivers, setDrivers] = useDemoSetting<string[]>(props, "drivers", base.drivers ?? []);
  const [needsProof, setNeedsProof] = useDemoSetting(props, "proof", !!base.finalNeedsProof);
  const [notify, setNotify] = useDemoSetting<string[]>(props, "notify", ["status", "exception"]);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const push = (channel: string, to: string, text: string) => setOutbox((o) => [...o, { id: uid(), channel, to, text }].slice(-30));
  const cfg = { ...base, steps, drivers: base.drivers ? (drivers.length ? drivers : base.drivers) : undefined, finalNeedsProof: needsProof };
  const [rawItems, setItems] = useState<Item[]>(() => base.items.map(([code, title, who, step]) => ({ id: uid(), code, title, who, step, driver: base.drivers?.[0] })));
  const items = rawItems.map((i) => ({ ...i, step: Math.min(i.step, steps.length - 1), driver: cfg.drivers && i.driver && !cfg.drivers.includes(i.driver) ? cfg.drivers[0] : i.driver }));
  const [sel, setSel] = useState(items[0]?.id ?? "");
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<Item | null | undefined>(undefined);
  const [proof, setProof] = useState("");
  const [msg, setMsg] = useState("");
  const cur = items.find((i) => i.id === sel);
  const last = cfg.steps.length - 1;
  const upd = (patch: Partial<Item>) => cur && setItems((is) => is.map((i) => (i.id === cur.id ? { ...i, ...patch } : i)));
  const advance = () => {
    if (!cur) return;
    if (cfg.finalNeedsProof && cur.step === last - 1 && !proof.trim()) { setMsg("Add the recipient's name as proof of delivery first."); return; }
    const nextStep = cfg.steps[Math.min(last, cur.step + 1)];
    upd({ step: Math.min(last, cur.step + 1), proof: cfg.finalNeedsProof && cur.step === last - 1 ? proof.trim() : cur.proof, exception: undefined });
    setMsg(`${cur.code} moved to "${nextStep}".`); setProof("");
    if (notify.includes("status")) push(preset === "vendor" ? "Email" : "SMS + WhatsApp", cur.who, `${cur.code} update: ${nextStep}.${preset === "orders" || preset === "delivery" ? ` Track: ${brand.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbusiness"}.com/track` : ""}`);
  };

  return (
    <div className="space-y-4">
      <SettingsPanel summary={`${steps.length} stages${needsProof ? " · proof required" : ""}`}>
        <ListEditor label="Stages" items={steps} onChange={setSteps} min={2} max={7} placeholder="e.g. Customs cleared" help="The last stage counts as complete." />
        {base.drivers && <ListEditor label={base.driverLabel === "Driver" ? "Drivers" : "Locations"} items={cfg.drivers ?? []} onChange={setDrivers} min={1} max={6} placeholder="New" />}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={needsProof} onChange={(e) => setNeedsProof(e.target.checked)} className="accent-[var(--demo-accent)]" />Require proof (recipient name) before the final stage</label>
        <Toggles label="Notifications" options={[["status", `Update the ${base.whoLabel.toLowerCase()} at every stage`], ["exception", "Alert the team and the customer on exceptions"]]} value={notify} onChange={setNotify} />
      </SettingsPanel>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel title={`${brand} · operations view`}>
          <ul className="space-y-1.5">{items.map((i) => (
            <li key={i.id}><button type="button" onClick={() => setSel(i.id)} aria-pressed={sel === i.id} className={`flex w-full items-center justify-between gap-2 rounded-xl border p-2.5 text-left text-sm ${sel === i.id ? "border-[var(--demo-accent)]" : "border-border"}`}>
              <span><strong>{i.code}</strong> · {i.title}<span className="block text-xs text-muted-foreground">{i.who}</span></span>
              {i.exception ? <Badge tone="bad"><AlertTriangle className="h-3 w-3" />Exception</Badge> : <Badge tone={i.step === last ? "good" : "accent"}>{cfg.steps[i.step]}</Badge>}
            </button></li>))}</ul>
        </Panel>
        {cur && (
          <Panel title={`${cur.code} · ${cur.title}`}>
            <ol className="relative ml-2 border-l-2 border-border pl-5">
              {cfg.steps.map((s, i) => (
                <li key={`${i}-${s}`} className="relative pb-3 last:pb-0">
                  <span className={`absolute -left-[29px] flex h-5 w-5 items-center justify-center rounded-full border-2 ${i <= cur.step ? "border-[var(--demo-accent)] bg-[var(--demo-accent)] text-white" : "border-border bg-background"}`}>{i < cur.step && <Check className="h-3 w-3" />}</span>
                  <p className={`text-sm ${i === cur.step ? "font-semibold text-foreground" : i < cur.step ? "text-foreground" : "text-muted-foreground"}`}>{s}</p>
                  {i === last && cur.proof && <p className="text-xs text-emerald-600">Received by {cur.proof} · photo attached</p>}
                </li>
              ))}
            </ol>
            {cfg.drivers && <Select label={cfg.driverLabel ?? "Assigned"} value={cur.driver} onChange={(e) => upd({ driver: e.target.value })} options={cfg.drivers} className="mt-3 max-w-xs" />}
            {cfg.finalNeedsProof && cur.step === last - 1 && <Field label="Proof of delivery: recipient name" value={proof} onChange={(e) => setProof(e.target.value)} maxLength={40} className="mt-3 max-w-xs" />}
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn onClick={advance} disabled={cur.step === last}>Mark "{cfg.steps[Math.min(last, cur.step + 1)]}"</Btn>
              <Btn variant="danger" onClick={() => { const ex = preset === "vendor" ? "Invoice amount doesn't match PO" : preset === "trip" ? "Flight delayed 3 hours" : "Customer not reachable"; upd({ exception: ex }); setMsg("Exception raised and a follow-up task created."); if (notify.includes("exception")) { push("Slack", "Operations team", `Exception on ${cur.code}: ${ex}.`); push("SMS", cur.who, `We're sorry, there's an issue with ${cur.code}: ${ex}. We'll update you shortly.`); } }}>Raise exception</Btn>
            </div>
            {cur.exception && <p className="mt-2 text-sm text-red-600">⚠ {cur.exception}</p>}
          </Panel>
        )}
      </div>
      {msg && <Toast>{msg}</Toast>}
      <Panel title={`Customer view: track by ${cfg.codeLabel.toLowerCase()}`}>
        <form onSubmit={(e) => { e.preventDefault(); setFound(items.find((i) => i.code.toLowerCase() === lookup.trim().toLowerCase()) ?? null); }} className="flex max-w-md items-end gap-2"><Field label={`${cfg.codeLabel} (try ${items[0]?.code})`} value={lookup} onChange={(e) => setLookup(e.target.value)} className="flex-1" /><Btn type="submit"><Search className="h-4 w-4" />Track</Btn></form>
        {found === null && <p className="mt-2 text-sm text-red-600">We couldn't find that {cfg.codeLabel.toLowerCase()}.</p>}
        {found && <p className="mt-2 text-sm">Status: <strong>{cfg.steps[items.find((i) => i.id === found.id)?.step ?? found.step]}</strong>{found.driver && cfg.driverLabel === "Driver" ? ` · ${items.find((i) => i.id === found.id)?.driver ?? found.driver}` : ""}</p>}
      </Panel>
      <Outbox items={outbox} onClear={() => setOutbox([])} />
    </div>
  );
}
