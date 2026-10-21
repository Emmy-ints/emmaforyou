-- EmmaForYou autonomous agent team: directory, queue, scheduler, memory, leads, handover, usage, audit.
-- Every table is admin-only (RLS) except agent_member_prefs (each member manages their own row).
-- The worker (/api/agents-tick, service role) is the only writer of agent work records.

-- ------------------------------------------------------------------ community: mark agent identities
ALTER TABLE public.community_profiles ADD COLUMN IF NOT EXISTS agent_slug text UNIQUE;
-- (Not added to member column grants, so members can never set or change it.)

-- ------------------------------------------------------------------ settings
CREATE TABLE IF NOT EXISTS public.agent_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  paused boolean NOT NULL DEFAULT false,
  paused_reason text,
  auto_publish_posts boolean NOT NULL DEFAULT true,
  review_all_replies boolean NOT NULL DEFAULT false,
  daily_ai_call_limit integer NOT NULL DEFAULT 300 CHECK (daily_ai_call_limit BETWEEN 0 AND 100000),
  monthly_token_limit bigint NOT NULL DEFAULT 20000000 CHECK (monthly_token_limit >= 0),
  monthly_cost_limit_usd numeric(10,2) CHECK (monthly_cost_limit_usd IS NULL OR monthly_cost_limit_usd >= 0),
  price_input_per_1m numeric(10,4) CHECK (price_input_per_1m IS NULL OR price_input_per_1m >= 0),
  price_output_per_1m numeric(10,4) CHECK (price_output_per_1m IS NULL OR price_output_per_1m >= 0),
  model text CHECK (model IS NULL OR model ~ '^[A-Za-z0-9][A-Za-z0-9.\-:_/]{1,63}$'),
  max_agent_replies_per_thread smallint NOT NULL DEFAULT 3 CHECK (max_agent_replies_per_thread BETWEEN 0 AND 20),
  max_replies_per_member_per_day smallint NOT NULL DEFAULT 6 CHECK (max_replies_per_member_per_day BETWEEN 0 AND 100),
  max_followups_per_member_per_month smallint NOT NULL DEFAULT 2 CHECK (max_followups_per_member_per_month BETWEEN 0 AND 20),
  unanswered_after_minutes integer NOT NULL DEFAULT 45 CHECK (unanswered_after_minutes BETWEEN 0 AND 10080),
  reply_delay_seconds integer NOT NULL DEFAULT 60 CHECK (reply_delay_seconds BETWEEN 0 AND 86400),
  private_outreach_enabled boolean NOT NULL DEFAULT false,
  admin_instructions text CHECK (admin_instructions IS NULL OR char_length(admin_instructions) <= 4000),
  tick_secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  last_kick_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.agent_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------ directory
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]{1,30}$'),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 40),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  kind text NOT NULL DEFAULT 'specialist' CHECK (kind IN ('specialist', 'general')),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  scope text NOT NULL DEFAULT '' CHECK (char_length(scope) <= 2000),
  voice text NOT NULL DEFAULT '' CHECK (char_length(voice) <= 1000),
  knowledge text NOT NULL DEFAULT '' CHECK (char_length(knowledge) <= 8000),
  problem_workflow text NOT NULL DEFAULT 'Understand the situation; identify missing information and ask at most two targeted questions; diagnose plausible causes (labelled as likely, not certain); recommend a solution; give concrete next steps; mention the EmmaForYou tool or service that fits, only when it genuinely helps.' CHECK (char_length(problem_workflow) <= 2000),
  sales_workflow text NOT NULL DEFAULT 'Discover need → diagnose → provide value first → qualify only when the member shows buying intent (goals, scope, timeline, budget) → recommend one real service or tool → invite one next step (free tool, consultation at /book, or quote at /proposal) → follow up only with permission → record outcome. Never pressure, invent urgency or promise results.' CHECK (char_length(sales_workflow) <= 2000),
  community_strategy text NOT NULL DEFAULT 'Answer questions in scope with specific, practical help; add a second opinion only when it adds something new; publish original educational posts based on sourced research; never post just to be active.' CHECK (char_length(community_strategy) <= 2000),
  research_strategy text NOT NULL DEFAULT 'Use the shared industry feed and recurring community questions in this niche; prefer recent, credible sources; skip topics covered in the last 60 days unless there is a real update.' CHECK (char_length(research_strategy) <= 2000),
  limits text NOT NULL DEFAULT 'Escalate to a person: complaints, refunds or disputed payments, legal or financial advice, contracts or unusual commitments, prices or delivery dates not on the website, anything you cannot answer reliably.' CHECK (char_length(limits) <= 2000),
  keywords text[] NOT NULL DEFAULT '{}' CHECK (cardinality(keywords) <= 60),
  topics text[] NOT NULL DEFAULT '{}' CHECK (cardinality(topics) <= 10),
  capabilities text[] NOT NULL DEFAULT ARRAY['reply', 'post', 'research', 'lead', 'followup', 'flag']::text[],
  enabled boolean NOT NULL DEFAULT true,
  reply_policy text NOT NULL DEFAULT 'auto' CHECK (reply_policy IN ('auto', 'review', 'off')),
  publish_policy text NOT NULL DEFAULT 'auto' CHECK (publish_policy IN ('auto', 'review', 'draft', 'off')),
  posts_per_week smallint NOT NULL DEFAULT 1 CHECK (posts_per_week BETWEEN 0 AND 21),
  daily_reply_limit smallint NOT NULL DEFAULT 20 CHECK (daily_reply_limit BETWEEN 0 AND 500),
  monthly_token_budget bigint CHECK (monthly_token_budget IS NULL OR monthly_token_budget >= 0),
  model text CHECK (model IS NULL OR model ~ '^[A-Za-z0-9][A-Za-z0-9.\-:_/]{1,63}$'),
  merged_into uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  sort smallint NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_niche_assignments (
  id bigserial PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  niche_type text NOT NULL CHECK (niche_type IN ('expertise', 'solution_category', 'solution', 'industry', 'niche', 'tool')),
  niche_key text NOT NULL CHECK (char_length(niche_key) BETWEEN 1 AND 120),
  is_primary boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'seed' CHECK (source IN ('seed', 'admin', 'auto')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (niche_type, niche_key, agent_id)
);
CREATE INDEX IF NOT EXISTS agent_niche_agent_idx ON public.agent_niche_assignments (agent_id);

-- ------------------------------------------------------------------ scheduler + queue
CREATE TABLE IF NOT EXISTS public.agent_schedules (
  id text PRIMARY KEY CHECK (id ~ '^[a-z_]{2,40}$'),
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  interval_minutes integer NOT NULL CHECK (interval_minutes BETWEEN 2 AND 43200),
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  last_status text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.agent_schedules (id, label, interval_minutes) VALUES
  ('unanswered', 'Find unanswered questions', 30),
  ('research', 'Collect niche research from the industry feed', 360),
  ('content_plan', 'Write educational posts from research', 180),
  ('publish', 'Publish approved and scheduled content', 5),
  ('followups', 'Send due follow-ups', 30),
  ('leads_review', 'Review open leads and due next actions', 120),
  ('knowledge_sync', 'Sync catalogue knowledge and niche coverage', 1440),
  ('insights', 'Detect recurring problems and unmet needs', 1440),
  ('summary_daily', 'Daily activity summary', 1440),
  ('summary_weekly', 'Weekly activity summary', 10080),
  ('maintenance', 'Retry stuck tasks, dead-letter failures, inactivity checks', 30)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind ~ '^[a-z_]{2,40}$'),
  agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  priority smallint NOT NULL DEFAULT 5 CHECK (priority BETWEEN 0 AND 9),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'skipped', 'failed', 'dead', 'cancelled')),
  dedupe_key text NOT NULL UNIQUE CHECK (char_length(dedupe_key) <= 200),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts smallint NOT NULL DEFAULT 0,
  max_attempts smallint NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  run_after timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  last_error text,
  result jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS agent_tasks_ready_idx ON public.agent_tasks (priority, run_after) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS agent_tasks_status_idx ON public.agent_tasks (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS agent_tasks_agent_idx ON public.agent_tasks (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_task_runs (
  id bigserial PRIMARY KEY,
  task_id uuid REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  kind text NOT NULL,
  attempt smallint NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  ok boolean,
  outcome text,
  ms integer,
  error text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS agent_task_runs_time_idx ON public.agent_task_runs (started_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_ticks (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  request_id bigint,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  claimed integer,
  processed integer,
  ok boolean,
  note text
);

-- ------------------------------------------------------------------ knowledge + research + content
CREATE TABLE IF NOT EXISTS public.agent_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL UNIQUE CHECK (char_length(ref) <= 200),
  agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  layer text NOT NULL CHECK (layer IN ('company', 'service', 'specialist', 'policy', 'admin')),
  title text NOT NULL CHECK (char_length(title) <= 200),
  path text CHECK (path IS NULL OR path ~ '^/[A-Za-z0-9/_\-]*$'),
  niche_type text,
  niche_key text,
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 6000),
  keywords text[] NOT NULL DEFAULT '{}',
  verified boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'catalogue' CHECK (source IN ('catalogue', 'admin')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_knowledge_agent_idx ON public.agent_knowledge_sources (agent_id) WHERE active;

CREATE TABLE IF NOT EXISTS public.agent_research_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'source' CHECK (kind IN ('source', 'community')),
  trend_id uuid REFERENCES public.blog_trends(id) ON DELETE SET NULL,
  url text CHECK (url IS NULL OR url ~ '^https?://'),
  title text NOT NULL CHECK (char_length(title) <= 300),
  source_name text,
  published_at timestamptz,
  summary text CHECK (summary IS NULL OR char_length(summary) <= 2000),
  topic text,
  relevance numeric(5,2) NOT NULL DEFAULT 0,
  confidence text NOT NULL DEFAULT 'reported' CHECK (confidence IN ('reported', 'observed', 'unverified')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'planned', 'used', 'skipped')),
  fingerprint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, fingerprint)
);
CREATE INDEX IF NOT EXISTS agent_research_agent_idx ON public.agent_research_items (agent_id, status, relevance DESC);

CREATE TABLE IF NOT EXISTS public.agent_content_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('post', 'reply')),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft', 'pending_review', 'scheduled', 'published', 'rejected', 'failed', 'cancelled')),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  title text CHECK (title IS NULL OR char_length(title) <= 160),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 10000),
  post_kind text CHECK (post_kind IS NULL OR post_kind IN ('tutorial', 'discussion', 'update', 'question')),
  topic text,
  tags text[] NOT NULL DEFAULT '{}',
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  research_id uuid REFERENCES public.agent_research_items(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  fingerprint text NOT NULL,
  reason text,
  publish_at timestamptz NOT NULL DEFAULT now(),
  published_ref uuid,
  error text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, fingerprint)
);
CREATE INDEX IF NOT EXISTS agent_content_status_idx ON public.agent_content_queue (status, publish_at);

