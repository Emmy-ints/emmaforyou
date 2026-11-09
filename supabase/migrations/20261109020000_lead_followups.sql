-- WhatsApp follow-up progress per lead (dashboard → Follow-ups). The lead itself stays in its own table;
-- lead_key is the dashboard's lead id (e.g. "a-<uuid>" for a website audit). Staff with enquiries.read
-- (admin, editor, marketing, analyst) can see and update progress. Messages are sent by a person from
-- their own WhatsApp; nothing here sends anything.
CREATE TABLE IF NOT EXISTS public.lead_followups (
  lead_key text PRIMARY KEY CHECK (lead_key ~ '^[a-z]{1,3}-[A-Za-z0-9-]{1,64}$'),
  step smallint NOT NULL DEFAULT 0 CHECK (step BETWEEN 0 AND 3),
  outcome text NOT NULL DEFAULT 'open' CHECK (outcome IN ('open', 'replied', 'booked', 'won', 'lost')),
  last_sent_at timestamptz,
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  updated_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_followups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lead_followups FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.lead_followups TO authenticated;

DROP POLICY IF EXISTS "staff read followups" ON public.lead_followups;
CREATE POLICY "staff read followups" ON public.lead_followups FOR SELECT TO authenticated USING (public.site_can('enquiries.read'));
DROP POLICY IF EXISTS "staff add followups" ON public.lead_followups;
CREATE POLICY "staff add followups" ON public.lead_followups FOR INSERT TO authenticated WITH CHECK (public.site_can('enquiries.read'));
DROP POLICY IF EXISTS "staff update followups" ON public.lead_followups;
CREATE POLICY "staff update followups" ON public.lead_followups FOR UPDATE TO authenticated USING (public.site_can('enquiries.read')) WITH CHECK (public.site_can('enquiries.read'));

CREATE OR REPLACE FUNCTION public.lead_followups_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS lead_followups_touch ON public.lead_followups;
CREATE TRIGGER lead_followups_touch BEFORE INSERT OR UPDATE ON public.lead_followups FOR EACH ROW EXECUTE FUNCTION public.lead_followups_touch();
