# Futuristic redesign — route checklist (Oct 2026)

Tested in a browser harness that runs the real route components (data stubs, no live server): every route at 360 / 390 / 768 / 1024 / 1440 px, plus 1440 reduced-motion, 1440 dark and 390 dark (700 loads). Result: 0 horizontal overflow, 0 script errors, one h1 per page. Not tested: real phone GPUs, live data, Safari/Firefox.

| Route group | Treatment | Checked |
|---|---|---|
| `/` homepage (22 sections) | Section-by-section scenes, scroll story, parallax hero, scroll-lit statements, dials, rails, bento | ✅ all widths, reduced, dark |
| `/fr`, `/de` | Orb hero, kinetic headings, process path, glass FAQ, aurora close | ✅ |
| `/services`, `/services/*` (7), `/expertise/*` (~25) | One "service world" each (colour + live scene), kinetic titles, process path lit by scroll, glass FAQ; added missing `<main>` | ✅ |
| `/solutions`, `/solutions/*` (6 areas), `/solutions/*/*` (178) | Per-area colour, icon constellation, tilt cards, demo stage; fixed page jump on AI demos | ✅ (sampled 2 detail pages) |
| `/portfolio`, `/portfolio/*` | Masked/parallax case media, tilt, stock-photo labels | ✅ |
| `/pricing` | Glass tiers, popular lift, price roll, toggle | ✅ |
| `/about` | Ink hero, scroll-drawn journey line, founder ring, tilt values | ✅ |
| `/cases`, `/testimonials` | Ink hero + glass cards (testimonials content NOT changed — see note) | ✅ layout only |
| Tool pages via ToolShell (19) | Per-tool accent, scanning lens, measured bench, glass answers | ✅ |
| `/ecommerce/*` (12) | Glass tool rail, ambient, kinetic intros, scanning progress, drawn score rings | ✅ |
| Blog, knowledge base, checklists, compare, free resources, niche, faq, affiliate, inspiration, watch, intake, analyser, ROI, quiz, email | Kinetic titles, glass cards, reveals, reading progress (existing) | ✅ (blog list needs the live server in the harness) |
| `/community/*` (16) | Subtle level: glass panels, active indicators, glass bottom bar | ✅ |
| `/login`, `/account`, `/portal`, `/dashboard*` | Glass auth stage, sliding mode switch, operational grid, KPI count-up, bar growth | ✅ signed-out states only |
| Legal (`/privacy`, `/terms`, `/cookies`) | Calm reading, glass title plate | ✅ |
| 404 / error | StatusScreen (outlined code, CSS orb, search shortcut) | ✅ |
| Global | ⌘K site search, view transitions, back-to-top ring, skeleton shimmer, alert/status feedback | ✅ 17/17 journeys |

Content flagged for the owner: homepage "500+" figures and partner badges; countdown spots are hard-coded. `/testimonials` generated reviews are now labelled **Sample** with a disclosure note (nothing deleted).

## v3 — AI-native pass (26 Oct 2026)

| Item | What changed | Checked |
|---|---|---|
| Services "Everything your business needs" | UI/UX and Web3 cards added (9 total, 4-col bento), link to the full catalogue | ✅ v3 test |
| Full catalogue | `lib/service-catalog.ts` (30 entries from real service/expertise/solution pages) + `ServiceExplorer` (turning ring: drag/swipe, arrows, reset, flat in reduced motion; search; expandable items linking to real routes) | ✅ drag, click, reset, search, expand |
| Solution finder | Goals + business + budget + own words → matched services with reasons, phases, questions, plan, brief; copy / WhatsApp / hand to Emma AI / send as lead. Rule-based, labelled. Homepage + `/book` | ✅ |
| Founder | Name corrected to **Emmanuel Oluwaseun Akinloye** (22 places, `FOUNDER.name`); real photo `FounderCard` on homepage finder, `/book`, `/contact`, service/expertise enquiry band | ✅ |
| Client Work images | Root cause: remote Unsplash stand-ins can fail. `SafeProjectImage` / `ProjectVisual` fall back to a drawn, labelled "Illustrative preview" on cards, case heroes and locale pages | ✅ forced-failure test |
| Languages | One selector (EN/FR/ES/DE + 7 AI languages); choice persists across routes and reloads (localStorage), cached per language, "Show English" | ✅ Yoruba + French across 3 routes and reload (translation route mocked) |
| Motion | Visible motion switch in header + menu, remembered (`efy_motion`) | ✅ |
| ⌘K palette | Contextual suggestions per page, commands (Ask Emma, theme, motion, language, finder), staff-only shortcuts to the control room (navigation only) | ✅ |
| `/dashboard/site` control room | Overview (real counts), live site audit with evidence + triage + saved reports, catalogue coverage, design lab (6 presets, sliders, live preview, draft, preview-on-site, publish with confirmation, versions/restore), team & roles (admin/editor/auditor, DB-enforced), activity log, AI/DB health with live test | ✅ harness with roles; DB rules tested in a rolled-back transaction |

