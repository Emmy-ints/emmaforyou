-- Community staff roles, kept separate from full admin (spec: moderators and support staff
-- must not automatically get full administrative access). Additive and idempotent.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
