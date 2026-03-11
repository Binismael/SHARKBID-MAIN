-- Migration to add portfolio and LinkedIn links to vendor profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
