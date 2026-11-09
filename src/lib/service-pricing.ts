import { TIERS } from "./pricing-data";

/**
 * "Starting from" for a service page, taken only from the published plans in pricing-data: the lowest plan
 * whose feature list actually includes the service. Services no plan lists fall back to the lowest plan price
 * with "packages start from" wording (as the service FAQs already say). Never invent a price here.
 */
const INCLUDED_IN: Record<string, { tier: string; feature: string }> = {
  "social-media": { tier: "Starter", feature: "1 social platform managed" },
  "social-media-automation": { tier: "Starter", feature: "1 social platform managed" },
  "ai-automation": { tier: "Starter", feature: "Basic WhatsApp automation" },
  "email-marketing": { tier: "Growth", feature: "Full WhatsApp + email automation" },
  "lead-generation": { tier: "Growth", feature: "Lead capture system" },
  "paid-ads": { tier: "Growth", feature: "Basic ad management ($500/mo cap)" },
  "ad-marketing": { tier: "Growth", feature: "Basic ad management ($500/mo cap)" },
  "crm-systems": { tier: "Pro", feature: "Advanced CRM setup" },
  "website-landing-pages": { tier: "Pro", feature: "Custom website (or rebuild)" },
  "website-design": { tier: "Pro", feature: "Custom website (or rebuild)" },
  "wordpress": { tier: "Pro", feature: "Custom website (or rebuild)" },
  "shopify-ecommerce": { tier: "Pro", feature: "Custom website (or rebuild)" },
  "ecommerce": { tier: "Pro", feature: "Custom website (or rebuild)" },
  "app-development": { tier: "Enterprise", feature: "Custom app development" },
};

export interface ServicePrice { label: string; amount: string; note: string; tier?: string }

export function servicePrice(slug: string): ServicePrice {
  const hit = INCLUDED_IN[slug];
  const tier = hit && TIERS.find((t) => t.name === hit.tier && t.features.includes(hit.feature));
  if (tier && "custom" in tier && tier.custom) {
    return { label: `Included in ${tier.name}`, amount: "Custom quote", note: `${hit!.feature} is part of our ${tier.name} plan.`, tier: tier.name };
  }
  if (tier) {
    return { label: "Starting from", amount: `$${tier.monthly}/mo`, note: `Included in our ${tier.name} plan: ${hit!.feature.charAt(0).toLowerCase()}${hit!.feature.slice(1)}.`, tier: tier.name };
  }
  const lowest = Math.min(...TIERS.filter((t) => t.monthly > 0).map((t) => t.monthly));
  return { label: "Packages from", amount: `$${lowest}/mo`, note: "We recommend the right package on a free call." };
}
