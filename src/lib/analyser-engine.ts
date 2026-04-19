// Pure-JS intelligence engine for the EmmaForYou Business Analyser.
// All scoring, recommendations, projections, and roadmap logic live here so
// they can be reused by both the homepage teaser and the full /analyser page.

export interface AnalyserAnswers {
  businessType: string;
  location: string;
  revenue: number;          // monthly USD
  yearsInBusiness: string;
  presence: string[];       // Step 5 channels
  challenges: string[];     // Step 6
  teamSize: string;
  budget: string;           // monthly marketing budget tier
  goal: string;
  timeline: string;
}

// ---------- Score breakdown ----------
export interface ScoreBreakdown {
  website: number;   // 0-20
  social: number;    // 0-20
  automation: number;// 0-20
  ads: number;       // 0-20
  content: number;   // 0-20
  total: number;     // 0-100
  percentile: number;// fake-but-plausible benchmark
}

const SOCIAL_CHANNELS = ["Instagram", "Facebook", "TikTok", "LinkedIn"];
const AUTOMATION_CHANNELS = ["WhatsApp Business", "Email List"];

function budgetTier(budget: string): 0 | 1 | 2 | 3 | 4 {
  if (budget.includes("5000+")) return 4;
  if (budget.includes("2000")) return 3;
  if (budget.includes("500")) return 2;
  if (budget.includes("100")) return 1;
  return 0;
}

export function calcScore(a: AnalyserAnswers): ScoreBreakdown {
  // Website
  let website = 0;
  if (a.presence.includes("Website")) website = a.revenue > 5000 ? 20 : 15;

  // Social
  const social = Math.min(20, SOCIAL_CHANNELS.filter(c => a.presence.includes(c)).length * 5)
    + (a.presence.includes("Google Business") ? 0 : 0);

  // Automation
  let automation = 0;
  if (a.presence.includes("WhatsApp Business")) automation += 10;
  if (a.presence.includes("Email List")) automation += 10;

  // Ads
  const tier = budgetTier(a.budget);
  const ads = [0, 8, 14, 18, 20][tier];

  // Content (inferred from social presence + tenure)
  let content = 0;
  const socialCount = SOCIAL_CHANNELS.filter(c => a.presence.includes(c)).length;
  if (socialCount >= 2) content += 10;
  if (socialCount >= 3) content += 5;
  if (a.yearsInBusiness === "3-5yrs" || a.yearsInBusiness === "5yrs+") content += 5;
  content = Math.min(20, content);

  if (a.presence.includes("None")) {
    return { website: 0, social: 0, automation: 0, ads, content: 0, total: Math.min(15, ads), percentile: 8 };
  }

  const total = Math.min(100, website + social + automation + ads + content);
  // Plausible percentile: lower scores rank lower
  const percentile = Math.min(95, Math.max(5, Math.round(total * 0.95)));
  return { website, social, automation, ads, content, total, percentile };
}

// ---------- Recommendations ----------
export interface Recommendation {
  service: string;
  why: string;
  outcome: string;
  timeframe: string;
  priority: "URGENT" | "HIGH" | "MEDIUM";
}

