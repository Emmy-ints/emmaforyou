-- High-tech growth tools: website audits, signed proposals, strategy-call bookings,
-- client portal approvals and invoices, and a cache for AI page translations.

-- 1. Website audit requests (a visitor asks for the full report / expert review).
CREATE TABLE IF NOT EXISTS public.site_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  score integer,
  summary text,
  name text NOT NULL,
  whatsapp text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_audits_url_ok CHECK (url ~* '^https?://' AND char_length(url) <= 300),
  CONSTRAINT site_audits_score_ok CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  CONSTRAINT site_audits_small CHECK (char_length(name) BETWEEN 1 AND 120 AND coalesce(char_length(summary), 0) <= 2000
    AND coalesce(char_length(whatsapp), 0) <= 40 AND coalesce(char_length(email), 0) <= 200),
  CONSTRAINT site_audits_contact CHECK (coalesce(whatsapp, email) IS NOT NULL)
);
ALTER TABLE public.site_audits ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.site_audits TO anon, authenticated;
GRANT SELECT ON public.site_audits TO authenticated;
GRANT ALL ON public.site_audits TO service_role;
DROP POLICY IF EXISTS "Anyone requests an audit" ON public.site_audits;
CREATE POLICY "Anyone requests an audit" ON public.site_audits FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read audits" ON public.site_audits;
CREATE POLICY "Admins read audits" ON public.site_audits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Proposals accepted with a typed signature (snapshot of exactly what was accepted).
CREATE TABLE IF NOT EXISTS public.proposal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  business_name text NOT NULL,
  email text,
  whatsapp text,
  plan text,
  proposal jsonb NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposal_small CHECK (char_length(full_name) BETWEEN 2 AND 120 AND char_length(business_name) BETWEEN 1 AND 160
    AND coalesce(char_length(email), 0) <= 200 AND coalesce(char_length(whatsapp), 0) <= 40
    AND coalesce(char_length(plan), 0) <= 40 AND pg_column_size(proposal) <= 24000),
  CONSTRAINT proposal_contact CHECK (coalesce(whatsapp, email) IS NOT NULL)
);
ALTER TABLE public.proposal_acceptances ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.proposal_acceptances TO anon, authenticated;
GRANT SELECT ON public.proposal_acceptances TO authenticated;
GRANT ALL ON public.proposal_acceptances TO service_role;
DROP POLICY IF EXISTS "Anyone accepts a proposal" ON public.proposal_acceptances;
CREATE POLICY "Anyone accepts a proposal" ON public.proposal_acceptances FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read proposals" ON public.proposal_acceptances;
CREATE POLICY "Admins read proposals" ON public.proposal_acceptances FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Strategy-call bookings. One booking per slot; visitors can see which slots are taken, never who took them.
CREATE TABLE IF NOT EXISTS public.strategy_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_start timestamptz NOT NULL,
  timezone text,
  name text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  business text,
  topic text,
  status text NOT NULL DEFAULT 'booked',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_status_ok CHECK (status IN ('booked', 'cancelled', 'done')),
  CONSTRAINT bookings_slot_ok CHECK (extract(second FROM slot_start) = 0 AND extract(minute FROM slot_start) IN (0, 30)),
  CONSTRAINT bookings_small CHECK (char_length(name) BETWEEN 1 AND 120 AND char_length(whatsapp) BETWEEN 6 AND 40
    AND coalesce(char_length(email), 0) <= 200 AND coalesce(char_length(business), 0) <= 160
    AND coalesce(char_length(topic), 0) <= 600 AND coalesce(char_length(timezone), 0) <= 64)
);
CREATE UNIQUE INDEX IF NOT EXISTS strategy_bookings_slot_unique ON public.strategy_bookings (slot_start) WHERE status = 'booked';
ALTER TABLE public.strategy_bookings ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.strategy_bookings TO anon, authenticated;
GRANT SELECT, UPDATE ON public.strategy_bookings TO authenticated;
GRANT ALL ON public.strategy_bookings TO service_role;
DROP POLICY IF EXISTS "Anyone books a future slot" ON public.strategy_bookings;
CREATE POLICY "Anyone books a future slot" ON public.strategy_bookings FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'booked' AND slot_start > now() + interval '2 hours' AND slot_start < now() + interval '45 days');
DROP POLICY IF EXISTS "Admins manage bookings" ON public.strategy_bookings;
CREATE POLICY "Admins manage bookings" ON public.strategy_bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.booked_slots(p_from timestamptz, p_to timestamptz)
RETURNS SETOF timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT slot_start FROM public.strategy_bookings
  WHERE status = 'booked' AND slot_start >= p_from AND slot_start < least(p_to, p_from + interval '60 days');
