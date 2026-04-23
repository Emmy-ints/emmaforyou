export interface LeadMagnet {
  slug: string;
  title: string;
  description: string;
  inside: string[];
  pages: number;
  downloads: number;
  gradient: string;
  icon: string;
}

export const LEAD_MAGNETS: LeadMagnet[] = [
  {
    slug: "digital-checklist",
    title: "The Nigerian Business Digital Checklist",
    description: "A 47-point audit checklist covering every digital channel your business should have. Know exactly what's missing and what to fix first.",
    inside: [
      "Website audit (12 checkpoints)",
      "Social media audit (10 checkpoints)",
      "Google presence audit (8 checkpoints)",
      "Automation audit (9 checkpoints)",
      "Ads & growth audit (8 checkpoints)",
    ],
    pages: 18,
    downloads: 1240,
    gradient: "linear-gradient(135deg, #1a3fd4, #7c3aed)",
    icon: "📋",
  },
  {
    slug: "instagram-captions",
    title: "50 Instagram Caption Templates for Every Business",
    description: "50 proven, copy-paste caption templates categorised by business type. Never stare at a blank screen again.",
    inside: [
      "10 captions for product businesses",
      "10 captions for service businesses",
      "10 engagement captions (questions & polls)",
      "10 promotional captions",
      "10 storytelling captions with hooks",
    ],
    pages: 24,
    downloads: 876,
    gradient: "linear-gradient(135deg, #d4186b, #f97316)",
    icon: "📱",
  },
  {
    slug: "ai-automation-starter",
    title: "AI Automation Starter Guide",
    description: "5 AI automation systems any business can set up this week — even with zero tech experience. Step-by-step with screenshots.",
    inside: [
      "WhatsApp auto-reply setup (step by step)",
      "Lead capture → CRM automation",
      "Missed call text-back system",
      "Appointment reminder automation",
      "Review request automation",
    ],
    pages: 31,
    downloads: 643,
    gradient: "linear-gradient(135deg, #0f172a, #1a3fd4)",
    icon: "🤖",
  },
  {
    slug: "ad-swipe-file",
    title: "Facebook & Instagram Ads Swipe File",
    description: "30 proven ad copies for businesses worldwide — headlines, body text and CTAs that have generated real results.",
    inside: [
      "6 Fashion store ad templates",
      "6 Real estate ad templates",
      "6 Restaurant/hospitality ad templates",
      "6 Clinic/service ad templates",
      "6 Ecommerce ad templates",
    ],
    pages: 28,
    downloads: 932,
    gradient: "linear-gradient(135deg, #7c3aed, #1a3fd4)",
    icon: "📢",
  },
  {
    slug: "whatsapp-playbook",
    title: "The WhatsApp Marketing Playbook",
    description: "How to turn WhatsApp into a lead generation machine — broadcast strategies, response scripts and automation flows.",
    inside: [
      "Setting up WhatsApp Business properly",
      "Building a broadcast list from scratch",
      "15 broadcast message templates",
      "WhatsApp follow-up script (5-day sequence)",
      "Auto-replies that convert",
    ],
    pages: 22,
    downloads: 1108,
    gradient: "linear-gradient(135deg, #25D366, #075E54)",
    icon: "💬",
  },
  {
    slug: "growth-planner",
    title: "90-Day Digital Growth Planner",
    description: "A week-by-week action plan for transforming your business digital presence in 90 days — for any niche.",
    inside: [
      "Week 1-4: Foundation sprint plan",
      "Week 5-8: Growth phase actions",
      "Week 9-12: Scale phase checklist",
      "Daily habit tracker for digital growth",
      "Monthly review template",
    ],
    pages: 36,
    downloads: 421,
    gradient: "linear-gradient(135deg, #f59e0b, #d4186b)",
    icon: "🗓️",
  },
];