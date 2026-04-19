-- Leads table for analyser submissions and waitlist signups
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('analyser_full','analyser_teaser','waitlist')),
  name text,
  email text,
  whatsapp text,
  business_name text,
  business_type text,
  location text,
  revenue text,
  years_in_business text,
  presence text[],
  challenges text[],
  team_size text,
  budget text,
  goal text,
  timeline text,
  score integer,
  recommended_services text[],
  language text default 'en'
);

alter table public.leads enable row level security;

-- Anyone (anonymous or authenticated) can submit a lead.
create policy "Anyone can insert a lead"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

-- Reads are intentionally NOT exposed via RLS — admins use the Cloud dashboard
-- or a service-role server function to read. Public has no SELECT/UPDATE/DELETE.
