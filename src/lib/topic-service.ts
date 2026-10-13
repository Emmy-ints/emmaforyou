/** Which service page an article or guide category relates to. Used for contextual internal links. */
const MAP: Record<string, { label: string; to: string }> = {
  "Website & SEO": { label: "Website Design & Development", to: "/services/website-design" },
  "Web Design": { label: "Website Design & Development", to: "/services/website-design" },
  SEO: { label: "SEO", to: "/expertise/seo" },
  "AI Automation": { label: "AI Automation", to: "/services/ai-automation" },
  Automation: { label: "AI Automation", to: "/services/ai-automation" },
  "Social Media": { label: "Social Media Management", to: "/services/social-media" },
  "Paid Advertising": { label: "Paid Advertising", to: "/services/ad-marketing" },
  Ads: { label: "Paid Advertising", to: "/services/ad-marketing" },
  "Email Marketing": { label: "Email Marketing", to: "/services/email-marketing" },
  Ecommerce: { label: "Ecommerce & Shopify", to: "/services/ecommerce" },
  "Business Growth": { label: "Digital Marketing Strategy", to: "/expertise/digital-strategy" },
  Strategy: { label: "Digital Marketing Strategy", to: "/expertise/digital-strategy" },
  "Conversion": { label: "Conversion Rate Optimisation", to: "/expertise/conversion-rate-optimisation" },
  "UI/UX Design": { label: "UI/UX Design", to: "/expertise/ui-ux-design" },
  "Web3 & Blockchain": { label: "Web3 & dApp Development", to: "/expertise/web3-development" },
  "Smart Contracts": { label: "Smart Contracts & Solidity", to: "/expertise/smart-contract-development" },
  "Consulting": { label: "Business Consulting", to: "/expertise/business-consulting" },
  "Coaching": { label: "Accountability Coaching", to: "/expertise/accountability-coaching" },
  "Marketing & Promotion": { label: "Marketing & Promotion", to: "/expertise/marketing-promotion" },
  "Choosing an Agency": { label: "Book a free strategy call", to: "/book" },
};

export function serviceForTopic(category: string) {
  return MAP[category] ?? { label: "Digital Marketing Strategy", to: "/expertise/digital-strategy" };
}
