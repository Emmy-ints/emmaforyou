/** Every free tool on the site, for the /tools directory. */
export interface ToolInfo { to: string; name: string; icon: string; group: "AI tools" | "Plan & estimate" | "Learn" | "Talk to us"; does: string; get: string; time: string }

export const TOOLS_DIRECTORY: ToolInfo[] = [
  { to: "/website-audit", name: "AI website audit", icon: "🩺", group: "AI tools", does: "Checks your homepage for speed, SEO, mobile, contact options and trust.", get: "A score out of 100, the top 5 fixes and a PDF report.", time: "~1 minute" },
  { to: "/ai-receptionist", name: "AI receptionist demo", icon: "🤖", group: "AI tools", does: "Chat or talk to an AI receptionist for a sample salon, clinic or restaurant.", get: "A feel for instant replies and bookings for your own customers.", time: "2 minutes" },
  { to: "/makeover", name: "AI website makeover", icon: "🎨", group: "AI tools", does: "Redesigns a screenshot of your website, keeping your business details.", get: "A before-and-after comparison and a design concept to download.", time: "~1 minute" },
  { to: "/smart-contract-check", name: "Smart contract check", icon: "🛡️", group: "AI tools", does: "Scans and reviews Solidity code for security and gas issues.", get: "Findings ranked by severity, each with a fix, plus a PDF.", time: "~30 seconds" },
  { to: "/#prototype", name: "AI prototype builder", icon: "✨", group: "AI tools", does: "Turns a plain-language description into a working website or app prototype.", get: "A live preview you can test on phone, tablet and desktop.", time: "~1 minute" },
  { to: "/email-generator", name: "Email sequence generator", icon: "✉️", group: "AI tools", does: "Writes a five-email sequence for your business.", get: "Welcome, abandoned cart, re-engagement or launch emails ready to use.", time: "1 minute" },
  { to: "/proposal", name: "Instant proposal & quote", icon: "📝", group: "Plan & estimate", does: "Turns your goals and budget into a written proposal.", get: "Scope, timeline and the right plan, priced from our published plans.", time: "20 seconds" },
  { to: "/goal-planner", name: "90-day goal planner", icon: "🎯", group: "Plan & estimate", does: "Breaks a goal into milestones and weekly actions.", get: "12 weeks of concrete actions, habits and an obstacle plan.", time: "30 seconds" },
  { to: "/roi-calculator", name: "ROI calculator", icon: "🧮", group: "Plan & estimate", does: "Estimates what faster replies and better marketing could earn.", get: "Monthly and yearly figures with the maths shown.", time: "1 minute" },
  { to: "/analyser", name: "Growth assessment", icon: "🔬", group: "Plan & estimate", does: "Eight questions about how customers find you, buy and hear back.", get: "A score across five areas and three priorities.", time: "2 minutes" },
  { to: "/growth-quiz", name: "Digital growth quiz", icon: "✅", group: "Plan & estimate", does: "Ten yes/no questions on your digital basics.", get: "Your result and the fastest fixes.", time: "2 minutes" },
  { to: "/checklists", name: "Free checklists", icon: "✅", group: "Learn", does: "Website launch, conversion, AI automation, Web3 launch and product launch checklists.", get: "Interactive checklists with the reason behind every check, plus a PDF.", time: "Instant" },
  { to: "/free-resources", name: "Free growth toolkits", icon: "🎁", group: "Learn", does: "Checklists, playbooks and planners to download.", get: "Six practical resources you can use today.", time: "Instant" },
  { to: "/knowledge-base", name: "Knowledge base", icon: "📚", group: "Learn", does: "In-depth guides on websites, SEO, automation, ads and more.", get: "Step-by-step answers for business owners.", time: "Read anytime" },
  { to: "/blog", name: "Blog", icon: "📝", group: "Learn", does: "Practical articles on growth, design, automation and Web3.", get: "Ideas you can apply this week.", time: "5–10 minutes" },
  { to: "/book", name: "Book a free strategy call", icon: "📅", group: "Talk to us", does: "A 30-minute call with Emmanuel, at a time that suits you.", get: "Your top opportunities and clear next steps.", time: "30 minutes" },
  { to: "/portal", name: "Client portal", icon: "🔐", group: "Talk to us", does: "For clients: projects, approvals, invoices, files and messages.", get: "Everything about your project in one place.", time: "Clients" },
];
