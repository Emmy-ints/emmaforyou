-- eBook publishing & book marketing: private author projects, publishing enquiries and usage
-- monitoring for the book tools. Owners see only their own projects; staff see counts and
-- errors, never manuscript contents.

-- ---------------------------------------------------------------- author projects
CREATE TABLE IF NOT EXISTS public.book_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('book', 'cover', 'mockup', 'marketing', 'analysis', 'launch', 'royalty', 'readiness')),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'ready', 'published', 'archived')),
  -- the tool's saved state (manuscript, design settings, drafts, plan); capped so one row can't grow without limit
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object' AND pg_column_size(data) < 2500000),
  -- small facts shown in the workspace list (word count, chapters, last export, preview image)
  meta jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(meta) = 'object' AND pg_column_size(meta) < 300000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS book_projects_user_idx ON public.book_projects (user_id, updated_at DESC);

ALTER TABLE public.book_projects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.book_projects FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_projects TO authenticated;
GRANT ALL ON public.book_projects TO service_role;
DROP POLICY IF EXISTS bp_own ON public.book_projects;
CREATE POLICY bp_own ON public.book_projects FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.book_projects_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO n FROM public.book_projects WHERE user_id = NEW.user_id;
    IF n >= 200 THEN RAISE EXCEPTION 'You can keep up to 200 book projects. Delete old ones to save new ones.' USING ERRCODE = '54000'; END IF;
    NEW.created_at := now();
  ELSE
    NEW.user_id := OLD.user_id; -- a project can't be moved to another account
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS book_projects_guard ON public.book_projects;
CREATE TRIGGER book_projects_guard BEFORE INSERT OR UPDATE ON public.book_projects FOR EACH ROW EXECUTE FUNCTION public.book_projects_guard();

-- ---------------------------------------------------------------- tool usage (no content)
CREATE TABLE IF NOT EXISTS public.book_tool_usage (
  id bigserial PRIMARY KEY,
  tool text NOT NULL CHECK (char_length(tool) BETWEEN 2 AND 48),
  action text NOT NULL CHECK (char_length(action) BETWEEN 2 AND 48),
  ok boolean NOT NULL,
  ms integer CHECK (ms IS NULL OR ms BETWEEN 0 AND 600000),
  error text CHECK (error IS NULL OR char_length(error) <= 300),
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS book_tool_usage_created_idx ON public.book_tool_usage (created_at DESC);
ALTER TABLE public.book_tool_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.book_tool_usage FROM anon, authenticated;
-- browsers report export/render outcomes (insert only); nobody but staff reads them
GRANT INSERT ON public.book_tool_usage TO anon, authenticated;
GRANT SELECT ON public.book_tool_usage TO authenticated; -- rows visible only through the staff policy below
GRANT USAGE, SELECT ON SEQUENCE public.book_tool_usage_id_seq TO anon, authenticated, service_role;
GRANT ALL ON public.book_tool_usage TO service_role;
DROP POLICY IF EXISTS btu_insert ON public.book_tool_usage;
CREATE POLICY btu_insert ON public.book_tool_usage FOR INSERT TO anon, authenticated
  WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND tool ~ '^[a-z0-9_-]+$' AND action ~ '^[a-z0-9_-]+$');
DROP POLICY IF EXISTS btu_staff ON public.book_tool_usage;
CREATE POLICY btu_staff ON public.book_tool_usage FOR SELECT TO authenticated USING (public.site_can('analytics.read'));

CREATE OR REPLACE FUNCTION public.book_tool_usage_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.book_tool_usage WHERE created_at > now() - interval '1 hour') >= 3000 THEN RETURN NULL; END IF; -- drop silently when flooded
  NEW.created_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS book_tool_usage_guard ON public.book_tool_usage;
CREATE TRIGGER book_tool_usage_guard BEFORE INSERT ON public.book_tool_usage FOR EACH ROW EXECUTE FUNCTION public.book_tool_usage_guard();

