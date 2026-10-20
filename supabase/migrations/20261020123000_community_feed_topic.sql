-- Community feed: add an optional topic filter (one of the community topics, e.g. 'ai-solutions').
-- The old 9-argument version is dropped so there is exactly one community_feed.
DROP FUNCTION IF EXISTS public.community_feed(text, integer, timestamptz, uuid, integer, integer, uuid, text, text);
CREATE OR REPLACE FUNCTION public.community_feed(
  _sort text DEFAULT 'latest', _limit integer DEFAULT 15,
  _cursor_ts timestamptz DEFAULT NULL, _cursor_id uuid DEFAULT NULL, _cursor_score integer DEFAULT NULL,
  _offset integer DEFAULT 0, _author uuid DEFAULT NULL, _tag text DEFAULT NULL, _kind text DEFAULT NULL,
  _topic text DEFAULT NULL)
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
GRANT EXECUTE ON FUNCTION public.community_feed(text, integer, timestamptz, uuid, integer, integer, uuid, text, text, text) TO anon, authenticated;