export function getRecommendations(a: AnalyserAnswers): Recommendation[] {
  const recs: Recommendation[] = [];
  const has = (x: string) => a.presence.includes(x);
  const challenge = (x: string) => a.challenges.some(c => c.toLowerCase().includes(x.toLowerCase()));

  if (!has("Website")) {
    recs.push({
      service: "Conversion-Focused Website",
      why: `${a.businessType || "Your business"} loses 70% of leads without a professional online home base.`,
      outcome: "2-3x more qualified leads within 30 days",
      timeframe: "10-14 days",
      priority: "URGENT",
    });
  }

  if (challenge("slow") || challenge("reply") || challenge("response") || (!has("WhatsApp Business") && a.revenue < 10000)) {
    recs.push({
      service: "AI Automation & WhatsApp Bot",
      why: "Instant 24/7 replies convert 3x more leads than slow human follow-up.",
      outcome: "60-80% reduction in lead response time",
      timeframe: "7 days",
      priority: "URGENT",
    });
  }

  if (!has("Email List")) {
    recs.push({
      service: "Email Marketing System",
      why: "Email returns $42 for every $1 spent — and you don't own your social followers.",
      outcome: "15-25% repeat-purchase rate",
      timeframe: "14 days",
      priority: "HIGH",
    });
  }

  if (budgetTier(a.budget) >= 2 && has("Website")) {
    recs.push({
      service: "Performance Ad Campaigns",
      why: `With your budget tier and existing site, paid ads can scale ${a.businessType || "your"} revenue fast.`,
      outcome: "3-5x return on ad spend",
      timeframe: "21 days",
      priority: "HIGH",
    });
  }

  const socialCount = SOCIAL_CHANNELS.filter(c => has(c)).length;
  if (socialCount < 2) {
    recs.push({
      service: "Social Media Management",
      why: "Consistent content on 2+ platforms builds the trust customers need before buying.",
      outcome: "5-10x audience growth in 90 days",
      timeframe: "Ongoing",
      priority: "HIGH",
    });
  }

  if (a.businessType.toLowerCase().includes("ecommerce") || a.businessType.toLowerCase().includes("store")) {
    recs.push({
      service: "Ecommerce Conversion Optimization",
      why: "Cart-abandonment recovery and checkout fixes typically lift revenue 20-40%.",
      outcome: "+25% conversion rate",
      timeframe: "14 days",
      priority: "MEDIUM",
    });
  }

  if (recs.length < 3) {
    recs.push({
      service: "Brand & Content Strategy",
      why: "A unified brand voice across all channels compounds every other marketing investment.",
      outcome: "Higher perceived value & premium pricing",
      timeframe: "30 days",
      priority: "MEDIUM",
    });
  }

  return recs.slice(0, 3);
}

// ---------- Revenue projection ----------
const MULTIPLIERS: Record<string, [number, number, number, number]> = {
  Fashion: [1.2, 1.45, 1.8, 2.6],
  Shoe: [1.18, 1.4, 1.75, 2.5],
  Beauty: [1.22, 1.5, 1.9, 2.8],
  "Real Estate": [1.1, 1.3, 1.7, 2.8],
  Restaurant: [1.15, 1.35, 1.6, 2.2],
  Clinic: [1.2, 1.5, 1.9, 3.1],
  Salon: [1.18, 1.4, 1.7, 2.4],
  Spa: [1.18, 1.4, 1.7, 2.4],
  Gym: [1.2, 1.45, 1.8, 2.6],
  Ecommerce: [1.3, 1.7, 2.2, 3.8],
  Coach: [1.25, 1.6, 2.1, 3.5],
  Consultant: [1.25, 1.6, 2.1, 3.5],
  Hotel: [1.15, 1.35, 1.65, 2.4],
  default: [1.15, 1.35, 1.65, 2.4],
};

export interface RevenueProjection {
  months: number[];          // [1,2,3,6]
  current: number[];
  conservative: number[];
  aggressive: number[];
}

export function projectRevenue(a: AnalyserAnswers): RevenueProjection {
  const key = Object.keys(MULTIPLIERS).find(k => a.businessType.toLowerCase().includes(k.toLowerCase())) || "default";
  const base = MULTIPLIERS[key];
  const tier = budgetTier(a.budget);
  const tierBoost = 1 + tier * 0.1; // +0% to +40%

  const current = a.revenue || 1000;
  const conservative = base.map(m => Math.round(current * (1 + (m - 1) * 0.6 * tierBoost)));
  const aggressive = base.map(m => Math.round(current * m * tierBoost));
  return {
    months: [1, 2, 3, 6],
    current: [current, current, current, current],
    conservative,
    aggressive,
  };
}

// ---------- 90-day roadmap ----------
export interface RoadmapItem {
  month: number;
  phase: string;
  actions: string[];
}

