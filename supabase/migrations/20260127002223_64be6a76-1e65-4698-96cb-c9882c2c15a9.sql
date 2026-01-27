-- ============================================
-- FIX 1: Restrict engagement_metrics to service role only
-- ============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Engagement metrics viewable by everyone" ON public.engagement_metrics;

-- Create restrictive policy - only service role can access
CREATE POLICY "Service role access only"
ON public.engagement_metrics
FOR SELECT
USING (false);

-- ============================================
-- FIX 2: Restrict referral_links to service role only
-- ============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Referral links viewable by everyone" ON public.referral_links;

-- Create restrictive policy - only service role can access
CREATE POLICY "Service role access only"
ON public.referral_links
FOR SELECT
USING (false);

-- ============================================
-- FIX 3: Restrict referral_visits to service role only
-- ============================================

-- Drop the overly permissive SELECT policy  
DROP POLICY IF EXISTS "Referral visits viewable by everyone" ON public.referral_visits;

-- Create restrictive policy - only service role can access
CREATE POLICY "Service role access only"
ON public.referral_visits
FOR SELECT
USING (false);