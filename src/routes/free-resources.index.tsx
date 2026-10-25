import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { LEAD_MAGNETS, type LeadMagnet } from "@/lib/lead-magnets";
import { submitMagnet, buildWa } from "@/lib/leads";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/free-resources/")({
  component: FreeResources,
  head: () =>
    pageHead({
      title: "Free Growth Toolkits — Checklists, Playbooks & Planners",
      description: "Six free toolkits you can use today: digital checklist, Instagram captions, AI automation starter, ad swipe file, WhatsApp playbook and a 90-day growth planner.",
      path: "/free-resources",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Free resources", path: "/free-resources" }])],
    }),
});

function FreeResources() {
  const [open, setOpen] = useState<LeadMagnet | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="mx-auto max-w-6xl px-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">100% Free Toolkits</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">
              Get our best <span className="gradient-text">growth playbooks</span> — free
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              Practical checklists, templates and plans you can use this week. Each one opens as a page you can tick off, copy from and save as a PDF.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {LEAD_MAGNETS.map((m, i) => (
              <motion.button
                key={m.slug}
                onClick={() => setOpen(m)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl text-white" style={{ background: m.gradient }}>{m.icon}</div>
                <h2 className="mt-5 font-display text-xl font-bold">{m.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{m.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{m.format}</span>
                  <span>Free</span>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-foreground group-hover:gap-2 transition-all">
                  Get it free →
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      {open && <DownloadModal magnet={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function DownloadModal({ magnet, onClose }: { magnet: LeadMagnet; onClose: () => void }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [opted, setOpted] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await submitMagnet({
      name: name.trim(), whatsapp: whatsapp.trim(), email: email.trim() || undefined, business_type: businessType.trim() || undefined,
      resource_slug: magnet.slug, resource_title: magnet.title,
      opted_in_weekly: opted,
    });
    setBusy(false);
    if (!res.ok) {
      setError("We couldn't save your details just now. You can still open the toolkit below, or try again.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={magnet.title} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-4 p-6 text-white" style={{ background: magnet.gradient }}>
          <div className="text-4xl">{magnet.icon}</div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold">{magnet.title}</h2>
            <p className="text-xs text-white/80">{magnet.format} · Free</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-white/20 px-3 py-1 text-sm"><span aria-hidden="true">✕</span></button>
        </div>

        {!done ? (
          <form onSubmit={submit} className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">What's inside:</p>
            <ul className="ml-4 list-disc space-y-1 text-sm text-foreground">
              {magnet.inside.slice(0, 3).map((p) => <li key={p}>{p}</li>)}
            </ul>
            <div className="pt-2">
              <input className="input" aria-label="Your name" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <input className="input" aria-label="WhatsApp number" type="tel" autoComplete="tel" placeholder="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
            <input className="input" aria-label="Email (optional)" type="email" autoComplete="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" aria-label="Business type" placeholder="Business type (e.g. Fashion, Clinic)" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={opted} onChange={(e) => setOpted(e.target.checked)} className="mt-0.5" />
              <span>Send me 1 weekly growth tip — unsubscribe anytime</span>
            </label>
            <button disabled={busy} className="btn-primary-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white disabled:opacity-60">
              {busy ? "Saving..." : "Open my free toolkit →"}
            </button>
            {error && (
              <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}{" "}
                <Link to="/free-resources/$slug" params={{ slug: magnet.slug }} className="font-semibold underline">Open the toolkit</Link>
              </div>
            )}
          </form>
        ) : (
          <div className="space-y-3 p-6 text-center">
            <p className="font-display text-2xl font-bold">✅ All set!</p>
            <p className="text-sm text-muted-foreground">Your toolkit is ready. Open it to tick items off, copy templates and save it as a PDF.</p>
            <Link to="/free-resources/$slug" params={{ slug: magnet.slug }} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">Open the toolkit →</Link>
            <p className="text-xs text-muted-foreground">Questions about it? <a href="https://wa.me/message/HHGMMWMRJFYUC1" target="_blank" rel="noopener noreferrer" className="underline">Message us on WhatsApp</a>.</p>
          </div>
        )}
      </div>
    </div>
  );
}