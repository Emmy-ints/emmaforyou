-- Email the owner (via Resend) the moment a lead lands in any lead table.
-- The API key and recipient live in Supabase Vault (secrets 'resend_api_key' and 'lead_alert_to'),
-- never in code. pg_net sends asynchronously, so form submissions are never slowed down or blocked.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.lead_alert_log (
  id bigserial PRIMARY KEY,
  source_table text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_alert_log ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.lead_alert_log TO service_role;

CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  api_key text;
  alert_to text;
  r jsonb := to_jsonb(NEW);
  who text;
  phone text;
  digits text;
  label text;
  rows_html text := '';
  k text;
  v text;
  wa text := '';
BEGIN
  SELECT decrypted_secret INTO api_key FROM vault.decrypted_secrets WHERE name = 'resend_api_key';
  SELECT decrypted_secret INTO alert_to FROM vault.decrypted_secrets WHERE name = 'lead_alert_to';
  IF api_key IS NULL OR alert_to IS NULL THEN RETURN NEW; END IF;

  -- Spam guard: at most 40 alert emails per hour.
  IF (SELECT count(*) FROM public.lead_alert_log WHERE created_at > now() - interval '1 hour') >= 40 THEN
    RETURN NEW;
  END IF;
  label := CASE TG_TABLE_NAME
    WHEN 'business_intakes' THEN 'Business profile'
    WHEN 'leads' THEN CASE WHEN r->>'source' = 'waitlist' THEN 'Waitlist sign-up' ELSE 'Business analyser' END
    WHEN 'quiz_results' THEN 'Growth quiz'
    WHEN 'lead_magnet_downloads' THEN 'Free resource download'
    WHEN 'roi_calculations' THEN 'ROI calculator'
    WHEN 'email_sequence_leads' THEN 'Email generator'
    WHEN 'affiliates' THEN 'Affiliate sign-up'
    ELSE TG_TABLE_NAME END;

  -- Anonymous ROI calculations aren't leads.
  IF TG_TABLE_NAME = 'roi_calculations' AND coalesce(r->>'name', r->>'whatsapp', r->>'email') IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.lead_alert_log (source_table) VALUES (TG_TABLE_NAME);

  who := coalesce(nullif(r->>'full_name', ''), nullif(r->>'name', ''), 'Someone');
  phone := coalesce(r->>'whatsapp', '');
  digits := regexp_replace(phone, '\D', '', 'g');
  IF length(digits) = 11 AND left(digits, 1) = '0' THEN digits := '234' || substr(digits, 2); END IF;
  IF length(digits) >= 8 THEN
    wa := '<p style="margin:24px 0"><a href="https://wa.me/' || digits || '?text=' ||
      replace(replace('Hi ' || split_part(who, ' ', 1) || ', this is Emmanuel from EmmaForYou. Thanks for reaching out!', ' ', '%20'), '!', '%21') ||
      '" style="background:#25d366;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Reply on WhatsApp</a></p>';
  END IF;

  FOR k, v IN SELECT key, value::text FROM jsonb_each(r) LOOP
    CONTINUE WHEN k IN ('id', 'consent') OR v IS NULL OR v IN ('null', '""', '[]', '{}');
    rows_html := rows_html || '<tr><td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap">' ||
      initcap(replace(k, '_', ' ')) || '</td><td style="padding:6px 0;color:#111827">' ||
      replace(replace(replace(trim(both '"' from v), '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</td></tr>';
  END LOOP;

  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'EmmaForYou Leads <onboarding@resend.dev>',
      'to', jsonb_build_array(alert_to),
      'subject', '🎯 New lead: ' || who || ' — ' || label,
      'html', '<div style="font-family:Arial,sans-serif;max-width:560px">' ||
        '<h2 style="margin:0 0 4px">New lead from your website</h2>' ||
        '<p style="margin:0 0 16px;color:#6b7280">' || label || '</p>' || wa ||
        '<table style="border-collapse:collapse;font-size:14px">' || rows_html || '</table>' ||
        '<p style="margin-top:24px;font-size:12px;color:#9ca3af">See every lead in your dashboard: /dashboard</p></div>'
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let an alert problem stop a lead from being saved.
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_new_lead() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leads','business_intakes','quiz_results','lead_magnet_downloads','roi_calculations','email_sequence_leads','affiliates'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS notify_new_lead ON public.%I', t);
    EXECUTE format('CREATE TRIGGER notify_new_lead AFTER INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead()', t);
  END LOOP;
END $$;
