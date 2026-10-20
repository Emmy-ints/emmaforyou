-- Members can delete their own community profile (their posts, comments, reactions, follows and
-- notifications cascade). Their EmmaForYou login and any client-portal data are untouched.
CREATE OR REPLACE FUNCTION public.community_delete_my_profile()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in first.' USING ERRCODE = '42501'; END IF;
  DELETE FROM public.community_profiles WHERE user_id = uid;
  INSERT INTO public.community_audit_log (actor_id, action, target_type, target_id) VALUES (uid, 'delete_own_profile', 'profile', uid);
END $$;
REVOKE ALL ON FUNCTION public.community_delete_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_delete_my_profile() TO authenticated;
