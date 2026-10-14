import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitIntake, buildIntakeWhatsApp, type IntakePayload } from "@/lib/leads";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "emma_intake_progress";

const BUSINESS_TYPES = [
  "Fashion / Clothing", "Restaurant / Food", "Real Estate", "Clinic / Healthcare",
  "Beauty / Salon", "Coaching / Consulting", "Ecommerce", "Fitness / Gym",
  "Education / School", "Hotel / Hospitality", "Car Dealer / Auto", "Construction",
  "Photography", "Event Planning", "Law Firm", "Accounting", "Travel Agency",
  "Logistics", "Manufacturing", "Tech / SaaS", "Agriculture", "Pharmacy",
  "Bakery", "Florist", "Catering", "Spa / Wellness", "Music / Artist",
  "Influencer", "Boutique Hotel", "Bar / Lounge", "Tutoring", "NGO / Nonprofit",
  "Church / Religious", "Auto Repair", "Dentist", "Veterinary", "Pet Services",
  "Cleaning Services", "Interior Design", "Architecture", "Marketing Agency",
  "Print Shop", "Hair Stylist", "Barber", "Tailor", "Furniture", "Jewelry",
  "Electronics", "Supermarket", "Other",
];

const COUNTRIES = [
  { code: "🇳🇬", name: "Nigeria" }, { code: "🇺🇸", name: "United States" },
  { code: "🇬🇧", name: "United Kingdom" }, { code: "🇨🇦", name: "Canada" },
  { code: "🇫🇷", name: "France" }, { code: "🇩🇪", name: "Germany" },
  { code: "🇪🇸", name: "Spain" }, { code: "🇮🇹", name: "Italy" },
  { code: "🇿🇦", name: "South Africa" }, { code: "🇬🇭", name: "Ghana" },
  { code: "🇰🇪", name: "Kenya" }, { code: "🇨🇴", name: "Colombia" },
  { code: "🇧🇷", name: "Brazil" }, { code: "🇲🇽", name: "Mexico" },
  { code: "🇦🇺", name: "Australia" }, { code: "🇦🇪", name: "UAE" },
  { code: "🇮🇳", name: "India" }, { code: "🇸🇬", name: "Singapore" },
  { code: "🌍", name: "Other" },
];

const SERVICE_CARDS = [
  { id: "ai-automation", icon: "🤖", name: "AI Automation", desc: "Auto-replies, lead capture, follow-up sequences" },
  { id: "web-design", icon: "🎨", name: "Website Design", desc: "New website or redesign" },
  { id: "web-dev", icon: "💻", name: "Website Development", desc: "Custom features, booking systems, portals" },
  { id: "email", icon: "📧", name: "Email Marketing", desc: "Campaigns, sequences, newsletters" },
  { id: "social", icon: "📱", name: "Social Media Management", desc: "Daily posting, strategy, growth" },
  { id: "ads", icon: "🎯", name: "Paid Advertising", desc: "Meta, Google, TikTok ads" },
  { id: "ecom", icon: "🛒", name: "Ecommerce Setup", desc: "Shopify, product pages, checkout" },
  { id: "app", icon: "📲", name: "App Development", desc: "Mobile or web app for your business" },
  { id: "seo", icon: "🔍", name: "SEO / Google Ranking", desc: "Rank higher on Google search" },
  { id: "content", icon: "🎬", name: "Content Creation", desc: "Photos, videos, graphics for your brand" },
  { id: "whatsapp", icon: "💬", name: "WhatsApp Marketing", desc: "Broadcast lists, chatbots, automation" },
  { id: "crm", icon: "📊", name: "CRM / Lead Management", desc: "Organise and track your leads" },
  { id: "brand", icon: "✨", name: "Brand Identity", desc: "Logo, colours, brand guidelines" },
  { id: "gbp", icon: "📍", name: "Google Business Profile", desc: "Setup, reviews, local SEO" },
  { id: "video", icon: "🎥", name: "Video Marketing", desc: "Reels, YouTube, TikTok strategy" },
  { id: "influencer", icon: "🌟", name: "Influencer Marketing", desc: "Find & manage influencer partners" },
];

