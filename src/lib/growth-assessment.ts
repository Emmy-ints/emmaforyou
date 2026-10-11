/**
 * Business growth assessment. Five scored pillars of 20 points each (total 100).
 * Every point is documented in POINTS below and shown to the visitor, so the score is explainable.
 * Goals and challenges don't change the score; they shape the recommendations.
 */

export interface AssessmentAnswers {
  businessType: string;
  location: string;
  presence: string[];
  acquisition: string[];
  website: string;
  ecommerce: string;
  marketing: string[];
  responseTime: string;
  followUp: string;
  challenges: string[];
  goal: string;
  timeline: string;
}

export const EMPTY_ANSWERS: AssessmentAnswers = {
  businessType: "",
  location: "",
  presence: [],
  acquisition: [],
  website: "",
  ecommerce: "",
  marketing: [],
  responseTime: "",
  followUp: "",
  challenges: [],
  goal: "",
  timeline: "",
};

export const OPTIONS = {
  businessType: ["Salon & beauty", "Restaurant & food", "Real estate", "Clinic & health", "Fashion & retail", "Ecommerce brand", "Coach / consultant", "Gym & fitness", "Hotel & hospitality", "Professional services", "Other"],
  location: ["Nigeria", "Rest of Africa", "United States", "United Kingdom", "Europe", "Elsewhere"],
  presence: ["Website", "Google Business Profile", "Instagram", "Facebook", "TikTok", "LinkedIn", "WhatsApp Business", "None yet"],
  acquisition: ["Word of mouth", "Walk-ins", "Social media", "Google search", "Paid ads", "Referral partners", "Marketplaces (Jumia, Etsy…)"],
  website: ["No website", "Basic information page", "Takes enquiries through forms", "Takes bookings or orders online"],
  ecommerce: ["We don't sell or book online", "Customers pay offline after messaging us", "Online payments or deposits", "Full online store or booking with payments"],
  marketing: ["Post on social media weekly", "Run paid ads", "Send email or SMS updates", "Ask customers for reviews", "Create videos or blog content", "None of these"],
  responseTime: ["Within 5 minutes", "Within an hour", "Same day", "Next day or later", "Some enquiries never get a reply"],
  followUp: ["Automatically, with reminders", "Manually, when we remember", "Rarely or never"],
  challenges: ["Not enough enquiries", "Enquiries don't turn into sales", "Too slow to reply", "No time for marketing", "Website doesn't bring business", "Customers don't come back", "Hard to stand out from competitors", "Don't know what's working"],
  goal: ["More enquiries", "More sales from current enquiries", "Save time with automation", "Launch or relaunch online", "Grow repeat customers", "Expand to new markets"],
  timeline: ["As soon as possible", "Within 3 months", "Within 6 months", "Just exploring"],
} as const;

/** Points awarded per answer. Shown to visitors in "How your score works". */
export const POINTS = {
  presence: { "Website": 6, "Google Business Profile": 5, "WhatsApp Business": 3, "per social channel (max 2)": 3 } as Record<string, number>,
  acquisition: { "per channel you own or pay for (max 4)": 4, "word of mouth only": 4 } as Record<string, number>,
  website: { "No website": 0, "Basic information page": 4, "Takes enquiries through forms": 8, "Takes bookings or orders online": 12 } as Record<string, number>,
  ecommerce: { "We don't sell or book online": 0, "Customers pay offline after messaging us": 3, "Online payments or deposits": 6, "Full online store or booking with payments": 8 } as Record<string, number>,
  marketing: { "Post on social media weekly": 5, "Run paid ads": 5, "Send email or SMS updates": 4, "Ask customers for reviews": 3, "Create videos or blog content": 3 } as Record<string, number>,
  responseTime: { "Within 5 minutes": 12, "Within an hour": 9, "Same day": 5, "Next day or later": 2, "Some enquiries never get a reply": 0 } as Record<string, number>,
  followUp: { "Automatically, with reminders": 8, "Manually, when we remember": 4, "Rarely or never": 0 } as Record<string, number>,
};

export type PillarKey = "presence" | "acquisition" | "website" | "marketing" | "followup";

