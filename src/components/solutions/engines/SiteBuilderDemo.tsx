import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Btn, Field, ListEditor, Outbox, Panel, Select, uid, useDemoSetting, type EngineProps, type OutboxItem } from "./ui";

type Sec = "hero" | "logos" | "services" | "work" | "testimonials" | "pricing" | "faq" | "cta" | "form";
const LABEL: Record<Sec, string> = { hero: "Hero", logos: "Trust bar", services: "Services / benefits", work: "Projects / case studies", testimonials: "Testimonials", pricing: "Pricing / offer", faq: "FAQ", cta: "Call to action", form: "Lead form" };
const P: Record<string, { headline: string; sub: string; cta: string; sections: Sec[]; services: string[] }> = {
  corporate: { headline: "Logistics you can set your watch by", sub: "Same-day and next-day delivery across West Africa for businesses that can't afford delays.", cta: "Get a quote", sections: ["hero", "logos", "services", "work", "testimonials", "faq", "cta"], services: ["Same-day courier", "Warehousing", "Business accounts"] },
  portfolio: { headline: "Brand and web design for ambitious founders", sub: "A small studio creating identities and websites that make people trust you at first glance.", cta: "Book a discovery call", sections: ["hero", "work", "services", "testimonials", "cta"], services: ["Brand identity", "Website design", "Art direction"] },
  landing: { headline: "Stop losing bookings after hours", sub: "An AI receptionist that answers WhatsApp in seconds and fills your calendar while you sleep.", cta: "Start free trial", sections: ["hero", "logos", "services", "testimonials", "pricing", "faq", "form"], services: ["Instant replies 24/7", "Books into your calendar", "Reminders that cut no-shows"] },
};
const FONTS: Record<string, string> = { "Modern sans": "ui-sans-serif, system-ui, sans-serif", "Elegant serif": "Georgia, 'Times New Roman', serif", "Friendly rounded": "'Trebuchet MS', 'Segoe UI', sans-serif" };