export function buildRoadmap(a: AnalyserAnswers): RoadmapItem[] {
  const has = (x: string) => a.presence.includes(x);
  const m1: string[] = [];
  if (!has("Website")) m1.push("Launch a conversion-focused one-page website");
  if (!has("Google Business")) m1.push("Claim and optimise your Google Business Profile");
  if (!has("WhatsApp Business")) m1.push("Set up WhatsApp Business with auto-replies");
  if (m1.length < 3) m1.push("Audit current funnel and define one north-star metric");
  if (m1.length < 3) m1.push("Set up basic analytics & lead tracking");

  const m2: string[] = [];
  if (!has("Email List")) m2.push("Launch lead-magnet email capture & welcome sequence");
  if (budgetTier(a.budget) >= 2) m2.push("Start first paid ad campaign with $10/day testing budget");
  m2.push("Publish 3 social posts per week per active platform");
  if (a.challenges.some(c => c.toLowerCase().includes("convert"))) {
    m2.push("Add testimonials, social proof and urgency to top landing pages");
  }

  const m3: string[] = [
    "Launch retargeting ads to all site visitors",
    "Automate post-purchase follow-up & review requests",
    "Scale winning ads 2-3x; pause losers",
  ];
  if (a.goal.toLowerCase().includes("retention")) {
    m3.push("Launch loyalty/VIP automation flow");
  }

  return [
    { month: 1, phase: "Foundation", actions: m1.slice(0, 3) },
    { month: 2, phase: "Growth", actions: m2.slice(0, 3) },
    { month: 3, phase: "Scale", actions: m3.slice(0, 3) },
  ];
}

// ---------- Package recommendation ----------
export interface PackageRec {
  name: "Starter" | "Growth" | "Pro" | "Enterprise";
  priceRange: string;
  deliverables: string[];
}

export function recommendPackage(a: AnalyserAnswers): PackageRec {
  const tier = budgetTier(a.budget);
  if (tier <= 1) {
    return {
      name: "Starter",
      priceRange: "$300 – $700 / mo",
      deliverables: [
        "1-page conversion website",
        "WhatsApp Business automation",
        "Google Business setup & optimisation",
        "Basic monthly analytics report",
        "1 social platform managed (12 posts)",
      ],
    };
  }
  if (tier === 2) {
    return {
      name: "Growth",
      priceRange: "$800 – $1,800 / mo",
      deliverables: [
        "Multi-page website with CMS",
        "Email marketing (welcome + 4 sequences)",
        "AI chatbot on website + WhatsApp",
        "2 social platforms (20 posts/mo)",
        "Monthly performance dashboard + strategy call",
      ],
    };
  }
  if (tier === 3) {
    return {
      name: "Pro",
      priceRange: "$2,000 – $4,500 / mo",
      deliverables: [
        "Full conversion-optimised website + landing pages",
        "Paid ads management (Google + Meta) up to $3k/mo spend",
        "Email + SMS marketing automation",
        "3 social platforms with original content",
        "Weekly strategy + monthly conversion-rate audit",
      ],
    };
  }
  return {
    name: "Enterprise",
    priceRange: "$5,000+ / mo",
    deliverables: [
      "Custom web/app build + dedicated team",
      "Full-funnel paid media (unlimited spend tier)",
      "AI + CRM automation across all channels",
      "Dedicated account manager + weekly reporting",
      "Quarterly strategy roadmap & competitor intel",
    ],
  };
}

// ---------- Competitive intel ----------
export function getCompetitiveIntel(a: AnalyserAnswers, score: number) {
  const niche = a.businessType || "businesses";
  const loc = a.location || "your market";
  return {
    headline: `${niche} in ${loc} that invest in digital grow ${30 + (budgetTier(a.budget) * 5)}% faster than offline-only competitors.`,
    tools: ["A modern website", "WhatsApp + AI automation", "Paid ads + retargeting"],
    you: score,
    industry: 52,
    top: 84,
  };
}
