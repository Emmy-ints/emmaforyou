-- Daily maintenance pass for the automated blog (source link checks); remembers when it last ran.
ALTER TABLE public.blog_settings ADD COLUMN IF NOT EXISTS last_maintenance_at timestamptz;
GRANT SELECT (last_maintenance_at) ON public.blog_settings TO authenticated;
