-- EmmaForYou Community — core schema (Milestones 1–2 plus follows/blocks/moderation basics).
-- Additive and idempotent: no existing table is altered except the signup trigger function, which
-- keeps its exact behaviour for every signup that is not explicitly a community signup.
-- Every rule is enforced in the database (RLS, column grants, triggers), never only in the UI.

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- 1. Community signups must not become client-portal clients -----------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_client_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'signup_source', '') = 'community' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.client_accounts (user_id, full_name, business_name, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),2))
  )
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

-- 2. Helpers -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_is_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('admin'::app_role, 'moderator'::app_role));
$$;

-- 3. Tables --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 60),
  headline text CHECK (headline IS NULL OR char_length(headline) <= 120),
  bio text CHECK (bio IS NULL OR char_length(bio) <= 1500),
  location text CHECK (location IS NULL OR char_length(location) <= 80),
  avatar_url text CHECK (avatar_url IS NULL OR (avatar_url ~ '^https://' AND char_length(avatar_url) <= 500)),
  cover_url text CHECK (cover_url IS NULL OR (cover_url ~ '^https://' AND char_length(cover_url) <= 500)),
  website text CHECK (website IS NULL OR (website ~ '^https?://' AND char_length(website) <= 300)),
  skills text[] NOT NULL DEFAULT '{}' CHECK (cardinality(skills) <= 20),
  interests text[] NOT NULL DEFAULT '{}' CHECK (cardinality(interests) <= 20),
  links jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(links) = 'array' AND jsonb_array_length(links) <= 8),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'members')),
  is_specialist boolean NOT NULL DEFAULT false,
  suspended_at timestamptz,
  post_count integer NOT NULL DEFAULT 0,
  follower_count integer NOT NULL DEFAULT 0,
  following_count integer NOT NULL DEFAULT 0,
  helpful_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_blocks (
  blocker_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'update' CHECK (kind IN ('update','question','project','tutorial','discussion','poll','collaboration','help','announcement')),
  title text CHECK (title IS NULL OR char_length(btrim(title)) BETWEEN 3 AND 160),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 10000),
  link_url text CHECK (link_url IS NULL OR (link_url ~ '^https?://' AND char_length(link_url) <= 500)),
  media jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(media) = 'array' AND jsonb_array_length(media) <= 6),
  tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 8),
  topic text CHECK (topic IS NULL OR topic ~ '^[a-z0-9-]{2,40}$'),
  poll_options text[] CHECK (poll_options IS NULL OR cardinality(poll_options) BETWEEN 2 AND 6),
  poll_counts integer[],
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'members')),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'removed')),
  client_key uuid,
  reactions jsonb NOT NULL DEFAULT '{}'::jsonb,
  reaction_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  engagement integer NOT NULL DEFAULT 0,
  accepted_comment_id uuid,
  is_pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (author_id, client_key)
);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  depth smallint NOT NULL DEFAULT 0 CHECK (depth BETWEEN 0 AND 2),
  body text NOT NULL CHECK (char_length(body) <= 4000),
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'deleted', 'removed')),
  reactions jsonb NOT NULL DEFAULT '{}'::jsonb,
  reaction_count integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  is_helpful boolean NOT NULL DEFAULT false,
  client_key uuid,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (author_id, client_key)
);

