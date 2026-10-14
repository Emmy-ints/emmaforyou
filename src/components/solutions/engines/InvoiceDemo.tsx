import { useEffect, useState } from "react";
import { Check, Download, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Badge, Btn, Field, Outbox, Panel, RoleBar, RowsEditor, Select, SettingsPanel, Toast, Toggles, daysFromNow, fmtDate, money, uid, useDemoSetting, type EngineProps, type OutboxItem } from "./ui";

interface Line { id: string; desc: string; qty: number; price: number }
interface CatItem { id: string; name: string; price: number }
const CATALOG: CatItem[] = [["Website design (5 pages)", 1200], ["AI chat assistant setup", 900], ["Monthly SEO", 400], ["Product photography (day)", 650], ["Hosting (12 months)", 180], ["Training session", 250]].map(([name, price], i) => ({ id: `c${i}`, name: String(name), price: Number(price) }));
const NOTIFY: [string, string][] = [["send", "Email + WhatsApp link to the client when sent"], ["remind", "Automatic payment / follow-up reminders"], ["receipt", "Receipt or signed copy to both parties"]];

const PRESET: Record<string, { title: string; client: string; lines: [string, number, number][]; tax: number; discount: number; cur: string }> = {
  invoice: { title: "Invoice", client: "Bloom Dental Ltd", lines: [["Website design (5 pages)", 1, 1200], ["Hosting (12 months)", 1, 180], ["Training session", 2, 250]], tax: 7.5, discount: 0, cur: "USD" },
  quote: { title: "Quote", client: "Northwind Logistics", lines: [["AI chat assistant setup", 1, 900], ["Monthly SEO", 3, 400]], tax: 7.5, discount: 10, cur: "USD" },
  proposal: { title: "Proposal", client: "Kora Fashion", lines: [["Website design (5 pages)", 1, 1200], ["Product photography (day)", 1, 650]], tax: 0, discount: 0, cur: "USD" },
};
const TIERS = [{ name: "Essential", mult: 1, note: "Core scope" }, { name: "Recommended", mult: 1.35, note: "+ AI chat & training" }, { name: "Premium", mult: 1.8, note: "+ 3 months support" }];

