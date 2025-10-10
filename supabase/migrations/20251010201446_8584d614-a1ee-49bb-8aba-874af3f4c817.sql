-- Create token_decision_log table for AI decision tracking
CREATE TABLE IF NOT EXISTS public.token_decision_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decision TEXT NOT NULL, -- 'launch', 'hold', 'skip'
  reasoning TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  token_name TEXT,
  token_theme TEXT,
  scheduled_launch_time TIMESTAMP WITH TIME ZONE,
  market_signals JSONB,
  randomness_factor NUMERIC,
  executed BOOLEAN NOT NULL DEFAULT false,
  execution_result JSONB,
  dev_mode BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.token_decision_log ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Decision logs viewable by everyone"
  ON public.token_decision_log
  FOR SELECT
  USING (true);

-- Create index for querying recent decisions
CREATE INDEX idx_token_decision_log_timestamp ON public.token_decision_log(timestamp DESC);
CREATE INDEX idx_token_decision_log_executed ON public.token_decision_log(executed, timestamp DESC);