export const PILLARS: Record<PillarKey, { label: string; explain: string }> = {
  presence: { label: "Online presence", explain: "Can customers find and trust you online? Website and Google profile count most, then WhatsApp Business and up to two social channels." },
  acquisition: { label: "Customer acquisition", explain: "How many independent channels bring you new customers. Relying on word of mouth alone is fragile." },
  website: { label: "Website & online sales", explain: "Whether your site does work for you: capturing enquiries, taking bookings or orders, and accepting payment." },
  marketing: { label: "Marketing activity", explain: "The regular activities that keep you visible: posting, ads, email/SMS, reviews and content." },
  followup: { label: "Lead follow-up & automation", explain: "How fast you answer and whether people who don't buy straight away are followed up. Speed is the biggest single factor." },
};

export interface AssessmentResult {
  total: number;
  pillars: Record<PillarKey, number>;
  band: { label: string; summary: string };
  recommendations: Recommendation[];
}

export interface Recommendation {
  title: string;
  why: string;
  firstStep: string;
  service: { slug: string; name: string };
  pillar: PillarKey;
}

const SOCIAL = ["Instagram", "Facebook", "TikTok", "LinkedIn"];

export function scoreAssessment(a: AssessmentAnswers): AssessmentResult {
  const has = (list: string[], v: string) => list.includes(v);
  const none = has(a.presence, "None yet");

  const presence = none ? 0 : Math.min(20,
    (has(a.presence, "Website") ? 6 : 0) +
    (has(a.presence, "Google Business Profile") ? 5 : 0) +
    (has(a.presence, "WhatsApp Business") ? 3 : 0) +
    Math.min(2, SOCIAL.filter((s) => has(a.presence, s)).length) * 3);

  const ownedChannels = a.acquisition.filter((c) => c !== "Word of mouth" && c !== "Walk-ins").length;
  const acquisition = Math.min(20,
    Math.min(4, ownedChannels) * 4 + (a.acquisition.length > 0 && ownedChannels === 0 ? 4 : 0) + (has(a.acquisition, "Word of mouth") && ownedChannels > 0 ? 4 : 0));

  const website = Math.min(20, (POINTS.website[a.website] ?? 0) + (POINTS.ecommerce[a.ecommerce] ?? 0));

  const marketing = has(a.marketing, "None of these") ? 0 : Math.min(20, a.marketing.reduce((sum, m) => sum + (POINTS.marketing[m] ?? 0), 0));

  const followup = Math.min(20, (POINTS.responseTime[a.responseTime] ?? 0) + (POINTS.followUp[a.followUp] ?? 0));

  const pillars = { presence, acquisition, website, marketing, followup };
  const total = presence + acquisition + website + marketing + followup;

  const band =
    total >= 80 ? { label: "Strong foundation", summary: "Your systems are in good shape. The gains now come from automation, optimisation and scaling what already works." }
    : total >= 60 ? { label: "Growing, with gaps", summary: "You're doing several things right, but one or two weak areas are likely costing you customers every month." }
    : total >= 35 ? { label: "Early systems", summary: "The basics are partly there. Closing the biggest gaps below will make the most difference, fastest." }
    : { label: "Just getting started", summary: "There's a lot of room to grow. A simple, well-built foundation will change how customers find and buy from you." };

  return { total, pillars, band, recommendations: recommend(a, pillars) };
}

const SERVICE = {
  automation: { slug: "ai-automation", name: "AI Automation" },
  website: { slug: "website-design", name: "Website Design & Dev" },
  social: { slug: "social-media", name: "Social Media Management" },
  ads: { slug: "ad-marketing", name: "Ad Marketing" },
  email: { slug: "email-marketing", name: "Email Marketing" },
  ecommerce: { slug: "ecommerce", name: "Ecommerce Growth" },
};

