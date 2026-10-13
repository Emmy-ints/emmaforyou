-- Case study details (owner-edited), newsletter with welcome email, and verified client reviews.

-- 1. Case studies: one row per portfolio project slug. Public can read published rows; only admins write.
CREATE TABLE IF NOT EXISTS public.case_studies (
  slug text PRIMARY KEY,
  published boolean NOT NULL DEFAULT false,
  client_role text,
  challenge text,
  approach text,
  deliverables text[] NOT NULL DEFAULT '{}',
  results text,
  timeline text,
  quote text,
  quote_author text,
  screenshots text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT case_studies_small CHECK (coalesce(char_length(challenge),0) <= 3000 AND coalesce(char_length(approach),0) <= 4000
    AND coalesce(char_length(results),0) <= 3000 AND coalesce(char_length(quote),0) <= 1000 AND cardinality(screenshots) <= 8 AND cardinality(deliverables) <= 15)
);
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.case_studies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.case_studies TO authenticated;
GRANT ALL ON public.case_studies TO service_role;
DROP POLICY IF EXISTS "Anyone reads published case studies" ON public.case_studies;
CREATE POLICY "Anyone reads published case studies" ON public.case_studies FOR SELECT TO anon, authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage case studies" ON public.case_studies;
CREATE POLICY "Admins manage case studies" ON public.case_studies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Public bucket for case study screenshots (admins upload, anyone views).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('case-study-media', 'case-study-media', true, 5242880, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "case-study-media admin write" ON storage.objects;
CREATE POLICY "case-study-media admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'case-study-media' AND public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "case-study-media admin delete" ON storage.objects;
CREATE POLICY "case-study-media admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'case-study-media' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Newsletter.
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  source text,
  language text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'subscribed',
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  welcomed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_email_ok CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(email) <= 200),
  CONSTRAINT newsletter_status_ok CHECK (status IN ('subscribed', 'unsubscribed')),
  CONSTRAINT newsletter_small CHECK (coalesce(char_length(name),0) <= 120 AND coalesce(char_length(source),0) <= 60 AND language IN ('en','fr','de'))
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_email_unique ON public.newsletter_subscribers (lower(email));
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
DROP POLICY IF EXISTS "Admins read subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Visitors subscribe through a function (re-subscribes quietly, never reveals whether an email exists).
CREATE OR REPLACE FUNCTION public.newsletter_subscribe(p_email text, p_name text, p_source text, p_language text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.newsletter_subscribers (email, name, source, language)
  VALUES (lower(trim(p_email)), nullif(left(trim(coalesce(p_name, '')), 120), ''), left(coalesce(p_source, 'site'), 60),
          CASE WHEN p_language IN ('fr','de') THEN p_language ELSE 'en' END)
  ON CONFLICT (lower(email)) DO UPDATE SET status = 'subscribed';
END $$;
REVOKE ALL ON FUNCTION public.newsletter_subscribe(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.newsletter_subscribe(text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.newsletter_unsubscribe(p_token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.newsletter_subscribers SET status = 'unsubscribed' WHERE unsubscribe_token = p_token;
  RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.newsletter_unsubscribe(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.newsletter_unsubscribe(uuid) TO anon, authenticated;

-- Welcome email via Resend. Sends only when Vault has 'newsletter_from' (a sender on a domain verified
-- in Resend, e.g. 'EmmaForYou <hello@yourdomain.com>') and 'site_url'. Until then, sign-ups are stored.
CREATE OR REPLACE FUNCTION public.newsletter_welcome()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE api_key text; sender text; site text; subj text; intro text; unsub text; hi text;
BEGIN
  IF NEW.status <> 'subscribed' OR NEW.welcomed_at IS NOT NULL THEN RETURN NEW; END IF;
  SELECT decrypted_secret INTO api_key FROM vault.decrypted_secrets WHERE name = 'resend_api_key';
  SELECT decrypted_secret INTO sender FROM vault.decrypted_secrets WHERE name = 'newsletter_from';
  SELECT decrypted_secret INTO site FROM vault.decrypted_secrets WHERE name = 'site_url';
  IF api_key IS NULL OR sender IS NULL OR site IS NULL THEN RETURN NEW; END IF;
  unsub := site || '/unsubscribe?t=' || NEW.unsubscribe_token;
  hi := coalesce(split_part(NEW.name, ' ', 1), '');
  IF NEW.language = 'fr' THEN
    subj := 'Bienvenue chez EmmaForYou 👋';
    intro := 'Merci de votre inscription' || CASE WHEN hi <> '' THEN ', ' || hi ELSE '' END || ' ! Chaque mois, vous recevrez des idées concrètes pour obtenir plus de clients : automatisation IA, sites web, marketing et conversion.';
  ELSIF NEW.language = 'de' THEN
    subj := 'Willkommen bei EmmaForYou 👋';
    intro := 'Danke für Ihre Anmeldung' || CASE WHEN hi <> '' THEN ', ' || hi ELSE '' END || '! Jeden Monat erhalten Sie praktische Ideen für mehr Kunden: KI-Automatisierung, Websites, Marketing und Conversion.';
  ELSE
    subj := 'Welcome to EmmaForYou 👋';
    intro := 'Thanks for subscribing' || CASE WHEN hi <> '' THEN ', ' || hi ELSE '' END || '! Each month you''ll get practical ideas to win more customers: AI automation, websites, marketing and conversion.';
  END IF;
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', sender, 'to', jsonb_build_array(NEW.email), 'subject', subj,
      'headers', jsonb_build_object('List-Unsubscribe', '<' || unsub || '>'),
      'html', '<div style="font-family:Arial,sans-serif;max-width:560px;line-height:1.6;color:#111827">' ||
        '<h2 style="margin:0 0 12px">' || subj || '</h2><p>' || replace(replace(intro, '<', '&lt;'), '>', '&gt;') || '</p>' ||
        '<p><strong>Start here:</strong></p><ul>' ||
        '<li><a href="' || site || '/website-audit">Free website audit</a></li>' ||
        '<li><a href="' || site || '/tools">All free tools</a></li>' ||
        '<li><a href="' || site || '/book">Book a free 30-minute strategy call</a></li></ul>' ||
        '<p>— Emmanuel, EmmaForYou</p>' ||
        '<p style="font-size:12px;color:#9ca3af">You received this because you subscribed at ' || site || '. <a href="' || unsub || '">Unsubscribe</a></p></div>'));
  UPDATE public.newsletter_subscribers SET welcomed_at = now() WHERE id = NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.newsletter_welcome() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS newsletter_welcome ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_welcome AFTER INSERT ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION public.newsletter_welcome();

-- 3. Verified client reviews from the portal.
CREATE TABLE IF NOT EXISTS public.client_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approval_id uuid REFERENCES public.client_approvals(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL CHECK (char_length(body) BETWEEN 10 AND 1200),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 120),
  business text CHECK (business IS NULL OR char_length(business) <= 160),
  may_publish boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_testimonials ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.client_testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.client_testimonials TO authenticated;
GRANT ALL ON public.client_testimonials TO service_role;
DROP POLICY IF EXISTS "Public reads approved reviews" ON public.client_testimonials;
CREATE POLICY "Public reads approved reviews" ON public.client_testimonials FOR SELECT TO anon, authenticated
  USING ((approved AND may_publish) OR client_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Client writes own review" ON public.client_testimonials;
CREATE POLICY "Client writes own review" ON public.client_testimonials FOR INSERT TO authenticated
  WITH CHECK (client_user_id = auth.uid() AND approved = false);
DROP POLICY IF EXISTS "Admins manage reviews" ON public.client_testimonials;
CREATE POLICY "Admins manage reviews" ON public.client_testimonials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Owner is emailed about new reviews (reuses the client-message alert path).
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.client_messages (client_user_id, sender, body)
  VALUES (NEW.client_user_id, 'client', '⭐ Left a ' || NEW.rating || '-star review: "' || left(NEW.body, 400) || '"' ||
    CASE WHEN NEW.may_publish THEN ' (OK to publish)' ELSE ' (private)' END);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.notify_new_review() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_new_review ON public.client_testimonials;
CREATE TRIGGER notify_new_review AFTER INSERT ON public.client_testimonials FOR EACH ROW EXECUTE FUNCTION public.notify_new_review();