-- ------------------------------------------------------------------ actions, memory, prefs
CREATE TABLE IF NOT EXISTS public.agent_community_actions (
  id bigserial PRIMARY KEY,
  agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('reply', 'comment', 'post', 'react', 'flag', 'skip', 'escalate', 'route', 'followup', 'queued_for_review')),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE SET NULL,
  comment_id uuid REFERENCES public.community_comments(id) ON DELETE SET NULL,
  member_id uuid,
  task_id uuid REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  dedupe_key text UNIQUE,
  ok boolean NOT NULL DEFAULT true,
  reason text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_actions_post_idx ON public.agent_community_actions (post_id, created_at);
CREATE INDEX IF NOT EXISTS agent_actions_time_idx ON public.agent_community_actions (created_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_conversation_context (
  member_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  facts text NOT NULL DEFAULT '' CHECK (char_length(facts) <= 2000),
  last_agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  interactions integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_member_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  no_replies boolean NOT NULL DEFAULT false,
  no_followups boolean NOT NULL DEFAULT false,
  no_memory boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------ sales
CREATE TABLE IF NOT EXISTS public.agent_lead_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('community_post', 'community_comment', 'form_leads', 'form_booking', 'form_audit', 'form_proposal', 'admin')),
  source_id uuid NOT NULL,
  member_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE SET NULL,
  need text NOT NULL CHECK (char_length(need) <= 1000),
  niche text,
  service_path text CHECK (service_path IS NULL OR service_path ~ '^/[A-Za-z0-9/_\-]*$'),
  evidence text CHECK (evidence IS NULL OR char_length(evidence) <= 1500),
  confidence numeric(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'needs_clarification', 'qualified', 'service_recommended', 'consultation_requested', 'quote_requested', 'awaiting_human', 'won', 'lost', 'followup_scheduled', 'not_suitable')),
  next_action text,
  next_action_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  outcome_note text,
  human_override boolean NOT NULL DEFAULT false,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);
CREATE INDEX IF NOT EXISTS agent_leads_stage_idx ON public.agent_lead_records (stage, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_followup_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.agent_lead_records(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'community_comment' CHECK (channel IN ('community_comment', 'private_message')),
  consent text NOT NULL CHECK (consent IN ('member_asked', 'unresolved_thread', 'admin')),
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'skipped', 'cancelled')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS agent_followups_one_open ON public.agent_followup_tasks (member_id, post_id) WHERE status = 'scheduled';

CREATE TABLE IF NOT EXISTS public.agent_handover_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('post', 'lead', 'member')),
  target_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'human' CHECK (state IN ('human', 'needs_human', 'agents')),
  reason text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id)
);