-- ---------------------------------------------------------------- publishing enquiries
CREATE TABLE IF NOT EXISTS public.publishing_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (char_length(email) <= 200 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  whatsapp text CHECK (whatsapp IS NULL OR char_length(whatsapp) <= 40),
  book_title text CHECK (book_title IS NULL OR char_length(book_title) <= 200),
  project_type text NOT NULL CHECK (project_type IN ('New eBook', 'eBook and paperback', 'Paperback only', 'Existing book (relaunch)', 'Series', 'Not sure yet')),
  manuscript_status text NOT NULL CHECK (manuscript_status IN ('Idea or outline', 'Draft in progress', 'Finished, not edited', 'Finished and edited', 'Already published')),
  audience text CHECK (audience IS NULL OR char_length(audience) <= 500),
  services text[] NOT NULL DEFAULT '{}' CHECK (cardinality(services) <= 12 AND services <@ ARRAY['Formatting & conversion', 'Cover design', 'Mockups & graphics', 'Description & keywords', 'Launch strategy', 'Book marketing', 'Author website', 'Publishing guidance']::text[]),
  launch_date date CHECK (launch_date IS NULL OR launch_date BETWEEN DATE '2020-01-01' AND DATE '2035-12-31'),
  budget text CHECK (budget IS NULL OR budget IN ('Under $300', '$300–$1,000', '$1,000–$3,000', '$3,000+', 'Not sure yet')),
  details text CHECK (details IS NULL OR char_length(details) <= 4000),
  source text CHECK (source IS NULL OR char_length(source) <= 80),
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS publishing_enquiries_created_idx ON public.publishing_enquiries (created_at DESC);
ALTER TABLE public.publishing_enquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.publishing_enquiries FROM anon, authenticated;
GRANT INSERT ON public.publishing_enquiries TO anon, authenticated;
GRANT SELECT ON public.publishing_enquiries TO authenticated;
GRANT ALL ON public.publishing_enquiries TO service_role;
DROP POLICY IF EXISTS pe_insert ON public.publishing_enquiries;
CREATE POLICY pe_insert ON public.publishing_enquiries FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS "staff read enquiries" ON public.publishing_enquiries;
CREATE POLICY "staff read enquiries" ON public.publishing_enquiries FOR SELECT TO authenticated USING (public.site_can('enquiries.read'));

-- simple flood guard: 5 enquiries per email per day
CREATE OR REPLACE FUNCTION public.publishing_enquiry_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.publishing_enquiries WHERE lower(email) = lower(NEW.email) AND created_at > now() - interval '1 day') >= 5 THEN
    RAISE EXCEPTION 'We already have several enquiries from this email today. We''ll reply soon.' USING ERRCODE = '54000';
  END IF;
  NEW.created_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS publishing_enquiry_guard ON public.publishing_enquiries;
CREATE TRIGGER publishing_enquiry_guard BEFORE INSERT ON public.publishing_enquiries FOR EACH ROW EXECUTE FUNCTION public.publishing_enquiry_guard();

-- same lead alert as every other form
DO $$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef('public.notify_new_lead()'::regprocedure) INTO d;
  IF position('publishing_enquiries' IN d) = 0 THEN
    d := replace(d, $x$ELSE TG_TABLE_NAME END;$x$, $x$WHEN 'publishing_enquiries' THEN 'Publishing enquiry' ELSE TG_TABLE_NAME END;$x$);
    EXECUTE d;
  END IF;
END $$;
DROP TRIGGER IF EXISTS notify_new_lead ON public.publishing_enquiries;
CREATE TRIGGER notify_new_lead AFTER INSERT ON public.publishing_enquiries FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead();

-- ---------------------------------------------------------------- staff summary (counts only)
CREATE OR REPLACE FUNCTION public.book_admin_summary()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.site_can('analytics.read') THEN RAISE EXCEPTION 'Not authorised.' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'projects', (SELECT count(*) FROM public.book_projects),
    'authors', (SELECT count(DISTINCT user_id) FROM public.book_projects),
    'by_kind', (SELECT coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) FROM (SELECT kind, count(*) n FROM public.book_projects GROUP BY kind) k),
    'by_status', (SELECT coalesce(jsonb_object_agg(status, n), '{}'::jsonb) FROM (SELECT status, count(*) n FROM public.book_projects GROUP BY status) s),
    'enquiries_30d', (SELECT count(*) FROM public.publishing_enquiries WHERE created_at > now() - interval '30 days'),
    'usage_7d', (SELECT coalesce(jsonb_agg(jsonb_build_object('tool', tool, 'action', action, 'runs', n, 'failed', f, 'avg_ms', a) ORDER BY n DESC), '[]'::jsonb)
                 FROM (SELECT tool, action, count(*) n, count(*) FILTER (WHERE NOT ok) f, round(avg(ms)) a FROM public.book_tool_usage WHERE created_at > now() - interval '7 days' GROUP BY tool, action) u),
    'recent_errors', (SELECT coalesce(jsonb_agg(jsonb_build_object('tool', tool, 'action', action, 'error', error, 'at', created_at)), '[]'::jsonb)
                      FROM (SELECT tool, action, error, created_at FROM public.book_tool_usage WHERE NOT ok ORDER BY created_at DESC LIMIT 15) e)
  );
END $$;
REVOKE ALL ON FUNCTION public.book_admin_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_admin_summary() TO authenticated;
