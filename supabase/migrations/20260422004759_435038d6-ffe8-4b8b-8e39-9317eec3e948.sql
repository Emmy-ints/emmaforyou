CREATE TABLE public.business_intakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Step 1
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT,
  business_description TEXT,
  years_in_business TEXT,
  business_stage TEXT,
  -- Step 2
  country TEXT,
  city TEXT,
  target_market TEXT[],
  customer_age_min INTEGER,
  customer_age_max INTEGER,
  customer_gender TEXT,
  -- Step 3
  has_website TEXT,
  website_url TEXT,
  website_rating INTEGER,
  social_platforms JSONB,
  email_list_size TEXT,
  runs_ads TEXT,
  ad_platforms TEXT[],
  ad_spend TEXT,
  -- Step 4
  monthly_revenue TEXT,
  revenue_trend TEXT,
  revenue_source TEXT,
  growth_budget TEXT,
  has_marketing_budget TEXT,
  -- Step 5
  services_needed TEXT[],
  -- Step 6
  primary_goal TEXT,
  revenue_goal TEXT,
  desired_outcomes TEXT,
  success_metric TEXT,
  timeline TEXT,
  -- Step 7
  engagement_type TEXT,
  communication_preference TEXT[],
  start_timeline TEXT,
  worked_with_agency TEXT,
  agency_experience TEXT,
  biggest_fear TEXT,
  -- Step 8
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  instagram_handle TEXT,
  how_found_us TEXT,
  referrer_name TEXT,
  uploaded_file_name TEXT,
  other_notes TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  language TEXT DEFAULT 'en',
  source TEXT DEFAULT 'intake_form'
);

ALTER TABLE public.business_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an intake"
  ON public.business_intakes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);