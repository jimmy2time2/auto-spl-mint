-- Add behavior scoring columns to dao_eligibility if not already present
ALTER TABLE public.dao_eligibility 
ADD COLUMN IF NOT EXISTS behavior_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS trading_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS holding_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS pump_dump_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_evaluated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS evaluated_by text DEFAULT 'system';

-- Create a table to track daily AI eligibility evaluations
CREATE TABLE IF NOT EXISTS public.dao_eligibility_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  evaluation_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  previous_status boolean,
  new_status boolean NOT NULL,
  behavior_score numeric NOT NULL,
  trading_score numeric NOT NULL,
  engagement_score numeric NOT NULL,
  holding_score numeric NOT NULL,
  whale_detected boolean DEFAULT false,
  pump_dump_detected boolean DEFAULT false,
  ai_reasoning text NOT NULL,
  ai_confidence numeric NOT NULL
);

-- Enable RLS on the new table
ALTER TABLE public.dao_eligibility_log ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view eligibility logs for transparency
CREATE POLICY "Eligibility logs viewable by everyone"
ON public.dao_eligibility_log
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dao_eligibility_log_wallet ON public.dao_eligibility_log(wallet_address);
CREATE INDEX IF NOT EXISTS idx_dao_eligibility_log_timestamp ON public.dao_eligibility_log(evaluation_timestamp DESC);