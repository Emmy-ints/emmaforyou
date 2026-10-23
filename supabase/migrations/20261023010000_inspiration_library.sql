-- Inspiration library: sources, discovered examples, a retryable crawl queue, import runs, private
-- saved collections, admin controls and a scheduled refresh. All crawling runs server-side in
-- /api/inspiration-tick (service role), which honours robots.txt, per-source limits and crawl delays.

CREATE TABLE IF NOT EXISTS public.inspiration_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  tick_secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  verify_per_tick integer NOT NULL DEFAULT 6 CHECK (verify_per_tick BETWEEN 0 AND 50),
  reverify_days integer NOT NULL DEFAULT 14 CHECK (reverify_days BETWEEN 1 AND 365),
  last_tick_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.inspiration_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.inspiration_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inspiration_settings FROM anon, authenticated;
GRANT ALL ON public.inspiration_settings TO service_role;
GRANT SELECT (id, enabled, verify_per_tick, reverify_days, last_tick_at, updated_at) ON public.inspiration_settings TO authenticated;
GRANT UPDATE (enabled, verify_per_tick, reverify_days) ON public.inspiration_settings TO authenticated;
DROP POLICY IF EXISTS insp_settings_admin ON public.inspiration_settings;
CREATE POLICY insp_settings_admin ON public.inspiration_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.inspiration_sources (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{2,40}$'),
  name text NOT NULL,
  home_url text NOT NULL,
  category text NOT NULL CHECK (category IN ('ecommerce', 'email', 'website', 'ui', 'design')),
  default_kind text NOT NULL,
  method text NOT NULL CHECK (method IN ('sitemap', 'listing', 'manual')),
  method_notes text NOT NULL DEFAULT '',
  -- Discovery config: sitemap URLs (indexes are followed), which child sitemaps to read, listing pages,
  -- and the URL patterns that identify individual examples. Editable by admins.
  sitemaps text[] NOT NULL DEFAULT '{}',
  sitemap_pick text,
  listing_pages text[] NOT NULL DEFAULT '{}',
  include_pattern text,
  exclude_pattern text,
  tag_prefixes text[] NOT NULL DEFAULT '{}',
  platform text,
  theme text CHECK (theme IN ('light', 'dark')),
  enabled boolean NOT NULL DEFAULT true,
  use_source_images boolean NOT NULL DEFAULT true,
  max_new_per_run integer NOT NULL DEFAULT 20 CHECK (max_new_per_run BETWEEN 0 AND 100),
  max_sitemaps_per_run integer NOT NULL DEFAULT 2 CHECK (max_sitemaps_per_run BETWEEN 0 AND 20),
  refresh_hours integer NOT NULL DEFAULT 24 CHECK (refresh_hours BETWEEN 1 AND 720),
  min_delay_ms integer NOT NULL DEFAULT 1500 CHECK (min_delay_ms BETWEEN 500 AND 60000),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'working', 'partial', 'blocked', 'disabled')),
  status_reason text,
  restriction text,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_discovery_at timestamptz,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  discovered_total integer NOT NULL DEFAULT 0,
  imported_total integer NOT NULL DEFAULT 0,
  sort smallint NOT NULL DEFAULT 100,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inspiration_sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inspiration_sources FROM anon, authenticated;
GRANT ALL ON public.inspiration_sources TO service_role;
-- Source configuration is not secret (patterns, notes, counts), so everyone may read it; only admins may change it.
GRANT SELECT ON public.inspiration_sources TO anon, authenticated;
GRANT UPDATE (enabled, use_source_images, max_new_per_run, max_sitemaps_per_run, refresh_hours, min_delay_ms, sitemaps, sitemap_pick, listing_pages, include_pattern, exclude_pattern, tag_prefixes, method_notes, next_run_at, updated_at) ON public.inspiration_sources TO authenticated;
DROP POLICY IF EXISTS insp_sources_read ON public.inspiration_sources;
CREATE POLICY insp_sources_read ON public.inspiration_sources FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS insp_sources_admin ON public.inspiration_sources;
CREATE POLICY insp_sources_admin ON public.inspiration_sources FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- array_to_string isn't marked immutable, so generated columns use this wrapper.
CREATE OR REPLACE FUNCTION public.insp_join(a text[]) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT coalesce(array_to_string(a, ' '), '') $$;

