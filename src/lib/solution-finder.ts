/**
 * Rule-based solution finder: turns a visitor's business type, goals, budget and own words into a
 * shortlist from the real service catalogue, a phased approach, open questions and a brief.
 * Deterministic and explainable (every match says why). No AI call, no invented figures; plan
 * prices come only from the published pricing data.
 */
import { catalog, FAMILIES, type CatalogItem } from "./service-catalog";
import { TIERS } from "./pricing-data";

export const GOALS = [
  { id: "found", label: "Get found online (Google, SEO)" },
  { id: "leads", label: "More leads and enquiries" },
  { id: "sell", label: "Sell online / grow a store" },
  { id: "automate", label: "Reply faster and automate work" },
  { id: "app", label: "Build an app, portal or software" },
  { id: "design", label: "Better design and user experience" },
  { id: "website", label: "New or better website" },
  { id: "social", label: "Grow on social media" },
  { id: "ads", label: "Run ads that pay back" },
  { id: "web3", label: "Launch a Web3 or crypto project" },
  { id: "plan", label: "A clear plan and accountability" },
] as const;
export type GoalId = (typeof GOALS)[number]["id"];

export const BUDGETS = ["Under $300 a month", "$300–$800 a month", "$800+ a month", "A one-off project", "Not sure yet"] as const;

/** Which catalogue entries serve each goal (ids from service-catalog). */
const GOAL_ITEMS: Record<GoalId, string[]> = {
  found: ["exp-seo", "svc-website-design", "exp-analytics"],
  leads: ["exp-lead-generation", "exp-funnel-building", "svc-ai-automation", "exp-crm-systems"],
  sell: ["svc-ecommerce", "exp-conversion-rate-optimisation", "svc-email-marketing", "sol-websites"],
  automate: ["svc-ai-automation", "exp-crm-systems", "sol-automation", "sol-ai-solutions"],
  app: ["svc-app-development", "sol-business-apps", "sol-mobile-desktop"],
  design: ["exp-ui-ux-design", "exp-copywriting", "exp-conversion-rate-optimisation"],
  website: ["svc-website-design", "exp-wordpress", "exp-ui-ux-design", "sol-websites"],
  social: ["svc-social-media", "exp-marketing-promotion"],
  ads: ["svc-ad-marketing", "exp-funnel-building", "exp-analytics"],
  web3: ["exp-web3-development", "exp-smart-contract-development", "exp-blockchain-crypto"],
  plan: ["exp-digital-strategy", "exp-business-consulting", "exp-accountability-coaching"],
};

/** Words in the visitor's own description that point at a catalogue entry. */
const WORDS: [RegExp, string, string][] = [
  [/\b(seo|google|rank|search)\b/i, "exp-seo", "you mentioned search and Google"],
  [/\b(shopify|woocommerce|store|shop|ecommerce|e-commerce|cart|checkout|products?)\b/i, "svc-ecommerce", "you mentioned selling products online"],
  [/\b(whatsapp|chatbot|chat ?bot|auto[- ]?reply|reply|respond|inbox|dm)\b/i, "svc-ai-automation", "you mentioned replying to customers"],
  [/\b(crm|pipeline|follow[- ]?up|leads? list)\b/i, "exp-crm-systems", "you mentioned following up leads"],
  [/\b(booking|appointment|schedule|reservation)\b/i, "sol-business-apps", "you mentioned bookings"],
  [/\b(app|mobile|ios|android|portal|dashboard|saas|software|platform)\b/i, "svc-app-development", "you mentioned an app or software"],
  [/\b(website|site|landing|wordpress|webflow|redesign)\b/i, "svc-website-design", "you mentioned your website"],
  [/\b(ui|ux|design|figma|interface|usability)\b/i, "exp-ui-ux-design", "you mentioned design and usability"],
  [/\b(email|newsletter|mailchimp|klaviyo|abandoned)\b/i, "svc-email-marketing", "you mentioned email"],
  [/\b(instagram|tiktok|facebook|social|content|posts?)\b/i, "svc-social-media", "you mentioned social media"],
  [/\b(ads?|advert|meta ads|google ads|ppc|roas)\b/i, "svc-ad-marketing", "you mentioned advertising"],
  [/\b(web3|crypto|blockchain|nft|token|dapp|wallet|defi)\b/i, "exp-web3-development", "you mentioned Web3"],
  [/\b(solidity|smart contracts?|audit my contract)\b/i, "exp-smart-contract-development", "you mentioned smart contracts"],
  [/\b(ai|agent|assistant|gpt|automate|automation|workflow|zapier|make\.com|n8n)\b/i, "sol-ai-solutions", "you mentioned AI or automation"],
  [/\b(copy|messaging|headline|wording)\b/i, "exp-copywriting", "you mentioned your messaging"],
  [/\b(strategy|plan|roadmap|consult|advice)\b/i, "exp-digital-strategy", "you asked for a plan"],
  [/\b(coach|accountab|discipline|consistent)\b/i, "exp-accountability-coaching", "you mentioned staying on track"],
  [/\b(convert|conversion|sales? (are )?low|nobody buys|bounce)\b/i, "exp-conversion-rate-optimisation", "you mentioned visitors not buying"],
];

