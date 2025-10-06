-- AI Governor Log table for structured decision tracking
CREATE TABLE public.ai_governor_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  prompt_input TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  result JSONB NOT NULL,
  ai_score NUMERIC,
  market_signals JSONB,
  security_validated BOOLEAN DEFAULT true,
  execution_time_ms INTEGER,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.ai_governor_log ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "AI Governor logs are viewable by everyone"
  ON public.ai_governor_log
  FOR SELECT
  USING (true);

-- Index for performance
CREATE INDEX idx_ai_governor_log_timestamp ON public.ai_governor_log(timestamp DESC);
CREATE INDEX idx_ai_governor_log_action ON public.ai_governor_log(action_taken);

-- Market sentiment tracking table
CREATE TABLE public.market_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sentiment_score NUMERIC NOT NULL, -- -10 to +10
  solana_volume NUMERIC,
  trending_tags TEXT[],
  whale_activity_level TEXT,
  dao_participation_rate NUMERIC,
  recommendation TEXT NOT NULL,
  confidence NUMERIC NOT NULL
);

-- Enable RLS
ALTER TABLE public.market_sentiment ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Market sentiment is viewable by everyone"
  ON public.market_sentiment
  FOR SELECT
  USING (true);

-- Index for latest sentiment lookup
CREATE INDEX idx_market_sentiment_timestamp ON public.market_sentiment(timestamp DESC);