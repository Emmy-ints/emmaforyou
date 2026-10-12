/**
 * EmmaForYou client work. Client names, descriptions, stacks and outcomes are the owner's
 * records, copied verbatim from the original portfolio page. Do not invent or rewrite them.
 *
 * Imagery: the three FEATURED images are local assets; PROJECTS images are stock photos
 * standing in until real project screenshots are supplied (see MISSING_ASSETS).
 */
import fashionImg from "../assets/portfolio-fashion.webp";
import realestateImg from "../assets/portfolio-realestate.webp";
import clinicImg from "../assets/portfolio-clinic.webp";

export const PORTFOLIO_FILTERS = ["All", "Websites", "Ecommerce", "Social Media", "Ads", "Automation", "Branding"];

export const FEATURED = [
  { img: fashionImg, client: "Lagos Couture", niche: "Fashion · Lagos, Nigeria 🇳🇬", tags: ["Website", "Ecommerce", "Social Media"], metric: "+312%", metricLabel: "website traffic", desc: "Full ecommerce rebuild on Shopify with integrated WhatsApp checkout. Brand refresh, professional product photography, and Instagram strategy." },
  { img: realestateImg, client: "Maryland Premier Properties", niche: "Real Estate · Hanover, USA 🇺🇸", tags: ["Website", "Ads", "CRM"], metric: "47", metricLabel: "new qualified leads / month", desc: "Lead-gen optimised website + Google & Meta ad campaigns + automated WhatsApp follow-up sequence for cold leads." },
  { img: clinicImg, client: "Wellness Clinic Halle", niche: "Healthcare · Halle, Germany 🇩🇪", tags: ["Website", "Automation", "Reviews"], metric: "86", metricLabel: "new Google reviews", desc: "Online booking system with auto-confirmation, smart reminder flows that cut no-shows by 60%, and a Google Business Profile that ranks #1 locally." },
];

