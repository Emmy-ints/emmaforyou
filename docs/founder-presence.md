# Founder portrait across the site

Emmanuel's real photo (`public/images/emmanuel.webp`) is part of the brand on every public page. Only plain
crops of it are used — never retouched, restyled, generated or stock:

| Asset | Used in |
|---|---|
| `emmanuel-face-96.webp` | Logo badge (`components/brand/Wordmark.tsx`), founder bylines |
| `emmanuel-face-256.webp` | Homepage hero (`components/home/HeroFounder.tsx`), site-wide signature chip |
| `emmanuel-portrait-480.webp` | About hero, site-wide faded "watermark" portrait |
| `emmanuel.webp` | `FounderCard` (Contact, Book, service pages, Solution Finder), About founder section |

## How every page gets it

1. **Logo** — the portrait badge on the "E" tile appears wherever the wordmark does.
2. **Hand-placed heroes** — homepage (portrait docked to the Growth OS demo) and About (arched portrait).
   Contact and Book already show `FounderCard` near the top. The full-screen 3D Service world (`/explore`)
   has its own top bar, so its brand mark carries the same face badge as the logo. These are all marked
   `data-founder-presence`, and the global layer stays out of their way.
3. **Everything else** — `components/future/FounderPresence.tsx`, mounted once in `__root.tsx`. On each route it:
   - finds the hero: the largest block around the page's `<h1>` that is still about one screen tall;
   - scans the hero (full content width, first screen) for a free spot, measuring every text node, link,
     button, input, image, canvas and card; a spot that touches any of them — or straddles a card's edge — is
     rejected; spots with more breathing room win;
   - shows a **signature** chip (portrait + name + caption), or on dark heroes on wide screens a faded arched
     **watermark** portrait; if no spot is free (most phones), a slim **byline** row is inserted directly
     after the hero (or after the intro paragraph on app-style layouts such as Community), aligned with the
     hero's text column. In a viewport-locked layout (a fixed-height, clipped container) a byline would push
     controls out of view, so it moves to just after that container; when even that is impossible, a small
     ring-only **badge** is placed in the smallest free spot;
   - measures with its own byline hidden, so it doesn't flip between a byline and a chip;
   - re-checks when the page changes (data loads, reveals, scrolling) by hit-testing the points under the
     portrait, and moves it if anything ever ends up underneath.
   It never moves, wraps, hides or restyles existing elements. Private areas (dashboard, account, portal,
   login, community inbox/messages/settings/…) are skipped — the logo badge is enough there.

New pages, dynamic routes and pages added later inherit this automatically: give the page a `<main>` with an
`<h1>` (every page already does) and it will be handled.

## Page types and captions (`lib/founder-presence.ts`)

`PAGE_TYPES` maps routes to a type, a default placement and a caption. Captions only reuse wording the owner
already approved on the site ("reads every brief personally", "you'll speak with me directly", "Founder &
CEO"). Blog, guides and tools never imply Emmanuel wrote the article: they say "Founder of EmmaForYou".

## Owner controls

Control room → **Content → Founder portrait** (permission `content.draft`, publish `content.publish`):
global on/off, size and placement; per page type; per page or branch (`/solutions/websites/*`). Drafts can be
previewed in your own browser ("Preview on site") before publishing; every publish is versioned with rollback.
Stored as site settings `founder`, `founder:<type>`, `founder:/path`, validated by `site_setting_valid`
(migration `20261107010000_founder_presence_settings.sql`).
