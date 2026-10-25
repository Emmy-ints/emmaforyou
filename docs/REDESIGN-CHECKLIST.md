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

Content flagged for the owner (unchanged): `/testimonials` generates 520 reviews in code; homepage "500+" figures and partner badges; countdown spots are hard-coded.
