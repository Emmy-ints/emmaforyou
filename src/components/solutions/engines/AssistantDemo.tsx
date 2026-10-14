import { useEffect, useRef, useState } from "react";
import { Bot, Plus, Send, Trash2, UserRound } from "lucide-react";
import { Badge, Btn, Panel, uid, type EngineProps } from "./ui";

interface Doc { id: string; title: string; text: string }
interface Msg { by: "user" | "bot"; text: string; source?: string; handoff?: boolean }

const KB: Record<string, { greeting: string; suggestions: string[]; docs: [string, string][] }> = {
  support: { greeting: "Hi! I can help with orders, delivery, returns and payments. What do you need?", suggestions: ["How long is delivery to Abuja?", "Can I return shoes?", "Do you accept bank transfer?"], docs: [
    ["Delivery times", "Lagos deliveries arrive in 1–2 days. Abuja, Port Harcourt and other states take 3–5 working days. Delivery is free on orders over ₦50,000."],
    ["Returns and refunds", "Unused items can be returned within 14 days. Shoes and clothes must have tags attached. Refunds are processed within 5 working days."],
    ["Payment methods", "We accept card, bank transfer, USSD and pay on delivery in Lagos."],
    ["Order tracking", "You get a tracking link by WhatsApp and email as soon as your order ships."]] },
  website: { greeting: "Welcome! Ask me anything about our services, prices or how to get started.", suggestions: ["What services do you offer?", "How much does a website cost?", "How do I book a call?"], docs: [
    ["Services", "We design websites, online stores, AI chat assistants and marketing automation for small businesses."],
    ["Pricing", "Website packages start from the Starter plan. Exact quotes follow a free 30-minute call."],
    ["Booking a call", "Book a free call on the booking page, or message us on WhatsApp."],
    ["Timeline", "Most websites launch in 2 to 3 weeks after the content is ready."]] },
  kb: { greeting: "Ask about company policies, processes or tools. I answer from the handbook and show the source.", suggestions: ["How do I request leave?", "Who approves expenses over $500?", "Where is the brand logo?"], docs: [
    ["Leave policy", "Staff get 20 days annual leave. Request leave in the HR portal at least 2 weeks ahead; your manager approves it."],
    ["Expense approvals", "Expenses under $500 are approved by your manager. Over $500 also need finance approval. Submit receipts within 30 days."],
    ["Brand assets", "Logos, fonts and templates are in the Brand folder on the shared drive under Marketing > Brand."],
    ["IT support", "For laptop or account issues, open a ticket in the IT help desk. Urgent issues: call the IT line."]] },
  hr: { greeting: "Hi! I'm the HR assistant. Ask me about leave, payroll dates, benefits or onboarding.", suggestions: ["When is payday?", "How many leave days do I have?", "What's covered by health insurance?"], docs: [
    ["Payday", "Salaries are paid on the 25th of each month, or the previous working day if it falls on a weekend."],
    ["Annual leave", "Full-time staff get 20 days of annual leave plus public holidays. Unused days up to 5 carry over."],
    ["Health insurance", "The company HMO covers staff and up to 3 dependants, including outpatient care and dental check-ups."],
    ["Onboarding", "New starters complete IT setup, policy reading and a buddy meeting in week one."]] },
  docs: { greeting: "Search the docs in plain English. I'll point you to the right guide.", suggestions: ["How do I get an API key?", "What are the rate limits?", "How do webhooks retry?"], docs: [
    ["Authentication", "Create an API key in Settings > Developers. Send it in the Authorization header as a Bearer token."],
    ["Rate limits", "The API allows 100 requests per minute per key. Exceeding it returns HTTP 429 with a Retry-After header."],
    ["Webhooks", "Webhooks retry up to 5 times with exponential backoff if your endpoint doesn't return a 2xx status."],
    ["Pagination", "List endpoints return 50 items per page. Use the cursor value from the response to fetch the next page."]] },
  docsearch: { greeting: "I search across the uploaded contracts and reports and quote the passage I used.", suggestions: ["What is the notice period in the lease?", "When does the supplier contract renew?", "What are the late payment terms?"], docs: [
    ["Office lease (2024)", "Either party may terminate with three months' written notice. Rent is reviewed every two years."],
    ["Supplier agreement — Delta", "The agreement renews automatically each January unless cancelled 60 days before renewal."],
    ["Payment terms policy", "Invoices are due within 30 days. Late payments incur interest at 2% per month after a reminder."]] },
  shopping: { greeting: "Hi! Tell me what you're shopping for and I'll recommend something.", suggestions: ["I need running shoes for flat feet", "A gift under $30", "Something for yoga"], docs: [
    ["Stability running shoe — $95", "Best for flat feet and overpronation. Firm arch support, cushioned heel. Sizes 38–46."],
    ["Neutral running shoe — $85", "Lightweight, for neutral runners and road races."],
    ["Yoga mat 6mm — $30", "Non-slip, extra cushioning for knees, good for yoga and floor workouts."],
    ["Water bottle — $18", "Insulated steel bottle, keeps drinks cold 24 hours. A popular gift under $30."]] },
  sales: { greeting: "Hi! I can tell you about our services and find the right fit. What does your business do?", suggestions: ["I run a clinic and want more bookings", "We need a new online store", "What does it cost?"], docs: [
    ["Clinics and bookings", "For clinics we set up online booking, WhatsApp reminders and an AI receptionist to cut no-shows."],
    ["Online stores", "We build stores with local payments, abandoned-cart reminders and product pages that convert."],
    ["Pricing", "Plans are monthly and published on the pricing page. Larger builds get a fixed quote after a free call."]] },
};
const STOP = new Set("a an the is are do does i you we to of for in on and or my your our can how what when where who which with it be this that there me us have has".split(" "));
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9£$₦€% ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, ""));

