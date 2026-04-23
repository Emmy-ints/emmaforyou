export interface Niche {
  slug: string;
  name: string;
  flag: string;
  hero: string;
  sub: string;
  problems: string[];
  services: string[];
  result: string;
  multiplier: number;
}

export const NICHES: Niche[] = [
  { slug: "fashion-store", name: "Fashion Stores", flag: "👗", hero: "Sell More Outfits, Build a Cult Brand.", sub: "From Instagram shops to Shopify stores — we make your fashion brand the one everyone screenshots.", problems: ["Low Instagram engagement", "Slow website checkout", "Inconsistent posts"], services: ["Social Media Management", "Ecommerce Setup", "Ad Marketing", "AI Automation"], result: "Average 312% traffic increase", multiplier: 2.65 },
  { slug: "clinic", name: "Clinics & Healthcare", flag: "🏥", hero: "Fill Your Appointment Book — Automatically.", sub: "Patients searching for you on Google never reach competitors again. WhatsApp bookings, review automation, the works.", problems: ["Patients can't find you", "Manual booking eats time", "Few Google reviews"], services: ["Google Business", "AI Automation", "Website Design", "Email Marketing"], result: "65% more appointments in 90 days", multiplier: 3.2 },
  { slug: "real-estate", name: "Real Estate Agents", flag: "🏘️", hero: "47 Qualified Leads a Month — Without Cold Calling.", sub: "Lead gen funnels, instant WhatsApp replies, and listings that actually sell.", problems: ["Cold lead lists", "Slow follow-up", "Generic listings"], services: ["AI Automation", "Ad Marketing", "Website Design", "Email Marketing"], result: "5.1x more qualified leads", multiplier: 2.9 },
  { slug: "restaurant", name: "Restaurants & Cafés", flag: "🍽️", hero: "Fully Booked Every Weekend.", sub: "Mouth-watering posts, instant reservations, repeat customer machines.", problems: ["Empty seats midweek", "No online presence", "No repeat customers"], services: ["Social Media", "Google Business", "Ad Marketing", "AI Automation"], result: "65% increase in foot traffic", multiplier: 2.3 },
  { slug: "coach", name: "Coaches & Consultants", flag: "💼", hero: "Build Your Audience. Launch Your Programme.", sub: "From content engine to high-ticket funnels — we build your scalable income system.", problems: ["No clear funnel", "Audience not buying", "Imposter syndrome"], services: ["Email Marketing", "Social Media", "Website Design", "AI Automation"], result: "3.5x audience growth in 6 mo", multiplier: 3.6 },
  { slug: "ecommerce", name: "Ecommerce Brands", flag: "🛒", hero: "Turn Browsers into Buyers — and Buyers into Loyal Repeats.", sub: "Conversion-optimised stores, abandoned cart sequences, scaling ad campaigns.", problems: ["High cart abandonment", "Low repeat purchase", "Ad ROAS dropping"], services: ["Ecommerce Setup", "Ad Marketing", "Email Marketing", "AI Automation"], result: "3.9x revenue in 6 months", multiplier: 3.9 },
  { slug: "salon", name: "Salons & Spas", flag: "💇‍♀️", hero: "Become the Salon Everyone Books First.", sub: "Beauty content that hooks, booking automation, and Google reviews on autopilot.", problems: ["Empty chairs", "No booking system", "Few reviews"], services: ["Social Media", "AI Automation", "Google Business", "Website Design"], result: "Average 60% booking increase", multiplier: 2.4 },
  { slug: "gym", name: "Gyms & Fitness", flag: "💪", hero: "Memberships That Sell Themselves.", sub: "Transformation content, member onboarding, retention automation.", problems: ["Member churn", "Slow signups", "No social proof"], services: ["Social Media", "Email Marketing", "AI Automation", "Ad Marketing"], result: "2x memberships in 60 days", multiplier: 2.8 },
  { slug: "auto-dealer", name: "Auto Dealers", flag: "🚗", hero: "Test Drives Booked — Without Cold Calls.", sub: "Inventory listings that convert, lead capture funnels, and AI follow-up.", problems: ["Walk-ins only", "Slow lead response", "Static website"], services: ["Website Design", "Ad Marketing", "AI Automation", "Email Marketing"], result: "3x test drive bookings", multiplier: 2.7 },
  { slug: "school", name: "Schools & Training", flag: "🎓", hero: "Fill Your Classes. Automate Enrolment.", sub: "Enrolment funnels, parent communication automation, and authority content.", problems: ["Empty seats", "Manual enrolment", "Parents not engaged"], services: ["Website Design", "AI Automation", "Email Marketing", "Social Media"], result: "Average 40% more enrolments", multiplier: 2.4 },
  { slug: "hotel", name: "Hotels & B&Bs", flag: "🏨", hero: "Direct Bookings That Beat the OTAs.", sub: "Stop paying 25% commission to booking sites — get bookings through your own channels.", problems: ["OTA dependency", "Low direct bookings", "Old website"], services: ["Website Design", "Ad Marketing", "Email Marketing", "AI Automation"], result: "Average 45% direct booking lift", multiplier: 2.6 },
  { slug: "saas", name: "SaaS Companies", flag: "💻", hero: "Generate Qualified Trials at Scale.", sub: "B2B funnels, content marketing engine, and automation that nurtures cold leads to paid.", problems: ["Slow signups", "High churn", "Cold pipeline"], services: ["Email Marketing", "AI Automation", "Website Design", "Ad Marketing"], result: "7.2x lead volume in 12 months", multiplier: 4.0 },
];

export function getNiche(slug: string) {
  return NICHES.find((n) => n.slug === slug);
}