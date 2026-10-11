import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, CalendarCheck, CheckCircle2, Inbox, LayoutGrid, LineChart, MessageCircle, Settings2, Star, Users, Zap } from "lucide-react";

/**
 * Hero product interface: a scripted, clearly-labelled demo of the systems EmmaForYou builds.
 * One enquiry flows through capture → AI reply → booking → CRM → review, then the next business takes a turn.
 */

type StepKind = "message" | "ai" | "booking" | "crm" | "review";

interface Scenario {
  business: string;
  niche: string;
  customer: string;
  steps: { kind: StepKind; title: string; body: string }[];
}

const SCENARIOS: Scenario[] = [
  {
    business: "Glow Studio",
    niche: "Salon · Lagos",
    customer: "Amara",
    steps: [
      { kind: "message", title: "New WhatsApp enquiry", body: "Hi! Do you have a slot for knotless braids on Saturday?" },
      { kind: "ai", title: "AI reply sent in 4s", body: "Yes, Amara — Saturday 10:00 or 14:00 are free. Tap a time to book." },
      { kind: "booking", title: "Booking confirmed", body: "Sat 10:00 · Knotless braids · ₦35,000 deposit paid" },
      { kind: "crm", title: "Added to CRM", body: "Reminder scheduled for Friday 18:00" },
      { kind: "review", title: "Review requested", body: "Sent 2 hours after the appointment" },
    ],
  },
  {
    business: "Prime Homes",
    niche: "Real estate · Maryland",
    customer: "Daniel",
    steps: [
      { kind: "message", title: "Website enquiry", body: "Is the 3-bed in Columbia still available? I'd like to view it." },
      { kind: "ai", title: "AI reply sent in 6s", body: "It is, Daniel. Thursday 5pm or Saturday 11am work for a viewing." },
      { kind: "booking", title: "Viewing booked", body: "Sat 11:00 · 3-bed, Columbia · Agent notified" },
      { kind: "crm", title: "Lead scored: hot", body: "Pre-approved buyer · Follow-up sequence started" },
      { kind: "review", title: "Similar listings sent", body: "3 matches emailed after the viewing" },
    ],
  },
  {
    business: "Mama's Kitchen",
    niche: "Restaurant · Abuja",
    customer: "Tolu",
    steps: [
      { kind: "message", title: "Instagram DM", body: "Can I order the jollof tray for 20 people on Sunday?" },
      { kind: "ai", title: "AI reply sent in 3s", body: "Absolutely, Tolu! Here's the party menu and a link to confirm." },
      { kind: "booking", title: "Order confirmed", body: "Sun 13:00 · Party tray × 20 · Paid online" },
      { kind: "crm", title: "Added to VIP list", body: "Birthday offer queued for next month" },
      { kind: "review", title: "Review requested", body: "Google review link sent after delivery" },
    ],
  },
];

const ICONS: Record<StepKind, typeof MessageCircle> = {
  message: MessageCircle,
  ai: Bot,
  booking: CalendarCheck,
  crm: Users,
  review: Star,
};

const STEP_MS = 1700;

export default function GrowthOS() {
  const reduce = useReducedMotion();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [shown, setShown] = useState(reduce ? 5 : 1);
  const [paused, setPaused] = useState(false);
  const scenario = SCENARIOS[scenarioIndex];

  useEffect(() => {
    if (reduce || paused) return;
    const t = setTimeout(() => {
      if (shown < scenario.steps.length) setShown((n) => n + 1);
      else {
        setScenarioIndex((i) => (i + 1) % SCENARIOS.length);
        setShown(1);
      }
    }, shown < scenario.steps.length ? STEP_MS : STEP_MS * 2.2);
    return () => clearTimeout(t);
  }, [shown, scenario, reduce, paused]);

  const progress = shown / scenario.steps.length;

  return (
    <div
      className="gos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="Demo of an EmmaForYou automation workspace using sample data"
    >
      {/* Window chrome */}
      <div className="gos-bar">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="gos-dot" />
          <span className="gos-dot" />
          <span className="gos-dot" />
        </div>
        <span className="gos-title">EmmaForYou Growth OS</span>
        <span className="gos-badge"><span className="gos-live" />Live demo · sample data</span>
      </div>

      <div className="gos-body">
        {/* Rail */}
        <nav className="gos-rail" aria-hidden="true">
          {[Inbox, LayoutGrid, Zap, LineChart, Settings2].map((Icon, i) => (
            <span key={i} className={`gos-rail-btn ${i === 0 ? "is-active" : ""}`}><Icon /></span>
          ))}
        </nav>

        {/* Activity stream */}
        <section className="gos-stream">
          <header className="gos-stream-head">
            <div className="min-w-0">
              <p className="gos-biz">{scenario.business}</p>
              <p className="gos-niche">{scenario.niche}</p>
            </div>
            <div className="gos-tabs" role="tablist" aria-label="Demo businesses">
              {SCENARIOS.map((s, i) => (
                <button
                  key={s.business}
                  type="button"
                  role="tab"
                  aria-selected={i === scenarioIndex}
                  className={i === scenarioIndex ? "is-active" : ""}
                  onClick={() => { setScenarioIndex(i); setShown(reduce ? 5 : 1); }}
                >
                  {s.business.split(" ")[0]}
                </button>
              ))}
            </div>
          </header>

          <ol className="gos-steps">
            <AnimatePresence initial={false} mode="popLayout">
              {scenario.steps.slice(0, shown).map((step, i) => {
                const Icon = ICONS[step.kind];
                const isLatest = i === shown - 1;
                return (
                  <motion.li
                    key={`${scenario.business}-${i}`}
                    layout
                    initial={reduce ? false : { opacity: 0, y: 14, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className={`gos-step kind-${step.kind} ${isLatest ? "is-latest" : ""}`}
                  >
                    <span className="gos-step-icon"><Icon /></span>
                    <div className="min-w-0">
                      <p className="gos-step-title">{step.title}</p>
                      <p className="gos-step-body">{step.body}</p>
                    </div>
                    {i < shown - 1 && <CheckCircle2 className="gos-step-done" aria-hidden="true" />}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </section>

        {/* Metrics panel */}
        <aside className="gos-panel">
          <p className="gos-panel-label">This enquiry</p>
          <div className="gos-meter" aria-hidden="true">
            <motion.span animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
          </div>
          <p className="gos-panel-value">{shown === scenario.steps.length ? "Handled end to end" : `Step ${shown} of ${scenario.steps.length}`}</p>
          <p className="gos-panel-sub">Zero manual messages from the owner</p>

          <div className="gos-spark" aria-hidden="true">
            <svg viewBox="0 0 160 56" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gosFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3dd6f5" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3dd6f5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                key={scenario.business}
                d="M0 46 L20 42 L40 44 L60 34 L80 36 L100 24 L120 26 L140 14 L160 8"
                fill="none"
                stroke="#3dd6f5"
                strokeWidth="2"
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, ease: "easeOut" }}
              />
              <path d="M0 46 L20 42 L40 44 L60 34 L80 36 L100 24 L120 26 L140 14 L160 8 L160 56 L0 56 Z" fill="url(#gosFill)" />
            </svg>
            <p>Enquiries answered within minutes, day and night</p>
          </div>

          <ul className="gos-chips" aria-hidden="true">
            <li>WhatsApp</li>
            <li>Instagram</li>
            <li>Website</li>
            <li>Google</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
