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

## Community (2026-10-20)
- [x] Verified — database security: 40/40 rule tests (ownership, counters, duplicates, blocks, visibility, community sign-ups not turned into portal clients).
- [x] Verified — pages render signed out at 320–1440px with no sideways scroll: feed, post, profile, settings, saved, notifications, explore, guidelines, moderation, messages, inbox, groups.
- [x] Built — feed (6 sorts, cursor paging, topic/tag/kind filters, pinned posts), rich posts (polls, media, links with previews, drafts), threaded comments, reactions, saves, follows, blocks, reports, moderation queue + audit log, notifications (live), search, profiles with reputation and badges, settings (profile, drafts, blocks, password, data export, delete).
- [x] Built — private messages, community AI assistant with specialist routing, "Talk to a person", staff support inbox with take-over / hand-back (control version enforced in the database).
- [x] Built — groups (public / private with approval, admins, group feeds; private posts members-only).
- [ ] Owner — signed-in flows (posting, messaging, assistant, groups, moderation) need a real account: sign up at /community and give your account the admin role to see Moderation and Support inbox.

## Automated blog (2026-10-20)
- [x] Verified — end to end on the preview: 29 RSS sources fetched (24 healthy, 5 refuse automated requests), 240 trend items scored, one article written from its source, failed the gate once (long list item), then a second run published "AI Content and SEO: Why Businesses Need Human Judgment" with 20/20 checks, sources and disclosure; it appears on /blog and in the sitemap.
- [x] Verified — pg_cron job `emmaforyou-blog-tick` runs every 10 minutes and calls the site; the live site answers 404 until the latest version is published.
- [ ] Owner — click Publish in Lovable; after that the 4 daily slots (07:00, 11:00, 15:00, 19:00 Africa/Lagos) run with the dashboard closed. Slots missed before then are not back-filled; the dashboard shows the shortfall.

## One account + footer (2026-10-21)
Identity architecture (audited): the community, client portal and dashboard already used the same Supabase Auth identity store and the same browser session on one origin; there were never separate credentials, only three different sign-in forms and different set-up for new accounts (community sign-ups had no client record, so the portal had nothing to show them). 1 existing account (the owner: admin + client), 0 duplicate emails, email/password only. No migration of identities was needed or performed.
- [x] Built — one sign-in form everywhere (`components/auth/AccountAuthForm.tsx`), `/login` (sign in, create account, forgot password, set new password; safe `next` redirects), `/account` (areas, open client portal, change password, sign out on this device / all devices), header and footer account links, portal "Open your client portal" for existing accounts.
- [x] Built — admin role from the admin email list is granted only after the address is verified (was: at sign-up).
- [x] Verified (database, rolled-back test with synthetic accounts): community sign-up has no client record → activates the portal with the same account → gets only the `client` role; portal sign-up can create a community profile with the same account; duplicate email rejected by the identity store; unverified account can't open the portal; listed admin email gets admin only after verification; a regular member can't grant itself admin, can't read admin data (site events, blog runs, scheduler status) or change blog settings; the admin can.
- [x] Verified (test browser, real components): sign-in form at 320px (labels, autocomplete, no overflow); header account menu signed out (Sign in / Create account) and signed in (Your account, Client portal, Community, Owner dashboard for admins, Sign out); footer at 320–1440px: no overflow, 41 links, every internal link matches a real route.
- [ ] Not executed by me — real sign-up, email confirmation, password reset and sign-in/out round trips: they need a real inbox and password, which I'm not permitted to use. Owner to try: create an account at /login, open /portal and /community with it.
- Limitation, by design: the session is held by Supabase Auth's supported browser storage on this single origin (no cross-origin SSO is needed: every area is on the same site).

## Ecommerce Intelligence (2026-10-21)
- [x] Built — hub with the two journeys (Start an ecommerce business / Grow my existing store) and 11 tools: launch questionnaire → 14-step roadmap; product research & validation (competitor pages, tracked industry news, unit economics, evidence vs hypothesis); store audit (speed via PageSpeed, SEO, trust, checkout, product pages; platform detection for 19 platforms); sales diagnosis (funnel, CSV orders import, findings labelled Confirmed / Strongly supported / Hypothesis / Unknown, experiments); profit analyzer (formulas shown, break-even, CAC, ROAS); competitor comparison; marketing experiment planner + channel checklist; action planner (audit fixes, roadmap steps, experiments, own tasks); AI business guide using saved reports; workspace (multiple workspaces, export JSON, delete); integrations page with honest statuses.
- [x] Built — admin panel in /dashboard: usage, errors, and on/off + extra instructions for the community assistant and the ecommerce guide (the community assistant now honours both and links to the ecommerce tools).
- [x] Verified (database, rolled-back test with synthetic accounts): users can't see, change, delete or add to another user's workspace; can't spoof ownership; can't write guide messages or change agent settings; can't call the admin summary; the admin can (and sees counts only, not users' saved work); the 10-workspace limit holds.
- [x] Verified (unit tests): profit maths, diagnosis, roadmap branching, CSV summary, page extraction, platform detection, SSRF guard (internal/numeric/credential/port addresses rejected; redirect to an internal address blocked before it is requested; redirect loops capped).
- [x] Verified (test browser, real components with stubbed data): all 12 pages + admin panel at 320/375/768/1280px, signed out and signed in: one H1, no sideways scroll, every form field labelled, no script errors; diagnosis and profit calculations checked by entering numbers and uploading a sample CSV.
- [ ] Not live — connected store, marketplace, analytics and ad-platform data: each needs a registered developer app (OAuth client / API keys) that only the owner can create; the exact requirement is listed on /ecommerce/integrations. CSV import and manual entry work meanwhile.
- [ ] Not available — search volume and marketplace demand data: no licensed data source is connected, so the tools say so instead of estimating.
- [ ] Not executed by me — live audits/scans/research against real stores and AI guide replies: they run on the published site (server routes + OPENAI_API_KEY). Owner: click Publish, then try /ecommerce/grow with your store address.

