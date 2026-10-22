-- Owner alerts by email (Resend, same Vault secrets as the lead alerts: 'resend_api_key', 'lead_alert_to').
-- 1. A community enquiry an agent referred to Emmanuel (lead stage 'awaiting_human') is emailed at once.
-- 2. A daily digest after the publishing window: daily-post targets, replies, leads waiting, open reports,
--    failed/stuck work, scheduler failures and AI cost.
-- 3. A watchdog emails if the background worker or scheduler stops (at most once every 6 hours).
-- Sending never blocks or fails the change that triggered it.

CREATE OR REPLACE FUNCTION public.owner_alert_esc(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;')
$$;

-- Send one email to the owner. Returns false when not configured, rate-limited or failed to queue.
CREATE OR REPLACE FUNCTION public.owner_alert_send(p_kind text, p_subject text, p_html text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE api_key text; alert_to text;
BEGIN
  SELECT decrypted_secret INTO api_key FROM vault.decrypted_secrets WHERE name = 'resend_api_key';
  SELECT decrypted_secret INTO alert_to FROM vault.decrypted_secrets WHERE name = 'lead_alert_to';
  IF api_key IS NULL OR alert_to IS NULL THEN RETURN false; END IF;
  IF (SELECT count(*) FROM public.lead_alert_log WHERE created_at > now() - interval '1 hour') >= 40 THEN RETURN false; END IF;
  INSERT INTO public.lead_alert_log (source_table) VALUES (left(p_kind, 60));
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object('from', 'EmmaForYou Alerts <onboarding@resend.dev>', 'to', jsonb_build_array(alert_to),
      'subject', left(p_subject, 180),
      'html', '<div style="font-family:Arial,sans-serif;max-width:600px;color:#111827;font-size:14px;line-height:1.5">' || p_html ||
        '<p style="margin-top:24px;font-size:12px;color:#9ca3af">Automatic alert from your EmmaForYou website.</p></div>'));
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.owner_alert_send(text, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.owner_site_url() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT rtrim(coalesce((SELECT nullif(site_url, '') FROM public.blog_settings WHERE id = 1), 'https://emmaforyou.lovable.app'), '/')
$$;
REVOKE ALL ON FUNCTION public.owner_site_url() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------ 1. referred enquiries
CREATE OR REPLACE FUNCTION public.agent_lead_alert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE agent_name text; member text; site text := public.owner_site_url(); post_link text := '';
BEGIN
  IF NEW.stage <> 'awaiting_human' OR NEW.human_override THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.stage = 'awaiting_human' THEN RETURN NEW; END IF;
  SELECT name INTO agent_name FROM public.agent_profiles WHERE id = NEW.agent_id;
  SELECT coalesce(nullif(display_name, ''), username) INTO member FROM public.community_profiles WHERE user_id = NEW.member_id;
  IF NEW.post_id IS NOT NULL THEN
    post_link := '<p><a href="' || site || '/community/post/' || NEW.post_id || '" style="color:#6d28d9;font-weight:600">Open the conversation</a></p>';
  END IF;
  PERFORM public.owner_alert_send('agent_lead',
    'New enquiry for you: ' || left(coalesce(NEW.need, 'community member'), 120),
    '<h2 style="margin:0 0 6px">A community member needs you</h2>' ||
    '<p style="margin:0 0 14px;color:#6b7280">' || public.owner_alert_esc(coalesce(agent_name, 'An agent')) || ' referred this to you. The member was told you review enquiries via /contact; they were not promised a price or a date.</p>' ||
    '<table style="border-collapse:collapse">' ||
    '<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Member</td><td>' || public.owner_alert_esc(coalesce(member, 'Community member')) || '</td></tr>' ||
    '<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Need</td><td>' || public.owner_alert_esc(NEW.need) || '</td></tr>' ||
    CASE WHEN NEW.service_path IS NOT NULL THEN '<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Closest page</td><td>' || public.owner_alert_esc(NEW.service_path) || '</td></tr>' ELSE '' END ||
    CASE WHEN NEW.evidence IS NOT NULL THEN '<tr><td style="padding:4px 12px 4px 0;color:#6b7280;vertical-align:top">Their words</td><td>' || public.owner_alert_esc(left(NEW.evidence::text, 800)) || '</td></tr>' ELSE '' END ||
    CASE WHEN NEW.next_action IS NOT NULL THEN '<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Suggested next step</td><td>' || public.owner_alert_esc(NEW.next_action) || '</td></tr>' ELSE '' END ||
    '</table>' || post_link ||
    '<p><a href="' || site || '/dashboard/agents" style="color:#6d28d9">See all leads in the Agent Control Center</a></p>');
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.agent_lead_alert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS agent_lead_alert ON public.agent_lead_records;
CREATE TRIGGER agent_lead_alert AFTER INSERT OR UPDATE OF stage ON public.agent_lead_records FOR EACH ROW EXECUTE FUNCTION public.agent_lead_alert();

-- ------------------------------------------------------------------ 2. daily digest
CREATE OR REPLACE FUNCTION public.agent_owner_digest() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, cron AS $$
DECLARE
  tz text := coalesce((SELECT timezone FROM public.agent_settings WHERE id = 1), 'Africa/Lagos');
  d date := (now() AT TIME ZONE tz)::date; day0 timestamptz := public.agent_day_start(); site text := public.owner_site_url();
  n_agents int; n_met int; missed text; replies int; leads int; lead_rows text; reports int; dead int; stuck int; cron_failed int; cost numeric; html text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.lead_alert_log WHERE source_table = 'agent_digest' AND created_at > now() - interval '20 hours') THEN RETURN false; END IF;
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
REVOKE ALL ON FUNCTION public.agent_owner_digest() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------ 3. watchdog
CREATE OR REPLACE FUNCTION public.agent_watchdog() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, cron AS $$
DECLARE last_done timestamptz; cron_failed int; problem text;
BEGIN
  IF coalesce((SELECT paused FROM public.agent_settings WHERE id = 1), false) THEN RETURN 'paused'; END IF;
  SELECT max(finished_at) INTO last_done FROM public.agent_ticks;
  SELECT count(*) INTO cron_failed FROM cron.job_run_details r JOIN cron.job j ON j.jobid = r.jobid WHERE j.jobname = 'emmaforyou-agents-tick' AND r.status <> 'succeeded' AND r.start_time > now() - interval '30 minutes';
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'emmaforyou-agents-tick' AND active) THEN problem := 'The scheduler job is missing or switched off.';
  ELSIF cron_failed >= 5 THEN problem := 'The scheduler failed ' || cron_failed || ' times in the last 30 minutes.';
  ELSIF last_done IS NULL OR last_done < now() - interval '30 minutes' THEN problem := 'The background worker has not completed a run since ' || coalesce(to_char(last_done AT TIME ZONE 'UTC', 'DD Mon HH24:MI') || ' UTC', 'it was set up') || '. Agents are not replying or posting.';
  END IF;
  IF problem IS NULL THEN RETURN 'ok'; END IF;
  IF EXISTS (SELECT 1 FROM public.lead_alert_log WHERE source_table = 'agent_watchdog' AND created_at > now() - interval '6 hours') THEN RETURN 'already alerted'; END IF;
  PERFORM public.owner_alert_send('agent_watchdog', 'Action needed: your AI team has stopped',
    '<h2 style="margin:0 0 6px;color:#b91c1c">Your AI team has stopped working</h2><p>' || public.owner_alert_esc(problem) || '</p>' ||
    '<p>Open the Overview tab of the <a href="' || public.owner_site_url() || '/dashboard/agents" style="color:#6d28d9">Agent Control Center</a> to see the health panel. If the site was just republished, this usually clears within a few minutes.</p>');
  RETURN 'alerted';
