# EmmaForYou — SEO, AEO and GEO

Living reference for how the site is optimised for search engines, answer engines and AI search.
Last updated: 12 October 2026. Canonical domain: `https://emmaforyou.lovable.app` (set `VITE_SITE_URL` when a custom domain goes live).

## 1. Audit findings (before → after)

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 1 | Homepage and `/analyser` canonicals pointed to `emmaforyou.com`, which belongs to an unrelated third-party business | Critical | All canonicals generated from `SITE_URL` via `pageHead()` |
| 2 | No `robots.txt`, no XML sitemap | High | `/robots.txt` and `/sitemap.xml` server routes (115 canonical URLs) |
| 3 | Only 2 of 28 routes had canonicals; generic metadata inherited elsewhere; no Twitter/OG image | High | Unique title, description, canonical, robots, OG and Twitter tags on every route |
| 4 | No structured data | High | Organization, WebSite, Person, Service, BreadcrumbList, Article/BlogPosting, CreativeWork, ItemList, FAQPage |
| 5 | `/services/*` and `/expertise/*` rendered identical content for 6 services; `/services/app-development` showed the website page | High | Expertise duplicates canonicalise to the service URL; App Development has its own content |
| 6 | FAQ answers (homepage, `/faq`, `/pricing`, service pages) only existed in the DOM after a click | High | Answers always rendered; open/close is CSS-only |
| 7 | Homepage service cards all linked to WhatsApp — no crawlable path to service pages | High | Cards link to `/services/*`; footer adds services and tools columns |
| 8 | Founder named "Emmanuel Okolie" on blog posts, "Emmanuel Akinloye Oluwaseun" elsewhere | Medium | Unified to Emmanuel Akinloye Oluwaseun |
| 9 | `/watch` embedded an unrelated third-party video presented as the founder's | Medium | Removed; one-line slot for the real video with `VideoObject` added automatically |
| 10 | Founder portrait 2.3 MB (×2) | Medium | 53 KB WebP (900 px); portfolio and dashboard images converted to WebP |
| 11 | Inconsistent numbers in metadata (500+, 1,200+, 5,000+) | Medium | Metadata avoids unverified figures; on-page claims are owner-confirmed |
| 12 | `/dashboard` and `/portal` indexable | Medium | `noindex`; disallowed in robots (access control remains login-based) |
| 13 | Unknown slugs returned generic titles | Low | `noindex` + specific "not found" titles; 404 status |

Open items needing the owner: real client screenshots/logos, the real founder video, a verified email/phone for `contactPoint`, official social profile URLs for `sameAs`, and whether to opt out of AI training crawlers.

## 2. Route map and primary intent

| Route | Primary intent | Topic / cluster | Conversion |
|-------|----------------|-----------------|------------|
| `/` | Navigational / commercial | AI automation & digital growth agency | Start a project, WhatsApp, tools |
| `/services/ai-automation` | Commercial | AI automation agency, business process automation, AI chatbots | Service inquiry |
| `/services/website-design` | Commercial | Website design & development | Service inquiry |
| `/services/ecommerce` | Commercial | Ecommerce / Shopify development | Service inquiry |
| `/services/email-marketing` | Commercial | Email marketing & automation | Service inquiry |
| `/services/social-media` | Commercial | Social media management | Service inquiry |
| `/services/ad-marketing` | Commercial | Paid advertising (Meta, Google) | Service inquiry |
| `/services/app-development` | Commercial | Custom business apps | Service inquiry |
| `/expertise/{lead-generation, sales-conversion, copywriting, funnel-building, crm-systems, seo, analytics, wordpress, digital-strategy}` | Commercial | Specialist services | Service inquiry |
| `/niche/*` (12) | Commercial | Services by industry | WhatsApp / intake |
| `/portfolio`, `/portfolio/*` (12) | Commercial investigation | Proof of work | Start a similar project |
| `/pricing` | Transactional | Agency pricing | Plan enquiry |
| `/analyser`, `/roi-calculator`, `/growth-quiz`, `/email-generator` | Informational → lead | Free tools | Expert audit / plan request |
| `/knowledge-base/*` (50), `/blog/*` (8) | Informational | Topic clusters below | Related service |
| `/faq` | Informational | Buying questions | Intake |
| `/about` | Navigational | Founder & company | Contact |

## 3. Keyword clusters

Search volumes, difficulty and CPC are intentionally **not** listed: no keyword tool was connected, and figures must not be invented. Validate demand in Google Search Console (queries report) and a keyword tool before prioritising.

