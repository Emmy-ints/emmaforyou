import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import ToolShell from "../components/tools/ToolShell";
import { LeadCapture } from "../components/tools/LeadCapture";
import { breadcrumbLd, pageHead } from "@/lib/seo";

const GROUPS: { name: string; items: string[] }[] = [
  { name: "Accounts and access", items: ["Registration, login and password recovery", "User profiles and preferences", "Roles and permissions", "Email or phone verification", "Admin approval where required", "Account security and session management"] },
  { name: "Core application", items: ["Main dashboard", "Create, view, edit and delete records", "Search, sorting and filtering", "Forms and validation", "File uploads and downloads", "Activity history and status tracking"] },
  { name: "Business operations", items: ["Notifications and reminders", "Tasks and workflow automation", "Reports and analytics", "Approvals and escalation rules", "Import and export", "Audit logs"] },
  { name: "Payments and monetisation", items: ["Payment gateway integration", "Invoices and receipts", "Subscriptions or one-time payments", "Refunds and cancellation handling", "Coupons, referrals or rewards", "Transaction and payout records"] },
  { name: "Integrations and AI", items: ["External API integrations", "Email, SMS or WhatsApp messaging", "Calendar synchronisation", "AI assistant or document processing", "Automation triggers and webhooks", "Error handling and integration monitoring"] },
  { name: "Production readiness", items: ["Responsive and accessible interface", "Data protection and authorisation tests", "Backups and recovery", "Performance and load testing", "Monitoring and error reporting", "Deployment, documentation and maintenance"] },
];
const ALL = GROUPS.flatMap((g) => g.items);
const ESSENTIAL = new Set(["Registration, login and password recovery", "Roles and permissions", "Main dashboard", "Create, view, edit and delete records", "Forms and validation", "Responsive and accessible interface", "Data protection and authorisation tests", "Backups and recovery", "Deployment, documentation and maintenance"]);
const PRESETS: Record<string, string[]> = {
  "Booking app": ["Registration, login and password recovery", "Main dashboard", "Forms and validation", "Notifications and reminders", "Payment gateway integration", "Calendar synchronisation", "Email, SMS or WhatsApp messaging", "Refunds and cancellation handling", "Reports and analytics"],
  "CRM": ["Registration, login and password recovery", "Roles and permissions", "Main dashboard", "Create, view, edit and delete records", "Search, sorting and filtering", "Activity history and status tracking", "Notifications and reminders", "Tasks and workflow automation", "Reports and analytics", "Import and export", "Email, SMS or WhatsApp messaging"],
  "Online store": ["Registration, login and password recovery", "Search, sorting and filtering", "Payment gateway integration", "Invoices and receipts", "Refunds and cancellation handling", "Coupons, referrals or rewards", "Notifications and reminders", "Reports and analytics"],
  "Client portal": ["Registration, login and password recovery", "Roles and permissions", "Main dashboard", "File uploads and downloads", "Activity history and status tracking", "Approvals and escalation rules", "Invoices and receipts", "Notifications and reminders"],
  "AI assistant": ["AI assistant or document processing", "Email, SMS or WhatsApp messaging", "External API integrations", "Audit logs", "Error handling and integration monitoring", "Reports and analytics"],
};
const KEY = "efy_app_planner";

export const Route = createFileRoute("/solutions/app-planner")({
  component: Page,
  head: () =>
    pageHead({
      title: "App Feature Planner — Scope Your App in Minutes",
      description: "Free app feature planner: tick the 36 building blocks your app needs, see what's essential for a first version, copy the list and get a quote.",
      path: "/solutions/app-planner",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Solutions", path: "/solutions" }, { name: "App feature planner", path: "/solutions/app-planner" }])],
    }),
});