END $$;
REVOKE ALL ON FUNCTION public.agent_watchdog() FROM PUBLIC, anon, authenticated;

-- Schedules (pg_cron runs in UTC). Digest at 21:45 in the team's timezone is computed per run, so a
-- timezone change in settings is respected: the job runs every 15 minutes and sends only in that slot.
CREATE OR REPLACE FUNCTION public.agent_owner_digest_due() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tz text := coalesce((SELECT timezone FROM public.agent_settings WHERE id = 1), 'Africa/Lagos');
  local_t time := (now() AT TIME ZONE tz)::time;
  window_end int := coalesce((SELECT post_window_end FROM public.agent_settings WHERE id = 1), 21);
BEGIN
  IF local_t >= make_time(least(window_end, 22), 0, 0) + interval '45 minutes' AND local_t < make_time(least(window_end, 22), 0, 0) + interval '75 minutes' THEN
    RETURN public.agent_owner_digest();
  END IF;
  RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.agent_owner_digest_due() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('emmaforyou-owner-digest', 'emmaforyou-agent-watchdog');
  PERFORM cron.schedule('emmaforyou-owner-digest', '*/15 * * * *', 'SELECT public.agent_owner_digest_due()');
  PERFORM cron.schedule('emmaforyou-agent-watchdog', '7,37 * * * *', 'SELECT public.agent_watchdog()');
END $$;
