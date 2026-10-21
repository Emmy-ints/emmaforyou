-- Ecommerce Intelligence: private per-account workspaces, saved reports, guide conversations,
-- integration connection metadata (never credentials), a usage log for admin monitoring, and
-- admin switches for the AI helpers. Everything private is visible only to its owner (and admins
-- for monitoring counts through the summary function). Idempotent.

CREATE TABLE IF NOT EXISTS public.ecom_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My business' CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  stage text NOT NULL DEFAULT 'starting' CHECK (stage IN ('starting', 'growing')),
  store_url text CHECK (store_url IS NULL OR (store_url ~ '^https?://' AND char_length(store_url) <= 300)),
  profile jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(profile) = 'object' AND pg_column_size(profile) < 60000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ecom_workspaces_user_idx ON public.ecom_workspaces (user_id, created_at);

CREATE TABLE IF NOT EXISTS public.ecom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.ecom_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('roadmap', 'research', 'product', 'audit', 'diagnosis', 'profit', 'competitors', 'experiment', 'task', 'import')),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'archived')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(data) < 900000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ecom_items_ws_idx ON public.ecom_items (workspace_id, kind, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.ecom_guide_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.ecom_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 8000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ecom_guide_ws_idx ON public.ecom_guide_messages (workspace_id, created_at);

-- Connection metadata only. Tokens for authorised integrations would live in Vault, referenced by id.
CREATE TABLE IF NOT EXISTS public.ecom_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.ecom_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected', 'awaiting_authorization', 'connected', 'syncing', 'needs_attention', 'disconnected')),
  detail text,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, provider)
);

CREATE TABLE IF NOT EXISTS public.ecom_usage (
  id bigserial PRIMARY KEY,
  user_id uuid,
  tool text NOT NULL,
  ok boolean NOT NULL,
  ms integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ecom_usage_created_idx ON public.ecom_usage (created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_agent_settings (
  id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  extra_instructions text CHECK (extra_instructions IS NULL OR char_length(extra_instructions) <= 2000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.ai_agent_settings (id) VALUES ('community_assistant'), ('ecommerce_guide') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.ecom_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecom_guide_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecom_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecom_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ecom_workspaces, public.ecom_items, public.ecom_guide_messages, public.ecom_integrations, public.ecom_usage, public.ai_agent_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ecom_workspaces, public.ecom_items TO authenticated;
GRANT SELECT, DELETE ON public.ecom_guide_messages TO authenticated;
GRANT SELECT ON public.ecom_integrations TO authenticated;
GRANT SELECT ON public.ecom_usage TO authenticated;
GRANT SELECT ON public.ai_agent_settings TO authenticated;
GRANT UPDATE (enabled, extra_instructions, updated_at, updated_by) ON public.ai_agent_settings TO authenticated;
GRANT ALL ON public.ecom_workspaces, public.ecom_items, public.ecom_guide_messages, public.ecom_integrations, public.ecom_usage, public.ai_agent_settings TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ecom_usage_id_seq TO service_role;

DROP POLICY IF EXISTS ew_own ON public.ecom_workspaces;
CREATE POLICY ew_own ON public.ecom_workspaces FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS ei_own ON public.ecom_items;
CREATE POLICY ei_own ON public.ecom_items FOR ALL TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.ecom_workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid()));
DROP POLICY IF EXISTS eg_own ON public.ecom_guide_messages;
CREATE POLICY eg_own ON public.ecom_guide_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS eg_del ON public.ecom_guide_messages;
CREATE POLICY eg_del ON public.ecom_guide_messages FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS eint_own ON public.ecom_integrations;
CREATE POLICY eint_own ON public.ecom_integrations FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS eu_admin ON public.ecom_usage;
CREATE POLICY eu_admin ON public.ecom_usage FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS aas_read ON public.ai_agent_settings;
CREATE POLICY aas_read ON public.ai_agent_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS aas_admin ON public.ai_agent_settings;
CREATE POLICY aas_admin ON public.ai_agent_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Keep updated_at honest and stop rows moving between owners.
CREATE OR REPLACE FUNCTION public.ecom_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Not allowed.' USING ERRCODE = '42501'; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS ecom_workspaces_touch ON public.ecom_workspaces;
CREATE TRIGGER ecom_workspaces_touch BEFORE UPDATE ON public.ecom_workspaces FOR EACH ROW EXECUTE FUNCTION public.ecom_touch();
DROP TRIGGER IF EXISTS ecom_items_touch ON public.ecom_items;
CREATE TRIGGER ecom_items_touch BEFORE UPDATE ON public.ecom_items FOR EACH ROW EXECUTE FUNCTION public.ecom_touch();

-- Limits that keep one account from filling the database.
CREATE OR REPLACE FUNCTION public.ecom_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF TG_TABLE_NAME = 'ecom_workspaces' THEN
    SELECT count(*) INTO n FROM public.ecom_workspaces WHERE user_id = NEW.user_id;
    IF n >= 10 THEN RAISE EXCEPTION 'You can have up to 10 workspaces.' USING ERRCODE = '54000'; END IF;
  ELSE
    SELECT count(*) INTO n FROM public.ecom_items WHERE user_id = NEW.user_id;
    IF n >= 2000 THEN RAISE EXCEPTION 'Your workspace is full. Delete old items to save new ones.' USING ERRCODE = '54000'; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS ecom_workspaces_limits ON public.ecom_workspaces;
CREATE TRIGGER ecom_workspaces_limits BEFORE INSERT ON public.ecom_workspaces FOR EACH ROW EXECUTE FUNCTION public.ecom_limits();
DROP TRIGGER IF EXISTS ecom_items_limits ON public.ecom_items;
CREATE TRIGGER ecom_items_limits BEFORE INSERT ON public.ecom_items FOR EACH ROW EXECUTE FUNCTION public.ecom_limits();

-- Admin monitoring: counts only, never anyone's report contents.
CREATE OR REPLACE FUNCTION public.ecom_admin_summary()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'workspaces', (SELECT count(*) FROM public.ecom_workspaces),
    'starting', (SELECT count(*) FROM public.ecom_workspaces WHERE stage = 'starting'),
    'growing', (SELECT count(*) FROM public.ecom_workspaces WHERE stage = 'growing'),
    'items', (SELECT coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) FROM (SELECT kind, count(*) n FROM public.ecom_items GROUP BY kind) k),
    'guide_messages_7d', (SELECT count(*) FROM public.ecom_guide_messages WHERE created_at > now() - interval '7 days'),
    'usage_24h', (SELECT coalesce(jsonb_object_agg(tool, jsonb_build_object('runs', n, 'failed', f, 'avg_ms', a)), '{}'::jsonb)
                    FROM (SELECT tool, count(*) n, count(*) FILTER (WHERE NOT ok) f, round(avg(ms)) a FROM public.ecom_usage WHERE created_at > now() - interval '24 hours' GROUP BY tool) u),
    'recent_errors', (SELECT coalesce(jsonb_agg(jsonb_build_object('tool', tool, 'error', error, 'at', created_at)), '[]'::jsonb)
                       FROM (SELECT tool, error, created_at FROM public.ecom_usage WHERE NOT ok ORDER BY created_at DESC LIMIT 10) e)
  );
END $$;
REVOKE ALL ON FUNCTION public.ecom_admin_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ecom_admin_summary() TO authenticated;
