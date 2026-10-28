/** Questions and answers shown on /faq (also used for its FAQPage structured data). */
import { PUBLISHING_FAQS } from "./publishing-data";

export const CATEGORIES = [
  { id: "general", label: "General", items: [
    { q: "Do you work with businesses outside Nigeria?", a: "Yes — we serve clients in Nigeria, the United States, United Kingdom, France, Germany, Spain, Colombia, Ghana and South Africa. Most work is delivered remotely via WhatsApp and Zoom." },
    { q: "What makes EmmaForYou different from other agencies?", a: "We combine AI automation with traditional digital marketing — almost no agency does both well. We also know both African and Western markets deeply, and you always work with senior strategists." },
    { q: "Is my business too small or too new for EmmaForYou?", a: "Almost never. We've launched one-person businesses from zero to first 100 customers, and we've scaled established companies to seven figures." },
    { q: "How do I know if this will work for my business type?", a: "We've worked with 50+ niches. Take the free analyser or fill the intake form — we'll only take you on if we're confident we can deliver." },
    { q: "Where is EmmaForYou based?", a: "Headquartered in Nigeria with team members and clients across the United States, United Kingdom, France, Germany, Spain, Colombia and South Africa." },
  ]},
  { id: "pricing", label: "Pricing", items: [
    { q: "Do I need a big budget to work with you?", a: "No — Starter starts at $99/month and is built for new businesses. We have clients spending $99 and clients spending $10k+. The strategy matches the budget." },
    { q: "Do you offer payment plans?", a: "Yes — larger projects can be split into 2–3 monthly payments. Ongoing services bill monthly." },
    { q: "Are ad spend costs included in your prices?", a: "No — our price covers our management fee. You pay the ad platforms directly. This keeps everything transparent." },
    { q: "What's your refund policy?", a: "Pro plan has a 30-day money-back guarantee. All plans can be cancelled anytime with no penalty." },
    { q: "Do you accept payments in local currency?", a: "Yes — we accept NGN, USD, EUR, GBP and ZAR via bank transfer, card or PayPal." },
  ]},
  { id: "services", label: "Services", items: [
    { q: "What is AI automation and how does it help my business?", a: "It means your business responds to leads in seconds, follows up consistently, books appointments without you, and never lets a customer fall through the cracks. Most clients see 30–50% more conversions just from this." },
    { q: "Can you handle everything for me?", a: "Yes — our 'Done-For-You' engagement means you focus on running your business while we handle strategy, design, automation, posting, ads and reporting." },
    { q: "Do you build mobile apps?", a: "Yes, both iOS and Android (or cross-platform). Typically used for booking, ordering, loyalty and internal team apps." },
    { q: "Can you redesign my existing website?", a: "Yes — most of our website work is rebuilds with a focus on conversion." },
    { q: "Do you offer SEO?", a: "Yes — both technical SEO and Google Business Profile optimisation for local visibility." },
  ]},
  { id: "timeline", label: "Timeline", items: [
    { q: "How long does it take to see results?", a: "Most clients see meaningful traction within 30 days. Significant revenue lifts typically show between days 60–90." },
    { q: "How quickly can we start?", a: "After your intake form, you'll have a strategy call within 48 hours. Onboarding starts within 1 week of signing." },
    { q: "How long does a website build take?", a: "Standard websites: 2–3 weeks. Complex ecommerce or custom builds: 4–8 weeks." },
    { q: "Are there long contracts?", a: "No — all monthly plans are month-to-month. We earn your business every month." },
  ]},
  { id: "automation", label: "AI Automation", items: [
    { q: "Will AI replace my human team?", a: "No — AI handles repetitive, low-value tasks (instant replies, reminders, follow-ups) so your team focuses on high-value work." },
    { q: "Will the AI sound robotic to my customers?", a: "No — we train it on your brand voice and customer personas. Most customers can't tell." },
    { q: "Can I edit what the AI says?", a: "Yes — you have full control via a simple dashboard. Update messages anytime." },
    { q: "What platforms does your AI work on?", a: "WhatsApp Business, Instagram DMs, Facebook Messenger, your website chat, and email." },
  ]},
  { id: "tools", label: "Tools & Client Portal", items: [
    { q: "What is the client portal?", a: "A private area at /portal where clients track project progress, approve designs and campaigns, see and pay invoices, share files securely and message the team. You get access when you start working with us; log in from the Login menu." },
    { q: "Are the free tools really free?", a: "Yes. The website audit, AI receptionist demo, instant proposal, AI website makeover, ROI calculator and growth assessment are free with fair-use limits per hour. No sign-up is needed." },
    { q: "Can I book a call online?", a: "Yes. Pick a time at /book; times are shown in your own timezone and you get a confirmation email with the call details and a reminder." },
    { q: "Do you build Web3 apps and smart contracts?", a: "Yes. Emmanuel is a Web3 and Solidity developer: dApps, tokens, NFTs, staking, crypto payments and smart contract reviews on Ethereum and EVM chains. Try the free smart contract check, then book a call for a quote." },
    { q: "Do you offer business consulting and accountability coaching?", a: "Yes. Emmanuel offers one-to-one business consulting (offers, pricing, systems, numbers) and accountability coaching (weekly goals and check-ins). Both are quoted after a free call." },
  ]},
  { id: "starting", label: "Getting Started", items: [
    { q: "What's the first step?", a: "Either take the free analyser, fill the business intake form, or message us on WhatsApp. We'll respond within hours." },
    { q: "What information do you need from me?", a: "Just complete the 8-step intake form — it covers everything we need to build your custom plan." },
    { q: "How do you communicate with clients?", a: "WhatsApp for daily comms, scheduled Zoom calls for strategy, email for documentation, and a project portal for deliverables." },
  ]},
  { id: "publishing", label: "eBooks & Publishing", items: PUBLISHING_FAQS },
];
