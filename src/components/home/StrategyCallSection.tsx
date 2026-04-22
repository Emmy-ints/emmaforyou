import { motion } from "framer-motion";

const WA = "https://wa.me/message/HHGMMWMRJFYUC1?text=Hi%20EmmaForYou!%20I%27d%20like%20to%20book%20my%20free%2030-minute%20strategy%20call.";

export default function StrategyCallSection() {
  const benefits = [
    "Full digital audit of your business",
    "Your top 3 growth opportunities identified",
    "A custom 90-day action plan",
    "Honest advice — no pressure to buy",
  ];
  return (
    <section className="section-padding">
      <motion.div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-8 md:p-14 shadow-xl"
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emma-blue/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emma-blue">
              📞 Free Call
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">
              Book a Free 30-Minute<br/><span className="gradient-text">Strategy Call</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Get on a call with Emmanuel or a senior strategist. We'll review your business, identify your top 3 growth opportunities, and outline a custom plan — for free.
            </p>
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="btn-gold mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold">
              Book My Free Strategy Call →
            </a>
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 align-middle" /> Slots available this week — Lagos · UK · USA time zones
            </p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-6">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">What you'll get:</p>
            <ul className="mt-4 space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emma-blue text-[10px] text-white">✓</span>
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted-foreground">30 minutes · 100% free · No commitment · WhatsApp or Zoom</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
