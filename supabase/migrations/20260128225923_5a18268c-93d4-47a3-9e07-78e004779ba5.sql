-- ═══════════════════════════════════════════════════════════════════════════
-- M9 AGENT TABLES - Missing tables from the build prompt
-- ═══════════════════════════════════════════════════════════════════════════

-- AI Holdings: M9's portfolio
CREATE TABLE IF NOT EXISTS public.ai_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  cost_basis NUMERIC NOT NULL DEFAULT 0,
  avg_price NUMERIC NOT NULL DEFAULT 0,
  UNIQUE(token_id)
);

-- M9 Decisions: Every decision M9 makes
CREATE TABLE IF NOT EXISTS public.m9_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action TEXT NOT NULL,
  token_id UUID REFERENCES public.tokens(id),
  amount NUMERIC,
  price NUMERIC,
  reasoning TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  market_context JSONB,
  executed BOOLEAN NOT NULL DEFAULT false,
  execution_result JSONB,
  outcome TEXT,
  actual_profit NUMERIC
);

-- Realized P&L Log
CREATE TABLE IF NOT EXISTS public.realized_pnl_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  token_id UUID NOT NULL REFERENCES public.tokens(id),
  amount_sold NUMERIC NOT NULL,
  sale_price NUMERIC NOT NULL,
  cost_basis NUMERIC NOT NULL,
  realized_pnl NUMERIC NOT NULL,
  metadata JSONB
);

-- M9 Agent Cycles: Track each autonomous cycle
CREATE TABLE IF NOT EXISTS public.m9_agent_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  decisions_made INTEGER NOT NULL DEFAULT 0,
  portfolio_value NUMERIC,
  decisions JSONB,
  duration_ms INTEGER,
  error TEXT
);

-- Market Analysis Log
CREATE TABLE IF NOT EXISTS public.market_analysis_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  sentiment TEXT,
  opportunities_count INTEGER,
  metadata JSONB
);

-- Price Cache
CREATE TABLE IF NOT EXISTS public.price_cache (
  symbol TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  change_24h NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rate limit tracking
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  action_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security events
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  wallet_address TEXT,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT false
);

-- Lucky selection proofs: Provably fair verification
CREATE TABLE IF NOT EXISTS public.lucky_selection_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blockhash TEXT NOT NULL,
  block_slot BIGINT NOT NULL,
  eligible_count INTEGER NOT NULL,
  total_weight BIGINT NOT NULL DEFAULT 0,
  random_seed TEXT NOT NULL,
  weighted_value BIGINT NOT NULL DEFAULT 0,
  selected_index INTEGER NOT NULL,
  winner TEXT NOT NULL,
  reward_amount NUMERIC NOT NULL,
  verification_hash TEXT NOT NULL UNIQUE,
  full_proof JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.ai_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m9_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realized_pnl_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m9_agent_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_selection_proofs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Public read for transparency, backend-only for sensitive
-- ═══════════════════════════════════════════════════════════════════════════

-- Public read policies (transparency)
CREATE POLICY "AI holdings are public" ON public.ai_holdings FOR SELECT USING (true);
CREATE POLICY "M9 decisions are public" ON public.m9_decisions FOR SELECT USING (true);
CREATE POLICY "Realized PnL is public" ON public.realized_pnl_log FOR SELECT USING (true);
CREATE POLICY "Agent cycles are public" ON public.m9_agent_cycles FOR SELECT USING (true);
CREATE POLICY "Market analysis is public" ON public.market_analysis_log FOR SELECT USING (true);
CREATE POLICY "Price cache is public" ON public.price_cache FOR SELECT USING (true);
CREATE POLICY "Lucky proofs are public" ON public.lucky_selection_proofs FOR SELECT USING (true);

-- Backend-only tables (security)
CREATE POLICY "Rate limits backend only" ON public.rate_limit_log FOR SELECT USING (false);
CREATE POLICY "Security events backend only" ON public.security_events FOR SELECT USING (false);

-- ═══════════════════════════════════════════════════════════════════════════
-- DATABASE FUNCTIONS FOR M9 ANALYTICS
-- ═══════════════════════════════════════════════════════════════════════════

-- Get M9 total realized P&L
CREATE OR REPLACE FUNCTION public.get_m9_total_pnl()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(realized_pnl) FROM public.realized_pnl_log), 0);
END;
$$;

-- Get M9 win rate percentage
CREATE OR REPLACE FUNCTION public.get_m9_win_rate()
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_trades INTEGER;
  winning_trades INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_trades FROM public.realized_pnl_log;
  SELECT COUNT(*) INTO winning_trades FROM public.realized_pnl_log WHERE realized_pnl > 0;
  IF total_trades = 0 THEN RETURN 0; END IF;
  RETURN (winning_trades::NUMERIC / total_trades::NUMERIC) * 100;
END;
$$;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.m9_decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_holdings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.m9_agent_cycles;