const QUESTIONS: Partial<Record<GoalId, string>> = {
  sell: "Which store platform are you on today (Shopify, WooCommerce, none yet)?",
  automate: "Where do enquiries arrive now (WhatsApp, Instagram, email, phone) and who answers them?",
  app: "Who will use the app (customers, staff or both) and on which devices?",
  website: "Do you have a website already? If so, what's its address?",
  found: "Which towns or countries do your customers search from?",
  ads: "Have you run ads before, and what did they cost per enquiry?",
  web3: "Which chain are you building on, and is there an existing contract or token?",
  design: "Which screen or step do customers struggle with most?",
  leads: "Roughly how many enquiries do you get a month now, and how many become customers?",
  plan: "What's the one result you most want in the next 90 days?",
};

export interface FinderInput { business: string; goals: GoalId[]; budget: string; text: string }
export interface Match { item: CatalogItem; score: number; why: string[] }
export interface FinderResult {
  problem: string; matches: Match[]; phases: { title: string; detail: string }[]; questions: string[];
  plan: { name: string; price: string } | null; tools: { to: string; label: string }[]; brief: string;
}

export function findSolutions(input: FinderInput, items?: CatalogItem[]): FinderResult {
  const all = items ?? catalog();
  const byId = new Map(all.map((i) => [i.id, i]));
  const score = new Map<string, { s: number; why: Set<string> }>();
  const add = (id: string, s: number, why: string) => {
    if (!byId.has(id)) return;
    const cur = score.get(id) ?? { s: 0, why: new Set<string>() };
    cur.s += s; cur.why.add(why); score.set(id, cur);
  };
  for (const g of input.goals) GOAL_ITEMS[g].forEach((id, i) => add(id, 3 - i * 0.5, `matches your goal “${GOALS.find((x) => x.id === g)!.label.toLowerCase()}”`));
  for (const [re, id, why] of WORDS) if (re.test(input.text)) add(id, 2.5, why);
  if (!score.size) ["exp-digital-strategy", "svc-website-design", "svc-ai-automation"].forEach((id, i) => add(id, 1 - i * 0.1, "a good starting point when the need isn't clear yet"));

  const matches = [...score.entries()].sort((a, b) => b[1].s - a[1].s).slice(0, 4)
    .map(([id, v]) => ({ item: byId.get(id)!, score: v.s, why: [...v.why].slice(0, 2) }));

  const goalText = input.goals.map((g) => GOALS.find((x) => x.id === g)!.label.toLowerCase());
  const problem = [
    input.business ? `A ${input.business.toLowerCase()} business` : "Your business",
    goalText.length ? ` that wants to ${goalText.slice(0, 3).join(", ").replace(/, ([^,]*)$/, " and $1")}` : " looking for the right next step",
    input.text.trim() ? `. In your words: “${input.text.trim().slice(0, 220)}${input.text.trim().length > 220 ? "…" : ""}”` : ".",
  ].join("");

  const lead = matches[0]?.item;
  const phases = [
    { title: "1 · Free call and audit", detail: "Emmanuel reviews what you have today, confirms the goals above and answers the open questions." },
    { title: `2 · Build ${lead ? lead.name.toLowerCase() : "the first system"}`, detail: lead ? `${lead.short} This is the piece that moves your main goal first.` : "Set up the first system that moves your main goal." },
    ...(matches[1] ? [{ title: `3 · Add ${matches[1].item.name.toLowerCase()}`, detail: matches[1].item.short }] : []),
    { title: `${matches[1] ? 4 : 3} · Measure and improve`, detail: "Clear reporting on what's working, then weekly improvements — no long contracts." },
  ];

  const questions = input.goals.map((g) => QUESTIONS[g]).filter((x): x is string => Boolean(x)).slice(0, 4);
  if (!questions.length) questions.push("What would make the next 90 days a success for you?");

  const t = TIERS.filter((x) => !("custom" in x && x.custom));
  const plan = input.budget.startsWith("Under") ? t[0] : input.budget.startsWith("$300") ? t[1] : input.budget.startsWith("$800") ? t[2] : null;

  const tools: { to: string; label: string }[] = [];
  const has = (...g: GoalId[]) => g.some((x) => input.goals.includes(x));
  if (has("website", "found", "design")) tools.push({ to: "/website-audit", label: "Free website audit" });
  if (has("automate", "leads")) tools.push({ to: "/ai-receptionist", label: "Try the AI receptionist demo" });
  if (has("sell")) tools.push({ to: "/ecommerce", label: "Ecommerce Intelligence tools" });
  if (has("app")) tools.push({ to: "/solutions/app-planner", label: "App feature planner" });
  if (has("web3")) tools.push({ to: "/smart-contract-check", label: "Smart contract check" });
  if (has("plan")) tools.push({ to: "/goal-planner", label: "90-day goal planner" });
  tools.push({ to: "/proposal", label: "Instant proposal & quote" });

  const brief = [
    "PROJECT BRIEF (from the EmmaForYou solution finder)",
    `Business: ${input.business || "not given"}`,
    `Goals: ${goalText.join("; ") || "not given"}`,
    `Budget: ${input.budget || "not given"}`,
    input.text.trim() ? `In their words: ${input.text.trim().slice(0, 900)}` : "",
    `Suggested services: ${matches.map((m) => m.item.name).join(", ")}`,
    `Open questions: ${questions.join(" | ")}`,
  ].filter(Boolean).join("\n");

  return { problem, matches, phases, questions, plan: plan ? { name: plan.name, price: `$${plan.monthly}/month` } : null, tools: tools.slice(0, 3), brief };
}

export const familyHue = (id: string) => FAMILIES.find((f) => f.id === id)?.hue ?? "#8b7bff";
