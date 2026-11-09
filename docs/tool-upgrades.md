# Tool upgrades (Nov 2026)

- **AI receptionist: "Try my business"** — visitors type their own name, hours, services (one per line, "Service - price")
  and rules, then chat with their own receptionist. Details stay in their browser (`efy_rx_mine`) and are sent only with
  each demo message (`business: "custom"`, validated by `customBusinessSchema`). The prompt marks the details as facts,
  not instructions. After a short chat a lead form offers to set it up for real.
- **Website audit** — every audit is remembered in the browser (`lib/audit-history.ts`); re-checking the same site shows
  the change since last time and a score trend. "Compare with a competitor" audits another homepage and shows who leads
  on each area. "Re-check after changes" reruns the audit in one tap.
- **Email sequence** — three views (emails, WhatsApp version, phone inbox preview), copy per email, test send via your
  email app, and CSV / text downloads for importing into email tools (`lib/email-tools.ts`). The WhatsApp version is
  built without AI from the email itself, so the meaning never changes.
- **Prototype builder** — every build and refinement in a visit is kept as a version (v1, v2…) the visitor can switch back to.
- **90-day goal planner** — the plan and ticks are saved in the browser with a progress bar and "Continue my plan" on return;
  "Add the 12 weeks to my calendar" downloads an .ics with one all-day event per week plus milestones (`lib/goal-calendar.ts`).
- **ROI calculator** — Cautious / Expected / Ambitious scenarios (scaled from the default assumptions, clearly inputs, not
  promises), a shareable link (`?roi=…`, numbers only) and Save as PDF (`lib/roi-share.ts`).
- **Proposal** — yearly price shown where published, "Compare with the other plans" table from `pricing-data`, and a
  30-day validity date. No online payment (no payment provider is connected).

Tests: `tests/tools/logic.spec.ts`.

## Content pages
- **Knowledge base articles** — "Listen to this article" (browser voice, visitor's language, `speakLong` in `lib/use-voice.ts`)
  and a "Put this into practice" box linking each topic to its matching free tool.
- **Inspiration examples** — "Want something like this?" opens the prototype builder with an *original* idea in the same
  style (kind, mood, industry). It never asks for a copy of the example.
- **Tools page** — live usage counters and the showcase strip.