$$;
REVOKE ALL ON FUNCTION public.booked_slots(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.booked_slots(timestamptz, timestamptz) TO anon, authenticated;

-- 4. Client portal: deliverables to approve, and invoices.
CREATE TABLE IF NOT EXISTS public.client_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  details text,
  preview_url text,
  status text NOT NULL DEFAULT 'pending',
  client_note text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT approvals_status_ok CHECK (status IN ('pending', 'approved', 'changes_requested')),
  CONSTRAINT approvals_url_ok CHECK (preview_url IS NULL OR preview_url ~* '^https://')
);
ALTER TABLE public.client_approvals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_approvals TO authenticated;
GRANT ALL ON public.client_approvals TO service_role;
DROP POLICY IF EXISTS "Client reads own approvals" ON public.client_approvals;
CREATE POLICY "Client reads own approvals" ON public.client_approvals FOR SELECT TO authenticated
  USING (client_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admin manages approvals" ON public.client_approvals;
CREATE POLICY "Admin manages approvals" ON public.client_approvals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Clients decide only on their own pending items, and can change nothing else.
CREATE OR REPLACE FUNCTION public.decide_approval(p_id uuid, p_status text, p_note text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_status NOT IN ('approved', 'changes_requested') THEN RAISE EXCEPTION 'invalid decision'; END IF;
  UPDATE public.client_approvals
     SET status = p_status, client_note = left(nullif(trim(p_note), ''), 1000), decided_at = now()
   WHERE id = p_id AND client_user_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'not found or already decided'; END IF;
  INSERT INTO public.client_messages (client_user_id, sender, body)
  VALUES (auth.uid(), 'client', CASE WHEN p_status = 'approved' THEN '✅ Approved: ' ELSE '✏️ Changes requested: ' END ||
    (SELECT title FROM public.client_approvals WHERE id = p_id) || coalesce(' — ' || left(nullif(trim(p_note), ''), 500), ''));
END $$;
REVOKE ALL ON FUNCTION public.decide_approval(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_approval(uuid, text, text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.client_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number text NOT NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'unpaid',
  due_date date,
  pay_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_status_ok CHECK (status IN ('unpaid', 'paid', 'void')),
  CONSTRAINT invoices_currency_ok CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT invoices_url_ok CHECK (pay_url IS NULL OR pay_url ~* '^https://')
);
ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_invoices TO authenticated;
GRANT ALL ON public.client_invoices TO service_role;
DROP POLICY IF EXISTS "Client reads own invoices" ON public.client_invoices;
CREATE POLICY "Client reads own invoices" ON public.client_invoices FOR SELECT TO authenticated
  USING (client_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admin manages invoices" ON public.client_invoices;
CREATE POLICY "Admin manages invoices" ON public.client_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can edit projects/tasks they create for clients (existing policies cover ALL); let admins post replies.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_projects, public.client_tasks TO authenticated;
GRANT SELECT, INSERT ON public.client_messages TO authenticated;
GRANT SELECT ON public.client_accounts TO authenticated;

-- 5. AI translation cache (server-only).
CREATE TABLE IF NOT EXISTS public.page_translations (
  hash text PRIMARY KEY,
  lang text NOT NULL,
  translated text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.page_translations ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.page_translations TO service_role;

-- 6. Email the owner for the new lead sources, with readable labels.
DO $$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef('public.notify_new_lead()'::regprocedure) INTO d;
  IF position('site_audits' IN d) = 0 THEN
    d := replace(d, $x$WHEN 'affiliates' THEN 'Affiliate sign-up'$x$,
      $x$WHEN 'affiliates' THEN 'Affiliate sign-up' WHEN 'site_audits' THEN 'Website audit' WHEN 'proposal_acceptances' THEN 'Proposal accepted (signed)' WHEN 'strategy_bookings' THEN 'Strategy call booked'$x$);
    EXECUTE d;
  END IF;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['site_audits','proposal_acceptances','strategy_bookings'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS notify_new_lead ON public.%I', t);
    EXECUTE format('CREATE TRIGGER notify_new_lead AFTER INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead()', t);
  END LOOP;
END $$;
