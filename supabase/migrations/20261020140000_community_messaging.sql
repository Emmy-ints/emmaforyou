-- Community private messaging, the community AI assistant and human takeover.
-- Direct conversations are between two members. Each member also has one assistant conversation
-- with the community AI; staff can take it over. Control is enforced in the database: AI replies
-- carry the control_version they were generated under and are rejected if staff took over (or
-- handed back) in the meantime, so the AI can never talk over a human.
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS public.community_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('direct', 'assistant')),
  member_a uuid NOT NULL REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  member_b uuid REFERENCES public.community_profiles(user_id) ON DELETE CASCADE,
  control text NOT NULL DEFAULT 'ai' CHECK (control IN ('ai', 'human')),
  control_version integer NOT NULL DEFAULT 1,
  assigned_staff uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  specialist text,
  human_requested_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'direct' AND member_b IS NOT NULL AND member_a < member_b) OR (kind = 'assistant' AND member_b IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS community_conv_direct_uniq ON public.community_conversations (member_a, member_b) WHERE kind = 'direct';
CREATE UNIQUE INDEX IF NOT EXISTS community_conv_assistant_uniq ON public.community_conversations (member_a) WHERE kind = 'assistant';
CREATE INDEX IF NOT EXISTS community_conv_b_idx ON public.community_conversations (member_b, last_message_at DESC);
CREATE INDEX IF NOT EXISTS community_conv_inbox_idx ON public.community_conversations (kind, human_requested_at DESC NULLS LAST, last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.community_conversations(id) ON DELETE CASCADE,
  sender_kind text NOT NULL CHECK (sender_kind IN ('member', 'ai', 'staff', 'system')),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
  control_version integer,
  client_key uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, client_key)
);
CREATE INDEX IF NOT EXISTS community_messages_conv_idx ON public.community_messages (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS public.community_conversation_reads (
  conversation_id uuid NOT NULL REFERENCES public.community_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Who may see a conversation: its members, and staff for assistant conversations.
CREATE OR REPLACE FUNCTION public.community_can_see_conversation(_conv uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _uid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.community_conversations c WHERE c.id = _conv
      AND (c.member_a = _uid OR c.member_b = _uid OR (c.kind = 'assistant' AND public.community_is_staff(_uid))));
$$;

ALTER TABLE public.community_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_conversation_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_conversations, public.community_messages, public.community_conversation_reads FROM anon, authenticated;
GRANT SELECT ON public.community_conversations TO authenticated;
GRANT SELECT ON public.community_messages TO authenticated;
GRANT INSERT (conversation_id, sender_kind, sender_id, body, client_key) ON public.community_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.community_conversation_reads TO authenticated;
GRANT ALL ON public.community_conversations, public.community_messages, public.community_conversation_reads TO service_role;

DROP POLICY IF EXISTS cconv_select ON public.community_conversations;
CREATE POLICY cconv_select ON public.community_conversations FOR SELECT TO authenticated USING (public.community_can_see_conversation(id, auth.uid()));
DROP POLICY IF EXISTS cmsg_select ON public.community_messages;
CREATE POLICY cmsg_select ON public.community_messages FOR SELECT TO authenticated USING (public.community_can_see_conversation(conversation_id, auth.uid()));
DROP POLICY IF EXISTS cmsg_insert ON public.community_messages;
CREATE POLICY cmsg_insert ON public.community_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND sender_kind IN ('member', 'staff'));
DROP POLICY IF EXISTS cread_own ON public.community_conversation_reads;
CREATE POLICY cread_own ON public.community_conversation_reads FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.community_can_see_conversation(conversation_id, auth.uid()));

-- Message rules (run for every insert, including the server's AI replies).
CREATE OR REPLACE FUNCTION public.community_messages_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.community_conversations; recent integer; other uuid;
BEGIN
  SELECT * INTO c FROM public.community_conversations WHERE id = NEW.conversation_id FOR UPDATE;
  IF c IS NULL THEN RAISE EXCEPTION 'Conversation not found.' USING ERRCODE = 'P0002'; END IF;
  NEW.body := btrim(NEW.body);
  NEW.created_at := now();
  IF NEW.sender_kind = 'member' THEN
    IF NEW.sender_id IS DISTINCT FROM c.member_a AND NEW.sender_id IS DISTINCT FROM c.member_b THEN
      RAISE EXCEPTION 'You are not part of this conversation.' USING ERRCODE = '42501';
    END IF;
    IF EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = NEW.sender_id AND suspended_at IS NOT NULL) THEN
      RAISE EXCEPTION 'Your account is suspended.' USING ERRCODE = '42501';
    END IF;
    IF c.kind = 'direct' THEN
      other := CASE WHEN c.member_a = NEW.sender_id THEN c.member_b ELSE c.member_a END;
      IF public.community_is_blocked(NEW.sender_id, other) THEN RAISE EXCEPTION 'You can''t message this member.' USING ERRCODE = '42501'; END IF;
    END IF;
    SELECT count(*) INTO recent FROM public.community_messages WHERE sender_id = NEW.sender_id AND created_at > now() - interval '1 minute';
    IF recent >= 20 THEN RAISE EXCEPTION 'You''re sending messages too quickly. Please wait a moment.' USING ERRCODE = '54000'; END IF;
    NEW.control_version := c.control_version;
  ELSIF NEW.sender_kind = 'staff' THEN
    IF c.kind <> 'assistant' OR NOT public.community_is_staff(NEW.sender_id) THEN RAISE EXCEPTION 'Only staff can reply here.' USING ERRCODE = '42501'; END IF;
    IF c.control <> 'human' THEN RAISE EXCEPTION 'Take over the conversation before replying.' USING ERRCODE = '42501'; END IF;
    NEW.control_version := c.control_version;
  ELSIF NEW.sender_kind = 'ai' THEN
    -- Only the server (service role) writes AI replies; they must match the current control state.
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' AND current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Not allowed.' USING ERRCODE = '42501';
    END IF;
    IF c.kind <> 'assistant' OR c.control <> 'ai' OR NEW.control_version IS DISTINCT FROM c.control_version THEN
      RAISE EXCEPTION 'stale_control: a team member is handling this conversation.' USING ERRCODE = '40001';
    END IF;
    NEW.sender_id := NULL;
  ELSE
    IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN RAISE EXCEPTION 'Not allowed.' USING ERRCODE = '42501'; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS community_messages_guard ON public.community_messages;
