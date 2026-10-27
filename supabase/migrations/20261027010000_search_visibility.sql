-- Search visibility: release verification records and AI search observations.
-- Permissions reuse site_can(): audit.run (admin, editor, developer) records release checks;
-- content.draft or audit.run records AI observations; audit.read / analytics.read can read; only
-- admins delete. Nothing here is readable by visitors.

-- ---------------------------------------------------------------- release verification
CREATE TABLE IF NOT EXISTS public.site_deployment_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  actor_email text,
  expected_commit text NOT NULL CHECK (expected_commit ~ '^[0-9a-f]{7,40}$|^unknown$'),
  state text NOT NULL CHECK (state IN ('queued','building','build_failed','awaiting_publish','publishing','verifying','verified_live','verification_failed','rollback_pending','rolled_back')),
  build jsonb NOT NULL DEFAULT '{}',            -- manifest reported by the live health endpoint
  lovable jsonb NOT NULL DEFAULT '{}',          -- build/publish status as reported by Lovable, if entered
  samples int NOT NULL DEFAULT 0 CHECK (samples >= 0),
  matching int NOT NULL DEFAULT 0 CHECK (matching >= 0 AND matching <= samples),
  mismatches int NOT NULL DEFAULT 0 CHECK (mismatches >= 0),
  observed jsonb NOT NULL DEFAULT '{}',         -- {"<commit>|<deployment id>": count}
  smoke jsonb NOT NULL DEFAULT '[]',            -- [{name, ok, detail, mandatory}]
  failed_routes text[] NOT NULL DEFAULT '{}',
  duration_ms int,
  decision text NOT NULL DEFAULT '' CHECK (char_length(decision) <= 500),
  rollback_of uuid REFERENCES public.site_deployment_checks(id) ON DELETE SET NULL,
  CONSTRAINT site_deployment_checks_small CHECK (pg_column_size(smoke) + pg_column_size(observed) + pg_column_size(build) < 60000)
);
CREATE INDEX IF NOT EXISTS site_deployment_checks_at ON public.site_deployment_checks(created_at DESC);
ALTER TABLE public.site_deployment_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff read release checks" ON public.site_deployment_checks;
CREATE POLICY "staff read release checks" ON public.site_deployment_checks FOR SELECT TO authenticated USING (public.site_can('audit.read'));
DROP POLICY IF EXISTS "staff record release checks" ON public.site_deployment_checks;
CREATE POLICY "staff record release checks" ON public.site_deployment_checks FOR INSERT TO authenticated WITH CHECK (public.site_can('audit.run') AND created_by = auth.uid());
DROP POLICY IF EXISTS "admins delete release checks" ON public.site_deployment_checks;
CREATE POLICY "admins delete release checks" ON public.site_deployment_checks FOR DELETE TO authenticated USING (public.site_can('roles.manage'));
-- Records are evidence: no UPDATE policy, so a result can't be edited after the fact.

-- A verified_live record must actually match: every sample on the expected commit, none failing,
-- and no failed mandatory smoke test. The database refuses anything else.
CREATE OR REPLACE FUNCTION public.site_deployment_check_valid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.actor_email := (SELECT email FROM auth.users WHERE id = auth.uid());
  IF NEW.state = 'verified_live' THEN
    IF NEW.samples < 3 OR NEW.matching <> NEW.samples OR NEW.mismatches <> 0 THEN
      RAISE EXCEPTION 'verified_live needs at least 3 samples, all on the expected commit' USING ERRCODE = '22023';
    END IF;
    IF NEW.expected_commit = 'unknown' THEN RAISE EXCEPTION 'verified_live needs a known commit' USING ERRCODE = '22023'; END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.smoke) s WHERE coalesce((s->>'mandatory')::boolean, true) AND NOT coalesce((s->>'ok')::boolean, false)) THEN
      RAISE EXCEPTION 'verified_live with a failed mandatory smoke test' USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS site_deployment_check_valid ON public.site_deployment_checks;
