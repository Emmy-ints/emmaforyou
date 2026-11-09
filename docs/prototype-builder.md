# Prototype builder (website + mobile app)

Homepage section `#prototype` (`components/home/PrototypeBuilder.tsx`).

## Flow
1. The visitor picks **Website** or **Mobile app**, describes the idea, and can add a business name, brand colour and logo.
2. **Website**: they pick the pages (Home is always on, max 7) and build. The generator writes one document with
   `section[data-page]` pages, JavaScript navigation and a mobile menu.
3. **App**: "Plan my app" calls `/api/prototype-plan` (`lib/ai/prototype-plan-handler.ts`): the AI turns any request into
   3–6 screens, features and sample data (`normalisePlan` cleans it). When AI is paused the visitor gets a rule-based
   starting plan (`fallbackPlan`, templates for food, booking, shop, school, fitness, church, money, property, events,
   and a generic one). The visitor edits the plan (`components/prototype/PlanEditor.tsx`) and builds. The phone shows the
   app's splash from the plan while they edit.
4. `/api/prototype` streams the HTML (instructions in `lib/ai/prototype-prompts.ts`). The app contract: one
   `section.screen[data-screen]` per planned screen, a bottom tab bar, a router with back stack, a splash, every planned
   feature working in memory, "Demo" confirmations, and **no phone chrome**: the status bar, notch/punch-hole and home
   indicator are drawn by `components/prototype/PhoneFrame.tsx` (iPhone/Android switch) around the sandboxed iframe.
5. The `done` event carries an HMAC signature of the HTML (`lib/ai/proto-sign.ts`). Only signed HTML can be saved.

## Save, share, open on a phone
- "Save & open on my phone" (`components/prototype/SavePrototype.tsx`) asks for a name, WhatsApp or email and consent,
  then `/api/prototype-share` verifies the signature, rate-limits (6/hour per visitor) and inserts into
  `prototype_shares` (service role). The visitor gets `/p/<slug>`, a copy button and a QR code (`lib/qr.ts`, a small
  dependency-free encoder, verified with OpenCV).
- `prototype_share_alert` emails the owner (via `owner_alert_send`) with the request, contact and link. Saved
  prototypes also appear in `/dashboard` leads as "Prototype saved".
- `/p/<slug>` (`routes/p.$slug.tsx`, noindex) reads only `prototype_share_public(slug)` (no contact details; counts
  views). On a phone the prototype fills the screen under a slim bar; on desktop it sits in the phone frame with a QR
  code and Make-it-real links. Founder presence, Ask Emma, the sticky CTA and scroll-to-top stay off this page.
- The logo is stored separately (data: PNG/JPEG/WebP ≤ 200 KB) and swapped into `[data-efy-logo]` at render time.

## Make it real
`suggestPlan()` maps what was built to a **published** plan only: a custom website → Pro (`pricing-data` price);
custom app development → Enterprise (custom quote). Buttons: book a call (`/book?prototype=<slug>`), WhatsApp, save.

## Limits and safety
- Generation: 3 per visitor per hour, 60 overall (unchanged). Plans: 8/hour per visitor. Saves: 6/hour.
- Previews and shared pages render in `sandbox="allow-scripts allow-forms"` iframes with a CSP that blocks all network,
  forms and frames. Prototypes never make real payments, bookings or messages.

## Service pages
`lib/service-pricing.ts` adds "Starting from" to every service page from the plan whose feature list includes that
service (e.g. websites → Pro, social media → Starter, apps → Enterprise custom quote); other services say
"Packages from" the lowest plan. Prices are in US dollars; no currency conversion is shown (no rates on file).
