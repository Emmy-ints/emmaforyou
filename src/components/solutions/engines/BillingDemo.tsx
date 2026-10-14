import { useState } from "react";
import { Check } from "lucide-react";
import { Badge, Btn, Outbox, Panel, RowsEditor, Select, SettingsPanel, Stat, Toast, Toggles, curOf, daysFromNow, fmtDate, money as fmtMoney, uid, useDemoSetting, type EngineProps, type OutboxItem } from "./ui";

interface Plan { id?: string; name: string; price: number; perks: string[]; perksText?: string }
const PLANS: Record<string, Plan[]> = {
  saas: [{ name: "Basic", price: 19, perks: ["1 user", "1,000 contacts", "Email support"] }, { name: "Team", price: 49, perks: ["5 users", "10,000 contacts", "Automations"] }, { name: "Business", price: 99, perks: ["Unlimited users", "API access", "Priority support"] }],
  membership: [{ name: "Supporter", price: 5, perks: ["Monthly newsletter", "Member badge"] }, { name: "Insider", price: 15, perks: ["All articles & replays", "Members-only Q&A"] }, { name: "Patron", price: 40, perks: ["Everything in Insider", "Quarterly 1:1 call", "Early access"] }],
};
const SUBS = [{ plan: 1, n: 64 }, { plan: 0, n: 120 }, { plan: 2, n: 18 }];

