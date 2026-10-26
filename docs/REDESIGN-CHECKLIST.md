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
- ~~Server-side (SSR) application of SEO overrides and HTTP 301 redirects~~ — done in c674e5e (root `beforeLoad` + `pageHead`), verified live.
- Full database backups: Lovable Cloud keeps one backup per day for ~14 days (15 listed on 26 Oct, oldest 12 Oct) plus an on-demand full export; see "Backups and recovery" below.
- Lovable MCP free-plan database action limit slowed migrations and DB tests.


## Final verification pass (26 Oct 2026, commits c674e5e + follow-up)

| Check (live site unless noted) | Evidence |
|---|---|
| v4 build live | /explore served the new code; all 9 areas open; 30 linked service pages return 200 |
| /explore controls | Real Escape closes a panel, arrow keys turn, drag + wheel zoom change the transform, simple view shows 9 cards / 30 links, exit → /services |
| Yorùbá (real provider) | Homepage fully translated with no failed batches; headings as whole phrases (h1 "Iṣòwò Rẹ Yẹ Kí A Rí I, Kí A Tẹ̀lé E…"); `<html lang="yo">`; reload uses cache (0 requests) |
| Second language (French, real provider) | Service page: max 1 translate request in flight (no overlap); hit the 40/hour visitor cap → page stayed usable with "79 phrases stay in English" note. Cap raised to 150/hour |
| AI repair (real provider) | `/api/site-repair` → 200 from OpenAI with validated before/after; 401 without session, 400 for an off-site route; no secrets in the response. Not applied (would publish an unapproved title) |
| Fresh live audit | 405 pages: 0 high / 0 medium / 0 low; 9 info = stand-in portfolio photos (owner action) |
| HTTP redirect (reversible test record) | `/efy-redirect-check?probe=1` → `/pricing?probe=1`, navigation redirectCount 1, `fetch` redirect:manual = opaqueredirect (server-side 3xx, not JS). Configured 301; the exact 3xx code isn't readable from browser APIs. Test redirect then disabled + deleted |
| Redirect validation (live UI) | Protected path and self-redirect refused by the database |
| Server-rendered SEO (reversible test) | Published a title override for /lab: raw server HTML `<title>` and og:title changed (12/12 samples once rollout finished); rolled back via History → Undo; DB confirms no live override |
| Activity log | Draft, publish, rollback and redirect save/live/disable/delete all logged with actor and time |
| Role enforcement (DB, rolled back) | 56/56 (rerun on final DB) |
| Live control room | All 13 sections render; AI live test OK (OpenAI, 2.4 s); DB 375 ms; 9 real enquiries listed (not modified); service/claim/announcement save draft → discard; all 8 Lab templates created → tests pass → publish enabled → deleted (nothing published); design preset preview + readability 5.08:1; checkpoint created and restored into drafts (auto pre-restore checkpoint) |
| Server HTML (live) | /, /login, /account, /blog, /book, /contact, /lab, /explore, /pricing, service + tool + portfolio pages: 200, one h1, public pages indexable with canonical, private noindex; unknown path 404; sitemap 397 URLs without /dashboard; robots disallows /dashboard |

## Blocker resolution pass (26 Oct 2026, commits fec490a → 47a972f)

