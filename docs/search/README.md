# Search visibility (SEO, AEO, GEO) and release verification

What exists, how each number is calculated, where its data comes from, and what isn't connected. Nothing here promises rankings, AI citations, traffic or revenue.

## Where it lives

| Piece | Code | Notes |
|---|---|---|
| Page inspector (raw server HTML) | `src/lib/search/inspect.ts` | Title, description, robots, canonical, Open Graph, h1s, hreflang, JSON-LD, internal links, images, words |
| Search checks | `src/lib/search/checks.ts` | Canonicals, sitemap validity, structured data, hreflang, duplicates, link graph; runs inside the control room's full audit |
| Formulas | `src/lib/search/metrics.ts` | All rates return `null` (shown "N/A") on a zero or missing denominator |
| First-party traffic attribution | `src/lib/search/traffic.ts` | Sessions from `site_events` classified by referrer/UTM |
| HTTP checker | `src/lib/search/http-check-core.ts`, `src/lib/ai/http-check-handler.ts`, `POST /api/http-check` | Staff only; same-site paths only; real 3xx/4xx codes per hop |
| Release verification | `src/lib/search/release.ts`, control room → Search & releases → Releases | Records in `site_deployment_checks` |
| Build manifest | `vite.config.ts`, `src/lib/build-info.ts`, `GET /api/site-config-status` | Commit (short + full), build time, environment, version; "unavailable" if unknown |
| AI observations | `site_ai_observations`, control room → Search & releases → AI observations | Manual, sampled |
| UI | `src/components/site-admin/search.tsx` | Overview, Technical & links, Traffic sources, AI observations, Crawlers, Integrations, Releases |
| Tests | `tests/search/search.spec.ts` (82 checks), DB role tests (see checklist) | |
| Migration | `supabase/migrations/20261027010000_search_visibility.sql` | |

## Formulas (all in `metrics.ts`, unit-tested)

| Metric | Formula | Missing data |
|---|---|---|
| CTR | clicks ÷ impressions × 100 | impressions 0 → N/A |
| Average position (approximation) | Σ(position × impressions) ÷ Σ impressions | only when the provider doesn't give its own aggregate; labelled an approximation |
| Change | current − previous; ÷ \|previous\| × 100 | previous 0 → "new" / "not comparable" |
| Conversion / lead / qualified-lead / lead-to-customer rate | part ÷ eligible base × 100 | base 0 → N/A; caller states cohort and window |
| Cost per lead, revenue per session | spend ÷ leads; revenue ÷ sessions | not shown: spend and revenue aren't tracked |
| Content age | today − last meaningful content update (days) | no date → N/A |
| Orphan rate | sitemap pages (not /) with 0 links from other indexable pages ÷ sitemap pages returning 200 × 100 | |
| Valid sitemap rate | sitemap URLs that are 200, not redirected, indexable, self-canonical, not private ÷ sitemap URLs × 100 | |
| Broken link rate | internal link occurrences to 4xx/5xx ÷ internal link occurrences × 100 (unique destinations reported separately) | |
| Schema validity rate | indexable pages whose JSON-LD parses with no errors ÷ indexable pages with JSON-LD × 100 (warnings separate) | |
| Indexable coverage | indexed ÷ pages with known index status × 100 | unknown status excluded, not counted as unindexed (needs Search Console) |
| Redirect chain rate | redirecting URLs needing > 1 hop ÷ redirecting URLs × 100 | none → N/A |
| AI mention / citation / support / cited-page coverage | sampled observations only (see below) | 0 observations → N/A |
| Opportunity priority (planning heuristic) | 0.25·B + 0.20·D + 0.20·O + 0.15·V + 0.20·Q (inputs 0–100) | any missing input → incomplete (null), never filled with 100 |
| Effort-adjusted priority | S ÷ (max(E,1) ÷ 10), E = 1–10 | |
| Release backoff | min(dmax, d0 × 2ⁿ) ± jitter; d0 3 s, dmax 30 s, max 6 min | |

There is no combined "SEO score". Technical health, traffic, AI observations and releases are separate panels.

## Traffic attribution (first-party)

