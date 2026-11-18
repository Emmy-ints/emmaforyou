-- AI circuit breaker state (one row per provider), read and written only by the server with the
-- service role. It existed in the Lovable Cloud database but was never in a migration file.
CREATE TABLE IF NOT EXISTS public.prototype_ai_access_state (
  id text PRIMARY KEY,
  status integer NOT NULL,
  message text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prototype_ai_access_state ENABLE ROW LEVEL SECURITY;
-- No policies: visitors can't read or write it; the service role bypasses RLS.
REVOKE ALL ON public.prototype_ai_access_state FROM anon, authenticated;
