# Public showcase ("Made on EmmaForYou")

Visitors' results from the free tools are shown publicly at `/showcase`, on the homepage (flag `home-showcase`) and,
filtered by industry, on each `/niche/$slug` page.

## How an item gets there
1. A tool returns a **signed** result. Prototypes use `lib/ai/proto-sign.ts`; audits, email sequences, 90-day plans and
   makeovers use `lib/ai/content-sign.ts` (HMAC over `kind|stableStringify(content)`, server secret only).
2. The tool shows a checkbox (`components/showcase/ShowcaseOptIn.tsx`). It is ticked by default for prototypes,
   emails and plans, and unticked for audits and makeovers (those are about a real, existing website). The choice is
   remembered per tool in the browser.
3. If ticked, the browser posts to `POST /api/showcase` (`lib/ai/showcase-handler.ts`). The server re-checks the
   signature, rate-limits (20 per visitor, 500 site-wide per window), builds a privacy-safe item and inserts it.
   **There is no approval step**: the item is live immediately.
   - Prototypes wait 3.5 s after the build so a preview that reports a script error is auto-repaired first.
   - Goal plans are only published when the AI wrote them (not the standard fallback framework).

## Privacy rules (enforced on the server)
- Emails, phone numbers and links are removed from all text (`scrub`).
- The business name is removed unless the visitor ticks "Show my business name".
- An audit only shows the website address if the visitor ticks "It's my own website".
- Blocklisted words (`unsuitable`) are refused.
- Detail pages are `noindex`.

## Removing and hiding
- The visitor gets a private remove token stored in their browser (`efy_showcase_mine`). "Your items" on `/showcase`
  and the line under each result let them remove it (`DELETE /api/showcase`).
- Staff with `content.draft` can hide or show any item from the dashboard panel "Public showcase"
  (`components/dashboard/ShowcaseModeration.tsx`). Hidden items disappear from every public list at once.

## Counters
`showcase_stats()` counts real tool runs from `prototype_generations` (including internal tests) and shows
"Counted live from our tools since …". Never replace these with invented numbers.

## Tests
- `tests/showcase/logic.spec.ts`: industry detection, scrubbing, titles, schema, signatures.
