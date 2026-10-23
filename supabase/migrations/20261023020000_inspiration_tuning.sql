-- Discovery settings corrected after the first live runs (23 Oct 2026):
-- Framer's gallery moved to /community/gallery/; Awwwards' advertised sitemap.xml returns 404, so its public
-- /websites/ listing pages are read instead (filtered and search variants stay disallowed and are never requested).
UPDATE public.inspiration_sources SET listing_pages = '{https://www.framer.com/community/gallery/}', include_pattern = '^/community/gallery/(?!categories/)[^/]+/?$', tag_prefixes = '{/community/gallery/categories/}', method_notes = 'The public gallery lists /community/gallery/{site} pages (sites built with Framer).', last_discovery_at = NULL, next_run_at = now() WHERE id = 'framer-gallery';
UPDATE public.inspiration_sources SET method = 'listing', sitemaps = '{}', listing_pages = '{https://www.awwwards.com/websites/,https://www.awwwards.com/websites/sites_of_the_day/}', method_notes = 'The sitemap listed in robots.txt returns 404, so the public /websites/ listing pages are read for /sites/{name} entries.', last_discovery_at = NULL, next_run_at = now() WHERE id = 'awwwards';
ALTER TABLE public.inspiration_sources ALTER COLUMN max_new_per_run SET DEFAULT 20;
UPDATE public.inspiration_sources SET max_new_per_run = 20 WHERE max_new_per_run = 12;