DO $$ BEGIN
  ALTER TABLE public.community_posts ADD CONSTRAINT community_posts_accepted_fk
    FOREIGN KEY (accepted_comment_id) REFERENCES public.community_comments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.community_reactions (
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('like', 'love', 'celebrate', 'insightful', 'support')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_comment_reactions (
  comment_id uuid NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('like', 'love', 'celebrate', 'insightful', 'support')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_poll_votes (
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  option_index smallint NOT NULL CHECK (option_index BETWEEN 0 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_saves (
  user_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.community_follows (
  follower_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

CREATE TABLE IF NOT EXISTS public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment', 'profile')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate', 'misinformation', 'inappropriate', 'other')),
  details text CHECK (details IS NULL OR char_length(details) <= 1000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'actioned', 'dismissed')),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS public.community_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('reaction', 'comment', 'reply', 'mention', 'follow', 'accepted', 'moderation', 'announcement')),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.community_comments(id) ON DELETE CASCADE,
  dedupe_key text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);

CREATE TABLE IF NOT EXISTS public.community_audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.community_is_blocked(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _a IS NOT NULL AND _b IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.community_blocks
    WHERE (blocker_id = _a AND blocked_id = _b) OR (blocker_id = _b AND blocked_id = _a));
$$;

-- 4. Indexes ------------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS community_posts_latest_idx ON public.community_posts (published_at DESC, id DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS community_posts_popular_idx ON public.community_posts (engagement DESC, published_at DESC, id DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS community_posts_author_idx ON public.community_posts (author_id, published_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_tags_idx ON public.community_posts USING gin (tags);
CREATE INDEX IF NOT EXISTS community_posts_search_idx ON public.community_posts USING gin ((coalesce(title, '') || ' ' || body) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS community_comments_post_idx ON public.community_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS community_comments_author_idx ON public.community_comments (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_follows_followee_idx ON public.community_follows (followee_id);
CREATE INDEX IF NOT EXISTS community_notifications_user_idx ON public.community_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_profiles_search_idx ON public.community_profiles USING gin ((username || ' ' || display_name || ' ' || coalesce(headline, '')) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS community_reports_open_idx ON public.community_reports (status, created_at DESC);

-- 5. Grants: explicit columns only, so counters, flags and moderation fields can't be set by users --
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.community_profiles, public.community_blocks, public.community_posts, public.community_comments,
  public.community_reactions, public.community_comment_reactions, public.community_poll_votes, public.community_saves,
  public.community_follows, public.community_reports, public.community_notifications, public.community_audit_log
  FROM anon, authenticated;
GRANT ALL ON public.community_profiles, public.community_blocks, public.community_posts, public.community_comments,
  public.community_reactions, public.community_comment_reactions, public.community_poll_votes, public.community_saves,
  public.community_follows, public.community_reports, public.community_notifications, public.community_audit_log
  TO service_role;
REVOKE ALL ON SEQUENCE public.community_audit_log_id_seq FROM anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.community_audit_log_id_seq TO service_role;

GRANT SELECT ON public.community_profiles TO anon, authenticated;
GRANT INSERT (user_id, username, display_name, headline, bio, location, avatar_url, cover_url, website, skills, interests, links, visibility)
  ON public.community_profiles TO authenticated;
GRANT UPDATE (username, display_name, headline, bio, location, avatar_url, cover_url, website, skills, interests, links, visibility)
  ON public.community_profiles TO authenticated;

GRANT SELECT ON public.community_posts TO anon, authenticated;
GRANT INSERT (author_id, kind, title, body, link_url, media, tags, topic, poll_options, visibility, status, client_key)
  ON public.community_posts TO authenticated;
GRANT UPDATE (title, body, link_url, media, tags, topic, visibility, status, accepted_comment_id) ON public.community_posts TO authenticated;
GRANT DELETE ON public.community_posts TO authenticated;

GRANT SELECT ON public.community_comments TO anon, authenticated;
GRANT INSERT (post_id, author_id, parent_id, body, client_key) ON public.community_comments TO authenticated;
GRANT UPDATE (body, status) ON public.community_comments TO authenticated;

GRANT SELECT ON public.community_reactions, public.community_comment_reactions TO anon, authenticated;
GRANT INSERT, UPDATE (kind), DELETE ON public.community_reactions, public.community_comment_reactions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.community_poll_votes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.community_saves TO authenticated;
GRANT SELECT ON public.community_follows TO anon, authenticated;
GRANT INSERT, DELETE ON public.community_follows TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.community_blocks TO authenticated;
GRANT INSERT (reporter_id, target_type, target_id, reason, details) ON public.community_reports TO authenticated;
GRANT SELECT ON public.community_reports TO authenticated;
GRANT SELECT ON public.community_notifications TO authenticated;
GRANT UPDATE (read_at) ON public.community_notifications TO authenticated;
GRANT SELECT ON public.community_audit_log TO authenticated;

-- 6. Row-level security -------------------------------------------------------------------------
DROP POLICY IF EXISTS cp_select ON public.community_profiles;
CREATE POLICY cp_select ON public.community_profiles FOR SELECT USING (
  user_id = auth.uid() OR public.community_is_staff(auth.uid())
  OR (suspended_at IS NULL AND (visibility = 'public' OR auth.uid() IS NOT NULL)));
DROP POLICY IF EXISTS cp_insert ON public.community_profiles;
CREATE POLICY cp_insert ON public.community_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS cp_update ON public.community_profiles;
CREATE POLICY cp_update ON public.community_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cb_own ON public.community_blocks;
CREATE POLICY cb_own ON public.community_blocks FOR ALL TO authenticated USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

-- Posts: published + visible to this viewer, not from a suspended author, not across a block.
DROP POLICY IF EXISTS cpo_select ON public.community_posts;
CREATE POLICY cpo_select ON public.community_posts FOR SELECT USING (
  author_id = auth.uid()
  OR public.community_is_staff(auth.uid())
  OR (status = 'published'
      AND (visibility = 'public' OR auth.uid() IS NOT NULL)
      AND NOT public.community_is_blocked(auth.uid(), author_id)
      AND EXISTS (SELECT 1 FROM public.community_profiles p WHERE p.user_id = author_id AND p.suspended_at IS NULL)));
DROP POLICY IF EXISTS cpo_insert ON public.community_posts;
CREATE POLICY cpo_insert ON public.community_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS cpo_update ON public.community_posts;
CREATE POLICY cpo_update ON public.community_posts FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS cpo_delete ON public.community_posts;
CREATE POLICY cpo_delete ON public.community_posts FOR DELETE TO authenticated USING (author_id = auth.uid());

-- Comments follow their post's visibility (the subquery is itself filtered by cpo_select).
DROP POLICY IF EXISTS cc_select ON public.community_comments;
CREATE POLICY cc_select ON public.community_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id)
  AND (author_id = auth.uid() OR public.community_is_staff(auth.uid()) OR NOT public.community_is_blocked(auth.uid(), author_id)));
DROP POLICY IF EXISTS cc_insert ON public.community_comments;
CREATE POLICY cc_insert ON public.community_comments FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id AND p.status = 'published'));
DROP POLICY IF EXISTS cc_update ON public.community_comments;
CREATE POLICY cc_update ON public.community_comments FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS cr_select ON public.community_reactions;
CREATE POLICY cr_select ON public.community_reactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id));
DROP POLICY IF EXISTS cr_write ON public.community_reactions;
CREATE POLICY cr_write ON public.community_reactions FOR ALL TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id AND p.status = 'published'));

DROP POLICY IF EXISTS ccr_select ON public.community_comment_reactions;
CREATE POLICY ccr_select ON public.community_comment_reactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.community_comments c WHERE c.id = comment_id));
DROP POLICY IF EXISTS ccr_write ON public.community_comment_reactions;
CREATE POLICY ccr_write ON public.community_comment_reactions FOR ALL TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.community_comments c WHERE c.id = comment_id AND c.status = 'visible'));

