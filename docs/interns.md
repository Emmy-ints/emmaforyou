# Interns & emerging talent

Admin-managed intern profiles with a public directory, profile pages and a homepage section.
Interns never log in and never receive a role, permission or account from a profile.

## Where things are

| Piece | Location |
|---|---|
| Database | `supabase/migrations/20261102010000_interns.sql` |
| Public read model | view `interns_public` (and `interns_public_slugs` for renamed URLs) |
| Server loaders | `src/lib/interns-server.ts` (publishable key, REST, view only) |
| Shared vocabulary | `src/lib/interns.ts` (`DESIGNATION`, badge classes, types) |
| Directory | `src/routes/interns.index.tsx` |
| Profile page | `src/routes/interns.$slug.tsx` → `src/components/interns/InternProfileView.tsx` |
| Homepage | `src/components/home/InternsSection.tsx` inside `<Flag id="home-interns">` |
| Admin | control room → **Interns** (`src/components/site-admin/interns.tsx`) |
| AI writer | `POST /api/intern-profile` → `src/lib/ai/intern-handler.ts` |
| Sitemap | `src/routes/sitemap[.]xml.ts` (published, indexable profiles only) |

## Rules the database enforces

- Only `site_can('interns.manage')` (admins) can read or write `interns`, `intern_private`, events and history.
- Slugs are generated from the name, made unique (`-2`, `-3`…), and old slugs 301 to the new one.
- Designation follows status: pending/active → **INTERN**, promoted → **TEAM MEMBER**, completed → **ALUMNI**. Archived keeps the last designation.
- Publishing needs a name, a specialty, a profile introduction (≥ 60 characters) and either the admin's short bio (≥ 40 characters) or a substantial profile biography (≥ 300 characters), so thin AI-only pages can't go live. A pending draft becomes active when published.
- A completed internship stays public only if "approved alumni profile" is ticked.
- Archiving unpublishes and removes the homepage spot. Restoring does not republish.
- Every create, edit, publish, unpublish, feature, promote, complete, archive, restore and delete is logged in `intern_events` with the admin's email. Designation changes are also stored in `intern_designation_history`.
- Photos live in the public `intern-photos` bucket; only admins can upload or delete. The editor crops them square and converts to WebP (max 480 px).

## What the public can see

Cards and profile pages use a phone-style profile layout: round photo, display name, `@username` (as supplied, e.g. their Fiverr handle), badge, headline, location and languages. Photos can be an uploaded file or the person's own hosted photo link; links are hot-linked with `referrerPolicy="no-referrer"` and fall back to initials if they stop loading.


Only the columns in `interns_public`. Location shows only when "approved to show publicly" is ticked. Portfolio items and external links (e.g. Fiverr) show only when individually approved. Emails, notes and lifecycle reasons are in `intern_private`, which the public key cannot read.

## AI profiles

The admin's facts (never private fields, and location only when approved) are sent to the AI. The server removes any sentence or list item that adds a number, a capitalised tool/company or a credential, employment, experience or results claim that isn't in the admin's input, and returns the removed sentences so the admin can see them. Nothing is saved until the admin presses Save; publishing is a separate step.

## SEO

Each published profile has its own title and description (editable; generated from the profile otherwise), a canonical URL, Open Graph image (the photo) and alt text, a breadcrumb and a `ProfilePage`/`Person` JSON-LD with `affiliation` (not `worksFor`, because interns aren't employees). "Allow search engines to index" off → `noindex` and left out of the sitemap. `/interns` is `noindex` until at least one profile is public.

## Languages and freelance profiles

- Languages are rows in `intern_languages` (language + optional details such as "Native"), freelance/portfolio profiles are rows in `intern_links` (platform, URL, button label, show publicly, order). Both are admin-only (RLS `interns.manage`).
- The editor saves both in one call, `intern_save_contacts(intern, languages, links)` (security invoker, so RLS applies; all-or-nothing). Triggers copy them onto `interns.languages` / `interns.external_links` for filters, cards and the AI — don't write those two columns directly.
- URLs are validated in the database by `intern_link_valid(platform, url)` (https only, on the platform's own site for known platforms, never an email address) and in the editor by `linkProblem()` in `src/lib/interns.ts` (same rules). Add a platform in both places (`PLATFORMS` and the SQL function / check constraint).
- Public pages read `interns_public.language_details` and `freelance_links` (approved only). Profile pages show every language as a tag, a "Find me online" section with one button per approved profile, and "Hire or Contact This Specialist" (first approved profile); the EmmaForYou contact option stays as a secondary choice. External links open in a new tab with `rel="noopener noreferrer nofollow"`.
- The AI writer gets the language list and the platform names (never the URLs). The server strips any URL, email or web address from AI text and adds a plain sentence for any supplied language the AI left out.
