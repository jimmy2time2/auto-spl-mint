-- ============================================
-- FIX 1: Restrict dao_eligibility to service role only
-- Users shouldn't be able to see each other's trading behavior
-- ============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "DAO eligibility viewable by everyone" ON public.dao_eligibility;

-- Create restrictive policy - only service role can access (for edge functions)
CREATE POLICY "Service role access only"
ON public.dao_eligibility
FOR SELECT
USING (false);

-- ============================================
-- FIX 2: Restrict creator_wallet_profits to hide individual earnings
-- ============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Creator profits viewable by everyone" ON public.creator_wallet_profits;

-- Create restrictive policy - only service role can access
CREATE POLICY "Service role access only"
ON public.creator_wallet_profits
FOR SELECT
USING (false);

-- ============================================
-- FIX 3: Add unique constraint to prevent duplicate votes
-- ============================================

-- Add unique constraint on wallet_address + proposal_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'dao_votes_wallet_proposal_unique'
  ) THEN
    ALTER TABLE public.dao_votes 
    ADD CONSTRAINT dao_votes_wallet_proposal_unique 
    UNIQUE (wallet_address, proposal_id);
  END IF;
END $$;

-- Update the INSERT policy to also check for existing votes
DROP POLICY IF EXISTS "Eligible users can vote" ON public.dao_votes;

CREATE POLICY "Eligible users can vote once per proposal"
ON public.dao_votes
FOR INSERT
WITH CHECK (
  -- User must be eligible
  (EXISTS (
    SELECT 1 FROM dao_eligibility
    WHERE dao_eligibility.wallet_address = dao_votes.wallet_address 
    AND dao_eligibility.is_eligible = true 
    AND dao_eligibility.active = true
  )) 
  -- Proposal must be open and not expired
  AND (EXISTS (
    SELECT 1 FROM dao_proposals
    WHERE dao_proposals.id = dao_votes.proposal_id 
    AND dao_proposals.status = 'open'
    AND dao_proposals.closes_at > now()
  ))
  -- User hasn't already voted on this proposal (belt-and-suspenders with constraint)
  AND NOT EXISTS (
    SELECT 1 FROM dao_votes existing
    WHERE existing.wallet_address = dao_votes.wallet_address
    AND existing.proposal_id = dao_votes.proposal_id
  )
);