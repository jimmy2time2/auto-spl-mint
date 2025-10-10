-- Create ai_action_log table for tracking AI decisions
CREATE TABLE IF NOT EXISTS public.ai_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action TEXT NOT NULL CHECK (action IN ('LAUNCH', 'HOLD', 'BURN')),
  reasoning TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  input_data JSONB NOT NULL,
  execution_result JSONB,
  token_id UUID REFERENCES public.tokens(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_action_log ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing
CREATE POLICY "AI action logs are viewable by everyone"
  ON public.ai_action_log
  FOR SELECT
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_ai_action_log_timestamp ON public.ai_action_log(timestamp DESC);
CREATE INDEX idx_ai_action_log_action ON public.ai_action_log(action);