Not built (honest list): immersive 3D world, innovation lab, automated AI repair workflows, voice beyond the existing assistant, marketing/developer/analyst roles, redirect manager and backups UI.


## v4 — Verification, control expansion & remaining features (26 Oct 2026)

### Phase 1 — live verification (done on https://emmaforyou.lovable.app with the owner's existing session)
| Check | Result |
|---|---|
| Commit 414752a is the latest on `main`; Lovable synced and deployed it | ✅ |
| Homepage: 9 service cards incl. UI/UX + Web3, explorer, finder, founder name, motion switch, language menu, no broken images, no console errors | ✅ |
| `/blog` (live) | ✅ 41 post links, one h1, no errors — the earlier failure was harness-only |
| `/account` (live, signed in) | ✅ renders the account; ❌→✅ no h1 in server HTML while loading (fixed) |
| Control room overview with real counts (310 views/7 days, 905/30 days, 0 leads/30 days) | ✅ |
| Real site audit from the control room (401 pages, saved report) | ✅ found: /login + /account no h1 (fixed), 2 duplicate solution titles (fixed), /ecommerce/workspace noindex (intended; now excluded), 9 stock stand-in images (owner action) |
| Live AI translation (Yorùbá) | ❌→✅ second batch returned 502 ("came back incomplete") and stopped the page half-translated; word-by-word heading translation. Fixed: numbered-key prompt, partial results kept + one retry, smaller batches, no abort on one batch, whole-phrase headings, `<html lang>` set, no overlapping runs |

### Phase 2 — control room (`/dashboard/site`)
| Area | What it really changes | Test |
|---|---|---|
| Content → Pages & SEO (355 routes) | Title/description/noindex override per path, live server HTML shown beside it; applies in browsers, code snippet for the server HTML | ✅ harness + DB |
| Content → Services | Hide/rename/reorder/feature catalogue entries (cards, map, finder, search) | ✅ |
| Content → Portfolio | Order, hide from listings, replace stand-in photo with the client's real screenshot (confirmation required) | ✅ |
| Content → Media | Upload to public `site-media` bucket (5 MB, images only), copy URL, delete (admin); built-in image health | ✅ harness (bucket created by migration) |
| Content → Tools & demos | Hide from tools hub, Beta/Prototype labels | ✅ |
| Content → Navigation & links | Hide Resources/Tools/Company menu entries, announcement bar, broken links from last audit | ✅ |
| Content → Claims & numbers | Claims register (12 claims), status + evidence + show/label/hide; real countdown figures | ✅ |
| Enquiries | Unified inbox of 6 form tables, status/notes (admin), CSV | ✅ |
| Translations | AI cache stats/search/edit/delete/clear; overrides for built-in EN/FR/ES/DE text | ✅ |
| Design lab | 6 presets now also set font, shadow depth and page tint; compare with live; readability (contrast) check; draft/preview/publish/versions | ✅ |
| Features | 12 switches + release status | ✅ |
| Redirects | Draft → publish (admin), loop/duplicate/chain/protected checks, test link; applied from the 404 page | ✅ |
| Innovation Lab | Idea → template (8) → spec → structured config → isolated preview → automatic tests → admin approve → `/lab/<slug>` | ✅ 33 engine tests + harness |
| Audit & repair | Fix proposals (rules or AI) with before/after diff, apply with checkpoint, reject, roll back, re-check live page, ignore with reason, reopen, assign | ✅ harness + DB |
| Team & roles | admin, editor, marketing, developer, analyst, auditor — enforced in `site_can` + RLS | ✅ role matrix test |
| Backups | Config checkpoints (design, settings, redirects, lab), download, restore into drafts, restore from file | ✅ DB |

### Phase 3
| Item | Status |
|---|---|
| Immersive 3D world `/explore` (CSS 3D, 9 districts, hotspots, drag/keys/zoom, simple view, exit) | ✅ |
| AI-assisted repair (`/api/site-repair`, staff-only, validated proposals, approval + rollback) | ✅ harness (mocked AI); live AI call to be confirmed after deploy |
| Multilingual: real AI translation verified on live | see Phase 5 |

### Phase 4 — trust & content (flagged, nothing removed)
Partner badges (Meta, Google, Shopify, Stripe, Microsoft, WhatsApp), "500+" testimonials/reviews/businesses, "100+ case studies" (table is empty), "Featured Digital Agency", "Operating since 2019", the 12 named homepage testimonials, and the countdown spots have no evidence in the code or database — listed in the Claims register for the owner. The results strip says "Clinic in Abuja: 86 new Google reviews", but the portfolio records 86 reviews for Wellness Clinic Halle (Germany); London, Cape Town, Accra and Port Harcourt results have no project record. Founder name verified as "Emmanuel Oluwaseun Akinloye" everywhere; only `/images/emmanuel.webp` is used.

### Blocked / not done
- Server-side (SSR) application of SEO overrides and HTTP 301 redirects: needs a hosting/loader change; overrides and redirects apply in the browser.
- Full database backups/restore of business data: depends on the Lovable Cloud plan; not visible or testable from here.
- Lovable MCP free-plan database action limit slowed migrations and DB tests.