export const PROJECTS = [
  { name: "Lagos Couture", desc: "Bold ecommerce rebuild for a Lagos fashion house — Shopify, WhatsApp checkout, ad-ready product feed.", category: "Ecommerce", url: "lagoscouture.com", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=70", stack: ["Shopify", "Klaviyo", "Meta Ads"], outcome: "+312% traffic" },
  { name: "Maryland Premier Properties", desc: "Lead-gen funnel + automated WhatsApp follow-up for a US real estate team.", category: "Websites", url: "marylandhomes.us", img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=70", stack: ["Webflow", "HubSpot", "Twilio"], outcome: "47 leads/mo" },
  { name: "Spice Restaurant", desc: "Reservations, menu showcase and local SEO for a restaurant in Halle.", category: "Websites", url: "spicerestaurant.com", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70", stack: ["Next.js", "Stripe", "GBP"], outcome: "65% more bookings" },
  { name: "Wellness Clinic Halle", desc: "Booking system + automated reminders + Google review automation for a Berlin clinic.", category: "Automation", url: "wellnessclinic.de", img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=70", stack: ["Make.com", "Calendly", "WhatsApp API"], outcome: "60% less no-shows" },
  { name: "Scale Up Coach", desc: "High-ticket coaching funnel with VSL, scheduler and email sequence.", category: "Websites", url: "scaleupcoach.com", img: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=70", stack: ["Framer", "Stripe", "ConvertKit"], outcome: "3.5x audience" },
  { name: "Autohaus Halle", desc: "Inventory listing site + lead-capture campaign for a German auto dealer.", category: "Ecommerce", url: "autohaus-halle.de", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=70", stack: ["Astro", "Cloudinary", "Google Ads"], outcome: "3x test drives" },
  { name: "Glow Salon", desc: "Brand refresh + booking system + Instagram content engine for a Lagos beauty salon.", category: "Branding", url: "glowsalon.ng", img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=70", stack: ["Canva", "Fresha", "Instagram"], outcome: "2x bookings" },
  { name: "Cape Fitness", desc: "Member onboarding + retention sequences for a Cape Town gym chain.", category: "Social Media", url: "capefitness.za", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=70", stack: ["Mailchimp", "Glofox", "Reels"], outcome: "+38% retention" },
  { name: "Bright Academy", desc: "Enrolment funnel + parent comms automation for a Ghanaian school.", category: "Automation", url: "brightschool.gh", img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=70", stack: ["Notion", "Make.com", "WhatsApp"], outcome: "+40% enrolments" },
  { name: "Boutique Hotel Paris", desc: "Direct booking site that beats OTAs on conversion and brand feel.", category: "Ecommerce", url: "boutiquehotel.fr", img: "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=70", stack: ["Sanity", "Stripe", "i18n"], outcome: "+45% direct" },
  { name: "Kitchen.ng", desc: "WhatsApp-first ordering for a Lagos cloud kitchen.", category: "Ecommerce", url: "kitchen.com.ng", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=70", stack: ["Paystack", "Twilio", "Vercel"], outcome: "+212% orders" },
  { name: "Courses London", desc: "Course launch site for a London-based business coach.", category: "Websites", url: "courses.london", img: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=70", stack: ["Teachable", "Stripe", "Webflow"], outcome: "5x launch revenue" },
];

export const VIDEOS: { title: string; duration: string; category: string; url?: string }[] = [
  { title: "Fashion Store — Instagram Strategy Breakdown", duration: "2:34", category: "Social Media" },
  { title: "Clinic WhatsApp Automation Demo", duration: "3:12", category: "Automation" },
  { title: "Real Estate Lead Gen — 30 Day Results", duration: "4:05", category: "Ads" },
  { title: "Restaurant Facebook Ads — From $0 to Booked", duration: "2:48", category: "Ads" },
  { title: "Ecommerce Shopify Redesign — Before & After", duration: "5:20", category: "Websites" },
  { title: "AI Auto-Reply in 3 Seconds — Live Demo", duration: "1:45", category: "Automation" },
];

export const SOCIAL_BEFORE_AFTER = [
  { name: "Lagos Couture (Instagram)", before: "800 followers · random posts", after: "12,000 followers · branded feed", color: "#f59e0b" },
  { name: "Maryland Properties (Instagram)", before: "Sporadic listings", after: "Consistent property reels", color: "#1e3a8a" },
  { name: "Spice Restaurant (Facebook)", before: "No photos · empty page", after: "Daily food photos · 4.8★ reviews", color: "#dc2626" },
  { name: "Scale Up Coach (LinkedIn)", before: "Empty profile", after: "Thought leader · 8k followers", color: "#0891b2" },
];

export const ADS = [
  { headline: "Tired of slow website sales?", body: "Get a brand new ecommerce store in 14 days. Built to convert.", cta: "Get Your Free Quote", stats: "CTR 4.2% · ROAS 6.8x", niche: "Fashion" },
  { headline: "Sell faster on WhatsApp", body: "Auto-reply, capture leads, and close sales 24/7 with AI automation.", cta: "Start Free Trial", stats: "CTR 5.1% · CPC $0.34", niche: "Real Estate" },
  { headline: "Get more 5★ Google reviews", body: "Our system asks every happy customer automatically. Watch your rating climb.", cta: "Book a Demo", stats: "CTR 3.8% · ROAS 5.2x", niche: "Clinic" },
  { headline: "Fully booked every weekend", body: "We turn restaurants into local destinations using Meta ads + booking automation.", cta: "Get a Plan", stats: "CTR 4.6% · CPC $0.41", niche: "Restaurant" },
  { headline: "From $1k to $10k months", body: "We rebuilt their store, ran ads, and automated everything. Results in 60 days.", cta: "Apply Now", stats: "CTR 5.3% · ROAS 7.1x", niche: "Ecommerce" },
  { headline: "Coaches: Fill your calendar", body: "Done-for-you funnel + paid ads. We book your discovery calls. You close.", cta: "See How It Works", stats: "CTR 4.9% · ROAS 6.4x", niche: "Coach" },
];

export const AUTOMATIONS = [
  { title: "WhatsApp Auto-Reply Flow", desc: "Capture leads, qualify them, book appointments — all automatically.", metric: "47% more conversions", emoji: "💬" },
  { title: "Welcome → Nurture → Convert email sequence", desc: "5-step automated flow that turns subscribers into buyers.", metric: "32% open rate", emoji: "📧" },
  { title: "Lead capture form → CRM", desc: "Every form submission instantly creates a CRM record + WhatsApp alert.", metric: "100% lead retention", emoji: "📋" },
  { title: "Google Business Profile optimisation", desc: "Reviews automation + post scheduling + Q&A management.", metric: "#1 local rank", emoji: "📍" },
  { title: "Shopify dashboard scaling", desc: "Cart abandonment recovery + upsell automation = bigger orders.", metric: "+38% AOV", emoji: "🛍️" },
];

export type Project = (typeof PROJECTS)[number];

export function projectSlug(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function findProject(slug: string) {
  return PROJECTS.find((p) => projectSlug(p.name) === slug);
}

export function featuredFor(name: string) {
  return FEATURED.find((f) => f.client === name);
}

/** Social before/after entries are keyed by a short client name; match them to projects. */
export function socialFor(name: string) {
  const first = name.split(" ")[0].toLowerCase();
  return SOCIAL_BEFORE_AFTER.find((s) => s.name.toLowerCase().startsWith(first));
}

/** Real assets still needed to replace stand-in imagery. */
export const MISSING_ASSETS = PROJECTS.map((p) => `${p.name}: project screenshots (homepage, mobile) and client logo`);