export default function BillingDemo(props: EngineProps) {
  const { preset, brand } = props;
  const cur = curOf(props, "USD");
  const money = (v: number) => fmtMoney(v, cur);
  const basePlans = PLANS[preset] ?? PLANS.saas;
  const [planRows, setPlanRows] = useDemoSetting<(Plan & { id: string; perksText: string })[]>(props, "plans", basePlans.map((p, i) => ({ ...p, id: `p${i}`, perksText: p.perks.join(", ") })));
  const plans = planRows.map((p) => ({ ...p, perks: p.perksText.split(",").map((x) => x.trim()).filter(Boolean) }));
  const [freeMonths, setFreeMonths] = useDemoSetting(props, "freeMonths", 2);
  const [trialDays, setTrialDays] = useDemoSetting(props, "trial", preset === "saas" ? 14 : 0);
  const [offerPct, setOfferPct] = useDemoSetting(props, "offer", 50);
  const [prorate, setProrate] = useDemoSetting(props, "prorate", true);
  const [notify, setNotify] = useDemoSetting<string[]>(props, "notify", ["receipt", "dunning"]);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const push = (channel: string, text: string) => setOutbox((o) => [...o, { id: uid(), channel, to: "Subscriber", text }].slice(-30));
  const [annual, setAnnual] = useState(false);
  const [sub, setSub] = useState<{ plan: number; status: "Trialing" | "Active" | "Past due" | "Cancelled"; day: number } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [saveOffer, setSaveOffer] = useState(false);
  const price = (i: number) => (annual ? plans[i].price * (12 - freeMonths) : plans[i].price);
  const period = annual ? 365 : 30;
  const mrr = SUBS.reduce((s, x) => s + (plans[Math.min(x.plan, plans.length - 1)]?.price ?? 0) * x.n, 0) + (sub && sub.status === "Active" && plans[sub.plan] ? plans[sub.plan].price : 0);
  const add = (l: string) => setLog((g) => [`${fmtDate(daysFromNow(0))} · ${l}`, ...g]);

  const change = (to: number) => {
    if (!sub) return;
    const remaining = period - sub.day;
    if (!prorate) {
      add(`${to > sub.plan ? "Upgraded" : "Downgraded"} ${plans[sub.plan].name} → ${plans[to].name}. No proration: new price applies from the next bill (${fmtDate(daysFromNow(remaining))}).`);
      setSub({ ...sub, plan: to });
      setMsg(`Proration is off: ${plans[to].name} starts at the next renewal.`);
      return;
    }
    const credit = (price(sub.plan) * remaining) / period, charge = (price(to) * remaining) / period;
    const diff = charge - credit;
    add(`${to > sub.plan ? "Upgraded" : "Downgraded"} ${plans[sub.plan].name} → ${plans[to].name}. Prorated ${diff >= 0 ? "charge" : "credit"} ${money(Math.abs(diff))} for ${remaining} remaining days.`);
    if (notify.includes("receipt")) push("Email", `Plan changed to ${plans[to].name}. ${diff >= 0 ? "Charged" : "Credited"} ${money(Math.abs(diff))} (prorated).`);
    setSub({ ...sub, plan: to });
    setMsg(`Proration: unused ${plans[sub.plan].name} time ${money(credit)} credited, ${plans[to].name} for the rest of the period ${money(charge)}.`);
  };

  return (
    <div className="space-y-4">
      <SettingsPanel summary={`${plans.length} plans · ${trialDays ? `${trialDays}-day trial` : "no trial"} · ${freeMonths} months free yearly`}>
        <RowsEditor<Plan & { id: string; perksText: string }> label="Plans" rows={planRows} onChange={(v) => { setPlanRows(v); setSub(null); setLog([]); }} min={1} max={4}
          cols={[{ key: "name", label: "Plan", type: "text", width: "22%" }, { key: "price", label: `Monthly (${cur})`, type: "number", min: 0, step: 1, width: "18%" }, { key: "perksText", label: "What's included (comma-separated)", type: "text" }]}
          make={() => ({ id: uid(), name: "New plan", price: 29, perks: [], perksText: "Feature one, Feature two" })} />
        <div className="grid gap-3 sm:grid-cols-4">
          <Select label="Free trial" value={String(trialDays)} onChange={(e) => setTrialDays(Number(e.target.value))} options={[["0", "No trial"], ["7", "7 days"], ["14", "14 days"], ["30", "30 days"]]} />
          <Select label="Yearly discount" value={String(freeMonths)} onChange={(e) => setFreeMonths(Number(e.target.value))} options={[["0", "None"], ["1", "1 month free"], ["2", "2 months free"], ["3", "3 months free"]]} />
          <Select label="Cancellation save offer" value={String(offerPct)} onChange={(e) => setOfferPct(Number(e.target.value))} options={[["0", "No offer"], ["20", "20% off 2 months"], ["50", "50% off 2 months"]]} />
          <Select label="Plan changes" value={prorate ? "yes" : "no"} onChange={(e) => setProrate(e.target.value === "yes")} options={[["yes", "Prorate immediately"], ["no", "Apply at next renewal"]]} />
        </div>
        <Toggles label="Notifications" options={[["receipt", "Receipts and plan-change emails"], ["dunning", "Failed-payment reminders (dunning)"], ["trial", "Trial ending reminder"]]} value={notify} onChange={setNotify} />
      </SettingsPanel>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Monthly recurring revenue" value={money(mrr)} hint="Sample subscribers" /><Stat label="Subscribers" value={SUBS.reduce((s, x) => s + x.n, 0) + (sub ? 1 : 0)} />
        <Stat label="Churn (30 days)" value="2.8%" hint="Sample" /><Stat label="Failed payments recovered" value={log.filter((l) => l.includes("Recovered")).length} />
      </div>
      {!sub ? (
        <Panel title={`${brand} plans`} actions={<div className="flex rounded-full border border-border p-0.5 text-xs font-semibold">{[false, true].map((a) => <button key={String(a)} type="button" aria-pressed={annual === a} onClick={() => setAnnual(a)} className={`rounded-full px-3 py-1 ${annual === a ? "bg-[var(--demo-accent)] text-white" : "text-muted-foreground"}`}>{a ? `Yearly${freeMonths ? ` (${freeMonths} month${freeMonths > 1 ? "s" : ""} free)` : ""}` : "Monthly"}</button>)}</div>}>
          <div className="grid gap-3 md:grid-cols-3">{plans.map((p, i) => (
            <div key={p.id ?? p.name} className={`flex flex-col rounded-2xl border p-4 ${i === 1 ? "border-[var(--demo-accent)]" : "border-border"}`}>
              {i === 1 && <Badge tone="accent">Most popular</Badge>}
              <p className="mt-1 font-semibold">{p.name}</p><p className="font-display text-2xl font-semibold">{money(price(i))}<span className="text-sm font-normal text-muted-foreground">/{annual ? "yr" : "mo"}</span></p>
              <ul className="mt-2 flex-1 space-y-1 text-sm text-muted-foreground">{p.perks.map((x) => <li key={x} className="flex gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />{x}</li>)}</ul>
              <Btn className="mt-3" onClick={() => { setSub({ plan: i, status: trialDays ? "Trialing" : "Active", day: 0 }); add(trialDays ? `Started ${trialDays}-day free trial of ${p.name}` : `Joined ${p.name}, first payment ${money(price(i))}`); if (trialDays && notify.includes("trial")) push("Scheduled · Email", `Your ${p.name} trial ends ${fmtDate(daysFromNow(trialDays))}. Add a card to keep access.`); if (!trialDays && notify.includes("receipt")) push("Email", `Receipt: ${p.name}, ${money(price(i))}.`); }}>{trialDays ? `Start ${trialDays}-day free trial` : "Join"}</Btn>
            </div>))}</div>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Customer billing portal" actions={<Badge tone={sub.status === "Active" || sub.status === "Trialing" ? "good" : sub.status === "Past due" ? "warn" : "bad"}>{sub.status}</Badge>}>
            <p className="text-sm">Plan: <strong>{plans[sub.plan].name}</strong> · {money(price(sub.plan))}/{annual ? "yr" : "mo"}</p>
            <p className="text-xs text-muted-foreground">Day {sub.day} of {period} · next bill {fmtDate(daysFromNow(period - sub.day))}</p>
            <label className="mt-3 block text-xs font-medium text-muted-foreground">Move through the billing period: day {sub.day}<input type="range" min={0} max={period - 1} value={sub.day} onChange={(e) => setSub({ ...sub, day: Number(e.target.value) })} className="mt-1 block w-full accent-[var(--demo-accent)]" /></label>
            <div className="mt-3 flex flex-wrap gap-2">
              {sub.status === "Trialing" && <Btn onClick={() => { setSub({ ...sub, status: "Active" }); add(`Trial converted. Charged ${money(price(sub.plan))}`); if (notify.includes("receipt")) push("Email", `Receipt: ${plans[sub.plan].name}, ${money(price(sub.plan))}.`); }}>End trial & pay</Btn>}
              {sub.plan < plans.length - 1 && sub.status !== "Cancelled" && <Btn variant="soft" onClick={() => change(sub.plan + 1)}>Upgrade</Btn>}
              {sub.plan > 0 && sub.status !== "Cancelled" && <Btn variant="ghost" onClick={() => change(sub.plan - 1)}>Downgrade</Btn>}
              {sub.status === "Active" && <Btn variant="ghost" onClick={() => { setSub({ ...sub, status: "Past due" }); add(notify.includes("dunning") ? "Payment failed (card declined). Dunning started: email now, retry in 3 days, reminder in 5, final notice in 7." : "Payment failed (card declined). Dunning reminders are off, so no messages go out."); if (notify.includes("dunning")) { push("Email", "Your payment didn't go through. Update your card: [link]"); push("Scheduled · Email", "Reminder (day 5): update your card to keep access."); } }}>Simulate failed payment</Btn>}
              {sub.status === "Past due" && <Btn onClick={() => { setSub({ ...sub, status: "Active" }); add("Recovered: customer updated card from the reminder link."); }}>Customer updates card</Btn>}
              {sub.status !== "Cancelled" && <Btn variant="danger" onClick={() => { if (offerPct) setSaveOffer(true); else { setSub({ ...sub, status: "Cancelled" }); add("Cancelled. Access continues until the end of the period."); } }}>Cancel</Btn>}
              {sub.status === "Cancelled" && <Btn onClick={() => { setSub({ ...sub, status: "Active" }); add("Reactivated"); }}>Reactivate</Btn>}
            </div>
            {saveOffer && (
              <div className="mt-3 rounded-xl border border-border bg-muted p-3 text-sm"><p className="font-medium">Before you go: {offerPct}% off your next 2 months?</p><div className="mt-2 flex gap-2"><Btn onClick={() => { setSaveOffer(false); add(`Accepted retention offer: ${offerPct}% off for 2 months`); setMsg("Customer saved with a retention offer."); }}>Accept offer</Btn><Btn variant="ghost" onClick={() => { setSaveOffer(false); setSub({ ...sub, status: "Cancelled" }); add("Cancelled. Access continues until the end of the period. Reason: too expensive"); }}>Cancel anyway</Btn></div></div>
            )}
            {msg && <div className="mt-3"><Toast>{msg}</Toast></div>}
            <Btn variant="ghost" className="mt-3" onClick={() => { setSub(null); setLog([]); setMsg(""); }}>Back to plans</Btn>
          </Panel>
          <Panel title="Billing events"><ul className="space-y-1.5 text-xs text-muted-foreground">{log.map((l, i) => <li key={i}>• {l}</li>)}</ul></Panel>
        </div>
      )}
      <Outbox items={outbox} onClear={() => setOutbox([])} />
      <p className="text-[11px] text-muted-foreground">Demo: no card details are collected and no payment is taken. Production uses Stripe, Paystack or Flutterwave subscriptions.</p>
    </div>
  );
}