CREATE TRIGGER site_deployment_check_valid BEFORE INSERT ON public.site_deployment_checks FOR EACH ROW EXECUTE FUNCTION public.site_deployment_check_valid();

CREATE OR REPLACE FUNCTION public.site_deployment_check_logged()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.site_log('release.' || NEW.state, NEW.expected_commit, jsonb_build_object('samples', NEW.samples, 'matching', NEW.matching, 'failed', NEW.failed_routes));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS site_deployment_check_logged ON public.site_deployment_checks;
CREATE TRIGGER site_deployment_check_logged AFTER INSERT ON public.site_deployment_checks FOR EACH ROW EXECUTE FUNCTION public.site_deployment_check_logged();

-- ---------------------------------------------------------------- AI search observations
CREATE TABLE IF NOT EXISTS public.site_ai_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  observed_at timestamptz NOT NULL DEFAULT now(),
  platform text NOT NULL CHECK (platform IN ('chatgpt','google_ai','bing_copilot','perplexity','gemini','claude','other')),
  interface text NOT NULL DEFAULT '' CHECK (char_length(interface) <= 80),
  prompt text NOT NULL CHECK (char_length(prompt) BETWEEN 3 AND 500),
  language text NOT NULL DEFAULT 'en' CHECK (language ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'),
  market text NOT NULL DEFAULT '' CHECK (char_length(market) <= 60),
  brand_mentioned boolean NOT NULL,
  linked boolean NOT NULL,
  linked_url text CHECK (linked_url IS NULL OR (char_length(linked_url) <= 400 AND linked_url ~ '^https?://')),
  supports_claim boolean,                         -- null = not reviewed
  competitors text NOT NULL DEFAULT '' CHECK (char_length(competitors) <= 300),
  evidence text NOT NULL CHECK (char_length(evidence) BETWEEN 3 AND 500),   -- screenshot ref or shared-conversation link
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 1000),
  CONSTRAINT site_ai_observations_link CHECK (NOT linked OR linked_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS site_ai_observations_at ON public.site_ai_observations(observed_at DESC);
ALTER TABLE public.site_ai_observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff read ai observations" ON public.site_ai_observations;
CREATE POLICY "staff read ai observations" ON public.site_ai_observations FOR SELECT TO authenticated USING (public.site_can('audit.read') OR public.site_can('analytics.read'));
DROP POLICY IF EXISTS "staff record ai observations" ON public.site_ai_observations;
CREATE POLICY "staff record ai observations" ON public.site_ai_observations FOR INSERT TO authenticated WITH CHECK ((public.site_can('content.draft') OR public.site_can('audit.run')) AND created_by = auth.uid());
DROP POLICY IF EXISTS "staff review ai observations" ON public.site_ai_observations;
CREATE POLICY "staff review ai observations" ON public.site_ai_observations FOR UPDATE TO authenticated USING (public.site_can('content.draft') OR public.site_can('audit.run')) WITH CHECK (public.site_can('content.draft') OR public.site_can('audit.run'));
DROP POLICY IF EXISTS "admins delete ai observations" ON public.site_ai_observations;
CREATE POLICY "admins delete ai observations" ON public.site_ai_observations FOR DELETE TO authenticated USING (public.site_can('roles.manage'));

CREATE OR REPLACE FUNCTION public.site_ai_observation_logged()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.site_log('ai_observation.' || lower(TG_OP), NEW.platform || ': ' || left(NEW.prompt, 120), jsonb_build_object('mentioned', NEW.brand_mentioned, 'linked', NEW.linked));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS site_ai_observation_logged ON public.site_ai_observations;
CREATE TRIGGER site_ai_observation_logged AFTER INSERT OR UPDATE ON public.site_ai_observations FOR EACH ROW EXECUTE FUNCTION public.site_ai_observation_logged();

REVOKE ALL ON public.site_deployment_checks, public.site_ai_observations FROM anon;
-- Release records are evidence: no role can change one after it's written.
REVOKE UPDATE, TRUNCATE, TRIGGER, REFERENCES ON public.site_deployment_checks FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.site_deployment_checks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_ai_observations TO authenticated;
