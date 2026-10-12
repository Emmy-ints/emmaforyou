/**
 * Per-service additions used by the service page template: deliverables, scope guidance,
 * the kind of live demo to show, and the questions asked in that service's inquiry form.
 * No prices are invented here — pages link to /pricing for plan pricing.
 */

export type DemoKind = "workflow" | "site" | "dashboard";

export interface WorkflowNode {
  label: string;
  detail: string;
}

export interface InquiryQuestion {
  id: string;
  label: string;
  options: string[];
  multi?: boolean;
}

export interface ServiceExtra {
  audience: string;
  deliverables: string[];
  timeline: string;
  engagement: string;
  demo: DemoKind;
  workflow?: WorkflowNode[];
  questions: InquiryQuestion[];
}

const CHANNELS: InquiryQuestion = { id: "channels", label: "Where do your customers contact you?", options: ["WhatsApp", "Instagram DMs", "Website forms", "Phone calls", "Email", "Facebook"], multi: true };
const VOLUME: InquiryQuestion = { id: "volume", label: "Roughly how many enquiries a month?", options: ["Under 50", "50–200", "200–1,000", "1,000+"] };
const START: InquiryQuestion = { id: "start", label: "When would you like to start?", options: ["This month", "Next 1–3 months", "Just exploring"] };
const SITE_NOW: InquiryQuestion = { id: "site", label: "What do you have today?", options: ["No website", "A website that needs a redesign", "A website that works but doesn't convert", "An online store"] };

