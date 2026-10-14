export interface LeadMagnet {
  slug: string;
  title: string;
  description: string;
  inside: string[];
  /** What the visitor actually gets. */
  format: string;
  gradient: string;
  icon: string;
}

export const LEAD_MAGNETS: LeadMagnet[] = [
  {
    slug: "digital-checklist",
    format: "Interactive checklist · 47 checks",
    title: "The Nigerian Business Digital Checklist",
    description: "A 47-point audit checklist covering every digital channel your business should have. Know exactly what's missing and what to fix first.",
    inside: [
      "Website audit (12 checkpoints)",
      "Social media audit (10 checkpoints)",
      "Google presence audit (8 checkpoints)",
      "Automation audit (9 checkpoints)",
      "Ads & growth audit (8 checkpoints)",
    ],
    gradient: "linear-gradient(135deg, #1a3fd4, #7c3aed)",
    icon: "📋",
  },
  {
    slug: "instagram-captions",
    format: "Copy-ready templates · 50 captions",
    title: "50 Instagram Caption Templates for Every Business",
    description: "50 fill-in-the-blank caption templates categorised by business type. Never stare at a blank screen again.",
    inside: [
      "10 captions for product businesses",
      "10 captions for service businesses",
      "10 engagement captions (questions & polls)",
      "10 promotional captions",
      "10 storytelling captions with hooks",
    ],
    gradient: "linear-gradient(135deg, #d4186b, #f97316)",
    icon: "📱",
  },
  {
    slug: "ai-automation-starter",
    format: "Step-by-step guide · 5 systems",
    title: "AI Automation Starter Guide",
    description: "5 AI automation systems any business can set up this week — even with little tech experience. Each one lists what you need, the steps and how to test it.",
    inside: [
      "WhatsApp auto-reply setup (step by step)",
      "Lead capture → CRM automation",
      "Missed call text-back system",
      "Appointment reminder automation",
      "Review request automation",
    ],
    gradient: "linear-gradient(135deg, #0f172a, #1a3fd4)",
    icon: "🤖",
  },
  {
    slug: "ad-swipe-file",
    format: "Copy-ready templates · 30 ads",
    title: "Facebook & Instagram Ads Swipe File",
    description: "30 ad copy templates for five business types — headlines and body text to adapt and test.",
    inside: [
      "6 Fashion store ad templates",
      "6 Real estate ad templates",
      "6 Restaurant/hospitality ad templates",
      "6 Clinic/service ad templates",
      "6 Ecommerce ad templates",
    ],
    gradient: "linear-gradient(135deg, #7c3aed, #1a3fd4)",
    icon: "📢",
  },
  {
    slug: "whatsapp-playbook",
    format: "Playbook · 5 sections",
    title: "The WhatsApp Marketing Playbook",
    description: "How to set WhatsApp up for sales — broadcast strategies, response scripts and automation flows.",
    inside: [
      "Setting up WhatsApp Business properly",
      "Building a broadcast list from scratch",
      "15 broadcast message templates",
      "WhatsApp follow-up script (5-day sequence)",
      "Auto-replies that convert",
    ],
    gradient: "linear-gradient(135deg, #25D366, #075E54)",
    icon: "💬",
  },
  {
    slug: "growth-planner",
    format: "Interactive planner · 12 weeks",
    title: "90-Day Digital Growth Planner",
    description: "A week-by-week action plan for transforming your business digital presence in 90 days — for any niche.",
    inside: [
      "Week 1-4: Foundation sprint plan",
      "Week 5-8: Growth phase actions",
      "Week 9-12: Scale phase checklist",
      "Daily habit tracker for digital growth",
      "Monthly review template",
    ],
    gradient: "linear-gradient(135deg, #f59e0b, #d4186b)",
    icon: "🗓️",
  },
];