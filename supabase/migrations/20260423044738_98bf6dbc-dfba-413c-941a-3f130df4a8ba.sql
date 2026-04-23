-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'affiliate');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ROI Calculations
CREATE TABLE public.roi_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT, whatsapp TEXT, email TEXT,
  niche TEXT, current_revenue NUMERIC, current_ad_spend NUMERIC,
  current_leads INTEGER, conversion_rate NUMERIC, avg_order_value NUMERIC,
  budget TEXT, timeline INTEGER,
  projected_revenue NUMERIC, additional_revenue NUMERIC,
  projected_leads INTEGER, roi_multiplier NUMERIC, break_even_days INTEGER,
  language TEXT DEFAULT 'en'
);
ALTER TABLE public.roi_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits ROI" ON public.roi_calculations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read ROI" ON public.roi_calculations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Lead Magnet Downloads
CREATE TABLE public.lead_magnet_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL, whatsapp TEXT NOT NULL, email TEXT,
  business_type TEXT, resource_slug TEXT NOT NULL, resource_title TEXT,
  opted_in_weekly BOOLEAN DEFAULT true, language TEXT DEFAULT 'en'
);
ALTER TABLE public.lead_magnet_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone downloads lead magnet" ON public.lead_magnet_downloads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read downloads" ON public.lead_magnet_downloads FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Quiz results
CREATE TABLE public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT, whatsapp TEXT, business_type TEXT,
  score INTEGER NOT NULL, result_bucket TEXT NOT NULL,
  no_questions JSONB, language TEXT DEFAULT 'en'
);
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits quiz" ON public.quiz_results FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read quiz" ON public.quiz_results FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Email sequence leads
CREATE TABLE public.email_sequence_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT, whatsapp TEXT, email TEXT,
  business_name TEXT, business_type TEXT, sequence_goal TEXT, tone TEXT,
  language TEXT DEFAULT 'en'
);
ALTER TABLE public.email_sequence_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits email gen" ON public.email_sequence_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read email gen" ON public.email_sequence_leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Affiliates
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL, whatsapp TEXT NOT NULL, email TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  source TEXT, opted_in_leaderboard BOOLEAN DEFAULT false
);
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signs up as affiliate" ON public.affiliates FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public can read aggregate (none)" ON public.affiliates FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "Owners read their affiliate" ON public.affiliates FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Referral clicks
CREATE TABLE public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  referral_code TEXT NOT NULL, page TEXT, user_agent TEXT, country TEXT
);
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone logs ref click" ON public.referral_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read clicks" ON public.referral_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Knowledge articles
CREATE TABLE public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, excerpt TEXT,
  category TEXT NOT NULL, difficulty TEXT NOT NULL DEFAULT 'Beginner',
  read_time_minutes INTEGER NOT NULL DEFAULT 5, body_md TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT true, featured BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles public read" ON public.knowledge_articles FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins manage articles" ON public.knowledge_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Article feedback
CREATE TABLE public.knowledge_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  article_slug TEXT NOT NULL, helpful BOOLEAN NOT NULL
);
ALTER TABLE public.knowledge_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone votes" ON public.knowledge_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone reads feedback" ON public.knowledge_feedback FOR SELECT TO anon, authenticated USING (true);

-- Client portal: clients, projects, tasks, files, messages
CREATE TABLE public.client_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL, business_name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'Starter', manager_name TEXT DEFAULT 'Emmanuel',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  avatar_initials TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own account" ON public.client_accounts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Clients update own account" ON public.client_accounts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage clients" ON public.client_accounts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Self insert client account" ON public.client_accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'in_progress',
  progress_pct INTEGER NOT NULL DEFAULT 0,
  next_milestone TEXT, next_milestone_date DATE,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client read own projects" ON public.client_projects FOR SELECT TO authenticated USING (client_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage projects" ON public.client_projects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.client_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week INTEGER NOT NULL DEFAULT 1, label TEXT NOT NULL, done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client read own tasks" ON public.client_tasks FOR SELECT TO authenticated USING (client_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Client update own tasks" ON public.client_tasks FOR UPDATE TO authenticated USING (client_user_id = auth.uid());
CREATE POLICY "Admin manage tasks" ON public.client_tasks FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('client','team')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client read own messages" ON public.client_messages FOR SELECT TO authenticated USING (client_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Client send own messages" ON public.client_messages FOR INSERT TO authenticated WITH CHECK (client_user_id = auth.uid() AND sender = 'client');
CREATE POLICY "Admin send any message" ON public.client_messages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL, category TEXT, size_kb INTEGER,
  storage_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client read own files" ON public.client_files FOR SELECT TO authenticated USING (client_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage files" ON public.client_files FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Auto-create client_account on first signup
CREATE OR REPLACE FUNCTION public.handle_new_client_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.client_accounts (user_id, full_name, business_name, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),2))
  )
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created_efy
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_client_user();
