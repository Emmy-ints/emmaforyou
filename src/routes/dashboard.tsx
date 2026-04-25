import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import dashboardHero from "@/assets/dashboard-hero.jpg";
import { NOTIFICATIONS } from "@/lib/notifications-data";
import { buildWa } from "@/lib/leads";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Live Results Dashboard — Real Client Outcomes | EmmaForYou" },
      { name: "description", content: "Watch real client results in real time — leads booked, websites launched, automations deployed, ad ROAS, reviews collected." },
      { property: "og:title", content: "Live Results Dashboard" },
      { property: "og:description", content: "Real outcomes from real clients — updating live." },
      { property: "og:image", content: dashboardHero },
    ],
  }),
});

function useCounter(target: number, duration = 1500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setVal(Math.round(target * (0.2 + 0.8 * t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function DashboardPage() {
  const leads = useCounter(12480);
  const sites = useCounter(312);
  const automations = useCounter(1840);
  const reviews = useCounter(8260);
  const adSpend = useCounter(2340000);
  const roas = useCounter(48);

  const [feed, setFeed] = useState(NOTIFICATIONS.slice(0, 8));
  useEffect(() => {
    const id = setInterval(() => {
      setFeed((prev) => {
        const next = [NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)], ...prev].slice(0, 8);
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24">
        <section className="mx-auto max-w-6xl px-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" /></span>
              LIVE · Updates every few seconds
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">Real outcomes. <span className="gradient-text">Updated live.</span></h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">No hand-picked case studies. No vanity stats. This is what's happening across our client roster — right now.</p>
          </motion.div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <Kpi label="Leads booked this year" value={leads.toLocaleString()} icon="🎯" />
            <Kpi label="Websites launched" value={sites.toLocaleString()} icon="🌐" />
            <Kpi label="Automations deployed" value={automations.toLocaleString()} icon="⚡" />
            <Kpi label="Reviews collected" value={reviews.toLocaleString()} icon="⭐" />
            <Kpi label="Ad spend managed" value={`$${(adSpend / 1000000).toFixed(2)}M`} icon="📈" />
            <Kpi label="Average ROAS" value={`${(roas / 10).toFixed(1)}x`} icon="🚀" highlight />
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-display text-base font-bold uppercase tracking-widest text-muted-foreground">Live activity feed</h3>
              <ul className="mt-4 space-y-2">
                {feed.map((n, i) => (
                  <motion.li key={`${n.text}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                    <span className="text-lg">{n.emoji}</span>
                    <span className="flex-1">{n.text}</span>
                    <span className="text-xs text-muted-foreground">{n.location}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <img src={dashboardHero} alt="EmmaForYou dashboard" className="h-64 w-full object-cover" />
              <div className="p-6">
                <h3 className="font-display text-xl font-bold">Want to see your business on this dashboard?</h3>
                <p className="mt-2 text-sm text-muted-foreground">Every client gets tracked, optimised and reported in real time. Let's add yours.</p>
                <a href={buildWa("Hi! I want to start tracking my growth on the EmmaForYou dashboard.")} target="_blank" rel="noopener noreferrer" className="btn-primary-gradient mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">Get started →</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Kpi({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl p-6 ${highlight ? "text-white" : "border border-border bg-card"}`} style={highlight ? { background: "var(--gradient-hero-cta)" } : undefined}>
      <div className="text-2xl">{icon}</div>
      <p className="mt-3 font-display text-3xl font-extrabold">{value}</p>
      <p className={`mt-1 text-xs uppercase tracking-wider ${highlight ? "text-white/85" : "text-muted-foreground"}`}>{label}</p>
    </div>
  );
}