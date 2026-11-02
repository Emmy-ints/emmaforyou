-- Intern & Talent Management (see docs/interns.md).
-- Admin-managed profiles only: interns get no login, role or permission from a profile.
-- Writes need site_can('interns.manage') (admins only). The public reads ONLY the interns_public
-- view, which exposes whitelisted columns of published, approved profiles. Private contact details
-- and internal notes live in intern_private, which has no public access at all.

-- 1. Permission: interns.manage is not in any non-admin role list, so only admins hold it.
CREATE OR REPLACE FUNCTION public.site_permissions()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(array_agg(p), '{}') FROM unnest(ARRAY[
    'design.draft','design.publish','audit.run','audit.read','log.read','roles.manage',
    'content.draft','content.publish','flags.draft','translations.edit','enquiries.read','enquiries.manage','analytics.read',
    'redirects.draft','redirects.publish','lab.use','lab.publish','repair.propose','repair.apply','media.upload',
    'integrations.read','backup.create','backup.restore','interns.manage']) p WHERE public.site_can(p)
$$;
GRANT EXECUTE ON FUNCTION public.site_permissions() TO authenticated;

-- 2. Profiles
CREATE TABLE IF NOT EXISTS public.interns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 2 AND 80),
  source_ref text UNIQUE,                       -- de-duplication key for imports, e.g. 'fiverr:chloemavy'
  display_name text NOT NULL DEFAULT '' CHECK (length(display_name) <= 120),
  designation text NOT NULL DEFAULT 'intern' CHECK (designation IN ('intern','team_member','alumni')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','archived','promoted')),
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  homepage_featured boolean NOT NULL DEFAULT false,
  homepage_order int NOT NULL DEFAULT 100,
  specialty text NOT NULL DEFAULT '' CHECK (length(specialty) <= 160),
  short_bio text NOT NULL DEFAULT '' CHECK (length(short_bio) <= 2000),
  location text NOT NULL DEFAULT '' CHECK (length(location) <= 120),
  show_location boolean NOT NULL DEFAULT false,
  skills text[] NOT NULL DEFAULT '{}',
  specialties text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  tools text[] NOT NULL DEFAULT '{}',
  services text[] NOT NULL DEFAULT '{}',        -- EmmaForYou service slugs they can contribute to
  interests text[] NOT NULL DEFAULT '{}',
  portfolio jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(portfolio) = 'array'),       -- [{title,description,url,approved}]
  external_links jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(external_links) = 'array'), -- [{label,url,approved}]
  photo_url text NOT NULL DEFAULT '',
  photo_alt text NOT NULL DEFAULT '' CHECK (length(photo_alt) <= 200),
  profile jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(profile) = 'object'),           -- {intro,bio,expertise,capabilities,contribution,role}
  profile_source text NOT NULL DEFAULT 'manual' CHECK (profile_source IN ('manual','ai','ai_edited')),
  profile_generated_at timestamptz,
  seo_title text NOT NULL DEFAULT '' CHECK (length(seo_title) <= 70),
  seo_description text NOT NULL DEFAULT '' CHECK (length(seo_description) <= 170),
  noindex boolean NOT NULL DEFAULT false,
  alumni_public boolean NOT NULL DEFAULT false,
  start_date date,
  end_date date,
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS interns_public_idx ON public.interns (published, status, homepage_featured, homepage_order);

