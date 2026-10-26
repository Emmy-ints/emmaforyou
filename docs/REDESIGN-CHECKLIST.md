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

