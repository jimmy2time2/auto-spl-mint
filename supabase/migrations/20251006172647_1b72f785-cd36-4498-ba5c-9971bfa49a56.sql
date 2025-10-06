-- Invite tracking system
CREATE TABLE public.invite_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_wallet TEXT NOT NULL,
  invitee_wallet TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  inviter_score INTEGER NOT NULL DEFAULT 1,
  UNIQUE(inviter_wallet, invitee_wallet)
);

-- Index for invite lookups
CREATE INDEX idx_invite_log_inviter ON public.invite_log(inviter_wallet);
CREATE INDEX idx_invite_log_code ON public.invite_log(invite_code);

-- Enable RLS
ALTER TABLE public.invite_log ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Invites are viewable by everyone"
  ON public.invite_log
  FOR SELECT
  USING (true);

-- Users can insert their own invites
CREATE POLICY "Users can track their invites"
  ON public.invite_log
  FOR INSERT
  WITH CHECK (true);

-- Update dao_eligibility with new fields
ALTER TABLE public.dao_eligibility 
  ADD COLUMN IF NOT EXISTS eligibility_type TEXT NOT NULL DEFAULT 'holding',
  ADD COLUMN IF NOT EXISTS eligibility_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS invite_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_score NUMERIC NOT NULL DEFAULT 0;

-- DAO Proposals table
CREATE TABLE public.dao_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closes_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '72 hours'),
  status TEXT NOT NULL DEFAULT 'open',
  tags TEXT[],
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_vote TEXT,
  quorum_required INTEGER NOT NULL DEFAULT 100,
  votes_yes INTEGER NOT NULL DEFAULT 0,
  votes_no INTEGER NOT NULL DEFAULT 0,
  votes_abstain INTEGER NOT NULL DEFAULT 0,
  payout_address TEXT,
  payout_amount NUMERIC,
  signature_hash TEXT
);

-- Index for proposal lookups
CREATE INDEX idx_dao_proposals_status ON public.dao_proposals(status);
CREATE INDEX idx_dao_proposals_created_at ON public.dao_proposals(created_at DESC);

-- Enable RLS
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Proposals are viewable by everyone"
  ON public.dao_proposals
  FOR SELECT
  USING (true);

-- Only eligible users can create proposals
CREATE POLICY "Eligible users can create proposals"
  ON public.dao_proposals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dao_eligibility
      WHERE wallet_address = created_by
        AND is_eligible = true
        AND active = true
    )
  );

-- DAO Votes table
CREATE TABLE public.dao_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
  vote_power NUMERIC NOT NULL DEFAULT 1,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '72 hours'),
  UNIQUE(proposal_id, wallet_address)
);

-- Index for vote lookups
CREATE INDEX idx_dao_votes_proposal ON public.dao_votes(proposal_id);
CREATE INDEX idx_dao_votes_wallet ON public.dao_votes(wallet_address);

-- Enable RLS
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Votes are viewable by everyone"
  ON public.dao_votes
  FOR SELECT
  USING (true);

-- Only eligible users can vote
CREATE POLICY "Eligible users can vote"
  ON public.dao_votes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dao_eligibility
      WHERE dao_eligibility.wallet_address = dao_votes.wallet_address
        AND is_eligible = true
        AND active = true
    )
    AND EXISTS (
      SELECT 1 FROM public.dao_proposals
      WHERE dao_proposals.id = dao_votes.proposal_id
        AND status = 'open'
        AND closes_at > now()
    )
  );

-- Update dao_treasury with more fields
ALTER TABLE public.dao_treasury
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC;

-- Function to close expired proposals
CREATE OR REPLACE FUNCTION public.close_expired_proposals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dao_proposals
  SET status = CASE
    WHEN (votes_yes + votes_no + votes_abstain) >= quorum_required THEN
      CASE 
        WHEN votes_yes > votes_no THEN 'passed'
        ELSE 'rejected'
      END
    ELSE 'rejected'
  END
  WHERE status = 'open'
    AND closes_at <= now();
END;
$$;

-- Trigger to update proposal vote counts
CREATE OR REPLACE FUNCTION public.update_proposal_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.dao_proposals
    SET 
      votes_yes = votes_yes + CASE WHEN NEW.vote = 'yes' THEN 1 ELSE 0 END,
      votes_no = votes_no + CASE WHEN NEW.vote = 'no' THEN 1 ELSE 0 END,
      votes_abstain = votes_abstain + CASE WHEN NEW.vote = 'abstain' THEN 1 ELSE 0 END
    WHERE id = NEW.proposal_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_proposal_votes
AFTER INSERT ON public.dao_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_proposal_votes();

-- Function to check and update DAO eligibility
CREATE OR REPLACE FUNCTION public.check_dao_eligibility(wallet TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_eligible BOOLEAN := false;
  eligibility_type TEXT;
  invite_count INTEGER;
  holding_days INTEGER;
BEGIN
  -- Check invite count
  SELECT COUNT(*) INTO invite_count
  FROM public.invite_log
  WHERE inviter_wallet = wallet;

  -- Check holding duration (check oldest token holding)
  SELECT 
    EXTRACT(DAY FROM (now() - MIN(w.timestamp)))::INTEGER INTO holding_days
  FROM public.wallet_activity_log w
  WHERE w.wallet_address = wallet
    AND w.activity_type = 'mint';

  -- Determine eligibility
  IF invite_count >= 10 THEN
    is_eligible := true;
    eligibility_type := 'invites';
  ELSIF holding_days >= 30 THEN
    is_eligible := true;
    eligibility_type := 'holding';
  END IF;

  -- Update or insert eligibility record
  INSERT INTO public.dao_eligibility (
    wallet_address,
    is_eligible,
    eligibility_type,
    eligibility_date,
    active,
    invite_count
  )
  VALUES (
    wallet,
    is_eligible,
    COALESCE(eligibility_type, 'none'),
    now(),
    is_eligible,
    invite_count
  )
  ON CONFLICT (wallet_address, token_id)
  DO UPDATE SET
    is_eligible = EXCLUDED.is_eligible,
    eligibility_type = EXCLUDED.eligibility_type,
    eligibility_date = EXCLUDED.eligibility_date,
    active = EXCLUDED.active,
    invite_count = EXCLUDED.invite_count,
    last_activity = now();

  RETURN is_eligible;
END;
$$;