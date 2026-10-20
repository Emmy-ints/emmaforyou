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

# Verification checklist (updated 2026-10-19)

Status: **Verified** = tested live on the preview; **Built** = code done, live check pending; **Blocked** = needs the owner.

## Demo harness, settings and demos (Phases 3–4)
- [x] Verified — all 178 solution demos load in the browser with no errors.
- [x] Verified — all 20 demo engines: setting saved, kept after reload, cleared by Reset demo; 400+ control clicks with no errors.
- [x] Verified — billing, course and scoring demos (pricing, CRO, loyalty, comparison) included in the above; pricing sensitivity now saved too.
- [x] Verified — demo AI (assistant/writer) falls back cleanly when AI is unavailable; demos make no other network calls and never touch real records.

## Solution-page content (Phase 5)
- [x] Verified — catalogue matches original scope: 35 websites, 46 business apps, 54 AI, 8 automation, 15 mobile/desktop, 20 industries (178), no duplicates.
- [ ] Built — "Use cases" section (3 specific use cases for every solution) and industry-specific problems + before/after; live check pending.

## Tools
- [x] Verified — Website Audit: real fetch, 23 checks, AI-written priorities.
- [ ] Blocked — Google Lighthouse scores in the audit: Google's keyless quota is exhausted daily; add a free `PAGESPEED_API_KEY` secret.
- [x] Verified — Makeover, prototype builder, proposal, receptionist, smart contract check, goal planner, email generator, Ask Emma, translate: real AI output.

## OpenAI
- [x] Verified — backend uses OpenAI (`gpt-6-luna`); `/api/ai-status` POST made a real request that succeeded.
- [x] Verified — no key or server-only code in 53 shipped browser files.

## Header, navigation, responsiveness
- [x] Verified — no sideways scroll at 320–1920px; nothing clipped in the header; desktop menus fully on-screen at 1280–1920px.
- [x] Verified — mobile drawer backdrop covers the screen and closes on tap; theme/language in drawer under 400px.
- [ ] In progress — every page scanned at 375px for content cut off at the edge.
