-- Founder portrait settings in the existing control-room settings system (draft → preview → publish → rollback).
-- Keys:  founder               global: {on, size, placement}
--        founder:<pagetype>    per page type (services, solutions, blog, …): {on, size, placement}
--        founder:/<path>       one page or a path prefix ending in "/*": {on, size, placement}
-- Placement "auto" lets the site choose the best spot that doesn't touch any existing content.
CREATE OR REPLACE FUNCTION public.site_setting_valid(_key text, _v jsonb)
 RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $function$
DECLARE s text := public.site_setting_scope(_key);
BEGIN
  IF _v IS NULL THEN RETURN true; END IF;
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
    WHEN 'founder' THEN _key ~ '^founder(:([a-z]{2,20}|/[A-Za-z0-9/_.$-]{0,120}(/\*)?))?$'
      AND public.site_keys(_v, ARRAY['on','size','placement'])
      AND public.site_bool(_v,'on')
      AND public.site_enum(_v,'size',ARRAY['sm','md','lg'])
      AND public.site_enum(_v,'placement',ARRAY['auto','signature','watermark','byline'])
    ELSE false END;
END $function$;
