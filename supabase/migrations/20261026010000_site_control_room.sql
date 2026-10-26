-- Website control room: design tokens (draft → publish, versions, rollback), saved site audits,
-- an admin action log, and two scoped roles. Every write is checked in the database.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor';
