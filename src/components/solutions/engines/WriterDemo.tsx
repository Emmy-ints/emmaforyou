import { useMemo, useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { Badge, Btn, Field, Panel, Select, type EngineProps } from "./ui";

interface Gen { fields: [key: string, label: string, def: string][]; tones?: string[]; outputs: (v: Record<string, string>, tone: string, brand: string) => { title: string; text: string; limit?: number }[] }
const toneWord = (t: string) => ({ Friendly: "we'd love to", Professional: "we would be glad to", Bold: "let's" } as Record<string, string>)[t] ?? "we'd love to";

const G: Record<string, Gen> = {
  email: { fields: [["offer", "What are you promoting?", "Weekend 15% off all skincare"], ["audience", "Audience / segment", "Customers who bought in the last 90 days"], ["deadline", "Deadline", "Sunday midnight"]], tones: ["Friendly", "Professional", "Bold"], outputs: (v, t, b) => [
    { title: "Subject line A", text: `${v.offer} — just for you`, limit: 60 }, { title: "Subject line B (test)", text: `Ends ${v.deadline}: ${v.offer.toLowerCase()}`, limit: 60 },
    { title: "Email body", text: `Hi {first_name},\n\nAs one of our ${v.audience.toLowerCase()}, ${toneWord(t)} give you early access: ${v.offer}.\n\nIt ends ${v.deadline}, so don't miss it.\n\n[Shop now]\n\n— The ${b} team\n\nYou're receiving this because you're a ${b} customer. Unsubscribe anytime.` },
    { title: "Segment & test idea", text: `Send to: ${v.audience}. Test subject A vs B on 20% of the list, then send the winner to the rest after 4 hours.` }] },
  social: { fields: [["topic", "Post topic", "Behind the scenes of our new collection"], ["cta", "Call to action", "Shop the drop on our website"]], tones: ["Friendly", "Professional", "Bold"], outputs: (v, t, b) => [
    { title: "Instagram caption", text: `${t === "Bold" ? "It's here. 🔥" : "A little peek behind the scenes ✨"} ${v.topic}.\n\n${v.cta} — link in bio.\n\n#${b.replace(/\W/g, "")} #smallbusiness #newcollection`, limit: 2200 },
    { title: "LinkedIn post", text: `${v.topic}: what goes into it, and why it matters to our customers.\n\nAt ${b}, every piece is checked by hand before it ships.\n\n${v.cta}.`, limit: 3000 },
    { title: "X / Twitter", text: `${v.topic} 👀 ${v.cta}.`, limit: 280 },
    { title: "Content calendar (next 7 days)", text: ["Mon: Teaser photo", "Tue: Story poll — which colour?", "Wed: Reel — behind the scenes", "Thu: Customer review", "Fri: Launch post + link", "Sat: Styling tips carousel", "Sun: Thank-you + recap"].join("\n") }] },
  seo: { fields: [["page", "Page topic", "Dental implants in Lekki"], ["keyword", "Main keyword", "dental implants Lekki"]], outputs: (v, _t, b) => [
    { title: "Title tag", text: `${v.page} | ${b}`, limit: 60 }, { title: "Meta description", text: `Looking for ${v.keyword}? ${b} offers consultations, clear pricing and aftercare. Book online in minutes.`, limit: 160 },
    { title: "Keyword cluster", text: [v.keyword, `${v.keyword} cost`, `best ${v.keyword}`, `${v.keyword} near me`, `${v.keyword} recovery time`].join("\n") },
    { title: "Content brief", text: `H1: ${v.page}\nH2: What is it and who is it for?\nH2: Cost and payment options\nH2: What to expect, step by step\nH2: FAQs\nInternal links: pricing page, booking page, related services.` }] },
  ads: { fields: [["product", "Product / service", "Online booking for salons"], ["benefit", "Main benefit", "Fewer no-shows"], ["audience", "Audience", "Salon owners in Lagos"]], tones: ["Friendly", "Professional", "Bold"], outputs: (v) => [
    { title: "Headline 1", text: `${v.benefit} with ${v.product}`, limit: 30 }, { title: "Headline 2", text: `Built for ${v.audience}`.slice(0, 40), limit: 30 }, { title: "Headline 3", text: "Start free today", limit: 30 },
    { title: "Primary text", text: `${v.audience}: tired of empty chairs? ${v.product} sends reminders automatically, so you get ${v.benefit.toLowerCase()}.`, limit: 125 },
    { title: "Audience hypotheses", text: `1. ${v.audience} who follow beauty business pages\n2. Lookalike of past customers\n3. Website visitors in the last 30 days (retargeting)` }] },
  product: { fields: [["name", "Product name", "Steel water bottle 750ml"], ["features", "Key features (comma separated)", "keeps cold 24h, leak-proof lid, fits cup holders"], ["material", "Material", "Stainless steel"]], tones: ["Friendly", "Professional", "Bold"], outputs: (v) => { const f = v.features.split(",").map((x) => x.trim()).filter(Boolean); return [
    { title: "Product title", text: `${v.name} — ${f[0] ?? ""}`.slice(0, 80), limit: 80 },
    { title: "Description", text: `Meet the ${v.name}. Made from ${v.material.toLowerCase()}, it ${f.join(", ")}. Perfect for work, the gym and everything in between.` },
    { title: "Bullet points", text: f.map((x) => `• ${x.charAt(0).toUpperCase()}${x.slice(1)}`).join("\n") },
    { title: "Marketplace short copy", text: `${v.name} | ${f.slice(0, 2).join(" | ")}`.slice(0, 120), limit: 120 },
    { title: "SEO meta description", text: `Shop the ${v.name}: ${f.slice(0, 2).join(", ")}. Fast delivery and easy returns.`, limit: 160 }]; } },
  outreach: { fields: [["company", "Prospect company", "Bloom Dental"], ["observation", "Something real you noticed", "your booking page only works by phone"], ["offer", "How you can help", "online booking with WhatsApp reminders"]], tones: ["Friendly", "Professional", "Bold"], outputs: (v, t, b) => [
    { title: "Email", text: `Subject: Quick idea for ${v.company}\n\nHi {first_name},\n\nI noticed ${v.observation}. Many clinics we speak to lose bookings after hours because of this.\n\nAt ${b} we set up ${v.offer}. ${t === "Bold" ? "Worth a 15-minute call this week?" : "Would a short call be useful?"}\n\nBest,\n{your_name}` },
    { title: "Follow-up (3 days later)", text: `Hi {first_name}, just bumping this in case it got buried. Happy to send a 1-minute video showing how it would work for ${v.company}.` },
    { title: "Reminder", text: "Only personalise with real observations. Never invent facts about a prospect." }] },
  prospect: { fields: [["company", "Company", "Northwind Logistics"], ["site", "What their website says (paste)", "Same-day courier across Lagos and Abuja. Track your parcel online. Business accounts available."]], outputs: (v) => [
    { title: "Prospect brief", text: `Company: ${v.company}\nOffer: ${v.site.split(".")[0]}.\nAudience: ${/business/i.test(v.site) ? "Businesses and individuals" : "Individuals"}\nSignals: ${[/track/i.test(v.site) && "online tracking", /business account/i.test(v.site) && "B2B accounts", /same-day/i.test(v.site) && "speed-focused"].filter(Boolean).join(", ")}\nPossible needs: faster customer replies, lead capture for business accounts.\nQuestions to ask: How do business customers sign up today? How many tracking enquiries per day?` }] },
  briefing: { fields: [["emails", "Paste emails / notes", "Supplier says delivery delayed to Friday.\nClient A approved the design.\nInvoice #882 overdue by 10 days.\nTeam meeting moved to 3pm."]], outputs: (v) => { const l = v.emails.split("\n").map((x) => x.trim()).filter(Boolean); return [
    { title: "Morning briefing", text: `Today's summary (${l.length} items):\n${l.map((x) => `• ${x}`).join("\n")}` },
    { title: "Needs your decision", text: l.filter((x) => /overdue|delay|approve|urgent/i.test(x)).map((x) => `• ${x}`).join("\n") || "Nothing urgent." },
    { title: "Draft reply (needs your approval before sending)", text: l.some((x) => /overdue/i.test(x)) ? "Hi, a friendly reminder that invoice #882 is now 10 days overdue. Could you let us know when to expect payment? Thank you." : "No replies drafted." }]; } },
  repurpose: { fields: [["source", "Paste a transcript or article", "Today we talked about three ways to get more reviews. First, ask at the right moment, right after a good experience. Second, make it one tap with a direct link. Third, reply to every review, good or bad."]], outputs: (v, _t, b) => { const s = v.source.split(/(?<=\.)\s+/).filter(Boolean); return [
    { title: "Blog post outline", text: `Title: ${s[0]?.replace(/\.$/, "")}\n${s.slice(1).map((x, i) => `H2 ${i + 1}: ${x}`).join("\n")}` },
    { title: "3 social posts", text: s.slice(1, 4).map((x, i) => `Post ${i + 1}: ${x} #${b.replace(/\W/g, "")}`).join("\n\n") },
    { title: "Newsletter blurb", text: `This week: ${s[0]} Here's the short version: ${s.slice(1).join(" ")}` },
    { title: "Clip ideas", text: s.slice(1).map((x) => `• 30-second clip: "${x}"`).join("\n") }]; } },
  localise: { fields: [["copy", "English copy", "Free delivery on orders over $50. Order by 2pm for same-day dispatch."], ["market", "Target market", "France"]], outputs: (v) => {
    const fr = v.copy.replace("Free delivery on orders over $50.", "Livraison gratuite dès 50 € d'achat.").replace("Order by 2pm for same-day dispatch.", "Commandez avant 14 h pour une expédition le jour même.");
    const de = v.copy.replace("Free delivery on orders over $50.", "Kostenloser Versand ab 50 € Bestellwert.").replace("Order by 2pm for same-day dispatch.", "Bis 14 Uhr bestellt, am selben Tag versendet.");
    return [{ title: v.market === "Germany" ? "German (DE)" : "French (FR)", text: v.market === "Germany" ? de : fr }, { title: "Localisation notes", text: "Currency converted to €, 24-hour time, local number formats. A native speaker reviews before publishing." }]; } },
};

const CMS: Record<string, { item: string; title: string; body: string; cats: string[] }> = {
  blog: { item: "Article", title: "5 ways to get more bookings from your website", body: "Most visitors decide in seconds. Put your booking button at the top, show prices, and answer common questions on the page…", cats: ["Growth", "Guides", "News"] },
  news: { item: "Story", title: "Local market reopens after renovation", body: "Traders returned on Monday as the newly renovated market opened its doors…", cats: ["Local", "Business", "Politics"] },
  podcast: { item: "Episode", title: "Ep. 12 — Pricing your services with confidence", body: "Show notes: In this episode we cover value-based pricing, how to present packages, and handling 'it's too expensive'…", cats: ["Business", "Interviews"] },
  doc: { item: "Document", title: "Client onboarding process", body: "1. Send welcome email\n2. Book kickoff call\n3. Share the client portal login…", cats: ["Operations", "Sales", "HR"] },
};

export default function WriterDemo({ preset, brand }: EngineProps) {
  return CMS[preset] ? <Cms preset={preset} brand={brand} /> : <Generator preset={preset} brand={brand} />;
}

function Generator({ preset, brand }: { preset: string; brand: string }) {
  const g = G[preset] ?? G.email;
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(g.fields.map(([k, , d]) => [k, d])));
  const [tone, setTone] = useState(g.tones?.[0] ?? "Friendly");
  const [market, setMarket] = useState("France");
  const [outs, setOuts] = useState<{ title: string; text: string; limit?: number }[] | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const gen = () => setOuts(g.outputs({ ...vals, market }, tone, brand));
  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Panel title="Inputs">
        <form onSubmit={(e) => { e.preventDefault(); gen(); }} className="space-y-2.5">
          {g.fields.map(([k, label]) => (vals[k]?.length ?? 0) > 60 || k === "emails" || k === "source" || k === "site" ? (
            <label key={k} className="block text-xs font-medium text-muted-foreground">{label}<textarea value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} rows={5} maxLength={1500} className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-[var(--demo-accent)]" /></label>
          ) : <Field key={k} label={label} value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} maxLength={140} />)}
          {preset === "localise" && <Select label="Market" value={market} onChange={(e) => setMarket(e.target.value)} options={["France", "Germany"]} />}
          {g.tones && <Select label="Tone of voice" value={tone} onChange={(e) => setTone(e.target.value)} options={g.tones} />}
          <Btn type="submit"><Sparkles className="h-4 w-4" />Generate</Btn>
          <p className="text-[11px] text-muted-foreground">Template-based demo that runs in your browser. Production uses AI trained on your brand voice, with a person approving before anything is published or sent.</p>
        </form>
      </Panel>
      <div className="space-y-3">
        {!outs ? <Panel><p className="text-sm text-muted-foreground">Fill in the inputs and press <strong>Generate</strong>.</p></Panel> : outs.map((o, i) => (
          <Panel key={o.title + i} title={o.title} actions={<div className="flex items-center gap-2">{o.limit && <Badge tone={o.text.length > o.limit ? "bad" : "good"}>{o.text.length}/{o.limit}</Badge>}<Btn variant="ghost" className="!px-2.5 !py-1 !text-xs" onClick={() => { try { navigator.clipboard.writeText(o.text); } catch { /* blocked */ } setCopied(i); setTimeout(() => setCopied(null), 1500); }}>{copied === i ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === i ? "Copied" : "Copy"}</Btn></div>}>
            <textarea aria-label={o.title} value={o.text} onChange={(e) => setOuts((os) => os!.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} rows={Math.min(10, Math.max(2, o.text.split("\n").length + 1))} className="w-full resize-y rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-[var(--demo-accent)]" />
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Cms({ preset, brand }: { preset: string; brand: string }) {
  const c = CMS[preset];
  const [title, setTitle] = useState(c.title);
  const [body, setBody] = useState(c.body);
  const [cat, setCat] = useState(c.cats[0]);
  const [status, setStatus] = useState<"Draft" | "In review" | "Scheduled" | "Published">("Draft");
  const [versions, setVersions] = useState<string[]>([]);
  const slug = useMemo(() => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60), [title]);
  const desc = body.replace(/\s+/g, " ").slice(0, 155);
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const next = { Draft: "In review", "In review": "Scheduled", Scheduled: "Published", Published: "Published" } as const;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Panel title={`${c.item} editor`} actions={<Badge tone={status === "Published" ? "good" : status === "Draft" ? "neutral" : "warn"}>{status}</Badge>}>
        <input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className="w-full border-b border-border bg-transparent pb-2 font-display text-xl font-semibold outline-none focus:border-[var(--demo-accent)]" />
        <textarea aria-label="Body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="mt-3 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-relaxed outline-none focus:border-[var(--demo-accent)]" />
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{words} words · ~{Math.max(1, Math.round(words / 200))} min read</span>
          <Select label="" aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} options={c.cats} className="w-36" />
          <Btn variant="ghost" onClick={() => setVersions((v) => [`v${v.length + 1} · ${new Date().toLocaleTimeString()} · ${words} words`, ...v])}>Save version</Btn>
          <Btn onClick={() => setStatus(next[status])} disabled={status === "Published"}>{status === "Draft" ? "Send for review" : status === "In review" ? "Approve & schedule" : status === "Scheduled" ? "Publish now" : "Published"}</Btn>
        </div>
      </Panel>
      <div className="space-y-4">
        <Panel title="Search preview">
          <p className="truncate text-xs text-emerald-700">{brand.toLowerCase().replace(/[^a-z0-9]/g, "") || "yoursite"}.com › {cat.toLowerCase()} › {slug}</p>
          <p className="mt-0.5 text-base text-[#1a0dab] dark:text-sky-400">{title.length > 60 ? `${title.slice(0, 57)}…` : title}</p>
          <p className="text-xs text-muted-foreground">{desc}{body.length > 155 ? "…" : ""}</p>
          <div className="mt-2 flex flex-wrap gap-1"><Badge tone={title.length <= 60 ? "good" : "warn"}>Title {title.length}/60</Badge><Badge tone={words >= 300 ? "good" : "warn"}>{words >= 300 ? "Length OK" : "Add more detail (300+ words)"}</Badge></div>
        </Panel>
        <Panel title="Version history">{versions.length ? <ul className="space-y-1 text-xs text-muted-foreground">{versions.map((v) => <li key={v}>• {v}</li>)}</ul> : <p className="text-xs text-muted-foreground">No saved versions yet.</p>}</Panel>
      </div>
    </div>
  );
}
