-- Number of the caller's conversations with messages they haven't read (for the Messages badge).
CREATE OR REPLACE FUNCTION public.community_unread_conversations()
RETURNS integer LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT count(*)::int FROM public.community_conversations c
  LEFT JOIN public.community_conversation_reads r ON r.conversation_id = c.id AND r.user_id = auth.uid()
  WHERE (c.member_a = auth.uid() OR c.member_b = auth.uid())
    AND c.last_message_preview IS NOT NULL
    AND (r.last_read_at IS NULL OR r.last_read_at < c.last_message_at);
$$;
REVOKE ALL ON FUNCTION public.community_unread_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_unread_conversations() TO authenticated;
