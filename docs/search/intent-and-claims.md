# Search intent, competing pages, claims and owner decisions (27 Oct 2026)

Evidence comes from the live baseline (`baseline-2026-10-27.json`, 406 pages of raw server HTML) and the code/database at commit time. Nothing listed here was deleted, merged, redirected or published.

## Competing pages (possible cannibalisation)

Method: titles + first h1 of indexable, self-canonical pages, tokenised (stop words removed), Jaccard similarity ≥ 0.6, then reviewed by hand. 309 pairs passed the threshold; almost all are template siblings with different subjects (e.g. "AI HR Assistant" vs "AI SEO Assistant"), which serve different intents and need no action. Two pairs genuinely overlap:

| Pages | Evidence | Recommendation (owner decides) |
|---|---|---|
| `/blog/5-signs-ready-to-scale` and `/knowledge-base/5-signs-ready-to-scale` | Same title and h1; different bodies (419 vs 1,179 words); 2 vs 5 inbound links | Differentiate the knowledge-base title (draft saved, see below) or point the blog version's canonical at the fuller knowledge-base article. Don't delete either. |
| `/solutions/websites/multi-vendor-marketplace-website` and `/solutions/business-apps/multi-vendor-marketplace` | Titles "Multi-vendor Marketplace Website: Features & Live Demo" vs "Multi-vendor Marketplace: Features & Live Demo"; 663 vs 600 words; 11 vs 9 inbound links | Keep both only if they target different buyers (website build vs marketplace platform/app) and say so in the title and first paragraph; otherwise choose one canonical. |

## Answer-ready content (AEO)

- 182 pages already carry FAQ content with matching `FAQPage` markup; a sample of 5 had every question and answer visible in the server HTML.
- No new answer copy was published in this pass: AEO copy on service pages is business advice and claims, which need the owner's review. Question research needs real query data (Search Console, enquiries); none is connected yet, so no search volumes are stated anywhere.
- 58 comparison/knowledge articles use `Article` markup without `datePublished`, because no real publication date is recorded for them. Add dates to `comparisons.ts` / `knowledge-data.ts` if they're known; none were invented.

## Drafts waiting for approval (control room → Content → Pages & SEO)

| Page | Draft | Why |
|---|---|---|
| `/testimonials` description | "Client reviews published from the EmmaForYou client portal, plus clearly labelled sample reviews that show the kinds of results clients look for." | The live description ("What business owners … say about working with EmmaForYou") reads as verified reviews in search results, while the page's reviews are labelled samples. |
| `/knowledge-base/5-signs-ready-to-scale` title | "Ready to Scale Digitally? A 5-Point Readiness Guide \| EmmaForYou" | Same title as the blog post above. |

## Pages with no internal links in the server HTML

- Fixed: `/watch` and `/newsletter` (footer → Resources).
- Owner decision: the six `/free-resources/*` toolkits are gated by a sign-up form on `/free-resources` (cards are buttons, not links) yet listed in the sitemap. Either add direct links (removes the gate) or take them out of the sitemap/noindex them as rewards.
- Owner decision: `/lab` has no published tools, so it's an empty page in the sitemap. Publish a tested Lab tool (then link it from /tools), or remove /lab from the sitemap until then.
- `/cases`, `/testimonials`, `/community/groups` are linked and indexable but not in the sitemap. `/cases` and `/testimonials` carry the unverified "100+ case studies" and sample reviews, so leaving them out is reasonable until the claims are resolved.

## Business claims (re-checked against code and database)

The claims register (`src/lib/claims.ts`, control room → Content → Claims & numbers) still lists 12 claims, and no owner status or evidence has been recorded for any of them (`site_settings` has no `claim:` rows). None appear in structured data. Unchanged since the last report:

- "500+ Testimonials", "500+ Verified Client Reviews", "500+ Businesses Helped", "12 named testimonials", "100+ Case Studies" (case_studies table empty), "50+ Niches", "3 Continents", "6+ Years Experience", "Operating Since 2019", "Featured Digital Agency"
- Partner badges (Meta, Google, Shopify, Stripe, Microsoft, WhatsApp)
- Countdown spots (no booking-capacity record)
- Results strip: "Clinic in Abuja: 86 new Google reviews" vs the portfolio record (86 reviews for Wellness Clinic Halle, Germany)

## Entity facts to confirm

| Fact | Where | Status |
|---|---|---|
| Name "EmmaForYou", founder "Emmanuel Oluwaseun Akinloye", founder roles | `lib/seo.ts` (Organization/Person JSON-LD, every page) | Owner-confirmed earlier |
| Areas served: Nigeria, United States, United Kingdom, France, Germany, South Africa, Ghana | Organization `areaServed` | Not separately verified — confirm or edit `AREAS_SERVED` |
| Contact languages English, French, Spanish, German | Organization `contactPoint` | Not verified — confirm the business answers in all four |
| Footer locations (Lagos, Hanover MD, Toulon, Halle, Cookhouse) | Footer only, not in JSON-LD | No addresses are published or marked up; no LocalBusiness markup is used |
| Social profiles (`sameAs`) | none | Add only real profile URLs |

## Portfolio imagery

9 of 12 portfolio projects use stock stand-in photos (labelled on the page). From this pass they're no longer used as the project's `og:image` or in its `CreativeWork` markup; the 3 projects with real screenshots keep theirs. Replace with the clients' real screenshots in `portfolio-data.ts`.
