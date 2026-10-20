# Homepage upgrade

- [x] Replace hero rings with interactive 3D growth object and service tiles.
- [x] Add live AI prototype generation, refinement, device previews, and fullscreen.
- [x] Connect prototype prompt to business intake form.
- [x] Remove fabricated activity notifications.
- [x] Per-visitor (3/hour) and global (60/hour) prototype limits.
- [x] First-party analytics and private /dashboard with leads inbox.
- [x] Email alert to the owner for every new lead, booking, audit, proposal and tool request (Resend via Supabase Vault; each email has a one-tap "Reply on WhatsApp" button).
- [ ] Optional: push alerts straight to WhatsApp (needs a WhatsApp Business API account).

# Solutions catalogue

- [x] 178 solution pages across 6 areas, each with a working prototype on one of 20 demo engines.
- [x] Every demo engine has browser-local settings (cleared by Reset demo), roles and notification previews where relevant.

# Verification checklist (updated 2026-10-20)

Status: **Verified** = tested live on the preview; **Blocked** = needs the owner.

## Demo harness, settings and demos (Phases 3–4)
- [x] Verified — all 178 solution demos load in the browser with no errors.
- [x] Verified — all 20 demo engines: setting saved, kept after reload, cleared by Reset demo; 400+ control clicks with no errors.
- [x] Verified — billing, course and scoring demos (pricing, CRO, loyalty, comparison) included; pricing sensitivity now saved too.
- [x] Verified — demo AI (assistant/writer) falls back cleanly when AI is unavailable; demos never touch real records.

## Solution-page content (Phase 5)
- [x] Verified — catalogue matches original scope: 35 websites, 46 business apps, 54 AI, 8 automation, 15 mobile/desktop, 20 industries (178), no duplicates.
- [x] Verified — "Use cases" section (3 specific use cases per solution) and industry-specific problems + before/after are live.

## Tools
- [x] Verified — Website Audit through the real page: fetch, 23 checks, 5 scores, AI-written priorities, PDF and expert-review options.
- [ ] Blocked — Google Lighthouse scores in the audit: Google's keyless daily quota is exhausted; add a free `PAGESPEED_API_KEY` secret.
- [x] Verified — Makeover, prototype builder, proposal, receptionist, smart contract check, goal planner, email generator, Ask Emma, translate: real AI output.

## OpenAI
- [x] Verified — backend uses OpenAI (`gpt-6-luna`); `/api/ai-status` made a real request that succeeded.
- [x] Verified — no key or server-only code in shipped browser files.

## Header, navigation, responsiveness
- [x] Verified — no sideways scroll at 320–1920px; desktop menus fully on-screen at 1280–1920px; drawer covers the screen and closes on tap.
- [x] Verified — all 357 pages checked at 375px: nothing runs off the edge.

## Accessibility
- [x] Verified — every form field on the main pages has a name (intake, portal, dashboard, FAQ, testimonials, waitlist, ROI).
- [x] Verified — footer links and filter chips have comfortable tap areas on phones; one H1 on every main page.

## Speed
- [x] Verified — knowledge-base articles and the solutions catalogue no longer ship to every page (main file 614 KB → 406 KB on the preview's development build); pages and server-rendered SEO unchanged.
- [ ] Pending publish — the live site still serves the old 507 KB main file until the owner publishes.
