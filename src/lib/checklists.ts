/** Downloadable checklists (lead magnets). Each item: what to check, and why it matters. */
export interface Checklist {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  icon: string;
  audience: string;
  related: { label: string; to: string };
  tool: { label: string; to: string };
  sections: { title: string; items: [string, string][] }[];
}

export const CHECKLISTS: Checklist[] = [
  {
    slug: "website-launch-checklist",
    title: "Website Launch Checklist",
    seoTitle: "Website Launch Checklist: 35 Checks Before You Go Live",
    description: "Everything to check before (and right after) a new business website goes live: content, mobile, speed, SEO, tracking, security and launch day.",
    icon: "🚀", audience: "Business owners launching or relaunching a website",
    related: { label: "Website design & development", to: "/services/website-design" },
    tool: { label: "Run a free website audit", to: "/website-audit" },
    sections: [
      { title: "Message and content", items: [
        ["Headline says what you do, for whom, and the result", "Visitors decide in seconds whether they're in the right place."],
        ["One primary call to action on every page", "Book, buy, call or WhatsApp: make the next step obvious."],
        ["Prices or price guidance where possible", "Hidden prices make many visitors leave instead of asking."],
        ["Real photos of your work, team or products", "Stock photos rarely build trust."],
        ["Reviews or results near the call to action", "Proof works best at the moment of decision."],
        ["Every page proofread on a phone", "Typos and broken layouts show up most on small screens."],
      ]},
      { title: "Mobile and design", items: [
        ["Text readable without zooming", "Most visitors are on phones."],
        ["Buttons big enough to tap", "Small, crowded buttons cause mis-taps and frustration."],
        ["No pop-up covering the page on mobile", "Intrusive pop-ups annoy visitors and can hurt search visibility."],
        ["WhatsApp and click-to-call visible on every page", "One tap to contact you."],
        ["Forms work with the phone keyboard", "Use email and phone input types; keep fields few."],
      ]},
      { title: "Speed", items: [
        ["Images resized and compressed (WebP where possible)", "Large images are the most common cause of slow pages."],
        ["Unused plugins and scripts removed", "Every script adds load time."],
        ["Homepage tested on mobile data", "Office Wi-Fi hides real-world slowness."],
        ["Google PageSpeed Insights run on key pages", "It shows Core Web Vitals and what to fix."],
      ]},
      { title: "Search (SEO)", items: [
        ["Unique title (50–60 characters) on each page", "Titles are what people click in search results."],
        ["Unique meta description (120–155 characters)", "Otherwise Google picks random text."],
        ["One H1 per page, logical headings below", "Helps search engines and screen readers understand the page."],
        ["Descriptive alt text on meaningful images", "Accessibility and image search."],
        ["XML sitemap published and submitted", "So search engines find every page."],
        ["robots.txt doesn't block important pages", "A common accident after launch."],
        ["Google Business Profile complete and linked", "Essential for local searches and maps."],
        ["Structured data for your organisation", "Helps search and AI tools describe your business correctly."],
      ]},
      { title: "Tracking", items: [
        ["Analytics installed and tested", "You can't improve what you can't measure."],
        ["Key actions tracked: calls, WhatsApp, forms, bookings, sales", "Page views alone don't tell you what earns money."],
        ["Google Search Console verified", "See search queries and indexing problems."],
        ["Form submissions arrive in your inbox (tested)", "Broken forms are silent lead killers."],
      ]},
      { title: "Security and legal", items: [
        ["HTTPS everywhere, http redirects to https", "Browsers warn visitors on insecure pages."],
        ["Privacy policy (and cookie notice if you use tracking cookies)", "Required in many countries, including under GDPR and NDPR."],
        ["Backups scheduled and restore tested", "A backup you can't restore isn't a backup."],
        ["Admin accounts use strong passwords and two-factor login", "Most hacks start with weak logins."],
      ]},
      { title: "Launch day and after", items: [
        ["Old URLs redirected to new ones (301)", "Keeps search rankings and old links working."],
        ["Share-link preview checked on WhatsApp and social", "Title and image should look professional."],
        ["Test purchase or booking completed end to end", "Catch payment and confirmation issues before customers do."],
        ["Review analytics and Search Console after one week", "Fix early issues while they're small."],
      ]},
    ],
  },
  {
    slug: "conversion-checklist",
    title: "Conversion Rate Checklist",
    seoTitle: "Conversion Rate Checklist: 32 Fixes for More Customers",
    description: "A practical CRO checklist for websites, landing pages and online stores: first impression, trust, forms, checkout, speed, follow-up and measurement.",
    icon: "📈", audience: "Businesses with traffic that isn't converting well enough",
    related: { label: "Conversion rate optimisation", to: "/expertise/conversion-rate-optimisation" },
    tool: { label: "Find your leaks with the free audit", to: "/website-audit" },
    sections: [
      { title: "First impression (above the fold)", items: [
        ["Headline states the outcome the customer gets", "Benefits beat features."],
        ["Sub-headline says who it's for and how", "Visitors self-qualify quickly."],
        ["One clear primary button", "Too many choices lower action."],
        ["A visual that shows the product or result", "Show, don't just tell."],
        ["Loads fast enough to see this without waiting", "Slow first paint loses visitors before they read."],
      ]},
      { title: "Trust", items: [
        ["Reviews with names, photos or links", "Specific beats anonymous."],
        ["Client logos or results with context", "Numbers need a timeframe and source."],
        ["Guarantee or risk-reversal clearly explained", "Lowers the cost of saying yes."],
        ["Real contact details and location", "People buy from businesses they can reach."],
        ["Secure payment badges near checkout", "Reassurance at the moment of paying."],
      ]},
      { title: "Offer and pricing", items: [
        ["Price or 'from' price visible", "Unknown cost is a common reason to leave."],
        ["What's included is crystal clear", "Ambiguity creates hesitation."],
        ["Answer the top 5 objections on the page", "Delivery time, returns, sizing, contracts, support."],
        ["A reason to act now that is true", "Honest deadlines or limited availability only."],
      ]},
      { title: "Forms and enquiries", items: [
        ["Only ask for what you need", "Every extra field reduces completions."],
        ["WhatsApp as an alternative to forms", "Many customers prefer chat."],
        ["Clear confirmation after submitting", "Tell people what happens next and when."],
        ["Instant reply to every enquiry", "Speed of reply strongly affects who wins the sale."],
      ]},
      { title: "Checkout (online stores)", items: [
        ["Guest checkout allowed", "Forced account creation causes abandonment."],
        ["Delivery cost shown early", "Surprise costs are the classic abandonment reason."],
        ["Local payment methods offered", "Cards, transfers, mobile money, Paystack or Flutterwave where relevant."],
        ["Progress steps visible", "People like to know how much is left."],
        ["Mobile checkout tested end to end", "Most purchases start on phones."],
      ]},
      { title: "Follow-up", items: [
        ["Abandoned cart email or WhatsApp", "Brings back a share of near-buyers."],
        ["Follow-up for enquiries that didn't book", "Most people need more than one touch."],
        ["Post-purchase review request", "Feeds your trust section."],
        ["Win-back message for past customers", "Repeat customers are cheaper than new ones."],
      ]},
      { title: "Measurement and testing", items: [
        ["Conversion tracked by traffic source", "Know which channels bring buyers, not just visitors."],
        ["Funnel drop-off reviewed monthly", "Fix the biggest leak first."],
        ["Heatmaps or recordings on key pages", "See what people actually do."],
        ["One change tested at a time", "So you know what caused the result."],
        ["Results written down, wins rolled out", "Testing is only useful if you act on it."],
      ]},
    ],
  },
  {
    slug: "web3-launch-checklist",
    title: "Web3 & Crypto Launch Checklist",
    seoTitle: "Web3 & Crypto Launch Checklist: 34 Checks Before Mainnet",
    description: "A launch checklist for dApps, tokens and NFT projects: tokenomics, smart contract security, UX, transparency, community, launch day and legal.",
    icon: "⛓️", audience: "Crypto founders and Web3 teams preparing a launch",
    related: { label: "Smart contracts & Solidity", to: "/expertise/smart-contract-development" },
    tool: { label: "Free smart contract check", to: "/smart-contract-check" },
    sections: [
      { title: "Strategy and tokenomics", items: [
        ["Clear problem the product solves for users", "Utility first; hype fades."],
        ["Decision documented: token, NFT, payments or no token", "Not every product needs a token."],
        ["Supply, allocation and emissions published", "Hidden tokenomics are a red flag."],
        ["Team and investor vesting schedules set", "Prevents insiders dumping at launch."],
        ["Treasury policy written", "Who can spend what, and how decisions are made."],
      ]},
      { title: "Smart contract security", items: [
        ["Written specification of every function and role", "Bugs live between intent and code."],
        ["OpenZeppelin (or equivalent audited) libraries used", "Don't reinvent tokens or access control."],
        ["Admin functions restricted and tested", "Minting, pausing, upgrades and withdrawals."],
        ["Admin keys held by a multisig, with a timelock for sensitive changes", "No single point of failure."],
        ["Reentrancy guarded; state updated before external calls", "One of the most common exploits."],
        ["No tx.origin authorisation; external call results checked", "Classic, avoidable issues."],
        ["Randomness from a verifiable source (e.g. Chainlink VRF)", "Block data can be predicted."],
        ["Oracle prices from robust sources with sanity checks", "Single-pool prices can be manipulated."],
        ["Unit, fuzz and invariant tests passing", "Find what you didn't think of."],
        ["Static analysis run and every warning reviewed", "Tools like Slither catch common issues."],
        ["Independent review; formal audit for significant value", "Authors are the worst reviewers of their own code."],
      ]},
      { title: "Product and UX", items: [
        ["Wallet connection tested on major wallets and mobile", "Most drop-off happens here."],
        ["Clear transaction states and helpful errors", "Users must know what's happening."],
        ["Gas estimates and network switching handled", "Fewer failed transactions and support tickets."],
        ["Plain-English explanations for non-crypto users", "Grow beyond the crypto bubble."],
      ]},
      { title: "Transparency", items: [
        ["Contracts verified on the block explorer", "Anyone can check the code."],
        ["Team, roadmap and risks published", "Trust needs accountability."],
        ["Docs explain how the product and token work", "Answers before questions."],
        ["Official links listed in one place", "Protects users from impersonators and phishing."],
      ]},
      { title: "Community and launch", items: [
        ["Community channels set up and moderated", "Discord, Telegram or X, with anti-scam rules."],
        ["Testnet phase with real users", "Real feedback without real money at risk."],
        ["Launch-day runbook with owners and times", "Who does what, when, and who can pause."],
        ["Monitoring and alerts on contracts", "Spot problems in minutes, not days."],
        ["Incident response plan written", "Decide in calm what you'll do in a crisis."],
      ]},
      { title: "Legal and communication", items: [
        ["Legal advice for your jurisdictions obtained", "Token rules differ by country."],
        ["No promises of returns or prices anywhere", "Misleading and, in many places, unlawful."],
        ["Terms and risk disclosures published", "Users should understand the risks."],
        ["Post-launch roadmap and update rhythm", "Keep shipping after launch day."],
        ["Bug bounty considered", "Rewards responsible disclosure."],
      ]},
    ],
  },
  {
    slug: "ai-automation-readiness-checklist",
    title: "AI Automation Readiness Checklist",
    seoTitle: "AI Automation Readiness Checklist for Small Businesses",
    description: "Is your business ready for an AI assistant or workflow automation? Check processes, information, channels, hand-offs, privacy and measurement.",
    icon: "🤖", audience: "Owners considering an AI receptionist or business automation",
    related: { label: "AI automation", to: "/services/ai-automation" },
    tool: { label: "Try the AI receptionist demo", to: "/ai-receptionist" },
    sections: [
      { title: "Pick the right processes", items: [
        ["List the 10 questions customers ask most", "These are the first things to automate."],
        ["Note tasks you repeat daily (replies, reminders, follow-ups)", "Frequent, rule-based work automates best."],
        ["Estimate how many enquiries arrive after hours", "That's where instant replies help most."],
        ["Choose one process to automate first", "Start small, prove it, then expand."],
      ]},
      { title: "Get your information ready", items: [
        ["Up-to-date price list or price ranges", "The assistant can only be as accurate as its information."],
        ["Opening hours, locations and delivery areas", "The most common questions."],
        ["Policies: deposits, cancellations, refunds", "Clear rules prevent awkward replies."],
        ["Tone of voice notes (formal, friendly, Pidgin OK?)", "Make it sound like your business."],
      ]},
      { title: "Channels and tools", items: [
        ["Which channels customers use: WhatsApp, Instagram, website, email", "Automate where customers already are."],
        ["Calendar or booking system to connect", "So bookings land in one place."],
        ["Where leads should be stored (CRM or sheet)", "Every enquiry recorded."],
        ["WhatsApp Business app or Business Platform decided", "The API is needed for full automation."],
      ]},
      { title: "People and hand-offs", items: [
        ["When a human must take over (complaints, big orders, VIPs)", "Automation should know its limits."],
        ["Who receives hand-offs, and how fast they respond", "Hand-offs fail if nobody picks them up."],
        ["Team briefed on what the assistant does", "Avoid duplicate or conflicting replies."],
      ]},
      { title: "Privacy and quality", items: [
        ["What customer data is stored, where, and for how long", "Respect privacy laws such as GDPR and NDPR."],
        ["Assistant only answers from approved information", "Prevents made-up answers."],
        ["Test conversations reviewed before launch", "Catch mistakes before customers do."],
      ]},
      { title: "Measure", items: [
        ["Baseline: current reply time and enquiries per week", "So you can see the difference."],
        ["Track bookings or sales from automated chats", "Measure value, not just volume."],
        ["Monthly review of conversations to improve answers", "Automation gets better with tuning."],
      ]},
    ],
  },
  {
    slug: "product-launch-checklist",
    title: "Product & Event Launch Checklist",
    seoTitle: "Product Launch Checklist: A 4-Week Promotion Plan",
    description: "A week-by-week checklist to promote a product, service, event or offer: plan, tease, build momentum, launch and follow up.",
    icon: "📣", audience: "Brands and businesses launching something new",
    related: { label: "Marketing & promotion", to: "/expertise/marketing-promotion" },
    tool: { label: "Get a launch proposal", to: "/proposal" },
    sections: [
      { title: "Week 1: Plan", items: [
        ["Audience in one sentence", "Everything else follows from who it's for."],
        ["Offer in one line, with the launch bonus or reason to act", "Clarity sells."],
        ["Two or three channels chosen", "Do a few channels well."],
        ["Landing page with waitlist live", "Collect interest before launch day."],
        ["Tracking links or codes for every channel", "Know what worked."],
        ["Partners and creators shortlisted", "Borrow audiences that already trust them."],
      ]},
      { title: "Week 2: Tease", items: [
        ["Problem-focused content before revealing the product", "Build the 'I need that' feeling."],
        ["Behind-the-scenes and previews", "People love the making-of."],
        ["Waitlist invitation in every post", "Turn attention into contacts."],
        ["Partners briefed with deliverables and dates", "No last-minute surprises."],
      ]},
      { title: "Week 3: Momentum", items: [
        ["Proof shared: tester feedback, demos, pilot results", "Social proof before launch."],
        ["Small ad tests on message and audience", "Find winners before spending big."],
        ["Waitlist updates via WhatsApp or email", "Keep interest warm."],
        ["Launch-day content prepared and scheduled", "Launch day is for responding, not creating."],
      ]},
      { title: "Week 4: Launch and follow up", items: [
        ["Waitlist gets first access", "Reward early supporters."],
        ["Partners post in the same window", "Concentrated attention."],
        ["Best-performing ads scaled", "Spend where it works."],
        ["Follow-up for clickers who didn't buy", "Many sales come from follow-up."],
        ["Results reported by channel", "Learn for the next launch."],
      ]},
    ],
  },
];

export function findChecklist(slug: string) {
  return CHECKLISTS.find((c) => c.slug === slug);
}

export function itemCount(c: Checklist) {
  return c.sections.reduce((n, s) => n + s.items.length, 0);
}