## AI agent team (2026-10-21)
Inventory used (from the code, not invented): 24 expertise areas, 6 solution categories with 158 solutions, 20 industry solutions, 12 industry/niche pages and 29 free tools and resource pages = 249 catalogue niches; existing community (posts, comments, reactions, notifications, messaging with AI assistant + human takeover, groups, moderation), leads/bookings/audits/proposals forms, blog trend feed (shared research), OpenAI via `ai/guard.ts`, pg_cron/pg_net.
- [x] Built — Agent Directory: 18 named agents (Atlas — General Opportunities coordinator; Vela, Mercer, Lumen, Cortex, Relay, Forge, Orbit, Beacon, Echo, Spark, Tempo, Prism, Keystone, Compass, Harbor, Sage, Anvil), each with identity, scope, voice, knowledge, problem-solving, sales, community and research workflows, limits, keywords, capabilities, reply/publish policies, posting frequency, reply and token budgets; editable, mergeable and switchable from the dashboard; new agents get a labelled community identity automatically.
- [x] Built — background worker and queue: event tasks (new post, reply in an agent thread or @mention, website forms/bookings/audits/proposals, admin-assigned tasks) and 11 scheduled jobs (unanswered questions, research, content planning, publishing, follow-ups, lead review, knowledge sync, insights, daily/weekly summaries, maintenance) with dedupe keys, leases, retries with backoff, dead letters, timeouts, run history, usage and cost records, pause/resume.
- [x] Built — community work: coordinator routing (keyword scores + AI choice among ≤3 specialists + coordinator), one primary reply, optional second specialist only when it adds something new, continued threads, opt-outs ("stop replying"), escalation of disputes/legal/complaints/safety to a person, flagging harmful posts for moderators, educational posts from sourced research with dedupe (60-day similarity) and a review queue, follow-ups only with consent or for unresolved questions, lead records with evidence, confidence and stage, member memory with opt-out and self-service deletion, private assistant chat answered as the matching specialist.
- [x] Built — Agent Control Center at /dashboard/agents: overview (real counts only), directory editor, content approval, activity with routing evidence and takeover, leads pipeline with reassignment/override/notes/export, jobs (run now, intervals, retry/cancel, dead letters, run history), team settings (limits, budgets, prices, model, review modes, private outreach off by default, instructions), knowledge base (catalogue + owner notes, deactivate wrong entries), audit log, summaries and AI usage with CSV export.
- [x] Verified (unit tests): all 249 catalogue niches have an owner, every knowledge path is a real page, routing picks the right specialist for 7 sample questions, link sanitiser removes invented and external links, safety screens (human/experience/guarantee claims), dispute vs. topic detection (11 cases), opt-out detection, source filtering, cost maths.
- [x] Verified (database, rolled-back test with synthetic accounts, 36 checks): members can't read agent records, leads or settings, call admin functions, enqueue work, change agents, pose as an agent or edit others' preferences; they can manage their own preferences and see/delete their own memory only; a member question queues one delayed task (no duplicates), member-to-member comments don't involve agents, a reply to an agent does and cancels its pending follow-up, agent posts are ignored, opting out cancels follow-ups; the admin can see the overview but not the scheduler secret, change settings, run jobs, rename (profile follows), disable (profile suspended), take over, merge and create agents; the cron entry point queues all 11 jobs.
- [x] Verified (live database): migration applied; 18 agent identities can't sign in, have no client records or roles; pg_cron ran and called the site.
- [x] Verified (test browser, stubbed data): all 8 control-center tabs at 320/375/768/1280px with no sideways scroll, labelled fields, no script errors.
- [ ] Waiting — the live site answers /api/agents-tick with 404 until the latest version is published; until then tasks queue up but don't run. After publishing, the first runs sync the catalogue knowledge and research; educational posts wait for approval until "Allow automatic posts" is switched on.
- [ ] Not executed by me — a real reply on the live community (needs the published worker, a real member question and the OpenAI key on the server).
