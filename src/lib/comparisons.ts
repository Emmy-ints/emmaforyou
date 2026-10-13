/** Honest side-by-side comparisons. Product facts are general and dated; prices change, so we link out rather than quote them. */
export interface Comparison {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  category: string;
  icon: string;
  /** The direct answer, first. */
  answer: string;
  options: string[];
  rows: { label: string; values: string[] }[];
  bestFor: { option: string; when: string }[];
  notes: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  howWeHelp: { text: string; links: { label: string; to: string }[] };
}

export const UPDATED = "October 2026";

export const COMPARISONS: Comparison[] = [
  {
    slug: "agency-vs-freelancer-vs-diy",
    title: "Agency vs Freelancer vs Doing It Yourself",
    seoTitle: "Agency vs Freelancer vs DIY: Which Is Right for Your Business?",
    description: "Should you hire a digital agency, a freelancer, or do it yourself? An honest comparison of cost, speed, quality, risk and when each option makes sense.",
    category: "Choosing help", icon: "🧭",
    answer: "Do it yourself when budget is very tight and you have time to learn. Hire a freelancer for one well-defined job, such as a logo or a landing page. Choose an agency when you need several things to work together (website, automation, ads, follow-up) and want one partner accountable for results.",
    options: ["Agency", "Freelancer", "DIY"],
    rows: [
      { label: "Upfront cost", values: ["Highest", "Medium", "Lowest (your time)"] },
      { label: "Your time needed", values: ["Low", "Medium (managing)", "High"] },
      { label: "Range of skills", values: ["Broad team: strategy, design, build, ads, automation", "Usually one specialism", "Whatever you can learn"] },
      { label: "Speed", values: ["Fast, several people in parallel", "Depends on one person's availability", "Slow while learning"] },
      { label: "Accountability for results", values: ["One partner owns the system", "For their piece only", "You"] },
      { label: "Risk if someone disappears", values: ["Low (team continuity)", "Higher", "None, but no backup"] },
      { label: "Best for", values: ["Growth systems and ongoing work", "Single, well-scoped tasks", "Testing an idea on a tiny budget"] },
    ],
    bestFor: [
      { option: "Agency", when: "You want more customers and need the website, automation, marketing and follow-up to work as one system." },
      { option: "Freelancer", when: "You have a clear, one-off task and can manage it yourself." },
      { option: "DIY", when: "You're pre-revenue, testing an idea, and have more time than money." },
    ],
    notes: [
      { title: "The hidden cost of mixing freelancers", body: "Many businesses hire one person for the website, another for social media and a third for ads. Each does their part, but nobody owns whether customers actually arrive and buy. When results are flat, it's hard to know what to fix." },
      { title: "Not all agencies are equal", body: "Ask for real work, a written scope, who does the work, how results are measured, and who owns your accounts. Our guide to choosing an agency lists 12 questions to ask." },
    ],
    faqs: [
      { q: "Is an agency always more expensive?", a: "Upfront, usually yes. Over a year it can cost less if it avoids rebuilds, wasted ad spend and lost enquiries, but only if the agency measures results." },
      { q: "Can I start DIY and switch later?", a: "Yes. Keep your domain, website and ad accounts in your own name from day one, so switching is easy." },
    ],
    howWeHelp: { text: "EmmaForYou is built for businesses that want one accountable partner for the whole growth system, with published monthly plans and month-to-month terms.", links: [{ label: "Why EmmaForYou", to: "/why-emmaforyou" }, { label: "How to choose an agency", to: "/blog/how-to-choose-a-digital-agency" }, { label: "Get an instant proposal", to: "/proposal" }] },
  },
  {
    slug: "shopify-vs-woocommerce",
    title: "Shopify vs WooCommerce",
    seoTitle: "Shopify vs WooCommerce: Which Is Better for Your Online Store?",
    description: "Shopify or WooCommerce? Compare cost, ease of use, payments (including in Nigeria), flexibility, maintenance and scaling to choose the right ecommerce platform.",
    category: "Ecommerce", icon: "🛒",
    answer: "Choose Shopify if you want to launch quickly and not worry about hosting, security or updates. Choose WooCommerce if you already run WordPress, want full control and ownership, or need flexibility a hosted platform doesn't allow, and you're comfortable managing (or paying someone to manage) maintenance.",
    options: ["Shopify", "WooCommerce"],
    rows: [
      { label: "What it is", values: ["Hosted ecommerce platform (subscription)", "Free open-source plugin for WordPress (self-hosted)"] },
      { label: "Running costs", values: ["Monthly plan, plus paid apps and themes; transaction fees may apply depending on payment provider", "Hosting, domain, premium plugins and themes; no platform subscription"] },
      { label: "Ease of setup", values: ["Easier; most things work out of the box", "More setup; more choices to make"] },
      { label: "Hosting, security, updates", values: ["Handled by Shopify", "Your responsibility (or your developer's)"] },
      { label: "Flexibility", values: ["High within Shopify's rules; deep custom checkout changes are limited on some plans", "Very high; you control the code and data"] },
      { label: "Payments", values: ["Shopify Payments isn't available in every country (including Nigeria at the time of writing); third-party gateways are supported", "Many gateways via plugins, including Paystack and Flutterwave"] },
      { label: "Content and blogging", values: ["Good basics", "Excellent (it's WordPress)"] },
      { label: "Scaling", values: ["Scales without you managing servers", "Scales well with good hosting and maintenance"] },
    ],
    bestFor: [
      { option: "Shopify", when: "You want to sell quickly, have limited technical help, and prefer predictable monthly costs." },
      { option: "WooCommerce", when: "You already use WordPress, need full control or unusual features, or want to avoid platform lock-in." },
    ],
    notes: [
      { title: "Check payments first", body: "Which payment methods your customers use (cards, bank transfer, mobile money) and which providers work in your country often decides the platform. Confirm current availability and fees on each provider's site before you build." },
      { title: "Total cost, not just price", body: "Add up subscription or hosting, apps or plugins, payment fees and maintenance over 12 months. Prices change, so check the official pricing pages." },
    ],
    faqs: [
      { q: "Which is better for SEO?", a: "Both can rank well. WooCommerce gives more control because it's WordPress; Shopify covers the essentials well. Content and site speed matter more than the platform." },
      { q: "Can I move from one to the other later?", a: "Yes, products, customers and orders can be migrated, but it takes planning, especially redirects from old URLs." },
    ],
    howWeHelp: { text: "We build and grow stores on both platforms, connect local payments, and set up abandoned-cart and post-purchase automation.", links: [{ label: "Ecommerce growth service", to: "/services/ecommerce" }, { label: "Conversion checklist", to: "/checklists/conversion-checklist" }, { label: "See ecommerce client work", to: "/portfolio" }] },
  },
  {
    slug: "website-builder-vs-wordpress-vs-custom",
    title: "Website Builder vs WordPress vs Custom-Coded Site",
    seoTitle: "Website Builder vs WordPress vs Custom Site: Which to Choose?",
    description: "Wix and Squarespace-style builders, WordPress, or a custom-coded website? Compare cost, speed, flexibility, maintenance and when each is the right choice.",
    category: "Websites", icon: "🌐",
    answer: "Use a website builder for a simple site you want to edit yourself with minimal setup. Use WordPress when content, blogging and plugins matter and you'll maintain it. Choose a custom-coded site when speed, unique features, integrations or a premium experience are central to how you win customers.",
    options: ["Website builder", "WordPress", "Custom code"],
    rows: [
      { label: "Build cost", values: ["Lowest", "Low to medium", "Highest"] },
      { label: "Monthly cost", values: ["Platform subscription", "Hosting + plugin licences", "Hosting (often low)"] },
      { label: "Ease of editing", values: ["Very easy, drag and drop", "Easy for content; harder for layout", "Needs a CMS or developer for big changes"] },
      { label: "Speed", values: ["Good, but limited control", "Varies with theme and plugins", "Can be the fastest"] },
      { label: "Flexibility", values: ["Limited to the builder's features", "High, through plugins", "Unlimited"] },
      { label: "Maintenance", values: ["Handled by the platform", "Regular updates and security needed", "Light, but needs a developer"] },
      { label: "Integrations (CRM, WhatsApp, AI)", values: ["Basic, via add-ons", "Many plugins", "Anything with an API"] },
    ],
    bestFor: [
      { option: "Website builder", when: "A simple brochure site, small budget, and you want to edit it yourself." },
      { option: "WordPress", when: "You publish lots of content and want a huge plugin ecosystem." },
      { option: "Custom code", when: "Your website is a key sales engine, needs custom features or integrations, or must be very fast." },
    ],
    notes: [{ title: "What matters more than the platform", body: "A clear message, fast mobile pages, one obvious call to action, proof and tracking. Any of the three can do these well, or badly." }],
    faqs: [{ q: "Which is cheapest over three years?", a: "It depends on your plugins, hosting and how often you need changes. Builders have predictable fees; WordPress has variable maintenance; custom has the highest build cost but can be cheap to run." }],
    howWeHelp: { text: "We build on WordPress and with modern custom code, and recommend whichever fits your goals and budget.", links: [{ label: "Website design & development", to: "/services/website-design" }, { label: "Website launch checklist", to: "/checklists/website-launch-checklist" }, { label: "Free website audit", to: "/website-audit" }] },
  },
  {
    slug: "whatsapp-business-app-vs-api",
    title: "WhatsApp Business App vs WhatsApp Business Platform (API)",
    seoTitle: "WhatsApp Business App vs API: Which Does Your Business Need?",
    description: "The free WhatsApp Business app or the WhatsApp Business Platform (API)? Compare automation, team access, chatbots, broadcasts, cost and when to upgrade.",
    category: "AI automation", icon: "💬",
    answer: "Start with the free WhatsApp Business app if one or two people reply manually. Move to the WhatsApp Business Platform (the API) when you need automated replies or an AI assistant, several team members, integrations with your CRM or bookings, or automated reminders and confirmations.",
    options: ["Business app", "Business Platform (API)"],
    rows: [
      { label: "Cost", values: ["Free app", "Meta charges for some message types; rates vary by country (check Meta's current pricing)"] },
      { label: "Set-up", values: ["Download and verify your number", "Meta Business account, app or provider setup, verification"] },
      { label: "Who can reply", values: ["Your phone plus a few linked devices", "Many agents through a shared inbox or software"] },
      { label: "Automation", values: ["Greeting, away messages and quick replies", "Full automation, chatbots and AI assistants"] },
      { label: "Business-initiated messages", values: ["Manual broadcasts to contacts who saved your number", "Approved message templates (confirmations, reminders, updates)"] },
      { label: "Integrations", values: ["Limited", "CRM, booking, ecommerce, AI, analytics"] },
      { label: "Interface", values: ["The WhatsApp app", "Needs software (inbox or custom app)"] },
    ],
    bestFor: [
      { option: "Business app", when: "A small business replying manually, with modest message volume." },
      { option: "Business Platform (API)", when: "You miss messages, have a team, or want instant AI replies, bookings and reminders." },
    ],
    notes: [{ title: "Can I keep my number?", body: "Often yes, but rules for using the same number in both the app and the API depend on your region and setup. Meta's onboarding tells you what's possible for your number." }],
    faqs: [{ q: "Do customers notice the difference?", a: "Only in a good way: faster replies, instant confirmations and reminders. Messages still arrive in their normal WhatsApp." }],
    howWeHelp: { text: "We set up the WhatsApp Business Platform, connect it to your calendar and CRM, and add an AI receptionist trained on your business.", links: [{ label: "AI automation service", to: "/services/ai-automation" }, { label: "Try the AI receptionist", to: "/ai-receptionist" }, { label: "AI automation readiness checklist", to: "/checklists/ai-automation-readiness-checklist" }] },
  },
  {
    slug: "ai-receptionist-vs-human-receptionist",
    title: "AI Receptionist vs Human Receptionist",
    seoTitle: "AI Receptionist vs Human Receptionist: Cost, Speed and Quality",
    description: "Should an AI assistant or a person answer your customers? Compare availability, speed, cost, quality and the hybrid setup most small businesses end up with.",
    category: "AI automation", icon: "🤖",
    answer: "For most small businesses the best answer is both: an AI receptionist handles instant replies, common questions and bookings around the clock, and hands complaints, complex quotes and VIP customers to a person.",
    options: ["AI receptionist", "Human receptionist", "Hybrid"],
    rows: [
      { label: "Availability", values: ["24/7", "Working hours", "24/7 with human backup"] },
      { label: "Reply speed", values: ["Seconds", "Minutes to hours when busy", "Seconds, then human when needed"] },
      { label: "Many chats at once", values: ["Yes", "One or two at a time", "Yes"] },
      { label: "Empathy and judgement", values: ["Good for routine, limited for sensitive cases", "Excellent", "Best of both"] },
      { label: "Cost", values: ["Setup + monthly", "Salary and overheads", "Setup + monthly + part of a person's time"] },
      { label: "Consistency", values: ["Always uses approved answers", "Varies by person and day", "High"] },
    ],
    bestFor: [
      { option: "AI receptionist", when: "High message volume, lots of repeated questions, enquiries after hours." },
      { option: "Human receptionist", when: "Few, high-value, complex conversations." },
      { option: "Hybrid", when: "Most growing businesses: fast replies plus a human touch where it counts." },
    ],
    notes: [{ title: "Avoid the bad version", body: "A good AI receptionist answers only from your approved information and hands over when unsure. Badly set-up bots that guess or trap customers in menus damage trust." }],
    faqs: [{ q: "Will customers know it's AI?", a: "You decide how it introduces itself. We recommend being open about it; customers mainly care that they get a fast, correct answer." }],
    howWeHelp: { text: "We design hybrid setups: an AI assistant on WhatsApp, Instagram and your website, with clear hand-off rules to your team.", links: [{ label: "Try the AI receptionist", to: "/ai-receptionist" }, { label: "AI receptionist guide", to: "/blog/ai-receptionist-small-business" }, { label: "AI automation service", to: "/services/ai-automation" }] },
  },
  {
    slug: "seo-vs-paid-ads",
    title: "SEO vs Paid Ads",
    seoTitle: "SEO vs Paid Ads: Which Should a Small Business Invest In?",
    description: "SEO or paid advertising? Compare speed, cost, longevity, control and trust, and how to combine them, so your budget brings customers.",
    category: "Marketing", icon: "🔎",
    answer: "Paid ads bring traffic as soon as campaigns run and stop when you stop paying. SEO takes months to build but keeps bringing visitors without paying per click. Most businesses do best with ads for immediate demand and testing, and SEO for long-term, lower-cost growth.",
    options: ["SEO", "Paid ads"],
    rows: [
      { label: "Time to results", values: ["Usually months", "Days"] },
      { label: "Cost model", values: ["Time or agency fees; no cost per click", "Pay per click or impression, plus management"] },
      { label: "When you stop", values: ["Rankings decay slowly", "Traffic stops immediately"] },
      { label: "Control and targeting", values: ["Less direct control", "Precise targeting and budgets"] },
      { label: "Testing messages quickly", values: ["Slow", "Fast"] },
      { label: "Trust", values: ["Organic results earn trust", "Clearly labelled as ads"] },
    ],
    bestFor: [
      { option: "SEO", when: "You can invest for the long term and people search for what you sell." },
      { option: "Paid ads", when: "You need customers now, are launching something, or want to test offers fast." },
    ],
    notes: [{ title: "Fix conversion first", body: "Both send visitors to your website. If it doesn't convert, both get expensive. Run the free audit before spending on either." }],
    faqs: [{ q: "How long does SEO take?", a: "Local and low-competition terms can move within a few months; competitive terms take longer. Anyone guaranteeing rankings is guessing." }],
    howWeHelp: { text: "We plan both together: ads for immediate demand and learning, SEO and content for compounding growth, all measured in one place.", links: [{ label: "SEO service", to: "/expertise/seo" }, { label: "Paid advertising", to: "/services/ad-marketing" }, { label: "Free website audit", to: "/website-audit" }] },
  },
  {
    slug: "meta-ads-vs-google-ads",
    title: "Meta Ads vs Google Ads",
    seoTitle: "Meta Ads vs Google Ads: Where Should You Advertise?",
    description: "Facebook and Instagram ads or Google Ads? Compare intent, targeting, creative, cost and the businesses each works best for.",
    category: "Marketing", icon: "📣",
    answer: "Google Search ads capture people already looking for what you sell. Meta ads (Facebook and Instagram) create demand by showing your offer to people likely to want it. Use Google when there's search demand; use Meta for visual products, new offers and building audiences.",
    options: ["Meta Ads", "Google Ads"],
    rows: [
      { label: "How people find you", values: ["You interrupt their scroll", "They search for you"] },
      { label: "Intent", values: ["Lower; you create interest", "High; they're actively looking"] },
      { label: "Targeting", values: ["Interests, behaviours, lookalikes, retargeting", "Keywords, location, audiences"] },
      { label: "Creative", values: ["Images and video essential", "Text ads, plus visual formats"] },
      { label: "Works best for", values: ["Fashion, beauty, food, events, consumer products", "Services people search for: clinics, repairs, legal, B2B"] },
    ],
    bestFor: [
      { option: "Meta Ads", when: "Visual products, launches, and audiences who don't search for you yet." },
      { option: "Google Ads", when: "People already search for your service in your area." },
    ],
    notes: [{ title: "Retarget on both", body: "Most buyers don't convert on the first visit. Retargeting people who visited your site is often the most efficient spend on either platform." }],
    faqs: [{ q: "How much should I spend?", a: "Enough to collect meaningful data on one offer and audience before judging results. We set budgets after looking at your margins and goals." }],
    howWeHelp: { text: "We run Meta and Google campaigns tied to real conversions (calls, WhatsApp, bookings, sales), not just clicks.", links: [{ label: "Paid advertising service", to: "/services/ad-marketing" }, { label: "Launch playbook", to: "/blog/launch-promotion-playbook" }, { label: "Get a proposal", to: "/proposal" }] },
  },
  {
    slug: "foundry-vs-hardhat",
    title: "Foundry vs Hardhat for Smart Contract Development",
    seoTitle: "Foundry vs Hardhat: Which Solidity Framework to Use?",
    description: "Foundry or Hardhat for Solidity development? Compare testing, speed, fuzzing, language, plugins and deployment for your next smart contract project.",
    category: "Web3", icon: "🛠️",
    answer: "Foundry is excellent when you want fast tests written in Solidity with built-in fuzzing and invariant testing. Hardhat suits teams who prefer a JavaScript/TypeScript workflow and its plugin ecosystem. Many teams use both, for example Foundry for testing and Hardhat for scripts and integrations.",
    options: ["Foundry", "Hardhat"],
    rows: [
      { label: "Language for tests", values: ["Solidity", "JavaScript/TypeScript (recent versions also support Solidity tests)"] },
      { label: "Speed", values: ["Very fast compilation and tests", "Fast; depends on setup"] },
      { label: "Fuzz and invariant testing", values: ["Built in", "Via plugins or newer built-in features"] },
      { label: "Local chain", values: ["Anvil", "Hardhat Network"] },
      { label: "Ecosystem", values: ["Growing; cast and chisel tools", "Large plugin ecosystem"] },
      { label: "Best fit", values: ["Security-focused Solidity teams", "Full-stack JS/TS teams"] },
    ],
    bestFor: [
      { option: "Foundry", when: "You want rigorous, fast testing in the same language as your contracts." },
      { option: "Hardhat", when: "Your team lives in TypeScript and relies on its plugins." },
    ],
    notes: [{ title: "The framework isn't the security", body: "Either works. What protects users is a clear spec, thorough tests (including fuzz and invariants), static analysis, review and an audit for significant value." }],
    faqs: [{ q: "Can I switch later?", a: "Yes. Contracts are plain Solidity; it's mainly tests and scripts that change." }],
    howWeHelp: { text: "We write and test Solidity with Foundry and Hardhat, and prepare contracts for audits.", links: [{ label: "Smart contracts & Solidity", to: "/expertise/smart-contract-development" }, { label: "Free smart contract check", to: "/smart-contract-check" }, { label: "Security checklist", to: "/blog/smart-contract-security-checklist" }] },
  },
];

export function findComparison(slug: string) {
  return COMPARISONS.find((c) => c.slug === slug);
}