CREATE TABLE IF NOT EXISTS public.inspiration_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL REFERENCES public.inspiration_sources(id) ON DELETE CASCADE,
  listing_url text NOT NULL UNIQUE CHECK (listing_url ~ '^https://' AND char_length(listing_url) <= 600),
  original_url text CHECK (original_url IS NULL OR (original_url ~ '^https?://' AND char_length(original_url) <= 600)),
  canonical_key text NOT NULL UNIQUE CHECK (char_length(canonical_key) <= 600),
  also_listed_on text[] NOT NULL DEFAULT '{}',
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  brand text CHECK (brand IS NULL OR char_length(brand) <= 120),
  description text CHECK (description IS NULL OR char_length(description) <= 600),
  kind text NOT NULL CHECK (kind IN ('ecommerce', 'email', 'landing_page', 'website', 'saas', 'dashboard', 'mobile_app', 'component', 'portfolio', 'design_concept')),
  tags text[] NOT NULL DEFAULT '{}',
  industries text[] NOT NULL DEFAULT '{}',
  styles text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  theme text CHECK (theme IN ('light', 'dark')),
  platform text CHECK (platform IS NULL OR char_length(platform) <= 40),
  image_url text CHECK (image_url IS NULL OR (image_url ~ '^https://' AND char_length(image_url) <= 800)),
  image_status text NOT NULL DEFAULT 'unknown' CHECK (image_status IN ('unknown', 'ok', 'broken', 'none')),
  attribution text,
  source_published_at timestamptz,
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
  link_status text NOT NULL DEFAULT 'unknown' CHECK (link_status IN ('unknown', 'ok', 'redirected', 'broken', 'blocked')),
  link_checked_at timestamptz,
  manual boolean NOT NULL DEFAULT false,
  edited_by_admin boolean NOT NULL DEFAULT false,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  search tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(brand, '')), 'A') ||
    setweight(to_tsvector('simple', public.insp_join(tags) || ' ' || public.insp_join(industries) || ' ' || public.insp_join(styles) || ' ' || coalesce(platform, '') || ' ' || kind), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED
);
CREATE INDEX IF NOT EXISTS insp_ex_search_idx ON public.inspiration_examples USING gin (search);
CREATE INDEX IF NOT EXISTS insp_ex_tags_idx ON public.inspiration_examples USING gin (tags);
CREATE INDEX IF NOT EXISTS insp_ex_ind_idx ON public.inspiration_examples USING gin (industries);
CREATE INDEX IF NOT EXISTS insp_ex_style_idx ON public.inspiration_examples USING gin (styles);
CREATE INDEX IF NOT EXISTS insp_ex_colors_idx ON public.inspiration_examples USING gin (colors);
CREATE INDEX IF NOT EXISTS insp_ex_list_idx ON public.inspiration_examples (status, discovered_at DESC);
CREATE INDEX IF NOT EXISTS insp_ex_kind_idx ON public.inspiration_examples (kind, status, discovered_at DESC);
CREATE INDEX IF NOT EXISTS insp_ex_source_idx ON public.inspiration_examples (source_id, status, discovered_at DESC);
CREATE INDEX IF NOT EXISTS insp_ex_title_idx ON public.inspiration_examples (status, lower(title));
CREATE INDEX IF NOT EXISTS insp_ex_verify_idx ON public.inspiration_examples (link_checked_at NULLS FIRST);
ALTER TABLE public.inspiration_examples ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inspiration_examples FROM anon, authenticated;
GRANT ALL ON public.inspiration_examples TO service_role;
GRANT SELECT ON public.inspiration_examples TO anon, authenticated;
GRANT UPDATE (title, brand, description, kind, tags, industries, styles, colors, theme, platform, image_url, original_url, status, edited_by_admin, updated_at) ON public.inspiration_examples TO authenticated;
GRANT DELETE ON public.inspiration_examples TO authenticated;
DROP POLICY IF EXISTS insp_ex_public ON public.inspiration_examples;
CREATE POLICY insp_ex_public ON public.inspiration_examples FOR SELECT TO anon, authenticated USING (status = 'visible' OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS insp_ex_admin_upd ON public.inspiration_examples;
CREATE POLICY insp_ex_admin_upd ON public.inspiration_examples FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS insp_ex_admin_del ON public.inspiration_examples;
CREATE POLICY insp_ex_admin_del ON public.inspiration_examples FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Example pages waiting to be read (from sitemaps, listing pages or a manual import).
CREATE TABLE IF NOT EXISTS public.inspiration_queue (
  url text PRIMARY KEY CHECK (url ~ '^https://' AND char_length(url) <= 600),
  source_id text NOT NULL REFERENCES public.inspiration_sources(id) ON DELETE CASCADE,
  lastmod text,
  hint jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  example_id uuid REFERENCES public.inspiration_examples(id) ON DELETE SET NULL,
  manual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS insp_q_due_idx ON public.inspiration_queue (source_id, status, next_attempt_at);
ALTER TABLE public.inspiration_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inspiration_queue FROM anon, authenticated;
GRANT ALL ON public.inspiration_queue TO service_role;
GRANT SELECT ON public.inspiration_queue TO authenticated;
DROP POLICY IF EXISTS insp_q_admin ON public.inspiration_queue;
CREATE POLICY insp_q_admin ON public.inspiration_queue FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.inspiration_runs (
  id bigserial PRIMARY KEY,
  source_id text REFERENCES public.inspiration_sources(id) ON DELETE CASCADE,
  trigger text NOT NULL DEFAULT 'cron',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  ok boolean,
  discovered integer NOT NULL DEFAULT 0,
  queued integer NOT NULL DEFAULT 0,
  imported integer NOT NULL DEFAULT 0,
  updated integer NOT NULL DEFAULT 0,
  duplicates integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  verified integer NOT NULL DEFAULT 0,
  broken integer NOT NULL DEFAULT 0,
  requests integer NOT NULL DEFAULT 0,
  notes text,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  samples jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS insp_runs_idx ON public.inspiration_runs (source_id, started_at DESC);
ALTER TABLE public.inspiration_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inspiration_runs FROM anon, authenticated;
GRANT ALL ON public.inspiration_runs TO service_role;
GRANT USAGE ON SEQUENCE public.inspiration_runs_id_seq TO service_role;
GRANT SELECT ON public.inspiration_runs TO authenticated;
DROP POLICY IF EXISTS insp_runs_admin ON public.inspiration_runs;
CREATE POLICY insp_runs_admin ON public.inspiration_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Private saved collections: only the owner can see or change their saves.
CREATE TABLE IF NOT EXISTS public.inspiration_saves (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  example_id uuid NOT NULL REFERENCES public.inspiration_examples(id) ON DELETE CASCADE,
  collection text NOT NULL DEFAULT 'Saved' CHECK (char_length(btrim(collection)) BETWEEN 1 AND 60),
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, example_id, collection)
);
CREATE INDEX IF NOT EXISTS insp_saves_user_idx ON public.inspiration_saves (user_id, created_at DESC);
ALTER TABLE public.inspiration_saves ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inspiration_saves FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspiration_saves TO authenticated;
GRANT ALL ON public.inspiration_saves TO service_role;
DROP POLICY IF EXISTS insp_saves_own ON public.inspiration_saves;
CREATE POLICY insp_saves_own ON public.inspiration_saves FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.inspiration_saves_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.inspiration_saves WHERE user_id = NEW.user_id) >= 2000 THEN RAISE EXCEPTION 'You can save up to 2,000 examples.' USING ERRCODE = 'P0001'; END IF;
  IF (SELECT count(DISTINCT collection) FROM public.inspiration_saves WHERE user_id = NEW.user_id AND collection <> NEW.collection) >= 50 THEN RAISE EXCEPTION 'You can have up to 50 collections.' USING ERRCODE = 'P0001'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS inspiration_saves_limit ON public.inspiration_saves;
CREATE TRIGGER inspiration_saves_limit BEFORE INSERT ON public.inspiration_saves FOR EACH ROW EXECUTE FUNCTION public.inspiration_saves_limit();

-- Public facet counts (visible examples only), so filters show real numbers.
CREATE OR REPLACE FUNCTION public.inspiration_facets() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.inspiration_examples WHERE status = 'visible'),
    'kinds', (SELECT coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) FROM (SELECT kind, count(*) n FROM public.inspiration_examples WHERE status = 'visible' GROUP BY kind) x),
    'sources', (SELECT coalesce(jsonb_object_agg(source_id, n), '{}'::jsonb) FROM (SELECT source_id, count(*) n FROM public.inspiration_examples WHERE status = 'visible' GROUP BY source_id) x),
    'industries', (SELECT coalesce(jsonb_object_agg(v, n), '{}'::jsonb) FROM (SELECT v, count(*) n FROM public.inspiration_examples, unnest(industries) v WHERE status = 'visible' GROUP BY v ORDER BY 2 DESC LIMIT 40) x),
    'styles', (SELECT coalesce(jsonb_object_agg(v, n), '{}'::jsonb) FROM (SELECT v, count(*) n FROM public.inspiration_examples, unnest(styles) v WHERE status = 'visible' GROUP BY v ORDER BY 2 DESC LIMIT 40) x),
    'colors', (SELECT coalesce(jsonb_object_agg(v, n), '{}'::jsonb) FROM (SELECT v, count(*) n FROM public.inspiration_examples, unnest(colors) v WHERE status = 'visible' GROUP BY v ORDER BY 2 DESC LIMIT 30) x),
    'platforms', (SELECT coalesce(jsonb_object_agg(platform, n), '{}'::jsonb) FROM (SELECT platform, count(*) n FROM public.inspiration_examples WHERE status = 'visible' AND platform IS NOT NULL GROUP BY platform) x),
    'themes', (SELECT coalesce(jsonb_object_agg(theme, n), '{}'::jsonb) FROM (SELECT theme, count(*) n FROM public.inspiration_examples WHERE status = 'visible' AND theme IS NOT NULL GROUP BY theme) x)
  )
