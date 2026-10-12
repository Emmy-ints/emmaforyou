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
};

export function serviceForTopic(category: string) {
  return MAP[category] ?? { label: "Digital Marketing Strategy", to: "/expertise/digital-strategy" };
}
// bisect marker 1791793563
