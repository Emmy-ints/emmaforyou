/**
 * Launch Guide: a branching questionnaire and the personalised 14-stage roadmap built from it.
 * Pure data + functions. Recommendations are practical rules of thumb, never promises of sales.
 */
export type Answers = Partial<{
  stage: "idea" | "product" | "store";
  country: string;
  market: string;
  currency: string;
  budget: "under-200" | "200-1000" | "1000-5000" | "over-5000";
  hours: "under-5" | "5-15" | "15-30" | "full-time";
  model: "unsure" | "inventory" | "dropship" | "pod" | "handmade" | "digital" | "wholesale" | "private-label" | "subscription";
  productType: "physical" | "digital";
  hasSupplier: "yes" | "no";
  canFulfil: "home" | "3pl" | "supplier" | "unsure";
  channels: string[];
  skills: string[];
  interests: string;
  customer: string;
  risk: "low" | "medium" | "high";
  goal: string;
  timeline: "3m" | "6m" | "12m";
  constraints: string;
}>;

export interface Question {
  id: keyof Answers;
  label: string;
  help?: string;
  type: "choice" | "multi" | "text";
  options?: { value: string; label: string; hint?: string }[];
  show?: (a: Answers) => boolean;
  optional?: boolean;
}

export const QUESTIONS: Question[] = [
  { id: "stage", label: "Where are you right now?", type: "choice", options: [
    { value: "idea", label: "I want to start but haven't chosen a product" },
    { value: "product", label: "I have a product idea or supplier" },
    { value: "store", label: "I have a store but no sales yet" },
  ] },
  { id: "country", label: "Which country do you live in?", type: "text", help: "This shapes payments, taxes and shipping options." },
  { id: "market", label: "Where will your customers be?", type: "choice", options: [
    { value: "local", label: "My own country" }, { value: "regional", label: "My region (e.g. West Africa, EU)" }, { value: "global", label: "Worldwide" },
  ] },
  { id: "currency", label: "Which currency do you price in?", type: "choice", options: ["NGN", "USD", "EUR", "GBP", "GHS", "KES", "ZAR", "CAD"].map((c) => ({ value: c, label: c })) },
  { id: "budget", label: "How much can you invest to start?", help: "Money you can afford to lose while you learn.", type: "choice", options: [
    { value: "under-200", label: "Under $200 (or equivalent)" }, { value: "200-1000", label: "$200 – $1,000" }, { value: "1000-5000", label: "$1,000 – $5,000" }, { value: "over-5000", label: "Over $5,000" },
  ] },
  { id: "hours", label: "How many hours a week can you give it?", type: "choice", options: [
    { value: "under-5", label: "Under 5" }, { value: "5-15", label: "5 – 15" }, { value: "15-30", label: "15 – 30" }, { value: "full-time", label: "Full time" },
  ] },
  { id: "productType", label: "Physical or digital products?", type: "choice", options: [
    { value: "physical", label: "Physical products" }, { value: "digital", label: "Digital products (courses, templates, files)" },
  ], show: (a) => a.stage !== "store" },
  { id: "model", label: "How would you like to source and sell?", type: "choice", show: (a) => a.productType !== "digital", options: [
    { value: "unsure", label: "Not sure yet: help me choose" },
    { value: "inventory", label: "Buy stock and hold inventory" },
    { value: "dropship", label: "Dropshipping (supplier ships)" },
    { value: "pod", label: "Print-on-demand" },
    { value: "handmade", label: "I make the products myself" },
    { value: "wholesale", label: "Wholesale / resell brands" },
    { value: "private-label", label: "Private label (my brand on a made product)" },
    { value: "subscription", label: "Subscription boxes / refills" },
  ] },
  { id: "hasSupplier", label: "Do you already have a supplier?", type: "choice", show: (a) => a.productType !== "digital" && ["inventory", "wholesale", "private-label", "dropship", "subscription"].includes(a.model ?? ""), options: [{ value: "yes", label: "Yes" }, { value: "no", label: "Not yet" }] },
  { id: "canFulfil", label: "Who will pack and ship orders?", type: "choice", show: (a) => a.productType !== "digital" && !["dropship", "pod"].includes(a.model ?? ""), options: [
    { value: "home", label: "Me, from home or my shop" }, { value: "3pl", label: "A fulfilment company" }, { value: "supplier", label: "The supplier" }, { value: "unsure", label: "Not sure" },
  ] },
  { id: "channels", label: "Where would you like to sell? (choose any)", type: "multi", optional: true, options: [
    { value: "own-store", label: "My own online store" }, { value: "instagram", label: "Instagram / Facebook" }, { value: "whatsapp", label: "WhatsApp" }, { value: "tiktok", label: "TikTok" },
    { value: "marketplace", label: "Marketplaces (Amazon, Jumia, Etsy…)" }, { value: "offline", label: "Markets / pop-ups" },
  ] },
  { id: "skills", label: "Which of these are you comfortable with? (choose any)", type: "multi", optional: true, options: [
    { value: "photo", label: "Product photos/video" }, { value: "writing", label: "Writing" }, { value: "ads", label: "Running ads" }, { value: "social", label: "Social media" }, { value: "tech", label: "Setting up websites" }, { value: "sales", label: "Talking to customers" },
  ] },
  { id: "interests", label: "What topics or products interest you?", type: "text", optional: true, help: "Hobbies, things you know well, problems you've noticed." },
  { id: "customer", label: "Who do you want to sell to, and what problem do you solve for them?", type: "text", optional: true },
  { id: "risk", label: "How do you feel about financial risk?", type: "choice", options: [{ value: "low", label: "Keep it very low" }, { value: "medium", label: "Some risk is fine" }, { value: "high", label: "Comfortable with risk" }] },
  { id: "goal", label: "What would success look like in a year?", type: "text", optional: true, help: "For example: a side income, replacing a salary, testing an idea." },
  { id: "timeline", label: "When would you like your first sale?", type: "choice", options: [{ value: "3m", label: "Within 3 months" }, { value: "6m", label: "Within 6 months" }, { value: "12m", label: "Within a year" }] },
  { id: "constraints", label: "Anything that limits you? (optional)", type: "text", optional: true, help: "e.g. no international shipping, can't hold stock at home, regulated products." },
];