const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📷" },
  { id: "facebook", label: "Facebook", icon: "👥" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "youtube", label: "YouTube", icon: "▶️" },
  { id: "twitter", label: "Twitter/X", icon: "🐦" },
];

interface FormData extends Partial<IntakePayload> {
  social_platforms_followers?: Record<string, string>;
}

const STEPS = 8;

export default function BusinessIntakeForm({ onClose, initialDescription }: { onClose?: () => void; initialDescription?: string }) {
  const { lang } = useI18n();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>({
    business_description: initialDescription,
    target_market: [], services_needed: [], communication_preference: [],
    ad_platforms: [], customer_age_min: 25, customer_age_max: 45,
    customer_gender: "Mixed", consent: false, social_platforms_followers: {},
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-restore prompt
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step && parsed.step > 1) setShowRestore(true);
      } catch { /* ignore */ }
    }
  }, []);

  // Auto-save on every change
  useEffect(() => {
    if (typeof window === "undefined" || submitted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    } catch { /* ignore */ }
  }, [step, data, submitted]);

  const restore = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved.data) setData({ ...saved.data, ...(initialDescription ? { business_description: initialDescription } : {}) });
      if (saved.step) setStep(saved.step);
    } catch { /* ignore */ }
    setShowRestore(false);
  };
  const startFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowRestore(false);
  };

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key as string]: "" }));
  }, []);

  const toggleArr = useCallback((key: keyof FormData, value: string) => {
    setData((d) => {
      const arr = (d[key] as string[]) || [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...d, [key]: next };
    });
  }, []);

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!data.full_name?.trim()) e.full_name = "Required";
      if (!data.business_name?.trim()) e.business_name = "Required";
      if (!data.business_type) e.business_type = "Pick a business type";
    }
    if (step === 2 && !data.country) e.country = "Pick a country";
    if (step === 5 && (!data.services_needed || data.services_needed.length === 0)) e.services_needed = "Select at least one service";
    if (step === 6 && !data.primary_goal) e.primary_goal = "Pick a primary goal";
    if (step === 7 && !data.engagement_type) e.engagement_type = "Pick how you want to work with us";
    if (step === 8) {
      if (!data.email?.trim()) e.email = "Required";
      else if (!/^\S+@\S+\.\S+$/.test(data.email)) e.email = "Invalid email";
      if (!data.whatsapp?.trim()) e.whatsapp = "Required";
      if (!data.consent) e.consent = "Please consent to continue";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS)); };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    const payload: IntakePayload = {
      ...(data as IntakePayload),
      social_platforms: data.social_platforms_followers,
      language: lang,
    };
    delete (payload as FormData).social_platforms_followers;
    const res = await submitIntake(payload);
    setSubmitting(false);
    if (!res.ok) { setErrors((e) => ({ ...e, submit: "We couldn't send your profile. Your answers are still here: please try again, or message us on WhatsApp." })); return; }
    setSubmitted(true);
    localStorage.removeItem(STORAGE_KEY);
    setTimeout(() => {
      window.open(buildIntakeWhatsApp(data.business_name || "my business", data.city || data.country || "global"), "_blank");
    }, 1500);
  };

  const progress = (step / STEPS) * 100;

  if (submitted) return <SuccessScreen onClose={onClose} businessName={data.business_name || ""} />;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {showRestore && (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-emma-blue/30 bg-emma-blue/5 p-4 text-center">
          <p className="mb-3 text-sm font-medium">📋 We saved your previous progress. Continue where you left off?</p>
          <div className="flex justify-center gap-2">
            <button onClick={restore} className="rounded-full bg-emma-blue px-4 py-2 text-xs font-semibold text-white">Restore</button>
            <button onClick={startFresh} className="rounded-full border border-border px-4 py-2 text-xs font-semibold">Start Fresh</button>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emma-blue to-emma-pink px-4 py-1.5 text-xs font-bold text-white">
            Step {step} of {STEPS}
          </span>
          <span className="text-xs font-medium text-muted-foreground">{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full" style={{ background: "var(--gradient-brand)" }}
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }} className="rounded-3xl border border-border bg-card p-6 md:p-10 shadow-lg">

          {step === 1 && <Step1 data={data} update={update} errors={errors} />}
          {step === 2 && <Step2 data={data} update={update} toggleArr={toggleArr} errors={errors} />}
          {step === 3 && <Step3 data={data} update={update} setData={setData} />}
          {step === 4 && <Step4 data={data} update={update} toggleArr={toggleArr} />}
          {step === 5 && <Step5 data={data} toggleArr={toggleArr} errors={errors} />}
          {step === 6 && <Step6 data={data} update={update} errors={errors} />}
          {step === 7 && <Step7 data={data} update={update} toggleArr={toggleArr} errors={errors} />}
          {step === 8 && <Step8 data={data} update={update} errors={errors} />}

        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button onClick={back} disabled={step === 1}
          className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold disabled:opacity-30">
          ← Back
        </button>
        {step < STEPS ? (
          <button onClick={next}
            className="rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg"
            style={{ background: "var(--gradient-brand)" }}>
            Next →
          </button>
        ) : (
          <button onClick={submit} disabled={submitting}
            className="rounded-full px-7 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            style={{ background: "var(--gradient-hero-cta)" }}>
            {submitting ? "Sending..." : "Submit My Business Profile →"}
          </button>
        )}
        {errors.submit && <p role="alert" className="mt-3 w-full text-right text-sm text-red-600">{errors.submit}</p>}
      </div>
    </div>
  );
}

