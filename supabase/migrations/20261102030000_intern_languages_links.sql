-- Interns: languages and external freelance/portfolio profiles as structured records.
-- intern_languages / intern_links are the source of truth; triggers keep interns.languages and
-- interns.external_links in step (they feed filters, cards and the AI), so nothing else changes.
-- Writes need site_can('interns.manage'); the public only sees approved links via interns_public.

CREATE OR REPLACE FUNCTION public.intern_link_valid(_platform text, _url text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT _url ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:[0-9]{2,5})?(/[^\s<>"'']*)?$'
     AND length(_url) <= 500
     AND _url !~* '(mailto:|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})'   -- never an email address
     AND CASE _platform
       WHEN 'fiverr' THEN _url ~* '^https://([a-z0-9-]+\.)?fiverr\.com(/|$)'
       WHEN 'upwork' THEN _url ~* '^https://([a-z0-9-]+\.)?upwork\.com(/|$)'
       WHEN 'freelancer' THEN _url ~* '^https://([a-z0-9-]+\.)?freelancer\.[a-z.]{2,6}(/|$)'
       WHEN 'linkedin' THEN _url ~* '^https://([a-z0-9-]+\.)?linkedin\.com(/|$)'
       WHEN 'behance' THEN _url ~* '^https://([a-z0-9-]+\.)?behance\.net(/|$)'
       WHEN 'dribbble' THEN _url ~* '^https://([a-z0-9-]+\.)?dribbble\.com(/|$)'
       WHEN 'github' THEN _url ~* '^https://([a-z0-9-]+\.)?github\.com(/|$)'
       WHEN 'peopleperhour' THEN _url ~* '^https://([a-z0-9-]+\.)?peopleperhour\.com(/|$)'
       WHEN 'toptal' THEN _url ~* '^https://([a-z0-9-]+\.)?toptal\.com(/|$)'
       WHEN 'contra' THEN _url ~* '^https://([a-z0-9-]+\.)?contra\.com(/|$)'
       WHEN 'portfolio' THEN true
       WHEN 'other' THEN true
       ELSE false END
$$;

CREATE TABLE IF NOT EXISTS public.intern_languages (
  id bigserial PRIMARY KEY,
  intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
  language text NOT NULL CHECK (length(trim(language)) BETWEEN 2 AND 40),
  details text NOT NULL DEFAULT '' CHECK (length(details) <= 60),   -- e.g. "Native", "Fluent", "Conversational"
  position int NOT NULL DEFAULT 0,
  UNIQUE (intern_id, language)
);
CREATE TABLE IF NOT EXISTS public.intern_links (
  id bigserial PRIMARY KEY,
  intern_id uuid NOT NULL REFERENCES public.interns(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('fiverr','upwork','freelancer','linkedin','behance','dribbble','github','peopleperhour','toptal','contra','portfolio','other')),
  url text NOT NULL,
  button_label text NOT NULL DEFAULT '' CHECK (length(button_label) <= 40),
  approved boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  CONSTRAINT intern_links_url_valid CHECK (public.intern_link_valid(platform, url)),
  UNIQUE (intern_id, url)
);
CREATE INDEX IF NOT EXISTS intern_languages_intern_idx ON public.intern_languages (intern_id, position);
CREATE INDEX IF NOT EXISTS intern_links_intern_idx ON public.intern_links (intern_id, position);

ALTER TABLE public.intern_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.intern_languages, public.intern_links FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intern_languages, public.intern_links TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.intern_languages_id_seq, public.intern_links_id_seq TO authenticated;
DROP POLICY IF EXISTS intern_languages_admin ON public.intern_languages;
CREATE POLICY intern_languages_admin ON public.intern_languages FOR ALL TO authenticated USING (public.site_can('interns.manage')) WITH CHECK (public.site_can('interns.manage'));
DROP POLICY IF EXISTS intern_links_admin ON public.intern_links;
CREATE POLICY intern_links_admin ON public.intern_links FOR ALL TO authenticated USING (public.site_can('interns.manage')) WITH CHECK (public.site_can('interns.manage'));

-- Keep the denormalised columns on interns in step (this also writes an "edited" audit event).
CREATE OR REPLACE FUNCTION public.intern_sync_contacts(_intern uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.interns SET
    languages = coalesce((SELECT array_agg(language ORDER BY position, id) FROM public.intern_languages WHERE intern_id = _intern), '{}'),
    external_links = coalesce((SELECT jsonb_agg(jsonb_build_object('platform', platform, 'label', button_label, 'url', url, 'approved', approved) ORDER BY position, id) FROM public.intern_links WHERE intern_id = _intern), '[]')
  WHERE id = _intern;
END $$;
REVOKE ALL ON FUNCTION public.intern_sync_contacts(uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.intern_contacts_changed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('efy.intern_bulk', true) = 'on' THEN RETURN NULL; END IF;
  PERFORM public.intern_sync_contacts(coalesce(NEW.intern_id, OLD.intern_id));
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS intern_languages_sync ON public.intern_languages;
CREATE TRIGGER intern_languages_sync AFTER INSERT OR UPDATE OR DELETE ON public.intern_languages FOR EACH ROW EXECUTE FUNCTION public.intern_contacts_changed();
DROP TRIGGER IF EXISTS intern_links_sync ON public.intern_links;
CREATE TRIGGER intern_links_sync AFTER INSERT OR UPDATE OR DELETE ON public.intern_links FOR EACH ROW EXECUTE FUNCTION public.intern_contacts_changed();

-- One atomic save from the admin editor: replaces an intern's languages and links.
-- SECURITY INVOKER, so row-level security (interns.manage) applies to every row written.
CREATE OR REPLACE FUNCTION public.intern_save_contacts(_intern uuid, _languages jsonb, _links jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE l jsonb; n int := 0;
BEGIN
  IF NOT public.site_can('interns.manage') THEN RAISE EXCEPTION 'Only administrators can edit intern profiles' USING ERRCODE = '42501'; END IF;
  IF jsonb_typeof(coalesce(_languages, '[]')) <> 'array' OR jsonb_typeof(coalesce(_links, '[]')) <> 'array' THEN RAISE EXCEPTION 'Invalid data' USING ERRCODE = '22023'; END IF;
  PERFORM set_config('efy.intern_bulk', 'on', true);
  DELETE FROM public.intern_languages WHERE intern_id = _intern;
  DELETE FROM public.intern_links WHERE intern_id = _intern;
  FOR l IN SELECT * FROM jsonb_array_elements(coalesce(_languages, '[]')) LOOP
    n := n + 1;
    INSERT INTO public.intern_languages(intern_id, language, details, position)
    VALUES (_intern, trim(l->>'language'), trim(coalesce(l->>'details', '')), n)
    ON CONFLICT (intern_id, language) DO NOTHING;
  END LOOP;
  n := 0;
  FOR l IN SELECT * FROM jsonb_array_elements(coalesce(_links, '[]')) LOOP
    n := n + 1;
    IF NOT public.intern_link_valid(l->>'platform', trim(l->>'url')) THEN
      RAISE EXCEPTION 'Link % isn''t a valid % profile URL (it must start with https:// and be on that site)', n, coalesce(l->>'platform', '?') USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.intern_links(intern_id, platform, url, button_label, approved, position)
    VALUES (_intern, l->>'platform', trim(l->>'url'), trim(coalesce(l->>'button_label', '')), coalesce((l->>'approved')::boolean, false), n)
    ON CONFLICT (intern_id, url) DO NOTHING;
  END LOOP;
  PERFORM set_config('efy.intern_bulk', 'off', true);
  PERFORM public.intern_sync_contacts(_intern);
END $$;
REVOKE ALL ON FUNCTION public.intern_save_contacts(uuid, jsonb, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.intern_save_contacts(uuid, jsonb, jsonb) TO authenticated;

-- Public read model: add language details and approved freelance profiles (with platform + label).
CREATE OR REPLACE VIEW public.interns_public AS
SELECT i.slug, i.display_name, i.designation, i.status, i.specialty, i.short_bio,
       CASE WHEN i.show_location THEN i.location ELSE '' END AS location,
       i.skills, i.specialties, i.languages, i.tools, i.services, i.interests,
       coalesce((SELECT jsonb_agg(jsonb_build_object('title', p->>'title', 'description', coalesce(p->>'description',''), 'url', coalesce(p->>'url','')))
                 FROM jsonb_array_elements(i.portfolio) p WHERE (p->>'approved')::boolean IS TRUE), '[]'::jsonb) AS portfolio,
       coalesce((SELECT jsonb_agg(jsonb_build_object('label', l.button_label, 'url', l.url) ORDER BY l.position, l.id)
                 FROM public.intern_links l WHERE l.intern_id = i.id AND l.approved), '[]'::jsonb) AS external_links,
       i.photo_url, i.photo_alt,
       jsonb_build_object('intro', coalesce(i.profile->>'intro',''), 'bio', coalesce(i.profile->>'bio',''), 'expertise', coalesce(i.profile->'expertise','[]'),
                          'capabilities', coalesce(i.profile->'capabilities','[]'), 'contribution', coalesce(i.profile->>'contribution',''), 'role', coalesce(i.profile->>'role','')) AS profile,
       i.seo_title, i.seo_description, i.noindex, i.homepage_featured, i.homepage_order, i.published_at, i.updated_at,
       i.username,
       coalesce((SELECT jsonb_agg(jsonb_build_object('language', g.language, 'details', g.details) ORDER BY g.position, g.id)
                 FROM public.intern_languages g WHERE g.intern_id = i.id), '[]'::jsonb) AS language_details,
       coalesce((SELECT jsonb_agg(jsonb_build_object('platform', l.platform, 'label', l.button_label, 'url', l.url) ORDER BY l.position, l.id)
                 FROM public.intern_links l WHERE l.intern_id = i.id AND l.approved), '[]'::jsonb) AS freelance_links
FROM public.interns i
WHERE i.published AND i.status IN ('active','promoted','completed') AND (i.status <> 'completed' OR i.alumni_public);
GRANT SELECT ON public.interns_public TO anon, authenticated;

-- Move existing data into the new records (idempotent). Sync is paused during the copy so copying
-- languages can't overwrite the links before they're copied; everything is synced once at the end.
SELECT set_config('efy.intern_bulk', 'on', true);
INSERT INTO public.intern_languages(intern_id, language, position)
SELECT i.id, trim(x.lang), x.n FROM public.interns i, unnest(i.languages) WITH ORDINALITY x(lang, n)
WHERE trim(x.lang) <> '' ON CONFLICT (intern_id, language) DO NOTHING;
INSERT INTO public.intern_links(intern_id, platform, url, button_label, approved, position)
SELECT i.id, CASE WHEN l->>'url' ~* 'fiverr\.com' THEN 'fiverr' ELSE 'other' END, l->>'url', '', coalesce((l->>'approved')::boolean, false), x.n
FROM public.interns i, jsonb_array_elements(i.external_links) WITH ORDINALITY x(l, n)
WHERE public.intern_link_valid(CASE WHEN l->>'url' ~* 'fiverr\.com' THEN 'fiverr' ELSE 'other' END, l->>'url')
ON CONFLICT (intern_id, url) DO NOTHING;
SELECT set_config('efy.intern_bulk', 'off', true);
SELECT public.intern_sync_contacts(id) FROM public.interns;
