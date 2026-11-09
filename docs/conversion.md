# Conversion features (Nov 2026)

## Next available call times
- `GET /api/call-times` (`lib/call-times-server.ts`) reads Emmanuel's **real** Calendly availability: `/users/me` →
  the event type whose link matches `CALENDLY_URL` → `/event_type_available_times` for the next 7 days. It returns
  the next 3 open times (≥ 1 hour away) with Calendly's own booking link for each. Cached 5 minutes. No contact data.
- Needs the server secret **`CALENDLY_TOKEN`** (a Calendly personal access token: Calendly → Integrations → API &
  Webhooks → Personal access tokens). Without it the endpoint answers `available: false` and every
  `NextCallTimes` shows its fallback (or nothing). The site never guesses availability.
- `components/tools/NextCallTimes.tsx` (one request per page view, visitor's timezone, "Today/Tomorrow") is on `/book`,
  the prototype "Make it real" panel, industry pages, Ask Emma's recommendation and every `LeadCapture` thank-you.

## Industry landing pages (`/niche/$slug`)
- Content: `lib/niches.ts` (hero, problems, services) + `lib/industry-landing.ts` (one fix per problem, free prototype
  idea, real client projects, main service for "starting from", Ask Emma preset, FAQs, WhatsApp text).
- Results shown are **only** from `portfolio-data` (`projectsFor`). The older per-industry outcome line
  (`niche.result`) is registered as claim `niche-results` and can be labelled or hidden in the control room.
- The prototype button links to `/?proto_kind=…&proto_idea=…#prototype`; the homepage builder fills itself in.
- Built for ad and social traffic: one industry, clear next steps (prototype, WhatsApp, call times, recommendation).

## Ask Emma qualifies leads
- "Get a recommendation in 4 quick taps": business, goal, budget, timing (`lib/qualify.ts`). `recommend()` picks the
  published plan that includes the goal (never an invented price), says honestly when it's above the stated budget,
  links the industry page + a free tool + the service, and grades the lead hot / warm / cool.
- Next: real call times, "Send this to Emmanuel on WhatsApp" (answers prefilled), or leave name + WhatsApp/email with
  consent → `tool_requests` (`tool = "Ask Emma (qualified)"`, summary lines `Business:`, `Goal:`, `Budget:`,
  `Timing:`, `Suggested:`, `Lead:`), which emails the owner via `notify_new_lead`.
- The answers are sent to the AI as `profile`, so Emma doesn't ask again. Industry pages open Ask Emma with
  `efy-open-ask` detail `{ qualify: true, business }`.

## WhatsApp follow-up after tool use
- The site can't send WhatsApp messages on its own (that needs a WhatsApp Business API account). Instead:
  - **Visitors**: after any `LeadCapture` form (goal planner, contract check, makeover, solutions, lab…) they can send
    their results to Emmanuel on WhatsApp in one tap and pick a call time. Tools with their own forms already had
    a results-on-WhatsApp link.
  - **Owner**: `/dashboard` → **WhatsApp follow-ups** (`components/dashboard/FollowUps.tsx`, `lib/followups.ts`).
    Every lead with a WhatsApp number (or email) gets three prepared messages: thank-you + next step (now), a helpful
    nudge (2 days later), a last check-in (5 days after that). One tap opens WhatsApp with the message (Nigerian
    0-numbers become +234); mark it sent and the next step returns when due. Outcomes: replied, booked, won, lost.
  - Progress is stored in `lead_followups` (staff with `enquiries.read`). Messages use only what the lead gave us.
