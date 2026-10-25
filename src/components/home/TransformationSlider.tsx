import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, CalendarCheck, MessageCircle, Sparkles, Star } from "lucide-react";
import SectionHead from "../future/SectionHead";
import { track } from "@/lib/analytics";

/**
 * "Virtual staging" for businesses: drag across to see a dated site become a premium, conversion-ready one.
 * Both sides are illustrative mock-ups drawn in code (no stock photos), themed per industry.
 */

interface Niche {
  id: string;
  label: string;
  name: string;
  tagline: string;
  cta: string;
  accent: string;
  accentSoft: string;
  items: string[];
  stat: string;
}

const NICHES: Niche[] = [
  { id: "restaurant", label: "Restaurant", name: "Mama's Kitchen", tagline: "Lagos' favourite jollof, delivered hot.", cta: "Order on WhatsApp", accent: "#e8590c", accentSoft: "#fff4e6", items: ["Smoky Jollof", "Peppered Chicken", "Small Chops Tray"], stat: "Online orders" },
  { id: "salon", label: "Salon & Beauty", name: "Glow Studio", tagline: "Braids, nails and lashes — book in 30 seconds.", cta: "Book an appointment", accent: "#c2255c", accentSoft: "#fff0f6", items: ["Knotless Braids", "Gel Manicure", "Lash Lift"], stat: "Bookings" },
  { id: "realestate", label: "Real Estate", name: "Prime Homes", tagline: "Verified homes in Lekki, Ikoyi & Abuja.", cta: "Schedule a viewing", accent: "#1c7ed6", accentSoft: "#e7f5ff", items: ["4-Bed Duplex · Lekki", "3-Bed Flat · Ikoyi", "Terrace · Maitama"], stat: "Viewing requests" },
  { id: "fashion", label: "Fashion", name: "Adire & Co.", tagline: "Hand-dyed pieces, shipped worldwide.", cta: "Shop the collection", accent: "#7048e8", accentSoft: "#f3f0ff", items: ["Indigo Kaftan", "Adire Two-Piece", "Silk Headwrap"], stat: "Checkouts" },
  { id: "clinic", label: "Clinic", name: "CareFirst Clinic", tagline: "See a doctor today — no long queues.", cta: "Book a consultation", accent: "#0c8599", accentSoft: "#e3fafc", items: ["General Check-up", "Dental Cleaning", "Lab Tests"], stat: "Appointments" },
  { id: "coach", label: "Coach & Consultant", name: "Rise with Tolu", tagline: "Business coaching for ambitious founders.", cta: "Book a free discovery call", accent: "#2b8a3e", accentSoft: "#ebfbee", items: ["1:1 Coaching", "Group Mastermind", "Strategy Intensive"], stat: "Discovery calls" },
];

