import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { SEQUENCES, pickSequence, GOAL_TO_SEQ } from "@/lib/email-templates";
import { submitEmailGen, buildWa } from "@/lib/leads";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/email-generator")({
  component: EmailGen,
  head: () =>
    pageHead({
      title: "Free Email Sequence Generator — 5 Emails in 60 Seconds",
      description: "Generate a ready-to-use 5-email sequence for your business: welcome, abandoned cart, re-engagement or product launch. Free, no sign-up.",
      path: "/email-generator",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Email sequence generator", path: "/email-generator" }])],
    }),
});

const GOALS = Object.keys(GOAL_TO_SEQ);
const BIZ = ["Restaurant", "Fashion", "Clinic", "Coach", "Ecommerce", "Other"];
const TONES = ["Friendly", "Professional", "Bold", "Warm"];

function EmailGen() {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Restaurant");
  const [goal, setGoal] = useState("Welcome");
  const [tone, setTone] = useState("Friendly");
  const [busy, setBusy] = useState(false);

  const seqKey = pickSequence(goal, businessType);
  const items = SEQUENCES[seqKey]?.({ businessName: businessName || "Your Brand", ownerName: name || "Friend" }) || [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await submitEmailGen({ name, email, whatsapp, business_name: businessName, business_type: businessType, sequence_goal: goal, tone });
    setBusy(false);
    setStep("preview");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="mx-auto max-w-5xl px-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">AI Email Generator · Free</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">Get your <span className="gradient-text">5-email sequence</span> in 60 seconds</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">Tell us about your business. We'll write a tested 5-email sequence you can paste into your email tool today.</p>
          </motion.div>

          {step === "form" ? (
            <form onSubmit={submit} className="mx-auto mt-12 max-w-2xl rounded-3xl border border-border bg-card p-8">
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input className="input" placeholder="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input className="input" placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
                <select className="input" value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                  {BIZ.map((b) => <option key={b}>{b}</option>)}
                </select>
                <select className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
                  {GOALS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tone</p>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button key={t} type="button" onClick={() => setTone(t)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${tone === t ? "bg-foreground text-background" : "border border-border bg-background text-muted-foreground hover:text-foreground"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <button disabled={busy} className="btn-primary-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-semibold text-white disabled:opacity-60">
                {busy ? "Generating..." : "Generate my sequence →"}
              </button>
            </form>
          ) : (
            <div className="mt-12">
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your 5-email sequence · {goal} · {tone} tone</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{businessName || "Your Brand"} · {businessType}</h3>
                <div className="mt-6 space-y-4">
                  {items.map((it) => (
                    <div key={it.day} className="rounded-2xl border border-border bg-background p-5">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background">Day {it.day}</span>
                        <span className="text-xs text-muted-foreground">5 min to read</span>
                      </div>
                      <h4 className="mt-3 font-display text-lg font-bold">{it.subject}</h4>
                      <p className="mt-1 text-xs text-muted-foreground italic">Preview: {it.preview}</p>
                      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{it.body}</pre>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-muted/40 p-5 text-center">
                  <p className="font-display text-base font-bold">Want us to set this up + automate it?</p>
                  <a href={buildWa(`Hi! I generated a "${goal}" sequence for ${businessName}. Can you set it up in my email tool?`)} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient mt-3 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">Talk to a strategist →</a>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <style>{`.input { display:block; width:100%; padding:0.625rem 0.875rem; border-radius:0.75rem; background: hsl(var(--background)); border:1px solid hsl(var(--border)); color: inherit; font-size:0.95rem; }`}</style>
    </div>
  );
}