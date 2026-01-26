-- Create table to track referral/share links
CREATE TABLE public.referral_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL,
  referral_code text NOT NULL UNIQUE,
  share_count integer NOT NULL DEFAULT 0,
  visit_count integer NOT NULL DEFAULT 0,
  bonus_entries integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_share_at timestamp with time zone,
  last_visit_at timestamp with time zone
);

-- Create table to track referral visits
CREATE TABLE public.referral_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code text NOT NULL,
  visitor_ip_hash text NOT NULL,
  visitor_wallet text,
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  converted boolean NOT NULL DEFAULT false
);

-- Create index for fast lookups
CREATE INDEX idx_referral_links_wallet ON public.referral_links(wallet_address);
CREATE INDEX idx_referral_links_code ON public.referral_links(referral_code);
CREATE INDEX idx_referral_visits_code ON public.referral_visits(referral_code);
CREATE UNIQUE INDEX idx_referral_visits_unique ON public.referral_visits(referral_code, visitor_ip_hash);

-- Enable RLS
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_visits ENABLE ROW LEVEL SECURITY;

-- Policies for referral_links
CREATE POLICY "Referral links viewable by everyone"
  ON public.referral_links FOR SELECT
  USING (true);

-- Policies for referral_visits (only aggregate data visible)
CREATE POLICY "Referral visits viewable by everyone"
  ON public.referral_visits FOR SELECT
  USING (true);

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_links;