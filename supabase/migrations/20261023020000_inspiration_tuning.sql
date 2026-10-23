-- Discovery settings corrected after the first live runs (23 Oct 2026):
-- Framer's gallery moved to /community/gallery/; Awwwards' advertised sitemap.xml returns 404, so its public
-- /websites/ listing pages are read instead (filtered and search variants stay disallowed and are never requested).
UPDATE public.inspiration_sources SET listing_pages = '{https://www.framer.com/community/gallery/}', include_pattern = '^/community/gallery/(?!categories/)[^/]+/?$', tag_prefixes = '{/community/gallery/categories/}', method_notes = 'The public gallery lists /community/gallery/{site} pages (sites built with Framer).', last_discovery_at = NULL, next_run_at = now() WHERE id = 'framer-gallery';
UPDATE public.inspiration_sources SET method = 'listing', sitemaps = '{}', listing_pages = '{https://www.awwwards.com/websites/,https://www.awwwards.com/websites/sites_of_the_day/}', method_notes = 'The sitemap listed in robots.txt returns 404, so the public /websites/ listing pages are read for /sites/{name} entries.', last_discovery_at = NULL, next_run_at = now() WHERE id = 'awwwards';
ALTER TABLE public.inspiration_sources ALTER COLUMN max_new_per_run SET DEFAULT 20;
UPDATE public.inspiration_sources SET max_new_per_run = 20 WHERE max_new_per_run = 12;
-- Clearer reasons for the sources that refused us on the first run, and more link checks per run.
UPDATE public.inspiration_sources SET status_reason = 'robots.txt could not be read (the request failed), which counts as "not allowed" — nothing is collected until it can be read.' WHERE id = 'commerce-cream' AND imported_total = 0;
UPDATE public.inspiration_sources SET status_reason = 'The site refuses automated requests (HTTP 403), so nothing can be collected without permission.' WHERE id = 'milled' AND imported_total = 0;
UPDATE public.inspiration_sources SET status = 'partial', status_reason = 'The site asked us to slow down (HTTP 429). We wait and try again at the next refresh.', last_discovery_at = NULL, next_run_at = now() + interval '6 hours' WHERE id = 'siteinspire' AND imported_total = 0;
UPDATE public.inspiration_sources SET status = 'not_started', status_reason = 'Example pages found and waiting to be read.' WHERE id IN ('awwwards', 'framer-gallery') AND imported_total = 0;
UPDATE public.inspiration_settings SET verify_per_tick = 12 WHERE id = 1;
