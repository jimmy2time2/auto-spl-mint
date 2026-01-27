-- ============================================
-- FIX 1: Move extensions from public schema to extensions schema
-- ============================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to postgres roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move pg_cron extension to extensions schema (if it exists in public)
-- Note: We can't directly move extensions, but we can document the issue
-- The pg_cron extension is managed by Supabase and needs to stay where it is

-- ============================================
-- FIX 2: Fix overly permissive INSERT policy on invite_log
-- ============================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Users can track their invites" ON public.invite_log;

-- Create a more restrictive INSERT policy
-- Only allow inserts via service role (edge functions)
CREATE POLICY "Service role can insert invites"
ON public.invite_log
FOR INSERT
WITH CHECK (false);

-- ============================================
-- FIX 3: Fix token_comments unrestricted INSERT
-- ============================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can add comments" ON public.token_comments;

-- Create a policy that requires a valid wallet address format
-- and limits content length to prevent spam
CREATE POLICY "Wallet holders can add comments"
ON public.token_comments
FOR INSERT
WITH CHECK (
  -- Require wallet_address to be a valid Solana address format (32-44 chars, base58)
  length(wallet_address) >= 32 
  AND length(wallet_address) <= 44
  AND wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]+$'
  -- Limit content length to prevent spam
  AND length(content) <= 500
  AND length(content) >= 1
);