### Deployment mismatch (27b8b17)
- What was seen: Lovable listed 27b8b17 as the latest commit and two publishes were made, but the served admin HTML had no loading-state h1 for ~25 min. At 21:55 UTC it was live on every sample (24/24, deployment `97fe7189`).
- Why it couldn't be pinned down then: `/api/site-config-status` reported a hand-written label that 27b8b17 didn't change, so the live server couldn't say which build it was running.
- Measured on this pass: `deploy_project` returns `pending` with a deployment id; the `x-deployment-id` response header switched to it within ~75 s, but an instance still answered with the previous build's code ~6 min after publishing; 40/40 requests were on the new build after that. Most likely cause for 27b8b17: a publish made before that commit's build finished (`get_project` shows the synced commit, `list_edits` shows whether it's built), plus staged rollout; this can't be proven after the fact.
- Fix: `vite.config.ts` stamps `builtAt` + `commit` into `/api/site-config-status`. Deploy procedure: wait for `list_edits` = completed → `deploy_project` → poll until both the header shows the returned deployment id and the endpoint shows the new commit on repeated samples.

### Responsive checks (real Chrome, live site, same-origin iframes at true widths)
| Pass | Result |
|---|---|
| Light: 11 routes × 360/390/768/1024/1440 | 55/55: no horizontal overflow, one h1, no page errors |
| Dark: 11 routes × 390/768/1440 (after the theme fix) | 33/33 dark, no overflow, one h1 |
| Reduced motion (site switch): 11 routes × 390/1440 | 22/22; `data-motion="reduced"`, /explore opens in simple view, no canvas, no looping animations |
| Mobile menu 390/768 | Opens, 20 controls, focus moves inside, Escape closes and returns focus to the button |
| Desktop menus 1440 | 6 menus; open + Escape |
| Forms (/contact, /book, /login) | Every field labelled, none wider than the screen, empty required forms don't validate |

Fixed from these checks: saved dark theme ignored on /explore and dashboards (inline theme script), homepage demo kept auto-advancing with the site's reduced-motion switch and could only be paused by hover (shared `useReduceMotion`, pause button, focus pause; WorkflowViz stops when a step is chosen), form text 15.2px on phones (iOS zoom; now ≥16px), skip-link target missing on most pages, /explore controls and panel under the mobile quick-actions bar, POST-only API paths returned an empty 200 page on GET (now 405).

### Backups and recovery (seen in the Lovable project, nothing restored or exported)
| Layer | What exists | Covers |
|---|---|---|
| Configuration checkpoints (`site_backups`) | Control room → Backups; restore goes into drafts after an automatic checkpoint | Design, site settings, redirects, lab items only |
| Database backups (Lovable Cloud) | Daily, ~14 days kept (15 listed: 12–26 Oct 2026, ~02:15 UTC); More → Database → Manage → Backups; no point-in-time recovery | All tables incl. leads, bookings, accounts (auth) |
| Database export | More → Database → Manage → Settings → Export data (pg_restore archive, once per 24 h, emailed) | Full database incl. password hashes; not storage files, secrets, auth provider settings |
| Files / media | No backup in Lovable Cloud | Storage buckets (currently 0 objects in 4 buckets) |

A Lovable backup restore replaces the live database, can't be undone and loses everything after the backup, so it was not tested; there is no restore-to-new-project option.

### Final regression on the deployed build (deployment `80d86508`, commit 47a972f, built 2026-10-26)
| Check | Result |
|---|---|
| Live build identity | `/api/site-config-status` → commit `47a972f`; `x-deployment-id` = the id `deploy_project` returned; first seen 11 s after publishing |
| Admin loading headings | `/dashboard/site`, `/dashboard/agents`, `/dashboard/inspiration`: one h1 in server HTML |
| Server-rendered SEO (reversible) | Test title published for /lab: `<title>`, og:title, twitter:title in raw server HTML 14/14 within ~80 s (60 s cache per instance); rolled back via History → Undo; raw HTML back to the original title |
| HTTP redirect (reversible) | `/efy-redirect-check?probe=n` → `/pricing?probe=n` 10/10 as a server 3xx (`opaqueredirect` with `redirect: manual`); configured 301 (exact code not readable from the browser); disabled + deleted, path now 404 |
| AI translation (real provider) | `/api/translate` Yorùbá, uncached string: 200 in 4.9 s, 0 incomplete, numbers kept; test cache row removed |
| AI repair | No session 401, forged session 401, off-site route 400, staff session 200 with an OpenAI proposal in 7.3 s; no secrets in responses; nothing saved or applied (0 repairs) |
| Roles (DB, rolled back) | 56/56 |
| Activity log | Draft, publish, redirect save/live/disable/delete and rollback all recorded with the actor |
| Service links | All 29 links from /services return 200 |
| Local suites | v4 50/50, v3 33/33, journeys 17/17, demo 10/10, explore 12/12, Lab 33/33, SEO 12/12, layout sweep 832 loads (only harness-only /blog) |
| Leftovers | 0 settings, 0 redirects, 0 lab items, 0 repairs, 0 role-test users, default design |
