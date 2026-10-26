-- Website control room v4: scoped roles, owner-editable site settings (draft → publish with
-- versions), redirects with validation, Innovation Lab items, repair proposals, enquiry triage,
-- configuration checkpoints, media bucket and a wider design-token set. Every write is checked here.

-- ---------------------------------------------------------------- permissions
-- admin: everything. Publishing anything to visitors, roles and restores stay admin-only.
CREATE OR REPLACE FUNCTION public.site_can(_perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN public.has_role(auth.uid(), 'admin') THEN true
    WHEN public.has_role(auth.uid(), 'editor') AND _perm IN ('design.draft','audit.run','audit.read','log.read','content.draft','redirects.draft','lab.use','repair.propose','media.upload','enquiries.read') THEN true
    WHEN public.has_role(auth.uid(), 'marketing') AND _perm IN ('content.draft','translations.edit','enquiries.read','analytics.read','redirects.draft','lab.use','audit.read','media.upload') THEN true
    WHEN public.has_role(auth.uid(), 'developer') AND _perm IN ('design.draft','audit.run','audit.read','log.read','flags.draft','redirects.draft','lab.use','repair.propose','integrations.read') THEN true
    WHEN public.has_role(auth.uid(), 'analyst') AND _perm IN ('analytics.read','enquiries.read','audit.read','log.read') THEN true
    WHEN public.has_role(auth.uid(), 'auditor') AND _perm IN ('audit.read','log.read') THEN true
    ELSE false END
$$;
GRANT EXECUTE ON FUNCTION public.site_can(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.site_permissions()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(array_agg(p), '{}') FROM unnest(ARRAY[
    'design.draft','design.publish','audit.run','audit.read','log.read','roles.manage',
    'content.draft','content.publish','flags.draft','translations.edit','enquiries.read','enquiries.manage','analytics.read',
    'redirects.draft','redirects.publish','lab.use','lab.publish','repair.propose','repair.apply','media.upload',
    'integrations.read','backup.create','backup.restore']) p WHERE public.site_can(p)
$$;
GRANT EXECUTE ON FUNCTION public.site_permissions() TO authenticated;

CREATE OR REPLACE FUNCTION public.site_set_role(_email text, _role text, _grant boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only an admin can change roles' USING ERRCODE = '42501'; END IF;
  IF _role NOT IN ('editor','auditor','marketing','developer','analyst') THEN RAISE EXCEPTION 'That role can''t be set here' USING ERRCODE = '22023'; END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(_email)) AND email_confirmed_at IS NOT NULL;
  IF uid IS NULL THEN RAISE EXCEPTION 'No verified account with that email' USING ERRCODE = 'P0002'; END IF;
  IF _grant THEN INSERT INTO public.user_roles(user_id, role) VALUES (uid, _role::app_role) ON CONFLICT DO NOTHING;
  ELSE DELETE FROM public.user_roles WHERE user_id = uid AND role = _role::app_role; END IF;
  PERFORM public.site_log(CASE WHEN _grant THEN 'role.grant' ELSE 'role.revoke' END, lower(_email), jsonb_build_object('role', _role));
  RETURN 'ok';
END $$;

CREATE OR REPLACE FUNCTION public.site_staff()
RETURNS TABLE(email text, role text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.email::text, r.role::text FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id
  WHERE public.has_role(auth.uid(), 'admin') AND r.role::text IN ('admin','editor','auditor','marketing','developer','analyst','moderator','support') ORDER BY r.role, u.email
$$;

-- Scoped read access to enquiries and analytics (adds to the existing admin policies).
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['leads','tool_requests','strategy_bookings','site_audits','business_intakes','email_sequence_leads'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "staff read enquiries" ON public.%I', t);
    EXECUTE format('CREATE POLICY "staff read enquiries" ON public.%I FOR SELECT TO authenticated USING (public.site_can(''enquiries.read''))', t);
  END LOOP;
END $$;
DROP POLICY IF EXISTS "staff read analytics" ON public.site_events;
CREATE POLICY "staff read analytics" ON public.site_events FOR SELECT TO authenticated USING (public.site_can('analytics.read'));

-- ---------------------------------------------------------------- design tokens (wider set)
CREATE OR REPLACE FUNCTION public.site_design_valid(_t jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_typeof(_t) = 'object'
    AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(_t) k WHERE k NOT IN ('preset','accent','accent2','glass','radius','motion','grain','atmosphere','font','shadow','tint','tintk','speed'))
    AND (NOT _t ? 'preset' OR (_t->>'preset') IN ('emmaforyou','titanium','ethereal','cybernetic','architectural','synthetic'))
    AND (NOT _t ? 'accent' OR (_t->>'accent') ~ '^#[0-9a-fA-F]{6}$')
    AND (NOT _t ? 'accent2' OR (_t->>'accent2') ~ '^#[0-9a-fA-F]{6}$')
    AND (NOT _t ? 'tint' OR (_t->>'tint') ~ '^#[0-9a-fA-F]{6}$')
    AND (NOT _t ? 'font' OR (_t->>'font') IN ('poppins','inter','system','serif'))
    AND (NOT _t ? 'glass' OR (jsonb_typeof(_t->'glass') = 'number' AND (_t->>'glass')::numeric BETWEEN 0 AND 1))
    AND (NOT _t ? 'radius' OR (jsonb_typeof(_t->'radius') = 'number' AND (_t->>'radius')::numeric BETWEEN 0 AND 40))
    AND (NOT _t ? 'motion' OR (jsonb_typeof(_t->'motion') = 'number' AND (_t->>'motion')::numeric BETWEEN 0 AND 1.5))
    AND (NOT _t ? 'grain' OR (jsonb_typeof(_t->'grain') = 'number' AND (_t->>'grain')::numeric BETWEEN 0 AND 0.12))
    AND (NOT _t ? 'atmosphere' OR (jsonb_typeof(_t->'atmosphere') = 'number' AND (_t->>'atmosphere')::numeric BETWEEN 0 AND 2))
    AND (NOT _t ? 'shadow' OR (jsonb_typeof(_t->'shadow') = 'number' AND (_t->>'shadow')::numeric BETWEEN 0 AND 2))
    AND (NOT _t ? 'tintk' OR (jsonb_typeof(_t->'tintk') = 'number' AND (_t->>'tintk')::numeric BETWEEN 0 AND 0.12))
    AND (NOT _t ? 'speed' OR (jsonb_typeof(_t->'speed') = 'number' AND (_t->>'speed')::numeric BETWEEN 0.5 AND 2))
$$;

-- ---------------------------------------------------------------- site settings
-- key = '<scope>:<id>' (or a bare scope for singletons). Visitors only ever see `published`.
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY CHECK (char_length(key) BETWEEN 3 AND 200 AND key ~ '^[a-z0-9]+(:[A-Za-z0-9/_.\-:]*)?$'),
  draft jsonb,
  published jsonb,
  draft_at timestamptz, draft_by uuid,
  published_at timestamptz, published_by uuid
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings readable by staff" ON public.site_settings;
CREATE POLICY "settings readable by staff" ON public.site_settings FOR SELECT TO authenticated USING (public.site_can('audit.read') OR public.site_can('content.draft') OR public.site_can('flags.draft'));

CREATE TABLE IF NOT EXISTS public.site_settings_versions (
  id bigserial PRIMARY KEY,
  key text NOT NULL,
  value jsonb,
  previous jsonb,
  action text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX IF NOT EXISTS site_settings_versions_key ON public.site_settings_versions(key, id DESC);
ALTER TABLE public.site_settings_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "versions readable by staff" ON public.site_settings_versions;
CREATE POLICY "versions readable by staff" ON public.site_settings_versions FOR SELECT TO authenticated USING (public.site_can('content.draft') OR public.site_can('flags.draft') OR public.site_can('log.read'));

CREATE OR REPLACE FUNCTION public.site_setting_scope(_key text) RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT split_part(_key, ':', 1) $$;

CREATE OR REPLACE FUNCTION public.site_txt(_v jsonb, _k text, _max int) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT NOT _v ? _k OR (jsonb_typeof(_v->_k) = 'string' AND char_length(_v->>_k) <= _max AND (_v->>_k) !~ '[<>]')
$$;
CREATE OR REPLACE FUNCTION public.site_bool(_v jsonb, _k text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT NOT _v ? _k OR jsonb_typeof(_v->_k) = 'boolean'
$$;
CREATE OR REPLACE FUNCTION public.site_int(_v jsonb, _k text, _lo int, _hi int) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT NOT _v ? _k OR (jsonb_typeof(_v->_k) = 'number' AND (_v->>_k)::numeric = floor((_v->>_k)::numeric) AND (_v->>_k)::numeric BETWEEN _lo AND _hi)
$$;
CREATE OR REPLACE FUNCTION public.site_enum(_v jsonb, _k text, _allowed text[]) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT NOT _v ? _k OR (jsonb_typeof(_v->_k) = 'string' AND (_v->>_k) = ANY(_allowed))
$$;
-- Links: internal paths or https URLs only.
CREATE OR REPLACE FUNCTION public.site_href(_v jsonb, _k text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT NOT _v ? _k OR (jsonb_typeof(_v->_k) = 'string' AND char_length(_v->>_k) <= 500 AND ((_v->>_k) ~ '^/[A-Za-z0-9/_.\-#?=&%]*$' OR (_v->>_k) ~ '^https://[A-Za-z0-9.\-]+(/[^\s<>"]*)?$'))
$$;
CREATE OR REPLACE FUNCTION public.site_keys(_v jsonb, _allowed text[]) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT NOT EXISTS (SELECT 1 FROM jsonb_object_keys(_v) k WHERE NOT (k = ANY(_allowed)))
$$;

CREATE OR REPLACE FUNCTION public.site_setting_valid(_key text, _v jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE s text := public.site_setting_scope(_key);
BEGIN
  IF _v IS NULL THEN RETURN true; END IF;              -- null = remove the override
  IF jsonb_typeof(_v) <> 'object' OR pg_column_size(_v) > 8000 THEN RETURN false; END IF;
  RETURN CASE s
    WHEN 'seo' THEN _key ~ '^seo:/' AND public.site_keys(_v, ARRAY['title','description','noindex']) AND public.site_txt(_v,'title',70) AND public.site_txt(_v,'description',170) AND public.site_bool(_v,'noindex')
    WHEN 'flag' THEN public.site_keys(_v, ARRAY['on','status','note']) AND public.site_bool(_v,'on') AND public.site_enum(_v,'status',ARRAY['live','beta','prototype','hidden']) AND public.site_txt(_v,'note',300)
    WHEN 'service' THEN public.site_keys(_v, ARRAY['hidden','featured','order','name','short']) AND public.site_bool(_v,'hidden') AND public.site_bool(_v,'featured') AND public.site_int(_v,'order',0,999) AND public.site_txt(_v,'name',80) AND public.site_txt(_v,'short',200)
    WHEN 'project' THEN public.site_keys(_v, ARRAY['hidden','order','img','screenshot','note']) AND public.site_bool(_v,'hidden') AND public.site_int(_v,'order',0,999) AND public.site_href(_v,'img') AND public.site_bool(_v,'screenshot') AND public.site_txt(_v,'note',300)
    WHEN 'tool' THEN _key ~ '^tool:/' AND public.site_keys(_v, ARRAY['hidden','status']) AND public.site_bool(_v,'hidden') AND public.site_enum(_v,'status',ARRAY['live','beta','prototype'])
    WHEN 'nav' THEN _key ~ '^nav:/' AND public.site_keys(_v, ARRAY['hidden']) AND public.site_bool(_v,'hidden')
    WHEN 'announce' THEN _key = 'announce' AND public.site_keys(_v, ARRAY['on','text','href']) AND public.site_bool(_v,'on') AND public.site_txt(_v,'text',140) AND public.site_href(_v,'href')
    WHEN 'claim' THEN public.site_keys(_v, ARRAY['status','display','evidence']) AND public.site_enum(_v,'status',ARRAY['unverified','verified','sample']) AND public.site_enum(_v,'display',ARRAY['show','label','hide']) AND public.site_txt(_v,'evidence',500)
    WHEN 'countdown' THEN _key = 'countdown' AND public.site_keys(_v, ARRAY['on','spots','taken']) AND public.site_bool(_v,'on') AND public.site_int(_v,'spots',1,500) AND public.site_int(_v,'taken',0,500)
    WHEN 'i18n' THEN _key ~ '^i18n:(fr|es|de|en):[A-Za-z0-9_.]+$' AND public.site_keys(_v, ARRAY['text']) AND public.site_txt(_v,'text',600)
    ELSE false END;
END $$;

-- Who may draft which scope.
CREATE OR REPLACE FUNCTION public.site_setting_perm(_key text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE public.site_setting_scope(_key) WHEN 'flag' THEN 'flags.draft' WHEN 'i18n' THEN 'translations.edit' ELSE 'content.draft' END
$$;

CREATE OR REPLACE FUNCTION public.site_setting_save_draft(_key text, _value jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.site_can(public.site_setting_perm(_key)) THEN
    RAISE EXCEPTION 'Your role can''t change this setting' USING ERRCODE = '42501'; END IF;
  IF NOT public.site_setting_valid(_key, _value) THEN RAISE EXCEPTION 'That value isn''t allowed for %', _key USING ERRCODE = '22023'; END IF;
  INSERT INTO public.site_settings(key, draft, draft_at, draft_by) VALUES (_key, _value, now(), auth.uid())
  ON CONFLICT (key) DO UPDATE SET draft = EXCLUDED.draft, draft_at = now(), draft_by = auth.uid();
  -- A draft of "no override" for a key that was never published leaves nothing to keep.
  DELETE FROM public.site_settings WHERE key = _key AND draft IS NULL AND published IS NULL;
  INSERT INTO public.site_settings_versions(key, value, previous, action, created_by) VALUES (_key, _value, NULL, 'draft', auth.uid());
  PERFORM public.site_log('setting.draft', _key, jsonb_build_object('value', _value));
END $$;

-- Publish drafted keys. Each key's previous live value is kept as a version for rollback.
CREATE OR REPLACE FUNCTION public.site_setting_publish(_keys text[], _note text DEFAULT NULL)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n int := 0;
BEGIN
  IF NOT public.site_can('content.publish') THEN RAISE EXCEPTION 'Only an admin can publish' USING ERRCODE = '42501'; END IF;
  FOR r IN SELECT * FROM public.site_settings WHERE key = ANY(_keys) AND draft IS DISTINCT FROM published FOR UPDATE LOOP
    IF NOT public.site_setting_valid(r.key, r.draft) THEN RAISE EXCEPTION 'Draft for % is invalid', r.key USING ERRCODE = '22023'; END IF;
    INSERT INTO public.site_settings_versions(key, value, previous, action, note, created_by) VALUES (r.key, r.draft, r.published, 'publish', left(_note, 300), auth.uid());
    IF r.draft IS NULL THEN DELETE FROM public.site_settings WHERE key = r.key;
    ELSE UPDATE public.site_settings SET published = r.draft, published_at = now(), published_by = auth.uid() WHERE key = r.key; END IF;
    n := n + 1;
  END LOOP;
  PERFORM public.site_log('setting.publish', array_to_string(_keys, ', '), jsonb_build_object('count', n, 'note', _note));
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.site_setting_discard(_key text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.site_can(public.site_setting_perm(_key)) THEN RAISE EXCEPTION 'Your role can''t change this setting' USING ERRCODE = '42501'; END IF;
  UPDATE public.site_settings SET draft = published, draft_at = now(), draft_by = auth.uid() WHERE key = _key;
  DELETE FROM public.site_settings WHERE key = _key AND draft IS NULL AND published IS NULL;
  PERFORM public.site_log('setting.discard', _key, '{}');
END $$;

-- Roll a key back to the live value it had before a given publish (goes live immediately; admin only).
CREATE OR REPLACE FUNCTION public.site_setting_rollback(_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v record; cur jsonb;
BEGIN
  IF NOT public.site_can('content.publish') THEN RAISE EXCEPTION 'Only an admin can roll back' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v FROM public.site_settings_versions WHERE id = _version AND action IN ('publish','rollback');
  IF v IS NULL THEN RAISE EXCEPTION 'No such published version' USING ERRCODE = 'P0002'; END IF;
  SELECT published INTO cur FROM public.site_settings WHERE key = v.key;
  INSERT INTO public.site_settings_versions(key, value, previous, action, note, created_by) VALUES (v.key, v.previous, cur, 'rollback', 'Rolled back version ' || _version, auth.uid());
  IF v.previous IS NULL THEN DELETE FROM public.site_settings WHERE key = v.key;
  ELSE INSERT INTO public.site_settings(key, draft, published, draft_at, published_at, published_by) VALUES (v.key, v.previous, v.previous, now(), now(), auth.uid())
       ON CONFLICT (key) DO UPDATE SET draft = EXCLUDED.draft, published = EXCLUDED.published, draft_at = now(), published_at = now(), published_by = auth.uid(); END IF;
  PERFORM public.site_log('setting.rollback', v.key, jsonb_build_object('version', _version));
  RETURN v.previous;
END $$;

-- Everything visitors need, in one small call.
CREATE OR REPLACE FUNCTION public.site_live_settings()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_object_agg(key, published), '{}') FROM public.site_settings WHERE published IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.site_live_settings() TO anon, authenticated;
REVOKE ALL ON FUNCTION public.site_setting_save_draft(text, jsonb), public.site_setting_publish(text[], text), public.site_setting_discard(text), public.site_setting_rollback(bigint) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.site_setting_save_draft(text, jsonb), public.site_setting_publish(text[], text), public.site_setting_discard(text), public.site_setting_rollback(bigint) TO authenticated;

-- ---------------------------------------------------------------- redirects
CREATE TABLE IF NOT EXISTS public.site_redirects (
  id bigserial PRIMARY KEY,
  from_path text NOT NULL UNIQUE,
  to_path text NOT NULL,
  code int NOT NULL DEFAULT 301 CHECK (code IN (301, 302)),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live','disabled')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz
);
ALTER TABLE public.site_redirects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "redirects readable by staff" ON public.site_redirects;
CREATE POLICY "redirects readable by staff" ON public.site_redirects FOR SELECT TO authenticated USING (public.site_can('redirects.draft') OR public.site_can('audit.read'));

-- Paths that must never be redirected away.
CREATE OR REPLACE FUNCTION public.site_protected_path(_p text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT _p = '/' OR _p ~ '^/(api|dashboard|login|account|portal|auth|reset-password|unsubscribe)(/|$)'
$$;

CREATE OR REPLACE FUNCTION public.site_redirect_check(_id bigint, _from text, _to text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE cur text := _to; hops int := 0; nxt text;
BEGIN
  IF NOT public.site_can('redirects.draft') THEN RETURN 'Your role can''t edit redirects.'; END IF;
  IF _from !~ '^/[A-Za-z0-9/_.\-]*$' OR char_length(_from) > 300 THEN RETURN 'From must be a path like /old-page (letters, numbers, - _ . /).'; END IF;
  IF _to !~ '^/[A-Za-z0-9/_.\-#?=&%]*$' OR char_length(_to) > 300 THEN RETURN 'To must be a path on this site, like /services/website-design.'; END IF;
  IF rtrim(_from, '/') = rtrim(_to, '/') THEN RETURN 'A page can''t redirect to itself.'; END IF;
  IF public.site_protected_path(_from) THEN RETURN 'That path is protected and can''t be redirected.'; END IF;
  IF EXISTS (SELECT 1 FROM public.site_redirects WHERE from_path = _from AND id IS DISTINCT FROM _id) THEN RETURN 'There is already a redirect from that path.'; END IF;
  -- Follow the chain from the target; a loop back to _from is refused, long chains too.
  LOOP
    SELECT to_path INTO nxt FROM public.site_redirects WHERE from_path = split_part(cur, '?', 1) AND status <> 'disabled' AND id IS DISTINCT FROM _id;
    EXIT WHEN nxt IS NULL;
    hops := hops + 1;
    IF split_part(nxt, '?', 1) = _from THEN RETURN 'That would create a redirect loop.'; END IF;
    IF hops >= 5 THEN RETURN 'That would create a chain of more than 5 redirects.'; END IF;
    cur := nxt;
  END LOOP;
  RETURN NULL;
END $$;
GRANT EXECUTE ON FUNCTION public.site_redirect_check(bigint, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.site_redirect_save(_id bigint, _from text, _to text, _code int, _note text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE problem text; rid bigint;
BEGIN
  IF NOT public.site_can('redirects.draft') THEN RAISE EXCEPTION 'Your role can''t edit redirects' USING ERRCODE = '42501'; END IF;
  _from := rtrim(trim(_from), '/'); IF _from = '' THEN _from := '/'; END IF; _to := trim(_to);
  problem := public.site_redirect_check(_id, _from, _to);
  IF problem IS NOT NULL THEN RAISE EXCEPTION '%', problem USING ERRCODE = '22023'; END IF;
  IF _code NOT IN (301, 302) THEN RAISE EXCEPTION 'Code must be 301 or 302' USING ERRCODE = '22023'; END IF;
  IF _id IS NULL THEN
    INSERT INTO public.site_redirects(from_path, to_path, code, note, created_by) VALUES (_from, _to, _code, left(_note, 300), auth.uid()) RETURNING id INTO rid;
  ELSE
    -- Editing a live redirect takes it back to draft until it is published again.
    UPDATE public.site_redirects SET from_path = _from, to_path = _to, code = _code, note = left(_note, 300), status = 'draft', updated_at = now() WHERE id = _id RETURNING id INTO rid;
    IF rid IS NULL THEN RAISE EXCEPTION 'No such redirect' USING ERRCODE = 'P0002'; END IF;
  END IF;
  PERFORM public.site_log('redirect.save', _from || ' → ' || _to, jsonb_build_object('id', rid, 'code', _code));
  RETURN rid;
END $$;

CREATE OR REPLACE FUNCTION public.site_redirect_set_status(_id bigint, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; problem text;
BEGIN
  IF _status NOT IN ('live','disabled','draft') THEN RAISE EXCEPTION 'Unknown status' USING ERRCODE = '22023'; END IF;
  IF _status = 'live' AND NOT public.site_can('redirects.publish') THEN RAISE EXCEPTION 'Only an admin can publish redirects' USING ERRCODE = '42501'; END IF;
  IF _status <> 'live' AND NOT public.site_can('redirects.draft') THEN RAISE EXCEPTION 'Your role can''t edit redirects' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public.site_redirects WHERE id = _id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'No such redirect' USING ERRCODE = 'P0002'; END IF;
  IF _status = 'live' THEN problem := public.site_redirect_check(_id, r.from_path, r.to_path); IF problem IS NOT NULL THEN RAISE EXCEPTION '%', problem USING ERRCODE = '22023'; END IF; END IF;
  UPDATE public.site_redirects SET status = _status, updated_at = now(), published_at = CASE WHEN _status = 'live' THEN now() ELSE published_at END WHERE id = _id;
  PERFORM public.site_log('redirect.' || _status, r.from_path || ' → ' || r.to_path, jsonb_build_object('id', _id));
END $$;

CREATE OR REPLACE FUNCTION public.site_redirect_delete(_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.site_redirects WHERE id = _id;
  IF r IS NULL THEN RETURN; END IF;
  IF r.status = 'live' AND NOT public.site_can('redirects.publish') THEN RAISE EXCEPTION 'Only an admin can remove a live redirect' USING ERRCODE = '42501'; END IF;
  IF NOT public.site_can('redirects.draft') THEN RAISE EXCEPTION 'Your role can''t edit redirects' USING ERRCODE = '42501'; END IF;
  DELETE FROM public.site_redirects WHERE id = _id;
  PERFORM public.site_log('redirect.delete', r.from_path || ' → ' || r.to_path, to_jsonb(r));
END $$;

CREATE OR REPLACE FUNCTION public.site_live_redirects()
RETURNS TABLE(from_path text, to_path text, code int) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT from_path, to_path, code FROM public.site_redirects WHERE status = 'live'
$$;
GRANT EXECUTE ON FUNCTION public.site_live_redirects() TO anon, authenticated;
REVOKE ALL ON FUNCTION public.site_redirect_save(bigint, text, text, int, text), public.site_redirect_set_status(bigint, text), public.site_redirect_delete(bigint) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.site_redirect_save(bigint, text, text, int, text), public.site_redirect_set_status(bigint, text), public.site_redirect_delete(bigint) TO authenticated;

-- ---------------------------------------------------------------- innovation lab
-- Drafts are visible to staff only; visitors only ever read `published_config` of published items.
CREATE TABLE IF NOT EXISTS public.site_lab_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'),
  template text NOT NULL CHECK (template IN ('assistant','recommender','calculator','assessment','proposal','onboarding','configurator','demo')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 90),
  idea text NOT NULL DEFAULT '' CHECK (char_length(idea) <= 2000),
  spec jsonb NOT NULL DEFAULT '{}',
  config jsonb NOT NULL DEFAULT '{}' CHECK (pg_column_size(config) < 60000),
  published_config jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','testing','approved','published','archived')),
  tests jsonb NOT NULL DEFAULT '[]',
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid, updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz, published_by uuid
);
ALTER TABLE public.site_lab_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab staff read" ON public.site_lab_items;
CREATE POLICY "lab staff read" ON public.site_lab_items FOR SELECT TO authenticated USING (public.site_can('lab.use'));
DROP POLICY IF EXISTS "lab staff insert" ON public.site_lab_items;
CREATE POLICY "lab staff insert" ON public.site_lab_items FOR INSERT TO authenticated WITH CHECK (public.site_can('lab.use') AND status IN ('draft','testing') AND published_config IS NULL AND created_by = auth.uid());
-- Staff edit drafts; the published copy and the published/approved states are set only by the functions below.
CREATE OR REPLACE FUNCTION public.site_lab_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('efy.lab_fn', true) = '1' THEN RETURN NEW; END IF;
  IF NEW.published_config IS DISTINCT FROM OLD.published_config OR NEW.published_at IS DISTINCT FROM OLD.published_at OR NEW.published_by IS DISTINCT FROM OLD.published_by THEN
    RAISE EXCEPTION 'Publish through the approval step' USING ERRCODE = '42501'; END IF;
  IF NEW.status IN ('approved','published') AND NEW.status IS DISTINCT FROM OLD.status THEN RAISE EXCEPTION 'Approval is admin-only' USING ERRCODE = '42501'; END IF;
  NEW.updated_at := now(); NEW.updated_by := auth.uid();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS site_lab_guard ON public.site_lab_items;
CREATE TRIGGER site_lab_guard BEFORE UPDATE ON public.site_lab_items FOR EACH ROW EXECUTE FUNCTION public.site_lab_guard();
DROP POLICY IF EXISTS "lab staff update" ON public.site_lab_items;
CREATE POLICY "lab staff update" ON public.site_lab_items FOR UPDATE TO authenticated USING (public.site_can('lab.use')) WITH CHECK (public.site_can('lab.use'));
DROP POLICY IF EXISTS "lab admin delete" ON public.site_lab_items;
CREATE POLICY "lab admin delete" ON public.site_lab_items FOR DELETE TO authenticated USING (public.site_can('lab.publish') AND status <> 'published');

CREATE OR REPLACE FUNCTION public.site_lab_publish(_id uuid, _publish boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.site_can('lab.publish') THEN RAISE EXCEPTION 'Only an admin can approve or publish lab items' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public.site_lab_items WHERE id = _id FOR UPDATE;
  IF r IS NULL THEN RAISE EXCEPTION 'No such item' USING ERRCODE = 'P0002'; END IF;
  PERFORM set_config('efy.lab_fn', '1', true);
  IF _publish THEN
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(r.tests) t WHERE (t->>'ok')::boolean) THEN RAISE EXCEPTION 'Run and pass at least one test before publishing' USING ERRCODE = '22023'; END IF;
    UPDATE public.site_lab_items SET status = 'published', published_config = jsonb_build_object('title', r.title, 'template', r.template, 'config', r.config), published_at = now(), published_by = auth.uid(), updated_at = now() WHERE id = _id;
  ELSE
    UPDATE public.site_lab_items SET status = 'draft', published_config = NULL, published_at = NULL, published_by = NULL, updated_at = now() WHERE id = _id;
  END IF;
  PERFORM set_config('efy.lab_fn', '', true);
  PERFORM public.site_log(CASE WHEN _publish THEN 'lab.publish' ELSE 'lab.unpublish' END, r.slug, jsonb_build_object('template', r.template));
END $$;
REVOKE ALL ON FUNCTION public.site_lab_publish(uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.site_lab_publish(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.site_lab_live(_slug text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT published_config || jsonb_build_object('slug', slug, 'published_at', published_at) FROM public.site_lab_items WHERE slug = _slug AND status = 'published' AND published_config IS NOT NULL
$$;
CREATE OR REPLACE FUNCTION public.site_lab_live_list()
RETURNS TABLE(slug text, title text, template text, published_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT slug, published_config->>'title', published_config->>'template', published_at FROM public.site_lab_items WHERE status = 'published' AND published_config IS NOT NULL ORDER BY published_at DESC
$$;
GRANT EXECUTE ON FUNCTION public.site_lab_live(text), public.site_lab_live_list() TO anon, authenticated;

-- ---------------------------------------------------------------- repair proposals
CREATE TABLE IF NOT EXISTS public.site_repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('seo','redirect','claim','project','manual')),
  target text NOT NULL,
  current jsonb,
  proposal jsonb,
  source text NOT NULL DEFAULT 'rule' CHECK (source IN ('rule','ai','person')),
  rationale text,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','applied','rejected','rolled_back')),
  version_id bigint,
  outcome text,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  decided_at timestamptz, decided_by uuid
);
ALTER TABLE public.site_repairs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "repairs read" ON public.site_repairs;
CREATE POLICY "repairs read" ON public.site_repairs FOR SELECT TO authenticated USING (public.site_can('audit.read'));
DROP POLICY IF EXISTS "repairs propose" ON public.site_repairs;
CREATE POLICY "repairs propose" ON public.site_repairs FOR INSERT TO authenticated WITH CHECK (public.site_can('repair.propose') AND status = 'proposed' AND created_by = auth.uid() AND version_id IS NULL);
DROP POLICY IF EXISTS "repairs reject" ON public.site_repairs;
CREATE POLICY "repairs reject" ON public.site_repairs FOR UPDATE TO authenticated USING (public.site_can('repair.propose') AND status = 'proposed') WITH CHECK (status IN ('proposed','rejected') AND version_id IS NULL);

-- Apply a proposal: seo/claim/project write the setting and publish it (checkpointed as a version);
-- redirect proposals are created as drafts and published separately.
CREATE OR REPLACE FUNCTION public.site_repair_apply(_id uuid, _outcome text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; k text; vid bigint;
BEGIN
  IF NOT public.site_can('content.publish') THEN RAISE EXCEPTION 'Only an admin can apply a fix' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public.site_repairs WHERE id = _id FOR UPDATE;
  IF r IS NULL OR r.status <> 'proposed' THEN RAISE EXCEPTION 'Only open proposals can be applied' USING ERRCODE = '22023'; END IF;
  IF r.kind IN ('seo','claim','project') THEN
    k := r.kind || ':' || r.target;
    PERFORM public.site_setting_save_draft(k, r.proposal);
    PERFORM public.site_setting_publish(ARRAY[k], 'Fix ' || r.finding_key);
    SELECT max(id) INTO vid FROM public.site_settings_versions WHERE key = k AND action = 'publish';
  ELSIF r.kind = 'redirect' THEN
    vid := public.site_redirect_save(NULL, r.target, r.proposal->>'to', 301, 'From audit: ' || left(r.finding_key, 200));
    PERFORM public.site_redirect_set_status(vid, 'live');
  ELSE RAISE EXCEPTION 'This fix needs a code change' USING ERRCODE = '22023'; END IF;
  UPDATE public.site_repairs SET status = 'applied', version_id = vid, outcome = left(_outcome, 500), decided_at = now(), decided_by = auth.uid() WHERE id = _id;
  INSERT INTO public.site_audit_triage(key, status, note, updated_at, updated_by) VALUES (r.finding_key, 'fixed', 'Applied fix ' || _id, now(), auth.uid())
    ON CONFLICT (key) DO UPDATE SET status = 'fixed', note = EXCLUDED.note, updated_at = now(), updated_by = auth.uid();
  PERFORM public.site_log('repair.apply', r.kind || ':' || r.target, jsonb_build_object('repair', _id, 'version', vid));
  RETURN vid;
END $$;

CREATE OR REPLACE FUNCTION public.site_repair_rollback(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.site_can('content.publish') THEN RAISE EXCEPTION 'Only an admin can roll back' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public.site_repairs WHERE id = _id FOR UPDATE;
  IF r IS NULL OR r.status <> 'applied' THEN RAISE EXCEPTION 'Only applied fixes can be rolled back' USING ERRCODE = '22023'; END IF;
  IF r.kind = 'redirect' THEN PERFORM public.site_redirect_set_status(r.version_id, 'disabled');
  ELSE PERFORM public.site_setting_rollback(r.version_id); END IF;
  UPDATE public.site_repairs SET status = 'rolled_back', decided_at = now(), decided_by = auth.uid() WHERE id = _id;
  UPDATE public.site_audit_triage SET status = 'open', note = 'Fix rolled back', updated_at = now(), updated_by = auth.uid() WHERE key = r.finding_key;
  PERFORM public.site_log('repair.rollback', r.kind || ':' || r.target, jsonb_build_object('repair', _id));
END $$;
REVOKE ALL ON FUNCTION public.site_repair_apply(uuid, text), public.site_repair_rollback(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.site_repair_apply(uuid, text), public.site_repair_rollback(uuid) TO authenticated;

-- ---------------------------------------------------------------- enquiry triage
CREATE TABLE IF NOT EXISTS public.site_enquiry_status (
  source text NOT NULL CHECK (source IN ('leads','tool_requests','strategy_bookings','site_audits','business_intakes','email_sequence_leads')),
  ref text NOT NULL,
  status text NOT NULL CHECK (status IN ('new','contacted','qualified','won','lost','spam')),
  note text CHECK (char_length(note) <= 1000),
  assignee text CHECK (char_length(assignee) <= 120),
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  PRIMARY KEY (source, ref)
);
ALTER TABLE public.site_enquiry_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enquiry status read" ON public.site_enquiry_status;
CREATE POLICY "enquiry status read" ON public.site_enquiry_status FOR SELECT TO authenticated USING (public.site_can('enquiries.read'));
DROP POLICY IF EXISTS "enquiry status write" ON public.site_enquiry_status;
CREATE POLICY "enquiry status write" ON public.site_enquiry_status FOR ALL TO authenticated USING (public.site_can('enquiries.manage')) WITH CHECK (public.site_can('enquiries.manage'));

-- Audit triage gets an explicit reason for ignoring.
ALTER TABLE public.site_audit_triage ADD COLUMN IF NOT EXISTS reason text CHECK (char_length(reason) <= 500);

-- ---------------------------------------------------------------- configuration checkpoints
-- Covers the website configuration only (design, settings, redirects, lab items) — not business data.
CREATE TABLE IF NOT EXISTS public.site_backups (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  note text,
  scope text[] NOT NULL,
  snapshot jsonb NOT NULL,
  bytes int NOT NULL,
  restored_at timestamptz, restored_by uuid
);
ALTER TABLE public.site_backups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "backups read" ON public.site_backups;
CREATE POLICY "backups read" ON public.site_backups FOR SELECT TO authenticated USING (public.site_can('backup.create'));

CREATE OR REPLACE FUNCTION public.site_snapshot()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'format', 'emmaforyou-site-config/1', 'taken_at', now(),
    'design', (SELECT to_jsonb(d) - 'id' FROM public.site_design d WHERE id = 1),
    'settings', (SELECT coalesce(jsonb_agg(jsonb_build_object('key', key, 'draft', draft, 'published', published) ORDER BY key), '[]') FROM public.site_settings),
    'redirects', (SELECT coalesce(jsonb_agg(jsonb_build_object('from_path', from_path, 'to_path', to_path, 'code', code, 'status', status, 'note', note) ORDER BY from_path), '[]') FROM public.site_redirects),
    'lab', (SELECT coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'template', template, 'title', title, 'idea', idea, 'spec', spec, 'config', config, 'status', status) ORDER BY slug), '[]') FROM public.site_lab_items))
  WHERE public.site_can('backup.create')
$$;

CREATE OR REPLACE FUNCTION public.site_backup_create(_note text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s jsonb; bid bigint;
BEGIN
  IF NOT public.site_can('backup.create') THEN RAISE EXCEPTION 'Only an admin can create checkpoints' USING ERRCODE = '42501'; END IF;
  s := public.site_snapshot();
  INSERT INTO public.site_backups(created_by, note, scope, snapshot, bytes) VALUES (auth.uid(), left(_note, 300), ARRAY['design','settings','redirects','lab'], s, octet_length(s::text)) RETURNING id INTO bid;
  PERFORM public.site_log('backup.create', 'checkpoint ' || bid, jsonb_build_object('bytes', octet_length(s::text)));
  RETURN bid;
END $$;

-- Restore a checkpoint (or an uploaded snapshot) INTO DRAFTS: nothing goes live until published.
CREATE OR REPLACE FUNCTION public.site_backup_restore(_id bigint, _snapshot jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s jsonb; e jsonb; n_set int := 0; n_red int := 0; n_lab int := 0; problem text;
BEGIN
  IF NOT public.site_can('backup.restore') THEN RAISE EXCEPTION 'Only an admin can restore' USING ERRCODE = '42501'; END IF;
  IF _id IS NOT NULL THEN SELECT snapshot INTO s FROM public.site_backups WHERE id = _id; ELSE s := _snapshot; END IF;
  IF s IS NULL OR s->>'format' <> 'emmaforyou-site-config/1' THEN RAISE EXCEPTION 'Not a site configuration snapshot' USING ERRCODE = '22023'; END IF;
  -- Checkpoint the current state first so a restore can itself be undone.
  PERFORM public.site_backup_create('Automatic checkpoint before restore');
  IF s->'design' ? 'published' AND public.site_design_valid(coalesce(s->'design'->'published', '{}')) THEN
    UPDATE public.site_design SET draft = s->'design'->'published', draft_updated_at = now(), draft_updated_by = auth.uid() WHERE id = 1;
  END IF;
  FOR e IN SELECT * FROM jsonb_array_elements(coalesce(s->'settings', '[]')) LOOP
    IF public.site_setting_valid(e->>'key', e->'published') THEN
      INSERT INTO public.site_settings(key, draft, draft_at, draft_by) VALUES (e->>'key', e->'published', now(), auth.uid())
      ON CONFLICT (key) DO UPDATE SET draft = EXCLUDED.draft, draft_at = now(), draft_by = auth.uid();
      n_set := n_set + 1;
    END IF;
  END LOOP;
  FOR e IN SELECT * FROM jsonb_array_elements(coalesce(s->'redirects', '[]')) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.site_redirects WHERE from_path = e->>'from_path') THEN
      problem := public.site_redirect_check(NULL, e->>'from_path', e->>'to_path');
      IF problem IS NULL THEN INSERT INTO public.site_redirects(from_path, to_path, code, note, created_by) VALUES (e->>'from_path', e->>'to_path', coalesce((e->>'code')::int, 301), 'Restored: ' || coalesce(e->>'note', ''), auth.uid()); n_red := n_red + 1; END IF;
    END IF;
  END LOOP;
  FOR e IN SELECT * FROM jsonb_array_elements(coalesce(s->'lab', '[]')) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.site_lab_items WHERE slug = e->>'slug') THEN
      INSERT INTO public.site_lab_items(slug, template, title, idea, spec, config, status, created_by) VALUES (e->>'slug', e->>'template', e->>'title', coalesce(e->>'idea', ''), coalesce(e->'spec', '{}'), coalesce(e->'config', '{}'), 'draft', auth.uid());
      n_lab := n_lab + 1;
    END IF;
  END LOOP;
  IF _id IS NOT NULL THEN UPDATE public.site_backups SET restored_at = now(), restored_by = auth.uid() WHERE id = _id; END IF;
  PERFORM public.site_log('backup.restore', coalesce('checkpoint ' || _id, 'uploaded snapshot'), jsonb_build_object('settings', n_set, 'redirects', n_red, 'lab', n_lab));
  RETURN jsonb_build_object('settings', n_set, 'redirects', n_red, 'lab', n_lab);
END $$;
REVOKE ALL ON FUNCTION public.site_snapshot(), public.site_backup_create(text), public.site_backup_restore(bigint, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.site_snapshot(), public.site_backup_create(text), public.site_backup_restore(bigint, jsonb) TO authenticated;

-- ---------------------------------------------------------------- translations cache (server-written)
CREATE OR REPLACE FUNCTION public.site_translation_stats()
RETURNS TABLE(lang text, entries bigint, newest timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lang, count(*), max(created_at) FROM public.page_translations WHERE public.site_can('translations.edit') OR public.site_can('audit.read') GROUP BY lang ORDER BY lang
$$;
CREATE OR REPLACE FUNCTION public.site_translation_search(_lang text, _q text, _limit int DEFAULT 50)
RETURNS TABLE(hash text, lang text, translated text, created_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT hash, lang, translated, created_at FROM public.page_translations
  WHERE (public.site_can('translations.edit') OR public.site_can('audit.read')) AND (_lang IS NULL OR lang = _lang) AND (_q IS NULL OR translated ILIKE '%' || _q || '%')
  ORDER BY created_at DESC LIMIT least(coalesce(_limit, 50), 200)
$$;
CREATE OR REPLACE FUNCTION public.site_translation_edit(_hash text, _lang text, _text text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.site_can('translations.edit') THEN RAISE EXCEPTION 'Your role can''t edit translations' USING ERRCODE = '42501'; END IF;
  IF _text IS NULL THEN DELETE FROM public.page_translations WHERE hash = _hash AND lang = _lang;
  ELSE
    IF char_length(_text) > 4000 OR _text ~ '[<>]' THEN RAISE EXCEPTION 'Translation text is too long or contains < >' USING ERRCODE = '22023'; END IF;
    UPDATE public.page_translations SET translated = _text WHERE hash = _hash AND lang = _lang;
  END IF;
  PERFORM public.site_log(CASE WHEN _text IS NULL THEN 'translation.delete' ELSE 'translation.edit' END, _lang || ':' || left(_hash, 24), '{}');
END $$;
CREATE OR REPLACE FUNCTION public.site_translation_clear(_lang text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n bigint;
BEGIN
  IF NOT public.site_can('translations.edit') THEN RAISE EXCEPTION 'Your role can''t edit translations' USING ERRCODE = '42501'; END IF;
  DELETE FROM public.page_translations WHERE lang = _lang; GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM public.site_log('translation.clear', _lang, jsonb_build_object('rows', n));
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.site_translation_stats(), public.site_translation_search(text, text, int), public.site_translation_edit(text, text, text), public.site_translation_clear(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.site_translation_stats(), public.site_translation_search(text, text, int), public.site_translation_edit(text, text, text), public.site_translation_clear(text) TO authenticated;

-- ---------------------------------------------------------------- media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('site-media', 'site-media', true, 5242880, ARRAY['image/webp','image/png','image/jpeg','image/avif','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "site media public read" ON storage.objects;
CREATE POLICY "site media public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'site-media');
DROP POLICY IF EXISTS "site media staff upload" ON storage.objects;
CREATE POLICY "site media staff upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.site_can('media.upload'));
DROP POLICY IF EXISTS "site media admin delete" ON storage.objects;
CREATE POLICY "site media admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND public.site_can('content.publish'));

-- Enquiries from published Innovation Lab tools.
ALTER TABLE public.tool_requests DROP CONSTRAINT IF EXISTS tool_requests_tool_ok;
ALTER TABLE public.tool_requests ADD CONSTRAINT tool_requests_tool_ok CHECK (tool IN ('Smart contract review', 'Goal planner', 'AI assistant chat', 'Exit offer', 'Contact form', 'App planner', 'Solution enquiry', 'Lab enquiry'));
