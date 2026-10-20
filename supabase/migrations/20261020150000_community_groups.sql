-- Community groups: public groups anyone can join, private groups that need approval.
-- Group posts live in community_posts (group_id); they stay out of the main feed, and posts in a
-- private group are visible only to its active members (and staff). Idempotent.

CREATE TABLE IF NOT EXISTS public.community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 40),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 3 AND 60),
  description text CHECK (description IS NULL OR char_length(description) <= 600),
  topic text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  owner_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  member_count integer NOT NULL DEFAULT 0,
  post_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_members (
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS community_group_members_user_idx ON public.community_group_members (user_id, status);
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.community_groups(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS community_posts_group_idx ON public.community_posts (group_id, published_at DESC) WHERE group_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.community_group_role(_group uuid, _uid uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.community_group_members WHERE group_id = _group AND user_id = _uid AND status = 'active';
$$;
CREATE OR REPLACE FUNCTION public.community_can_see_group_posts(_group uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _group IS NULL
      OR EXISTS (SELECT 1 FROM public.community_groups g WHERE g.id = _group AND g.visibility = 'public')
      OR public.community_group_role(_group, _uid) IS NOT NULL
      OR public.community_is_staff(_uid);
$$;

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_groups, public.community_group_members FROM anon, authenticated;
GRANT SELECT ON public.community_groups, public.community_group_members TO anon, authenticated;
GRANT INSERT (slug, name, description, topic, visibility, owner_id) ON public.community_groups TO authenticated;
GRANT UPDATE (name, description, topic, visibility) ON public.community_groups TO authenticated;
GRANT DELETE ON public.community_groups TO authenticated;
GRANT INSERT (group_id, user_id) ON public.community_group_members TO authenticated;
GRANT UPDATE (status, role) ON public.community_group_members TO authenticated;
GRANT DELETE ON public.community_group_members TO authenticated;
GRANT INSERT (group_id) ON public.community_posts TO authenticated;
GRANT ALL ON public.community_groups, public.community_group_members TO service_role;

DROP POLICY IF EXISTS cg_select ON public.community_groups;
CREATE POLICY cg_select ON public.community_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS cg_insert ON public.community_groups;
CREATE POLICY cg_insert ON public.community_groups FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS cg_update ON public.community_groups;
CREATE POLICY cg_update ON public.community_groups FOR UPDATE TO authenticated
  USING (public.community_group_role(id, auth.uid()) IN ('owner', 'admin') OR public.community_is_staff(auth.uid()))
  WITH CHECK (public.community_group_role(id, auth.uid()) IN ('owner', 'admin') OR public.community_is_staff(auth.uid()));
DROP POLICY IF EXISTS cg_delete ON public.community_groups;
CREATE POLICY cg_delete ON public.community_groups FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.community_is_staff(auth.uid()));

-- Member lists: public groups are visible to everyone; private ones only to their members.
DROP POLICY IF EXISTS cgm_select ON public.community_group_members;
CREATE POLICY cgm_select ON public.community_group_members FOR SELECT USING (
  user_id = auth.uid() OR public.community_can_see_group_posts(group_id, auth.uid()));
DROP POLICY IF EXISTS cgm_insert ON public.community_group_members;
CREATE POLICY cgm_insert ON public.community_group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS cgm_update ON public.community_group_members;
CREATE POLICY cgm_update ON public.community_group_members FOR UPDATE TO authenticated
  USING (public.community_group_role(group_id, auth.uid()) IN ('owner', 'admin'))
  WITH CHECK (public.community_group_role(group_id, auth.uid()) IN ('owner', 'admin'));
DROP POLICY IF EXISTS cgm_delete ON public.community_group_members;
CREATE POLICY cgm_delete ON public.community_group_members FOR DELETE TO authenticated USING (
  (user_id = auth.uid() AND role <> 'owner') OR (public.community_group_role(group_id, auth.uid()) IN ('owner', 'admin') AND role <> 'owner'));

-- Group rules.
CREATE OR REPLACE FUNCTION public.community_groups_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  NEW.name := btrim(NEW.name); NEW.description := nullif(btrim(coalesce(NEW.description, '')), '');
  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO n FROM public.community_groups WHERE owner_id = NEW.owner_id AND created_at > now() - interval '1 day';
    IF n >= 3 AND current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN RAISE EXCEPTION 'You can create up to 3 groups a day.' USING ERRCODE = '54000'; END IF;
    NEW.member_count := 0; NEW.post_count := 0; NEW.created_at := now();
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS community_groups_guard ON public.community_groups;
CREATE TRIGGER community_groups_guard BEFORE INSERT OR UPDATE ON public.community_groups FOR EACH ROW EXECUTE FUNCTION public.community_groups_guard();

CREATE OR REPLACE FUNCTION public.community_groups_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_group_members (group_id, user_id, role, status) VALUES (NEW.id, NEW.owner_id, 'owner', 'active') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS community_groups_after ON public.community_groups;
CREATE TRIGGER community_groups_after AFTER INSERT ON public.community_groups FOR EACH ROW EXECUTE FUNCTION public.community_groups_after();

CREATE OR REPLACE FUNCTION public.community_group_members_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.community_groups;
BEGIN
  SELECT * INTO g FROM public.community_groups WHERE id = NEW.group_id;
  IF g IS NULL THEN RAISE EXCEPTION 'Group not found.' USING ERRCODE = 'P0002'; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    IF NEW.user_id = g.owner_id THEN NEW.role := 'owner'; NEW.status := 'active';
    ELSE
      NEW.role := 'member';
      NEW.status := CASE WHEN g.visibility = 'private' THEN 'pending' ELSE 'active' END;
    END IF;
  ELSE
    IF OLD.role = 'owner' AND (NEW.role <> 'owner' OR NEW.status <> 'active') THEN RAISE EXCEPTION 'The owner stays the owner.' USING ERRCODE = '42501'; END IF;
    IF NEW.role = 'owner' AND OLD.role <> 'owner' THEN RAISE EXCEPTION 'There is one owner per group.' USING ERRCODE = '42501'; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS community_group_members_guard ON public.community_group_members;
CREATE TRIGGER community_group_members_guard BEFORE INSERT OR UPDATE ON public.community_group_members FOR EACH ROW EXECUTE FUNCTION public.community_group_members_guard();

CREATE OR REPLACE FUNCTION public.community_group_members_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gid uuid := coalesce(NEW.group_id, OLD.group_id);
BEGIN
  UPDATE public.community_groups SET member_count = (SELECT count(*) FROM public.community_group_members WHERE group_id = gid AND status = 'active') WHERE id = gid;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS community_group_members_count ON public.community_group_members;
CREATE TRIGGER community_group_members_count AFTER INSERT OR UPDATE OR DELETE ON public.community_group_members FOR EACH ROW EXECUTE FUNCTION public.community_group_members_count();

-- Posting into a group requires active membership; group posts are counted on the group.
CREATE OR REPLACE FUNCTION public.community_posts_group_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.group_id IS DISTINCT FROM OLD.group_id THEN RAISE EXCEPTION 'A post can''t move between groups.' USING ERRCODE = '42501'; END IF;
  IF TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL AND public.community_group_role(NEW.group_id, NEW.author_id) IS NULL THEN
    RAISE EXCEPTION 'Join the group to post in it.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS community_posts_group_guard ON public.community_posts;
CREATE TRIGGER community_posts_group_guard BEFORE INSERT OR UPDATE OF group_id ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.community_posts_group_guard();

CREATE OR REPLACE FUNCTION public.community_posts_group_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gid uuid := coalesce(NEW.group_id, OLD.group_id);
BEGIN
  IF gid IS NOT NULL THEN
    UPDATE public.community_groups SET post_count = (SELECT count(*) FROM public.community_posts WHERE group_id = gid AND status = 'published') WHERE id = gid;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS community_posts_group_count ON public.community_posts;
CREATE TRIGGER community_posts_group_count AFTER INSERT OR DELETE OR UPDATE OF status ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.community_posts_group_count();

-- Post visibility now also respects private groups.
DROP POLICY IF EXISTS cpo_select ON public.community_posts;
CREATE POLICY cpo_select ON public.community_posts FOR SELECT USING (
  author_id = auth.uid()
  OR public.community_is_staff(auth.uid())
  OR (status = 'published'
      AND (visibility = 'public' OR auth.uid() IS NOT NULL)
      AND public.community_can_see_group_posts(group_id, auth.uid())
      AND NOT public.community_is_blocked(auth.uid(), author_id)
      AND EXISTS (SELECT 1 FROM public.community_profiles p WHERE p.user_id = author_id AND p.suspended_at IS NULL)));

-- Feed: main feed excludes group posts; pass _group for a group's feed.
DROP FUNCTION IF EXISTS public.community_feed(text, integer, timestamptz, uuid, integer, integer, uuid, text, text, text);
CREATE OR REPLACE FUNCTION public.community_feed(
  _sort text DEFAULT 'latest', _limit integer DEFAULT 15,
  _cursor_ts timestamptz DEFAULT NULL, _cursor_id uuid DEFAULT NULL, _cursor_score integer DEFAULT NULL,
  _offset integer DEFAULT 0, _author uuid DEFAULT NULL, _tag text DEFAULT NULL, _kind text DEFAULT NULL,
  _topic text DEFAULT NULL, _group uuid DEFAULT NULL)
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
      AND (_topic IS NULL OR p.topic = _topic)
      AND (CASE WHEN _group IS NULL THEN p.group_id IS NULL ELSE p.group_id = _group END)
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
GRANT EXECUTE ON FUNCTION public.community_feed(text, integer, timestamptz, uuid, integer, integer, uuid, text, text, text, uuid) TO anon, authenticated;