DROP POLICY IF EXISTS cpv_own ON public.community_poll_votes;
CREATE POLICY cpv_own ON public.community_poll_votes FOR ALL TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id AND p.status = 'published' AND p.poll_options IS NOT NULL));

DROP POLICY IF EXISTS cs_own ON public.community_saves;
CREATE POLICY cs_own ON public.community_saves FOR ALL TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id));

-- Follows are visible when both profiles are visible to the viewer.
DROP POLICY IF EXISTS cf_select ON public.community_follows;
CREATE POLICY cf_select ON public.community_follows FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.community_profiles a WHERE a.user_id = follower_id)
  AND EXISTS (SELECT 1 FROM public.community_profiles b WHERE b.user_id = followee_id));
DROP POLICY IF EXISTS cf_insert ON public.community_follows;
CREATE POLICY cf_insert ON public.community_follows FOR INSERT TO authenticated WITH CHECK (
  follower_id = auth.uid() AND NOT public.community_is_blocked(follower_id, followee_id));
DROP POLICY IF EXISTS cf_delete ON public.community_follows;
CREATE POLICY cf_delete ON public.community_follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

DROP POLICY IF EXISTS crep_insert ON public.community_reports;
CREATE POLICY crep_insert ON public.community_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS crep_select ON public.community_reports;
CREATE POLICY crep_select ON public.community_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.community_is_staff(auth.uid()));

DROP POLICY IF EXISTS cn_select ON public.community_notifications;
CREATE POLICY cn_select ON public.community_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS cn_update ON public.community_notifications;
CREATE POLICY cn_update ON public.community_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cal_select ON public.community_audit_log;
CREATE POLICY cal_select ON public.community_audit_log FOR SELECT TO authenticated USING (public.community_is_staff(auth.uid()));

