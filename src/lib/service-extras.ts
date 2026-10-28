/**
 * Per-service additions used by the service page template: deliverables, scope guidance,
 * the kind of live demo to show, and the questions asked in that service's inquiry form.
 * No prices are invented here — pages link to /pricing for plan pricing.
 */

import { PUBLISHING_EXTRAS, PUBLISHING_QA } from "./publishing-data";

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
  "ui-ux-design": {
    audience: "Businesses launching or fixing a website, web app or mobile app, and teams whose developers need a clear design to build from.",
    deliverables: ["User research and journey maps", "Wireframes of key screens", "High-fidelity UI for mobile and desktop", "Clickable prototype and usability test", "Design system and developer hand-off", "Design review during build"],
    timeline: "1–6 weeks depending on screens",
    engagement: "Project",
    demo: "site",
    questions: [{ id: "product", label: "What are we designing?", options: ["Website", "Web app or portal", "Mobile app", "Redesign of something existing"] }, START],
  },
  "conversion-rate-optimisation": {
    audience: "Businesses with steady traffic, ad spend or a store that isn't converting as well as it should.",
    deliverables: ["Tracking and analytics check", "Funnel drop-off analysis", "Heatmap and recording review", "Prioritised fix list", "A/B tests on key pages", "Monthly results report"],
    timeline: "Audit in 1–2 weeks, then monthly",
    engagement: "One-off audit or monthly optimisation",
    demo: "dashboard",
    questions: [{ id: "where", label: "Where are you losing people?", options: ["Website enquiries", "Online store checkout", "Landing pages from ads", "Not sure"] }, { id: "traffic", label: "Monthly visitors", options: ["Under 1,000", "1,000–10,000", "10,000+", "Don't know"] }, START],
  },
  "business-consulting": {
    audience: "Founders and small teams who want an outside view on offers, pricing, sales, operations and systems.",
    deliverables: ["Business and offer review", "Sales and operations audit", "90-day priorities", "Pricing and positioning recommendations", "KPI dashboard", "Advisory sessions"],
    timeline: "Plan in 2 weeks",
    engagement: "Strategy session or ongoing advisory",
    demo: "dashboard",
    questions: [{ id: "challenge", label: "Biggest challenge right now", options: ["Growth has stalled", "Too dependent on me", "Pricing and offer", "Launching something new"] }, START],
  },
  "accountability-coaching": {
    audience: "Founders, freelancers and professionals who know what to do and want structure and follow-through.",
    deliverables: ["90-day goals", "Weekly commitments", "Scheduled coaching calls", "WhatsApp check-ins", "Monthly progress review"],
    timeline: "Start within a week",
    engagement: "Monthly coaching",
    demo: "workflow",
    workflow: [
      { label: "Set goals", detail: "Clear 90-day targets" },
      { label: "Commit", detail: "This week's 3–5 actions" },
      { label: "Check in", detail: "Calls and WhatsApp follow-up" },
      { label: "Review", detail: "What worked, what slipped" },
      { label: "Reset", detail: "Next week's commitments" },
    ],
    questions: [{ id: "goal", label: "What do you want to be accountable for?", options: ["Growing my business", "Launching a project", "Marketing consistency", "Personal productivity"] }, { id: "rhythm", label: "Preferred check-in rhythm", options: ["Weekly", "Every two weeks", "Not sure"] }, START],
  },
  "marketing-promotion": {
    audience: "Brands launching a product, service or event, and businesses that need attention fast.",
    deliverables: ["Campaign plan and timeline", "Creative for each channel", "Influencer and partner coordination", "Ads and WhatsApp/email broadcasts", "Tracking links and codes", "Results report"],
    timeline: "Campaigns from 2 weeks",
    engagement: "Campaign project or monthly",
    demo: "dashboard",
    questions: [{ id: "what", label: "What are you promoting?", options: ["A product launch", "An event", "A brand or business", "An offer or sale"] }, CHANNELS, START],
  },
  "web3-development": {
    audience: "Founders and teams building dApps, NFT or DeFi products, token-gated communities or crypto payments.",
    deliverables: ["Architecture and prototype", "Smart contracts with tests", "Wallet-connected web app", "On-chain data indexing", "Testnet and mainnet deployment", "Launch support"],
    timeline: "MVP in 4–10 weeks",
    engagement: "Project, then ongoing development",
    demo: "workflow",
    workflow: [
      { label: "Spec", detail: "Flows, contracts, chain" },
      { label: "Contracts", detail: "Solidity + tests" },
      { label: "App", detail: "Wallet-connected UI" },
      { label: "Testnet", detail: "Real users, no real money" },
      { label: "Launch", detail: "Mainnet + monitoring" },
    ],
    questions: [{ id: "kind", label: "What are you building?", options: ["dApp", "NFT project", "DeFi / staking", "Crypto payments", "Token-gated community"] }, { id: "stage", label: "Where are you?", options: ["Idea", "Contracts exist, need an app", "Live, need improvements"] }, START],
  },
  "smart-contract-development": {
    audience: "Projects launching tokens, NFTs, staking or DAOs, and teams with contracts that need review, upgrades or gas savings.",
    deliverables: ["Written contract specification", "Solidity implementation (OpenZeppelin-based)", "Unit, fuzz and invariant tests", "Static analysis and manual review", "Deployment with multisig ownership", "Verified source on the explorer"],
    timeline: "1–6 weeks depending on scope",
    engagement: "Project or review",
    demo: "workflow",
    workflow: [
      { label: "Spec", detail: "Every function and role" },
      { label: "Build", detail: "Solidity + OpenZeppelin" },
      { label: "Test", detail: "Unit, fuzz, invariants" },
      { label: "Review", detail: "Manual + static analysis" },
      { label: "Deploy", detail: "Multisig + verification" },
    ],
    questions: [{ id: "need", label: "What do you need?", options: ["New contract", "Review of existing code", "Upgrade or gas optimisation", "Audit preparation"] }, { id: "type", label: "Contract type", options: ["Token (ERC-20)", "NFT (ERC-721/1155)", "Staking / vesting", "Marketplace / DAO", "Other"] }, START],
  },
  "blockchain-crypto": {
    audience: "Crypto founders and businesses exploring blockchain payments, loyalty, traceability or digital ownership.",
    deliverables: ["Strategy and token decision", "Tokenomics and vesting design", "Contracts and dApp", "Website, docs and whitepaper", "Community and launch campaign", "Post-launch support"],
    timeline: "Strategy in 2 weeks, launch in 6–12 weeks",
    engagement: "Project",
    demo: "dashboard",
    questions: [{ id: "who", label: "Which describes you?", options: ["Crypto / Web3 founder", "Business exploring blockchain", "Community or DAO", "Investor-backed startup"] }, START],
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

Object.assign(SERVICE_EXTRAS, PUBLISHING_EXTRAS);

export function extraFor(slug: string): ServiceExtra {
  return SERVICE_EXTRAS[slug] ?? SERVICE_EXTRAS["ai-automation"];
}

/* ------------------------------------------------------------------ */
/* Service-specific questions (answer first, then detail)              */
/* ------------------------------------------------------------------ */

export interface ServiceQA {
  q: string;
  a: string;
}

const PRICING_NOTE = "Monthly plans start at $99 (Starter), $299 (Growth) and $799 (Pro), with custom Enterprise pricing; one-off builds get a fixed quote after a free call.";

export const SERVICE_QA: Record<string, ServiceQA[]> = {
  "ai-automation": [
    { q: "What is AI business automation?", a: "AI business automation uses software that understands messages and data to handle repetitive work without a person — for example answering customer questions on WhatsApp, booking appointments and sending follow-ups. A person stays in charge: the system hands over anything unusual." },
    { q: "What does an AI automation agency do?", a: "It finds the repetitive work slowing your business down, then designs, builds and maintains systems that handle it — such as AI assistants on WhatsApp and your website, booking flows, follow-up sequences and CRM updates — connected to the tools you already use." },
    { q: "Which business processes can be automated first?", a: "The best first candidates are frequent, rule-based tasks: replying to common enquiries (prices, opening hours, availability), taking bookings, sending reminders, collecting reviews and moving new leads into a CRM. Tasks needing judgement or negotiation should stay with your team." },
    { q: "How much does AI automation cost?", a: `It depends on the number of channels and how complex the conversations are. ${PRICING_NOTE}` },
  ],
  "lead-generation": [
    { q: "What does a lead generation service include?", a: "Defining your ideal customer and offer, building a page or form that captures their details, running targeted campaigns, and sending every new lead straight to WhatsApp or your CRM so it's answered quickly." },
    { q: "How quickly do leads start coming in?", a: "Paid campaigns usually produce the first enquiries within a few weeks of launch. Lead quality improves over the following weeks as targeting and messaging are refined with real data." },
  ],
  "sales-conversion": [
    { q: "Why do enquiries not turn into sales?", a: "The most common reasons are slow replies, unclear pricing or offers, no follow-up for people who aren't ready yet, and too many steps to pay. Fixing response time and follow-up usually has the biggest effect." },
    { q: "How can a business improve its conversion rate?", a: "Answer enquiries within minutes, present clear options with prices, make paying or booking possible in a few taps, and follow up automatically with people who don't buy straight away." },
  ],
  copywriting: [
    { q: "What makes website copy convert?", a: "It names the customer's problem in their own words, explains the outcome you deliver, shows proof, and gives one clear next step. Benefits come before features, and every section answers 'why should I care?'." },
  ],
  "funnel-building": [
    { q: "What is a sales funnel?", a: "A sales funnel is the path from first contact to purchase: an ad or post, a focused landing page, a way to capture interest (such as a free guide or call booking), follow-up messages, and checkout." },
    { q: "Who needs a funnel rather than a website?", a: "Businesses selling one clear offer online — such as coaching, courses or events — often convert better with a focused funnel than a general website with many pages." },
  ],
  "crm-systems": [
    { q: "What is a CRM and does a small business need one?", a: "A CRM (customer relationship management system) keeps every lead and customer, their history and the next follow-up in one place. If enquiries are tracked across WhatsApp chats and spreadsheets and some get forgotten, a simple CRM pays off quickly." },
  ],
  "social-media-automation": [
    { q: "What does social media management include?", a: "A monthly content plan, designed posts and short videos, scheduling across platforms, replies to comments and messages, and a monthly report on what's working." },
    { q: "How often should a business post on social media?", a: "Consistency matters more than volume. For most small businesses, three to five quality posts a week on one or two platforms where their customers spend time is a realistic, effective starting point." },
  ],
  "email-marketing": [
    { q: "How can email automation improve follow-up?", a: "Automated emails go out at the right moment without anyone remembering to send them — a welcome after sign-up, a reminder before an appointment, a review request after a visit, or a nudge when a cart is abandoned." },
    { q: "Which automated emails should a business set up first?", a: "Start with a welcome sequence, an abandoned-cart or abandoned-enquiry reminder, and a post-purchase review request. These run continuously and cover the moments customers are most likely to act." },
  ],
  "website-landing-pages": [
    { q: "How much does website development cost?", a: `Cost depends on the number of pages, features such as booking, payments or a store, and whether content and photography are included. ${PRICING_NOTE}` },
    { q: "What should a business prepare before hiring a web development agency?", a: "Your goals for the site, examples of sites you like, your logo and photos, the services and prices you want shown, and how customers should contact or buy from you. Clear inputs make the project faster and cheaper." },
    { q: "How long does it take to build a website?", a: "A focused business website typically takes two to four weeks, depending on content readiness and features such as booking or payments." },
  ],
  "shopify-ecommerce": [
    { q: "How can an ecommerce business improve conversion rates?", a: "Speed up the store on mobile, write product pages that answer buyer questions, show clear delivery costs and times early, offer familiar payment options, and recover abandoned carts with automated reminders." },
    { q: "Is Shopify right for my store?", a: "Shopify suits most product businesses that want a reliable store without managing servers. Very custom marketplaces or complex B2B pricing may need a different setup — we'll advise on the call." },
  ],
  "paid-ads": [
    { q: "What is the difference between SEO and paid advertising?", a: "Paid advertising buys visibility immediately and stops when spending stops. SEO earns visibility in unpaid search results over months and keeps working without paying per click. Many businesses use ads for quick results while SEO builds." },
    { q: "Is ad spend included in your price?", a: "No. Our fee covers strategy, creative and management; you pay Meta, Google or TikTok directly for ad spend, so every amount is transparent." },
  ],
  seo: [
    { q: "What is the difference between SEO and paid advertising?", a: "SEO earns visibility in unpaid search results and keeps working without paying per click, but takes months to build. Paid ads deliver visibility straight away and stop when spending stops." },
    { q: "How long does SEO take to work?", a: "Technical fixes and Google Business Profile improvements can help within weeks. Ranking for competitive searches usually takes several months of consistent work, and no one can guarantee specific rankings." },
  ],
  analytics: [
    { q: "What should a small business measure?", a: "Where enquiries come from, how many become customers, cost per customer for each channel, and revenue per customer. These four numbers show what to spend more or less on." },
  ],
  wordpress: [
    { q: "Should I rebuild or improve my WordPress site?", a: "If the site is slow, hard to edit or looks dated, a rebuild on a lean theme is often faster and cheaper long-term. If the structure works, targeted speed, security and design improvements may be enough." },
  ],
  "app-development": [
    { q: "When does a business need a custom app?", a: "When spreadsheets and chat threads can't keep up, off-the-shelf tools don't fit how you work, or customers keep asking for updates they could see themselves — a focused custom app can remove that manual work." },
    { q: "How long does it take to build an app?", a: "A focused first version usually takes four to eight weeks after a short discovery phase. Starting small and improving with real usage keeps cost and risk down." },
  ],
  "ui-ux-design": [
    { q: "What does a UI/UX designer do?", a: "A UI/UX designer works out how a website or app should work for the people using it (UX), then designs how it looks (UI). In practice that means research, user journeys, wireframes, a clickable prototype and final screens developers can build." },
    { q: "Why test a prototype before building?", a: "Changing a prototype takes hours; changing a built product takes weeks. Testing clickable screens with a few real users catches confusing steps before they cost development time." },
  ],
  "conversion-rate-optimisation": [
    { q: "How can an ecommerce business improve conversion rates?", a: "Start where shoppers drop off: make product pages answer the key questions (price, delivery, returns, sizing), show reviews near the buy button, speed up mobile pages, simplify checkout and offer the payment methods your customers use. Then follow up abandoned carts by email or WhatsApp." },
    { q: "What is a good conversion rate?", a: "It varies widely by industry, price and traffic source, so the most useful benchmark is your own: measure today's rate accurately, then improve it step by step." },
  ],
  "business-consulting": [
    { q: "When should a small business hire a consultant?", a: "When growth stalls, when every decision depends on the owner, before a big investment such as a new market or product, or when you need an outside view on pricing and operations." },
  ],
  "accountability-coaching": [
    { q: "Does accountability coaching work for business owners?", a: "It works best for people who already know roughly what to do but struggle to do it consistently. Regular check-ins and written commitments make it harder for important work to slip week after week." },
  ],
  "marketing-promotion": [
    { q: "How do I promote a new business or product launch?", a: "Pick one clear message and offer, build anticipation for 2–4 weeks with teasers and a waitlist, launch across the channels your audience uses (social, WhatsApp, email, partners or influencers), then follow up with people who showed interest. Track each channel with links or codes." },
  ],
  "web3-development": [
    { q: "What does a Web3 developer do?", a: "A Web3 developer builds applications that use blockchains: writing smart contracts, building the website or app users connect their wallets to, reading and indexing on-chain data, and deploying everything safely to testnets and mainnet." },
  ],
  "smart-contract-development": [
    { q: "How do I make a smart contract secure?", a: "Use well-tested libraries such as OpenZeppelin, keep logic simple, restrict admin functions and put them behind a multisig, write unit and fuzz tests, run static analysis, have it reviewed by someone who didn't write it, and get an independent audit before holding significant value." },
    { q: "What are the most common smart contract vulnerabilities?", a: "Reentrancy, missing or weak access control, unchecked external calls, price-oracle manipulation, using tx.origin for authorisation, unsafe upgrade patterns and rounding errors in token maths. Our free smart contract check flags many of these." },
  ],
  "blockchain-crypto": [
    { q: "How do I launch a crypto project?", a: "Define the problem and whether a token is genuinely needed, design and document tokenomics and vesting, build and test the contracts, publish a clear website and docs, verify contracts publicly, build the community before launch, and get legal advice for your jurisdiction." },
  ],
  "digital-strategy": [
    { q: "How do I choose the right digital growth services for my business?", a: "Start with where you lose the most customers today. If people can't find you, fix visibility (website, Google profile, SEO). If they find you but don't buy, fix replies, offers and follow-up. If you're ready to grow, add ads and content. Our free growth assessment shows which applies to you." },
  ],
};

Object.assign(SERVICE_QA, PUBLISHING_QA);

/** Portfolio projects relevant to a service, matched by category or stack. */
export const SERVICE_WORK_MATCH: Record<string, { categories?: string[]; stack?: string[] }> = {
  "ai-automation": { categories: ["Automation"], stack: ["Make.com", "WhatsApp", "Twilio"] },
  "lead-generation": { stack: ["HubSpot", "Google Ads", "Meta Ads"] },
  "sales-conversion": { stack: ["Stripe", "Paystack", "HubSpot"] },
  copywriting: { categories: ["Websites"] },
  "funnel-building": { stack: ["ConvertKit", "Teachable", "Stripe"] },
  "crm-systems": { stack: ["HubSpot", "Notion"] },
  "social-media-automation": { categories: ["Social Media", "Branding"], stack: ["Instagram", "Reels"] },
  "email-marketing": { stack: ["Klaviyo", "Mailchimp", "ConvertKit"] },
  "website-landing-pages": { categories: ["Websites"] },
  "shopify-ecommerce": { categories: ["Ecommerce"] },
  "paid-ads": { stack: ["Meta Ads", "Google Ads"] },
  seo: { stack: ["GBP"] },
  analytics: { stack: ["HubSpot"] },
  wordpress: { categories: ["Websites"] },
  "app-development": { stack: ["Paystack", "Notion", "Next.js"] },
  "digital-strategy": { categories: ["Ecommerce", "Websites"] },
  "ui-ux-design": { categories: ["Websites", "Branding"] },
  "conversion-rate-optimisation": { categories: ["Ecommerce", "Websites"] },
  "marketing-promotion": { categories: ["Social Media", "Branding"] },
};

/** Related services shown at the bottom of a service page (by /services or /expertise slug). */
export const RELATED_SERVICES: Record<string, { label: string; to: string }[]> = {
  default: [
    { label: "AI Automation", to: "/services/ai-automation" },
    { label: "Website Design & Development", to: "/services/website-design" },
    { label: "Email Marketing", to: "/services/email-marketing" },
    { label: "Paid Advertising", to: "/services/ad-marketing" },
  ],
};
