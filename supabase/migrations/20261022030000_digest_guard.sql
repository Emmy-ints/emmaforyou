-- The digest's duplicate guard was 20 hours, so an earlier (test) send could block that evening's digest.
-- Sends happen only in the 30-minute slot after the posting window, so a 2-hour guard is enough.
CREATE OR REPLACE FUNCTION public.agent_owner_digest() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, cron AS $$
DECLARE
  tz text := coalesce((SELECT timezone FROM public.agent_settings WHERE id = 1), 'Africa/Lagos');
  d date := (now() AT TIME ZONE tz)::date; day0 timestamptz := public.agent_day_start(); site text := public.owner_site_url();
  n_agents int; n_met int; missed text; replies int; leads int; lead_rows text; reports int; dead int; stuck int; cron_failed int; cost numeric; html text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.lead_alert_log WHERE source_table = 'agent_digest' AND created_at > now() - interval '2 hours') THEN RETURN false; END IF;
  SELECT count(*), count(*) FILTER (WHERE published_count >= target) INTO n_agents, n_met FROM public.agent_daily_posts WHERE day = d AND status <> 'skipped';
  SELECT string_agg('<li>' || public.owner_alert_esc(p.name) || ': ' || public.owner_alert_esc(coalesce(left(dp.last_error, 140), dp.status)) || '</li>', '' ORDER BY p.sort)
    INTO missed FROM public.agent_daily_posts dp JOIN public.agent_profiles p ON p.id = dp.agent_id WHERE dp.day = d AND dp.status <> 'skipped' AND dp.published_count < dp.target;
  SELECT count(*) INTO replies FROM public.agent_community_actions WHERE action IN ('reply', 'followup') AND ok AND post_id IS NOT NULL AND created_at >= day0;
  SELECT count(*) INTO leads FROM public.agent_lead_records WHERE stage = 'awaiting_human' AND NOT human_override;
  SELECT string_agg('<li>' || public.owner_alert_esc(left(need, 140)) || ' <span style="color:#6b7280">(' || to_char(created_at AT TIME ZONE tz, 'DD Mon') || ')</span></li>', '' ORDER BY created_at DESC)
    INTO lead_rows FROM (SELECT need, created_at FROM public.agent_lead_records WHERE stage = 'awaiting_human' AND NOT human_override ORDER BY created_at DESC LIMIT 5) x;
  SELECT count(*) INTO reports FROM public.community_reports WHERE status = 'open';
  SELECT count(*) INTO dead FROM public.agent_tasks WHERE status = 'dead' AND updated_at > now() - interval '24 hours';
  SELECT count(*) INTO stuck FROM public.agent_tasks WHERE (status = 'running' AND locked_until < now()) OR (status = 'queued' AND run_after < now() - interval '15 minutes');
  SELECT count(*) INTO cron_failed FROM cron.job_run_details r JOIN cron.job j ON j.jobid = r.jobid WHERE j.jobname = 'emmaforyou-agents-tick' AND r.status <> 'succeeded' AND r.start_time > now() - interval '24 hours';
  SELECT coalesce(sum(est_cost_usd), 0) INTO cost FROM public.agent_usage_records WHERE created_at >= day0;

  html := '<h2 style="margin:0 0 4px">Your AI team today (' || to_char(d, 'DD Mon YYYY') || ')</h2>' ||
    '<p style="margin:0 0 14px;color:#6b7280">Daily posts: <b>' || n_met || ' of ' || n_agents || '</b> agents met their target · Community replies: <b>' || replies || '</b> · Estimated AI cost: <b>$' || round(cost, 2) || '</b></p>' ||
    CASE WHEN missed IS NOT NULL THEN '<h3 style="margin:16px 0 4px;color:#b45309">Missed daily posts</h3><ul>' || missed || '</ul>' ELSE '' END ||
    '<h3 style="margin:16px 0 4px">Enquiries waiting for you: ' || leads || '</h3>' || CASE WHEN lead_rows IS NOT NULL THEN '<ul>' || lead_rows || '</ul>' ELSE '' END ||
    '<h3 style="margin:16px 0 4px">Community reports to review: ' || reports || '</h3>' ||
    CASE WHEN reports > 0 THEN '<p><a href="' || site || '/community/moderation" style="color:#6d28d9">Open the moderation queue</a></p>' ELSE '' END ||
    CASE WHEN dead + stuck + cron_failed > 0 THEN '<h3 style="margin:16px 0 4px;color:#b91c1c">Needs attention</h3><ul>' ||
      CASE WHEN dead > 0 THEN '<li>' || dead || ' task(s) failed permanently in the last 24 hours</li>' ELSE '' END ||
      CASE WHEN stuck > 0 THEN '<li>' || stuck || ' task(s) stuck or overdue</li>' ELSE '' END ||
      CASE WHEN cron_failed > 0 THEN '<li>The scheduler failed ' || cron_failed || ' time(s) in the last 24 hours</li>' ELSE '' END || '</ul>' ELSE '' END ||
    '<p style="margin-top:18px"><a href="' || site || '/dashboard/agents" style="color:#6d28d9;font-weight:600">Open the Agent Control Center</a></p>';
  RETURN public.owner_alert_send('agent_digest',
    'AI team: ' || n_met || '/' || n_agents || ' daily posts · ' || leads || ' enquir' || CASE WHEN leads = 1 THEN 'y' ELSE 'ies' END || ' waiting' || CASE WHEN reports > 0 THEN ' · ' || reports || ' report(s)' ELSE '' END,
    html);
END $$;