-- 7. Notifications helper (definer: users can never insert notifications directly) ----------------
CREATE OR REPLACE FUNCTION public.community_notify(_user uuid, _actor uuid, _type text, _post uuid, _comment uuid, _key text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user IS NULL OR _user = _actor OR public.community_is_blocked(_user, _actor) THEN RETURN; END IF;
  INSERT INTO public.community_notifications (user_id, actor_id, type, post_id, comment_id, dedupe_key)
  VALUES (_user, _actor, _type, _post, _comment, _key)
  ON CONFLICT (user_id, dedupe_key) DO UPDATE SET read_at = NULL, created_at = now(), actor_id = EXCLUDED.actor_id;
END $$;
REVOKE ALL ON FUNCTION public.community_notify(uuid, uuid, text, uuid, uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.community_notify_mentions(_text text, _actor uuid, _post uuid, _comment uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u record;
BEGIN
  FOR u IN
    SELECT p.user_id FROM public.community_profiles p
    WHERE p.username IN (SELECT DISTINCT lower(m[1]) FROM regexp_matches(coalesce(_text, ''), '@([A-Za-z0-9_]{3,24})', 'g') AS m LIMIT 10)
  LOOP
    PERFORM public.community_notify(u.user_id, _actor, 'mention', _post, _comment, 'mention:' || coalesce(_comment, _post)::text);
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.community_notify_mentions(text, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;

-- 8. Triggers --------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_profiles_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.username := lower(btrim(NEW.username));
  NEW.display_name := btrim(NEW.display_name);
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS community_profiles_guard ON public.community_profiles;
CREATE TRIGGER community_profiles_guard BEFORE INSERT OR UPDATE ON public.community_profiles
  FOR EACH ROW EXECUTE FUNCTION public.community_profiles_guard();

CREATE OR REPLACE FUNCTION public.community_posts_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  staff boolean := public.community_is_staff(auth.uid());
  m jsonb;
  recent integer;
BEGIN
  -- Service-role / maintenance writes (auth.uid() is null) skip the per-user rules.
  IF auth.uid() IS NULL THEN
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;
  -- Counter/flag updates made by other triggers don't touch author fields: no author rules apply.
  IF TG_OP = 'UPDATE' AND NEW.title IS NOT DISTINCT FROM OLD.title AND NEW.body IS NOT DISTINCT FROM OLD.body
     AND NEW.link_url IS NOT DISTINCT FROM OLD.link_url AND NEW.media IS NOT DISTINCT FROM OLD.media
     AND NEW.tags IS NOT DISTINCT FROM OLD.tags AND NEW.topic IS NOT DISTINCT FROM OLD.topic
     AND NEW.visibility IS NOT DISTINCT FROM OLD.visibility AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.accepted_comment_id IS NOT DISTINCT FROM OLD.accepted_comment_id AND NEW.poll_options IS NOT DISTINCT FROM OLD.poll_options THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = NEW.author_id AND suspended_at IS NOT NULL) THEN
      RAISE EXCEPTION 'Your account is suspended from posting.' USING ERRCODE = '42501';
    END IF;
    IF NEW.status = 'removed' THEN NEW.status := 'published'; END IF;
    SELECT count(*) INTO recent FROM public.community_posts WHERE author_id = NEW.author_id AND created_at > now() - interval '1 hour';
    IF recent >= 10 AND NOT staff THEN
      RAISE EXCEPTION 'You are posting too quickly. Please wait a little and try again.' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.status = 'published' AND EXISTS (
      SELECT 1 FROM public.community_posts WHERE author_id = NEW.author_id AND status = 'published'
        AND md5(lower(btrim(body))) = md5(lower(btrim(NEW.body))) AND created_at > now() - interval '1 day') THEN
      RAISE EXCEPTION 'You already posted this.' USING ERRCODE = '23505';
    END IF;
    NEW.reactions := '{}'::jsonb; NEW.reaction_count := 0; NEW.comment_count := 0; NEW.engagement := 0;
    NEW.is_pinned := false; NEW.accepted_comment_id := NULL; NEW.edited_at := NULL;
    NEW.created_at := now();
  ELSE
    -- Authors can't restore or edit content a moderator removed.
    IF OLD.status = 'removed' AND NOT staff THEN
      RAISE EXCEPTION 'This post was removed by a moderator.' USING ERRCODE = '42501';
    END IF;
    IF NEW.status = 'removed' AND NOT staff THEN NEW.status := OLD.status; END IF;
    IF NEW.body IS DISTINCT FROM OLD.body OR NEW.title IS DISTINCT FROM OLD.title OR NEW.media IS DISTINCT FROM OLD.media THEN
      IF OLD.status = 'published' THEN NEW.edited_at := now(); END IF;
    END IF;
    IF NEW.accepted_comment_id IS DISTINCT FROM OLD.accepted_comment_id AND NEW.accepted_comment_id IS NOT NULL THEN
      IF OLD.kind <> 'question' OR NOT EXISTS (
        SELECT 1 FROM public.community_comments c WHERE c.id = NEW.accepted_comment_id AND c.post_id = OLD.id AND c.status = 'visible' AND c.author_id <> OLD.author_id) THEN
        RAISE EXCEPTION 'Only another member''s answer on this question can be accepted.' USING ERRCODE = '22023';
      END IF;
    END IF;
    IF NEW.poll_options IS DISTINCT FROM OLD.poll_options THEN NEW.poll_options := OLD.poll_options; END IF;
  END IF;

  IF NEW.kind = 'announcement' AND NOT staff THEN
    RAISE EXCEPTION 'Only community staff can post announcements.' USING ERRCODE = '42501';
  END IF;
  IF NEW.kind IN ('question', 'project', 'tutorial', 'collaboration', 'help', 'announcement') AND (NEW.title IS NULL OR btrim(NEW.title) = '') THEN
    RAISE EXCEPTION 'This kind of post needs a title.' USING ERRCODE = '22023';
  END IF;
  IF NEW.kind = 'poll' THEN
    IF NEW.poll_options IS NULL THEN RAISE EXCEPTION 'A poll needs 2 to 6 options.' USING ERRCODE = '22023'; END IF;
    IF EXISTS (SELECT 1 FROM unnest(NEW.poll_options) o WHERE char_length(btrim(o)) NOT BETWEEN 1 AND 80) THEN
      RAISE EXCEPTION 'Each poll option needs 1 to 80 characters.' USING ERRCODE = '22023';
    END IF;
    IF TG_OP = 'INSERT' THEN NEW.poll_counts := array_fill(0, ARRAY[cardinality(NEW.poll_options)]); END IF;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.poll_options := NULL; NEW.poll_counts := NULL;
  END IF;

  -- Media: only files this author uploaded to the community bucket.
  FOR m IN SELECT * FROM jsonb_array_elements(NEW.media) LOOP
    IF jsonb_typeof(m) <> 'object' OR (m->>'type') NOT IN ('image', 'video')
       OR coalesce(m->>'path', '') !~ ('^' || NEW.author_id::text || '/[A-Za-z0-9._-]{1,120}$')
       OR char_length(coalesce(m->>'alt', '')) > 300 THEN
      RAISE EXCEPTION 'Invalid media attachment.' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  NEW.tags := ARRAY(SELECT DISTINCT lower(regexp_replace(t, '[^A-Za-z0-9-]', '', 'g')) FROM unnest(NEW.tags) t
                    WHERE char_length(regexp_replace(t, '[^A-Za-z0-9-]', '', 'g')) BETWEEN 2 AND 30);
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS community_posts_guard ON public.community_posts;
CREATE TRIGGER community_posts_guard BEFORE INSERT OR UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.community_posts_guard();

CREATE OR REPLACE FUNCTION public.community_posts_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'published' THEN
      UPDATE public.community_profiles SET post_count = post_count + 1 WHERE user_id = NEW.author_id;
      PERFORM public.community_notify_mentions(coalesce(NEW.title, '') || ' ' || NEW.body, NEW.author_id, NEW.id, NULL);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'published' AND NEW.status <> 'published' THEN
      UPDATE public.community_profiles SET post_count = greatest(post_count - 1, 0) WHERE user_id = NEW.author_id;
    ELSIF OLD.status <> 'published' AND NEW.status = 'published' THEN
      UPDATE public.community_profiles SET post_count = post_count + 1 WHERE user_id = NEW.author_id;
      PERFORM public.community_notify_mentions(coalesce(NEW.title, '') || ' ' || NEW.body, NEW.author_id, NEW.id, NULL);
    END IF;
    IF NEW.accepted_comment_id IS DISTINCT FROM OLD.accepted_comment_id THEN
      UPDATE public.community_comments SET is_helpful = (id = NEW.accepted_comment_id) WHERE post_id = NEW.id AND (id = NEW.accepted_comment_id OR id = OLD.accepted_comment_id);
      IF NEW.accepted_comment_id IS NOT NULL THEN
        UPDATE public.community_profiles SET helpful_count = helpful_count + 1
          WHERE user_id = (SELECT author_id FROM public.community_comments WHERE id = NEW.accepted_comment_id);
        PERFORM public.community_notify((SELECT author_id FROM public.community_comments WHERE id = NEW.accepted_comment_id),
          NEW.author_id, 'accepted', NEW.id, NEW.accepted_comment_id, 'accepted:' || NEW.id::text);
      END IF;
      IF OLD.accepted_comment_id IS NOT NULL THEN
        UPDATE public.community_profiles SET helpful_count = greatest(helpful_count - 1, 0)
          WHERE user_id = (SELECT author_id FROM public.community_comments WHERE id = OLD.accepted_comment_id);
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'published' THEN
      UPDATE public.community_profiles SET post_count = greatest(post_count - 1, 0) WHERE user_id = OLD.author_id;
    END IF;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS community_posts_after ON public.community_posts;
CREATE TRIGGER community_posts_after AFTER INSERT OR UPDATE OR DELETE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.community_posts_after();

CREATE OR REPLACE FUNCTION public.community_comments_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  parent record;
  recent integer;
  staff boolean := public.community_is_staff(auth.uid());
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.body IS NOT DISTINCT FROM OLD.body AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = NEW.author_id AND suspended_at IS NOT NULL) THEN
      RAISE EXCEPTION 'Your account is suspended from commenting.' USING ERRCODE = '42501';
    END IF;
    IF char_length(btrim(NEW.body)) < 1 THEN RAISE EXCEPTION 'Write something first.' USING ERRCODE = '22023'; END IF;
    SELECT count(*) INTO recent FROM public.community_comments WHERE author_id = NEW.author_id AND created_at > now() - interval '10 minutes';
    IF recent >= 30 AND NOT staff THEN
      RAISE EXCEPTION 'You are commenting too quickly. Please wait a little and try again.' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.parent_id IS NOT NULL THEN
      SELECT id, post_id, depth, status INTO parent FROM public.community_comments WHERE id = NEW.parent_id;
      IF parent.id IS NULL OR parent.post_id <> NEW.post_id THEN RAISE EXCEPTION 'Reply target not found.' USING ERRCODE = '22023'; END IF;
      IF parent.status <> 'visible' THEN RAISE EXCEPTION 'You can''t reply to a deleted comment.' USING ERRCODE = '22023'; END IF;
      NEW.depth := least(parent.depth + 1, 2);
      -- Beyond the depth limit, replies attach to the deepest allowed level (same thread).
      IF parent.depth >= 2 THEN NEW.parent_id := (SELECT parent_id FROM public.community_comments WHERE id = parent.id); END IF;
    ELSE
      NEW.depth := 0;
    END IF;
    NEW.status := 'visible'; NEW.reactions := '{}'::jsonb; NEW.reaction_count := 0; NEW.reply_count := 0; NEW.is_helpful := false;
    NEW.created_at := now(); NEW.edited_at := NULL;
  ELSE
    IF OLD.status = 'removed' AND NOT staff THEN RAISE EXCEPTION 'This comment was removed by a moderator.' USING ERRCODE = '42501'; END IF;
    IF OLD.status = 'deleted' AND NOT staff THEN RAISE EXCEPTION 'This comment was deleted.' USING ERRCODE = '42501'; END IF;
    IF NEW.status = 'removed' AND NOT staff THEN NEW.status := OLD.status; END IF;
    IF NEW.status = 'deleted' THEN NEW.body := ''; END IF;
    IF NEW.status = 'visible' AND char_length(btrim(NEW.body)) < 1 THEN RAISE EXCEPTION 'Write something first.' USING ERRCODE = '22023'; END IF;
    IF NEW.body IS DISTINCT FROM OLD.body AND NEW.status = 'visible' THEN NEW.edited_at := now(); END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS community_comments_guard ON public.community_comments;
CREATE TRIGGER community_comments_guard BEFORE INSERT OR UPDATE ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.community_comments_guard();

CREATE OR REPLACE FUNCTION public.community_comments_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post record; parent_author uuid; delta integer := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN delta := 1;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'visible' AND NEW.status <> 'visible' THEN delta := -1;
  ELSIF TG_OP = 'UPDATE' AND OLD.status <> 'visible' AND NEW.status = 'visible' THEN delta := 1;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'visible' THEN delta := -1;
  END IF;
  IF delta <> 0 THEN
    UPDATE public.community_posts SET comment_count = greatest(comment_count + delta, 0), engagement = greatest(engagement + 2 * delta, 0)
      WHERE id = coalesce(NEW.post_id, OLD.post_id);
    IF coalesce(NEW.parent_id, OLD.parent_id) IS NOT NULL THEN
      UPDATE public.community_comments SET reply_count = greatest(reply_count + delta, 0) WHERE id = coalesce(NEW.parent_id, OLD.parent_id);
    END IF;
  END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT id, author_id INTO post FROM public.community_posts WHERE id = NEW.post_id;
    IF NEW.parent_id IS NOT NULL THEN
      SELECT author_id INTO parent_author FROM public.community_comments WHERE id = NEW.parent_id;
      PERFORM public.community_notify(parent_author, NEW.author_id, 'reply', NEW.post_id, NEW.id, 'reply:' || NEW.parent_id::text);
    END IF;
    IF parent_author IS DISTINCT FROM post.author_id THEN
      PERFORM public.community_notify(post.author_id, NEW.author_id, 'comment', NEW.post_id, NEW.id, 'comment:' || NEW.post_id::text);
    END IF;
    PERFORM public.community_notify_mentions(NEW.body, NEW.author_id, NEW.post_id, NEW.id);
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS community_comments_after ON public.community_comments;
CREATE TRIGGER community_comments_after AFTER INSERT OR UPDATE OF status OR DELETE ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.community_comments_after();

-- Reactions: one per member per post (primary key); totals per kind kept in jsonb.
CREATE OR REPLACE FUNCTION public.community_reactions_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author uuid;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    UPDATE public.community_posts SET
      reactions = jsonb_set(reactions, ARRAY[OLD.kind], to_jsonb(greatest(coalesce((reactions->>OLD.kind)::int, 0) - 1, 0))),
      reaction_count = CASE WHEN TG_OP = 'DELETE' THEN greatest(reaction_count - 1, 0) ELSE reaction_count END,
      engagement = CASE WHEN TG_OP = 'DELETE' THEN greatest(engagement - 1, 0) ELSE engagement END
    WHERE id = OLD.post_id;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE public.community_posts SET
      reactions = jsonb_set(reactions, ARRAY[NEW.kind], to_jsonb(coalesce((reactions->>NEW.kind)::int, 0) + 1)),
      reaction_count = CASE WHEN TG_OP = 'INSERT' THEN reaction_count + 1 ELSE reaction_count END,
      engagement = CASE WHEN TG_OP = 'INSERT' THEN engagement + 1 ELSE engagement END
    WHERE id = NEW.post_id RETURNING author_id INTO author;
    IF TG_OP = 'INSERT' THEN
      PERFORM public.community_notify(author, NEW.user_id, 'reaction', NEW.post_id, NULL, 'reaction:' || NEW.post_id::text);
    END IF;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS community_reactions_after ON public.community_reactions;
CREATE TRIGGER community_reactions_after AFTER INSERT OR UPDATE OR DELETE ON public.community_reactions
  FOR EACH ROW EXECUTE FUNCTION public.community_reactions_after();

CREATE OR REPLACE FUNCTION public.community_comment_reactions_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    UPDATE public.community_comments SET
      reactions = jsonb_set(reactions, ARRAY[OLD.kind], to_jsonb(greatest(coalesce((reactions->>OLD.kind)::int, 0) - 1, 0))),
      reaction_count = CASE WHEN TG_OP = 'DELETE' THEN greatest(reaction_count - 1, 0) ELSE reaction_count END
    WHERE id = OLD.comment_id;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE public.community_comments SET
      reactions = jsonb_set(reactions, ARRAY[NEW.kind], to_jsonb(coalesce((reactions->>NEW.kind)::int, 0) + 1)),
      reaction_count = CASE WHEN TG_OP = 'INSERT' THEN reaction_count + 1 ELSE reaction_count END
    WHERE id = NEW.comment_id;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS community_comment_reactions_after ON public.community_comment_reactions;
CREATE TRIGGER community_comment_reactions_after AFTER INSERT OR UPDATE OR DELETE ON public.community_comment_reactions
  FOR EACH ROW EXECUTE FUNCTION public.community_comment_reactions_after();

CREATE OR REPLACE FUNCTION public.community_poll_votes_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.option_index >= (SELECT cardinality(poll_options) FROM public.community_posts WHERE id = NEW.post_id) THEN
      RAISE EXCEPTION 'That option does not exist.' USING ERRCODE = '22023';
    END IF;
    UPDATE public.community_posts SET poll_counts[NEW.option_index + 1] = poll_counts[NEW.option_index + 1] + 1, engagement = engagement + 1 WHERE id = NEW.post_id;
  ELSE
    UPDATE public.community_posts SET poll_counts[OLD.option_index + 1] = greatest(poll_counts[OLD.option_index + 1] - 1, 0), engagement = greatest(engagement - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS community_poll_votes_after ON public.community_poll_votes;
CREATE TRIGGER community_poll_votes_after AFTER INSERT OR DELETE ON public.community_poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.community_poll_votes_after();

CREATE OR REPLACE FUNCTION public.community_follows_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    UPDATE public.community_profiles SET follower_count = follower_count + 1 WHERE user_id = NEW.followee_id;
    PERFORM public.community_notify(NEW.followee_id, NEW.follower_id, 'follow', NULL, NULL, 'follow:' || NEW.follower_id::text);
  ELSE
    UPDATE public.community_profiles SET following_count = greatest(following_count - 1, 0) WHERE user_id = OLD.follower_id;
    UPDATE public.community_profiles SET follower_count = greatest(follower_count - 1, 0) WHERE user_id = OLD.followee_id;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS community_follows_after ON public.community_follows;
CREATE TRIGGER community_follows_after AFTER INSERT OR DELETE ON public.community_follows
  FOR EACH ROW EXECUTE FUNCTION public.community_follows_after();

-- Blocking removes follows in both directions.
CREATE OR REPLACE FUNCTION public.community_blocks_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.community_follows
   WHERE (follower_id = NEW.blocker_id AND followee_id = NEW.blocked_id) OR (follower_id = NEW.blocked_id AND followee_id = NEW.blocker_id);
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS community_blocks_after ON public.community_blocks;
CREATE TRIGGER community_blocks_after AFTER INSERT ON public.community_blocks
  FOR EACH ROW EXECUTE FUNCTION public.community_blocks_after();

-- 9. Feed (security invoker: RLS decides what each viewer may see) ---------------------------------
-- Ranking (documented, deterministic):
--   latest     newest first.
--   popular    last 30 days by engagement (1 per reaction or poll vote, 2 per visible comment), then newest.
--   unanswered questions with no comments yet and no accepted answer, newest first.
--   following  posts by people you follow, newest first.
--   discover   posts by people you don't follow (and not you), newest first.
--   for_you    last 60 days: 50 if you follow the author, +20 if a tag or topic matches your interests,
--              + engagement (capped at 50), minus 2 points per hour of age; at most 3 posts per author.
CREATE OR REPLACE FUNCTION public.community_feed(
  _sort text DEFAULT 'latest', _limit integer DEFAULT 15,
  _cursor_ts timestamptz DEFAULT NULL, _cursor_id uuid DEFAULT NULL, _cursor_score integer DEFAULT NULL,
  _offset integer DEFAULT 0, _author uuid DEFAULT NULL, _tag text DEFAULT NULL, _kind text DEFAULT NULL)
RETURNS TABLE (
  id uuid, author_id uuid, kind text, title text, body text, link_url text, media jsonb, tags text[], topic text,
  poll_options text[], poll_counts integer[], visibility text, status text, reactions jsonb, reaction_count integer,
  comment_count integer, engagement integer, accepted_comment_id uuid, is_pinned boolean, published_at timestamptz,
  edited_at timestamptz, author_username text, author_name text, author_headline text, author_avatar text,
  author_specialist boolean, my_reaction text, my_vote smallint, saved boolean, rank_score integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH me AS (SELECT auth.uid() AS uid),
  my_interests AS (SELECT coalesce((SELECT interests FROM community_profiles WHERE user_id = (SELECT uid FROM me)), '{}') AS i),
  base AS (
    SELECT p.*,
      (EXISTS (SELECT 1 FROM community_follows f WHERE f.follower_id = (SELECT uid FROM me) AND f.followee_id = p.author_id)) AS followed
    FROM community_posts p
    WHERE p.status = 'published'
      AND (_author IS NULL OR p.author_id = _author)
      AND (_tag IS NULL OR p.tags @> ARRAY[lower(_tag)])
      AND (_kind IS NULL OR p.kind = _kind)
  ),
  ranked AS (
    SELECT b.*,
      CASE WHEN _sort = 'popular' THEN b.engagement
           WHEN _sort = 'for_you' THEN
             (CASE WHEN b.followed THEN 50 ELSE 0 END)
             + (CASE WHEN b.tags && mi.i OR b.topic = ANY (mi.i) THEN 20 ELSE 0 END)
             + least(b.engagement, 50)
             - (extract(epoch FROM (now() - b.published_at)) / 1800)::int
           ELSE 0 END AS score,
      row_number() OVER (PARTITION BY b.author_id ORDER BY b.published_at DESC) AS author_rank
    FROM base b CROSS JOIN my_interests mi
    WHERE CASE _sort
      WHEN 'popular' THEN b.published_at > now() - interval '30 days'
      WHEN 'unanswered' THEN b.kind = 'question' AND b.comment_count = 0 AND b.accepted_comment_id IS NULL
      WHEN 'following' THEN b.followed
      WHEN 'discover' THEN NOT b.followed AND b.author_id IS DISTINCT FROM (SELECT uid FROM me)
      WHEN 'for_you' THEN b.published_at > now() - interval '60 days'
      ELSE true END
  ),
  page AS (
    SELECT r.* FROM ranked r
    WHERE (_sort <> 'for_you' OR r.author_rank <= 3)
      AND CASE
        WHEN _sort = 'for_you' THEN true
        WHEN _sort = 'popular' THEN _cursor_ts IS NULL OR (r.engagement, r.published_at, r.id) < (_cursor_score, _cursor_ts, _cursor_id)
        ELSE _cursor_ts IS NULL OR (r.published_at, r.id) < (_cursor_ts, _cursor_id) END
    ORDER BY
      CASE WHEN _sort IN ('popular', 'for_you') THEN r.score END DESC NULLS LAST,
      r.published_at DESC, r.id DESC
    LIMIT least(greatest(_limit, 1), 30)
    OFFSET CASE WHEN _sort = 'for_you' THEN greatest(_offset, 0) ELSE 0 END
  )
  SELECT pg.id, pg.author_id, pg.kind, pg.title, pg.body, pg.link_url, pg.media, pg.tags, pg.topic,
    pg.poll_options, pg.poll_counts, pg.visibility, pg.status, pg.reactions, pg.reaction_count,
    pg.comment_count, pg.engagement, pg.accepted_comment_id, pg.is_pinned, pg.published_at,
    pg.edited_at, pr.username, pr.display_name, pr.headline, pr.avatar_url, pr.is_specialist,
    (SELECT r.kind FROM community_reactions r WHERE r.post_id = pg.id AND r.user_id = (SELECT uid FROM me)),
    (SELECT v.option_index FROM community_poll_votes v WHERE v.post_id = pg.id AND v.user_id = (SELECT uid FROM me)),
    EXISTS (SELECT 1 FROM community_saves s WHERE s.post_id = pg.id AND s.user_id = (SELECT uid FROM me)),
    pg.score
  FROM page pg JOIN community_profiles pr ON pr.user_id = pg.author_id
  ORDER BY CASE WHEN _sort IN ('popular', 'for_you') THEN pg.score END DESC NULLS LAST, pg.published_at DESC, pg.id DESC;
$$;
GRANT EXECUTE ON FUNCTION public.community_feed(text, integer, timestamptz, uuid, integer, integer, uuid, text, text) TO anon, authenticated;

-- Search across posts and people (invoker: respects visibility, blocks and suspensions).
CREATE OR REPLACE FUNCTION public.community_search(_q text, _type text DEFAULT 'all', _limit integer DEFAULT 20)
RETURNS TABLE (result_type text, id uuid, title text, snippet text, username text, display_name text, avatar_url text, kind text, published_at timestamptz, score real)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, extensions AS $$
  WITH q AS (SELECT lower(btrim(left(_q, 100))) AS t)
  (SELECT 'post', p.id, p.title, left(p.body, 220), pr.username, pr.display_name, pr.avatar_url, p.kind, p.published_at,
          similarity(lower(coalesce(p.title, '') || ' ' || p.body), (SELECT t FROM q))
     FROM community_posts p JOIN community_profiles pr ON pr.user_id = p.author_id
    WHERE p.status = 'published' AND _type IN ('all', 'posts', 'questions')
      AND (_type <> 'questions' OR p.kind = 'question')
      AND char_length((SELECT t FROM q)) >= 2
      AND ((coalesce(p.title, '') || ' ' || p.body) ILIKE '%' || (SELECT t FROM q) || '%' OR p.tags @> ARRAY[(SELECT t FROM q)])
    ORDER BY p.published_at DESC LIMIT least(_limit, 50))
  UNION ALL
  (SELECT 'person', pr.user_id, pr.display_name, pr.headline, pr.username, pr.display_name, pr.avatar_url, NULL, pr.created_at,
          similarity(pr.username || ' ' || pr.display_name, (SELECT t FROM q))
     FROM community_profiles pr
    WHERE _type IN ('all', 'people') AND char_length((SELECT t FROM q)) >= 2
      AND (pr.username || ' ' || pr.display_name || ' ' || coalesce(pr.headline, '')) ILIKE '%' || (SELECT t FROM q) || '%'
      AND NOT public.community_is_blocked(auth.uid(), pr.user_id)
    ORDER BY pr.follower_count DESC LIMIT least(_limit, 50));
$$;
GRANT EXECUTE ON FUNCTION public.community_search(text, text, integer) TO anon, authenticated;

-- 10. Moderation (staff only; every action audited) -------------------------------------------------
CREATE OR REPLACE FUNCTION public.community_moderate(_target_type text, _target_id uuid, _action text, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); target_owner uuid;
BEGIN
  IF NOT public.community_is_staff(uid) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  IF _target_type = 'post' AND _action IN ('remove', 'restore', 'pin', 'unpin') THEN
    UPDATE public.community_posts SET
      status = CASE _action WHEN 'remove' THEN 'removed' WHEN 'restore' THEN 'published' ELSE status END,
      is_pinned = CASE _action WHEN 'pin' THEN true WHEN 'unpin' THEN false ELSE is_pinned END
    WHERE id = _target_id RETURNING author_id INTO target_owner;
  ELSIF _target_type = 'comment' AND _action IN ('remove', 'restore') THEN
    UPDATE public.community_comments SET status = CASE _action WHEN 'remove' THEN 'removed' ELSE 'visible' END
    WHERE id = _target_id RETURNING author_id INTO target_owner;
  ELSIF _target_type = 'profile' AND _action IN ('suspend', 'unsuspend', 'specialist', 'unspecialist') THEN
    IF _action IN ('specialist', 'unspecialist') AND NOT public.has_role(uid, 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only administrators can assign specialist status.' USING ERRCODE = '42501';
    END IF;
    UPDATE public.community_profiles SET
      suspended_at = CASE _action WHEN 'suspend' THEN now() WHEN 'unsuspend' THEN NULL ELSE suspended_at END,
      is_specialist = CASE _action WHEN 'specialist' THEN true WHEN 'unspecialist' THEN false ELSE is_specialist END
    WHERE user_id = _target_id RETURNING user_id INTO target_owner;
  ELSE
    RAISE EXCEPTION 'Unknown moderation action.' USING ERRCODE = '22023';
  END IF;
  IF target_owner IS NULL THEN RAISE EXCEPTION 'Not found.' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO public.community_audit_log (actor_id, action, target_type, target_id, details)
  VALUES (uid, _action, _target_type, _target_id, jsonb_build_object('reason', left(coalesce(_reason, ''), 500)));
  UPDATE public.community_reports SET status = 'actioned', resolved_by = uid, resolved_at = now()
   WHERE target_type = _target_type AND target_id = _target_id AND status = 'open' AND _action IN ('remove', 'suspend');
END $$;
REVOKE ALL ON FUNCTION public.community_moderate(text, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_moderate(text, uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.community_dismiss_report(_report_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.community_is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  UPDATE public.community_reports SET status = 'dismissed', resolved_by = auth.uid(), resolved_at = now() WHERE id = _report_id;
  INSERT INTO public.community_audit_log (actor_id, action, target_type, target_id) VALUES (auth.uid(), 'dismiss_report', 'report', _report_id);
END $$;
REVOKE ALL ON FUNCTION public.community_dismiss_report(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_dismiss_report(uuid) TO authenticated;

-- Mark all of the caller's notifications read.
CREATE OR REPLACE FUNCTION public.community_mark_all_read()
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  UPDATE community_notifications SET read_at = now() WHERE user_id = auth.uid() AND read_at IS NULL;
$$;
GRANT EXECUTE ON FUNCTION public.community_mark_all_read() TO authenticated;

-- 11. Media storage: public read, members upload only into their own folder; size and type limits ---
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('community-media', 'community-media', true, 26214400,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS community_media_insert ON storage.objects;
CREATE POLICY community_media_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'community-media' AND (storage.foldername(name))[1] = auth.uid()::text
              AND NOT EXISTS (SELECT 1 FROM public.community_profiles p WHERE p.user_id = auth.uid() AND p.suspended_at IS NOT NULL));
DROP POLICY IF EXISTS community_media_delete ON storage.objects;
CREATE POLICY community_media_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 12. Realtime: live comments and notifications (realtime applies the same RLS) ---------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_notifications;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END $$;
