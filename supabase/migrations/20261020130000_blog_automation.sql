-- Automated blog: sources, trend evidence, articles, scheduled runs, maintenance queue and settings.
-- Articles are written only by the server (service role) after the quality gate passes; visitors can
-- read published articles; only administrators can see the pipeline tables or change settings.
-- Idempotent: safe to run more than once.

-- 1. Settings (single row) ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  timezone text NOT NULL DEFAULT 'Africa/Lagos' CHECK (timezone ~ '^[A-Za-z_]+(/[A-Za-z0-9_+\-]+){0,2}$'),
  slots text[] NOT NULL DEFAULT ARRAY['07:00', '11:00', '15:00', '19:00'],
  daily_target smallint NOT NULL DEFAULT 4 CHECK (daily_target BETWEEN 0 AND 12),
  site_url text NOT NULL DEFAULT 'https://emmaforyou.lovable.app' CHECK (site_url ~ '^https://[a-z0-9.\-]+(:[0-9]+)?$'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(slots) BETWEEN 0 AND 12)
);
INSERT INTO public.blog_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 2. Sources: public RSS/Atom feeds from official blogs and established publications -------------
CREATE TABLE IF NOT EXISTS public.blog_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  feed_url text NOT NULL UNIQUE CHECK (feed_url ~ '^https://'),
  site_url text NOT NULL CHECK (site_url ~ '^https://'),
  industry text NOT NULL,
  trust smallint NOT NULL DEFAULT 2 CHECK (trust BETWEEN 1 AND 3),
  enabled boolean NOT NULL DEFAULT true,
  last_fetched_at timestamptz,
  last_status text,
  last_error text,
  item_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Trend evidence: one row per feed item, with a transparent score -----------------------------
CREATE TABLE IF NOT EXISTS public.blog_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.blog_sources(id) ON DELETE CASCADE,
  url text NOT NULL UNIQUE CHECK (url ~ '^https?://'),
  title text NOT NULL,
  summary text,
  published_at timestamptz,
  industry text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0,
  score_detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  used_by uuid
);
CREATE INDEX IF NOT EXISTS blog_trends_pick_idx ON public.blog_trends (used_at, score DESC, published_at DESC);

-- 4. Articles ----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 90),
  title text NOT NULL CHECK (char_length(title) BETWEEN 20 AND 120),
  seo_title text CHECK (seo_title IS NULL OR char_length(seo_title) <= 70),
  category text NOT NULL,
  industry text NOT NULL,
  excerpt text NOT NULL CHECK (char_length(excerpt) BETWEEN 60 AND 320),
  body text NOT NULL CHECK (char_length(body) BETWEEN 2000 AND 40000),
  read_minutes smallint NOT NULL DEFAULT 5,
  cover jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(sources) = 'array' AND jsonb_array_length(sources) >= 1),
  keywords text[] NOT NULL DEFAULT '{}',
  internal_links text[] NOT NULL DEFAULT '{}',
  quality jsonb NOT NULL DEFAULT '{}'::jsonb,
  quality_score smallint NOT NULL DEFAULT 0,
  title_fingerprint text NOT NULL UNIQUE,
  content_hash text NOT NULL UNIQUE,
  trend_id uuid REFERENCES public.blog_trends(id) ON DELETE SET NULL,
  run_id uuid,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'unpublished')),
  provider text,
  model text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_articles_published_idx ON public.blog_articles (status, published_at DESC);

-- 5. Runs: one row per scheduled slot (slot_key is unique, so a slot can never publish twice) -----
CREATE TABLE IF NOT EXISTS public.blog_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'scheduled' CHECK (kind IN ('scheduled', 'manual')),
  scheduled_for timestamptz NOT NULL,
  local_date date NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'published', 'failed', 'skipped')),
  attempts smallint NOT NULL DEFAULT 1,
  article_id uuid REFERENCES public.blog_articles(id) ON DELETE SET NULL,
  trend_id uuid REFERENCES public.blog_trends(id) ON DELETE SET NULL,
  error text,
  log jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_runs_date_idx ON public.blog_runs (local_date DESC);