- Unit: session (`site_events.session_id`). A session's channel comes from its first event: paid (utm_medium cpc/paid/…), email, AI assistant (chatgpt.com, perplexity.ai, copilot.microsoft.com, gemini.google.com, claude.ai, …, or `utm_source=chatgpt.com`), organic search (Google, Bing, DuckDuckGo, Yahoo, Ecosia, Yandex, Baidu, Brave, Startpage, Qwant), social, other websites, direct/unknown.
- Enquiry session: at least one of lead_submitted, intake_submitted, call_booked, assistant_lead, proposal_accepted, audit_requested, affiliate_signup. A session counts once however many events it has.
- Contact click: whatsapp_click, phone_click, email_click (reported separately).
- Periods are whole UTC days; the comparison is the same number of days immediately before.
- AI-assistant referrals are a floor: many assistants don't pass a referrer.

## Data sources

| Source | Status (27 Oct 2026) | What's needed |
|---|---|---|
| Google Search Console | Ownership meta tag live; search data **not connected** | Google Cloud service account added as a user on the property; key stored as a server secret; then a sync job. AI Overviews/AI Mode traffic is inside the normal "Web" performance data. |
| Bing Webmaster Tools | **Not verified** (no msvalidate tag) | Add/import the site in Bing, set `VITE_BING_SITE_VERIFICATION`; API key server-side for data |
| IndexNow | Key file live; owner-triggered submission in /dashboard | Submit only after real published changes |
| GA4 | Not installed (not needed for the figures here; would need a consent banner) | — |
| Site analytics (`site_events`) | Recording | — |
| AI platforms | No publisher API with citation/impression data | Manual observations in the control room |

Search Console and Bing figures are never shown as 0; they're "Not connected".

## Crawlers

Policy (`src/routes/robots[.]txt.ts`): public pages open to all; `/dashboard`, `/portal`, `/api/` disallowed for everyone (also protected by sign-in). OAI-SearchBot (ChatGPT search), Googlebot, Bingbot, PerplexityBot and other search/answer crawlers are allowed. Training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot, Applebot-Extended) are **allowed by default — owner decision**; set `BLOCK_AI_TRAINING = true` to block training without affecting search. ChatGPT-User is user-initiated; OpenAI says robots.txt may not apply to it. OpenAI also asks sites to allow its published IP ranges; the site has no IP blocking of its own (Lovable/Cloudflare hosting), so that can't be tested here. The control room's Crawlers panel evaluates the served robots.txt per crawler and can request pages with each crawler's published user agent (app behaviour only, not IP-level firewall behaviour).

Google states there are no extra requirements, special schema or `llms.txt` needed for AI Overviews/AI Mode. The existing `/llms.txt` is kept as an optional summary; nothing depends on it.

## Release verification (mandatory before saying a deploy is live)

1. Push the commit to `main`; wait until Lovable lists that commit's build as **completed** (`list_edits` status, or the editor). A push or a build is not a deployment.
2. Publish (Lovable `deploy_project` or the Publish button). It returns a deployment id immediately with status "pending".
3. Control room → Search & releases → Releases → **Verify live** with the published commit (pre-filled with the commit the control room page itself was built from).
   - Phase 1 polls `/api/site-config-status` with bounded backoff until the expected commit answers (old instances during rollout are recorded, not counted).
   - Phase 2 needs 12 consecutive responses on that commit. Any response from another build inside the window → `verification_failed` ("instances disagree").
   - Smoke tests (mandatory): homepage, login, account, contact, booking, a service page, blog, Lab, Explore, control room signed-out (noindex), unknown route 404, sitemap, robots.txt, POST-only API 405 — real HTTP codes via `/api/http-check`; every published SEO override's title in the server HTML; every live redirect's code and Location; staff APIs 401 signed out; private tables (leads, activity log, releases, observations, drafts) return nothing to visitors; JSON-LD on /, a service page and /blog parses with no errors.
4. The result is saved in `site_deployment_checks` and the activity log. The database refuses a `verified_live` record with fewer than 3 samples, any mismatch, an unknown commit or a failed mandatory smoke test, and records can't be edited afterwards.

States: queued, building, build_failed, awaiting_publish, publishing, verifying, verified_live, verification_failed, rollback_pending, rolled_back. The app can observe verifying → verified_live / verification_failed; build/publish states come from Lovable and are recorded as entered.

**Rollback:** restore the previous version in Lovable (project history), publish it, then run Verify live with that version's commit and choose the release it replaces ("Verifies a rollback of"). Don't roll back just because an optional integration is disconnected.

## Owner decisions and open items

See `docs/search/intent-and-claims.md`.
