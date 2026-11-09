/**
 * Landing-page content for each industry page (/niche/$slug): one fix per problem, the free prototype idea,
 * the real client projects from portfolio-data that belong to this industry (names must match exactly), the main
 * service (for "starting from" pricing), the Ask Emma preset and three industry questions.
 * Never put numbers or results here: results come only from portfolio-data.
 */
import { PROJECTS, projectSlug } from "./portfolio-data";
import type { BusinessId } from "./qualify";

export interface IndustryLanding {
  fixes: string[];
  idea: string;
  ideaKind: "website" | "app";
  projects: string[];
  service: string;
  business: BusinessId;
  faqs: { q: string; a: string }[];
  whatsapp: string;
}

const FAQ_TIME = { q: "How quickly can we start?", a: "After a free 30-minute call we send a clear plan and quote. Most projects start within a week of you saying yes; Emmanuel confirms the timeline for your scope on the call." };
const FAQ_TOOLS = { q: "Do I need to change the tools I already use?", a: "Usually not. We connect to what you already have where we can (WhatsApp Business, Instagram, Google, your booking or payment tools) and only suggest a change when it clearly helps." };

export const INDUSTRY_LANDING: Record<string, IndustryLanding> = {
  "fashion-store": {
    fixes: ["A content plan and branded posts that turn followers into DMs and orders", "A fast mobile store with WhatsApp checkout, so buyers don't drop off", "A posting calendar and templates so your feed stays consistent"],
    idea: "An online store for my fashion brand with new arrivals, sizes, a cart and WhatsApp checkout", ideaKind: "website",
    projects: ["Lagos Couture"], service: "shopify-ecommerce", business: "shop",
    faqs: [{ q: "Can customers still order through WhatsApp?", a: "Yes. Many fashion buyers prefer it, so we often keep WhatsApp ordering and add a store and catalogue that feed into it." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I run a fashion brand and I want more online sales. Can we talk?",
  },
  clinic: {
    fixes: ["A Google Business Profile and website that show up when patients search near you", "Online booking with automatic confirmations and reminders", "A simple review request after each visit, so happy patients leave reviews"],
    idea: "A clinic booking app where patients choose a service, a doctor and a time, and get reminders", ideaKind: "app",
    projects: ["Wellness Clinic Halle"], service: "ai-automation", business: "clinic",
    faqs: [{ q: "Is patient information kept private?", a: "We only collect what booking needs, keep it in the tools you control, and never put medical details in marketing messages. We'll go through your privacy needs on the call." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I run a clinic and I want more bookings and fewer no-shows. Can we talk?",
  },
  "real-estate": {
    fixes: ["A lead-capture website and ads that bring buyers and renters who match your listings", "Instant WhatsApp replies and follow-ups so no enquiry goes cold", "Listing pages with photos, details and a clear 'book a viewing' button"],
    idea: "A property website with listings, filters for price and bedrooms, and a book-a-viewing form", ideaKind: "website",
    projects: ["Maryland Premier Properties"], service: "lead-generation", business: "real-estate",
    faqs: [{ q: "Can you follow up leads automatically?", a: "Yes. We set up WhatsApp and email follow-ups that ask the right questions and hand you the serious buyers, while you stay in control of every conversation." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I'm in real estate and I want more qualified leads. Can we talk?",
  },
  restaurant: {
    fixes: ["Midweek offers and posts that give people a reason to come in", "A Google profile, menu and website people can find and read on a phone", "WhatsApp ordering or reservations, plus simple messages that bring guests back"],
    idea: "A restaurant app with the menu, a cart, WhatsApp ordering and table reservations", ideaKind: "app",
    projects: ["Spice Restaurant", "Kitchen.ng"], service: "social-media-automation", business: "restaurant",
    faqs: [{ q: "Can you set up online ordering without big platform fees?", a: "Often, yes: WhatsApp-first ordering or your own ordering page. We'll compare it honestly with the delivery platforms you use now." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I run a restaurant and I want more orders and bookings. Can we talk?",
  },
  coach: {
    fixes: ["A clear offer and a booking funnel that takes people from content to a call", "Content and email sequences that build trust before people buy", "A simple system for posting regularly, so your expertise is visible"],
    idea: "A coaching website with my programmes, testimonials, a free guide sign-up and a booking page", ideaKind: "website",
    projects: ["Scale Up Coach", "Courses London"], service: "funnel-building", business: "coach",
    faqs: [{ q: "I already post a lot. Why aren't people buying?", a: "Usually the path from a post to a paid offer is missing or unclear. We map that path and fix the weakest step first." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I'm a coach and I want a funnel that brings clients. Can we talk?",
  },
  ecommerce: {
    fixes: ["Abandoned-cart messages and a smoother checkout", "Email and WhatsApp flows that bring buyers back for a second order", "Ad campaigns and product feeds built around your best-selling products"],
    idea: "An online shop with product filters, a cart, checkout and a wishlist", ideaKind: "website",
    projects: ["Lagos Couture", "Kitchen.ng"], service: "shopify-ecommerce", business: "shop",
    faqs: [{ q: "Which platforms do you work with?", a: "Shopify most often, plus WooCommerce and custom stores. We'll recommend what fits your products and budget." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I run an online store and I want more repeat sales. Can we talk?",
  },
  salon: {
    fixes: ["Before-and-after content and offers that fill quiet days", "Online booking with reminders, so clients book in seconds", "Automatic review requests that grow your Google rating"],
    idea: "A salon booking app with services and prices, stylist choice, time slots and loyalty points", ideaKind: "app",
    projects: ["Glow Salon"], service: "ai-automation", business: "salon",
    faqs: [{ q: "Will clients still be able to book on WhatsApp?", a: "Yes. We can keep WhatsApp booking and add instant replies, a booking link and reminders around it." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I run a salon and I want more bookings. Can we talk?",
  },
  gym: {
    fixes: ["Onboarding and check-in messages that keep new members coming back", "A simple sign-up and trial-booking flow", "Member stories and progress content for social proof"],
    idea: "A gym app with class timetable, booking, workout tracking and membership plans", ideaKind: "app",
    projects: ["Cape Fitness"], service: "email-marketing", business: "gym",
    faqs: [{ q: "Can this work with our membership software?", a: "Often it can. We'll check what your current software connects to and build around it." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I run a gym and I want more members who stay. Can we talk?",
  },
  "auto-dealer": {
    fixes: ["Inventory pages that load fast and show every car clearly", "Instant replies and follow-ups for every enquiry", "Lead-capture campaigns that book test drives"],
    idea: "A car dealer website with inventory, filters, car details and a book-a-test-drive form", ideaKind: "website",
    projects: ["Autohaus Halle"], service: "website-landing-pages", business: "other",
    faqs: [{ q: "Can our inventory update automatically?", a: "If your dealer system can export or connect, yes. Otherwise we give you a simple way to add and remove cars." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I run a car dealership and I want more test drives. Can we talk?",
  },
  school: {
    fixes: ["An enrolment funnel that answers parents' questions and books visits", "Online enrolment instead of paper forms", "Regular, automatic updates that keep parents informed"],
    idea: "A school app with timetable, announcements, fees information and enrolment form for parents", ideaKind: "app",
    projects: ["Bright Academy"], service: "ai-automation", business: "school",
    faqs: [{ q: "Can parents get updates on WhatsApp?", a: "Yes. We set up announcement and reminder messages parents opt into, so the school office isn't sending them one by one." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I run a school and I want more enrolments. Can we talk?",
  },
  hotel: {
    fixes: ["A direct-booking website guests trust", "Offers and email for past guests, so they book direct next time", "Ads and a Google profile that send people to your own site"],
    idea: "A hotel website with rooms, photos, prices, availability and a direct booking form", ideaKind: "website",
    projects: ["Boutique Hotel Paris"], service: "website-landing-pages", business: "hotel",
    faqs: [{ q: "Should we leave the booking sites?", a: "Rarely all at once. Most hotels keep them for discovery and grow direct bookings alongside; we'll look at your numbers together." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I run a hotel and I want more direct bookings. Can we talk?",
  },
  saas: {
    fixes: ["A clear website and trial sign-up flow", "Onboarding emails that get new users to their first result", "Content and lead nurturing for a steadier pipeline"],
    idea: "A SaaS landing page with features, pricing plans, FAQ and a free trial sign-up", ideaKind: "website",
    projects: [], service: "email-marketing", business: "other",
    faqs: [{ q: "Do you work with B2B products?", a: "Yes: websites, onboarding emails and lead nurturing for B2B and B2C products. Tell us about your sales cycle on the call." }, FAQ_TOOLS, FAQ_TIME],
    whatsapp: "Hi Emmanuel! I run a software company and I want more qualified trials. Can we talk?",
  },
};

/** Real client projects for an industry (only names that exist in portfolio-data). */
export function projectsFor(slug: string) {
  const names = INDUSTRY_LANDING[slug]?.projects ?? [];
  return names.map((n) => PROJECTS.find((p) => p.name === n)).filter((p): p is (typeof PROJECTS)[number] => Boolean(p)).map((p) => ({ ...p, slug: projectSlug(p.name) }));
}

/** Link to the homepage builder with the idea filled in. */
export function prototypeLink(slug: string): string {
  const l = INDUSTRY_LANDING[slug];
  if (!l) return "/#prototype";
  return `/?proto_kind=${l.ideaKind}&proto_idea=${encodeURIComponent(l.idea)}#prototype`;
}
