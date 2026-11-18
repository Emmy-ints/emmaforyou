-- Emails that become site admins when they confirm their account (see grant_admin_to_listed_email).
-- It existed in the Lovable Cloud database but was never in a migration file. Addresses are added
-- in the database directly, never here: this repository is public.
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_emails FROM anon, authenticated;