$$;
GRANT EXECUTE ON FUNCTION public.inspiration_facets() TO anon, authenticated;

-- ------------------------------------------------------------------ scheduling
CREATE OR REPLACE FUNCTION public.inspiration_kick(p_source text DEFAULT 'cron') RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE s public.inspiration_settings; site text; rid bigint;
BEGIN
  SELECT * INTO s FROM public.inspiration_settings WHERE id = 1;
  IF s IS NULL OR NOT s.enabled THEN RETURN NULL; END IF;
  SELECT site_url INTO site FROM public.blog_settings WHERE id = 1;
  IF site IS NULL THEN RETURN NULL; END IF;
  UPDATE public.inspiration_settings SET last_tick_at = now() WHERE id = 1;
  SELECT net.http_post(url := rtrim(site, '/') || '/api/inspiration-tick', body := jsonb_build_object('source', left(p_source, 20)),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-inspiration-secret', s.tick_secret), timeout_milliseconds := 120000) INTO rid;
  RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.inspiration_kick(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.inspiration_cron_tick() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.inspiration_runs WHERE started_at < now() - interval '60 days';
  -- Only call the worker when a source is due or there is queued work / links to re-check.
  IF EXISTS (SELECT 1 FROM public.inspiration_sources WHERE enabled AND method <> 'manual' AND next_run_at <= now())
     OR EXISTS (SELECT 1 FROM public.inspiration_queue q JOIN public.inspiration_sources s ON s.id = q.source_id WHERE q.status = 'pending' AND q.next_attempt_at <= now() AND (s.enabled OR q.manual))
     OR EXISTS (SELECT 1 FROM public.inspiration_examples WHERE link_checked_at IS NULL OR link_checked_at < now() - make_interval(days => (SELECT reverify_days FROM public.inspiration_settings WHERE id = 1)))
  THEN PERFORM public.inspiration_kick('cron'); END IF;
END $$;
REVOKE ALL ON FUNCTION public.inspiration_cron_tick() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'emmaforyou-inspiration-tick';
  PERFORM cron.schedule('emmaforyou-inspiration-tick', '4,14,24,34,44,54 * * * *', 'SELECT public.inspiration_cron_tick()');
END $$;

-- ------------------------------------------------------------------ admin actions
CREATE OR REPLACE FUNCTION public.inspiration_admin(p_action text, p_source text DEFAULT NULL, p_urls text[] DEFAULT NULL, p_kind text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer := 0; u text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  IF p_action = 'run' THEN
    UPDATE public.inspiration_sources SET next_run_at = now(), state = state - 'discovery_done' WHERE (p_source IS NULL OR id = p_source) AND enabled;
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM public.inspiration_kick('admin');
  ELSIF p_action = 'retry' THEN
    UPDATE public.inspiration_queue SET status = 'pending', attempts = 0, next_attempt_at = now(), last_error = NULL, updated_at = now()
     WHERE status = 'failed' AND (p_source IS NULL OR source_id = p_source);
    GET DIAGNOSTICS n = ROW_COUNT;
    PERFORM public.inspiration_kick('admin');
  ELSIF p_action = 'import' THEN
    IF p_source IS NULL OR NOT EXISTS (SELECT 1 FROM public.inspiration_sources WHERE id = p_source) THEN RAISE EXCEPTION 'Choose a source.'; END IF;
    IF coalesce(array_length(p_urls, 1), 0) > 200 THEN RAISE EXCEPTION 'Up to 200 links at a time.'; END IF;
    FOREACH u IN ARRAY coalesce(p_urls, '{}') LOOP
      u := btrim(u);
      CONTINUE WHEN u !~ '^https://[^/\s]+\.[^/\s]+' OR char_length(u) > 600;
      INSERT INTO public.inspiration_queue (url, source_id, manual, hint, status, next_attempt_at)
      VALUES (u, p_source, true, CASE WHEN p_kind IS NOT NULL THEN jsonb_build_object('kind', p_kind) ELSE '{}'::jsonb END, 'pending', now())
      ON CONFLICT (url) DO UPDATE SET status = 'pending', attempts = 0, next_attempt_at = now(), manual = true, hint = EXCLUDED.hint, updated_at = now();
      n := n + 1;
    END LOOP;
    PERFORM public.inspiration_kick('admin');
  ELSE RAISE EXCEPTION 'Unknown action.'; END IF;
  RETURN jsonb_build_object('affected', n);
END $$;
REVOKE ALL ON FUNCTION public.inspiration_admin(text, text, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.inspiration_admin(text, text, text[], text) TO authenticated;

-- ------------------------------------------------------------------ the 19 sources
-- Discovery methods were chosen from each site's robots.txt and published sitemaps (checked 23 Oct 2026).
-- Dribbble and Behance forbid scraping in their terms, so they are manual-import only.
INSERT INTO public.inspiration_sources (id, name, home_url, category, default_kind, method, method_notes, sitemaps, sitemap_pick, listing_pages, include_pattern, exclude_pattern, tag_prefixes, platform, theme, enabled, use_source_images, status, restriction, sort) VALUES
('commerce-cream', 'Commerce Cream', 'https://commercecream.com/', 'ecommerce', 'ecommerce', 'sitemap', 'Sitemap from robots.txt; each listing links to the featured Shopify store.', '{https://commercecream.com/sitemap.xml}', NULL, '{https://commercecream.com/}', '^/(store|stores|site|sites|showcase)/[^/]+/?$', NULL, '{/category/,/categories/,/industry/,/tag/}', 'Shopify', NULL, true, true, 'not_started', NULL, 10),
('really-good-emails', 'Really Good Emails', 'https://reallygoodemails.com/', 'email', 'email', 'sitemap', 'Email sitemaps (sitemap-emails-N.xml) list every email page with a last-modified date.', '{https://reallygoodemails.com/sitemap.xml}', 'sitemap-emails-', '{}', '^/emails/[^/]+/?$', NULL, '{/categories/,/tags/}', NULL, NULL, true, true, 'not_started', NULL, 20),
('email-love', 'Email Love', 'https://emaillove.com/', 'email', 'email', 'sitemap', 'Yoast post sitemaps (post-sitemapN.xml); newest sitemaps read first.', '{https://emaillove.com/sitemap_index.xml}', 'post-sitemap', '{}', '^/email-inspiration-from-[^/]+/?$', NULL, '{/category/,/tag/}', NULL, NULL, true, true, 'not_started', NULL, 21),
('milled', 'Milled', 'https://milled.com/', 'email', 'email', 'sitemap', 'Compressed sitemap index (sitemap.xml.gz). Search, /sites/ and /out are disallowed and never requested.', '{https://milled.com/sitemaps/sitemap.xml.gz}', 'email', '{}', '^/[^/]+/[^/]+-[A-Za-z0-9]{6,}/?$', '^/(search|sites|out|categories|blog|about|stores)/', '{/categories/}', NULL, NULL, true, false, 'not_started', NULL, 22),
('lapa-ninja', 'Lapa Ninja', 'https://www.lapa.ninja/', 'website', 'landing_page', 'sitemap', 'sitemap-posts.xml lists every landing page post with a last-modified date.', '{https://www.lapa.ninja/sitemap.xml}', 'sitemap-posts', '{}', '^/post/[^/]+/?$', NULL, '{/category/,/tag/,/color/}', NULL, NULL, true, true, 'not_started', NULL, 30),
('landingfolio', 'Landingfolio', 'https://www.landingfolio.com/', 'website', 'landing_page', 'listing', 'The sitemap only lists category pages; examples are read from those pages.', '{https://landingfolio.com/sitemap.xml}', NULL, '{https://www.landingfolio.com/inspiration/landing-page/saas,https://www.landingfolio.com/inspiration/landing-page/ecommerce}', '^/inspiration/post/[^/]+/?$', NULL, '{/inspiration/landing-page/}', NULL, NULL, true, true, 'not_started', NULL, 31),
('one-page-love', 'One Page Love', 'https://onepagelove.com/', 'website', 'website', 'sitemap', 'post_part sitemaps list each featured one-page site; genre, style, platform, colour and tech are read from the page. An official API exists and can be added with a key.', '{https://onepagelove.com/sitemapindex.xml}', 'post_part', '{}', '^/[a-z0-9-]+/?$', '^/(about|submit|api|templates?|backups|genre|style|platform|tech|typeface|color|section|tag|page|inspiration|resources|blog|privacy|terms|contact|advertise|jobs|llms)\b', '{/genre/,/style/,/platform/,/tech/,/color/,/tag/}', NULL, NULL, true, true, 'not_started', NULL, 32),
('siteinspire', 'Siteinspire', 'https://www.siteinspire.com/websites', 'website', 'website', 'sitemap', 'websites/sitemap.xml lists each website page; category pages are disallowed and not requested.', '{https://www.siteinspire.com/websites/sitemap.xml}', NULL, '{}', '^/website/\d+-[^/]+/?$', NULL, '{/websites/categories/,/websites/styles/,/websites/types/}', NULL, NULL, true, true, 'not_started', NULL, 33),
('awwwards', 'Awwwards', 'https://www.awwwards.com/', 'website', 'website', 'sitemap', 'Sitemap from robots.txt; site pages under /sites/. Gallery, search and tag pages are disallowed.', '{https://www.awwwards.com/sitemap.xml}', 'site', '{}', '^/sites/[^/]+/?$', NULL, '{/websites/}', NULL, NULL, true, true, 'not_started', NULL, 34),
('land-book', 'Land-book', 'https://land-book.com/', 'website', 'website', 'listing', 'Category pages from sitemap.designs.xml list /websites/{id} pages, each with a "visit" link to the real site.', '{}', NULL, '{https://land-book.com/design/landing-page,https://land-book.com/design/portfolio,https://land-book.com/design/ecommerce,https://land-book.com/design/blog}', '^/websites/\d+-[^/]+/?$', NULL, '{/design/,/websites?style=,/websites?industry=}', NULL, NULL, true, true, 'not_started', NULL, 35),
('saasframe', 'SaaSFrame', 'https://www.saasframe.io/', 'ui', 'saas', 'sitemap', 'Sitemap lists one page per SaaS product (/saas/{name}) with its screens.', '{https://www.saasframe.io/sitemap.xml}', NULL, '{}', '^/saas/[^/]+/?$', NULL, '{/industries/,/patterns/}', NULL, NULL, true, true, 'not_started', NULL, 40),
('dark-design', 'Dark Design', 'https://www.dark.design/', 'ui', 'website', 'listing', 'The homepage lists /site/{name} pages; each has a "Visit site" link.', '{}', NULL, '{https://www.dark.design/}', '^/site/[^/]+/?$', NULL, '{/category/,/tag/}', NULL, 'dark', true, true, 'not_started', NULL, 41),
('framer-gallery', 'Framer Gallery', 'https://www.framer.com/gallery/', 'ui', 'website', 'listing', 'Gallery pages are read for individual site entries (sites built with Framer).', '{}', NULL, '{https://www.framer.com/gallery/}', '^/gallery/(?!categories/|tags/)[^/]+/[^/]+/?$', NULL, '{/gallery/categories/}', 'Framer', NULL, true, true, 'not_started', NULL, 42),
('figma-community', 'Figma Community', 'https://www.figma.com/community', 'ui', 'component', 'listing', 'Community listing pages are read for /community/file/{id} entries where they are server-rendered.', '{}', NULL, '{https://www.figma.com/community/website-templates,https://www.figma.com/community/ui-kits}', '^/community/file/\d+(/[^/]+)?/?$', NULL, '{/community/tag/}', NULL, NULL, true, false, 'not_started', NULL, 43),
('behance', 'Behance', 'https://www.behance.net/', 'ui', 'design_concept', 'manual', 'Manual import only: Adobe''s terms forbid data mining and scraping, and Behance has no open public API.', '{}', NULL, '{}', NULL, NULL, '{}', NULL, NULL, false, false, 'blocked', 'Adobe General Terms of Use 6.18 prohibit data mining and scraping. Add individual project links by manual import.', 44),
('dribbble', 'Dribbble', 'https://dribbble.com/', 'ui', 'design_concept', 'manual', 'Manual import only: Dribbble''s terms (section 7) forbid scraping; its API only covers your own shots.', '{}', NULL, '{}', NULL, NULL, '{}', NULL, NULL, false, false, 'blocked', 'Dribbble Terms section 7 prohibit automated scraping. Add individual shot links by manual import.', 45),
('layers', 'Layers', 'https://layers.to/explore', 'design', 'design_concept', 'listing', 'The explore page is rendered in the browser; individual posts are read only if links are present in the page.', '{}', NULL, '{https://layers.to/explore}', '^/layers/[^/]+/?$', NULL, '{}', NULL, NULL, true, true, 'not_started', NULL, 50),
('cosmos', 'Cosmos', 'https://www.cosmos.so/explore/', 'design', 'design_concept', 'listing', 'Explore page is read for element links; query-string URLs are disallowed and never requested.', '{}', NULL, '{https://www.cosmos.so/explore}', '^/e/\d+/?$', NULL, '{}', NULL, NULL, true, true, 'not_started', NULL, 51),
('designspiration', 'Designspiration', 'https://www.designspiration.com/', 'design', 'design_concept', 'listing', 'Homepage lists /save/{id} pages; each links to where the image was found.', '{}', NULL, '{https://www.designspiration.com/}', '^/save/\d+/?$', NULL, '{/search/saves/?q=}', NULL, NULL, true, true, 'not_started', NULL, 52)
ON CONFLICT (id) DO NOTHING;
