CREATE TABLE public.prototype_ai_access_state (
 id text PRIMARY KEY,
 status integer NOT NULL,
 message text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.prototype_ai_access_state TO service_role;
ALTER TABLE public.prototype_ai_access_state ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.prototype_ai_access_state IS 'Private persistent AI access circuit breaker, server use only; no public access policies.';