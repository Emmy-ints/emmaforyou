/** Top-level solution categories (the four core offers plus apps for devices and industry systems). */
export interface SolutionCategory {
  slug: string;
  name: string;
  short: string;
  icon: string;
  intro: string;
  /** Who usually buys from this category. */
  buyers: string;
  groups: { id: string; name: string; intro: string }[];
}

export const SOLUTION_CATEGORIES: SolutionCategory[] = [
  {
    slug: "websites", name: "Website Development", short: "Business sites, stores, portals & platforms", icon: "🌐",
    intro: "A website can be a sales engine, an online store, a booking system, a customer portal or a full platform. We design and build each type around the action you need visitors to take.",
    buyers: "Service businesses, retailers, publishers, schools, membership organisations and any company that wins customers online.",
    groups: [
      { id: "business", name: "Business & service websites", intro: "Sites that explain what you do, build trust and turn visitors into enquiries." },
      { id: "transaction", name: "E-commerce & transaction websites", intro: "Sites where customers buy, book, rent or subscribe." },
      { id: "content", name: "Content, education & community websites", intro: "Sites built around publishing, learning, membership and events." },
      { id: "portal", name: "Portals & directories", intro: "Logged-in areas and searchable listings for clients, staff, vendors and the public." },
    ],
  },
  {
    slug: "business-apps", name: "Business Applications", short: "CRMs, ERPs, booking, inventory & more", icon: "🧩",
    intro: "Custom web apps that run your operations, sales, selling, learning and teamwork, built around how your business actually works instead of forcing you into someone else's software.",
    buyers: "Growing companies that have outgrown spreadsheets, juggle too many tools, or need a workflow off-the-shelf software doesn't fit.",
    groups: [
      { id: "operations", name: "Business management & operations", intro: "Systems that run the day-to-day: finance, people, stock, projects, bookings and support." },
      { id: "growth", name: "Sales, marketing & customer growth", intro: "Apps that attract, convert and keep customers." },
      { id: "selling", name: "E-commerce & online selling", intro: "Back-office and storefront apps for selling products and subscriptions." },
      { id: "learning", name: "Education, content & community", intro: "Platforms for courses, coaching, communities, creators and media." },
      { id: "collaboration", name: "Communication & collaboration", intro: "Tools that help teams and clients work together." },
    ],
  },
  {
    slug: "ai-solutions", name: "AI Solutions", short: "AI agents, assistants & automation", icon: "🤖",
    intro: "AI that answers customers, qualifies leads, writes first drafts, reads documents, analyses data and carries out approved tasks. Assistants recommend or generate; agents take actions, so they get permissions, safeguards and human approval for anything sensitive.",
    buyers: "Teams drowning in repetitive messages, documents or admin, and businesses that want faster replies without hiring more people.",
    groups: [
      { id: "agents", name: "AI assistants & agents", intro: "Assistants that talk to customers and staff, and agents that act inside your systems." },
      { id: "growth", name: "AI for marketing, sales & growth", intro: "AI that researches, writes, analyses and prioritises so your team sells more." },
      { id: "commerce", name: "AI for websites & e-commerce", intro: "AI that helps shoppers choose, keeps catalogues clean and protects revenue." },
      { id: "operations", name: "AI for administration & operations", intro: "AI that reads, sorts, summarises and checks the paperwork behind a business." },
      { id: "capabilities", name: "AI capabilities for any app", intro: "Reusable building blocks we add to your CRM, website, portal or dashboard." },
    ],
  },
  {
    slug: "automation", name: "Automation & Integrations", short: "Connect your tools, remove manual work", icon: "⚙️",
    intro: "Connections between the tools you already use, so leads, bookings, payments and reports move automatically, with logs, alerts and approval steps where they matter.",
    buyers: "Businesses copying data between apps, chasing follow-ups by hand, or building the same report every week.",
    groups: [
      { id: "flows", name: "Automation workflows", intro: "Repeatable processes that run on their own." },
    ],
  },
  {
    slug: "mobile-desktop", name: "Mobile & Desktop Apps", short: "iOS, Android, PWA, desktop & extensions", icon: "📱",
    intro: "Apps people install on phones, computers and browsers, from customer-facing apps to internal tools for teams in the field.",
    buyers: "Businesses whose customers or staff need offline access, notifications, the camera, location or a dedicated app experience.",
    groups: [
      { id: "platforms", name: "App platforms", intro: "How the app is delivered: native, cross-platform, web, desktop or browser." },
      { id: "apps", name: "App types", intro: "Common apps we build for customers and teams." },
    ],
  },
  {
    slug: "industries", name: "Industry Solutions", short: "Systems built for your sector", icon: "🏢",
    intro: "Specialised apps and AI built around the workflows of a particular industry, from salon calendars to logistics tracking.",
    buyers: "Owners and managers in sectors where generic software misses the details that matter.",
    groups: [
      { id: "industries", name: "Industries", intro: "Pick your sector to see the apps and AI features that fit it." },
    ],
  },
];

export const findCategory = (slug: string) => SOLUTION_CATEGORIES.find((c) => c.slug === slug);