export const visibleQuestions = (a: Answers) => QUESTIONS.filter((q) => !q.show || q.show(a));

export interface RoadmapStep { id: string; title: string; why: string; tasks: { id: string; text: string }[]; tool?: { to: string; label: string }; note?: string }

const lowBudget = (a: Answers) => a.budget === "under-200" || a.budget === "200-1000";
const modelLabel: Record<string, string> = { inventory: "holding inventory", dropship: "dropshipping", pod: "print-on-demand", handmade: "handmade products", wholesale: "wholesale/resale", "private-label": "private label", subscription: "subscriptions", digital: "digital products" };

/** Suggest a business model when the user is unsure, from budget, hours, risk and skills. */
export function suggestModel(a: Answers): { model: string; reason: string } {
  if (a.productType === "digital") return { model: "digital", reason: "Digital products have no stock or shipping, so you can start with very little money." };
  if (lowBudget(a) && a.risk !== "high") return { model: a.skills?.includes("photo") ? "pod" : "dropship", reason: "With a small budget and low risk, start without buying stock: test demand first, then hold inventory for proven products." };
  if (a.budget === "over-5000" && a.risk !== "low") return { model: "private-label", reason: "A larger budget lets you build your own brand with better margins, once demand is validated with a small first order." };
  return { model: "inventory", reason: "A small, tested stock order gives you control over quality and delivery times." };
}