export const SERVICE_EXTRAS: Record<string, ServiceExtra> = {
  "ai-automation": {
    audience: "Busy owners and small teams who answer the same questions all day and lose enquiries after hours.",
    deliverables: ["AI assistant on WhatsApp, Instagram and your website", "Answers to your real FAQs, prices and availability", "Booking or order capture with confirmations", "Automatic follow-up for people who don't buy yet", "Hand-off to a human when it matters", "Monthly review and tuning"],
    timeline: "Live in 2–3 weeks",
    engagement: "Setup, then monthly support",
    demo: "workflow",
    workflow: [
      { label: "Message arrives", detail: "WhatsApp, Instagram or website chat" },
      { label: "AI understands it", detail: "Price, availability, location or booking" },
      { label: "Instant reply", detail: "In your tone, in seconds, day or night" },
      { label: "Booking or order", detail: "Captured and confirmed automatically" },
      { label: "Follow-up", detail: "Reminders and nudges until they decide" },
    ],
    questions: [CHANNELS, VOLUME, START],
  },
  "lead-generation": {
    audience: "Businesses that need a predictable flow of new enquiries instead of waiting for word of mouth.",
    deliverables: ["Ideal-customer profile and offer positioning", "Lead magnet or offer page", "Targeted campaigns on the right channels", "Lead capture straight into WhatsApp or your CRM", "Weekly lead quality reporting"],
    timeline: "First leads in 2–4 weeks",
    engagement: "Monthly retainer",
    demo: "dashboard",
    questions: [{ id: "target", label: "Who are you trying to reach?", options: ["Local customers", "Other businesses", "Customers nationwide", "International customers"] }, { id: "budget", label: "Monthly budget for ads (if any)?", options: ["None yet", "Under $300", "$300–$1,000", "$1,000+"] }, START],
  },
  "sales-conversion": {
    audience: "Businesses that get enquiries but close too few of them.",
    deliverables: ["Audit of how enquiries are handled today", "Reply scripts and offer structure", "Automated follow-up and reminder sequences", "Payment links and deposits to reduce no-shows", "Conversion tracking from enquiry to payment"],
    timeline: "Improvements live in 2–3 weeks",
    engagement: "Project, then optional monthly support",
    demo: "workflow",
    workflow: [
      { label: "Enquiry", detail: "Captured from every channel" },
      { label: "Qualified", detail: "Budget, need and timing checked" },
      { label: "Offer sent", detail: "Clear options with a payment link" },
      { label: "Follow-up", detail: "Day 1, 3 and 7 reminders" },
      { label: "Paid", detail: "Confirmation and onboarding sent" },
    ],
    questions: [VOLUME, { id: "close", label: "How many enquiries become customers?", options: ["Fewer than 1 in 10", "1–3 in 10", "More than 3 in 10", "Not sure"] }, START],
  },
  copywriting: {
    audience: "Businesses whose website, ads or messages don't explain clearly why someone should buy.",
    deliverables: ["Messaging and positioning workshop", "Website and landing-page copy", "Ad and social captions", "WhatsApp and email reply templates", "Two rounds of revisions"],
    timeline: "1–2 weeks",
    engagement: "One-off project",
    demo: "site",
    questions: [{ id: "assets", label: "What needs words?", options: ["Website", "Landing page", "Ads", "Emails", "Social media"], multi: true }, START],
  },
  "funnel-building": {
    audience: "Coaches, course creators and service businesses selling a clear offer online.",
    deliverables: ["Offer and funnel map", "Landing and checkout pages", "Lead magnet and email/WhatsApp sequences", "Payment integration", "Analytics from visit to sale"],
    timeline: "2–4 weeks",
    engagement: "Project, then optional optimisation",
    demo: "workflow",
    workflow: [
      { label: "Ad or post", detail: "Brings the right visitor in" },
      { label: "Landing page", detail: "One clear promise and action" },
      { label: "Lead captured", detail: "Free guide, quiz or call booking" },
      { label: "Nurture", detail: "Email and WhatsApp sequence" },
      { label: "Checkout", detail: "Pay online in a few taps" },
    ],
    questions: [{ id: "offer", label: "What are you selling?", options: ["Coaching or consulting", "Online course", "Event or programme", "Physical product", "Service"] }, { id: "price", label: "Typical price of your offer?", options: ["Under $100", "$100–$500", "$500–$2,000", "$2,000+"] }, START],
  },
  "crm-systems": {
    audience: "Teams juggling leads across WhatsApp, spreadsheets and memory.",
    deliverables: ["CRM setup and pipeline design", "Lead capture from every channel", "Automated reminders and task assignment", "Customer history in one place", "Team training"],
    timeline: "2–3 weeks",
    engagement: "Setup, then optional support",
    demo: "workflow",
    workflow: [
      { label: "New lead", detail: "From any form, ad or chat" },
      { label: "Auto-assigned", detail: "To the right person" },
      { label: "Reminders", detail: "Nobody forgets to follow up" },
      { label: "Deal tracked", detail: "Stage by stage" },
      { label: "Reports", detail: "See what's working each week" },
    ],
    questions: [{ id: "today", label: "Where do you track customers today?", options: ["Nowhere", "Spreadsheets", "WhatsApp chats", "An existing CRM"] }, { id: "team", label: "How many people handle customers?", options: ["Just me", "2–5", "6–20", "20+"] }, START],
  },
  "social-media-automation": {
    audience: "Businesses that know they should post consistently but never have the time.",
    deliverables: ["Monthly content plan", "Designed posts, reels and stories", "Scheduling across platforms", "Automated replies to comments and DMs", "Monthly performance report"],
    timeline: "First month's content in 2 weeks",
    engagement: "Monthly retainer",
    demo: "dashboard",
    questions: [{ id: "platforms", label: "Which platforms matter most?", options: ["Instagram", "TikTok", "Facebook", "LinkedIn", "X"], multi: true }, { id: "now", label: "How often do you post now?", options: ["Rarely", "Monthly", "Weekly", "Daily"] }, START],
  },
  "email-marketing": {
    audience: "Businesses with past customers they rarely hear from again.",
    deliverables: ["List clean-up and segmentation", "Welcome, win-back and review sequences", "Monthly campaigns", "Sign-up forms on your site", "Open, click and revenue reporting"],
    timeline: "Sequences live in 2 weeks",
    engagement: "Setup, then monthly campaigns",
    demo: "workflow",
    workflow: [
      { label: "Customer joins", detail: "Purchase, booking or sign-up" },
      { label: "Welcome", detail: "Sent within minutes" },
      { label: "Review request", detail: "After the visit or delivery" },
      { label: "Offers", detail: "Birthdays and seasonal moments" },
      { label: "Win-back", detail: "If they haven't returned in 60 days" },
    ],
    questions: [{ id: "list", label: "How many customer emails or numbers do you have?", options: ["None yet", "Under 500", "500–5,000", "5,000+"] }, START],
  },
  "website-landing-pages": {
    audience: "Businesses whose website doesn't bring enquiries, or who don't have one yet.",
    deliverables: ["Fast, mobile-first design", "Clear pricing, services and proof", "Online booking, ordering or enquiries", "WhatsApp chat and analytics", "Basic SEO and Google Business Profile setup"],
    timeline: "2–4 weeks",
    engagement: "Project, then optional care plan",
    demo: "site",
    questions: [SITE_NOW, { id: "needs", label: "What should it do?", options: ["Take bookings", "Sell products", "Capture enquiries", "Show portfolio"], multi: true }, START],
  },
  "shopify-ecommerce": {
    audience: "Brands selling products online who want a store that converts and runs smoothly.",
    deliverables: ["Shopify store design and setup", "Product pages that sell", "Payments, shipping and taxes", "Abandoned-cart and post-purchase automations", "Sales analytics"],
    timeline: "3–5 weeks",
    engagement: "Project, then optional growth plan",
    demo: "site",
    questions: [{ id: "store", label: "Where do you sell today?", options: ["Not online yet", "Instagram / WhatsApp", "Marketplaces", "An existing store"] }, { id: "products", label: "How many products?", options: ["1–20", "20–100", "100–500", "500+"] }, START],
  },
  "paid-ads": {
    audience: "Businesses ready to pay for growth but tired of ad spend with nothing to show for it.",
    deliverables: ["Campaign strategy and audience research", "Ad creative and copy", "Meta and Google campaign setup", "Conversion tracking", "Weekly optimisation and reporting"],
    timeline: "Campaigns live in 1–2 weeks",
    engagement: "Monthly management",
    demo: "dashboard",
    questions: [{ id: "budget", label: "Monthly ad budget?", options: ["Under $300", "$300–$1,000", "$1,000–$5,000", "$5,000+"] }, { id: "platforms", label: "Where do you want to advertise?", options: ["Instagram & Facebook", "Google", "TikTok", "Not sure"], multi: true }, START],
  },
  seo: {
    audience: "Businesses that want customers to find them on Google without paying for every click.",
    deliverables: ["Technical SEO audit and fixes", "Keyword and local search strategy", "Google Business Profile optimisation", "Content plan and on-page improvements", "Monthly ranking and traffic report"],
    timeline: "Groundwork in 4 weeks; rankings build over months",
    engagement: "Monthly retainer",
    demo: "dashboard",
    questions: [SITE_NOW, { id: "area", label: "Where are your customers?", options: ["One city", "Several cities", "Nationwide", "International"] }, START],
  },
  analytics: {
    audience: "Owners who want to know which marketing actually brings customers.",
    deliverables: ["Tracking plan", "Analytics and conversion setup", "One dashboard for every channel", "Monthly insight report", "Training on reading the numbers"],
    timeline: "1–2 weeks",
    engagement: "Setup, then optional reporting",
    demo: "dashboard",
    questions: [{ id: "tools", label: "What do you use today?", options: ["Nothing", "Google Analytics", "Platform insights only", "A spreadsheet"] }, START],
  },
  wordpress: {
    audience: "Businesses on WordPress whose site is slow, outdated or hard to update.",
    deliverables: ["Redesign or rebuild", "Speed and security improvements", "Easy-to-edit pages", "Forms, booking and WhatsApp integration", "Backups and updates"],
    timeline: "2–4 weeks",
    engagement: "Project, then optional care plan",
    demo: "site",
    questions: [SITE_NOW, START],
  },
  "app-development": {
    audience: "Businesses whose operations run on spreadsheets and chat threads, or founders with an app idea to test.",
    deliverables: ["Discovery workshop and clickable prototype", "Mobile-first web app or customer portal", "User accounts, roles and permissions", "Payments, notifications and integrations", "Admin dashboard and reporting", "Launch support and improvements"],
    timeline: "First version in 4–8 weeks",
    engagement: "Project, then optional ongoing development",
    demo: "workflow",
    workflow: [
      { label: "Discover", detail: "Map the process and the people using it" },
      { label: "Prototype", detail: "Clickable screens to test the idea" },
      { label: "Build", detail: "A focused first version" },
      { label: "Launch", detail: "Real users, real data" },
      { label: "Improve", detail: "Add features based on usage" },
    ],
    questions: [{ id: "kind", label: "What kind of app?", options: ["Customer portal", "Booking or ordering app", "Internal dashboard", "Marketplace", "Something else"] }, { id: "users", label: "Who will use it?", options: ["Customers", "My team", "Both"] }, START],
  },
  "digital-strategy": {
    audience: "Businesses that want a clear plan before spending on marketing.",
    deliverables: ["Business and competitor review", "Channel and budget plan", "90-day roadmap with priorities", "Measurement plan", "Monthly strategy call"],
    timeline: "Roadmap in 2 weeks",
    engagement: "Project or ongoing advisory",
    demo: "dashboard",
    questions: [{ id: "stage", label: "Where is your business?", options: ["Just starting", "Growing", "Established", "Expanding to new markets"] }, START],
  },
};

export function extraFor(slug: string): ServiceExtra {
  return SERVICE_EXTRAS[slug] ?? SERVICE_EXTRAS["ai-automation"];
}
