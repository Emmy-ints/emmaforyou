# eBook publishing & book marketing (Oct 2026)

A new service line and a set of free book tools, added to the existing site (no redesign).

## Where it appears
- Homepage: service card (`ServicesSection`, kind `book`), `PublishingSection` (workflow, labelled concept showcase, tools, services, FAQs, CTAs; flag `home-publishing`), tools hub tab "eBooks & publishing", homepage FAQ entry, explorer family "eBook publishing & book marketing".
- Service pages: `/services/ebook-publishing` (hub service) and `/expertise/{ebook-formatting-conversion,book-cover-design,book-mockups-graphics,book-metadata-positioning,book-launch-strategy,book-marketing}` — data in `src/lib/publishing-data.ts`, rendered by `ExpertiseTemplate` (publishing pages show the tools block instead of unrelated client work).
- `/publishing` hub, `/publishing/enquiry`, the 8 tools under `/publishing/*`, author workspace `/account/books` (noindex; linked from /account).
- Portfolio `#publishing-concepts`: fictional titles rendered live by the cover/mockup engine, labelled "not client work".
- Knowledge base (category Publishing, 3 guides in `knowledge-publishing.ts`), one blog post, /faq category, nav (Resources → Free tools) and footer links, ⌘K index, sitemap.

## Tools and how they work
| Tool | Engine | AI | Account needed for |
|---|---|---|---|
| eBook Creator | `lib/books/manuscript.ts`, `import-docx.ts`, `layout.ts`, `export-pdf.ts` (embedded TrueType, ToUnicode, outlines, links), `export-epub.ts` (EPUB 3 + NCX), `export-docx.ts` | none | download, save |
| Cover Designer | `lib/books/cover.ts` (10 canvas layouts, eBook 1600×2560, print wrap with spine/bleed from `specs.ts`) | concepts via `/api/book-ai` (`cover_concepts`), optional artwork via `/api/book-art` (OpenAI images, signed-in only; `OPENAI_IMAGE_MODEL` if set, otherwise the newest gpt-image model the key can use); falls back to labelled template suggestions | download, save, AI artwork |
| Mockups | `lib/books/mockup.ts` (11 formats) + ZIP | none | download, save |
| Marketing assistant | `lib/books/listing.ts` lint | `/api/book-ai` (`marketing`), server strips banned claims/links | save, .txt download |
| Manuscript analyzer | `lib/books/analyze.ts` (formulas shown) | `/api/book-ai` (`analyze`), notes kept only if the quote is found in the text | save |
| Launch planner | `lib/books/launch.ts` (+ ICS/CSV) | optional ideas (`launch_ideas`) | save, downloads |
| Royalty estimator | `lib/books/royalty.ts` (KDP presets, checked 28 Oct 2026) | none | save |
| Readiness checker | `lib/books/readiness.ts` (EPUB/PDF/DOCX inspection; checks labelled tool / platform / person) | none | save |

Files are generated in the browser; manuscripts are never uploaded to storage or public URLs. The download sign-in gate is a product decision, not a security boundary (the files contain only the user's own content). Fonts: `public/fonts/book` (OFL; modified Lora renamed "EFY Book Serif").

## Data and security
Migration `supabase/migrations/20261028010000_publishing.sql`:
- `book_projects` — owner-only RLS (`user_id = auth.uid()`), owner can't be changed, 200 per user, data < 2.5 MB.
- `publishing_enquiries` — anyone inserts (validated values, 5/email/day), `site_can('enquiries.read')` reads; fires `notify_new_lead` ("Publishing enquiry"); shown in control room → Enquiries.
- `book_tool_usage` — outcome log (tool, action, ok, ms, short error; no content), insert-only for visitors, staff read.
- `book_admin_summary()` — counts and errors only (control room → AI & integrations → Book publishing tools).
- AI limits per visitor/hour (logged in `prototype_generations`): book_ai_cover 8, book_ai_marketing 6, book_ai_analyze 5, book_ai_launch 6, book_art 4 (global caps 300/300/200/300/60).
- RLS isolation verified 28 Oct 2026 (14 checks, rolled back): owner sees own, others can't read/update/delete/insert-as, owner can't move a project, anon can't read projects/enquiries, non-staff can't call the summary.

Analytics events: book_tool_started, book_preview_generated, book_registration_completed, book_export_attempted/completed/failed, book_project_saved, publishing_enquiry_submitted (counted as an enquiry in Search & releases → Traffic).

## Honesty rules
No publishing-house, distribution, sales or ranking claims; no client results on publishing pages; concepts labelled; AI outputs labelled and editable; platform figures cite KDP pages with the check date (`specs.ts`). Unverified: KDP's barcode box size (guides say "check KDP template") and the 70% price band (users told to check KDP).