DO $$ BEGIN
  ALTER TABLE public.blog_articles ADD CONSTRAINT blog_articles_run_fk FOREIGN KEY (run_id) REFERENCES public.blog_runs(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Maintenance queue (broken sources, stale facts, failed link checks) -------------------------
CREATE TABLE IF NOT EXISTS public.blog_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('broken_source', 'broken_link', 'review_due', 'other')),
  detail text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'ignored')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (article_id, kind, detail)
);

-- 7. Scheduler ticks (what pg_cron sent, so the dashboard can show whether the site answered) ----
CREATE TABLE IF NOT EXISTS public.blog_ticks (
  id bigserial PRIMARY KEY,
  request_id bigint,
  target text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Access -------------------------------------------------------------------------------------
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_ticks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.blog_settings, public.blog_sources, public.blog_trends, public.blog_articles, public.blog_runs, public.blog_maintenance, public.blog_ticks FROM anon, authenticated;
GRANT SELECT ON public.blog_articles TO anon, authenticated;
GRANT SELECT ON public.blog_settings, public.blog_sources, public.blog_trends, public.blog_runs, public.blog_maintenance, public.blog_ticks TO authenticated;
GRANT UPDATE (enabled, timezone, slots, daily_target, site_url, updated_at) ON public.blog_settings TO authenticated;
GRANT UPDATE (enabled) ON public.blog_sources TO authenticated;
GRANT UPDATE (status, updated_at) ON public.blog_articles TO authenticated;
GRANT UPDATE (status, resolved_at) ON public.blog_maintenance TO authenticated;
GRANT ALL ON public.blog_settings, public.blog_sources, public.blog_trends, public.blog_articles, public.blog_runs, public.blog_maintenance, public.blog_ticks TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.blog_ticks_id_seq TO service_role;

DROP POLICY IF EXISTS ba_read ON public.blog_articles;
CREATE POLICY ba_read ON public.blog_articles FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS ba_admin_update ON public.blog_articles;
CREATE POLICY ba_admin_update ON public.blog_articles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['blog_settings', 'blog_sources', 'blog_trends', 'blog_runs', 'blog_maintenance', 'blog_ticks'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), %L::app_role))', t || '_admin_read', t, 'admin');
  END LOOP;
  FOREACH t IN ARRAY ARRAY['blog_settings', 'blog_sources', 'blog_maintenance'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), %L::app_role)) WITH CHECK (public.has_role(auth.uid(), %L::app_role))', t || '_admin_update', t, 'admin', 'admin');
  END LOOP;
END $$;

-- 9. Scheduler: pg_cron calls the site's tick endpoint every 10 minutes. The endpoint decides from
-- the stored timezone and slots whether a slot is due, so it works with the dashboard closed.
CREATE OR REPLACE FUNCTION public.blog_cron_tick()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE s public.blog_settings; rid bigint; target text;
BEGIN
  SELECT * INTO s FROM public.blog_settings WHERE id = 1;
  IF s IS NULL OR NOT s.enabled THEN RETURN; END IF;
  target := s.site_url || '/api/blog/tick';
  SELECT net.http_post(url := target, body := '{"source":"cron"}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb, timeout_milliseconds := 290000) INTO rid;
  INSERT INTO public.blog_ticks (request_id, target) VALUES (rid, target);
  DELETE FROM public.blog_ticks WHERE created_at < now() - interval '14 days';
END $$;
REVOKE ALL ON FUNCTION public.blog_cron_tick() FROM PUBLIC, anon, authenticated;

-- Last scheduler calls with the HTTP status the site returned (admins only).
CREATE OR REPLACE FUNCTION public.blog_tick_status(_limit integer DEFAULT 20)
RETURNS TABLE (created_at timestamptz, target text, status_code integer, timed_out boolean, error text, body text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
    SELECT t.created_at, t.target, r.status_code, r.timed_out, r.error_msg, left(r.content, 300)
    FROM public.blog_ticks t LEFT JOIN net._http_response r ON r.id = t.request_id
    ORDER BY t.created_at DESC LIMIT least(greatest(_limit, 1), 100);
END $$;
REVOKE ALL ON FUNCTION public.blog_tick_status(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.blog_tick_status(integer) TO authenticated;
