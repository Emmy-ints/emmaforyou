-- Public showcase ("Made on EmmaForYou"): prototypes, makeovers, audits, email sequences and 90-day plans that
-- visitors chose to show. Rows are inserted only by the server (/api/showcase, service role) after checking the
-- tool's signature, so only real tool output can appear. Items appear immediately (no approval); staff can hide
-- any item, and the visitor can remove theirs with the private token they got. No names or contact details unless
-- the visitor ticked "show my business name".
CREATE TABLE IF NOT EXISTS public.showcase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[A-Za-z0-9]{10,16}$'),
  kind text NOT NULL CHECK (kind IN ('app', 'website', 'makeover', 'audit', 'emails', 'plan')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 90),
  summary text CHECK (summary IS NULL OR char_length(summary) <= 400),
  industry text CHECK (industry IS NULL OR industry ~ '^[a-z-]{2,30}$'),
  place text CHECK (place IS NULL OR char_length(place) <= 60),
  business text CHECK (business IS NULL OR char_length(business) <= 80),
  payload jsonb NOT NULL,
  lang text NOT NULL DEFAULT 'en' CHECK (lang ~ '^[a-z]{2}$'),
  remove_hash text NOT NULL,
  visitor_hash text,
  hidden boolean NOT NULL DEFAULT false,
  hidden_by uuid,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pg_column_size(payload) <= 300000)
);
CREATE INDEX IF NOT EXISTS showcase_items_list_idx ON public.showcase_items (hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS showcase_items_kind_idx ON public.showcase_items (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS showcase_items_industry_idx ON public.showcase_items (industry, created_at DESC);

ALTER TABLE public.showcase_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.showcase_items FROM anon, authenticated;
GRANT SELECT, UPDATE (hidden, hidden_by) ON public.showcase_items TO authenticated;
DROP POLICY IF EXISTS "staff read showcase" ON public.showcase_items;
CREATE POLICY "staff read showcase" ON public.showcase_items FOR SELECT TO authenticated USING (public.site_can('enquiries.read'));
DROP POLICY IF EXISTS "staff hide showcase" ON public.showcase_items;
CREATE POLICY "staff hide showcase" ON public.showcase_items FOR UPDATE TO authenticated USING (public.site_can('content.draft')) WITH CHECK (public.site_can('content.draft'));

-- Public list: newest first, filtered by kind/industry; previews only (no HTML for list cards except small ones).
CREATE OR REPLACE FUNCTION public.showcase_list(p_kind text DEFAULT NULL, p_industry text DEFAULT NULL, p_limit integer DEFAULT 24, p_before timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'created_at') DESC), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'slug', s.slug, 'kind', s.kind, 'title', s.title, 'summary', s.summary, 'industry', s.industry, 'place', s.place,
      'business', s.business, 'lang', s.lang, 'views', s.views, 'likes', s.likes, 'created_at', s.created_at,
      'preview', s.payload - 'html') AS x
    FROM public.showcase_items s
    WHERE NOT s.hidden
      AND (p_kind IS NULL OR s.kind = p_kind OR (p_kind = 'prototype' AND s.kind IN ('app', 'website')))
      AND (p_industry IS NULL OR s.industry = p_industry)
      AND (p_before IS NULL OR s.created_at < p_before)
    ORDER BY s.created_at DESC
    LIMIT least(greatest(coalesce(p_limit, 24), 1), 48)
  ) q;
$$;

-- One item with its full content (HTML for prototypes and makeovers); counts the view.
CREATE OR REPLACE FUNCTION public.showcase_get(p_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s public.showcase_items;
BEGIN
  IF p_slug IS NULL OR p_slug !~ '^[A-Za-z0-9]{10,16}$' THEN RETURN NULL; END IF;
  UPDATE public.showcase_items SET views = views + 1 WHERE slug = p_slug AND NOT hidden RETURNING * INTO s;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('slug', s.slug, 'kind', s.kind, 'title', s.title, 'summary', s.summary, 'industry', s.industry,
    'place', s.place, 'business', s.business, 'lang', s.lang, 'views', s.views, 'likes', s.likes, 'created_at', s.created_at, 'payload', s.payload);
END $$;

-- "Like" (one per visitor per item is enforced in the browser; this only counts, capped per call).
CREATE OR REPLACE FUNCTION public.showcase_like(p_slug text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  UPDATE public.showcase_items SET likes = likes + 1 WHERE slug = p_slug AND NOT hidden RETURNING likes INTO n;
  RETURN n;
END $$;

-- Real counters for the homepage and /showcase: how often each free tool has actually been used, plus showcase totals.
CREATE OR REPLACE FUNCTION public.showcase_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jsonb_build_object(
    'prototypes', (SELECT count(*) FROM public.prototype_generations WHERE kind = 'new'),
    'audits', (SELECT count(*) FROM public.prototype_generations WHERE kind IN ('audit', 'ecom-audit')),
    'makeovers', (SELECT count(*) FROM public.prototype_generations WHERE kind = 'makeover'),
    'plans', (SELECT count(*) FROM public.prototype_generations WHERE kind IN ('goalplan', 'proto-plan', 'proposal')),
    'emails', (SELECT count(*) FROM public.prototype_generations WHERE kind = 'email-sequence'),
    'showcase', (SELECT count(*) FROM public.showcase_items WHERE NOT hidden),
    'since', (SELECT min(created_at) FROM public.prototype_generations));
$$;

REVOKE ALL ON FUNCTION public.showcase_list(text, text, integer, timestamptz) FROM public;
REVOKE ALL ON FUNCTION public.showcase_get(text) FROM public;
REVOKE ALL ON FUNCTION public.showcase_like(text) FROM public;
REVOKE ALL ON FUNCTION public.showcase_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.showcase_list(text, text, integer, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.showcase_get(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.showcase_like(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.showcase_stats() TO anon, authenticated;
