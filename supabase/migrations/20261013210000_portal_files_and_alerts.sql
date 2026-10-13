-- Client portal: private file sharing both ways, safe profile edits, and owner alerts for client activity.

-- Private storage bucket; each client's files live under "<user id>/...".
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('client-files', 'client-files', false, 20971520)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "client-files read own" ON storage.objects;
CREATE POLICY "client-files read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-files' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "client-files upload own" ON storage.objects;
CREATE POLICY "client-files upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-files' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'::app_role)));
DROP POLICY IF EXISTS "client-files admin delete" ON storage.objects;
CREATE POLICY "client-files admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-files' AND public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.client_files ADD COLUMN IF NOT EXISTS uploaded_by text NOT NULL DEFAULT 'team';
DO $$ BEGIN
  ALTER TABLE public.client_files ADD CONSTRAINT client_files_uploader_ok CHECK (uploaded_by IN ('team', 'client'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT SELECT, INSERT ON public.client_files TO authenticated;
DROP POLICY IF EXISTS "Client adds own file rows" ON public.client_files;
CREATE POLICY "Client adds own file rows" ON public.client_files FOR INSERT TO authenticated
  WITH CHECK (client_user_id = auth.uid() AND uploaded_by = 'client');

-- Clients may edit only their name and business name (not plan or manager).
DROP POLICY IF EXISTS "Clients update own account" ON public.client_accounts;
CREATE OR REPLACE FUNCTION public.update_my_profile(p_full_name text, p_business_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF char_length(trim(p_full_name)) < 2 OR char_length(trim(p_business_name)) < 1 THEN RAISE EXCEPTION 'name required'; END IF;
  UPDATE public.client_accounts
     SET full_name = left(trim(p_full_name), 120), business_name = left(trim(p_business_name), 160),
         avatar_initials = upper(left(trim(p_full_name), 2))
   WHERE user_id = auth.uid();
END $$;
REVOKE ALL ON FUNCTION public.update_my_profile(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text) TO authenticated;

-- Email the owner when a client sends a message (approvals and requests arrive as messages too).
CREATE OR REPLACE FUNCTION public.notify_client_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE api_key text; alert_to text; who text; biz text;
BEGIN
  IF NEW.sender <> 'client' THEN RETURN NEW; END IF;
  SELECT decrypted_secret INTO api_key FROM vault.decrypted_secrets WHERE name = 'resend_api_key';
  SELECT decrypted_secret INTO alert_to FROM vault.decrypted_secrets WHERE name = 'lead_alert_to';
  IF api_key IS NULL OR alert_to IS NULL THEN RETURN NEW; END IF;
  IF (SELECT count(*) FROM public.lead_alert_log WHERE created_at > now() - interval '1 hour') >= 40 THEN RETURN NEW; END IF;
  INSERT INTO public.lead_alert_log (source_table) VALUES ('client_messages');
  SELECT full_name, business_name INTO who, biz FROM public.client_accounts WHERE user_id = NEW.client_user_id;
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'EmmaForYou Portal <onboarding@resend.dev>',
      'to', jsonb_build_array(alert_to),
      'subject', '💬 Client portal: ' || coalesce(who, 'A client') || coalesce(' (' || biz || ')', ''),
      'html', '<div style="font-family:Arial,sans-serif;max-width:560px"><h2 style="margin:0 0 8px">New message in the client portal</h2>' ||
        '<p style="color:#6b7280;margin:0 0 16px">' || replace(replace(coalesce(who, 'A client') || coalesce(' · ' || biz, ''), '<', '&lt;'), '>', '&gt;') || '</p>' ||
        '<p style="white-space:pre-wrap;font-size:15px">' || replace(replace(replace(NEW.body, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>' ||
        '<p style="margin-top:24px;font-size:12px;color:#9ca3af">Reply from your dashboard: /dashboard (Clients)</p></div>'));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.notify_client_message() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_client_message ON public.client_messages;
CREATE TRIGGER notify_client_message AFTER INSERT ON public.client_messages FOR EACH ROW EXECUTE FUNCTION public.notify_client_message();
