-- Daily posting rota: only `daily_posters` agents publish each day (default 5; 0 = every posting agent),
-- chosen by who has gone longest without a daily post. Off-rota agents keep a tracker row marked
-- on_rota = false / status 'skipped', so the dashboard shows the whole roster honestly.
ALTER TABLE public.agent_settings ADD COLUMN IF NOT EXISTS daily_posters integer NOT NULL DEFAULT 5 CHECK (daily_posters BETWEEN 0 AND 100);
GRANT SELECT (daily_posters) ON public.agent_settings TO authenticated;
GRANT UPDATE (daily_posters) ON public.agent_settings TO authenticated;
ALTER TABLE public.agent_daily_posts ADD COLUMN IF NOT EXISTS on_rota boolean NOT NULL DEFAULT true;

-- Health: targets count only agents on today's rota.
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
    'daily', (SELECT jsonb_build_object('agents', count(*) FILTER (WHERE status <> 'skipped' OR published_count > 0), 'met', count(*) FILTER (WHERE published_count >= target), 'failed', count(*) FILTER (WHERE status = 'failed'), 'alerts', count(*) FILTER (WHERE alerted_at IS NOT NULL), 'off_rota', count(*) FILTER (WHERE NOT on_rota AND published_count = 0)) FROM public.agent_daily_posts WHERE day = d),
    'leads_awaiting', (SELECT count(*) FROM public.agent_lead_records WHERE stage = 'awaiting_human' AND NOT human_override),
    'replies_today', (SELECT count(*) FROM public.agent_community_actions WHERE action IN ('reply', 'followup') AND ok AND post_id IS NOT NULL AND created_at >= day0),
    'active_claims', (SELECT count(*) FROM public.agent_action_claims WHERE state = 'claimed' AND expires_at > now())
  );
END $$;
REVOKE ALL ON FUNCTION public.agent_admin_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agent_admin_health() TO authenticated;
