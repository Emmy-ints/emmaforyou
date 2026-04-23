export type BizType = "product" | "service" | "local" | "creator" | "b2b";

export interface BizContent {
  label: string;
  icon: string;
  short: string;
  heroTitle: string;
  heroSub: string;
  heroCTA: string;
  featuredServices: string[];
  statHighlight: string;
  urgencyText: string;
}

export const personalisation: Record<BizType, BizContent> = {
  product: {
    label: "Product / Ecommerce",
    icon: "🛒",
    short: "Online stores, fashion, beauty, gadgets",
    heroTitle: "We Help Product & Ecommerce Brands Sell More, Everywhere.",
    heroSub: "From Instagram shops to Shopify stores — we build the systems that turn browsers into buyers and buyers into loyal repeat customers.",
    heroCTA: "Scale My Store",
    featuredServices: ["Ecommerce Growth", "Social Media Management", "Ad Marketing", "AI Automation"],
    statHighlight: "Our ecommerce clients average 3.9x revenue growth in 6 months",
    urgencyText: "Used by 87 product businesses this month",
  },
  service: {
    label: "Service Business",
    icon: "🏥",
    short: "Clinics, salons, agencies, consultants",
    heroTitle: "We Help Service Businesses Fill Their Books & Automate.",
    heroSub: "From clinics to salons to agencies — we build the booking, follow-up and reputation systems that keep your calendar booked solid.",
    heroCTA: "Fill My Appointment Book",
    featuredServices: ["AI Automation", "Website Design", "Google Business", "Email Marketing"],
    statHighlight: "Service clients average 65% more bookings in 90 days",
    urgencyText: "Onboarding 52 service businesses this month",
  },
  local: {
    label: "Local Business",
    icon: "🍽️",
    short: "Restaurants, gyms, hotels, barbershops",
    heroTitle: "We Help Local Businesses Get Found & Stay Packed.",
    heroSub: "Restaurants, gyms, barbershops, hotels — we put you in front of every local customer searching for what you offer, and keep them coming back.",
    heroCTA: "Fill My Business",
    featuredServices: ["Google Business", "Social Media", "Ad Marketing", "AI Automation"],
    statHighlight: "Local businesses average 65% increase in foot traffic in 60 days",
    urgencyText: "Serving 94 local businesses this month",
  },
  creator: {
    label: "Coach / Creator",
    icon: "💼",
    short: "Coaches, consultants, course creators",
    heroTitle: "We Help Coaches & Creators Build Audiences & Launch Big.",
    heroSub: "You have the expertise. We build the systems — funnels, email sequences, social growth, and automation — that turn your audience into scalable income.",
    heroCTA: "Build My Personal Brand",
    featuredServices: ["Email Marketing", "Social Media", "Website Design", "AI Automation"],
    statHighlight: "Coaches we work with average 3.5x audience growth in 6 months",
    urgencyText: "Trusted by 67 coaches & creators",
  },
  b2b: {
    label: "B2B / Corporate",
    icon: "🏢",
    short: "SaaS, agencies, B2B services",
    heroTitle: "We Help B2B Companies Generate Qualified Leads at Scale.",
    heroSub: "LinkedIn strategy, email outreach, landing pages, and automation — the B2B lead gen systems that fill your pipeline with decision makers.",
    heroCTA: "Fill My Pipeline",
    featuredServices: ["AI Automation", "Website Design", "Email Marketing", "Ad Marketing"],
    statHighlight: "B2B clients see average 312% increase in qualified lead volume",
    urgencyText: "Supporting 38 B2B companies this month",
  },
};

export const STORAGE_KEY = "efy_bizType";
export const PERSONALIZED_FLAG = "efy_personalized";