function recommend(a: AssessmentAnswers, p: Record<PillarKey, number>): Recommendation[] {
  const recs: (Recommendation & { weight: number })[] = [];
  const challenge = (c: string) => a.challenges.includes(c);

  if (p.followup < 14 || challenge("Too slow to reply") || challenge("Enquiries don't turn into sales")) {
    recs.push({
      pillar: "followup", weight: 20 - p.followup + (challenge("Too slow to reply") ? 6 : 0),
      title: "Answer every enquiry in minutes, automatically",
      why: a.responseTime === "Some enquiries never get a reply" || a.responseTime === "Next day or later"
        ? "You told us some enquiries wait a day or more. Most people buy from whoever answers first."
        : "Faster replies and automatic follow-up turn more of the enquiries you already get into sales.",
      firstStep: "An AI assistant on WhatsApp and your website that answers common questions, shares prices and books appointments, with a reminder sequence for people who don't buy straight away.",
      service: SERVICE.automation,
    });
  }
  if (p.website < 12 || challenge("Website doesn't bring business")) {
    recs.push({
      pillar: "website", weight: 20 - p.website + (challenge("Website doesn't bring business") ? 6 : 0),
      title: a.website === "No website" ? "Launch a website that takes bookings or orders" : "Turn your website into a sales tool",
      why: a.website === "No website" ? "Without a website, customers searching for you find competitors instead." : "A site that only shows information makes customers do the work. Let them book, order or pay in a few taps.",
      firstStep: "A fast, mobile-first site with clear prices, online booking or ordering, WhatsApp chat and payment links.",
      service: a.businessType === "Ecommerce brand" || a.businessType === "Fashion & retail" ? SERVICE.ecommerce : SERVICE.website,
    });
  }
  if (p.presence < 12) {
    recs.push({
      pillar: "presence", weight: 20 - p.presence,
      title: "Make sure customers can find and trust you",
      why: !a.presence.includes("Google Business Profile") ? "You don't have a Google Business Profile — often the first thing local customers see." : "Gaps in your online presence make it harder for new customers to trust you.",
      firstStep: "Set up and optimise your Google Business Profile, connect WhatsApp Business, and tidy your social profiles so they all point to one booking link.",
      service: SERVICE.website,
    });
  }
  if (p.acquisition < 12 || challenge("Not enough enquiries") || challenge("Hard to stand out from competitors")) {
    recs.push({
      pillar: "acquisition", weight: 20 - p.acquisition + (challenge("Not enough enquiries") ? 6 : 0),
      title: "Add a reliable source of new customers",
      why: a.acquisition.length <= 1 ? "Relying on one channel makes growth unpredictable." : "More enquiries come from channels you can control and measure.",
      firstStep: "A small, tightly targeted ad campaign aimed at your best customers, sending people straight to WhatsApp or a booking page.",
      service: SERVICE.ads,
    });
  }
  if (p.marketing < 12 || challenge("No time for marketing") || challenge("Customers don't come back")) {
    recs.push({
      pillar: "marketing", weight: 20 - p.marketing + (challenge("Customers don't come back") ? 5 : 0),
      title: challenge("Customers don't come back") ? "Bring customers back with automated messages" : "Stay visible without spending hours on it",
      why: challenge("Customers don't come back") ? "Winning back an existing customer usually costs far less than finding a new one." : "Consistent, planned content keeps you top of mind without eating your week.",
      firstStep: challenge("Customers don't come back")
        ? "Automatic review requests, birthday offers and “we miss you” messages by WhatsApp or email."
        : "A monthly content plan with scheduled posts and a simple review-collection routine.",
      service: challenge("Customers don't come back") ? SERVICE.email : SERVICE.social,
    });
  }
  if (recs.length === 0) {
    recs.push({
      pillar: "followup", weight: 1,
      title: "Scale what already works",
      why: "Your foundation is strong. The next gains come from measurement and automation.",
      firstStep: "Connect your channels into one dashboard, then automate the repetitive steps between enquiry and payment.",
      service: SERVICE.automation,
    });
  }
  return recs.sort((x, y) => y.weight - x.weight).slice(0, 3).map(({ weight: _w, ...r }) => r);
}

/** Which questions each step needs answered before Next is allowed. */
export function stepError(step: number, a: AssessmentAnswers): string | null {
  switch (step) {
    case 0: return a.businessType ? null : "Choose your type of business.";
    case 1: return a.presence.length ? null : "Pick at least one, or “None yet”.";
    case 2: return a.acquisition.length ? null : "Pick at least one way customers find you.";
    case 3: return a.website && a.ecommerce ? null : "Answer both questions about your website.";
    case 4: return a.marketing.length ? null : "Pick at least one, or “None of these”.";
    case 5: return a.responseTime && a.followUp ? null : "Answer both questions about follow-up.";
    case 6: return a.challenges.length ? null : "Pick up to three challenges.";
    case 7: return a.goal && a.timeline ? null : "Choose your main goal and timeline.";
    default: return null;
  }
}