-- ------------------------------------------------------------------ usage, audit, reports
CREATE TABLE IF NOT EXISTS public.agent_usage_records (
  id bigserial PRIMARY KEY,
  agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  purpose text NOT NULL,
  provider text,
  model text,
  ok boolean NOT NULL DEFAULT true,
  input_tokens integer,
  output_tokens integer,
  est_cost_usd numeric(12,6),
  ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_usage_time_idx ON public.agent_usage_records (created_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_audit_logs (
  id bigserial PRIMARY KEY,
  actor_type text NOT NULL CHECK (actor_type IN ('admin', 'agent', 'system')),
  actor_id uuid,
  agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_audit_time_idx ON public.agent_audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_reports (
  id bigserial PRIMARY KEY,
  period text NOT NULL CHECK (period IN ('day', 'week', 'insights')),
  period_start date NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (period, period_start)
);

-- ------------------------------------------------------------------ touch triggers + admin audit
CREATE OR REPLACE FUNCTION public.agent_touch() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['agent_settings', 'agent_profiles', 'agent_schedules', 'agent_tasks', 'agent_content_queue', 'agent_lead_records', 'agent_followup_tasks', 'agent_knowledge_sources', 'agent_member_prefs'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_touch ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.agent_touch()', t, t);
  END LOOP;
END $$;

-- Every change an administrator makes through the dashboard is recorded (who, what, before/after keys).
CREATE OR REPLACE FUNCTION public.agent_admin_audit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE changed jsonb := '{}'::jsonb; k text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN coalesce(NEW, OLD); END IF;  -- worker/service writes are logged by the worker
  IF TG_OP = 'UPDATE' THEN
    FOR k IN SELECT key FROM jsonb_each(to_jsonb(NEW)) LOOP
      IF k NOT IN ('updated_at', 'tick_secret') AND (to_jsonb(NEW)->k) IS DISTINCT FROM (to_jsonb(OLD)->k) THEN
        changed := changed || jsonb_build_object(k, jsonb_build_object('from', to_jsonb(OLD)->k, 'to', to_jsonb(NEW)->k));
      END IF;
    END LOOP;
    IF changed = '{}'::jsonb THEN RETURN NEW; END IF;
  END IF;
  INSERT INTO public.agent_audit_logs (actor_type, actor_id, action, target_type, target_id, details)
  VALUES ('admin', auth.uid(), lower(TG_OP), TG_TABLE_NAME, coalesce(to_jsonb(NEW)->>'id', to_jsonb(OLD)->>'id'),
          CASE WHEN TG_OP = 'UPDATE' THEN changed WHEN TG_OP = 'DELETE' THEN jsonb_build_object('deleted', to_jsonb(OLD) - 'tick_secret') ELSE to_jsonb(NEW) - 'tick_secret' END);
  RETURN coalesce(NEW, OLD);
END $$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['agent_settings', 'agent_profiles', 'agent_niche_assignments', 'agent_schedules', 'agent_content_queue', 'agent_lead_records', 'agent_handover_states', 'agent_knowledge_sources', 'agent_followup_tasks'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_audit ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER %I_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.agent_admin_audit()', t, t);
  END LOOP;
END $$;

-- ------------------------------------------------------------------ RLS
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['agent_settings', 'agent_profiles', 'agent_niche_assignments', 'agent_schedules', 'agent_tasks', 'agent_task_runs', 'agent_ticks', 'agent_knowledge_sources', 'agent_research_items', 'agent_content_queue', 'agent_community_actions', 'agent_conversation_context', 'agent_member_prefs', 'agent_lead_records', 'agent_followup_tasks', 'agent_handover_states', 'agent_usage_records', 'agent_audit_logs', 'agent_reports'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    IF t <> 'agent_member_prefs' THEN
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
      EXECUTE format('DROP POLICY IF EXISTS %I_admin_read ON public.%I', t, t);
      EXECUTE format('CREATE POLICY %I_admin_read ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))', t, t);
    END IF;
  END LOOP;
END $$;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Admin-editable tables (writes still go through RLS: admin only).
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['agent_profiles', 'agent_niche_assignments', 'agent_schedules', 'agent_knowledge_sources', 'agent_content_queue', 'agent_lead_records', 'agent_followup_tasks', 'agent_handover_states', 'agent_tasks'] LOOP
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_write ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_admin_write ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role))', t, t);
  END LOOP;
END $$;
GRANT USAGE ON SEQUENCE public.agent_niche_assignments_id_seq TO authenticated;
-- Settings: admins may update everything except the scheduler secret.
REVOKE SELECT ON public.agent_settings FROM authenticated;
GRANT SELECT (id, paused, paused_reason, auto_publish_posts, review_all_replies, daily_ai_call_limit, monthly_token_limit, monthly_cost_limit_usd, price_input_per_1m, price_output_per_1m, model, max_agent_replies_per_thread, max_replies_per_member_per_day, max_followups_per_member_per_month, unanswered_after_minutes, reply_delay_seconds, private_outreach_enabled, admin_instructions, last_kick_at, updated_at, updated_by) ON public.agent_settings TO authenticated;
GRANT UPDATE (paused, paused_reason, auto_publish_posts, review_all_replies, daily_ai_call_limit, monthly_token_limit, monthly_cost_limit_usd, price_input_per_1m, price_output_per_1m, model, max_agent_replies_per_thread, max_replies_per_member_per_day, max_followups_per_member_per_month, unanswered_after_minutes, reply_delay_seconds, private_outreach_enabled, admin_instructions, updated_by) ON public.agent_settings TO authenticated;
DROP POLICY IF EXISTS agent_settings_admin_update ON public.agent_settings;
CREATE POLICY agent_settings_admin_update ON public.agent_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
-- Admins can't hand-edit what the queue already did (status/attempt history stays truthful), only cancel/retry via RPC.
REVOKE INSERT, UPDATE, DELETE ON public.agent_tasks FROM authenticated;

-- Members: their own AI preferences only.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_member_prefs TO authenticated;
DROP POLICY IF EXISTS agent_member_prefs_own ON public.agent_member_prefs;
CREATE POLICY agent_member_prefs_own ON public.agent_member_prefs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS agent_member_prefs_admin ON public.agent_member_prefs;
CREATE POLICY agent_member_prefs_admin ON public.agent_member_prefs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- When a member turns memory off, what agents remembered about them is deleted.
CREATE OR REPLACE FUNCTION public.agent_prefs_after() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.no_memory THEN DELETE FROM public.agent_conversation_context WHERE member_id = NEW.user_id; END IF;
  IF NEW.no_followups OR NEW.no_replies THEN
    UPDATE public.agent_followup_tasks SET status = 'cancelled', reason = 'member opted out' WHERE member_id = NEW.user_id AND status = 'scheduled';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS agent_prefs_after ON public.agent_member_prefs;
CREATE TRIGGER agent_prefs_after AFTER INSERT OR UPDATE ON public.agent_member_prefs FOR EACH ROW EXECUTE FUNCTION public.agent_prefs_after();

-- ------------------------------------------------------------------ identities for agents
-- Each agent posts through its own community profile, backed by an auth identity that has no
-- password and is banned from signing in (it can never be logged into). Profiles carry agent_slug,
-- which the community UI shows as an "AI agent" label.
CREATE OR REPLACE FUNCTION public.agent_ensure_identity(p_agent uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE a public.agent_profiles; uid uuid; uname text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO a FROM public.agent_profiles WHERE id = p_agent;
  IF a.id IS NULL THEN RAISE EXCEPTION 'Agent not found.'; END IF;
  uid := a.user_id;
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token,
                            raw_app_meta_data, raw_user_meta_data, banned_until, created_at, updated_at, is_sso_user, is_anonymous)
    VALUES (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', a.slug || '@agents.emmaforyou.invalid', NULL, '', '', '', '', '', '', '', '',
            '{"provider":"agent","providers":[]}'::jsonb, jsonb_build_object('signup_source', 'community', 'agent', true, 'full_name', a.name),
            'infinity'::timestamptz, now(), now(), false, false);
    UPDATE public.agent_profiles SET user_id = uid WHERE id = a.id;
  END IF;
  uname := left(regexp_replace(a.slug, '[^a-z0-9_]', '_', 'g'), 18) || '_ai';
  INSERT INTO public.community_profiles (user_id, username, display_name, headline, bio, skills, agent_slug)
  VALUES (uid, uname, a.name, left(a.title || ' · AI agent', 120),
          left(a.description || E'\n\nI''m an automated EmmaForYou AI agent, not a person. A member of the EmmaForYou team can step in at any time.', 1500),
          coalesce((SELECT array_agg(k) FROM (SELECT unnest(a.keywords) k LIMIT 12) s), '{}'), a.slug)
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, headline = EXCLUDED.headline, bio = EXCLUDED.bio, agent_slug = EXCLUDED.agent_slug;
  RETURN uid;
END $$;
REVOKE ALL ON FUNCTION public.agent_ensure_identity(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agent_ensure_identity(uuid) TO authenticated, service_role;

-- Keep the community profile in step when an admin renames or retitles an agent; disabled agents are suspended.
CREATE OR REPLACE FUNCTION public.agent_profiles_after() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN PERFORM public.agent_ensure_identity(NEW.id); RETURN NULL; END IF;
  IF NEW.user_id IS NOT NULL AND (NEW.name, NEW.title, NEW.description, NEW.enabled) IS DISTINCT FROM (OLD.name, OLD.title, OLD.description, OLD.enabled) THEN
    UPDATE public.community_profiles SET display_name = NEW.name, headline = left(NEW.title || ' · AI agent', 120),
      bio = left(NEW.description || E'\n\nI''m an automated EmmaForYou AI agent, not a person. A member of the EmmaForYou team can step in at any time.', 1500)
      WHERE user_id = NEW.user_id;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS agent_profiles_after ON public.agent_profiles;
CREATE TRIGGER agent_profiles_after AFTER INSERT OR UPDATE ON public.agent_profiles FOR EACH ROW EXECUTE FUNCTION public.agent_profiles_after();

-- ------------------------------------------------------------------ queue functions (worker = service role)
CREATE OR REPLACE FUNCTION public.agent_enqueue(p_kind text, p_dedupe text, p_payload jsonb DEFAULT '{}'::jsonb, p_agent uuid DEFAULT NULL, p_priority smallint DEFAULT 5, p_run_after timestamptz DEFAULT now())
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tid uuid;
BEGIN
  INSERT INTO public.agent_tasks (kind, dedupe_key, payload, agent_id, priority, run_after)
  VALUES (p_kind, left(p_dedupe, 200), coalesce(p_payload, '{}'::jsonb), p_agent, p_priority, p_run_after)
  ON CONFLICT (dedupe_key) DO NOTHING RETURNING id INTO tid;
  RETURN tid;
END $$;
REVOKE ALL ON FUNCTION public.agent_enqueue(text, text, jsonb, uuid, smallint, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agent_enqueue(text, text, jsonb, uuid, smallint, timestamptz) TO service_role;

-- Claim ready tasks atomically (no two workers get the same task); expired leases are reclaimed.
CREATE OR REPLACE FUNCTION public.agent_claim_tasks(p_limit integer, p_lease_seconds integer DEFAULT 240)
RETURNS SETOF public.agent_tasks LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  UPDATE public.agent_tasks t SET status = 'running', attempts = t.attempts + 1, locked_until = now() + make_interval(secs => p_lease_seconds), updated_at = now()
  WHERE t.id IN (
    SELECT id FROM public.agent_tasks
    WHERE (status = 'queued' AND run_after <= now()) OR (status = 'running' AND locked_until < now() AND attempts < max_attempts)
    ORDER BY priority, run_after
    LIMIT greatest(1, least(p_limit, 25))
    FOR UPDATE SKIP LOCKED)
  RETURNING t.*;
END $$;
REVOKE ALL ON FUNCTION public.agent_claim_tasks(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agent_claim_tasks(integer, integer) TO service_role;

-- Finish a task: done/skipped, or failed → retry with exponential backoff → dead after max attempts.
CREATE OR REPLACE FUNCTION public.agent_finish_task(p_id uuid, p_status text, p_error text DEFAULT NULL, p_result jsonb DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.agent_tasks; final text := p_status;
BEGIN
  SELECT * INTO t FROM public.agent_tasks WHERE id = p_id FOR UPDATE;
  IF t.id IS NULL THEN RETURN 'missing'; END IF;
  IF p_status = 'failed' THEN
    IF t.attempts >= t.max_attempts THEN final := 'dead';
    ELSE
      UPDATE public.agent_tasks SET status = 'queued', locked_until = NULL, last_error = left(p_error, 1000),
        run_after = now() + make_interval(mins => (power(2, t.attempts) * 2)::int) WHERE id = p_id;
      RETURN 'retry';
    END IF;
  END IF;
  UPDATE public.agent_tasks SET status = final, locked_until = NULL, last_error = CASE WHEN p_error IS NULL THEN last_error ELSE left(p_error, 1000) END,
    result = coalesce(p_result, result), finished_at = now() WHERE id = p_id;
  RETURN final;
END $$;
REVOKE ALL ON FUNCTION public.agent_finish_task(uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agent_finish_task(uuid, text, text, jsonb) TO service_role;

-- Due schedules become tasks (one per schedule per run slot, so double ticks can't double-run a job).
CREATE OR REPLACE FUNCTION public.agent_enqueue_due() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; n integer := 0;
BEGIN
  FOR s IN SELECT * FROM public.agent_schedules WHERE enabled AND next_run_at <= now() FOR UPDATE SKIP LOCKED LOOP
    IF public.agent_enqueue(s.id, 'sched:' || s.id || ':' || to_char(s.next_run_at, 'YYYYMMDDHH24MI'), jsonb_build_object('schedule', s.id, 'config', s.config), NULL,
         CASE WHEN s.id IN ('publish', 'followups') THEN 3 ELSE 6 END::smallint) IS NOT NULL THEN n := n + 1; END IF;
    UPDATE public.agent_schedules SET next_run_at = greatest(now(), s.next_run_at) + make_interval(mins => s.interval_minutes), last_run_at = now() WHERE id = s.id;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.agent_enqueue_due() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agent_enqueue_due() TO service_role;

-- Ask the worker to run now (debounced), used by event triggers so replies don't wait for the cron.
CREATE OR REPLACE FUNCTION public.agent_kick(p_source text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE s public.agent_settings; site text; rid bigint;
BEGIN
  SELECT * INTO s FROM public.agent_settings WHERE id = 1;
  IF s IS NULL OR s.paused THEN RETURN; END IF;
  IF s.last_kick_at IS NOT NULL AND s.last_kick_at > now() - interval '20 seconds' THEN RETURN; END IF;
  SELECT site_url INTO site FROM public.blog_settings WHERE id = 1;
  IF site IS NULL THEN RETURN; END IF;
  UPDATE public.agent_settings SET last_kick_at = now() WHERE id = 1;
  SELECT net.http_post(url := site || '/api/agents-tick', body := jsonb_build_object('source', p_source),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-agent-secret', s.tick_secret), timeout_milliseconds := 290000) INTO rid;
  INSERT INTO public.agent_ticks (source, request_id) VALUES (p_source, rid);
EXCEPTION WHEN others THEN NULL;  -- never block the member's write
END $$;
REVOKE ALL ON FUNCTION public.agent_kick(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agent_kick(text) TO service_role;

-- Cron entry point: enqueue due schedules, then call the worker.
CREATE OR REPLACE FUNCTION public.agent_cron_tick() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE s public.agent_settings; site text; rid bigint;
BEGIN
  DELETE FROM public.agent_ticks WHERE started_at < now() - interval '14 days';
  SELECT * INTO s FROM public.agent_settings WHERE id = 1;
  IF s IS NULL OR s.paused THEN RETURN; END IF;
  PERFORM public.agent_enqueue_due();
  IF NOT EXISTS (SELECT 1 FROM public.agent_tasks WHERE (status = 'queued' AND run_after <= now()) OR (status = 'running' AND locked_until < now())) THEN RETURN; END IF;
  SELECT site_url INTO site FROM public.blog_settings WHERE id = 1;
  IF site IS NULL THEN RETURN; END IF;
  UPDATE public.agent_settings SET last_kick_at = now() WHERE id = 1;
  SELECT net.http_post(url := site || '/api/agents-tick', body := '{"source":"cron"}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-agent-secret', s.tick_secret), timeout_milliseconds := 290000) INTO rid;
  INSERT INTO public.agent_ticks (source, request_id) VALUES ('cron', rid);
END $$;
REVOKE ALL ON FUNCTION public.agent_cron_tick() FROM PUBLIC, anon, authenticated;

-- Admin: retry or cancel a task; run a schedule now; pause/resume.
CREATE OR REPLACE FUNCTION public.agent_admin_task(p_id uuid, p_action text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  IF p_action = 'retry' THEN
    UPDATE public.agent_tasks SET status = 'queued', attempts = 0, run_after = now(), locked_until = NULL WHERE id = p_id AND status IN ('failed', 'dead', 'cancelled', 'skipped');
  ELSIF p_action = 'cancel' THEN
    UPDATE public.agent_tasks SET status = 'cancelled', finished_at = now(), locked_until = NULL WHERE id = p_id AND status = 'queued';
  ELSE RAISE EXCEPTION 'Unknown action.'; END IF;
  INSERT INTO public.agent_audit_logs (actor_type, actor_id, action, target_type, target_id) VALUES ('admin', auth.uid(), 'task_' || p_action, 'agent_tasks', p_id::text);
  PERFORM public.agent_kick('admin');
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.agent_admin_task(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agent_admin_task(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.agent_admin_run_schedule(p_id text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.agent_schedules WHERE id = p_id) THEN RAISE EXCEPTION 'Unknown job.'; END IF;
  tid := public.agent_enqueue(p_id, 'manual:' || p_id || ':' || to_char(now(), 'YYYYMMDDHH24MISS'), jsonb_build_object('schedule', p_id, 'manual', true), NULL, 2::smallint);
  INSERT INTO public.agent_audit_logs (actor_type, actor_id, action, target_type, target_id) VALUES ('admin', auth.uid(), 'run_job', 'agent_schedules', p_id);
  UPDATE public.agent_settings SET last_kick_at = NULL WHERE id = 1;
  PERFORM public.agent_kick('admin');
  RETURN tid;
END $$;
REVOKE ALL ON FUNCTION public.agent_admin_run_schedule(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agent_admin_run_schedule(text) TO authenticated;

-- Admin: assign a task to an agent (e.g. "write a post about X", "answer this post").
CREATE OR REPLACE FUNCTION public.agent_admin_assign(p_agent uuid, p_instruction text, p_post uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  IF char_length(btrim(coalesce(p_instruction, ''))) < 5 THEN RAISE EXCEPTION 'Write an instruction.'; END IF;
  tid := public.agent_enqueue('assigned', 'assigned:' || gen_random_uuid()::text, jsonb_build_object('instruction', left(p_instruction, 2000), 'post_id', p_post, 'by', auth.uid()), p_agent, 2::smallint);
  INSERT INTO public.agent_audit_logs (actor_type, actor_id, agent_id, action, target_type, target_id, details) VALUES ('admin', auth.uid(), p_agent, 'assign_task', 'agent_tasks', tid::text, jsonb_build_object('instruction', left(p_instruction, 300)));
  UPDATE public.agent_settings SET last_kick_at = NULL WHERE id = 1;
  PERFORM public.agent_kick('admin');
  RETURN tid;
END $$;
REVOKE ALL ON FUNCTION public.agent_admin_assign(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agent_admin_assign(uuid, text, uuid) TO authenticated;

-- Admin overview (real counts only).
CREATE OR REPLACE FUNCTION public.agent_admin_overview() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE since timestamptz := now() - interval '7 days'; month_start timestamptz := date_trunc('month', now());
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'agents', (SELECT jsonb_build_object('total', count(*), 'enabled', count(*) FILTER (WHERE enabled)) FROM public.agent_profiles WHERE merged_into IS NULL),
    'tasks', (SELECT coalesce(jsonb_object_agg(status, n), '{}'::jsonb) FROM (SELECT status, count(*) n FROM public.agent_tasks WHERE created_at > since OR status IN ('queued', 'running') GROUP BY status) s),
    'actions_7d', (SELECT coalesce(jsonb_object_agg(action, n), '{}'::jsonb) FROM (SELECT action, count(*) n FROM public.agent_community_actions WHERE created_at > since AND ok GROUP BY action) a),
    'questions_answered_7d', (SELECT count(DISTINCT post_id) FROM public.agent_community_actions a JOIN public.community_posts p ON p.id = a.post_id WHERE a.created_at > since AND a.ok AND a.action = 'reply' AND p.kind IN ('question', 'help')),
    'unanswered', (SELECT count(*) FROM public.community_posts p WHERE p.status = 'published' AND p.kind IN ('question', 'help') AND p.created_at > now() - interval '30 days'
                     AND NOT EXISTS (SELECT 1 FROM public.community_comments c WHERE c.post_id = p.id AND c.status = 'visible' AND c.author_id <> p.author_id)),
    'research_7d', (SELECT count(*) FROM public.agent_research_items WHERE created_at > since),
    'content', (SELECT coalesce(jsonb_object_agg(status, n), '{}'::jsonb) FROM (SELECT status, count(*) n FROM public.agent_content_queue GROUP BY status) c),
    'leads', (SELECT coalesce(jsonb_object_agg(stage, n), '{}'::jsonb) FROM (SELECT stage, count(*) n FROM public.agent_lead_records GROUP BY stage) l),
    'handovers', (SELECT count(*) FROM public.agent_handover_states WHERE state IN ('human', 'needs_human')),
    'usage_today', (SELECT jsonb_build_object('calls', count(*), 'failed', count(*) FILTER (WHERE NOT ok), 'tokens', coalesce(sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0)), 0), 'cost', sum(est_cost_usd)) FROM public.agent_usage_records WHERE created_at > date_trunc('day', now())),
    'usage_month', (SELECT jsonb_build_object('calls', count(*), 'tokens', coalesce(sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0)), 0), 'cost', sum(est_cost_usd)) FROM public.agent_usage_records WHERE created_at > month_start),
    'last_tick', (SELECT to_jsonb(t) FROM (SELECT source, started_at, finished_at, claimed, processed, ok, note FROM public.agent_ticks WHERE finished_at IS NOT NULL ORDER BY started_at DESC LIMIT 1) t),
    'ticks_24h', (SELECT jsonb_build_object('requested', count(*), 'completed', count(*) FILTER (WHERE finished_at IS NOT NULL)) FROM public.agent_ticks WHERE started_at > now() - interval '24 hours'),
    'recent_errors', (SELECT coalesce(jsonb_agg(e), '[]'::jsonb) FROM (SELECT kind, error, started_at FROM public.agent_task_runs WHERE ok = false ORDER BY started_at DESC LIMIT 12) e),
    'per_agent', (SELECT coalesce(jsonb_agg(x ORDER BY x->>'name'), '[]'::jsonb) FROM (
       SELECT jsonb_build_object('id', p.id, 'name', p.name, 'slug', p.slug, 'enabled', p.enabled,
         'replies_7d', (SELECT count(*) FROM public.agent_community_actions a WHERE a.agent_id = p.id AND a.action = 'reply' AND a.ok AND a.created_at > since),
         'posts_7d', (SELECT count(*) FROM public.agent_community_actions a WHERE a.agent_id = p.id AND a.action = 'post' AND a.ok AND a.created_at > since),
         'leads', (SELECT count(*) FROM public.agent_lead_records l WHERE l.agent_id = p.id),
         'qualified', (SELECT count(*) FROM public.agent_lead_records l WHERE l.agent_id = p.id AND l.stage IN ('qualified', 'service_recommended', 'consultation_requested', 'quote_requested', 'won')),
         'won', (SELECT count(*) FROM public.agent_lead_records l WHERE l.agent_id = p.id AND l.stage = 'won'),
         'tokens_month', (SELECT coalesce(sum(coalesce(input_tokens, 0) + coalesce(output_tokens, 0)), 0) FROM public.agent_usage_records u WHERE u.agent_id = p.id AND u.created_at > month_start),
         'last_run', (SELECT max(started_at) FROM public.agent_task_runs r WHERE r.agent_id = p.id)) x
       FROM public.agent_profiles p WHERE p.merged_into IS NULL) z)
  );
END $$;
REVOKE ALL ON FUNCTION public.agent_admin_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agent_admin_overview() TO authenticated;

-- ------------------------------------------------------------------ event triggers
CREATE OR REPLACE FUNCTION public.agent_on_post() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'published' OR (TG_OP = 'UPDATE' AND OLD.status = 'published') THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = NEW.author_id AND agent_slug IS NOT NULL) THEN RETURN NULL; END IF;
  PERFORM public.agent_enqueue('post_created', 'post:' || NEW.id::text, jsonb_build_object('post_id', NEW.id), NULL, 4::smallint,
    now() + make_interval(secs => coalesce((SELECT reply_delay_seconds FROM public.agent_settings WHERE id = 1), 60)));
  PERFORM public.agent_kick('post');
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS agent_on_post ON public.community_posts;
CREATE TRIGGER agent_on_post AFTER INSERT OR UPDATE OF status ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.agent_on_post();

-- Member comments become work only when an agent is part of that thread (a reply to an agent,
-- the post author following up after an agent answered, or an @mention of an agent).
CREATE OR REPLACE FUNCTION public.agent_on_comment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE involved boolean := false; post_author uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = NEW.author_id AND agent_slug IS NOT NULL) THEN RETURN NULL; END IF;
  SELECT author_id INTO post_author FROM public.community_posts WHERE id = NEW.post_id;
  IF NEW.parent_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.community_comments c JOIN public.community_profiles p ON p.user_id = c.author_id WHERE c.id = NEW.parent_id AND p.agent_slug IS NOT NULL) THEN involved := true; END IF;
  IF NOT involved AND NEW.author_id = post_author AND EXISTS (SELECT 1 FROM public.community_comments c JOIN public.community_profiles p ON p.user_id = c.author_id WHERE c.post_id = NEW.post_id AND p.agent_slug IS NOT NULL) THEN involved := true; END IF;
  IF NOT involved AND NEW.body ~* ('@(' || coalesce((SELECT string_agg(username, '|') FROM public.community_profiles WHERE agent_slug IS NOT NULL), '^$') || ')\M') THEN involved := true; END IF;
  IF NOT involved THEN RETURN NULL; END IF;
  PERFORM public.agent_enqueue('comment_created', 'comment:' || NEW.id::text, jsonb_build_object('comment_id', NEW.id, 'post_id', NEW.post_id), NULL, 4::smallint,
    now() + make_interval(secs => least(coalesce((SELECT reply_delay_seconds FROM public.agent_settings WHERE id = 1), 60), 120)));
  -- The member answered: a scheduled follow-up for this thread is no longer needed.
  UPDATE public.agent_followup_tasks SET status = 'cancelled', reason = 'member replied' WHERE post_id = NEW.post_id AND member_id = NEW.author_id AND status = 'scheduled';
  PERFORM public.agent_kick('comment');
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS agent_on_comment ON public.community_comments;
CREATE TRIGGER agent_on_comment AFTER INSERT ON public.community_comments FOR EACH ROW EXECUTE FUNCTION public.agent_on_comment();

-- Website forms (leads, bookings, audits, proposals) become lead records for the right specialist.
CREATE OR REPLACE FUNCTION public.agent_on_form() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.agent_enqueue('form_lead', 'form:' || TG_TABLE_NAME || ':' || NEW.id::text, jsonb_build_object('table', TG_TABLE_NAME, 'id', NEW.id), NULL, 3::smallint);
  RETURN NULL;
EXCEPTION WHEN others THEN RETURN NULL;  -- never block a visitor's form
END $$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['leads', 'strategy_bookings', 'site_audits', 'proposal_acceptances'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS agent_on_form ON public.%I', t);
    EXECUTE format('CREATE TRIGGER agent_on_form AFTER INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.agent_on_form()', t);
  END LOOP;
END $$;

-- ------------------------------------------------------------------ schedule
DO $$ BEGIN
  PERFORM cron.unschedule('emmaforyou-agents-tick') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'emmaforyou-agents-tick');
  PERFORM cron.schedule('emmaforyou-agents-tick', '*/2 * * * *', 'select public.agent_cron_tick()');
END $$;

-- ------------------------------------------------------------------ seed directory (generated from src/lib/agents/directory.ts)
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('atlas', 'Atlas', 'General Opportunities & Business Solutions', 'general', 'Intake specialist and coordinator. Takes questions that don''t fit one niche, works out what the member really needs, routes to the right specialist and combines advice when a problem spans several areas.', 'Mixed or unusual business problems, ''where do I start'' questions, anything outside the other specialists'' scope, and new needs EmmaForYou doesn''t serve yet.', 'Calm, practical and curious. Asks one sharp question when the problem is vague. Summarises options plainly and is honest when EmmaForYou isn''t the right fit.', 'Knows the whole catalogue at a high level: websites, business apps, AI solutions, automation, mobile apps, industry solutions, marketing services and the free tools. Never invents a service; suggests the closest real option or an outside route.', ARRAY['start','idea','help','advice','business','problem','which','recommend','options','stuck']::text[], ARRAY['general']::text[], 1, 0) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/tools', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/proposal', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/intake', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/book', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution_category', 'industries', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/solutions', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/checklists', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/compare', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/free-resources', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/knowledge-base', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/portal', 'seed' FROM public.agent_profiles WHERE slug = 'atlas' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('vela', 'Vela', 'Website Strategy Specialist', 'specialist', 'Plans business websites, landing pages, portals and content sites that load fast and turn visitors into enquiries.', 'Website planning, structure, platforms (custom, WordPress), speed, hosting and domains, portals and directories.', 'Clear and structured; likes short checklists and plain explanations of trade-offs.', 'Website types in the catalogue (35), WordPress development, the free website audit and makeover tools.', ARRAY['website','site','landing page','domain','hosting','wordpress','web design','portal','homepage','speed','page']::text[], ARRAY['websites']::text[], 1, 10) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'website-landing-pages', 'seed' FROM public.agent_profiles WHERE slug = 'vela' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'wordpress', 'seed' FROM public.agent_profiles WHERE slug = 'vela' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution_category', 'websites', 'seed' FROM public.agent_profiles WHERE slug = 'vela' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/website-audit', 'seed' FROM public.agent_profiles WHERE slug = 'vela' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/makeover', 'seed' FROM public.agent_profiles WHERE slug = 'vela' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('mercer', 'Mercer', 'Ecommerce & Shopify Growth Specialist', 'specialist', 'Helps people start online stores and helps existing stores sell more: product pages, checkout, Shopify, marketplaces and store operations.', 'Shopify and other store platforms, product research, store audits, checkout and payments, fulfilment, marketplaces, ecommerce apps and AI for stores.', 'Commercially minded and direct; talks in terms of conversion, margin and the customer''s next click.', 'Ecommerce Intelligence tools (/ecommerce/*), ecommerce websites, store and marketplace apps, and the AI retail solutions.', ARRAY['shopify','store','ecommerce','e-commerce','product','checkout','cart','dropship','woocommerce','sales','marketplace','amazon','jumia','inventory','orders','sell']::text[], ARRAY['websites']::text[], 2, 20) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'shopify-ecommerce', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/online-store', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/multi-vendor-marketplace-website', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/dropshipping-store', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/wholesale-b2b-portal', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/digital-products-website', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/ecommerce-store-app', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/multi-vendor-marketplace', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/dropshipping-management', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/print-on-demand', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/point-of-sale-pos', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/order-fulfillment-management', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/product-information-management', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/subscription-recurring-billing', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-shopping-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-product-description-generator', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-product-recommendation-engine', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-abandoned-cart-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-pricing-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-inventory-forecasting', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-order-support-agent', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-catalog-enrichment', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-visual-search', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-review-analyzer', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-fraud-detection', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'ecommerce', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'fashion-store', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/ecommerce', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/ecommerce/start', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/ecommerce/research', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/ecommerce/grow', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/ecommerce/diagnose', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/ecommerce/profit', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/ecommerce/competitors', 'seed' FROM public.agent_profiles WHERE slug = 'mercer' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('lumen', 'Lumen', 'Conversion, Funnels & Copy Specialist', 'specialist', 'Finds why visitors don''t buy or enquire and fixes the path: offers, funnels, copy, sales process and proposals.', 'Conversion rate optimisation, funnels, sales pages, copywriting and messaging, sales process, quoting and proposals.', 'Analytical and encouraging; asks for the numbers first and suggests one test at a time.', 'CRO, funnel building, sales & conversion, copywriting expertise; funnel builder and quoting apps; the ROI calculator.', ARRAY['conversion','convert','funnel','sales page','copy','copywriting','headline','offer','proposal','quote','close','bounce','abandon']::text[], ARRAY['marketing']::text[], 1, 30) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'conversion-rate-optimisation', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'funnel-building', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'sales-conversion', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'copywriting', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/landing-page-sales-funnel', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/landing-page-funnel-builder', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/proposal-contract-management', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/sales-quoting-cpq', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/sales-engagement', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-conversion-rate-optimization', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-proposal-generator', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-sales-call-analyst', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/roi-calculator', 'seed' FROM public.agent_profiles WHERE slug = 'lumen' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('cortex', 'Cortex', 'AI Automation Consultant', 'specialist', 'Turns repetitive work into reliable automated workflows with AI and integrations, from documents and reports to internal operations.', 'AI workflow automation, integrations, document and finance automation, reporting, internal AI assistants, RAG and AI governance.', 'Precise and grounded; explains what can be automated safely and what still needs a person.', 'AI automation expertise, the automation category (8 solutions) and operations-focused AI solutions.', ARRAY['automate','automation','workflow','zapier','make.com','n8n','integration','api','ai','gpt','openai','spreadsheet','report','invoice','document','manual work']::text[], ARRAY['automation','ai-solutions']::text[], 1, 40) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'ai-automation', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution_category', 'automation', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-executive-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-workflow-automation-agent', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-document-processor', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-invoice-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-bookkeeping-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-reporting-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-spreadsheet-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-meeting-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-recruitment-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-hr-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-procurement-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-knowledge-base-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-project-management-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-quality-assurance-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-document-search-extraction', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-compliance-support', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/retrieval-augmented-generation', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/document-image-understanding', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/predictive-analytics', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-governance-controls', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-localization-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-market-research-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-competitor-research-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-customer-segmentation', 'seed' FROM public.agent_profiles WHERE slug = 'cortex' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('relay', 'Relay', 'AI Agent Solutions Specialist', 'specialist', 'Designs customer-facing AI agents: support and sales agents, website chatbots, receptionists and WhatsApp assistants that hand over to people when they should.', 'AI customer support, AI sales agents, chatbots, conversational AI, tool-using agents, AI receptionists, WhatsApp bots.', 'Friendly and concrete; describes how the agent would behave in a real conversation, including when it hands over to a person.', 'Customer-facing AI solutions and the AI receptionist demo.', ARRAY['chatbot','ai agent','agent','assistant','whatsapp bot','customer support','receptionist','bot','conversational','live chat','replies']::text[], ARRAY['ai-solutions']::text[], 1, 50) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution_category', 'ai-solutions', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-customer-support-agent', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-sales-agent', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-website-chatbot', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/conversational-ai', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/tool-using-ai-agents', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-lead-generation-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-lead-research-agent', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-personalized-outreach-writer', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-website-builder', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-review-reputation-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-retention-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/ai-receptionist', 'seed' FROM public.agent_profiles WHERE slug = 'relay' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('forge', 'Forge', 'Business Applications Consultant', 'specialist', 'Helps businesses choose or build the systems they run on: CRM, ERP, booking, inventory, HR, help desk, portals and learning platforms.', 'CRM and customer systems, ERP, project management, HR, inventory, accounting, booking, help desk, LMS and course platforms, community and membership platforms, client portals, document and workflow tools.', 'Methodical; maps the current process first and recommends the simplest system that fits.', 'CRM & customer systems expertise and the 46 business application solutions.', ARRAY['crm','erp','system','software','booking','inventory','hr','help desk','ticket','lms','course','membership','portal','accounting','project management','dashboard','saas']::text[], ARRAY['business-apps']::text[], 1, 60) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'crm-systems', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution_category', 'business-apps', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/client-portal-website', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/employee-portal', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/vendor-portal', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/customer-self-service-portal', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/partner-portal', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/online-learning-platform-website', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/paid-membership-website', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/community-website', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'saas', 'seed' FROM public.agent_profiles WHERE slug = 'forge' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('orbit', 'Orbit', 'Mobile & Web Application Consultant', 'specialist', 'Scopes mobile, desktop and web apps: native vs cross-platform vs PWA, features for a first release, and what it takes to launch.', 'App development, native and cross-platform mobile apps, PWAs, desktop apps, browser extensions and on-demand/field/delivery apps.', 'Pragmatic product thinker; pushes for a small first version and explains technical choices without jargon.', 'App development expertise, the 15 mobile & desktop solutions and the app planner.', ARRAY['app','mobile app','android','ios','iphone','flutter','react native','pwa','desktop app','extension','mvp','play store','app store']::text[], ARRAY['mobile-desktop']::text[], 1, 70) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'app-development', 'seed' FROM public.agent_profiles WHERE slug = 'orbit' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution_category', 'mobile-desktop', 'seed' FROM public.agent_profiles WHERE slug = 'orbit' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/solutions/app-planner', 'seed' FROM public.agent_profiles WHERE slug = 'orbit' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('beacon', 'Beacon', 'SEO & Organic Growth Specialist', 'specialist', 'Helps businesses get found on Google and measure what''s working: technical SEO, local SEO, content and analytics.', 'SEO, Google ranking, local search, content strategy for search, analytics and performance tracking, blogs and publications.', 'Patient teacher; explains why something ranks and sets realistic timelines.', 'SEO and analytics expertise, publishing websites, AI SEO assistant, and the website audit.', ARRAY['seo','google','rank','ranking','search','keywords','traffic','analytics','ga4','search console','blog','backlinks','local seo']::text[], ARRAY['marketing']::text[], 2, 80) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'seo', 'seed' FROM public.agent_profiles WHERE slug = 'beacon' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'analytics', 'seed' FROM public.agent_profiles WHERE slug = 'beacon' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-seo-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'beacon' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/blog-publication', 'seed' FROM public.agent_profiles WHERE slug = 'beacon' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/online-magazine', 'seed' FROM public.agent_profiles WHERE slug = 'beacon' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/online-news-website', 'seed' FROM public.agent_profiles WHERE slug = 'beacon' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/documentation-website', 'seed' FROM public.agent_profiles WHERE slug = 'beacon' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/publishing-platform', 'seed' FROM public.agent_profiles WHERE slug = 'beacon' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('echo', 'Echo', 'Social Media & Content Specialist', 'specialist', 'Builds consistent social media and content that brings in followers who become customers, with automation where it helps.', 'Social media management and automation, content planning and repurposing, creators and podcasts, promotion and brand marketing.', 'Warm and energetic but not hype; gives post ideas and simple weekly routines.', 'Social media automation and marketing & promotion expertise, creator and podcast platforms, AI social and content solutions.', ARRAY['instagram','tiktok','facebook','social media','content','followers','reels','youtube','linkedin','post','engagement','influencer','podcast','brand']::text[], ARRAY['marketing','design']::text[], 2, 90) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'social-media-automation', 'seed' FROM public.agent_profiles WHERE slug = 'echo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'marketing-promotion', 'seed' FROM public.agent_profiles WHERE slug = 'echo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/social-media-management', 'seed' FROM public.agent_profiles WHERE slug = 'echo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-social-media-manager', 'seed' FROM public.agent_profiles WHERE slug = 'echo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-content-repurposing', 'seed' FROM public.agent_profiles WHERE slug = 'echo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/creator-platform-website', 'seed' FROM public.agent_profiles WHERE slug = 'echo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/podcast-website', 'seed' FROM public.agent_profiles WHERE slug = 'echo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/creator-platform', 'seed' FROM public.agent_profiles WHERE slug = 'echo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/podcast-management', 'seed' FROM public.agent_profiles WHERE slug = 'echo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/blog', 'seed' FROM public.agent_profiles WHERE slug = 'echo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('spark', 'Spark', 'Paid Ads & Lead Generation Specialist', 'specialist', 'Helps businesses get predictable leads: Meta and Google ads, lead magnets, lead capture and routing.', 'Facebook/Instagram and Google ads, lead generation systems, lead capture, routing and qualification, advertising budgets and tracking.', 'Numbers-first and candid about budgets; never promises a cost per lead it can''t know.', 'Paid ads and lead generation expertise, AI advertising assistant, lead routing automation.', ARRAY['ads','advert','facebook ads','meta ads','google ads','ppc','leads','lead generation','cost per lead','campaign','budget','roas','pixel']::text[], ARRAY['marketing']::text[], 1, 100) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'paid-ads', 'seed' FROM public.agent_profiles WHERE slug = 'spark' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'lead-generation', 'seed' FROM public.agent_profiles WHERE slug = 'spark' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-advertising-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'spark' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'automation/lead-routing', 'seed' FROM public.agent_profiles WHERE slug = 'spark' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('tempo', 'Tempo', 'Email Marketing & Retention Specialist', 'specialist', 'Keeps customers coming back: email and WhatsApp sequences, newsletters, loyalty, referrals and affiliate programmes.', 'Email marketing and retention, automated sequences, newsletters, loyalty and referral programmes, affiliate management.', 'Thoughtful and customer-centred; talks about the customer''s journey after the first purchase.', 'Email marketing & retention expertise, email workflow automation, loyalty/referral/affiliate apps, the email sequence generator.', ARRAY['email','newsletter','mailchimp','klaviyo','sequence','retention','repeat customers','loyalty','referral','affiliate','unsubscribe','open rate']::text[], ARRAY['marketing']::text[], 1, 110) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'email-marketing', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'automation/email-workflows', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/email-marketing-app', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/marketing-automation', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/loyalty-membership', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/referral-rewards', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/affiliate-management', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/customer-success', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/reputation-management', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'ai-solutions/ai-email-marketing-assistant', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/email-generator', 'seed' FROM public.agent_profiles WHERE slug = 'tempo' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('prism', 'Prism', 'UI/UX Design Specialist', 'specialist', 'Makes websites and apps easy and pleasant to use: layout, navigation, mobile usability, accessibility and design systems.', 'UI/UX design, usability, accessibility, branding in interfaces, redesigns.', 'Visual thinker who explains design in terms of what the user sees and does next.', 'UI/UX design expertise and the AI website makeover tool.', ARRAY['design','ui','ux','user experience','layout','figma','navigation','accessibility','mobile friendly','redesign','branding','logo','colors']::text[], ARRAY['design']::text[], 1, 120) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'ui-ux-design', 'seed' FROM public.agent_profiles WHERE slug = 'prism' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('keystone', 'Keystone', 'Web3 & Blockchain Specialist', 'specialist', 'Explains and scopes blockchain projects: dApps, smart contracts, tokens and NFTs, with security first.', 'Web3 and dApp development, smart contracts and Solidity, blockchain and crypto projects, contract security reviews.', 'Careful and security-minded; separates what''s technically possible from what''s legally or financially sensible.', 'Web3, smart contract and blockchain expertise and the smart contract check tool. Never gives investment advice.', ARRAY['web3','blockchain','crypto','smart contract','solidity','token','nft','dapp','ethereum','solana','wallet','defi']::text[], ARRAY['general']::text[], 1, 130) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'web3-development', 'seed' FROM public.agent_profiles WHERE slug = 'keystone' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'smart-contract-development', 'seed' FROM public.agent_profiles WHERE slug = 'keystone' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'blockchain-crypto', 'seed' FROM public.agent_profiles WHERE slug = 'keystone' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/smart-contract-check', 'seed' FROM public.agent_profiles WHERE slug = 'keystone' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('compass', 'Compass', 'Business Strategy & Growth Coach', 'specialist', 'Helps owners decide what to focus on: digital strategy, priorities, 90-day plans and staying accountable.', 'Business consulting, digital marketing strategy, accountability coaching, planning and prioritisation.', 'Supportive and honest; turns big goals into this week''s three actions.', 'Business consulting, digital strategy and accountability coaching expertise; goal planner, growth assessment and growth quiz.', ARRAY['strategy','plan','goals','growth','focus','priorit','coach','accountability','scale','pricing my services','business plan','consulting']::text[], ARRAY['general','marketing']::text[], 1, 140) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'business-consulting', 'seed' FROM public.agent_profiles WHERE slug = 'compass' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'digital-strategy', 'seed' FROM public.agent_profiles WHERE slug = 'compass' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'expertise', 'accountability-coaching', 'seed' FROM public.agent_profiles WHERE slug = 'compass' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'coach', 'seed' FROM public.agent_profiles WHERE slug = 'compass' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/goal-planner', 'seed' FROM public.agent_profiles WHERE slug = 'compass' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/analyser', 'seed' FROM public.agent_profiles WHERE slug = 'compass' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'tool', '/growth-quiz', 'seed' FROM public.agent_profiles WHERE slug = 'compass' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('harbor', 'Harbor', 'Hospitality, Lifestyle & Creative Industries Specialist', 'specialist', 'Digital systems for restaurants, hotels, travel, fitness, beauty, entertainment and photography businesses: bookings, menus, memberships and repeat visits.', 'Restaurants, hospitality, travel, fitness, beauty and salons, music and entertainment, photography and video.', 'Warm and service-minded; thinks about the guest''s experience from booking to review.', 'Industry solutions and niche pages for these sectors, booking and restaurant websites, event and rental sites.', ARRAY['restaurant','menu','hotel','guest','travel','tour','gym','fitness','salon','beauty','spa','barber','music','artist','photography','event','booking']::text[], ARRAY['industries']::text[], 1, 150) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'restaurants', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'hospitality', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'travel', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'fitness', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'beauty-salons', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'music-entertainment', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'photography-video', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'restaurant', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'hotel', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'salon', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'gym', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/restaurant-website', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/booking-reservation-website', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/event-website', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/rental-website', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/appointment-booking-app', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/webinar-event-platform', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'mobile-desktop/health-fitness-app', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'mobile-desktop/travel-app', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'automation/appointment-reminders', 'seed' FROM public.agent_profiles WHERE slug = 'harbor' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('sage', 'Sage', 'Professional & Regulated Services Specialist', 'specialist', 'Digital systems for clinics, law firms, financial services, insurance, real estate, recruitment, schools and non-profits, with privacy and compliance in mind.', 'Healthcare, legal, financial services, insurance, real estate, recruitment, education, non-profits and professional services.', 'Measured and trustworthy; flags privacy and compliance questions and suggests checking with a qualified professional where needed.', 'Industry solutions and niche pages for these sectors, professional service and directory websites, portals and job boards.', ARRAY['clinic','doctor','patient','health','law','legal','lawyer','finance','bank','insurance','real estate','property','agent','recruitment','hiring','school','education','nonprofit','ngo','church']::text[], ARRAY['industries']::text[], 1, 160) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'healthcare', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'legal', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'financial-services', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'insurance', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'real-estate', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'recruitment', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'education', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'nonprofits', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'clinic', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'real-estate', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'school', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/professional-service-website', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/real-estate-portal', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/education-portal', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/government-nonprofit-portal', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/job-board', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/business-directory', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/classified-listings-website', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/corporate-business-website', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/portfolio-agency-website', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/saas-website', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'websites/subscription-website', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'mobile-desktop/financial-management-app', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/learning-management-system', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/online-course-marketplace', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/coaching-platform', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/digital-signature-platform', 'seed' FROM public.agent_profiles WHERE slug = 'sage' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_profiles (slug, name, title, kind, description, scope, voice, knowledge, keywords, topics, posts_per_week, sort) VALUES ('anvil', 'Anvil', 'Operations & Field Industries Specialist', 'specialist', 'Digital systems for logistics, construction, manufacturing, agriculture and automotive businesses: tracking, field teams, quotes and inventory.', 'Logistics and delivery, construction, manufacturing, agriculture, automotive and dealerships, field service and IoT.', 'Down-to-earth and operational; starts from how work actually happens on site or on the road.', 'Industry solutions and niche pages for these sectors, field service, delivery and IoT apps, payment and reporting automation.', ARRAY['logistics','delivery','fleet','warehouse','construction','contractor','manufacturing','factory','farm','agriculture','car','dealer','automotive','mechanic','field','dispatch','iot']::text[], ARRAY['industries']::text[], 1, 170) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'logistics', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'construction', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'manufacturing', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'agriculture', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'industry', 'automotive', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'niche', 'auto-dealer', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'mobile-desktop/field-service-app', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'mobile-desktop/delivery-app', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'mobile-desktop/on-demand-service-app', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'mobile-desktop/iot-smart-device-app', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/inventory-warehouse-management', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, source) SELECT id, 'solution', 'business-apps/erp-business-management', 'seed' FROM public.agent_profiles WHERE slug = 'anvil' ON CONFLICT DO NOTHING;
-- Identities for any agent that doesn't have one yet.
DO $$ DECLARE r record; BEGIN FOR r IN SELECT id FROM public.agent_profiles WHERE user_id IS NULL LOOP PERFORM public.agent_ensure_identity(r.id); END LOOP; END $$;

-- ------------------------------------------------------------------ admin + member extras
-- Merge one agent into another: its niches, open leads and queued work move; it is disabled and marked merged.
CREATE OR REPLACE FUNCTION public.agent_admin_merge(p_from uuid, p_into uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE moved integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  IF p_from = p_into OR NOT EXISTS (SELECT 1 FROM public.agent_profiles WHERE id = p_into AND merged_into IS NULL) THEN RAISE EXCEPTION 'Choose a different, active agent to merge into.'; END IF;
  INSERT INTO public.agent_niche_assignments (agent_id, niche_type, niche_key, is_primary, source)
    SELECT p_into, niche_type, niche_key, is_primary, 'admin' FROM public.agent_niche_assignments WHERE agent_id = p_from ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS moved = ROW_COUNT;
  DELETE FROM public.agent_niche_assignments WHERE agent_id = p_from;
  UPDATE public.agent_lead_records SET agent_id = p_into WHERE agent_id = p_from AND stage NOT IN ('won', 'lost', 'not_suitable');
  UPDATE public.agent_tasks SET agent_id = p_into WHERE agent_id = p_from AND status = 'queued';
  UPDATE public.agent_content_queue SET agent_id = p_into WHERE agent_id = p_from AND status IN ('draft', 'pending_review', 'scheduled');
  UPDATE public.agent_followup_tasks SET agent_id = p_into WHERE agent_id = p_from AND status = 'scheduled';
  UPDATE public.agent_profiles SET merged_into = p_into, enabled = false WHERE id = p_from;
  INSERT INTO public.agent_audit_logs (actor_type, actor_id, agent_id, action, target_type, target_id, details)
    VALUES ('admin', auth.uid(), p_from, 'merge_agent', 'agent_profiles', p_into::text, jsonb_build_object('niches_moved', moved));
  RETURN moved;
END $$;
REVOKE ALL ON FUNCTION public.agent_admin_merge(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agent_admin_merge(uuid, uuid) TO authenticated;

-- Members can see and delete what the agents remember about them.
GRANT DELETE ON public.agent_conversation_context TO authenticated;
DROP POLICY IF EXISTS agent_context_own_read ON public.agent_conversation_context;
CREATE POLICY agent_context_own_read ON public.agent_conversation_context FOR SELECT TO authenticated USING (member_id = auth.uid());
DROP POLICY IF EXISTS agent_context_own_delete ON public.agent_conversation_context;
CREATE POLICY agent_context_own_delete ON public.agent_conversation_context FOR DELETE TO authenticated USING (member_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Members can't present themselves as an AI agent (agent names or the "_ai" username suffix).
CREATE OR REPLACE FUNCTION public.agent_protect_identity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NEW.agent_slug IS NOT NULL OR public.community_is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF lower(NEW.username) ~ '_ai$' THEN RAISE EXCEPTION 'Usernames ending in _ai are reserved for EmmaForYou AI agents.' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.agent_profiles WHERE lower(name) = lower(btrim(NEW.display_name))) AND (TG_OP = 'INSERT' OR NEW.display_name IS DISTINCT FROM OLD.display_name) THEN
    RAISE EXCEPTION 'That name belongs to an EmmaForYou AI agent. Please choose another.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS agent_protect_identity ON public.community_profiles;
CREATE TRIGGER agent_protect_identity BEFORE INSERT OR UPDATE OF username, display_name ON public.community_profiles FOR EACH ROW EXECUTE FUNCTION public.agent_protect_identity();

-- Disabled or merged agents are suspended in the community so nothing can post as them.
CREATE OR REPLACE FUNCTION public.agent_sync_suspension() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND (NEW.enabled, NEW.merged_into) IS DISTINCT FROM (OLD.enabled, OLD.merged_into) THEN
    UPDATE public.community_profiles SET suspended_at = CASE WHEN NEW.enabled AND NEW.merged_into IS NULL THEN NULL ELSE coalesce(suspended_at, now()) END WHERE user_id = NEW.user_id;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS agent_sync_suspension ON public.agent_profiles;
CREATE TRIGGER agent_sync_suspension AFTER UPDATE OF enabled, merged_into ON public.agent_profiles FOR EACH ROW EXECUTE FUNCTION public.agent_sync_suspension();
