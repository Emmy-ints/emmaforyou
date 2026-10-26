-- Control room tables (the new enum values come from the previous migration).

-- Permissions: admin = everything; editor = design drafts + run/save audits; auditor = read audits and logs.
CREATE OR REPLACE FUNCTION public.site_can(_perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN public.has_role(auth.uid(), 'admin') THEN true
    WHEN _perm IN ('design.draft', 'audit.run', 'audit.read', 'log.read') AND public.has_role(auth.uid(), 'editor') THEN true
    WHEN _perm IN ('audit.read', 'log.read') AND public.has_role(auth.uid(), 'auditor') THEN true
    ELSE false END
$$;
GRANT EXECUTE ON FUNCTION public.site_can(text) TO anon, authenticated;

-- What the signed-in person may do (for the UI; the database still checks every write).
CREATE OR REPLACE FUNCTION public.site_permissions()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(array_agg(p), '{}') FROM unnest(ARRAY['design.draft','design.publish','audit.run','audit.read','log.read','roles.manage']) p WHERE public.site_can(p)
$$;
GRANT EXECUTE ON FUNCTION public.site_permissions() TO authenticated;

-- Admin action log (written only by the functions/triggers below).
CREATE TABLE IF NOT EXISTS public.site_admin_log (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor uuid,
  actor_email text,
  action text NOT NULL,
  target text,
  ok boolean NOT NULL DEFAULT true,
  detail jsonb NOT NULL DEFAULT '{}'
);
ALTER TABLE public.site_admin_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "log readable by permitted staff" ON public.site_admin_log;
CREATE POLICY "log readable by permitted staff" ON public.site_admin_log FOR SELECT TO authenticated USING (public.site_can('log.read'));

CREATE OR REPLACE FUNCTION public.site_log(_action text, _target text, _detail jsonb DEFAULT '{}', _ok boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.site_admin_log(actor, actor_email, action, target, ok, detail)
  VALUES (auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()), left(_action, 80), left(_target, 300), _ok, coalesce(_detail, '{}'));
END $$;
REVOKE ALL ON FUNCTION public.site_log(text, text, jsonb, boolean) FROM public, anon;

-- Design tokens: one row; anyone may read the published tokens (the site applies them).
CREATE TABLE IF NOT EXISTS public.site_design (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  published jsonb NOT NULL DEFAULT '{}',
  draft jsonb NOT NULL DEFAULT '{}',
  published_at timestamptz,
  published_by uuid,
  draft_updated_at timestamptz,
  draft_updated_by uuid
);
INSERT INTO public.site_design(id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.site_design ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "design readable" ON public.site_design;
CREATE POLICY "design readable" ON public.site_design FOR SELECT TO anon, authenticated USING (true);
-- No direct writes: only through the functions below.

CREATE TABLE IF NOT EXISTS public.site_design_versions (
  id bigserial PRIMARY KEY,
  tokens jsonb NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
ALTER TABLE public.site_design_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "versions readable by staff" ON public.site_design_versions;
CREATE POLICY "versions readable by staff" ON public.site_design_versions FOR SELECT TO authenticated USING (public.site_can('design.draft'));

-- Allowed token keys and value shapes (no arbitrary CSS can be stored).
CREATE OR REPLACE FUNCTION public.site_design_valid(_t jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_typeof(_t) = 'object'
    AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(_t) k WHERE k NOT IN ('preset','accent','accent2','glass','radius','motion','grain','atmosphere'))
    AND (NOT _t ? 'preset' OR (_t->>'preset') IN ('emmaforyou','titanium','ethereal','cybernetic','architectural','synthetic'))
    AND (NOT _t ? 'accent' OR (_t->>'accent') ~ '^#[0-9a-fA-F]{6}$')
    AND (NOT _t ? 'accent2' OR (_t->>'accent2') ~ '^#[0-9a-fA-F]{6}$')
    AND (NOT _t ? 'glass' OR (jsonb_typeof(_t->'glass') = 'number' AND (_t->>'glass')::numeric BETWEEN 0 AND 1))
    AND (NOT _t ? 'radius' OR (jsonb_typeof(_t->'radius') = 'number' AND (_t->>'radius')::numeric BETWEEN 0 AND 40))
    AND (NOT _t ? 'motion' OR (jsonb_typeof(_t->'motion') = 'number' AND (_t->>'motion')::numeric BETWEEN 0 AND 1.5))
    AND (NOT _t ? 'grain' OR (jsonb_typeof(_t->'grain') = 'number' AND (_t->>'grain')::numeric BETWEEN 0 AND 0.12))
    AND (NOT _t ? 'atmosphere' OR (jsonb_typeof(_t->'atmosphere') = 'number' AND (_t->>'atmosphere')::numeric BETWEEN 0 AND 2))
$$;

CREATE OR REPLACE FUNCTION public.site_design_save_draft(_tokens jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.site_can('design.draft') THEN RAISE EXCEPTION 'Not allowed to edit the design' USING ERRCODE = '42501'; END IF;
  IF NOT public.site_design_valid(_tokens) THEN RAISE EXCEPTION 'Invalid design tokens' USING ERRCODE = '22023'; END IF;
  UPDATE public.site_design SET draft = _tokens, draft_updated_at = now(), draft_updated_by = auth.uid() WHERE id = 1;
  PERFORM public.site_log('design.save_draft', 'site_design', jsonb_build_object('tokens', _tokens));
  RETURN _tokens;
END $$;

CREATE OR REPLACE FUNCTION public.site_design_publish(_note text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d jsonb; prev jsonb; v bigint;
BEGIN
  IF NOT public.site_can('design.publish') THEN RAISE EXCEPTION 'Only an admin can publish the design' USING ERRCODE = '42501'; END IF;
  SELECT draft, published INTO d, prev FROM public.site_design WHERE id = 1;
  IF NOT public.site_design_valid(d) THEN RAISE EXCEPTION 'Invalid design tokens' USING ERRCODE = '22023'; END IF;
  -- Checkpoint of what was live before, so it can be restored.
  INSERT INTO public.site_design_versions(tokens, note, created_by) VALUES (prev, coalesce('Before: ' || _note, 'Before publish'), auth.uid());
  UPDATE public.site_design SET published = d, published_at = now(), published_by = auth.uid() WHERE id = 1;
  INSERT INTO public.site_design_versions(tokens, note, created_by) VALUES (d, coalesce(_note, 'Published'), auth.uid()) RETURNING id INTO v;
  PERFORM public.site_log('design.publish', 'site_design', jsonb_build_object('version', v, 'tokens', d));
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION public.site_design_restore(_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t jsonb;
BEGIN
  IF NOT public.site_can('design.publish') THEN RAISE EXCEPTION 'Only an admin can restore a design' USING ERRCODE = '42501'; END IF;
  SELECT tokens INTO t FROM public.site_design_versions WHERE id = _version;
  IF t IS NULL THEN RAISE EXCEPTION 'Version not found' USING ERRCODE = 'P0002'; END IF;
  UPDATE public.site_design SET draft = t, draft_updated_at = now(), draft_updated_by = auth.uid() WHERE id = 1;
  PERFORM public.site_log('design.restore_to_draft', 'site_design', jsonb_build_object('version', _version));
  RETURN t;
END $$;
REVOKE ALL ON FUNCTION public.site_design_save_draft(jsonb), public.site_design_publish(text), public.site_design_restore(bigint) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.site_design_save_draft(jsonb), public.site_design_publish(text), public.site_design_restore(bigint) TO authenticated;

-- Saved site audits (run in the admin's browser against the live site).
CREATE TABLE IF NOT EXISTS public.site_audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  routes_checked int NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}',
  findings jsonb NOT NULL DEFAULT '[]',
  CONSTRAINT site_audit_small CHECK (pg_column_size(findings) < 2000000)
);
ALTER TABLE public.site_audit_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audits readable" ON public.site_audit_reports;
CREATE POLICY "audits readable" ON public.site_audit_reports FOR SELECT TO authenticated USING (public.site_can('audit.read'));
DROP POLICY IF EXISTS "audits insert" ON public.site_audit_reports;
CREATE POLICY "audits insert" ON public.site_audit_reports FOR INSERT TO authenticated WITH CHECK (public.site_can('audit.run') AND created_by = auth.uid());
DROP POLICY IF EXISTS "audits delete" ON public.site_audit_reports;
CREATE POLICY "audits delete" ON public.site_audit_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Finding triage (status per finding key, survives re-scans).
CREATE TABLE IF NOT EXISTS public.site_audit_triage (
  key text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('open', 'ignored', 'fixed', 'assigned')),
  note text,
  assignee text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.site_audit_triage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "triage read" ON public.site_audit_triage;
CREATE POLICY "triage read" ON public.site_audit_triage FOR SELECT TO authenticated USING (public.site_can('audit.read'));
DROP POLICY IF EXISTS "triage write" ON public.site_audit_triage;
CREATE POLICY "triage write" ON public.site_audit_triage FOR ALL TO authenticated USING (public.site_can('audit.run')) WITH CHECK (public.site_can('audit.run'));

CREATE OR REPLACE FUNCTION public.site_audit_logged() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'site_audit_reports' THEN PERFORM public.site_log('audit.save', NEW.id::text, jsonb_build_object('routes', NEW.routes_checked, 'summary', NEW.summary));
  ELSE PERFORM public.site_log('audit.triage', NEW.key, jsonb_build_object('status', NEW.status, 'assignee', NEW.assignee)); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS site_audit_reports_log ON public.site_audit_reports;
CREATE TRIGGER site_audit_reports_log AFTER INSERT ON public.site_audit_reports FOR EACH ROW EXECUTE FUNCTION public.site_audit_logged();
DROP TRIGGER IF EXISTS site_audit_triage_log ON public.site_audit_triage;
CREATE TRIGGER site_audit_triage_log AFTER INSERT OR UPDATE ON public.site_audit_triage FOR EACH ROW EXECUTE FUNCTION public.site_audit_logged();

-- Role management for the control room (admins only, logged).
CREATE OR REPLACE FUNCTION public.site_set_role(_email text, _role text, _grant boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only an admin can change roles' USING ERRCODE = '42501'; END IF;
  IF _role NOT IN ('editor', 'auditor') THEN RAISE EXCEPTION 'Only editor or auditor can be set here' USING ERRCODE = '22023'; END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(_email)) AND email_confirmed_at IS NOT NULL;
  IF uid IS NULL THEN RAISE EXCEPTION 'No verified account with that email' USING ERRCODE = 'P0002'; END IF;
  IF _grant THEN INSERT INTO public.user_roles(user_id, role) VALUES (uid, _role::app_role) ON CONFLICT DO NOTHING;
  ELSE DELETE FROM public.user_roles WHERE user_id = uid AND role = _role::app_role; END IF;
  PERFORM public.site_log(CASE WHEN _grant THEN 'role.grant' ELSE 'role.revoke' END, lower(_email), jsonb_build_object('role', _role));
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.site_set_role(text, text, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.site_set_role(text, text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.site_staff()
RETURNS TABLE(email text, role text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.email::text, r.role::text FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id
  WHERE public.has_role(auth.uid(), 'admin') AND r.role::text IN ('admin', 'editor', 'auditor', 'moderator', 'support') ORDER BY r.role, u.email
$$;
GRANT EXECUTE ON FUNCTION public.site_staff() TO authenticated;