export function buildRoadmap(a: Answers): { model: string; modelReason: string; steps: RoadmapStep[] } {
  const chosen = a.productType === "digital" ? "digital" : a.model && a.model !== "unsure" ? a.model : suggestModel(a).model;
  const reason = a.model && a.model !== "unsure" ? `You chose ${modelLabel[chosen] ?? chosen}.` : suggestModel(a).reason;
  const physical = chosen !== "digital";
  const ownStore = !a.channels?.length || a.channels.includes("own-store");
  const t = (id: string, text: string) => ({ id, text });
  const steps: RoadmapStep[] = [
    { id: "model", title: "Choose your business model", why: reason, tasks: [t("m1", `Write down why ${modelLabel[chosen] ?? chosen} fits your budget and time`), t("m2", "List what you'll need to pay for before the first sale"), t("m3", "Decide what you will NOT do for now (keep it simple)")] },
    { id: "niche", title: "Research your niche and customer", why: "Selling to a specific group with a clear problem is easier than selling to everyone.", tasks: [t("n1", a.customer ? `Describe your customer in one sentence: "${a.customer.slice(0, 80)}"` : "Describe your ideal customer in one sentence"), t("n2", "Read 30+ real reviews and comments about products they buy today"), t("n3", "Write down the 5 most common complaints")], tool: { to: "/community", label: "Ask the community" } },
    { id: "ideas", title: "Generate product ideas", why: "Start with several ideas so you can compare, not fall in love with one.", tasks: [t("i1", `List 10 ideas${a.interests ? ` around: ${a.interests.slice(0, 60)}` : ""}`), t("i2", "Remove anything fragile, regulated or hard to ship" + (a.constraints ? ` (and anything your constraints rule out)` : "")), t("i3", "Keep the 3 strongest")], tool: { to: "/ecommerce/research", label: "Product research" } },
    { id: "validate", title: "Validate demand and competition", why: "Proof that people already buy similar products, and a gap you can fill.", tasks: [t("v1", "Find 5 competitors selling something similar and note their prices"), t("v2", "Check that people search for and talk about it (search, social, marketplaces)"), t("v3", "Pre-sell or collect interest from 10 real people before buying stock")], tool: { to: "/ecommerce/competitors", label: "Compare competitors" } },
    ...(physical ? [{ id: "source", title: "Source products and evaluate suppliers", why: "Quality, delivery time and reliability decide reviews and repeat customers.", tasks: [t("s1", a.hasSupplier === "yes" ? "Ask your supplier for a sample and written prices, minimums and lead times" : "Shortlist 3 suppliers and request samples"), t("s2", "Check delivery time to your customers' country"), t("s3", "Agree what happens with damaged or faulty items")] }] : [{ id: "create", title: "Create the digital product", why: "Make a small, excellent first version.", tasks: [t("c1", "Outline the product in one page"), t("c2", "Build a first version in two weeks"), t("c3", "Get 3 people to try it and give feedback")] }]),
    { id: "pricing", title: "Calculate costs, price and margin", why: "Know your profit per sale before you spend on marketing.", tasks: [t("p1", "Add up product, packaging, shipping and payment fees per order"), t("p2", "Decide the most you can spend on ads to win one sale"), t("p3", "Set a price that leaves profit after all of that")], tool: { to: "/ecommerce/profit", label: "Profit calculator" } },
    { id: "channel", title: "Choose your store and sales channels", why: ownStore ? "Your own store gives you customer data and brand control." : "Start where your customers already are.", tasks: a.channels?.length ? a.channels.map((c, i) => t(`ch${i}`, `Set up selling on ${c.replace("-", " ")}`)) : [t("ch1", "Pick one main channel to start"), t("ch2", "Add a second only after the first works")], tool: { to: "/solutions/websites", label: "Store solutions" } },
    { id: "setup", title: "Set up the store and product catalogue", why: "Clear photos, honest descriptions and easy navigation build trust.", tasks: [t("st1", "Write product pages: benefit-led title, key points, size/specs, delivery time"), t("st2", "Take or source clear photos (and a short video if you can)"), t("st3", "Add an About page, contact details and policies")], tool: { to: "/ecommerce/grow", label: "Audit your store" } },
    { id: "ops", title: physical ? "Payments, shipping, taxes and returns" : "Payments, delivery, taxes and refunds", why: "Customers buy when they know how they'll pay, when it arrives and what if it's wrong.", tasks: [t("o1", `Offer the payment methods people in ${a.country || "your market"} use most`), t("o2", physical ? (a.canFulfil === "home" ? "Choose a courier and test a delivery to yourself" : "Confirm who ships and how long it takes") : "Automate delivery of the files or access"), t("o3", "Check sales tax/VAT rules for where you sell (ask an accountant if unsure)"), t("o4", "Publish a clear returns or refund policy")] },
    { id: "brand", title: "Branding and positioning", why: "Say clearly who it's for and why it's better than the alternative.", tasks: [t("b1", "Write a one-sentence promise for your customer"), t("b2", "Choose a name, logo and 2 brand colours"), t("b3", "Turn the top customer complaints into reasons to choose you")] },
    { id: "launch", title: "Marketing and launch plan", why: lowBudget(a) ? "With a small budget, start with free channels and your own network." : "Use a small, measured ad budget alongside free channels.", tasks: [t("l1", a.skills?.includes("social") ? "Post 3 times a week showing the product in use" : "Plan 10 short posts showing the product in use"), t("l2", "Tell 50 people you know and ask for honest feedback"), t("l3", lowBudget(a) ? "Hold off on paid ads until you have your first organic sales" : "Run a small test ad to one audience with a daily cap")], tool: { to: "/ecommerce/marketing", label: "Plan experiments" } },
    { id: "analytics", title: "Analytics and conversion tracking", why: "You can only fix what you measure.", tasks: [t("a1", "Turn on your store's analytics (or GA4)"), t("a2", "Track visits, add-to-cart, checkout and orders"), t("a3", "Write down your starting numbers (baseline)")] },
    { id: "first-sales", title: "First-sales experiments", why: "Run one change at a time and measure it.", tasks: [t("f1", "Pick one thing to test this week (price, photo, headline, offer)"), t("f2", "Measure the result for 1–2 weeks"), t("f3", "Keep what works, drop what doesn't")], tool: { to: "/ecommerce/diagnose", label: "Sales diagnosis" } },
    { id: "grow", title: "Review, optimise and grow", why: "Double down on what customers already like.", tasks: [t("g1", "Review profit per product every month"), t("g2", "Ask buyers for reviews and repeat orders"), t("g3", "Add products your customers ask for")], tool: { to: "/ecommerce/plan", label: "Action planner" } },
  ];
  return { model: chosen, modelReason: reason, steps };
}
