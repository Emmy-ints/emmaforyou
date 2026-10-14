import { useMemo, useState } from "react";
import { Heart, Search, Star } from "lucide-react";
import { Badge, Btn, Field, ListEditor, Outbox, Panel, RoleBar, Select, SettingsPanel, Toast, Toggles, curOf, money, uid, useDemoSetting, type EngineProps, type OutboxItem } from "./ui";

interface L { id: string; title: string; cat: string; loc: string; price: number; emoji: string; meta: string; featured?: boolean; rating?: number; verified?: boolean; status: "live" | "pending" }
const D: Record<string, { cur: string; priceLabel: string; cats: string[]; locs: string[]; cta: string; items: Omit<L, "id" | "status">[]; postLabel: string }> = {
  property: { cur: "USD", priceLabel: "Price", cats: ["Apartment", "House", "Land", "Office"], locs: ["Lekki", "Ikoyi", "Abuja", "Ikeja"], cta: "Book a viewing", postLabel: "List a property", items: [
    { title: "3-bed apartment with pool", cat: "Apartment", loc: "Lekki", price: 185000, emoji: "🏢", meta: "3 bed · 3 bath · 160 m²", featured: true, verified: true }, { title: "4-bed detached house", cat: "House", loc: "Abuja", price: 320000, emoji: "🏡", meta: "4 bed · 5 bath · garden", verified: true },
    { title: "Serviced office floor", cat: "Office", loc: "Ikoyi", price: 450000, emoji: "🏬", meta: "400 m² · parking" }, { title: "Plot, 600 m²", cat: "Land", loc: "Ikeja", price: 90000, emoji: "🌳", meta: "C of O · fenced" }, { title: "2-bed starter flat", cat: "Apartment", loc: "Ikeja", price: 70000, emoji: "🏠", meta: "2 bed · 2 bath" }] },
  jobs: { cur: "USD", priceLabel: "Salary / yr", cats: ["Sales", "Design", "Engineering", "Operations"], locs: ["Remote", "Lagos", "Accra", "Nairobi"], cta: "Apply now", postLabel: "Post a job", items: [
    { title: "Sales Lead", cat: "Sales", loc: "Lagos", price: 24000, emoji: "📈", meta: "Full-time · Prime Realty", featured: true, verified: true }, { title: "Product Designer", cat: "Design", loc: "Remote", price: 36000, emoji: "🎨", meta: "Full-time · Kora", verified: true },
    { title: "Frontend Developer", cat: "Engineering", loc: "Accra", price: 30000, emoji: "💻", meta: "Contract · 6 months" }, { title: "Operations Manager", cat: "Operations", loc: "Nairobi", price: 28000, emoji: "⚙️", meta: "Full-time" }] },
  directory: { cur: "USD", priceLabel: "From", cats: ["Restaurants", "Salons", "Clinics", "Repairs"], locs: ["Lekki", "Yaba", "Ikeja", "VI"], cta: "Contact business", postLabel: "Add your business", items: [
    { title: "Mama's Kitchen", cat: "Restaurants", loc: "Yaba", price: 8, emoji: "🍲", meta: "Open till 10pm", rating: 4.7, featured: true, verified: true }, { title: "Glow Studio", cat: "Salons", loc: "Lekki", price: 15, emoji: "💇🏾‍♀️", meta: "Booking online", rating: 4.8, verified: true },
    { title: "Harbour Dental", cat: "Clinics", loc: "VI", price: 30, emoji: "🦷", meta: "HMO accepted", rating: 4.5 }, { title: "FixIt Phones", cat: "Repairs", loc: "Ikeja", price: 10, emoji: "📱", meta: "Same-day repairs", rating: 4.2 }] },
  classifieds: { cur: "NGN", priceLabel: "Price", cats: ["Phones", "Furniture", "Cars", "Electronics"], locs: ["Lagos", "Abuja", "Ibadan", "PH"], cta: "Message seller", postLabel: "Post an ad", items: [
    { title: "iPhone 13, 128GB", cat: "Phones", loc: "Lagos", price: 420000, emoji: "📱", meta: "Used · excellent", featured: true, verified: true }, { title: "3-seater sofa", cat: "Furniture", loc: "Abuja", price: 180000, emoji: "🛋️", meta: "Used · good" },
    { title: "Toyota Corolla 2015", cat: "Cars", loc: "Ibadan", price: 6800000, emoji: "🚗", meta: "Foreign used · 90,000 km", verified: true }, { title: "43\" Smart TV", cat: "Electronics", loc: "PH", price: 210000, emoji: "📺", meta: "New · sealed" }] },
  vehicles: { cur: "EUR", priceLabel: "Price", cats: ["Saloon", "SUV", "Electric", "Van"], locs: ["Halle", "Leipzig", "Dessau"], cta: "Book a test drive", postLabel: "Add a vehicle", items: [
    { title: "VW Golf 1.5 TSI", cat: "Saloon", loc: "Halle", price: 21900, emoji: "🚗", meta: "2021 · 34,000 km · petrol", featured: true, verified: true }, { title: "Skoda Kodiaq", cat: "SUV", loc: "Leipzig", price: 32500, emoji: "🚙", meta: "2020 · 58,000 km · diesel", verified: true },
    { title: "VW ID.3", cat: "Electric", loc: "Halle", price: 27400, emoji: "⚡", meta: "2022 · 21,000 km · 58 kWh" }, { title: "Ford Transit Custom", cat: "Van", loc: "Dessau", price: 24800, emoji: "🚐", meta: "2019 · 89,000 km" }] },
  services: { cur: "NGN", priceLabel: "From", cats: ["Cleaning", "Plumbing", "Beauty", "Moving"], locs: ["Lekki", "Ikeja", "Yaba"], cta: "Book this pro", postLabel: "Become a provider", items: [
    { title: "Deep home cleaning", cat: "Cleaning", loc: "Lekki", price: 25000, emoji: "🧽", meta: "2 cleaners · 4 hours", rating: 4.9, featured: true, verified: true }, { title: "Emergency plumber", cat: "Plumbing", loc: "Ikeja", price: 15000, emoji: "🔧", meta: "Arrives in ~60 min", rating: 4.6, verified: true },
    { title: "Home manicure & pedicure", cat: "Beauty", loc: "Yaba", price: 12000, emoji: "💅", meta: "At your home", rating: 4.7 }, { title: "Small move (1-bed)", cat: "Moving", loc: "Lekki", price: 60000, emoji: "📦", meta: "Van + 2 movers", rating: 4.4 }] },
};

