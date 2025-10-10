-- Create governor_action_log table for tracking AI oversight decisions
CREATE TABLE IF NOT EXISTS public.governor_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Action details
  action_type TEXT NOT NULL, -- 'approve', 'reject', 'override', 'review'
  decision_source TEXT NOT NULL, -- 'ai_decision_engine', 'profit_rebalancer', 'wallet_executor', etc.
  action_payload JSONB NOT NULL, -- The original action being reviewed
  
  -- Governor decision
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'deferred', 'modified')),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT NOT NULL,
  
  -- Guardrails triggered
  guardrails_triggered TEXT[], -- Array of guardrail names that affected the decision
  entropy_factor NUMERIC CHECK (entropy_factor >= 0 AND entropy_factor <= 1), -- Random factor influence
  market_signals JSONB, -- External market data considered
  
  -- Modification tracking
  original_value JSONB,
  modified_value JSONB,
  
  -- Execution tracking
  executed BOOLEAN NOT NULL DEFAULT false,
  executed_at TIMESTAMP WITH TIME ZONE,
  execution_result JSONB,
  
  -- Transparency
  public_message TEXT, -- User-facing status update
  published BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.governor_action_log ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing
CREATE POLICY "Governor action logs are viewable by everyone"
  ON public.governor_action_log
  FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_governor_action_timestamp ON public.governor_action_log(timestamp DESC);
CREATE INDEX idx_governor_action_decision ON public.governor_action_log(decision);
CREATE INDEX idx_governor_action_source ON public.governor_action_log(decision_source);
CREATE INDEX idx_governor_action_published ON public.governor_action_log(published) WHERE published = true;

-- Create a view for public status updates (inherits RLS from base table)
CREATE VIEW public.governor_status_updates AS
SELECT 
  id,
  timestamp,
  action_type,
  decision,
  public_message,
  confidence,
  created_at
FROM public.governor_action_log
WHERE published = true
  AND public_message IS NOT NULL
ORDER BY timestamp DESC;