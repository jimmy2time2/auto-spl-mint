-- Drop the security definer view and recreate with security invoker
DROP VIEW IF EXISTS public.invite_stats;

-- Create a secure view with security invoker (respects caller's permissions)
CREATE VIEW public.invite_stats
WITH (security_invoker=on) AS
SELECT 
  COUNT(*) as total_invites,
  COUNT(DISTINCT inviter_wallet) as unique_inviters
FROM public.invite_log;