export default function TransformationSlider() {
  const [niche, setNiche] = useState<Niche>(NICHES[0]);
  const [pos, setPos] = useState(50);
  const [interacted, setInteracted] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // A gentle sweep the first time the slider scrolls into view, so people know it can be dragged.
  useEffect(() => {
    const el = frame.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || interacted) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const t = (now - start) / 2200;
        if (t >= 1 || dragging.current) return setPos(50);
        setPos(50 + Math.sin(t * Math.PI * 2) * 28);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [interacted]);

  const moveTo = (clientX: number) => {
    const r = frame.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  const firstTouch = () => {
    if (!interacted) {
      setInteracted(true);
      track("cta_click", { name: "transformation_slider", niche: niche.id });
    }
  };

  return (
    <section id="transformation" className="section-padding relative overflow-hidden bg-background">
      <div className="mx-auto max-w-6xl">
        <SectionHead align="center" className="max-w-3xl" kicker={<><ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" /> Before → After</>}
          title="See what we'd do for your business" shine={["your", "business"]}
          sub="Pick your industry and drag the handle. Same business, completely different first impression — and a website that actually takes orders, bookings and enquiries." />

        {/* Industry picker */}
        <div className="ts-picker mt-10" role="tablist" aria-label="Choose your industry">
          {NICHES.map((n) => (
            <button
              key={n.id}
              role="tab"
              aria-selected={n.id === niche.id}
              onClick={() => { setNiche(n); setPos(50); track("cta_click", { name: "transformation_niche", niche: n.id }); }}
              className="ts-pick"
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* Compare frame */}
        <div
          ref={frame}
          data-scroll
          style={{ touchAction: "pan-y", ["--pos" as string]: pos }}
          className="ts-frame relative mx-auto mt-8 aspect-[16/11] w-full max-w-5xl select-none overflow-hidden rounded-[22px] border border-border bg-card shadow-2xl sm:aspect-[16/9]"
          onPointerDown={(e) => { dragging.current = true; firstTouch(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); moveTo(e.clientX); }}
          onPointerMove={(e) => { if (dragging.current) moveTo(e.clientX); }}
          onPointerUp={() => { dragging.current = false; }}
          onPointerCancel={() => { dragging.current = false; }}
        >
          {/* AFTER (full) */}
          <AfterSite n={niche} />
          {/* BEFORE (clipped to the left of the handle) */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} aria-hidden="true">
            <BeforeSite n={niche} />
          </div>

          <span className="ts-label left-3">Before</span>
          <span className="ts-label right-3 ts-label-after">After · EmmaForYou</span>

          {/* Handle */}
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
            <div className="absolute inset-y-0 -translate-x-1/2 w-[3px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_0_24px_rgba(0,0,0,0.25)]" />
            <div className="ts-knob">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(pos)}
            onChange={(e) => { firstTouch(); setPos(Number(e.target.value)); }}
            aria-label="Compare before and after"
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <p className="text-sm text-muted-foreground">Illustrative mock-up. Your real site is designed around your brand, photos and customers.</p>
          <a href="#prototype" data-track="transformation_try_prototype" className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5">
            <Sparkles className="h-4 w-4" /> Generate one for my business
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mock-ups                                                            */
/* ------------------------------------------------------------------ */

function BeforeSite({ n }: { n: Niche }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f3f1ea] text-[#222]" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <div className="flex items-center justify-between border-b-2 border-[#999] bg-[#d8d4c8] px-[3%] py-[1.6%]">
        <span className="text-[clamp(10px,1.8vw,18px)] font-bold underline">{n.name.toUpperCase()}</span>
        <span className="hidden gap-3 text-[clamp(8px,1.1vw,12px)] text-[#0000ee] underline sm:flex"><span>Home</span><span>About Us</span><span>Gallery</span><span>Contact</span></span>
      </div>
      <div className="px-[4%] py-[3%]">
        <p className="text-[clamp(14px,3vw,30px)] font-bold">WELCOME TO OUR WEBSITE!!!</p>
        <p className="mt-[1.5%] max-w-[85%] text-[clamp(8px,1.2vw,13px)] leading-snug">
          We are the best in the business. We offer quality services at affordable prices. Please call us for more information or visit our office during working hours. Thank you for visiting.
        </p>
        <div className="mt-[3%] grid grid-cols-3 gap-[2%]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex aspect-[4/3] items-center justify-center border border-dashed border-[#888] bg-[#e2dfd5] text-[clamp(7px,1vw,11px)] text-[#777]">image{i + 1}.jpg</div>
          ))}
        </div>
        <p className="mt-[3%] text-[clamp(8px,1.1vw,12px)]">📞 Call: 0803 000 0000 · Opening hours: Mon–Sat</p>
        <p className="mt-[1%] text-[clamp(7px,0.9vw,10px)] text-[#888]">Visitor counter: 001234 · Best viewed in Internet Explorer</p>
      </div>
    </div>
  );
}

function AfterSite({ n }: { n: Niche }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-white text-[#0b0b14]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="absolute -right-[10%] -top-[30%] h-[80%] w-[60%] rounded-full opacity-60 blur-3xl" style={{ background: n.accentSoft }} />
      <div className="relative flex items-center justify-between px-[4%] py-[2.2%]">
        <span className="text-[clamp(10px,1.6vw,17px)] font-extrabold tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {n.name}<span style={{ color: n.accent }}>.</span>
        </span>
        <span className="hidden items-center gap-[clamp(8px,1.6vw,20px)] text-[clamp(8px,1vw,12px)] text-[#555] sm:flex">
          <span>Menu</span><span>Reviews</span><span>Location</span>
          <span className="rounded-full px-3 py-1.5 font-semibold text-white" style={{ background: n.accent }}>{n.cta}</span>
        </span>
      </div>
      <div className="relative grid grid-cols-[1.15fr_1fr] gap-[4%] px-[4%] pt-[2%]">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[clamp(7px,0.9vw,11px)] font-semibold" style={{ background: n.accentSoft, color: n.accent }}>
            <Star className="h-[1em] w-[1em] fill-current" /> 4.9 · 380+ Google reviews
          </span>
          <p className="mt-[4%] text-[clamp(15px,3.3vw,40px)] font-extrabold leading-[1.05] tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>{n.tagline}</p>
          <div className="mt-[5%] flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-[clamp(8px,1.4vw,16px)] py-[clamp(4px,0.8vw,9px)] text-[clamp(8px,1.1vw,13px)] font-semibold text-white shadow-lg" style={{ background: n.accent }}>
              <CalendarCheck className="h-[1.1em] w-[1.1em]" /> {n.cta}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#25d366] px-[clamp(8px,1.4vw,16px)] py-[clamp(4px,0.8vw,9px)] text-[clamp(8px,1.1vw,13px)] font-semibold text-white">
              <MessageCircle className="h-[1.1em] w-[1.1em]" /> WhatsApp
            </span>
          </div>
          <div className="mt-[6%] hidden items-center gap-3 sm:flex">
            <div className="flex -space-x-2">
              {["#ffd8a8", "#d0bfff", "#a5d8ff", "#b2f2bb"].map((c) => <span key={c} className="h-6 w-6 rounded-full border-2 border-white" style={{ background: c }} />)}
            </div>
            <span className="text-[clamp(8px,1vw,12px)] text-[#666]">Loved by customers across the city</span>
          </div>
        </div>
        <div className="space-y-[6%]">
          {n.items.map((item, i) => (
            <div key={item} className="flex items-center gap-[6%] rounded-2xl border border-[#eee] bg-white p-[5%] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="aspect-square w-[22%] shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${n.accentSoft}, ${n.accent}${i === 1 ? "55" : "33"})` }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[clamp(8px,1.15vw,14px)] font-semibold">{item}</p>
                <p className="text-[clamp(7px,0.9vw,11px)] text-[#888]">Available today</p>
              </div>
              <span className="rounded-full px-2 py-1 text-[clamp(7px,0.9vw,11px)] font-semibold" style={{ background: n.accentSoft, color: n.accent }}>Add</span>
            </div>
          ))}
          <div className="rounded-2xl p-[5%] text-white" style={{ background: `linear-gradient(135deg, ${n.accent}, #0b0b14)` }}>
            <p className="text-[clamp(7px,0.9vw,11px)] opacity-80">{n.stat} this week</p>
            <p className="text-[clamp(12px,2vw,24px)] font-extrabold" style={{ fontFamily: "'Poppins', sans-serif" }}>Automated ↑</p>
          </div>
        </div>
      </div>
    </div>
  );
}
