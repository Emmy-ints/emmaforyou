-- One EmmaForYou account everywhere.
-- The community, client portal and owner dashboard already share one identity store (auth.users,
-- email + password) and one browser session on this single origin. What differed was what each
-- area set up for a new account: portal sign-ups got a client record, community sign-ups did not,
-- so a community member opening the portal had no client record. This migration lets any signed-in,
-- email-verified account open its own client portal record (and nothing more), reports which
-- areas an account has, and tightens how the admin role is granted. Idempotent.

-- 1. Admin role from the admin email list only once the address is verified.
--    Before: granted at sign-up, before the owner of the address had confirmed it.
CREATE OR REPLACE FUNCTION public.grant_admin_to_listed_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS grant_admin_to_listed_email ON auth.users;
CREATE TRIGGER grant_admin_to_listed_email
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_to_listed_email();

-- 2. Which areas does the signed-in account have? (Only ever about the caller.)
CREATE OR REPLACE FUNCTION public.my_account_summary()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'email', (SELECT email FROM auth.users WHERE id = auth.uid()),
    'email_verified', (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = auth.uid()),
    'client_portal', EXISTS (SELECT 1 FROM public.client_accounts WHERE user_id = auth.uid()),
    'community_profile', (SELECT username FROM public.community_profiles WHERE user_id = auth.uid()),
    'admin', public.has_role(auth.uid(), 'admin'::app_role),
    'staff', public.community_is_staff(auth.uid())
  ) WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.my_account_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_account_summary() TO authenticated;

-- 3. Open the client portal for an existing account (e.g. one created in the community).
--    Creates only the caller's own client record and the 'client' role; never any other role.
CREATE OR REPLACE FUNCTION public.activate_client_portal(_full_name text, _business_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); verified boolean; mail text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in first.' USING ERRCODE = '42501'; END IF;
  SELECT email_confirmed_at IS NOT NULL, email INTO verified, mail FROM auth.users WHERE id = uid;
  IF NOT coalesce(verified, false) THEN RAISE EXCEPTION 'Confirm your email address first.' USING ERRCODE = '42501'; END IF;
  _full_name := left(btrim(coalesce(_full_name, '')), 80);
  _business_name := left(btrim(coalesce(_business_name, '')), 120);
  IF _full_name = '' THEN _full_name := split_part(mail, '@', 1); END IF;
  IF _business_name = '' THEN _business_name := 'My Business'; END IF;
  INSERT INTO public.client_accounts (user_id, full_name, business_name, avatar_initials)
  VALUES (uid, _full_name, _business_name, upper(left(_full_name, 2)))
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'client') ON CONFLICT DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.activate_client_portal(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_client_portal(text, text) TO authenticated;

-- 4. Accounts created from the shared sign-in page or the community don't get a client record
--    automatically (they can open the portal later with activate_client_portal); portal sign-ups
--    still do, exactly as before.
CREATE OR REPLACE FUNCTION public.handle_new_client_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'signup_source', '') IN ('community', 'account') THEN
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
