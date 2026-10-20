import { SERVICE_TO_EXPERTISE } from "./services-data";

/**
 * The seven /services/* pages are the primary commercial pages; an expertise page that shows the same
 * content points its canonical at the service page. Kept separate from seo-routes (which imports every
 * article, post and solution) so page metadata doesn't pull that data into the browser bundle.
 */
export function canonicalForExpertise(expertiseSlug: string): string {
  const svc = Object.entries(SERVICE_TO_EXPERTISE).find(([, exp]) => exp === expertiseSlug)?.[0];
  return svc ? `/services/${svc}` : `/expertise/${expertiseSlug}`;
}