CREATE TRIGGER community_messages_guard BEFORE INSERT ON public.community_messages FOR EACH ROW EXECUTE FUNCTION public.community_messages_guard();

CREATE OR REPLACE FUNCTION public.community_messages_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.community_conversations; target uuid;
BEGIN
  UPDATE public.community_conversations SET last_message_at = NEW.created_at, last_message_preview = left(NEW.body, 140), status = 'open'
   WHERE id = NEW.conversation_id RETURNING * INTO c;
  IF NEW.sender_id IS NOT NULL THEN
    INSERT INTO public.community_conversation_reads (conversation_id, user_id, last_read_at) VALUES (NEW.conversation_id, NEW.sender_id, NEW.created_at)
    ON CONFLICT (conversation_id, user_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS community_messages_after ON public.community_messages;
CREATE TRIGGER community_messages_after AFTER INSERT ON public.community_messages FOR EACH ROW EXECUTE FUNCTION public.community_messages_after();

-- Start (or reopen) a direct conversation with another member.
CREATE OR REPLACE FUNCTION public.community_start_direct(_other uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); a uuid; b uuid; cid uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Sign in first.' USING ERRCODE = '42501'; END IF;
  IF _other = me THEN RAISE EXCEPTION 'You can''t message yourself.' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = me) THEN RAISE EXCEPTION 'Create your community profile first.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = _other AND suspended_at IS NULL) THEN RAISE EXCEPTION 'Member not found.' USING ERRCODE = 'P0002'; END IF;
  IF public.community_is_blocked(me, _other) THEN RAISE EXCEPTION 'You can''t message this member.' USING ERRCODE = '42501'; END IF;
  a := least(me, _other); b := greatest(me, _other);
  INSERT INTO public.community_conversations (kind, member_a, member_b) VALUES ('direct', a, b)
  ON CONFLICT (member_a, member_b) WHERE kind = 'direct' DO UPDATE SET status = 'open'
  RETURNING id INTO cid;
  RETURN cid;
END $$;
REVOKE ALL ON FUNCTION public.community_start_direct(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_start_direct(uuid) TO authenticated;

-- The caller's assistant conversation (created on first use).
CREATE OR REPLACE FUNCTION public.community_assistant_conversation()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); cid uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Sign in first.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.community_profiles WHERE user_id = me) THEN RAISE EXCEPTION 'Create your community profile first.' USING ERRCODE = '42501'; END IF;
  SELECT id INTO cid FROM public.community_conversations WHERE kind = 'assistant' AND member_a = me;
  IF cid IS NULL THEN
    INSERT INTO public.community_conversations (kind, member_a) VALUES ('assistant', me)
    ON CONFLICT (member_a) WHERE kind = 'assistant' DO NOTHING RETURNING id INTO cid;
    IF cid IS NULL THEN SELECT id INTO cid FROM public.community_conversations WHERE kind = 'assistant' AND member_a = me; END IF;
  END IF;
  RETURN cid;
END $$;
REVOKE ALL ON FUNCTION public.community_assistant_conversation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_assistant_conversation() TO authenticated;

-- Member asks for a person; staff take over or hand back. Each change bumps control_version.
CREATE OR REPLACE FUNCTION public.community_request_human()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.community_conversations SET human_requested_at = coalesce(human_requested_at, now())
   WHERE kind = 'assistant' AND member_a = auth.uid();
  INSERT INTO public.community_messages (conversation_id, sender_kind, body)
  SELECT id, 'system', 'You asked to talk to a person. A member of the EmmaForYou team will reply here.'
    FROM public.community_conversations WHERE kind = 'assistant' AND member_a = auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.community_request_human() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_request_human() TO authenticated;

CREATE OR REPLACE FUNCTION public.community_set_control(_conv uuid, _control text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v integer;
BEGIN
  IF NOT public.community_is_staff(uid) THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  IF _control NOT IN ('ai', 'human') THEN RAISE EXCEPTION 'Unknown control.' USING ERRCODE = '22023'; END IF;
  UPDATE public.community_conversations SET control = _control, control_version = control_version + 1,
    assigned_staff = CASE WHEN _control = 'human' THEN uid ELSE NULL END,
    human_requested_at = CASE WHEN _control = 'ai' THEN NULL ELSE human_requested_at END
   WHERE id = _conv AND kind = 'assistant' RETURNING control_version INTO v;
  IF v IS NULL THEN RAISE EXCEPTION 'Not found.' USING ERRCODE = 'P0002'; END IF;
  INSERT INTO public.community_messages (conversation_id, sender_kind, body)
  VALUES (_conv, 'system', CASE WHEN _control = 'human' THEN 'A member of the EmmaForYou team has joined the conversation.' ELSE 'The team member has handed you back to the community assistant.' END);
  INSERT INTO public.community_audit_log (actor_id, action, target_type, target_id, details)
  VALUES (uid, 'control_' || _control, 'conversation', _conv, jsonb_build_object('version', v));
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.community_set_control(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_set_control(uuid, text) TO authenticated;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_conversations;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END $$;