-- Private record: contact details, internal notes and lifecycle reasons. Never public.
CREATE TABLE IF NOT EXISTS public.intern_private (
  intern_id uuid PRIMARY KEY REFERENCES public.interns(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '' CHECK (length(email) <= 254),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 8000),
  completion_reason text NOT NULL DEFAULT '' CHECK (length(completion_reason) <= 2000),
  archive_reason text NOT NULL DEFAULT '' CHECK (length(archive_reason) <= 2000),
  missing text[] NOT NULL DEFAULT '{}',          -- fields flagged for admin completion
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Audit trail (written by triggers; nobody can edit or delete entries through the API).
CREATE TABLE IF NOT EXISTS public.intern_events (
  id bigserial PRIMARY KEY,
  intern_id uuid,                                 -- kept after a profile is deleted
  intern_name text NOT NULL DEFAULT '',
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}',
  actor uuid DEFAULT auth.uid(),
  actor_email text,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS intern_events_intern_idx ON public.intern_events (intern_id, at DESC);

CREATE TABLE IF NOT EXISTS public.intern_designation_history (
  id bigserial PRIMARY KEY,
  intern_id uuid REFERENCES public.interns(id) ON DELETE CASCADE,
  from_designation text NOT NULL,
  to_designation text NOT NULL,
  actor uuid DEFAULT auth.uid(),
  actor_email text,
  at timestamptz NOT NULL DEFAULT now()
);

-- Old slugs keep working (301 to the current URL) so a renamed page never leaves a broken link.
CREATE TABLE IF NOT EXISTS public.intern_slug_history (
  old_slug text PRIMARY KEY,
  intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now()
);

-- 3. Rules enforced in the database (so the UI can't get them wrong)
CREATE OR REPLACE FUNCTION public.intern_slugify(_t text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT nullif(left(trim(both '-' FROM regexp_replace(lower(translate(coalesce(_t,''),
    'àáâãäåāçćčèéêëēěìíîïīñńòóôõöøōùúûüūýÿžźżšśłđ', 'aaaaaaacccceeeeeeiiiiinnooooooouuuuuyyzzzssld')), '[^a-z0-9]+', '-', 'g')), 70), '')
$$;

CREATE OR REPLACE FUNCTION public.interns_before()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text; cand text; n int := 1;
BEGIN
  -- unique slug: generated from the name when blank; a taken slug gets -2, -3…
  base := coalesce(public.intern_slugify(NEW.slug), public.intern_slugify(NEW.display_name), 'intern');
  IF length(base) < 2 THEN base := 'intern-' || base; END IF;
  cand := base;
  WHILE EXISTS (SELECT 1 FROM public.interns WHERE slug = cand AND id <> NEW.id)
     OR EXISTS (SELECT 1 FROM public.intern_slug_history WHERE old_slug = cand AND intern_id <> NEW.id) LOOP
    n := n + 1; cand := left(base, 70) || '-' || n;
  END LOOP;
  NEW.slug := cand;

  -- designation follows the lifecycle status (archived keeps the last designation)
  IF NEW.status IN ('pending','active') THEN NEW.designation := 'intern';
  ELSIF NEW.status = 'promoted' THEN NEW.designation := 'team_member';
  ELSIF NEW.status = 'completed' THEN NEW.designation := 'alumni';
  END IF;

  -- archiving takes a profile out of every public listing
  IF NEW.status = 'archived' THEN NEW.published := false; NEW.homepage_featured := false; END IF;

  IF NEW.published THEN
    IF NEW.status = 'pending' THEN NEW.status := 'active'; NEW.designation := 'intern'; END IF;
    IF NEW.status = 'completed' AND NOT NEW.alumni_public THEN
      RAISE EXCEPTION 'Approve the alumni profile before publishing a completed internship' USING ERRCODE = '22023';
    END IF;
    IF length(trim(NEW.display_name)) < 2 OR length(trim(NEW.specialty)) < 3 THEN
      RAISE EXCEPTION 'Add a display name and specialty before publishing' USING ERRCODE = '22023';
    END IF;
    IF length(trim(coalesce(NEW.profile->>'intro', ''))) < 60 AND length(trim(NEW.short_bio)) < 60 THEN
      RAISE EXCEPTION 'Add a short bio or generate the profile before publishing' USING ERRCODE = '22023';
    END IF;
    IF NEW.published_at IS NULL OR (TG_OP = 'UPDATE' AND NOT OLD.published) THEN NEW.published_at := now(); END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.slug <> NEW.slug THEN
    DELETE FROM public.intern_slug_history WHERE old_slug = NEW.slug;
    INSERT INTO public.intern_slug_history(old_slug, intern_id) VALUES (OLD.slug, NEW.id) ON CONFLICT (old_slug) DO UPDATE SET intern_id = EXCLUDED.intern_id, at = now();
  END IF;
  NEW.updated_at := now();
  NEW.updated_by := coalesce(auth.uid(), NEW.updated_by);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS interns_before ON public.interns;
CREATE TRIGGER interns_before BEFORE INSERT OR UPDATE ON public.interns FOR EACH ROW EXECUTE FUNCTION public.interns_before();

CREATE OR REPLACE FUNCTION public.interns_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE em text; act text; changed text[];
BEGIN
  SELECT email INTO em FROM auth.users WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.intern_events(intern_id, intern_name, action, detail, actor_email) VALUES (NEW.id, NEW.display_name, 'created', jsonb_build_object('slug', NEW.slug), em);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.intern_events(intern_id, intern_name, action, detail, actor_email) VALUES (OLD.id, OLD.display_name, 'deleted', jsonb_build_object('slug', OLD.slug), em);
    RETURN OLD;
  END IF;
  SELECT array_agg(k ORDER BY k) INTO changed FROM jsonb_each(to_jsonb(NEW)) n(k, v)
    WHERE k NOT IN ('updated_at','updated_by','published_at') AND v IS DISTINCT FROM to_jsonb(OLD)->k;
  IF changed IS NULL THEN RETURN NEW; END IF;
  IF OLD.designation <> NEW.designation THEN
    INSERT INTO public.intern_designation_history(intern_id, from_designation, to_designation, actor_email) VALUES (NEW.id, OLD.designation, NEW.designation, em);
  END IF;
  act := CASE
    WHEN OLD.status <> 'archived' AND NEW.status = 'archived' THEN 'archived'
    WHEN OLD.status = 'archived' AND NEW.status <> 'archived' THEN 'restored'
    WHEN OLD.designation <> NEW.designation AND NEW.designation = 'team_member' THEN 'promoted'
    WHEN OLD.status <> NEW.status AND NEW.status = 'completed' THEN 'completed'
    WHEN NOT OLD.published AND NEW.published THEN 'published'
    WHEN OLD.published AND NOT NEW.published THEN 'unpublished'
    WHEN OLD.status <> NEW.status THEN 'status_changed'
    WHEN NOT OLD.homepage_featured AND NEW.homepage_featured THEN 'featured'
    WHEN OLD.homepage_featured AND NOT NEW.homepage_featured THEN 'unfeatured'
    WHEN changed = ARRAY['homepage_order'] THEN 'reordered'
    WHEN NEW.profile_generated_at IS DISTINCT FROM OLD.profile_generated_at THEN 'ai_generated'
    ELSE 'edited' END;
  INSERT INTO public.intern_events(intern_id, intern_name, action, detail, actor_email)
  VALUES (NEW.id, NEW.display_name, act, jsonb_build_object('fields', to_jsonb(changed), 'from', jsonb_build_object('status', OLD.status, 'designation', OLD.designation), 'to', jsonb_build_object('status', NEW.status, 'designation', NEW.designation)), em);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS interns_audit ON public.interns;
CREATE TRIGGER interns_audit AFTER INSERT OR UPDATE OR DELETE ON public.interns FOR EACH ROW EXECUTE FUNCTION public.interns_audit();

CREATE OR REPLACE FUNCTION public.intern_private_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.intern_events(intern_id, intern_name, action, detail, actor_email)
    SELECT NEW.intern_id, i.display_name, 'private_record_edited', '{}'::jsonb, (SELECT email FROM auth.users WHERE id = auth.uid()) FROM public.interns i WHERE i.id = NEW.intern_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS intern_private_audit ON public.intern_private;
CREATE TRIGGER intern_private_audit BEFORE INSERT OR UPDATE ON public.intern_private FOR EACH ROW EXECUTE FUNCTION public.intern_private_audit();

-- 4. Row-level security: admins (interns.manage) only. No anon/authenticated policies otherwise.
ALTER TABLE public.interns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_designation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_slug_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.interns, public.intern_private, public.intern_events, public.intern_designation_history, public.intern_slug_history FROM anon;
REVOKE ALL ON public.interns, public.intern_private, public.intern_events, public.intern_designation_history, public.intern_slug_history FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interns, public.intern_private TO authenticated;
GRANT SELECT ON public.intern_events, public.intern_designation_history, public.intern_slug_history TO authenticated;

DROP POLICY IF EXISTS interns_admin ON public.interns;
CREATE POLICY interns_admin ON public.interns FOR ALL TO authenticated USING (public.site_can('interns.manage')) WITH CHECK (public.site_can('interns.manage'));
DROP POLICY IF EXISTS intern_private_admin ON public.intern_private;
CREATE POLICY intern_private_admin ON public.intern_private FOR ALL TO authenticated USING (public.site_can('interns.manage')) WITH CHECK (public.site_can('interns.manage'));
DROP POLICY IF EXISTS intern_events_admin ON public.intern_events;
CREATE POLICY intern_events_admin ON public.intern_events FOR SELECT TO authenticated USING (public.site_can('interns.manage'));
DROP POLICY IF EXISTS intern_designation_admin ON public.intern_designation_history;
CREATE POLICY intern_designation_admin ON public.intern_designation_history FOR SELECT TO authenticated USING (public.site_can('interns.manage'));
DROP POLICY IF EXISTS intern_slugs_admin ON public.intern_slug_history;
CREATE POLICY intern_slugs_admin ON public.intern_slug_history FOR SELECT TO authenticated USING (public.site_can('interns.manage'));

-- 5. Public read model: approved columns of published, non-archived profiles only.
--    Unapproved portfolio items and external links are filtered out here, not in the browser.
DROP VIEW IF EXISTS public.interns_public_slugs;
DROP VIEW IF EXISTS public.interns_public;
CREATE VIEW public.interns_public AS
SELECT i.slug, i.display_name, i.designation, i.status, i.specialty, i.short_bio,
       CASE WHEN i.show_location THEN i.location ELSE '' END AS location,
       i.skills, i.specialties, i.languages, i.tools, i.services, i.interests,
       coalesce((SELECT jsonb_agg(jsonb_build_object('title', p->>'title', 'description', coalesce(p->>'description',''), 'url', coalesce(p->>'url','')))
                 FROM jsonb_array_elements(i.portfolio) p WHERE (p->>'approved')::boolean IS TRUE), '[]'::jsonb) AS portfolio,
       coalesce((SELECT jsonb_agg(jsonb_build_object('label', l->>'label', 'url', l->>'url'))
                 FROM jsonb_array_elements(i.external_links) l WHERE (l->>'approved')::boolean IS TRUE AND (l->>'url') ~ '^https://'), '[]'::jsonb) AS external_links,
       i.photo_url, i.photo_alt,
       jsonb_build_object('intro', coalesce(i.profile->>'intro',''), 'bio', coalesce(i.profile->>'bio',''), 'expertise', coalesce(i.profile->'expertise','[]'),
                          'capabilities', coalesce(i.profile->'capabilities','[]'), 'contribution', coalesce(i.profile->>'contribution',''), 'role', coalesce(i.profile->>'role','')) AS profile,
       i.seo_title, i.seo_description, i.noindex, i.homepage_featured, i.homepage_order, i.published_at, i.updated_at
FROM public.interns i
WHERE i.published AND i.status IN ('active','promoted','completed') AND (i.status <> 'completed' OR i.alumni_public);

CREATE VIEW public.interns_public_slugs AS
SELECT h.old_slug, p.slug FROM public.intern_slug_history h
JOIN public.interns cur ON cur.id = h.intern_id
JOIN public.interns_public p ON p.slug = cur.slug;

GRANT SELECT ON public.interns_public, public.interns_public_slugs TO anon, authenticated;

-- 6. Overview counts for the control room (real counts, admins only).
CREATE OR REPLACE FUNCTION public.intern_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.site_can('interns.manage') THEN RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501'; END IF;
  RETURN (SELECT jsonb_build_object(
    'total', count(*),
    'active', count(*) FILTER (WHERE status = 'active'),
    'pending', count(*) FILTER (WHERE status = 'pending'),
    'published', count(*) FILTER (WHERE published),
    'featured', count(*) FILTER (WHERE homepage_featured AND published),
    'completed', count(*) FILTER (WHERE status = 'completed'),
    'archived', count(*) FILTER (WHERE status = 'archived'),
    'promoted', count(*) FILTER (WHERE status = 'promoted')) FROM public.interns);
END $$;
REVOKE ALL ON FUNCTION public.intern_overview() FROM anon;
GRANT EXECUTE ON FUNCTION public.intern_overview() TO authenticated;
REVOKE ALL ON FUNCTION public.interns_before(), public.interns_audit(), public.intern_private_audit() FROM anon, authenticated;

-- 7. Photos: public read; only interns.manage can upload, replace or delete.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('intern-photos', 'intern-photos', true, 3145728, ARRAY['image/webp','image/jpeg','image/png'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 3145728, allowed_mime_types = ARRAY['image/webp','image/jpeg','image/png'];
DROP POLICY IF EXISTS intern_photos_read ON storage.objects;
CREATE POLICY intern_photos_read ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'intern-photos');
DROP POLICY IF EXISTS intern_photos_insert ON storage.objects;
CREATE POLICY intern_photos_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'intern-photos' AND public.site_can('interns.manage'));
DROP POLICY IF EXISTS intern_photos_update ON storage.objects;
CREATE POLICY intern_photos_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'intern-photos' AND public.site_can('interns.manage'));
DROP POLICY IF EXISTS intern_photos_delete ON storage.objects;
CREATE POLICY intern_photos_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'intern-photos' AND public.site_can('interns.manage'));
