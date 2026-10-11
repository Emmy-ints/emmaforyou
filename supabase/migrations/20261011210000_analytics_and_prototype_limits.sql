-- Visitor limit for the AI prototype builder (server-only, written with the service role).
CREATE TABLE IF NOT EXISTS public.prototype_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_hash text NOT NULL,
  kind text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prototype_generations_visitor_time_idx
  ON public.prototype_generations (visitor_hash, created_at DESC);
ALTER TABLE public.prototype_generations ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.prototype_generations TO service_role;
DROP POLICY IF EXISTS "Admins read prototype generations" ON public.prototype_generations;
CREATE POLICY "Admins read prototype generations" ON public.prototype_generations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- First-party site analytics. Anyone may insert a small, well-formed event; only admins can read.
CREATE TABLE IF NOT EXISTS public.site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  path text,
  session_id text NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text,
  language text,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_events_event_ok CHECK (event ~ '^[a-z_]{2,48}$'),
  CONSTRAINT site_events_session_ok CHECK (char_length(session_id) BETWEEN 8 AND 64),
  CONSTRAINT site_events_path_ok CHECK (path IS NULL OR char_length(path) <= 300),
  CONSTRAINT site_events_referrer_ok CHECK (referrer IS NULL OR char_length(referrer) <= 300),
  CONSTRAINT site_events_utm_ok CHECK (
    coalesce(char_length(utm_source), 0) <= 100 AND coalesce(char_length(utm_medium), 0) <= 100 AND coalesce(char_length(utm_campaign), 0) <= 100),
  CONSTRAINT site_events_small CHECK (
    coalesce(char_length(device), 0) <= 16 AND coalesce(char_length(language), 0) <= 8 AND pg_column_size(props) <= 2048)
);
CREATE INDEX IF NOT EXISTS site_events_created_idx ON public.site_events (created_at DESC);
CREATE INDEX IF NOT EXISTS site_events_event_created_idx ON public.site_events (event, created_at DESC);
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.site_events TO anon, authenticated;
GRANT SELECT ON public.site_events TO authenticated;
GRANT ALL ON public.site_events TO service_role;
DROP POLICY IF EXISTS "Anyone records site events" ON public.site_events;
CREATE POLICY "Anyone records site events" ON public.site_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read site events" ON public.site_events;
CREATE POLICY "Admins read site events" ON public.site_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Leads and intakes could be submitted but never read from the app. Let admins read them.
DROP POLICY IF EXISTS "Admins read leads" ON public.leads;
CREATE POLICY "Admins read leads" ON public.leads
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins read intakes" ON public.business_intakes;
CREATE POLICY "Admins read intakes" ON public.business_intakes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
GRANT SELECT ON public.leads, public.business_intakes TO authenticated;
