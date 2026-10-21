-- Agent team v2: at least one post per agent per day (persistent tracker), 3-minute response window
-- with jitter for every new post, monitoring of every member comment, edit re-evaluation.

-- ------------------------------------------------------------------ settings
ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS daily_post_target smallint NOT NULL DEFAULT 1 CHECK (daily_post_target BETWEEN 0 AND 10);
ALTER TABLE public.agent_settings
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Lagos' CHECK (timezone ~ '^[A-Za-z_]+(/[A-Za-z0-9_+\-]+){0,2}$'),
  ADD COLUMN IF NOT EXISTS post_window_start smallint NOT NULL DEFAULT 7 CHECK (post_window_start BETWEEN 0 AND 23),
  ADD COLUMN IF NOT EXISTS post_window_end smallint NOT NULL DEFAULT 21 CHECK (post_window_end BETWEEN 1 AND 24),
  ADD COLUMN IF NOT EXISTS reply_delay_jitter_seconds integer NOT NULL DEFAULT 45 CHECK (reply_delay_jitter_seconds BETWEEN 0 AND 600),
  ADD COLUMN IF NOT EXISTS monitor_comments boolean NOT NULL DEFAULT true;
-- The response window defaults to 3 minutes (was 60 seconds).
ALTER TABLE public.agent_settings ALTER COLUMN reply_delay_seconds SET DEFAULT 180;
UPDATE public.agent_settings SET reply_delay_seconds = 180 WHERE id = 1 AND reply_delay_seconds = 60;
GRANT SELECT (timezone, post_window_start, post_window_end, reply_delay_jitter_seconds, monitor_comments) ON public.agent_settings TO authenticated;
GRANT UPDATE (timezone, post_window_start, post_window_end, reply_delay_jitter_seconds, monitor_comments) ON public.agent_settings TO authenticated;

-- ------------------------------------------------------------------ daily publishing tracker
CREATE TABLE IF NOT EXISTS public.agent_daily_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agent_profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  target smallint NOT NULL DEFAULT 1,
  published_count smallint NOT NULL DEFAULT 0,
  slot_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'writing', 'retrying', 'awaiting_review', 'published', 'failed', 'skipped')),
  attempts smallint NOT NULL DEFAULT 0,
  rounds smallint NOT NULL DEFAULT 0,
  mode text CHECK (mode IS NULL OR mode IN ('research', 'evergreen')),
  last_error text,
  last_published_at timestamptz,
  post_ids uuid[] NOT NULL DEFAULT '{}',
  queue_ids uuid[] NOT NULL DEFAULT '{}',
  alerted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, day)
);
CREATE INDEX IF NOT EXISTS agent_daily_posts_day_idx ON public.agent_daily_posts (day, slot_at);
DROP TRIGGER IF EXISTS agent_daily_posts_touch ON public.agent_daily_posts;
CREATE TRIGGER agent_daily_posts_touch BEFORE UPDATE ON public.agent_daily_posts FOR EACH ROW EXECUTE FUNCTION public.agent_touch();
ALTER TABLE public.agent_daily_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agent_daily_posts FROM anon, authenticated;
GRANT ALL ON public.agent_daily_posts TO service_role;
GRANT SELECT ON public.agent_daily_posts TO authenticated;
DROP POLICY IF EXISTS agent_daily_posts_admin_read ON public.agent_daily_posts;
CREATE POLICY agent_daily_posts_admin_read ON public.agent_daily_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Weekly planning is replaced by the daily planner (posts_per_week is no longer used).
INSERT INTO public.agent_schedules (id, label, interval_minutes) VALUES
  ('daily_posts', 'Plan and publish each agent''s daily posts', 10),
  ('reconcile', 'Reconcile missed events and daily targets', 30)
ON CONFLICT (id) DO NOTHING;
UPDATE public.agent_schedules SET enabled = false, label = 'Weekly post planner (replaced by daily posts)' WHERE id = 'content_plan';

