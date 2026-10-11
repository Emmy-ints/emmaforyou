# Architecture rules

- Brand: midnight ink (#0b0d24) foundation, electric violet (#6d5bff) primary accent, signal cyan (#3dd6f5) only for live-data moments; Poppins headings, Inter body. Dark bands use `.hero-ink`/`.band-ink`, which redefine colour tokens in scope. The homepage hero is the `GrowthOS` product demo (clearly labelled sample data); avoid decorative 3D.
- Use the TanStack streaming server route for prototype generation with server-only AI helpers; raw streaming cannot cross the server-function DTO boundary.
- Preview generated documents in opaque-origin sandboxed iframes with a restrictive CSP; untrusted prototype scripts must not access the host or network.
- Keep prototype AI access-denial/credit-pause state in a private service-only table; terminal failures must remain paused across worker restarts.
- Pass prototype intake context through an explicit form prop; preserve existing intake fields and submission flow.- Prototype generation is limited per visitor (hashed IP + user agent, 3/hour) and globally (60/hour) via the service-only `prototype_generations` table; credit/access failures pause generation for 30 minutes, then retry.
- Analytics are first-party: call `track()` from `src/lib/analytics.ts` for conversions; page views and WhatsApp/phone/email clicks are recorded automatically from `__root.tsx`. Events land in `site_events` (insert-only for visitors, admin-read).
- `/dashboard` is the owner's private analytics and leads dashboard (Supabase auth + `admin` role). Never put simulated or randomly generated "live" activity on public pages.