export default function InvoiceDemo(props: EngineProps) {
  const { preset, brand } = props;
  const cfg = PRESET[preset] ?? PRESET.invoice;
  const [catalog, setCatalog] = useDemoSetting<CatItem[]>(props, "catalog", CATALOG);
  const [limit, setLimit] = useDemoSetting(props, "approvalLimit", 15);
  const [terms, setTerms] = useDemoSetting(props, "terms", 14);
  const [prefix, setPrefix] = useDemoSetting(props, "prefix", cfg.title.slice(0, 3).toUpperCase());
  const [defaultTax, setDefaultTax] = useDemoSetting(props, "tax", cfg.tax);
  const [notify, setNotify] = useDemoSetting<string[]>(props, "notify", ["send", "remind", "receipt"]);
  const [role, setRole] = useDemoSetting(props, "role", "rep");
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const push = (channel: string, to: string, text: string) => setOutbox((o) => [...o, { id: uid(), channel, to, text }].slice(-30));
  const [client, setClient] = useState(cfg.client);
  const [lines, setLines] = useState<Line[]>(() => cfg.lines.map(([desc, qty, price]) => ({ id: uid(), desc, qty, price })));
  const [tax, setTax] = useState(defaultTax);
  useEffect(() => { setTax(defaultTax); }, [defaultTax]);
  const [discount, setDiscount] = useState(cfg.discount);
  const [cur, setCur] = useState(props.currency || cfg.cur);
  useEffect(() => { if (props.currency) setCur(props.currency); }, [props.currency]);
  const [status, setStatus] = useState<"Draft" | "Sent" | "Viewed" | "Paid" | "Accepted">("Draft");
  const [tier, setTier] = useState(1);
  const [signer, setSigner] = useState("");
  const [approved, setApproved] = useState(false);
  const [msg, setMsg] = useState("");

  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0) * (preset === "proposal" ? TIERS[tier].mult : 1);
  const disc = subtotal * (discount / 100);
  const taxAmt = (subtotal - disc) * (tax / 100);
  const total = subtotal - disc + taxAmt;
  const needsApproval = preset === "quote" && discount > limit && !approved;
  const number = `${(prefix || "DOC").toUpperCase()}-${new Date().getFullYear()}-0042`;
  const upd = (id: string, k: keyof Line, v: string) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, [k]: k === "desc" ? v : Math.max(0, Number(v) || 0) } : l)));

  const send = () => {
    if (needsApproval) { setMsg(`Discounts above ${limit}% need manager approval before the quote can be sent.`); return; }
    setStatus("Sent"); setMsg(`${cfg.title} ${number} marked as sent.`);
    if (notify.includes("send")) push("Email + WhatsApp", client || "Client", `${brand} sent you ${cfg.title.toLowerCase()} ${number} for ${money(total, cur)}. ${preset === "invoice" ? `Due ${fmtDate(daysFromNow(terms))}.` : "View and accept online."}`);
    if (notify.includes("remind")) {
      if (preset === "invoice") { push("Scheduled · Email", client || "Client", `Friendly reminder: ${number} is due ${fmtDate(daysFromNow(terms))}.`); push("Scheduled · WhatsApp", client || "Client", `${number} is now overdue (due ${fmtDate(daysFromNow(terms))}). Pay online: [link].`); }
      else push("Scheduled · Email", client || "Client", `Following up on ${cfg.title.toLowerCase()} ${number}: any questions before you decide?`);
    }
  };
  const ROLES = [
    { id: "rep", label: "Sales / accounts", can: `Creates and sends documents. Discounts above ${limit}% need a manager.` },
    { id: "manager", label: "Manager", can: "Everything, plus approving large discounts and recording payments." },
  ];

  return (
    <div className="space-y-4">
    <SettingsPanel summary={`Prefix ${prefix} · ${preset === "invoice" ? `due in ${terms} days` : `approval above ${limit}%`}`}>
      <RowsEditor<CatItem> label="Products and services catalogue" rows={catalog} onChange={setCatalog} max={12} cols={[{ key: "name", label: "Item", type: "text" }, { key: "price", label: `Price (${cur})`, type: "number", min: 0, step: 1, width: "24%" }]} make={() => ({ id: uid(), name: "New service", price: 100 })} help='Used by "+ Add from catalogue".' />
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Number prefix" value={prefix} maxLength={6} onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
        <Field label="Default tax / VAT %" type="number" min={0} max={50} step={0.5} value={defaultTax} onChange={(e) => setDefaultTax(Math.min(50, Math.max(0, Number(e.target.value) || 0)))} />
        <Select label={preset === "invoice" ? "Payment terms" : "Valid for"} value={String(terms)} onChange={(e) => setTerms(Number(e.target.value))} options={[["7", "7 days"], ["14", "14 days"], ["30", "30 days"]]} />
        {preset === "quote" && <Field label="Discount needing approval (%)" type="number" min={0} max={100} value={limit} onChange={(e) => { setLimit(Math.min(100, Math.max(0, Number(e.target.value) || 0))); setApproved(false); }} />}
      </div>
      <Toggles label="Notifications" options={NOTIFY} value={notify} onChange={setNotify} />
    </SettingsPanel>
    <RoleBar roles={ROLES} value={role} onChange={setRole} />
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <Panel title="Details">
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Client" value={client} onChange={(e) => setClient(e.target.value)} maxLength={60} className="sm:col-span-2" />
            <Select label="Currency" value={cur} onChange={(e) => setCur(e.target.value)} options={[...new Set(["USD", "NGN", "EUR", "GBP", "GHS", "KES", "ZAR", cur])]} />
            <Field label="Discount %" type="number" min={0} max={100} value={discount} onChange={(e) => { setDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0))); setApproved(false); }} />
            <Field label="Tax / VAT %" type="number" min={0} max={50} step={0.5} value={tax} onChange={(e) => setTax(Math.min(50, Math.max(0, Number(e.target.value) || 0)))} />
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} options={preset === "invoice" ? ["Draft", "Sent", "Viewed", "Paid"] : ["Draft", "Sent", "Viewed", "Accepted"]} />
          </div>
        </Panel>
        <Panel title="Line items" actions={<Select label="" aria-label="Add from catalogue" value="" onChange={(e) => { const c = catalog.find((x) => x.id === e.target.value); if (c) setLines((ls) => [...ls, { id: uid(), desc: c.name, qty: 1, price: c.price }]); }} options={[["", "+ Add from catalogue"], ...catalog.map((x) => [x.id, `${x.name} (${money(x.price, cur)})`] as [string, string])]} className="w-56" />}>
          <ul className="space-y-2">
            {lines.map((l) => (
              <li key={l.id} className="grid grid-cols-[1fr_56px_86px_28px] items-center gap-1.5">
                <input aria-label="Description" value={l.desc} onChange={(e) => upd(l.id, "desc", e.target.value)} maxLength={80} className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-[var(--demo-accent)]" />
                <input aria-label="Quantity" type="number" min={0} value={l.qty} onChange={(e) => upd(l.id, "qty", e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-[var(--demo-accent)]" />
                <input aria-label="Unit price" type="number" min={0} value={l.price} onChange={(e) => upd(l.id, "price", e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-[var(--demo-accent)]" />
                <button type="button" aria-label={`Remove ${l.desc}`} onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))} className="rounded-full p-1 text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          <Btn variant="soft" className="mt-2" onClick={() => setLines((ls) => [...ls, { id: uid(), desc: "New item", qty: 1, price: 100 }])}><Plus className="h-4 w-4" />Blank line</Btn>
        </Panel>
        {preset === "proposal" && (
          <Panel title="Package options (client chooses)">
            <div className="grid gap-2 sm:grid-cols-3">{TIERS.map((t, i) => <button key={t.name} type="button" aria-pressed={tier === i} onClick={() => setTier(i)} className={`rounded-xl border p-3 text-left text-sm ${tier === i ? "border-[var(--demo-accent)] bg-[color-mix(in_srgb,var(--demo-accent)_8%,transparent)]" : "border-border"}`}><strong>{t.name}</strong><span className="block text-xs text-muted-foreground">{t.note}</span><span className="mt-1 block font-semibold">{money(lines.reduce((s, l) => s + l.qty * l.price, 0) * t.mult, cur)}</span></button>)}</div>
          </Panel>
        )}
        {needsApproval && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm"><ShieldAlert className="h-4 w-4 text-amber-600" />Discount over {limit}% needs approval.{role === "manager" ? <Btn variant="ghost" onClick={() => { setApproved(true); setMsg("Discount approved by manager (logged)."); }}>Approve as manager</Btn> : <span className="text-xs text-muted-foreground">Switch to Manager to approve.</span>}</div>
        )}
        <div className="flex flex-wrap gap-2">
          <Btn onClick={send} disabled={!lines.length}>Send {cfg.title.toLowerCase()}</Btn>
          {preset === "invoice" && <Btn variant="ghost" disabled={role !== "manager" || status === "Paid"} title={role !== "manager" ? "Manager only" : undefined} onClick={() => { setStatus("Paid"); setMsg("Payment recorded and receipt generated."); if (notify.includes("receipt")) push("Email", client || "Client", `Receipt for ${number}: ${money(total, cur)} received. Thank you!`); }}>Record payment</Btn>}
          <Btn variant="ghost" onClick={() => window.print()}><Download className="h-4 w-4" />Print / PDF</Btn>
        </div>
        {msg && <Toast>{msg}</Toast>}
      </div>

      <article className="print-area rounded-2xl border border-border bg-white p-6 text-[13px] text-slate-800 shadow-sm" aria-label={`${cfg.title} preview`}>
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-lg font-bold" style={{ color: "var(--demo-accent)" }}>{brand}</p><p className="text-slate-500">hello@{brand.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbusiness"}.com</p></div>
          <div className="text-right"><p className="text-xl font-semibold uppercase tracking-wide">{cfg.title}</p><p className="text-slate-500">{number}</p><span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: status === "Paid" || status === "Accepted" ? "#d1fae5" : "#f1f5f9", color: status === "Paid" || status === "Accepted" ? "#047857" : "#475569" }}>{status}</span></div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-slate-600"><div><p className="text-[11px] uppercase text-slate-400">For</p><p className="font-semibold text-slate-800">{client || "—"}</p></div><div className="text-right"><p className="text-[11px] uppercase text-slate-400">{preset === "invoice" ? "Due" : "Valid until"}</p><p className="font-semibold text-slate-800">{fmtDate(daysFromNow(terms))}</p></div></div>
        <table className="mt-5 w-full text-left">
          <thead><tr className="border-b border-slate-200 text-[11px] uppercase text-slate-400"><th className="py-1.5">Item</th><th className="py-1.5 text-right">Qty</th><th className="py-1.5 text-right">Price</th><th className="py-1.5 text-right">Amount</th></tr></thead>
          <tbody>{lines.map((l) => { const p = l.price * (preset === "proposal" ? TIERS[tier].mult : 1); return <tr key={l.id} className="border-b border-slate-100"><td className="py-1.5">{l.desc}</td><td className="py-1.5 text-right">{l.qty}</td><td className="py-1.5 text-right">{money(p, cur)}</td><td className="py-1.5 text-right">{money(p * l.qty, cur)}</td></tr>; })}</tbody>
        </table>
        <dl className="ml-auto mt-4 w-56 space-y-1">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal, cur)}</dd></div>
          {discount > 0 && <div className="flex justify-between text-slate-500"><dt>Discount ({discount}%)</dt><dd>−{money(disc, cur)}</dd></div>}
          {tax > 0 && <div className="flex justify-between text-slate-500"><dt>Tax ({tax}%)</dt><dd>{money(taxAmt, cur)}</dd></div>}
          <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold"><dt>Total</dt><dd>{money(total, cur)}</dd></div>
        </dl>
        {preset !== "invoice" && (
          <div className="no-print mt-6 rounded-xl border border-slate-200 p-3">
            {status === "Accepted" ? <p className="flex items-center gap-1.5 font-semibold text-emerald-700"><Check className="h-4 w-4" />Accepted and signed by {signer || client}</p> : (
              <form onSubmit={(e) => { e.preventDefault(); if (!signer.trim()) return; setStatus("Accepted"); setMsg("Signed electronically (demo). In the live system the signature is timestamped and logged."); if (notify.includes("receipt")) push("Email", `${client || "Client"} and ${brand}`, `Signed copy of ${number}, accepted by ${signer.trim()}.`); }} className="flex flex-wrap items-end gap-2">
                <label className="flex-1 text-[11px] uppercase text-slate-400">Client signature (type your name)<input value={signer} onChange={(e) => setSigner(e.target.value)} maxLength={40} className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1 font-[cursive] text-base text-slate-800" /></label>
                <button type="submit" disabled={!signer.trim() || needsApproval} className="rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40" style={{ background: "var(--demo-accent)" }}>Accept & sign</button>
              </form>
            )}
          </div>
        )}
        {preset === "invoice" && <p className="mt-6 text-[11px] text-slate-400">Pay by card or bank transfer via the secure payment link. Thank you for your business.</p>}
        <p className="mt-2 text-[10px] text-slate-400">Sample document generated in a demo.</p>
        {needsApproval && <Badge tone="warn">Awaiting discount approval</Badge>}
      </article>
    </div>
    <Outbox items={outbox} onClear={() => setOutbox([])} />
    </div>
  );
}
