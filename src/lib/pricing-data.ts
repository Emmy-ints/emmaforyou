/** Published plans — the single source for /pricing and the proposal builder. */
export const TIERS = [
  { name: "Starter", monthly: 99, annual: 79, audience: "New businesses just getting started", popular: false,
    features: ["1 social platform managed", "8 posts per month", "Basic WhatsApp automation", "Google Business setup", "Monthly performance report", "Email support", "Free strategy call", "Cancel anytime"] },
  { name: "Growth", monthly: 299, annual: 239, audience: "Growing businesses ready to scale", popular: false,
    features: ["3 social platforms managed", "20 posts per month", "Full WhatsApp + email automation", "Lead capture system", "Basic ad management ($500/mo cap)", "Bi-weekly strategy calls", "Website maintenance", "Priority support"] },
  { name: "Pro", monthly: 799, annual: 639, audience: "Scaling businesses serious about growth", popular: true,
    features: ["All Growth features +", "Custom website (or rebuild)", "Full ad management (up to $5k/mo)", "AI chatbot deployment", "Advanced CRM setup", "Email sequences (5 flows)", "Weekly strategy calls", "Dedicated account manager", "30-day results guarantee"] },
  { name: "Enterprise", monthly: 0, annual: 0, audience: "Established companies & agencies", popular: false, custom: true,
    features: ["Everything in Pro +", "Custom app development", "Multi-brand / multi-location", "Custom integrations & APIs", "On-site visits available", "Senior strategy team", "Daily reporting access", "24/7 priority support", "Custom SLA & contracts"] },
];

export type Tier = (typeof TIERS)[number];
