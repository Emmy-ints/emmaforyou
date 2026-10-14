import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { generateRefCode, submitAffiliate, buildWa } from "@/lib/leads";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/affiliate")({
  component: AffiliatePage,
  head: () =>
    pageHead({
      title: "Affiliate Program — Earn 25% Recurring Commission | EmmaForYou",
      description: "Refer businesses to EmmaForYou and earn 25% recurring commission on every client you send. Get your own referral link in about a minute.",
      path: "/affiliate",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Affiliate program", path: "/affiliate" }])],
    }),
});

function AffiliatePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const link = code ? `https://emmaforyou.lovable.app/?ref=${code}` : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (busy) return;
    setError("");
    const refCode = generateRefCode(name);
    const res = await submitAffiliate({ full_name: name, email, whatsapp, source, referral_code: refCode });
    setBusy(false);
    // Only show a referral link once it's actually registered, otherwise referrals couldn't be credited.
    if (!res.ok) { setError("We couldn't register you just now. Please try again, or message us on WhatsApp."); return; }
    setCode(refCode);
  }

  function copy() {
    try { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* blocked */ }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="mx-auto max-w-5xl px-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">Affiliate Program</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">Earn <span className="gradient-text">25% recurring</span> on every client you refer</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">No experience required. Share your unique link, we close the deal, you get paid every month — for as long as the client stays.</p>
          </motion.div>

          {/* How it works */}
          <h2 className="sr-only">How the affiliate programme works</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { n: 1, t: "Get your link", d: "Sign up in 60 seconds. We give you a unique referral link instantly." },
              { n: 2, t: "Share with anyone", d: "Send to business owners in your network. We close the deal for you." },
              { n: 3, t: "Get paid monthly", d: "25% recurring commission, paid every month they remain a client." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: "var(--gradient-hero-cta)" }}>{s.n}</div>
                <h3 className="mt-4 font-display text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>

          {/* Earnings example */}
          <div className="mt-10 rounded-3xl p-1" style={{ background: "var(--gradient-brand)" }}>
            <div className="rounded-[22px] bg-card p-8 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Earnings example</p>
              <p className="mt-3 font-display text-2xl">Refer 5 clients on the Growth plan ($799/mo)</p>
              <p className="mt-3 font-display text-5xl font-extrabold gradient-text">$998 / month</p>
              <p className="mt-2 text-sm text-muted-foreground">For as long as those clients stay. That's $11,985 / year passive.</p>
            </div>
          </div>

          {/* Form / Result */}
          <div className="mt-10 rounded-3xl border border-border bg-card p-8">
            {!code ? (
              <form onSubmit={submit} className="grid gap-3">
                <h2 className="font-display text-2xl font-bold">Get your unique referral link</h2>
                <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input className="input" placeholder="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
                <input className="input" placeholder="How will you promote? (Instagram, friends, network...)" value={source} onChange={(e) => setSource(e.target.value)} />
                <button disabled={busy} className="btn-primary-gradient inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white disabled:opacity-60">
                  {busy ? "Generating..." : "Get my link →"}
                </button>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              </form>
            ) : (
              <div className="text-center">
                <p className="font-display text-2xl font-bold">🎉 You're in!</p>
                <p className="mt-2 text-sm text-muted-foreground">Your unique referral link:</p>
                <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row">
                  <input readOnly value={link} className="input flex-1" />
                  <button onClick={copy} className="btn-gold rounded-full px-5 py-2.5 text-sm">{copied ? "Copied ✓" : "Copy"}</button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Your code: <strong>{code}</strong></p>
                <a href={buildWa(`Hi! I just signed up to the affiliate program. My code is ${code}. What's next?`)} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">Get onboarded on WhatsApp →</a>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}