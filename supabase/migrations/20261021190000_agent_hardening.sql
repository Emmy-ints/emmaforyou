-- Agent team hardening: atomic action claims (no duplicate replies/posts across concurrent workers),
-- limits enforced under a lock, scheduler health and alerts in the admin overview.

-- ------------------------------------------------------------------ claims
-- One row per public action target. A worker must claim the target before generating; the claim
-- expires (so a crashed worker can't block it), and 'done' is permanent (so a retry can't repeat it).
CREATE TABLE IF NOT EXISTS public.agent_action_claims (
  target text PRIMARY KEY CHECK (char_length(target) <= 200),
  agent_id uuid REFERENCES public.agent_profiles(id) ON DELETE SET NULL,
  member_id uuid,
  post_id uuid,
  task_id uuid,
  state text NOT NULL CHECK (state IN ('claimed', 'done', 'released')),
  outcome text,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS agent_claims_member_idx ON public.agent_action_claims (member_id, claimed_at) WHERE state = 'claimed';
CREATE INDEX IF NOT EXISTS agent_claims_post_idx ON public.agent_action_claims (post_id) WHERE state = 'claimed';
ALTER TABLE public.agent_action_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agent_action_claims FROM anon, authenticated;
GRANT ALL ON public.agent_action_claims TO service_role;
GRANT SELECT ON public.agent_action_claims TO authenticated;
DROP POLICY IF EXISTS agent_claims_admin_read ON public.agent_action_claims;
CREATE POLICY agent_claims_admin_read ON public.agent_action_claims FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Start of the current local day in the team's timezone.
CREATE OR REPLACE FUNCTION public.agent_day_start() RETURNS timestamptz LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT (date_trunc('day', now() AT TIME ZONE coalesce((SELECT timezone FROM public.agent_settings WHERE id = 1), 'Africa/Lagos'))) AT TIME ZONE coalesce((SELECT timezone FROM public.agent_settings WHERE id = 1), 'Africa/Lagos')
$$;

-- Claim a target. Returns 'ok', 'done' (already completed), 'taken' (another worker holds it),
-- 'member_limit' or 'thread_limit'. Limits count completed community replies/follow-ups today
-- (private assistant chats excluded) plus other workers' live claims, under per-member and per-post locks.
CREATE OR REPLACE FUNCTION public.agent_claim(p_target text, p_task uuid, p_agent uuid DEFAULT NULL, p_member uuid DEFAULT NULL, p_post uuid DEFAULT NULL,
  p_ttl_seconds integer DEFAULT 300, p_member_limit integer DEFAULT NULL, p_thread_limit integer DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.agent_action_claims; used integer; day0 timestamptz := public.agent_day_start();
BEGIN
  IF p_member IS NOT NULL THEN PERFORM pg_advisory_xact_lock(hashtextextended('agent-member:' || p_member::text, 0)); END IF;
  IF p_post IS NOT NULL THEN PERFORM pg_advisory_xact_lock(hashtextextended('agent-post:' || p_post::text, 0)); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('agent-target:' || p_target, 0));
  SELECT * INTO c FROM public.agent_action_claims WHERE target = p_target FOR UPDATE;
  IF c.target IS NOT NULL THEN
    IF c.state = 'done' THEN RETURN 'done'; END IF;
    IF c.state = 'claimed' AND c.expires_at > now() AND c.task_id IS DISTINCT FROM p_task THEN RETURN 'taken'; END IF;
  END IF;
  IF p_member IS NOT NULL AND p_member_limit IS NOT NULL THEN
    SELECT (SELECT count(*) FROM public.agent_community_actions a WHERE a.member_id = p_member AND a.ok AND a.action IN ('reply', 'followup') AND a.post_id IS NOT NULL AND a.created_at >= day0)
         + (SELECT count(*) FROM public.agent_action_claims k WHERE k.member_id = p_member AND k.state = 'claimed' AND k.expires_at > now() AND k.target <> p_target)
      INTO used;
    IF used >= p_member_limit THEN RETURN 'member_limit'; END IF;
  END IF;
  IF p_post IS NOT NULL AND p_thread_limit IS NOT NULL THEN
    SELECT (SELECT count(*) FROM public.agent_community_actions a WHERE a.post_id = p_post AND a.ok AND a.action IN ('reply', 'followup'))
         + (SELECT count(*) FROM public.agent_action_claims k WHERE k.post_id = p_post AND k.state = 'claimed' AND k.expires_at > now() AND k.target <> p_target)
      INTO used;
    IF used >= p_thread_limit THEN RETURN 'thread_limit'; END IF;
  END IF;
  INSERT INTO public.agent_action_claims (target, agent_id, member_id, post_id, task_id, state, claimed_at, expires_at, outcome, finished_at)
  VALUES (p_target, p_agent, p_member, p_post, p_task, 'claimed', now(), now() + make_interval(secs => greatest(30, least(p_ttl_seconds, 1800))), NULL, NULL)
  ON CONFLICT (target) DO UPDATE SET agent_id = EXCLUDED.agent_id, member_id = EXCLUDED.member_id, post_id = EXCLUDED.post_id, task_id = EXCLUDED.task_id,
    state = 'claimed', claimed_at = now(), expires_at = EXCLUDED.expires_at, outcome = NULL, finished_at = NULL;
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.agent_claim(text, uuid, uuid, uuid, uuid, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agent_claim(text, uuid, uuid, uuid, uuid, integer, integer, integer) TO service_role;

-- Finish a claim: 'done' is permanent, 'released' lets a later re-check claim it again.
CREATE OR REPLACE FUNCTION public.agent_finish_claim(p_target text, p_task uuid, p_state text, p_outcome text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_state NOT IN ('done', 'released') THEN RAISE EXCEPTION 'bad state'; END IF;
  UPDATE public.agent_action_claims SET state = p_state, outcome = left(p_outcome, 300), finished_at = now()
   WHERE target = p_target AND task_id IS NOT DISTINCT FROM p_task AND state = 'claimed';
END $$;
REVOKE ALL ON FUNCTION public.agent_finish_claim(text, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.agent_finish_claim(text, uuid, text, text) TO service_role;

-- ------------------------------------------------------------------ overview: scheduler health, stuck work, alerts
CREATE OR REPLACE FUNCTION public.agent_admin_health() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, cron AS $$
DECLARE day0 timestamptz := public.agent_day_start(); d date := (now() AT TIME ZONE coalesce((SELECT timezone FROM public.agent_settings WHERE id = 1), 'Africa/Lagos'))::date;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'day', d,
    'scheduler', (SELECT jsonb_build_object('job', j.jobname, 'schedule', j.schedule, 'active', j.active,
        'last_run', (SELECT max(start_time) FROM cron.job_run_details r WHERE r.jobid = j.jobid),
        'failed_24h', (SELECT count(*) FROM cron.job_run_details r WHERE r.jobid = j.jobid AND r.status <> 'succeeded' AND r.start_time > now() - interval '24 hours'),
        'runs_24h', (SELECT count(*) FROM cron.job_run_details r WHERE r.jobid = j.jobid AND r.start_time > now() - interval '24 hours'))
      FROM cron.job j WHERE j.jobname = 'emmaforyou-agents-tick'),
    'worker', (SELECT jsonb_build_object('last_completed', max(finished_at), 'requested_1h', count(*) FILTER (WHERE started_at > now() - interval '1 hour'),
        'completed_1h', count(*) FILTER (WHERE finished_at IS NOT NULL AND started_at > now() - interval '1 hour')) FROM public.agent_ticks WHERE source LIKE 'worker:%' OR source IN ('cron', 'post', 'comment', 'admin')),
    'stuck_tasks', (SELECT count(*) FROM public.agent_tasks WHERE status = 'running' AND locked_until < now()),
    'overdue_tasks', (SELECT count(*) FROM public.agent_tasks WHERE status = 'queued' AND run_after < now() - interval '15 minutes'),
    'dead_tasks_7d', (SELECT count(*) FROM public.agent_tasks WHERE status = 'dead' AND updated_at > now() - interval '7 days'),
    'daily', (SELECT jsonb_build_object('agents', count(*), 'met', count(*) FILTER (WHERE published_count >= target), 'failed', count(*) FILTER (WHERE status = 'failed'), 'alerts', count(*) FILTER (WHERE alerted_at IS NOT NULL)) FROM public.agent_daily_posts WHERE day = d),
    'leads_awaiting', (SELECT count(*) FROM public.agent_lead_records WHERE stage = 'awaiting_human' AND NOT human_override),
    'replies_today', (SELECT count(*) FROM public.agent_community_actions WHERE action IN ('reply', 'followup') AND ok AND post_id IS NOT NULL AND created_at >= day0),
    'active_claims', (SELECT count(*) FROM public.agent_action_claims WHERE state = 'claimed' AND expires_at > now())
  );
END $$;
REVOKE ALL ON FUNCTION public.agent_admin_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agent_admin_health() TO authenticated;