| Cluster | Example terms (research starting points) | Customer & problem | Target page | Supporting questions |
|---------|------------------------------------------|-------------------|-------------|----------------------|
| AI automation | AI automation agency, business process automation, AI workflow automation, WhatsApp chatbot for business | Owner losing enquiries to slow replies | `/services/ai-automation` | What is AI business automation? Which processes can be automated? What does an AI automation agency do? |
| Websites | website design and development, business website cost, website for small business Nigeria | Business with no/weak site | `/services/website-design` | How much does a website cost? What to prepare before hiring an agency? |
| Ecommerce | Shopify development, ecommerce store setup, improve ecommerce conversion | Product brand selling via DMs | `/services/ecommerce` | How can an ecommerce business improve conversion rates? |
| Email | email marketing services, email automation, abandoned cart emails | Past customers never return | `/services/email-marketing` | How can email automation improve follow-up? |
| Social | social media management, Instagram management for business | No time to post consistently | `/services/social-media` | How often should a business post? |
| Paid ads | Facebook ads agency, Google Ads management | Wants predictable leads | `/services/ad-marketing` | SEO vs paid advertising? Is ad spend included? |
| SEO | SEO services, local SEO, Google Business Profile optimisation | Not found on Google | `/expertise/seo` | How long does SEO take? |
| Apps | custom business app, booking app development | Operations in spreadsheets | `/services/app-development` | When does a business need a custom app? |
| Growth | digital growth services, digital marketing strategy | Unsure where to start | `/expertise/digital-strategy`, `/analyser` | How do I choose the right services? |

## 4. Structured data

| Type | Where | Notes |
|------|-------|-------|
| `ProfessionalService` (Organization) | Every page | `@id` `/#organization`; founder, areas served, services; WhatsApp contact point. No ratings, prices, addresses or certifications. |
| `WebSite` | Every page | Publisher → organization |
| `Person` | Every page (founder) | `@id` `/#founder` |
| `Service` + `BreadcrumbList` | Services, unique expertise pages, industry pages | Provider → organization |
| `BlogPosting` / `Article` | Blog posts / knowledge base | ISO dates where the post has one; named authors |
| `CreativeWork` | Case studies | Creator → organization |
| `ItemList` | Homepage (services), portfolio, knowledge base | |
| `FAQPage` | `/faq` only | Matches visible Q&A. Google currently shows FAQ rich results only for well-known government and health sites, so expect no rich result; the markup still describes the page accurately. |
| `VideoObject` | `/watch` | Emitted only once a real founder video ID is set |

Validate with Google's Rich Results Test and the Schema Markup Validator after publishing.

## 5. AEO

- Service pages carry 1–4 direct-answer questions each (answer in the first sentence, then detail and qualifications), with links to related work and services.
- All accordion answers are in the server-rendered HTML.
- Pricing answers reference only published plan prices; project prices are "fixed quote after a call".

## 6. GEO / entity

- One entity description (`ORG_DESCRIPTION` in `src/lib/seo.ts`) reused in meta, JSON-LD and `llms.txt`.
- Founder name unified across blog, about, service pages and JSON-LD.
- `llms.txt` lists services, client work and tools with canonical links. It is optional and experimental; it does not guarantee citations.

## 7. Crawler policy

`robots.txt` allows all crawlers, disallows `/dashboard`, `/portal`, `/api/`. AI **training** crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot, Applebot-Extended, meta-externalagent) are allowed by default; set `BLOCK_AI_TRAINING = true` in `src/routes/robots[.]txt.ts` to opt out while staying in search and AI answer results.

## 8. Content plan (publish only with genuine value)

| Article | Reader | Question | Intent | Service link | Evidence needed |
|---------|--------|----------|--------|--------------|-----------------|
| Which business processes should you automate first? | Owner of a service business | Where do I start with automation? | Informational | AI Automation | Examples from client automations |
| What a business website really costs in Nigeria (and what changes the price) | First-time website buyer | How much should I budget? | Commercial investigation | Website Design | Real quote ranges from past projects |
| WhatsApp automation: what to automate and what to keep human | Salon/clinic/restaurant owner | Is a chatbot right for me? | Informational | AI Automation | Before/after reply-time data |
| Shopify vs selling on Instagram DMs | Fashion/product seller | When to open a store? | Commercial investigation | Ecommerce | Lagos Couture case study |
| Email flows every small shop should run | Ecommerce owner | Which emails matter? | Informational | Email Marketing | Open/click data from clients |
| Local SEO checklist for clinics and salons | Local service owner | How do I show up on Google Maps? | Informational | SEO | Wellness Clinic Halle review growth |

## 9. Measurement

- First-party analytics (`site_events`) already records page views with referrer and UTM, plus conversions: `lead_submitted`, `intake_submitted`, `prototype_generated`, `quiz_completed`, `roi_calculated`, `whatsapp_click`, `cta_click`. View in `/dashboard` (Sources = organic share).
- **Google Search Console**: add the property for the canonical domain, choose "HTML tag", put the token in `VITE_GOOGLE_SITE_VERIFICATION`, publish, verify, then submit `/sitemap.xml`.
- **Bing Webmaster Tools**: import from Search Console, or use the meta tag via `VITE_BING_SITE_VERIFICATION`.
- Baseline (record after first 28 days): impressions, clicks, CTR, indexed pages, top queries, organic landing pages, organic-sourced inquiries.
- AEO/GEO observation: monthly, run the questions in section 3 in Google (AI Overviews), Bing Copilot, ChatGPT search and Perplexity; log whether EmmaForYou is cited and which URL. Record only verified citations.