export default function SiteBuilderDemo(props: EngineProps) {
  const { preset, brand, accent } = props;
  const base = P[preset] ?? P.corporate;
  const [headline, setHeadline] = useDemoSetting(props, "headline", base.headline);
  const [sub, setSub] = useDemoSetting(props, "sub", base.sub);
  const [cta, setCta] = useDemoSetting(props, "cta", base.cta);
  const [sections, setSections] = useDemoSetting<Sec[]>(props, "sections", base.sections);
  const [services, setServices] = useDemoSetting<string[]>(props, "services", base.services);
  const [nav, setNav] = useDemoSetting<string[]>(props, "nav", ["Home", "Services", "About", "Contact"]);
  const [dark, setDark] = useDemoSetting(props, "dark", false);
  const [font, setFont] = useDemoSetting(props, "font", "Modern sans");
  const [leadTo, setLeadTo] = useDemoSetting(props, "leadTo", "Email + WhatsApp");
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [email, setEmail] = useState("");
  const cfg = { ...base, services };
  const [device, setDevice] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop");
  const [variant, setVariant] = useState<"A" | "B">("A");
  const [lead, setLead] = useState("");
  const all = Object.keys(LABEL) as Sec[];
  const move = (s: Sec, d: number) => setSections((ss) => { const i = ss.indexOf(s); const j = i + d; if (j < 0 || j >= ss.length) return ss; const n = [...ss]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const width = device === "Desktop" ? "100%" : device === "Tablet" ? "640px" : "360px";
  const bg = dark ? "#0f1226" : "#ffffff", fg = dark ? "#f1f2ff" : "#0f172a", muted = dark ? "#a6abd0" : "#64748b", card = dark ? "#171b3d" : "#f6f7fb";
  const shownHeadline = variant === "B" ? `${brand}: ${headline.charAt(0).toLowerCase()}${headline.slice(1)}` : headline;
  const narrow = device === "Mobile";

  const render = (s: Sec) => {
    switch (s) {
      case "hero": return <section key={s} style={{ padding: narrow ? "36px 18px" : "56px 40px", background: `linear-gradient(135deg, ${accent}22, transparent 60%)` }}><p style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{brand.toUpperCase()}</p><h1 style={{ fontSize: narrow ? 26 : 38, lineHeight: 1.1, fontWeight: 700, marginTop: 8, maxWidth: 560 }}>{shownHeadline}</h1><p style={{ color: muted, marginTop: 12, maxWidth: 520, fontSize: 15 }}>{sub}</p><span style={{ display: "inline-block", marginTop: 18, background: accent, color: "#fff", borderRadius: 999, padding: "10px 20px", fontWeight: 600, fontSize: 14 }}>{cta} →</span></section>;
      case "logos": return <section key={s} style={{ padding: "16px 24px", display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", color: muted, fontSize: 13, fontWeight: 600, opacity: 0.8 }}>{["Northwind", "Kora", "Prime", "Delta", "Apex"].map((x) => <span key={x}>{x}</span>)}</section>;
      case "services": return <section key={s} style={{ padding: "32px 24px" }}><h2 style={{ fontSize: 20, fontWeight: 700 }}>{preset === "landing" ? "Why it works" : "What we do"}</h2><div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "repeat(3, 1fr)", gap: 12, marginTop: 14 }}>{cfg.services.map((x) => <div key={x} style={{ background: card, borderRadius: 14, padding: 16 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: accent, opacity: 0.85 }} /><p style={{ fontWeight: 600, marginTop: 10 }}>{x}</p><p style={{ color: muted, fontSize: 13, marginTop: 4 }}>Short, benefit-led description (sample text).</p></div>)}</div></section>;
      case "work": return <section key={s} style={{ padding: "32px 24px" }}><h2 style={{ fontSize: 20, fontWeight: 700 }}>Selected work</h2><div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 12, marginTop: 14 }}>{["Project one", "Project two"].map((x, i) => <div key={x} style={{ borderRadius: 14, overflow: "hidden", background: card }}><div style={{ height: 110, background: `linear-gradient(135deg, ${accent}, ${i ? "#0ea5e9" : "#f59e0b"})` }} /><p style={{ padding: 12, fontWeight: 600 }}>{x} <span style={{ color: muted, fontWeight: 400, fontSize: 12 }}>· sample placeholder</span></p></div>)}</div></section>;
      case "testimonials": return <section key={s} style={{ padding: "32px 24px", background: card }}><p style={{ fontSize: 17, fontStyle: "italic", maxWidth: 560 }}>"Your clients' words go here: what changed after working with you."</p><p style={{ color: muted, marginTop: 8, fontSize: 13 }}>— Sample client name, Company</p></section>;
      case "pricing": return <section key={s} style={{ padding: "32px 24px" }}><h2 style={{ fontSize: 20, fontWeight: 700 }}>Simple pricing</h2><div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 12, marginTop: 14 }}>{[["Starter", "$29"], ["Pro", "$79"]].map(([n, p], i) => <div key={n} style={{ border: `2px solid ${i ? accent : "transparent"}`, background: card, borderRadius: 14, padding: 16 }}><p style={{ fontWeight: 600 }}>{n}</p><p style={{ fontSize: 26, fontWeight: 700 }}>{p}<span style={{ fontSize: 13, color: muted }}>/mo · example</span></p></div>)}</div></section>;
      case "faq": return <section key={s} style={{ padding: "32px 24px" }}><h2 style={{ fontSize: 20, fontWeight: 700 }}>FAQ</h2>{["How long does it take?", "Do you offer support?"].map((q) => <details key={q} style={{ borderBottom: `1px solid ${dark ? "#2a2f5a" : "#e2e8f0"}`, padding: "10px 0" }}><summary style={{ cursor: "pointer", fontWeight: 600 }}>{q}</summary><p style={{ color: muted, fontSize: 13, marginTop: 6 }}>A clear, honest answer that removes a reason not to buy.</p></details>)}</section>;
      case "cta": return <section key={s} style={{ padding: "36px 24px", textAlign: "center", background: accent, color: "#fff" }}><h2 style={{ fontSize: 22, fontWeight: 700 }}>Ready to get started?</h2><span style={{ display: "inline-block", marginTop: 12, background: "#fff", color: accent, borderRadius: 999, padding: "10px 20px", fontWeight: 700 }}>{cta}</span></section>;
      case "form": return <section key={s} style={{ padding: "32px 24px" }}><h2 style={{ fontSize: 20, fontWeight: 700 }}>Get started</h2><form onSubmit={(e) => { e.preventDefault(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setLead("invalid"); return; } setLead("ok"); setOutbox((o) => [...o, { id: uid(), channel: leadTo, to: `${brand} team`, text: `New lead from the ${preset === "landing" ? "landing page" : "website"} form: ${email.trim()}${preset === "landing" ? ` (headline variant ${variant})` : ""}` }].slice(-20)); setEmail(""); }} noValidate style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}><input aria-label="Email (preview form)" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={{ flex: 1, minWidth: 180, border: `1px solid ${dark ? "#2a2f5a" : "#cbd5e1"}`, borderRadius: 10, padding: "10px 12px", background: bg, color: fg }} /><button type="submit" style={{ background: accent, color: "#fff", borderRadius: 10, padding: "10px 16px", fontWeight: 600 }}>{cta}</button></form>{lead === "ok" && <p style={{ color: "#16a34a", fontSize: 13, marginTop: 8 }}>✓ Lead captured (preview). See the notification preview below.</p>}{lead === "invalid" && <p role="alert" style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>Enter a valid email address.</p>}</section>;
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <Panel title="Content">
          <div className="space-y-2">
            <Field label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={90} />
            <label className="block text-xs font-medium text-muted-foreground">Sub-headline<textarea value={sub} onChange={(e) => setSub(e.target.value)} rows={3} maxLength={200} className="mt-1 block w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-[var(--demo-accent)]" /></label>
            <Field label="Button text" value={cta} onChange={(e) => setCta(e.target.value)} maxLength={30} />
          </div>
        </Panel>
        <Panel title="Services and menu">
          <div className="space-y-3"><ListEditor label="Service cards" items={services} onChange={setServices} min={1} max={6} placeholder="e.g. Installation" /><ListEditor label="Menu links" items={nav} onChange={setNav} min={1} max={6} placeholder="e.g. Blog" /></div>
        </Panel>
        <Panel title="Sections">
          <ul className="space-y-1">{all.map((s) => { const on = sections.includes(s); return (
            <li key={s} className="flex items-center gap-2 text-sm">
              <input type="checkbox" id={`sec-${s}`} checked={on} onChange={(e) => setSections((ss) => (e.target.checked ? [...ss, s] : ss.filter((x) => x !== s)))} className="accent-[var(--demo-accent)]" />
              <label htmlFor={`sec-${s}`} className="flex-1">{LABEL[s]}</label>
              {on && <><button type="button" aria-label={`Move ${LABEL[s]} up`} onClick={() => move(s, -1)} className="rounded p-0.5 text-muted-foreground hover:bg-muted"><ChevronUp className="h-4 w-4" /></button><button type="button" aria-label={`Move ${LABEL[s]} down`} onClick={() => move(s, 1)} className="rounded p-0.5 text-muted-foreground hover:bg-muted"><ChevronDown className="h-4 w-4" /></button></>}
            </li>); })}</ul>
        </Panel>
        <Panel title="Style">
          <div className="grid grid-cols-2 gap-2">
            <Select label="Font" value={font} onChange={(e) => setFont(e.target.value)} options={Object.keys(FONTS)} />
            <Select label="Theme" value={dark ? "Dark" : "Light"} onChange={(e) => setDark(e.target.value === "Dark")} options={["Light", "Dark"]} />
          </div>
          <Select label="Form leads go to" value={leadTo} onChange={(e) => setLeadTo(e.target.value)} options={["Email + WhatsApp", "CRM + email", "Google Sheet"]} className="mt-2" />
          {preset === "landing" && <div className="mt-3"><p className="text-xs font-medium text-muted-foreground">A/B test headline</p><div className="mt-1 flex rounded-full border border-border p-0.5 text-xs font-semibold">{(["A", "B"] as const).map((v) => <button key={v} type="button" aria-pressed={variant === v} onClick={() => setVariant(v)} className={`flex-1 rounded-full py-1 ${variant === v ? "bg-[var(--demo-accent)] text-white" : ""}`}>Variant {v}</button>)}</div></div>}
        </Panel>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between"><div className="flex rounded-full border border-border p-0.5 text-xs font-semibold" role="group" aria-label="Preview size">{(["Desktop", "Tablet", "Mobile"] as const).map((d) => <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`rounded-full px-3 py-1 ${device === d ? "bg-[var(--demo-accent)] text-white" : "text-muted-foreground"}`}>{d}</button>)}</div><Btn variant="ghost" onClick={() => setSections(base.sections)}>Default layout</Btn></div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-muted/40 p-3">
          <div className="mx-auto overflow-hidden rounded-xl shadow-lg transition-all duration-300" style={{ width, maxWidth: "100%", background: bg, color: fg, fontFamily: FONTS[font] }}>
            <div className="flex items-center justify-between px-5 py-3 text-sm" style={{ borderBottom: `1px solid ${dark ? "#2a2f5a" : "#e2e8f0"}` }}><strong>{brand}</strong>{!narrow && <span style={{ color: muted }}>{nav.join(" · ")}</span>}<span style={{ background: accent, color: "#fff", borderRadius: 999, padding: "4px 12px", fontSize: 12 }}>{cta}</span></div>
            {sections.map(render)}
            <footer style={{ padding: "16px 24px", color: muted, fontSize: 12 }}>© {new Date().getFullYear()} {brand} · Preview built in the EmmaForYou demo</footer>
          </div>
        </div>
        <div className="mt-3"><Outbox items={outbox} onClear={() => setOutbox([])} /></div>
      </div>
    </div>
  );
}