function Page() {
  const [sel, setSel] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); if (Array.isArray(v)) setSel(v.filter((x) => ALL.includes(x))); } catch { /* storage blocked */ } setReady(true); }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify(sel)); } catch { /* storage blocked */ } }, [sel, ready]);

  const toggle = (i: string) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const mvp = sel.filter((s) => ESSENTIAL.has(s));
  const later = sel.filter((s) => !ESSENTIAL.has(s));
  const size = sel.length <= 10 ? "Small (MVP)" : sel.length <= 22 ? "Medium" : "Large";
  const text = useMemo(() => `App feature list (${sel.length} of ${ALL.length})\n\n${GROUPS.map((g) => { const items = g.items.filter((i) => sel.includes(i)); return items.length ? `${g.name}\n${items.map((i) => `- ${i}`).join("\n")}` : ""; }).filter(Boolean).join("\n\n")}`, [sel]);

  return (
    <ToolShell eyebrow="Free tool · Solutions" title="App feature planner" intro="Not sure what your app needs? Tick the building blocks, or start from a common app type. You'll see what belongs in a first version, and can copy the list or send it to us for a quote." width="max-w-6xl"
      answers={[
        { q: "Does every app need all 36 features?", a: "No. Start with the core problem your users have, build the minimum viable product (MVP) first, and add advanced features once you see how people use it." },
        { q: "What does 'essential' mean here?", a: "Features most apps need from day one for security, usability and reliability: logins, permissions, the main records, validation, responsive design, data protection tests, backups and deployment." },
        { q: "Is my selection saved?", a: "Only in this browser, so you can come back to it. Nothing is sent unless you submit the form." },
      ]}>
      <h2 className="sr-only">Choose your features</h2>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Start from:</span>
            {Object.keys(PRESETS).map((p) => <button key={p} type="button" onClick={() => setSel([...new Set([...PRESETS[p], ...ESSENTIAL])])} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-[var(--emma-violet)]">{p}</button>)}
            <button type="button" onClick={() => setSel([])} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:border-[var(--emma-violet)]"><RotateCcw className="h-4 w-4" />Reset</button>
          </div>
          {GROUPS.map((g) => (
            <fieldset key={g.name} className="rounded-[20px] border border-border bg-card p-5">
              <legend className="px-1 font-display text-lg font-semibold">{g.name} <span className="text-sm font-normal text-muted-foreground">({g.items.filter((i) => sel.includes(i)).length}/{g.items.length})</span></legend>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">{g.items.map((i) => (
                <li key={i}><label className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-sm transition ${sel.includes(i) ? "border-[var(--emma-violet)] bg-[color-mix(in_srgb,var(--emma-violet)_6%,transparent)]" : "border-border hover:border-[var(--emma-violet)]"}`}>
                  <input type="checkbox" checked={sel.includes(i)} onChange={() => toggle(i)} className="mt-0.5 accent-[var(--emma-violet)]" />
                  <span>{i}{ESSENTIAL.has(i) && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">Essential</span>}</span>
                </label></li>))}</ul>
            </fieldset>
          ))}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[20px] border border-border bg-card p-5" aria-live="polite">
            <p className="text-sm text-muted-foreground">Selected</p>
            <p className="font-display text-4xl font-semibold">{sel.length}<span className="text-lg text-muted-foreground"> / {ALL.length}</span></p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-[var(--emma-violet)] transition-all" style={{ width: `${(sel.length / ALL.length) * 100}%` }} /></div>
            <p className="mt-3 text-sm">Project size: <strong>{sel.length ? size : "—"}</strong></p>
            <p className="mt-1 text-xs text-muted-foreground">{mvp.length} essential for version 1 · {later.length} could come later</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={!sel.length} onClick={() => { try { navigator.clipboard.writeText(text); } catch { /* blocked */ } setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy list"}</button>
              <Link to="/proposal" className="btn-primary-gradient rounded-full px-3 py-1.5 text-sm font-semibold text-white">Get a proposal</Link>
            </div>
          </div>
          {sel.length > 0 && <LeadCapture tool="App planner" compact title="Send this list for a quote" lead="We'll reply with a scope, timeline and price for your first version." button="Send my list" summary={text} />}
          <p className="text-xs text-muted-foreground">See working examples on the <Link to="/solutions/$category" params={{ category: "business-apps" }} className="font-semibold text-[var(--emma-violet)]">business apps</Link> and <Link to="/solutions/$category" params={{ category: "mobile-desktop" }} className="font-semibold text-[var(--emma-violet)]">mobile apps</Link> pages.</p>
        </aside>
      </div>
    </ToolShell>
  );
}