// ============ STEP COMPONENTS ============

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className="mb-2 block text-sm font-semibold">{children}{required && <span className="ml-1 text-emma-pink">*</span>}</label>;
}
function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs font-medium text-emma-pink">{msg}</p> : null;
}
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
        active ? "border-emma-blue bg-emma-blue/10 text-emma-blue shadow-sm" : "border-border bg-background hover:border-emma-blue/50"
      }`}>{children}</button>
  );
}

function Step1({ data, update, errors }: any) {
  return (
    <div className="space-y-5">
      <h3 className="font-display text-2xl font-bold">Your Business Identity</h3>
      <p className="text-sm text-muted-foreground">Let's start with the basics.</p>
      <div>
        <FieldLabel required>Full Name</FieldLabel>
        <input value={data.full_name || ""} onChange={(e) => update("full_name", e.target.value)} maxLength={120}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
        <Err msg={errors.full_name} />
      </div>
      <div>
        <FieldLabel required>Business Name</FieldLabel>
        <input value={data.business_name || ""} onChange={(e) => update("business_name", e.target.value)} maxLength={150}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
        <Err msg={errors.business_name} />
      </div>
      <div>
        <FieldLabel required>Business Type</FieldLabel>
        <select value={data.business_type || ""} onChange={(e) => update("business_type", e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none">
          <option value="">Select your business type...</option>
          {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <Err msg={errors.business_type} />
      </div>
      <div>
        <FieldLabel>Describe what your business does</FieldLabel>
        <textarea value={data.business_description || ""} onChange={(e) => update("business_description", e.target.value)} rows={3} maxLength={500}
          placeholder="2-3 sentences about your products/services and customers..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
      </div>
      <div>
        <FieldLabel>How long have you been in business?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["< 1 year", "1–3 years", "3–5 years", "5+ years"].map((y) => (
            <Pill key={y} active={data.years_in_business === y} onClick={() => update("years_in_business", y)}>{y}</Pill>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Business Stage</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Just Starting", "Growing Steadily", "Plateaued", "Ready to Scale", "Rebuilding"].map((s) => (
            <Pill key={s} active={data.business_stage === s} onClick={() => update("business_stage", s)}>{s}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ data, update, toggleArr, errors }: any) {
  const markets = ["Local customers", "National market", "International", "Online only", "B2B clients", "B2C customers", "Both B2B & B2C"];
  return (
    <div className="space-y-5">
      <h3 className="font-display text-2xl font-bold">Location & Market</h3>
      <div>
        <FieldLabel required>Country</FieldLabel>
        <select value={data.country || ""} onChange={(e) => update("country", e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none">
          <option value="">Select country...</option>
          {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.code} {c.name}</option>)}
        </select>
        <Err msg={errors.country} />
      </div>
      <div>
        <FieldLabel>City / State</FieldLabel>
        <input value={data.city || ""} onChange={(e) => update("city", e.target.value)} maxLength={120}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
      </div>
      <div>
        <FieldLabel>Who do you sell to? (multi-select)</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {markets.map((m) => (
            <Pill key={m} active={(data.target_market || []).includes(m)} onClick={() => toggleArr("target_market", m)}>{m}</Pill>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Customer age range: {data.customer_age_min}–{data.customer_age_max}+</FieldLabel>
        <div className="flex items-center gap-3">
          <input type="range" min={18} max={65} value={data.customer_age_min || 18}
            onChange={(e) => update("customer_age_min", parseInt(e.target.value))}
            className="flex-1 accent-[var(--emma-blue)]" />
          <input type="range" min={18} max={65} value={data.customer_age_max || 65}
            onChange={(e) => update("customer_age_max", parseInt(e.target.value))}
            className="flex-1 accent-[var(--emma-pink)]" />
        </div>
      </div>
      <div>
        <FieldLabel>Customer gender</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Mostly Male", "Mostly Female", "Mixed"].map((g) => (
            <Pill key={g} active={data.customer_gender === g} onClick={() => update("customer_gender", g)}>{g}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3({ data, update, setData }: any) {
  const updateFollowers = (id: string, value: string) => {
    setData((d: FormData) => ({
      ...d,
      social_platforms_followers: { ...(d.social_platforms_followers || {}), [id]: value },
    }));
  };
  const togglePlatform = (id: string) => {
    setData((d: FormData) => {
      const followers = { ...(d.social_platforms_followers || {}) };
      if (followers[id] !== undefined) delete followers[id];
      else followers[id] = "";
      return { ...d, social_platforms_followers: followers };
    });
  };
  const ratingEmojis = ["😢", "😐", "🙂", "😍"];
  return (
    <div className="space-y-5">
      <h3 className="font-display text-2xl font-bold">Current Online Presence</h3>
      <div>
        <FieldLabel>Do you have a website?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Yes", "No", "In progress"].map((v) => (
            <Pill key={v} active={data.has_website === v} onClick={() => update("has_website", v)}>{v}</Pill>
          ))}
        </div>
      </div>
      {data.has_website === "Yes" && (
        <>
          <div>
            <FieldLabel>Website URL</FieldLabel>
            <input value={data.website_url || ""} onChange={(e) => update("website_url", e.target.value)} maxLength={500}
              placeholder="https://..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
          </div>
          <div>
            <FieldLabel>How happy are you with your website?</FieldLabel>
            <div className="flex gap-3">
              {ratingEmojis.map((emo, i) => (
                <button key={i} type="button" onClick={() => update("website_rating", i + 1)}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl transition-all ${
                    data.website_rating === i + 1 ? "border-emma-blue bg-emma-blue/10 scale-110" : "border-border"
                  }`}>{emo}</button>
              ))}
            </div>
          </div>
        </>
      )}
      <div>
        <FieldLabel>Social media platforms (tap to add)</FieldLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SOCIAL_PLATFORMS.map((p) => {
            const active = data.social_platforms_followers?.[p.id] !== undefined;
            return (
              <div key={p.id} className={`rounded-xl border-2 p-3 transition-all ${active ? "border-emma-blue bg-emma-blue/5" : "border-border"}`}>
                <button type="button" onClick={() => togglePlatform(p.id)}
                  className="flex w-full items-center gap-2 text-sm font-medium">
                  <span>{p.icon}</span><span>{p.label}</span>
                </button>
                {active && (
                  <input type="text" inputMode="numeric" placeholder="Followers"
                    value={data.social_platforms_followers?.[p.id] || ""}
                    onChange={(e) => updateFollowers(p.id, e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <FieldLabel>Email list size</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["No list yet", "< 100", "100–500", "500–2,000", "2,000–10,000", "10,000+"].map((s) => (
            <Pill key={s} active={data.email_list_size === s} onClick={() => update("email_list_size", s)}>{s}</Pill>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Do you run paid ads?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Yes", "No", "Tried but stopped"].map((v) => (
            <Pill key={v} active={data.runs_ads === v} onClick={() => update("runs_ads", v)}>{v}</Pill>
          ))}
        </div>
      </div>
      {data.runs_ads === "Yes" && (
        <div>
          <FieldLabel>Approximate monthly ad spend</FieldLabel>
          <input value={data.ad_spend || ""} onChange={(e) => update("ad_spend", e.target.value)} maxLength={50}
            placeholder="e.g. $500 / month"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
        </div>
      )}
    </div>
  );
}

function Step4({ data, update, toggleArr }: any) {
  const sources = ["Walk-in customers", "Social media", "Referrals", "Google search", "Paid ads", "Repeat customers", "WhatsApp enquiries", "Other"];
  return (
    <div className="space-y-5">
      <h3 className="font-display text-2xl font-bold">Revenue & Finances</h3>
      <p className="text-xs text-muted-foreground">All info is confidential. We use this to design the right plan for your stage.</p>
      <div>
        <FieldLabel>Current monthly revenue</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["$0–$500", "$500–$2k", "$2k–$10k", "$10k–$25k", "$25k–$50k", "$50k+"].map((r) => (
            <Pill key={r} active={data.monthly_revenue === r} onClick={() => update("monthly_revenue", r)}>{r}</Pill>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Revenue trend</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {[{ v: "Declining", e: "📉" }, { v: "Flat", e: "➡️" }, { v: "Growing slowly", e: "📈" }, { v: "Growing fast", e: "🚀" }].map((t) => (
            <Pill key={t.v} active={data.revenue_trend === t.v} onClick={() => update("revenue_trend", t.v)}>{t.e} {t.v}</Pill>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Biggest revenue source right now</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <Pill key={s} active={data.revenue_source === s} onClick={() => update("revenue_source", s)}>{s}</Pill>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Monthly budget for digital growth</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["$0", "$0–$100", "$100–$500", "$500–$2k", "$2k–$5k", "$5k–$10k", "$10k+"].map((b) => (
            <Pill key={b} active={data.growth_budget === b} onClick={() => update("growth_budget", b)}>{b}</Pill>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Do you have a dedicated marketing budget?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Yes", "No", "Planning to"].map((v) => (
            <Pill key={v} active={data.has_marketing_budget === v} onClick={() => update("has_marketing_budget", v)}>{v}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5({ data, toggleArr, errors }: any) {
  const selected = data.services_needed || [];
  return (
    <div className="space-y-5">
      <h3 className="font-display text-2xl font-bold">What You Need Help With</h3>
      <p className="text-sm text-muted-foreground">Select everything you'd like us to help with — the more, the better the plan.</p>
      <Err msg={errors.services_needed} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_CARDS.map((s) => {
          const active = selected.includes(s.id);
          return (
            <button key={s.id} type="button" onClick={() => toggleArr("services_needed", s.id)}
              className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                active ? "border-emma-blue bg-emma-blue/5 shadow-md" : "border-border hover:border-emma-blue/50"
              }`}>
              {active && <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emma-blue text-xs text-white">✓</div>}
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-2 text-sm font-bold">{s.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{selected.length} selected</p>
    </div>
  );
}

function Step6({ data, update, errors }: any) {
  const goals = ["More leads", "More sales", "More website traffic", "More social followers", "More bookings", "Launch a product", "Build brand awareness", "Automate operations", "Enter new market", "Improve customer retention"];
  return (
    <div className="space-y-5">
      <h3 className="font-display text-2xl font-bold">Goals & Desired Outcomes</h3>
      <p className="text-sm text-muted-foreground">Be specific — this is how we build the right plan.</p>
      <div>
        <FieldLabel required>Primary goal</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {goals.map((g) => (
            <Pill key={g} active={data.primary_goal === g} onClick={() => update("primary_goal", g)}>{g}</Pill>
          ))}
        </div>
        <Err msg={errors.primary_goal} />
      </div>
      <div>
        <FieldLabel>Revenue goal in 6 months</FieldLabel>
        <input value={data.revenue_goal || ""} onChange={(e) => update("revenue_goal", e.target.value)} maxLength={50}
          placeholder="e.g. $10,000 per month"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
      </div>
      <div>
        <FieldLabel>Describe the exact results you want in 3–6 months</FieldLabel>
        <textarea value={data.desired_outcomes || ""} onChange={(e) => update("desired_outcomes", e.target.value)} rows={4} maxLength={1500}
          placeholder="e.g. I want to go from 10 leads per week to 50, increase monthly revenue from $2,000 to $8,000, and have a fully automated WhatsApp follow-up system running..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
      </div>
      <div>
        <FieldLabel>What would make this a 10/10 success for you?</FieldLabel>
        <input value={data.success_metric || ""} onChange={(e) => update("success_metric", e.target.value)} maxLength={300}
          placeholder="In your own words..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
      </div>
      <div>
        <FieldLabel>Timeline expectation</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["30 days", "60 days", "3 months", "6 months", "12 months"].map((t) => (
            <Pill key={t} active={data.timeline === t} onClick={() => update("timeline", t)}>{t}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step7({ data, update, toggleArr, errors }: any) {
  const engagements = [
    { v: "Done-For-You", icon: "🔧", desc: "Just do everything, I'll focus on my business" },
    { v: "Done-With-You", icon: "🤝", desc: "Build it with me, I want to learn" },
    { v: "Coaching/Consulting", icon: "🎓", desc: "Advise me, I'll implement myself" },
    { v: "One-Time Project", icon: "📦", desc: "I need a specific thing built" },
    { v: "Ongoing Retainer", icon: "🔄", desc: "I need a long-term digital partner" },
  ];
  const comms = ["WhatsApp", "Email", "Video calls", "In-person (Lagos)", "Voice calls", "Slack"];
  return (
    <div className="space-y-5">
      <h3 className="font-display text-2xl font-bold">How You Want to Work With Us</h3>
      <div>
        <FieldLabel required>Type of engagement</FieldLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {engagements.map((e) => (
            <button key={e.v} type="button" onClick={() => update("engagement_type", e.v)}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                data.engagement_type === e.v ? "border-emma-blue bg-emma-blue/5 shadow-md" : "border-border hover:border-emma-blue/50"
              }`}>
              <div className="text-2xl">{e.icon}</div>
              <div className="mt-1 text-sm font-bold">{e.v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{e.desc}</div>
            </button>
          ))}
        </div>
        <Err msg={errors.engagement_type} />
      </div>
      <div>
        <FieldLabel>Communication preference</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {comms.map((c) => (
            <Pill key={c} active={(data.communication_preference || []).includes(c)} onClick={() => toggleArr("communication_preference", c)}>{c}</Pill>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>How quickly do you want to start?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["ASAP — This week", "Within 2 weeks", "This month", "Next month", "Just exploring"].map((t) => (
            <Pill key={t} active={data.start_timeline === t} onClick={() => update("start_timeline", t)}>{t}</Pill>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Have you worked with a digital agency before?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Yes", "No"].map((v) => (
            <Pill key={v} active={data.worked_with_agency === v} onClick={() => update("worked_with_agency", v)}>{v}</Pill>
          ))}
        </div>
      </div>
      {data.worked_with_agency === "Yes" && (
        <div>
          <FieldLabel>What went right or wrong?</FieldLabel>
          <textarea value={data.agency_experience || ""} onChange={(e) => update("agency_experience", e.target.value)} rows={3} maxLength={800}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
        </div>
      )}
      <div>
        <FieldLabel>What's the ONE thing you're most afraid of?</FieldLabel>
        <input value={data.biggest_fear || ""} onChange={(e) => update("biggest_fear", e.target.value)} maxLength={300}
          placeholder="e.g. wasting money on something that doesn't work..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
      </div>
    </div>
  );
}

function Step8({ data, update, errors }: any) {
  const [fileName, setFileName] = useState<string>(data.uploaded_file_name || "");
  const sources = ["Instagram", "TikTok", "Google", "Referral", "LinkedIn", "Facebook", "YouTube", "Other"];
  return (
    <div className="space-y-5">
      <h3 className="font-display text-2xl font-bold">Final Details</h3>
      <p className="text-sm text-muted-foreground">Last step — we'll send your custom plan to WhatsApp within 24 hours.</p>
      <div>
        <FieldLabel required>Email address</FieldLabel>
        <input type="email" value={data.email || ""} onChange={(e) => update("email", e.target.value)} maxLength={255}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
        <Err msg={errors.email} />
      </div>
      <div>
        <FieldLabel required>WhatsApp number (with country code)</FieldLabel>
        <input value={data.whatsapp || ""} onChange={(e) => update("whatsapp", e.target.value)} maxLength={30}
          placeholder="+234 800 123 4567"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
        <Err msg={errors.whatsapp} />
      </div>
      <div>
        <FieldLabel>Instagram handle (optional)</FieldLabel>
        <input value={data.instagram_handle || ""} onChange={(e) => update("instagram_handle", e.target.value)} maxLength={60}
          placeholder="@username"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
      </div>
      <div>
        <FieldLabel>How did you hear about EmmaForYou?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <Pill key={s} active={data.how_found_us === s} onClick={() => update("how_found_us", s)}>{s}</Pill>
          ))}
        </div>
      </div>
      {data.how_found_us === "Referral" && (
        <div>
          <FieldLabel>Who referred you?</FieldLabel>
          <input value={data.referrer_name || ""} onChange={(e) => update("referrer_name", e.target.value)} maxLength={120}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
        </div>
      )}
      <div>
        <FieldLabel>Upload logo or reference (optional, max 5MB)</FieldLabel>
        <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-border bg-background p-6 text-center hover:border-emma-blue">
          <input type="file" accept="image/png,image/jpeg,application/pdf" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && f.size <= 5 * 1024 * 1024) {
                setFileName(f.name);
                update("uploaded_file_name", f.name);
              }
            }} />
          <p className="text-sm font-medium">{fileName || "📎 Click to upload"}</p>
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, PDF up to 5MB</p>
        </label>
      </div>
      <div>
        <FieldLabel>Anything else we should know?</FieldLabel>
        <textarea value={data.other_notes || ""} onChange={(e) => update("other_notes", e.target.value)} rows={3} maxLength={1500}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-emma-blue focus:outline-none" />
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={!!data.consent} onChange={(e) => update("consent", e.target.checked)}
          className="mt-1 h-5 w-5 accent-[var(--emma-blue)]" />
        <span className="text-sm">I agree to be contacted by EmmaForYou about my business growth.</span>
      </label>
      <Err msg={errors.consent} />
    </div>
  );
}

function SuccessScreen({ onClose, businessName }: { onClose?: () => void; businessName: string }) {
  return (
    <motion.div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-10 text-center shadow-2xl"
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
      <motion.div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl"
        style={{ background: "var(--gradient-brand)" }}
        initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
        ✓
      </motion.div>
      <h3 className="mt-6 font-display text-3xl font-bold">Your profile has been received! 🎉</h3>
      <p className="mt-3 text-base text-muted-foreground">
        Emmanuel and the team will review your submission and send your <span className="font-semibold text-foreground">Custom Growth Plan</span> to WhatsApp within 24 hours.
      </p>
      <div className="mt-8 rounded-2xl bg-muted/50 p-5">
        <p className="text-sm font-semibold">In the meantime, complete your free business analysis:</p>
        <a href="/analyser" className="mt-3 inline-flex rounded-full border-2 border-emma-blue px-5 py-2 text-sm font-semibold text-emma-blue">
          Take the Free Analyser →
        </a>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a href={buildIntakeWhatsApp(businessName, "")} target="_blank" rel="noopener noreferrer"
          className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg"
          style={{ background: "var(--gradient-brand)" }}>
          Chat With Us Now →
        </a>
        {onClose && <button onClick={onClose} className="rounded-full border border-border px-6 py-3 text-sm font-semibold">Close</button>}
      </div>
    </motion.div>
  );
}
