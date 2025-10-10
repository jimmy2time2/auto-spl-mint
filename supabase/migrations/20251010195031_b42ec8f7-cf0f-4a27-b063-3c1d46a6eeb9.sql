-- Create profit_allocation_log table for tracking allocation changes
CREATE TABLE IF NOT EXISTS public.profit_allocation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('proposed', 'active', 'rejected')),
  proposed_by TEXT NOT NULL CHECK (proposed_by IN ('ai', 'manual', 'system')),
  
  -- Allocation percentages (must sum to 100)
  reinvestment_pct NUMERIC NOT NULL CHECK (reinvestment_pct >= 0 AND reinvestment_pct <= 100),
  dao_pct NUMERIC NOT NULL CHECK (dao_pct >= 0 AND dao_pct <= 100),
  lucky_pct NUMERIC NOT NULL CHECK (lucky_pct >= 0 AND lucky_pct <= 100),
  creator_pct NUMERIC NOT NULL CHECK (creator_pct >= 0 AND creator_pct <= 100),
  
  -- Analysis data that led to this suggestion
  reasoning TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  input_metrics JSONB NOT NULL,
  
  -- Review & approval tracking
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  review_notes TEXT,
  
  -- Effective dates
  effective_from TIMESTAMP WITH TIME ZONE,
  effective_until TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint: percentages must sum to 100
  CONSTRAINT valid_total_percentage CHECK (
    reinvestment_pct + dao_pct + lucky_pct + creator_pct = 100
  )
);

-- Enable RLS
ALTER TABLE public.profit_allocation_log ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing
CREATE POLICY "Profit allocation logs are viewable by everyone"
  ON public.profit_allocation_log
  FOR SELECT
  USING (true);

-- Create indexes
CREATE INDEX idx_profit_allocation_status ON public.profit_allocation_log(status);
CREATE INDEX idx_profit_allocation_timestamp ON public.profit_allocation_log(timestamp DESC);
CREATE INDEX idx_profit_allocation_effective ON public.profit_allocation_log(effective_from, effective_until);

-- Insert initial default allocation (current system)
INSERT INTO public.profit_allocation_log (
  status,
  proposed_by,
  reinvestment_pct,
  dao_pct,
  lucky_pct,
  creator_pct,
  reasoning,
  confidence,
  input_metrics,
  effective_from,
  reviewed_at,
  reviewed_by
) VALUES (
  'active',
  'system',
  80,
  15,
  3,
  2,
  'Initial system default allocation',
  1.0,
  '{"initial": true}'::jsonb,
  now(),
  now(),
  'system'
);