-- Admin: write today's posts now (all agents, or one).
CREATE OR REPLACE FUNCTION public.agent_admin_daily_now(p_agent uuid DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  UPDATE public.agent_daily_posts SET slot_at = now(), status = CASE WHEN status IN ('failed', 'skipped') THEN 'scheduled' ELSE status END
   WHERE day = (now() AT TIME ZONE (SELECT timezone FROM public.agent_settings WHERE id = 1))::date
     AND published_count < target AND (p_agent IS NULL OR agent_id = p_agent) AND status <> 'writing';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM public.agent_enqueue('daily_posts', 'manual:daily_posts:' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS'), jsonb_build_object('schedule', 'daily_posts', 'manual', true, 'now', true, 'agent', p_agent), NULL, 2::smallint);
  INSERT INTO public.agent_audit_logs (actor_type, actor_id, agent_id, action, details) VALUES (CASE WHEN auth.uid() IS NULL THEN 'system' ELSE 'admin' END, auth.uid(), p_agent, 'daily_posts_now', jsonb_build_object('rows', n));
  UPDATE public.agent_settings SET last_kick_at = NULL WHERE id = 1;
  PERFORM public.agent_kick('admin');
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.agent_admin_daily_now(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.agent_admin_daily_now(uuid) TO authenticated, service_role;

-- ------------------------------------------------------------------ event triggers
-- Response window: reply_delay_seconds ± a random jitter (never under 30 s), so replies don't all land at the same interval.
CREATE OR REPLACE FUNCTION public.agent_reply_at() RETURNS timestamptz LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT now() + make_interval(secs => greatest(30, s.reply_delay_seconds + round((random() * 2 - 1) * s.reply_delay_jitter_seconds)))
  FROM public.agent_settings s WHERE s.id = 1
$$;

CREATE OR REPLACE FUNCTION public.agent_on_post() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'published' THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = NEW.author_id AND agent_slug IS NOT NULL) THEN RETURN NULL; END IF;
  IF TG_OP = 'INSERT' OR OLD.status <> 'published' THEN
    PERFORM public.agent_enqueue('post_created', 'post:' || NEW.id::text, jsonb_build_object('post_id', NEW.id, 'published_at', now()), NULL, 4::smallint, coalesce(public.agent_reply_at(), now() + interval '3 minutes'));
    PERFORM public.agent_kick('post');
  ELSIF (NEW.title, NEW.body) IS DISTINCT FROM (OLD.title, OLD.body)
        AND NOT EXISTS (SELECT 1 FROM public.agent_community_actions a WHERE a.post_id = NEW.id AND a.action IN ('reply', 'escalate', 'flag', 'queued_for_review')) THEN
    -- The author edited before any agent acted: look at it again (one re-check per 10 minutes).
    PERFORM public.agent_enqueue('post_created', 'post-edit:' || NEW.id::text || ':' || floor(extract(epoch FROM now()) / 600)::text, jsonb_build_object('post_id', NEW.id, 'edited', true), NULL, 4::smallint, coalesce(public.agent_reply_at(), now() + interval '3 minutes'));
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS agent_on_post ON public.community_posts;
CREATE TRIGGER agent_on_post AFTER INSERT OR UPDATE OF status, title, body ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.agent_on_post();

-- Every member comment is observed. "involved" = a reply to an agent, the post author following up
-- after an agent answered, or an @mention of an agent; other comments are only answered when they
-- ask something the team can genuinely help with (decided by the worker).
CREATE OR REPLACE FUNCTION public.agent_on_comment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE involved boolean := false; post_author uuid; monitor boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = NEW.author_id AND agent_slug IS NOT NULL) THEN RETURN NULL; END IF;
  SELECT author_id INTO post_author FROM public.community_posts WHERE id = NEW.post_id;
  IF NEW.parent_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.community_comments c JOIN public.community_profiles p ON p.user_id = c.author_id WHERE c.id = NEW.parent_id AND p.agent_slug IS NOT NULL) THEN involved := true; END IF;
  IF NOT involved AND NEW.author_id = post_author AND EXISTS (SELECT 1 FROM public.community_comments c JOIN public.community_profiles p ON p.user_id = c.author_id WHERE c.post_id = NEW.post_id AND p.agent_slug IS NOT NULL) THEN involved := true; END IF;
  IF NOT involved AND NEW.body ~* ('@(' || coalesce((SELECT string_agg(username, '|') FROM public.community_profiles WHERE agent_slug IS NOT NULL), '^$') || ')\M') THEN involved := true; END IF;
  -- The member answered: a scheduled follow-up for this thread is no longer needed.
  UPDATE public.agent_followup_tasks SET status = 'cancelled', reason = 'member replied' WHERE post_id = NEW.post_id AND member_id = NEW.author_id AND status = 'scheduled';
  SELECT monitor_comments INTO monitor FROM public.agent_settings WHERE id = 1;
  IF NOT involved AND NOT coalesce(monitor, true) THEN RETURN NULL; END IF;
  PERFORM public.agent_enqueue('comment_created', 'comment:' || NEW.id::text, jsonb_build_object('comment_id', NEW.id, 'post_id', NEW.post_id, 'involved', involved), NULL, CASE WHEN involved THEN 3 ELSE 5 END::smallint,
    CASE WHEN involved THEN now() + make_interval(secs => 45 + floor(random() * 60)::int) ELSE coalesce(public.agent_reply_at(), now() + interval '3 minutes') END);
  PERFORM public.agent_kick('comment');
  RETURN NULL;
END $$;
