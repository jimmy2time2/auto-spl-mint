-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Invites are viewable by everyone" ON public.invite_log;

-- Create a restricted policy that only allows users to see their own invite activity
-- Users can see invites where they are either the inviter or invitee
CREATE POLICY "Users can view their own invite activity"
ON public.invite_log
FOR SELECT
USING (true);

-- Note: Since this app uses wallet addresses (not auth.uid()), we need to handle this differently
-- The wallet address is passed from the frontend but not tied to auth
-- For now, we'll restrict to service role only for sensitive data and create a view for public stats

-- Drop the policy we just created and make it service role only
DROP POLICY IF EXISTS "Users can view their own invite activity" ON public.invite_log;

-- Create a policy that denies direct table access (only service role can access)
CREATE POLICY "Service role only access"
ON public.invite_log
FOR SELECT
USING (false);

-- Create a secure view that only exposes aggregated/anonymized data
CREATE OR REPLACE VIEW public.invite_stats AS
SELECT 
  COUNT(*) as total_invites,
  COUNT(DISTINCT inviter_wallet) as unique_inviters
FROM public.invite_log;