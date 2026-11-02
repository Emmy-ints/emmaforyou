-- Public @username (e.g. their Fiverr handle) shown under the display name, as the owner supplied it.
ALTER TABLE public.interns ADD COLUMN IF NOT EXISTS username text NOT NULL DEFAULT ''
  CHECK (username = '' OR username ~ '^[A-Za-z0-9_.-]{2,40}$');

CREATE OR REPLACE VIEW public.interns_public AS
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
       i.seo_title, i.seo_description, i.noindex, i.homepage_featured, i.homepage_order, i.published_at, i.updated_at,
       i.username
FROM public.interns i
WHERE i.published AND i.status IN ('active','promoted','completed') AND (i.status <> 'completed' OR i.alumni_public);
GRANT SELECT ON public.interns_public TO anon, authenticated;
