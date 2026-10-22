/**
 * In-browser answer search over the site's own content (FAQ, service Q&A, guides, plans, tools).
 * Loaded on demand when the visitor opens "Ask", so it adds nothing to normal page loads.
 */
import { CATEGORIES } from "./faq-data";
import { SERVICE_QA } from "./service-extras";
import { KNOWLEDGE } from "./knowledge-data";
import { TIERS } from "./pricing-data";
import { SERVICE_TO_EXPERTISE } from "./services-data";

/** Service pages win over the expertise page that shows the same content (mirrors seo-routes). */
const canonicalForExpertise = (slug: string) => {
  const svc = Object.entries(SERVICE_TO_EXPERTISE).find(([, exp]) => exp === slug)?.[0];
  return svc ? `/services/${svc}` : `/expertise/${slug}`;
};

export interface SearchDoc { title: string; answer: string; href: string; kind: "Answer" | "Service" | "Guide" | "Pricing" | "Tool" }
export interface SearchHit extends SearchDoc { score: number }

const TOOLS: SearchDoc[] = [
  { kind: "Tool", title: "Free website audit", answer: "Get a free scored audit of your website: speed on mobile, SEO, contact buttons and the top fixes, in about a minute.", href: "/website-audit" },
  { kind: "Tool", title: "AI receptionist demo", answer: "Chat or talk to an AI receptionist that answers questions and books appointments 24/7, the same assistant we set up for businesses.", href: "/ai-receptionist" },
  { kind: "Tool", title: "Instant proposal and quote", answer: "Answer a few questions and get a written proposal with scope, timeline and the plan that fits your budget.", href: "/proposal" },
  { kind: "Tool", title: "AI website makeover redesign", answer: "Upload a screenshot of your website and see it redesigned by AI in about a minute.", href: "/makeover" },
  { kind: "Tool", title: "Free smart contract check (Solidity security review)", answer: "Paste Solidity code and get a free security and gas review ranked by severity, with fixes. Not a substitute for a full audit.", href: "/smart-contract-check" },
  { kind: "Tool", title: "90-day goal planner and accountability", answer: "Turn a goal into monthly milestones and 12 weeks of concrete actions, with habits and a plan for your biggest obstacle.", href: "/goal-planner" },
  { kind: "Tool", title: "Book a free strategy call", answer: "Pick a time for a free 30-minute strategy call with Emmanuel; confirmation and reminders arrive by email.", href: "/book" },
  { kind: "Tool", title: "ROI calculator", answer: "Estimate the extra revenue from faster replies, automated follow-up and better marketing using your own numbers.", href: "/roi-calculator" },
  { kind: "Tool", title: "Business growth assessment", answer: "Eight questions that score how customers find you, buy from you and hear back from you, with a prioritised plan.", href: "/analyser" },
  { kind: "Tool", title: "Portfolio of client work", answer: "See websites, stores, automation and campaigns we've delivered for real clients.", href: "/portfolio" },
  { kind: "Tool", title: "Contact on WhatsApp", answer: "Message EmmaForYou on WhatsApp for a fast reply from the team.", href: "https://wa.me/message/HHGMMWMRJFYUC1" },
];

let DOCS: SearchDoc[] | null = null;
function docs(): SearchDoc[] {
  if (DOCS) return DOCS;
  const out: SearchDoc[] = [...TOOLS];
  for (const c of CATEGORIES) for (const it of c.items) out.push({ kind: "Answer", title: it.q, answer: it.a, href: "/faq" });
  for (const [slug, list] of Object.entries(SERVICE_QA)) {
    if (slug === "default") continue;
    const href = canonicalForExpertise(slug);
    for (const it of list) out.push({ kind: "Service", title: it.q, answer: it.a, href });
  }
  for (const t of TIERS) {
    const price = "custom" in t && t.custom ? "is quoted individually" : `costs $${t.monthly} per month ($${t.annual}/month billed annually)`;
    out.push({ kind: "Pricing", title: `How much is the ${t.name} plan? Price and what's included`, answer: `The ${t.name} plan ${price}, for ${t.audience.toLowerCase()}. It includes ${t.features.slice(0, 5).join(", ").toLowerCase()}.`, href: "/pricing" });
  }
  for (const a of KNOWLEDGE) out.push({ kind: "Guide", title: a.title, answer: a.excerpt, href: `/knowledge-base/${a.slug}` });
  DOCS = out;
  return out;
}

const STOP = new Set("a an the is are am be to of in on for and or with my our your you we i it can do does how what which who when where why much many me us this that there their them will would should could get have has about from at by as if so just any some".split(" "));
const SYN: Record<string, string[]> = {
  cost: ["price", "pricing", "plan", "budget", "fee", "charge"], price: ["cost", "pricing", "plan"], cheap: ["price", "budget", "starter"],
  website: ["site", "web", "landing"], site: ["website"], chatbot: ["ai", "automation", "assistant", "bot"], bot: ["chatbot", "ai", "automation"],
  ai: ["automation", "chatbot"], whatsapp: ["chat", "message", "automation"], shop: ["store", "ecommerce", "shopify"], store: ["ecommerce", "shopify", "shop"],
  ads: ["advertising", "ad", "meta", "google", "facebook"], seo: ["google", "search", "rank"], google: ["seo", "search"], rank: ["seo", "google"],
  book: ["call", "appointment", "booking", "schedule"], call: ["book", "strategy", "phone"], long: ["time", "timeline", "weeks"], fast: ["time", "quick", "timeline"],
  app: ["mobile", "application"], email: ["newsletter", "mail"], refund: ["guarantee", "money"], contact: ["whatsapp", "call", "email"],
};

const stem = (w: string) => w.replace(/(ings|ing|ies|es|ed|s)$/, (m) => (m === "ies" ? "y" : ""));
function terms(text: string): string[] {
  return text.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)).map(stem);
}

export function searchSite(query: string, limit = 4): SearchHit[] {
  const q = terms(query);
  if (!q.length) return [];
  const expanded = new Map<string, number>();
  for (const t of q) {
    expanded.set(t, 1);
    for (const s of SYN[t] || []) if (!expanded.has(stem(s))) expanded.set(stem(s), 0.45);
  }
  const all = docs();
  const df = new Map<string, number>();
  const indexed = all.map((d) => {
    const title = new Set(terms(d.title));
    const body = new Set(terms(d.answer));
    for (const t of expanded.keys()) if (title.has(t) || body.has(t)) df.set(t, (df.get(t) || 0) + 1);
    return { d, title, body };
  });
  const N = all.length;
  const hits = indexed.map(({ d, title, body }) => {
    let score = 0;
    let matched = 0;
    for (const [t, w] of expanded) {
      const idf = Math.log(1 + N / (1 + (df.get(t) || 0)));
      if (title.has(t)) { score += 3 * w * idf; matched += w === 1 ? 1 : 0; } else if (body.has(t)) { score += 1.2 * w * idf; matched += w === 1 ? 0.6 : 0; }
    }
    score *= 0.6 + 0.4 * (matched / q.length);
    if (d.kind === "Tool" || d.kind === "Pricing") score *= 1.1;
    return { ...d, score };
  });
  return hits.filter((h) => h.score > 1.2).sort((a, b) => b.score - a.score).slice(0, limit);
}

export const SAMPLE_QUESTIONS = ["How much does a website cost?", "What is AI automation?", "How long does a website take?", "Do you work outside Nigeria?", "Can I book a call?"];
