import { useState, useCallback } from "react";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [count] = useState(() => {
    if (typeof window === "undefined") return 247;
    const stored = localStorage.getItem("emma_waitlist");
    const entries = stored ? JSON.parse(stored) : [];
    return 247 + entries.length;
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;
      const stored = localStorage.getItem("emma_waitlist");
      const entries = stored ? JSON.parse(stored) : [];
      entries.push({ email, date: new Date().toISOString() });
      localStorage.setItem("emma_waitlist", JSON.stringify(entries));
      setSubmitted(true);
    },
    [email]
  );

  return (
    <section className="section-padding" style={{ background: "var(--gradient-gold)" }}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-extrabold text-emma-charcoal md:text-5xl">
          Be First. Get Early Access. Grow Faster.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-emma-charcoal/70">
          Join the EmmaForYou waitlist and be among the first businesses to access our full suite of AI-powered growth services. Limited spots. Serious results.
        </p>

        <p className="mt-6 text-sm font-semibold text-emma-charcoal/80">
          🔥 {count} businesses already on the waitlist
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md gap-3">
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-full border-2 border-emma-charcoal/20 bg-white/80 px-5 py-3 text-sm text-emma-charcoal placeholder:text-emma-charcoal/40 focus:border-emma-charcoal/50 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "var(--gradient-dark)" }}
            >
              Join Waitlist
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl bg-white/60 p-6">
            <p className="font-display text-lg font-bold text-emma-charcoal">
              🎉 You're in!
            </p>
            <p className="mt-2 text-sm text-emma-charcoal/70">
              We'll reach out on WhatsApp soon. While you wait —
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
              style={{ background: "var(--gradient-dark)" }}
            >
              Chat With Us Now →
            </a>
          </div>
        )}

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emma-charcoal/70 transition-colors hover:text-emma-charcoal"
        >
          Or chat with us directly on WhatsApp →
        </a>
      </div>
    </section>
  );
}
