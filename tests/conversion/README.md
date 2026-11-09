# Conversion tests

- `logic.spec.ts` (36 checks): Calendly availability parsing (notice, full slots, non-Calendly links, sorting, 7-day
  window, visitor timezone, today/tomorrow), every Ask Emma answer combination (plans only from `pricing-data`, real
  links, honest over-budget wording, hot/warm/cool), WhatsApp number normalisation, follow-up messages and timing,
  and industry landing data (real portfolio projects, real services, one fix per problem, no numbers or promises).
  `esbuild tests/conversion/logic.spec.ts --bundle --platform=node --alias:@=./src --loader:.webp=file | node`
- Browser workflow tests run in the session harness (`convtests.mjs`, 42 checks): industry page desktop + 390 px,
  call times with/without Calendly, hiding the outcome claim, builder prefill, Ask Emma at desktop + 390 px (saving a
  qualified lead, profile sent to the AI), and the dashboard follow-up board (due/waiting/done, WhatsApp link, saving
  progress, outcomes).