const QUAL = ["What kind of business is it, and what's the main goal?", "Roughly what monthly budget do you have in mind?", "When would you like to start?", "Great — what's your name and best WhatsApp number? (Demo: nothing is sent)"];

export default function AssistantDemo({ preset, brand }: EngineProps) {
  const cfg = KB[preset] ?? KB.support;
  const [docs, setDocs] = useState<Doc[]>(() => cfg.docs.map(([title, text]) => ({ id: uid(), title, text })));
  const [msgs, setMsgs] = useState<Msg[]>([{ by: "bot", text: cfg.greeting }]);
  const [input, setInput] = useState("");
  const [newDoc, setNewDoc] = useState({ title: "", text: "" });
  const [qual, setQual] = useState<string[]>([]);
  const [handoffs, setHandoffs] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [msgs]);

  const answer = (q: string): Msg => {
    if (preset === "sales" && qual.length < QUAL.length && (qual.length > 0 || /cost|price|budget|start|need|want|business/i.test(q))) {
      const next = [...qual, q]; setQual(next);
      if (next.length < QUAL.length) return { by: "bot", text: `${next.length === 1 ? "Thanks! " : ""}${QUAL[next.length]}` };
      const budget = /\d/.test(next[1] ?? "") ? "budget given" : "budget unclear"; const soon = /now|asap|week|month|soon|immediately/i.test(next[2] ?? "");
      const score = 40 + (budget === "budget given" ? 25 : 0) + (soon ? 25 : 0) + (/\d{6,}/.test(q) ? 10 : 0);
      return { by: "bot", text: `Thanks, you're all set. Lead score ${score}/100 (${score >= 75 ? "hot: book a call today" : "warm: send case studies"}). In the live version this goes straight into the CRM and books a call.`, source: "Qualification rules" };
    }
    const qt = tokens(q);
    const scored = docs.map((d) => { const dt = new Set(tokens(`${d.title} ${d.title} ${d.text}`)); return { d, s: qt.filter((t) => dt.has(t)).length / Math.max(1, qt.length) }; }).sort((a, b) => b.s - a.s);
    const best = scored[0];
    if (!best || best.s < 0.2) { setHandoffs((h) => h + 1); return { by: "bot", text: `I'm not sure about that from ${brand}'s information, so I've passed it to a person who'll reply shortly.`, handoff: true }; }
    const sentences = best.d.text.split(/(?<=\.)\s+/);
    const pick = sentences.map((s) => ({ s, n: qt.filter((t) => tokens(s).includes(t)).length })).sort((a, b) => b.n - a.n).slice(0, 2).map((x) => x.s);
    return { by: "bot", text: pick.join(" "), source: best.d.title };
  };
  const ask = (q: string) => { const t = q.trim(); if (!t) return; setMsgs((m) => [...m, { by: "user", text: t }, answer(t)]); setInput(""); };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex h-[480px] flex-col rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--demo-accent)] text-white"><Bot className="h-4 w-4" /></span><div><p className="text-sm font-semibold">{brand} assistant</p><p className="text-[11px] text-muted-foreground">Answers only from the knowledge on the right</p></div>{handoffs > 0 && <Badge tone="warn">{handoffs} handed to a person</Badge>}</div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.by === "user" ? "justify-end" : ""}`}>
              {m.by === "bot" && <Bot className="mt-1 h-4 w-4 shrink-0 text-[var(--demo-accent)]" aria-hidden="true" />}
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.by === "user" ? "bg-[var(--demo-accent)] text-white" : "bg-muted text-foreground"}`}>
                {m.text}
                {m.source && <span className="mt-1 block text-[10px] opacity-70">Source: {m.source}</span>}
                {m.handoff && <span className="mt-1 block text-[10px] font-semibold opacity-80">Ticket created · conversation passed to staff</span>}
              </div>
              {m.by === "user" && <UserRound className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">{cfg.suggestions.map((s) => <button key={s} type="button" onClick={() => ask(s)} className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-[var(--demo-accent)]">{s}</button>)}</div>
        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-border p-3"><input value={input} onChange={(e) => setInput(e.target.value)} maxLength={300} placeholder="Type a question…" aria-label="Your message" className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-[var(--demo-accent)]" /><Btn type="submit" disabled={!input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Btn></form>
      </div>
      <Panel title="Knowledge it can use" actions={<Badge tone="accent">{docs.length} entries</Badge>}>
        <p className="mb-2 text-[11px] text-muted-foreground">Edit or add your own entries, then ask about them. The demo matches keywords; production uses an AI model with retrieval and guardrails.</p>
        <ul className="max-h-56 space-y-2 overflow-y-auto">{docs.map((d) => (
          <li key={d.id} className="rounded-xl border border-border p-2 text-xs">
            <div className="flex items-center justify-between gap-2"><input aria-label="Entry title" value={d.title} onChange={(e) => setDocs((ds) => ds.map((x) => (x.id === d.id ? { ...x, title: e.target.value } : x)))} className="flex-1 bg-transparent font-semibold outline-none" /><button type="button" aria-label={`Delete ${d.title}`} onClick={() => setDocs((ds) => ds.filter((x) => x.id !== d.id))} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></div>
            <textarea aria-label="Entry text" value={d.text} onChange={(e) => setDocs((ds) => ds.map((x) => (x.id === d.id ? { ...x, text: e.target.value } : x)))} rows={2} className="mt-1 w-full resize-y rounded-md bg-muted/60 p-1.5 text-muted-foreground outline-none" />
          </li>))}</ul>
        <form onSubmit={(e) => { e.preventDefault(); if (!newDoc.title.trim() || !newDoc.text.trim()) return; setDocs((ds) => [...ds, { id: uid(), title: newDoc.title.trim(), text: newDoc.text.trim() }]); setNewDoc({ title: "", text: "" }); }} className="mt-3 space-y-1.5">
          <input value={newDoc.title} onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })} placeholder="New topic (e.g. Opening hours)" aria-label="New topic" maxLength={50} className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs" />
          <textarea value={newDoc.text} onChange={(e) => setNewDoc({ ...newDoc, text: e.target.value })} placeholder="The answer (e.g. We're open Mon–Sat 9am–6pm.)" aria-label="New answer" rows={2} maxLength={400} className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs" />
          <Btn type="submit" variant="soft" disabled={!newDoc.title.trim() || !newDoc.text.trim()}><Plus className="h-4 w-4" />Add knowledge</Btn>
        </form>
      </Panel>
    </div>
  );
}