export default function ListingsDemo(props: EngineProps) {
  const { preset, brand } = props;
  const base = D[preset] ?? D.property;
  const [cats, setCats] = useDemoSetting<string[]>(props, "cats", base.cats);
  const [locs, setLocs] = useDemoSetting<string[]>(props, "locs", base.locs);
  const [moderate, setModerate] = useDemoSetting(props, "moderate", true);
  const [featureFee, setFeatureFee] = useDemoSetting(props, "featureFee", 0);
  const [routing, setRouting] = useDemoSetting(props, "routing", "owner");
  const [notify, setNotify] = useDemoSetting<string[]>(props, "notify", ["lead", "confirm", "admin"]);
  const [role, setRole] = useDemoSetting(props, "role", "visitor");
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const push = (channel: string, to: string, text: string) => setOutbox((o) => [...o, { id: uid(), channel, to, text }].slice(-30));
  const cfg = { ...base, cur: curOf(props, base.cur), cats, locs };
  const ownerWord = preset === "jobs" ? "employer" : preset === "property" || preset === "vehicles" ? "agent" : preset === "services" ? "provider" : "owner";
  const [items, setItems] = useState<L[]>(() => base.items.map((i) => ({ ...i, id: uid(), status: "live" })));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [loc, setLoc] = useState("All");
  const [max, setMax] = useState(Math.max(...base.items.map((i) => i.price)));
  const [saved, setSaved] = useState<string[]>([]);
  const [onlySaved, setOnlySaved] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [enq, setEnq] = useState({ name: "", msg: "" });
  const [sent, setSent] = useState("");
  const [posting, setPosting] = useState(false);
  const [draftRaw, setDraft] = useState({ title: "", price: "", cat: base.cats[0], loc: base.locs[0], featured: false });
  const draft = { ...draftRaw, cat: cats.includes(draftRaw.cat) ? draftRaw.cat : cats[0], loc: locs.includes(draftRaw.loc) ? draftRaw.loc : locs[0] };
  const admin = role === "admin";
  const ceiling = Math.max(...items.map((i) => i.price), 1);

  const shown = useMemo(() => items.filter((i) => i.status === "live" && (cat === "All" || !cats.includes(cat) || i.cat === cat) && (loc === "All" || !locs.includes(loc) || i.loc === loc) && i.price <= max && (!onlySaved || saved.includes(i.id)) && `${i.title} ${i.meta}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(!!b.featured) - Number(!!a.featured)), [items, cat, loc, max, onlySaved, saved, q, cats, locs]);
  const pending = items.filter((i) => i.status === "pending");
  const cur = items.find((i) => i.id === open);

  return (
    <div className="space-y-4">
      <SettingsPanel summary={`${cats.length} categories · ${locs.length} locations · ${moderate ? "moderated" : "auto-publish"}`}>
        <ListEditor label="Categories" items={cats} onChange={setCats} min={1} max={8} placeholder="New category" />
        <ListEditor label="Locations" items={locs} onChange={setLocs} min={1} max={8} placeholder="New location" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="New listings" value={moderate ? "review" : "live"} onChange={(e) => setModerate(e.target.value === "review")} options={[["review", "Need admin approval"], ["live", "Go live immediately"]]} />
          <Select label="Featured listing fee" value={String(featureFee)} onChange={(e) => setFeatureFee(Number(e.target.value))} options={[["0", "Free"], ["10", money(10, cfg.cur)], ["25", money(25, cfg.cur)], ["50", money(50, cfg.cur)]]} />
          <Select label="Enquiries go to" value={routing} onChange={(e) => setRouting(e.target.value)} options={[["owner", `The listing's ${ownerWord}`], ["team", "Your team first (then forwarded)"]]} />
        </div>
        <Toggles label="Notifications" options={[["lead", `Send enquiries to the ${ownerWord}/team`], ["confirm", "Confirmation to the person enquiring"], ["admin", "Alert admins about new listings"]]} value={notify} onChange={setNotify} />
      </SettingsPanel>
      <RoleBar roles={[{ id: "visitor", label: "Visitor", can: "Searches, saves and sends enquiries." }, { id: "seller", label: preset === "jobs" ? "Employer" : "Seller / owner", can: `Posts listings${moderate ? " (they wait for approval)" : " (live immediately)"}; can pay to feature them.` }, { id: "admin", label: "Marketplace admin", can: "Approves, features or rejects listings and changes the rules." }]} value={role} onChange={(v) => { setRole(v); setPosting(false); }} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="relative block min-w-[160px] flex-1 text-xs font-medium text-muted-foreground">Search<Search className="pointer-events-none absolute left-2.5 top-[30px] h-4 w-4" /><input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-sm outline-none focus:border-[var(--demo-accent)]" /></label>
        <Select label="Category" value={cats.includes(cat) ? cat : "All"} onChange={(e) => setCat(e.target.value)} options={["All", ...cfg.cats]} className="w-36" />
        <Select label="Location" value={locs.includes(loc) ? loc : "All"} onChange={(e) => setLoc(e.target.value)} options={["All", ...cfg.locs]} className="w-32" />
        <label className="block w-44 text-xs font-medium text-muted-foreground">Max {cfg.priceLabel.toLowerCase()}: {money(max, cfg.cur)}<input type="range" min={0} max={ceiling} step={Math.max(1, Math.round(ceiling / 50))} value={max} onChange={(e) => setMax(Number(e.target.value))} className="mt-2 block w-full accent-[var(--demo-accent)]" /></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn variant={onlySaved ? "primary" : "ghost"} onClick={() => setOnlySaved(!onlySaved)}><Heart className="h-4 w-4" />Saved ({saved.length})</Btn>
        {role !== "visitor" && <Btn variant="soft" onClick={() => setPosting(!posting)}>{cfg.postLabel}</Btn>}
      </div>

      {posting && (
        <Panel title={cfg.postLabel}>
          <form onSubmit={(e) => {
            e.preventDefault(); if (!draft.title.trim()) return;
            const live = !moderate || role === "admin";
            setItems((is) => [...is, { id: uid(), title: draft.title.trim(), cat: draft.cat, loc: draft.loc, price: Math.max(0, Number(draft.price) || 0), emoji: "🆕", meta: `Posted by ${brand}`, status: live ? "live" : "pending", featured: draft.featured }]);
            setDraft({ ...draft, title: "", price: "", featured: false }); setPosting(false);
            setSent(live ? `Published.${draft.featured ? ` Featured${featureFee ? ` (fee ${money(featureFee, cfg.cur)}, demo: no payment taken)` : ""}.` : ""}` : "Submitted for review. Listings go live after an admin checks them.");
            if (!live && notify.includes("admin")) push("Email", "Marketplace admins", `New listing to review: "${draft.title.trim()}" in ${draft.loc}.`);
          }} className="grid gap-2 sm:grid-cols-[1fr_120px_130px_120px_auto] sm:items-end">
            <Field label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={60} />
            <Field label={cfg.priceLabel} type="number" min={0} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
            <Select label="Category" value={draft.cat} onChange={(e) => setDraft({ ...draft, cat: e.target.value })} options={cfg.cats} />
            <Select label="Location" value={draft.loc} onChange={(e) => setDraft({ ...draft, loc: e.target.value })} options={cfg.locs} />
            <Btn type="submit" disabled={!draft.title.trim()}>Submit</Btn>
            <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-5"><input type="checkbox" checked={draft.featured} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} className="accent-[var(--demo-accent)]" />Feature this listing{featureFee ? ` (${money(featureFee, cfg.cur)})` : " (free)"}</label>
          </form>
        </Panel>
      )}
      {admin && (
        <Panel title="Moderation">
          {pending.length === 0 ? <p className="text-sm text-muted-foreground">No listings waiting. Post one to see it here.</p> : pending.map((p) => <div key={p.id} className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-2.5 text-sm"><span>{p.title} · {p.loc} · {money(p.price, cfg.cur)}</span><div className="flex gap-2"><Btn onClick={() => setItems((is) => is.map((x) => (x.id === p.id ? { ...x, status: "live" } : x)))}>Approve</Btn><Btn variant="ghost" onClick={() => setItems((is) => is.map((x) => (x.id === p.id ? { ...x, status: "live", featured: true } : x)))}>Approve as featured</Btn><Btn variant="danger" onClick={() => setItems((is) => is.filter((x) => x.id !== p.id))}>Reject</Btn></div></div>)}
        </Panel>
      )}
      {sent && <Toast>{sent}</Toast>}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((i) => (
          <li key={i.id} className={`relative rounded-2xl border bg-card p-3 ${i.featured ? "border-[var(--demo-accent)]" : "border-border"}`}>
            <button type="button" aria-label={saved.includes(i.id) ? `Unsave ${i.title}` : `Save ${i.title}`} onClick={() => setSaved((s) => (s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id]))} className="absolute right-3 top-3 rounded-full bg-background/80 p-1.5"><Heart className={`h-4 w-4 ${saved.includes(i.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} /></button>
            <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-muted text-4xl" aria-hidden="true">{i.emoji}</div>
            <div className="mt-2 flex flex-wrap gap-1">{i.featured && <Badge tone="accent">Featured</Badge>}{i.verified && <Badge tone="good">Verified</Badge>}{i.rating && <Badge><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{i.rating}</Badge>}</div>
            <p className="mt-1 font-semibold text-foreground">{i.title}</p>
            <p className="text-xs text-muted-foreground">{i.meta} · {i.loc}</p>
            <div className="mt-2 flex items-center justify-between"><span className="font-semibold">{money(i.price, cfg.cur)}</span><Btn variant="soft" onClick={() => { setOpen(i.id); setSent(""); }}>{cfg.cta}</Btn></div>
          </li>
        ))}
        {shown.length === 0 && <li className="col-span-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No listings match. Try widening the filters.</li>}
      </ul>

      {cur && (
        <Panel title={`${cfg.cta}: ${cur.title}`} actions={<Btn variant="ghost" onClick={() => setOpen(null)}>Close</Btn>}>
          <form onSubmit={(e) => { e.preventDefault(); if (!enq.name.trim()) return; const to = routing === "owner" ? `${cur.title}'s ${ownerWord}` : `${brand} team`;
            setSent(`Enquiry routed to ${to} (simulated: nothing actually sent).`);
            if (notify.includes("lead")) push("Email + WhatsApp", to, `New enquiry from ${enq.name.trim()} about "${cur.title}": ${enq.msg.trim() || "(no message)"}`);
            if (notify.includes("confirm")) push("Email", enq.name.trim(), `Thanks! Your message about "${cur.title}" was sent. Expect a reply soon.`);
            setOpen(null); setEnq({ name: "", msg: "" }); }} className="grid gap-2 sm:grid-cols-[200px_1fr_auto] sm:items-end">
            <Field label="Your name" value={enq.name} onChange={(e) => setEnq({ ...enq, name: e.target.value })} maxLength={40} />
            <Field label={preset === "jobs" ? "Why you're a fit" : "Message"} value={enq.msg} onChange={(e) => setEnq({ ...enq, msg: e.target.value })} maxLength={200} placeholder={preset === "property" ? "I'd like to view on Saturday" : "Is this still available?"} />
            <Btn type="submit" disabled={!enq.name.trim()}>Send</Btn>
          </form>
        </Panel>
      )}
      <Outbox items={outbox} onClear={() => setOutbox([])} />
    </div>
  );
}
