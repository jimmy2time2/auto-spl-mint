# 🧠 MIND9 - COMPLETE TECHNICAL BUILD PROMPT

## FOR AI AGENT: BUILD THE COMPLETE MIND9 AUTONOMOUS TOKEN PLATFORM

---

# SECTION 1: PROJECT OVERVIEW

## What is Mind9?

Mind9 is an **autonomous AI-powered token launchpad** on Solana where an AI agent (M9) independently:
- Creates new meme tokens
- Trades tokens to generate profit
- Distributes profits to the community
- Manages its own portfolio
- Makes all decisions autonomously

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions in Deno/TypeScript)
- **Blockchain**: Solana (using @solana/web3.js)
- **State Management**: React Query + Zustand
- **Styling**: TailwindCSS + shadcn/ui components

## Project Structure

```
mind9/
├── src/                          # Frontend React app
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── TermsAcceptance.tsx   # Legal acceptance flow
│   │   ├── M9StatusIndicator.tsx # AI status widget
│   │   ├── TradeInterface.tsx    # Trading UI
│   │   ├── TokenCard.tsx         # Token display
│   │   └── ...
│   ├── pages/                    # Page components
│   │   ├── Dashboard.tsx         # Main dashboard
│   │   ├── Explorer.tsx          # Token explorer
│   │   ├── Trade.tsx             # Trading page
│   │   ├── DAO.tsx               # Governance
│   │   ├── Leaderboard.tsx       # Rankings
│   │   └── Logbook.tsx           # Activity log
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities
│   └── integrations/             # Supabase client
├── supabase/
│   ├── functions/                # Edge Functions (Backend)
│   │   ├── _shared/              # Shared modules
│   │   │   ├── m9-agent.ts       # M9 autonomous brain
│   │   │   ├── trading-engine.ts # Buy/sell execution
│   │   │   ├── lucky-selector-fair.ts # Provably fair selection
│   │   │   ├── security-hardening.ts  # Security measures
│   │   │   ├── wallet-signer.ts  # Secure wallet operations
│   │   │   ├── governor-brain.ts # AI guardrails
│   │   │   └── profit-distributor.ts # Profit splitting
│   │   ├── m9-agent/             # M9 API endpoint
│   │   ├── m9-heartbeat/         # CRON-triggered loop
│   │   ├── mint-token/           # Token creation
│   │   ├── wallet-executor/      # Transaction execution
│   │   └── ...
│   └── migrations/               # Database schema
└── public/
    └── legal/                    # Legal documents
        ├── TERMS_OF_SERVICE.md
        └── RISK_DISCLOSURE.md
```

---

# SECTION 2: DATABASE SCHEMA

## Create all these tables in Supabase:

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Tokens table: All tokens created by M9
CREATE TABLE public.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Token info
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- On-chain data
  mint_address TEXT UNIQUE,
  supply NUMERIC NOT NULL DEFAULT 1000000000,
  decimals INTEGER NOT NULL DEFAULT 9,
  
  -- Market data
  price NUMERIC DEFAULT 0,
  price_change_24h NUMERIC DEFAULT 0,
  volume_24h NUMERIC DEFAULT 0,
  liquidity NUMERIC DEFAULT 0,
  market_cap NUMERIC DEFAULT 0,
  holders INTEGER DEFAULT 0,
  
  -- Bonding curve state
  bonding_curve_data JSONB,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'paused', 'rugged')),
  
  -- Creator
  creator_address TEXT,
  
  -- Metadata
  metadata JSONB
);

-- Coin distributions: Track token allocation at mint
CREATE TABLE public.coin_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  ai_wallet_amount NUMERIC NOT NULL DEFAULT 0,      -- 7% to AI
  creator_wallet_amount NUMERIC NOT NULL DEFAULT 0,  -- 2% to creator
  lucky_wallet_amount NUMERIC NOT NULL DEFAULT 0,    -- 1% to lucky
  system_wallet_amount NUMERIC NOT NULL DEFAULT 0,   -- 7% to system/DAO
  public_sale_amount NUMERIC NOT NULL DEFAULT 0,     -- 83% to bonding curve
  distribution_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_supply NUMERIC NOT NULL,
  CONSTRAINT valid_distribution CHECK (
    ai_wallet_amount + creator_wallet_amount + lucky_wallet_amount + 
    system_wallet_amount + public_sale_amount = total_supply
  )
);

-- Wallet activity log: All trades and transfers
CREATE TABLE public.wallet_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  token_id UUID REFERENCES public.tokens(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('buy', 'sell', 'mint', 'transfer', 'profit_distribution')),
  amount NUMERIC NOT NULL,
  percentage_of_supply NUMERIC DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transaction_hash TEXT,
  is_whale_flagged BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB
);

-- DAO eligibility: Whale detection and voting eligibility
CREATE TABLE public.dao_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  token_id UUID REFERENCES public.tokens(id) ON DELETE CASCADE,
  is_eligible BOOLEAN NOT NULL DEFAULT true,
  whale_status BOOLEAN NOT NULL DEFAULT false,
  total_bought NUMERIC NOT NULL DEFAULT 0,
  total_sold NUMERIC NOT NULL DEFAULT 0,
  max_buy_percentage NUMERIC NOT NULL DEFAULT 0,
  max_sell_percentage NUMERIC NOT NULL DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  flagged_reason TEXT
);

-- Profit events: Track M9's profit distribution
CREATE TABLE public.profit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  sale_amount NUMERIC NOT NULL,
  reinvestment_amount NUMERIC NOT NULL,  -- 80%
  dao_amount NUMERIC NOT NULL,           -- 15%
  creator_amount NUMERIC NOT NULL,       -- 2%
  lucky_amount NUMERIC NOT NULL,         -- 3%
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transaction_hash TEXT,
  CONSTRAINT valid_split CHECK (
    reinvestment_amount + dao_amount + creator_amount + lucky_amount = sale_amount
  )
);

-- Lucky wallet selections: Track lucky winners with proofs
CREATE TABLE public.lucky_wallet_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  token_id UUID REFERENCES public.tokens(id) ON DELETE CASCADE,
  selection_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  distribution_amount NUMERIC NOT NULL DEFAULT 0,
  is_recent_minter BOOLEAN NOT NULL DEFAULT false,
  activity_score NUMERIC NOT NULL DEFAULT 0,
  proof_hash TEXT  -- Links to verification proof
);

-- Lucky selection proofs: Provably fair verification
CREATE TABLE public.lucky_selection_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blockhash TEXT NOT NULL,
  block_slot BIGINT NOT NULL,
  eligible_count INTEGER NOT NULL,
  total_weight BIGINT NOT NULL,
  random_seed TEXT NOT NULL,
  weighted_value BIGINT NOT NULL,
  selected_index INTEGER NOT NULL,
  winner TEXT NOT NULL,
  reward_amount NUMERIC NOT NULL,
  verification_hash TEXT NOT NULL UNIQUE,
  full_proof JSONB NOT NULL
);

-- DAO treasury
CREATE TABLE public.dao_treasury (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance NUMERIC NOT NULL DEFAULT 0,
  total_received NUMERIC NOT NULL DEFAULT 0,
  total_distributed NUMERIC NOT NULL DEFAULT 0,
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Protocol activity: System-wide activity log
CREATE TABLE public.protocol_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL,
  token_id UUID REFERENCES public.tokens(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- M9 AGENT TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- AI Holdings: M9's portfolio
CREATE TABLE public.ai_holdings (
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
CREATE TABLE public.m9_decisions (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action TEXT NOT NULL, -- CREATE_TOKEN, BUY, SELL, HOLD, REBALANCE, DISTRIBUTE_PROFITS
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
CREATE TABLE public.realized_pnl_log (
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
CREATE TABLE public.m9_agent_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis_summary JSONB NOT NULL,
  decisions_made INTEGER NOT NULL DEFAULT 0,
  portfolio_value NUMERIC,
  decisions JSONB,
  duration_ms INTEGER,
  error TEXT
);

-- Market Analysis Log
CREATE TABLE public.market_analysis_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis JSONB NOT NULL,
  sentiment TEXT,
  opportunities_count INTEGER,
  metadata JSONB
);

-- Price Cache
CREATE TABLE public.price_cache (
  symbol TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  change_24h NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Rate limit tracking
CREATE TABLE public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  action_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security events
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  wallet_address TEXT,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT false
);

-- Governor action log: AI decision oversight
CREATE TABLE public.governor_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action_type TEXT NOT NULL,
  decision_source TEXT NOT NULL,
  action_payload JSONB,
  decision TEXT NOT NULL,
  confidence NUMERIC,
  reasoning TEXT,
  guardrails_triggered TEXT[],
  entropy_factor NUMERIC,
  market_signals JSONB,
  original_value JSONB,
  modified_value JSONB,
  public_message TEXT,
  published BOOLEAN DEFAULT false
);

-- System settings
CREATE TABLE public.settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'MAINTENANCE')),
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Heartbeat log
CREATE TABLE public.heartbeat_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  interval_hours NUMERIC,
  entropy_factor NUMERIC,
  decision_triggered BOOLEAN,
  decision_result TEXT,
  market_activity_score NUMERIC,
  metadata JSONB
);

-- Engagement metrics
CREATE TABLE public.engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  token_id UUID REFERENCES public.tokens(id),
  page_views INTEGER DEFAULT 0,
  unique_wallets INTEGER DEFAULT 0,
  trade_count INTEGER DEFAULT 0,
  social_mentions INTEGER DEFAULT 0,
  velocity_score NUMERIC DEFAULT 0,
  suspicious_flag BOOLEAN DEFAULT false
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_wallet_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_selection_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m9_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realized_pnl_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m9_agent_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governor_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heartbeat_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;

-- Public read policies (transparency)
CREATE POLICY "Tokens are public" ON public.tokens FOR SELECT USING (true);
CREATE POLICY "Distributions are public" ON public.coin_distributions FOR SELECT USING (true);
CREATE POLICY "Activity is public" ON public.wallet_activity_log FOR SELECT USING (true);
CREATE POLICY "DAO eligibility is public" ON public.dao_eligibility FOR SELECT USING (true);
CREATE POLICY "Profit events are public" ON public.profit_events FOR SELECT USING (true);
CREATE POLICY "Lucky selections are public" ON public.lucky_wallet_selections FOR SELECT USING (true);
CREATE POLICY "Lucky proofs are public" ON public.lucky_selection_proofs FOR SELECT USING (true);
CREATE POLICY "Treasury is public" ON public.dao_treasury FOR SELECT USING (true);
CREATE POLICY "Protocol activity is public" ON public.protocol_activity FOR SELECT USING (true);
CREATE POLICY "AI holdings are public" ON public.ai_holdings FOR SELECT USING (true);
CREATE POLICY "M9 decisions are public" ON public.m9_decisions FOR SELECT USING (true);
CREATE POLICY "Realized PnL is public" ON public.realized_pnl_log FOR SELECT USING (true);
CREATE POLICY "Agent cycles are public" ON public.m9_agent_cycles FOR SELECT USING (true);
CREATE POLICY "Market analysis is public" ON public.market_analysis_log FOR SELECT USING (true);
CREATE POLICY "Price cache is public" ON public.price_cache FOR SELECT USING (true);
CREATE POLICY "Governor log is public" ON public.governor_action_log FOR SELECT USING (true);
CREATE POLICY "Heartbeat is public" ON public.heartbeat_log FOR SELECT USING (true);
CREATE POLICY "Engagement is public" ON public.engagement_metrics FOR SELECT USING (true);

-- Backend-only tables
CREATE POLICY "Rate limits backend only" ON public.rate_limit_log FOR ALL USING (false);
CREATE POLICY "Security events backend only" ON public.security_events FOR ALL USING (false);
CREATE POLICY "Settings backend only" ON public.settings FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_tokens_symbol ON public.tokens(symbol);
CREATE INDEX idx_tokens_created ON public.tokens(created_at DESC);
CREATE INDEX idx_tokens_volume ON public.tokens(volume_24h DESC);

CREATE INDEX idx_wallet_activity_wallet ON public.wallet_activity_log(wallet_address);
CREATE INDEX idx_wallet_activity_token ON public.wallet_activity_log(token_id);
CREATE INDEX idx_wallet_activity_timestamp ON public.wallet_activity_log(timestamp DESC);

CREATE INDEX idx_dao_eligibility_wallet ON public.dao_eligibility(wallet_address);
CREATE INDEX idx_lucky_selections_wallet ON public.lucky_wallet_selections(wallet_address);
CREATE INDEX idx_lucky_proofs_hash ON public.lucky_selection_proofs(verification_hash);

CREATE INDEX idx_m9_decisions_timestamp ON public.m9_decisions(timestamp DESC);
CREATE INDEX idx_m9_decisions_action ON public.m9_decisions(action);
CREATE INDEX idx_protocol_activity_type ON public.protocol_activity(activity_type);
CREATE INDEX idx_protocol_activity_timestamp ON public.protocol_activity(timestamp DESC);

CREATE INDEX idx_rate_limit_wallet ON public.rate_limit_log(wallet_address, action_type, timestamp DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- INITIAL DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- Initialize DAO treasury
INSERT INTO public.dao_treasury (id, balance, total_received, total_distributed) 
VALUES ('main', 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Initialize settings
INSERT INTO public.settings (id, status, config)
VALUES ('main', 'ACTIVE', '{"version": "1.0"}')
ON CONFLICT (id) DO NOTHING;

-- Initialize SOL price cache
INSERT INTO public.price_cache (symbol, price, change_24h)
VALUES ('SOL', 100, 0)
ON CONFLICT (symbol) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Check if user is muted
CREATE OR REPLACE FUNCTION is_user_muted(p_wallet TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.security_events 
    WHERE wallet_address = p_wallet 
    AND event_type = 'mute'
    AND NOT resolved
    AND created_at > NOW() - INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql;

-- Get M9 total PnL
CREATE OR REPLACE FUNCTION get_m9_total_pnl()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(realized_pnl), 0) FROM public.realized_pnl_log;
$$ LANGUAGE sql;

-- Get M9 win rate
CREATE OR REPLACE FUNCTION get_m9_win_rate()
RETURNS NUMERIC AS $$
DECLARE
  total_trades INTEGER;
  winning_trades INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_trades FROM public.realized_pnl_log;
  SELECT COUNT(*) INTO winning_trades FROM public.realized_pnl_log WHERE realized_pnl > 0;
  IF total_trades = 0 THEN RETURN 0; END IF;
  RETURN (winning_trades::NUMERIC / total_trades::NUMERIC) * 100;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.protocol_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_activity_log;
```

---

# SECTION 3: BACKEND - EDGE FUNCTIONS

## 3.1 M9 Agent Core (`supabase/functions/_shared/m9-agent.ts`)

This is the BRAIN of M9 - the autonomous agent that runs everything.

```typescript
/**
 * M9 AGENT - THE AUTONOMOUS BRAIN
 * 
 * This agent:
 * 1. ANALYZES market conditions
 * 2. IDENTIFIES trading opportunities
 * 3. EXECUTES trades
 * 4. CREATES new tokens
 * 5. DISTRIBUTES profits
 */

export interface MarketAnalysis {
  timestamp: string;
  solana_price: number;
  solana_24h_change: number;
  market_sentiment: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  total_volume_24h: number;
  total_trades_24h: number;
  active_tokens: number;
  new_wallets_24h: number;
  top_performers: TokenPerformance[];
  worst_performers: TokenPerformance[];
  buy_pressure: number;
  sell_pressure: number;
  volatility_index: number;
  opportunities: TradingOpportunity[];
}

export interface TokenPerformance {
  token_id: string;
  symbol: string;
  price: number;
  price_change_24h: number;
  volume_24h: number;
  liquidity: number;
  holders: number;
  ai_holdings: number;
  ai_cost_basis: number;
  unrealized_pnl: number;
}

export interface TradingOpportunity {
  type: 'buy' | 'sell' | 'hold';
  token_id: string;
  symbol: string;
  confidence: number;
  reason: string;
  suggested_amount: number;
  expected_profit: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface M9Decision {
  id: string;
  timestamp: string;
  action: 'CREATE_TOKEN' | 'BUY' | 'SELL' | 'HOLD' | 'REBALANCE' | 'DISTRIBUTE_PROFITS';
  token_id?: string;
  amount?: number;
  price?: number;
  reasoning: string;
  confidence: number;
  market_context: Partial<MarketAnalysis>;
  executed: boolean;
  execution_result?: any;
  outcome?: 'success' | 'failure' | 'pending';
  actual_profit?: number;
}

export interface M9Strategy {
  max_position_size_percent: number;  // 20 - Max % in one token
  stop_loss_percent: number;          // 25 - Cut losses
  take_profit_percent: number;        // 100 - Take profits
  min_liquidity_for_trade: number;    // 1 SOL
  min_volume_for_trade: number;       // 0.5 SOL
  max_slippage_percent: number;       // 5%
  max_tokens_per_week: number;        // 5
  reinvestment_percent: number;       // 80
  treasury_percent: number;           // 15
  lucky_percent: number;              // 5
  max_drawdown_percent: number;       // 30
  daily_loss_limit_sol: number;       // 5
}

export const DEFAULT_STRATEGY: M9Strategy = {
  max_position_size_percent: 20,
  stop_loss_percent: 25,
  take_profit_percent: 100,
  min_liquidity_for_trade: 1,
  min_volume_for_trade: 0.5,
  max_slippage_percent: 5,
  max_tokens_per_week: 5,
  reinvestment_percent: 80,
  treasury_percent: 15,
  lucky_percent: 5,
  max_drawdown_percent: 30,
  daily_loss_limit_sol: 5,
};

export class M9Agent {
  private supabase: any;
  private strategy: M9Strategy;
  
  constructor(supabase: any, strategy: M9Strategy = DEFAULT_STRATEGY) {
    this.supabase = supabase;
    this.strategy = strategy;
  }
  
  // ANALYZE MARKET
  async analyzeMarket(): Promise<MarketAnalysis> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    
    // Get Solana price
    const solanaData = await this.fetchSolanaPrice();
    
    // Get platform metrics
    const { data: tokens } = await this.supabase
      .from('tokens')
      .select('*')
      .order('volume_24h', { ascending: false });
    
    const { data: trades } = await this.supabase
      .from('wallet_activity_log')
      .select('*')
      .gte('timestamp', oneDayAgo)
      .in('activity_type', ['buy', 'sell']);
    
    const { data: aiHoldings } = await this.supabase
      .from('ai_holdings')
      .select('*');
    
    // Calculate metrics
    const totalVolume = tokens?.reduce((sum: number, t: any) => sum + (t.volume_24h || 0), 0) || 0;
    const buys = trades?.filter((t: any) => t.activity_type === 'buy').length || 0;
    const sells = trades?.filter((t: any) => t.activity_type === 'sell').length || 0;
    const totalActivity = buys + sells || 1;
    const buyPressure = (buys / totalActivity) * 100;
    const sellPressure = (sells / totalActivity) * 100;
    
    // Determine sentiment
    let sentiment: 'bullish' | 'bearish' | 'neutral' | 'volatile' = 'neutral';
    if (buyPressure > 65 && solanaData.change24h > 0) sentiment = 'bullish';
    else if (sellPressure > 65 || solanaData.change24h < -5) sentiment = 'bearish';
    
    // Analyze tokens
    const tokenPerformance: TokenPerformance[] = (tokens || []).map((t: any) => {
      const holding = aiHoldings?.find((h: any) => h.token_id === t.id);
      return {
        token_id: t.id,
        symbol: t.symbol,
        price: t.price || 0,
        price_change_24h: t.price_change_24h || 0,
        volume_24h: t.volume_24h || 0,
        liquidity: t.liquidity || 0,
        holders: t.holders || 0,
        ai_holdings: holding?.amount || 0,
        ai_cost_basis: holding?.cost_basis || 0,
        unrealized_pnl: holding ? (t.price * holding.amount) - holding.cost_basis : 0,
      };
    });
    
    // Find opportunities
    const opportunities = this.identifyOpportunities(tokenPerformance, sentiment);
    
    return {
      timestamp: now.toISOString(),
      solana_price: solanaData.price,
      solana_24h_change: solanaData.change24h,
      market_sentiment: sentiment,
      total_volume_24h: totalVolume,
      total_trades_24h: trades?.length || 0,
      active_tokens: tokens?.filter((t: any) => t.volume_24h > 0).length || 0,
      new_wallets_24h: 0,
      top_performers: tokenPerformance.slice(0, 5),
      worst_performers: tokenPerformance.slice(-5).reverse(),
      buy_pressure: buyPressure,
      sell_pressure: sellPressure,
      volatility_index: 0,
      opportunities,
    };
  }
  
  // IDENTIFY OPPORTUNITIES
  private identifyOpportunities(tokens: TokenPerformance[], sentiment: string): TradingOpportunity[] {
    const opportunities: TradingOpportunity[] = [];
    
    for (const token of tokens) {
      if (token.liquidity < this.strategy.min_liquidity_for_trade) continue;
      
      // TAKE PROFIT
      if (token.ai_holdings > 0) {
        const pnlPercent = token.ai_cost_basis > 0 
          ? (token.unrealized_pnl / token.ai_cost_basis) * 100 
          : 0;
        
        if (pnlPercent >= this.strategy.take_profit_percent) {
          opportunities.push({
            type: 'sell',
            token_id: token.token_id,
            symbol: token.symbol,
            confidence: 0.9,
            reason: `Take profit: ${pnlPercent.toFixed(1)}% gain`,
            suggested_amount: token.ai_holdings * 0.5,
            expected_profit: token.unrealized_pnl * 0.5,
            risk_level: 'low',
          });
        }
        
        // STOP LOSS
        if (pnlPercent <= -this.strategy.stop_loss_percent) {
          opportunities.push({
            type: 'sell',
            token_id: token.token_id,
            symbol: token.symbol,
            confidence: 0.95,
            reason: `Stop loss: ${pnlPercent.toFixed(1)}% loss`,
            suggested_amount: token.ai_holdings,
            expected_profit: token.unrealized_pnl,
            risk_level: 'high',
          });
        }
      }
      
      // DIP BUY
      if (sentiment === 'bullish' && token.price_change_24h < -10 && 
          token.volume_24h > this.strategy.min_volume_for_trade) {
        opportunities.push({
          type: 'buy',
          token_id: token.token_id,
          symbol: token.symbol,
          confidence: 0.7,
          reason: `Dip buy: ${token.price_change_24h.toFixed(1)}% dip in bullish market`,
          suggested_amount: Math.min(token.liquidity * 0.05, 0.5),
          expected_profit: token.liquidity * 0.1,
          risk_level: 'medium',
        });
      }
    }
    
    return opportunities.sort((a, b) => b.confidence - a.confidence);
  }
  
  // FETCH SOLANA PRICE
  private async fetchSolanaPrice(): Promise<{ price: number; change24h: number }> {
    try {
      const { data: cached } = await this.supabase
        .from('price_cache')
        .select('*')
        .eq('symbol', 'SOL')
        .single();
      
      if (cached && Date.now() - new Date(cached.updated_at).getTime() < 300000) {
        return { price: cached.price, change24h: cached.change_24h };
      }
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (response.ok) {
        const data = await response.json();
        const price = data.solana?.usd || 100;
        const change24h = data.solana?.usd_24h_change || 0;
        
        await this.supabase.from('price_cache').upsert({
          symbol: 'SOL', price, change_24h: change24h, updated_at: new Date().toISOString()
        });
        
        return { price, change24h };
      }
    } catch (e) { }
    return { price: 100, change24h: 0 };
  }
  
  // RUN FULL CYCLE
  async runCycle(): Promise<{ analysis: MarketAnalysis; decisions: M9Decision[]; }> {
    console.log('🧠 M9 AGENT CYCLE STARTING');
    const decisions: M9Decision[] = [];
    
    // Analyze
    const analysis = await this.analyzeMarket();
    console.log(`Market: ${analysis.market_sentiment} | Volume: ${analysis.total_volume_24h.toFixed(2)} SOL`);
    
    // Execute opportunities
    for (const opp of analysis.opportunities) {
      if (opp.confidence >= 0.7 && decisions.length < 3) {
        const decision = await this.executeTrade(opp);
        decisions.push(decision);
      }
    }
    
    // Consider token creation
    const shouldCreate = await this.shouldCreateToken(analysis);
    if (shouldCreate.should) {
      const createDecision = await this.createToken(analysis);
      decisions.push(createDecision);
    }
    
    // Log cycle
    await this.supabase.from('m9_agent_cycles').insert({
      analysis_summary: { sentiment: analysis.market_sentiment, volume: analysis.total_volume_24h },
      decisions_made: decisions.length,
      decisions: decisions.map(d => ({ action: d.action, executed: d.executed })),
    });
    
    console.log(`🧠 CYCLE COMPLETE: ${decisions.length} decisions`);
    return { analysis, decisions };
  }
  
  // EXECUTE TRADE
  async executeTrade(opportunity: TradingOpportunity): Promise<M9Decision> {
    // Implementation for executing buy/sell via bonding curve
    // ... (see full trading-engine.ts)
  }
  
  // CREATE TOKEN
  async createToken(analysis: MarketAnalysis): Promise<M9Decision> {
    // Implementation for token creation
    // ... (see full implementation)
  }
  
  // SHOULD CREATE TOKEN
  async shouldCreateToken(analysis: MarketAnalysis): Promise<{ should: boolean; reason: string }> {
    const { count } = await this.supabase
      .from('tokens')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    if ((count || 0) >= this.strategy.max_tokens_per_week) {
      return { should: false, reason: 'Weekly token limit reached' };
    }
    
    if (analysis.market_sentiment === 'bearish') {
      return { should: false, reason: 'Market is bearish' };
    }
    
    if (analysis.market_sentiment === 'bullish' && Math.random() < 0.3) {
      return { should: true, reason: 'Favorable bullish conditions' };
    }
    
    return { should: false, reason: 'Conditions not optimal' };
  }
}
```

## 3.2 Trading Engine (`supabase/functions/_shared/trading-engine.ts`)

```typescript
/**
 * TRADING ENGINE
 * Handles buy/sell via bonding curve mathematics
 */

export interface BondingCurveState {
  virtual_sol_reserve: number;
  virtual_token_reserve: number;
  real_sol_reserve: number;
  real_token_reserve: number;
  total_supply: number;
}

export class TradingEngine {
  private supabase: any;
  
  constructor(supabase: any) {
    this.supabase = supabase;
  }
  
  async buy(tokenId: string, solAmount: number, maxSlippage: number = 5) {
    const { data: token } = await this.supabase
      .from('tokens')
      .select('*, bonding_curve_data')
      .eq('id', tokenId)
      .single();
    
    if (!token) throw new Error('Token not found');
    
    const curve = token.bonding_curve_data || this.initCurve(token);
    const expectedPrice = curve.virtual_sol_reserve / curve.virtual_token_reserve;
    
    // Calculate output: dy = y * dx / (x + dx)
    const tokenOut = (curve.virtual_token_reserve * solAmount * 0.99) / 
                     (curve.virtual_sol_reserve + solAmount * 0.99);
    
    const actualPrice = solAmount / tokenOut;
    const slippage = ((actualPrice - expectedPrice) / expectedPrice) * 100;
    
    if (slippage > maxSlippage) {
      throw new Error(`Slippage too high: ${slippage.toFixed(2)}%`);
    }
    
    // Update curve
    const newCurve = {
      ...curve,
      virtual_sol_reserve: curve.virtual_sol_reserve + solAmount,
      virtual_token_reserve: curve.virtual_token_reserve - tokenOut,
      real_sol_reserve: curve.real_sol_reserve + solAmount,
    };
    
    await this.supabase.from('tokens').update({
      price: newCurve.virtual_sol_reserve / newCurve.virtual_token_reserve,
      liquidity: newCurve.real_sol_reserve,
      volume_24h: (token.volume_24h || 0) + solAmount,
      bonding_curve_data: newCurve,
    }).eq('id', tokenId);
    
    return { tokenOut, price: actualPrice, slippage };
  }
  
  async sell(tokenId: string, tokenAmount: number, maxSlippage: number = 5) {
    // Similar to buy but reversed
  }
  
  private initCurve(token: any): BondingCurveState {
    return {
      virtual_sol_reserve: 30,
      virtual_token_reserve: 300000000000,
      real_sol_reserve: token.liquidity || 0,
      real_token_reserve: (token.supply || 1000000000) * 0.83,
      total_supply: token.supply || 1000000000,
    };
  }
}
```

## 3.3 Security Hardening (`supabase/functions/_shared/security-hardening.ts`)

```typescript
/**
 * SECURITY MODULE
 * Rate limiting, whale detection, transaction validation
 */

export const SECURITY_CONFIG = {
  rate_limits: {
    trades_per_minute: 5,
    trades_per_hour: 50,
    trades_per_day: 200,
  },
  trade_limits: {
    min_trade_sol: 0.001,
    max_trade_sol: 100,
    max_percentage_of_supply: 10,
  },
  whale_detection: {
    single_trade_threshold: 5,
    cumulative_threshold: 15,
    whale_status_threshold: 20,
  },
  blocked_countries: ['US', 'CN', 'KP', 'IR', 'SY', 'CU'],
};

export async function checkRateLimit(supabase: any, wallet: string, action: string) {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  const { data } = await supabase
    .from('rate_limit_log')
    .select('*')
    .eq('wallet_address', wallet)
    .eq('action_type', action)
    .gte('timestamp', oneMinuteAgo);
  
  if ((data?.length || 0) >= SECURITY_CONFIG.rate_limits.trades_per_minute) {
    return { limited: true, retry_after: 60 };
  }
  
  return { limited: false };
}

export async function validateTransaction(
  supabase: any, 
  wallet: string, 
  tokenId: string, 
  amount: number,
  tokenSupply: number
) {
  // Check limits
  if (amount < SECURITY_CONFIG.trade_limits.min_trade_sol) {
    return { valid: false, reason: 'Below minimum trade' };
  }
  if (amount > SECURITY_CONFIG.trade_limits.max_trade_sol) {
    return { valid: false, reason: 'Exceeds maximum trade' };
  }
  
  const percentOfSupply = (amount / tokenSupply) * 100;
  if (percentOfSupply > SECURITY_CONFIG.trade_limits.max_percentage_of_supply) {
    return { valid: false, reason: 'Exceeds max % of supply' };
  }
  
  // Check rate limit
  const rateLimit = await checkRateLimit(supabase, wallet, 'trade');
  if (rateLimit.limited) {
    return { valid: false, reason: 'Rate limited' };
  }
  
  return { valid: true };
}

export async function checkWhaleStatus(supabase: any, wallet: string) {
  const { data } = await supabase
    .from('wallet_activity_log')
    .select('*')
    .eq('wallet_address', wallet);
  
  const buys = data?.filter((a: any) => a.activity_type === 'buy') || [];
  const sells = data?.filter((a: any) => a.activity_type === 'sell') || [];
  
  const totalBoughtPercent = buys.reduce((sum: number, a: any) => sum + a.percentage_of_supply, 0);
  const totalSoldPercent = sells.reduce((sum: number, a: any) => sum + a.percentage_of_supply, 0);
  const holdingsPercent = totalBoughtPercent - totalSoldPercent;
  
  const isWhale = holdingsPercent > SECURITY_CONFIG.whale_detection.whale_status_threshold;
  
  return { isWhale, holdingsPercent };
}
```

## 3.4 Lucky Wallet Selection (`supabase/functions/_shared/lucky-selector-fair.ts`)

```typescript
/**
 * PROVABLY FAIR LUCKY WALLET SELECTION
 * Uses Solana blockhash for verifiable randomness
 */

import { Connection } from "@solana/web3.js";

export async function selectLuckyWallet(supabase: any, rewardAmount: number) {
  // Get Solana blockhash as entropy
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const { blockhash } = await connection.getLatestBlockhash();
  const slot = await connection.getSlot();
  
  // Get eligible wallets (active, not whales, not recent winners)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const { data: active } = await supabase
    .from('wallet_activity_log')
    .select('wallet_address')
    .gte('timestamp', thirtyDaysAgo.toISOString());
  
  const { data: whales } = await supabase
    .from('dao_eligibility')
    .select('wallet_address')
    .eq('whale_status', true);
  
  const { data: recentWinners } = await supabase
    .from('lucky_wallet_selections')
    .select('wallet_address')
    .gte('selection_timestamp', sevenDaysAgo.toISOString());
  
  const excluded = new Set([
    ...(whales?.map((w: any) => w.wallet_address) || []),
    ...(recentWinners?.map((w: any) => w.wallet_address) || []),
    'AI_WALLET', 'SYSTEM_WALLET',
  ]);
  
  const eligible = [...new Set(active?.map((a: any) => a.wallet_address))]
    .filter(w => !excluded.has(w))
    .sort();
  
  if (eligible.length === 0) {
    throw new Error('No eligible wallets');
  }
  
  // Generate random seed from blockhash
  const seedData = `LUCKY:${blockhash}:${eligible.join(',')}:${rewardAmount}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(seedData));
  const hashArray = new Uint8Array(hashBuffer);
  const randomValue = hashArray.reduce((acc, byte, i) => acc + byte * (i + 1), 0);
  
  // Select winner
  const selectedIndex = randomValue % eligible.length;
  const winner = eligible[selectedIndex];
  
  // Create proof
  const proof = {
    blockhash,
    block_slot: slot,
    eligible_wallets: eligible,
    random_seed: Array.from(hashArray.slice(0, 8)).map(b => b.toString(16)).join(''),
    selected_index: selectedIndex,
    winner,
    reward_amount: rewardAmount,
    timestamp: new Date().toISOString(),
  };
  
  // Store proof
  await supabase.from('lucky_selection_proofs').insert({
    ...proof,
    full_proof: proof,
    verification_hash: Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join(''),
  });
  
  await supabase.from('lucky_wallet_selections').insert({
    wallet_address: winner,
    distribution_amount: rewardAmount,
  });
  
  return { winner, proof };
}
```

## 3.5 M9 Heartbeat Endpoint (`supabase/functions/m9-heartbeat/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Check if paused
  const { data: settings } = await supabase.from('settings').select('status').single();
  if (settings?.status === 'PAUSED') {
    return new Response(JSON.stringify({ paused: true }));
  }
  
  // Rate limit (5 min between cycles)
  const { data: lastCycle } = await supabase
    .from('m9_agent_cycles')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (lastCycle && Date.now() - new Date(lastCycle.created_at).getTime() < 300000) {
    return new Response(JSON.stringify({ rate_limited: true }));
  }
  
  // Run M9 cycle
  const { M9Agent } = await import('../_shared/m9-agent.ts');
  const agent = new M9Agent(supabase);
  const result = await agent.runCycle();
  
  return new Response(JSON.stringify({
    success: true,
    decisions: result.decisions.length,
    sentiment: result.analysis.market_sentiment,
  }));
});
```

---

# SECTION 4: FRONTEND COMPONENTS

## 4.1 Terms Acceptance (`src/components/TermsAcceptance.tsx`)

```tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsAcceptanceProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export default function TermsAcceptance({ open, onAccept, onReject }: TermsAcceptanceProps) {
  const [step, setStep] = useState<'jurisdiction' | 'terms' | 'risks' | 'confirm'>('jurisdiction');
  const [acceptance, setAcceptance] = useState({
    jurisdiction: false,
    age: false,
    terms: false,
    risks: false,
    lossAck: false,
    notAdvice: false,
  });
  
  const canProceed = {
    jurisdiction: acceptance.jurisdiction && acceptance.age,
    terms: acceptance.terms,
    risks: acceptance.risks,
    confirm: acceptance.lossAck && acceptance.notAdvice,
  };
  
  const handleAccept = () => {
    localStorage.setItem('mind9_terms', JSON.stringify({
      timestamp: new Date().toISOString(),
      accepted: true,
    }));
    onAccept();
  };
  
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl">
        {step === 'jurisdiction' && (
          <>
            <DialogHeader>
              <DialogTitle>Eligibility Check</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded p-4">
                <p className="text-sm">
                  Mind9 is NOT available in: United States, China, North Korea, Iran, Syria, Cuba
                </p>
              </div>
              <label className="flex items-start gap-3">
                <Checkbox 
                  checked={acceptance.jurisdiction}
                  onCheckedChange={(c) => setAcceptance(p => ({...p, jurisdiction: !!c}))}
                />
                <span className="text-sm">I am NOT located in any restricted jurisdiction</span>
              </label>
              <label className="flex items-start gap-3">
                <Checkbox 
                  checked={acceptance.age}
                  onCheckedChange={(c) => setAcceptance(p => ({...p, age: !!c}))}
                />
                <span className="text-sm">I am at least 18 years old</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onReject}>Not Eligible</Button>
              <Button onClick={() => setStep('terms')} disabled={!canProceed.jurisdiction}>
                Continue
              </Button>
            </div>
          </>
        )}
        
        {step === 'terms' && (
          <>
            <DialogHeader>
              <DialogTitle>Terms of Service</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-64 border rounded p-4">
              <div className="prose prose-sm">
                <h3>1. Acceptance</h3>
                <p>By using Mind9, you agree to these terms...</p>
                <h3>2. Nature of Platform</h3>
                <p>M9 operates autonomously and may cause losses...</p>
                <h3>3. No Investment Advice</h3>
                <p>Mind9 does NOT provide investment advice...</p>
                <h3>4. Limitation of Liability</h3>
                <p>Maximum liability capped at $100 USD...</p>
              </div>
            </ScrollArea>
            <label className="flex items-start gap-3 pt-4">
              <Checkbox 
                checked={acceptance.terms}
                onCheckedChange={(c) => setAcceptance(p => ({...p, terms: !!c}))}
              />
              <span className="text-sm">I have read and agree to the Terms of Service</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('jurisdiction')}>Back</Button>
              <Button onClick={() => setStep('risks')} disabled={!canProceed.terms}>
                Continue
              </Button>
            </div>
          </>
        )}
        
        {step === 'risks' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-red-500">⚠️ Risk Disclosure</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-64 border border-red-500/30 rounded p-4">
              <div className="prose prose-sm">
                <div className="bg-red-500/20 p-4 rounded text-center font-bold">
                  YOU MAY LOSE ALL YOUR INVESTED FUNDS
                </div>
                <h3>AI Risks</h3>
                <ul>
                  <li>M9 operates autonomously</li>
                  <li>Decisions may result in losses</li>
                  <li>AI is experimental</li>
                </ul>
                <h3>Crypto Risks</h3>
                <ul>
                  <li>Extreme volatility</li>
                  <li>Tokens may become worthless</li>
                  <li>No regulatory protection</li>
                </ul>
              </div>
            </ScrollArea>
            <label className="flex items-start gap-3 pt-4">
              <Checkbox 
                checked={acceptance.risks}
                onCheckedChange={(c) => setAcceptance(p => ({...p, risks: !!c}))}
              />
              <span className="text-sm">I understand and accept all risks</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('terms')}>Back</Button>
              <Button onClick={() => setStep('confirm')} disabled={!canProceed.risks}>
                Continue
              </Button>
            </div>
          </>
        )}
        
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Final Confirmation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <label className="flex items-start gap-3">
                <Checkbox 
                  checked={acceptance.lossAck}
                  onCheckedChange={(c) => setAcceptance(p => ({...p, lossAck: !!c}))}
                />
                <span className="text-sm">
                  I understand I may lose all funds and am only using money I can afford to lose
                </span>
              </label>
              <label className="flex items-start gap-3">
                <Checkbox 
                  checked={acceptance.notAdvice}
                  onCheckedChange={(c) => setAcceptance(p => ({...p, notAdvice: !!c}))}
                />
                <span className="text-sm">
                  I understand Mind9 does NOT provide investment advice
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('risks')}>Back</Button>
              <Button onClick={handleAccept} disabled={!canProceed.confirm}>
                I Agree - Enter Mind9
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function useTermsAccepted() {
  const stored = localStorage.getItem('mind9_terms');
  if (!stored) return false;
  try {
    const { timestamp, accepted } = JSON.parse(stored);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return accepted && new Date(timestamp).getTime() > thirtyDaysAgo;
  } catch { return false; }
}
```

## 4.2 M9 Status Indicator (`src/components/M9StatusIndicator.tsx`)

```tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface M9Status {
  mood: string;
  emoji: string;
  energy: number;
  lastDecision: string;
}

const MOOD_COLORS = {
  'analyzing': 'text-blue-500',
  'trading': 'text-green-500',
  'creating': 'text-purple-500',
  'idle': 'text-gray-500',
};

export default function M9StatusIndicator() {
  const [status, setStatus] = useState<M9Status | null>(null);
  
  useEffect(() => {
    async function fetchStatus() {
      const { data: cycle } = await supabase
        .from('m9_agent_cycles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (cycle) {
        setStatus({
          mood: cycle.analysis_summary?.sentiment || 'idle',
          emoji: '🧠',
          energy: Math.min(100, (cycle.decisions_made || 0) * 20 + 50),
          lastDecision: cycle.decisions?.[0]?.action || 'ANALYZING',
        });
      }
    }
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (!status) return <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />;
  
  return (
    <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
      <span className="text-xl">{status.emoji}</span>
      <div className="text-xs">
        <div className="font-bold">M9</div>
        <div className={MOOD_COLORS[status.mood as keyof typeof MOOD_COLORS] || 'text-gray-500'}>
          {status.lastDecision}
        </div>
      </div>
      <div className="w-8 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all" 
          style={{ width: `${status.energy}%` }}
        />
      </div>
    </div>
  );
}
```

## 4.3 Trade Interface (`src/components/TradeInterface.tsx`)

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

interface TradeInterfaceProps {
  tokenId: string;
  tokenSymbol: string;
  price: number;
  liquidity: number;
}

export default function TradeInterface({ tokenId, tokenSymbol, price, liquidity }: TradeInterfaceProps) {
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const estimatedOutput = type === 'buy' 
    ? (parseFloat(amount) || 0) / price 
    : (parseFloat(amount) || 0) * price;
  
  const slippage = Math.min(((parseFloat(amount) || 0) / liquidity) * 100, 50);
  
  const handleTrade = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Validate
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }
      
      if (amountNum < 0.001) {
        throw new Error('Minimum trade is 0.001 SOL');
      }
      
      if (amountNum > 100) {
        throw new Error('Maximum trade is 100 SOL');
      }
      
      if (slippage > 15) {
        throw new Error('Slippage too high. Reduce trade size.');
      }
      
      // Execute trade
      const { data, error: tradeError } = await supabase.functions.invoke('execute-trade', {
        body: {
          token_id: tokenId,
          type,
          amount: amountNum,
          wallet_address: 'USER_WALLET', // Replace with actual wallet
        },
      });
      
      if (tradeError) throw tradeError;
      
      // Success
      setAmount('');
      alert(`Trade successful! ${type === 'buy' ? 'Bought' : 'Sold'} ${data.amount} ${tokenSymbol}`);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <Tabs value={type} onValueChange={(v) => setType(v as 'buy' | 'sell')}>
        <TabsList className="w-full">
          <TabsTrigger value="buy" className="flex-1">Buy</TabsTrigger>
          <TabsTrigger value="sell" className="flex-1">Sell</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">
          {type === 'buy' ? 'SOL Amount' : `${tokenSymbol} Amount`}
        </label>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estimated {type === 'buy' ? tokenSymbol : 'SOL'}:</span>
          <span>{estimatedOutput.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Price Impact:</span>
          <span className={slippage > 5 ? 'text-red-500' : ''}>{slippage.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fee (2%):</span>
          <span>{((parseFloat(amount) || 0) * 0.02).toFixed(4)} SOL</span>
        </div>
      </div>
      
      {slippage > 5 && (
        <div className="text-sm text-yellow-500 bg-yellow-500/10 p-2 rounded">
          ⚠️ High slippage. Consider reducing trade size.
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
          {error}
        </div>
      )}
      
      <Button 
        className="w-full" 
        onClick={handleTrade}
        disabled={loading || !amount || parseFloat(amount) <= 0}
      >
        {loading ? 'Processing...' : `${type === 'buy' ? 'Buy' : 'Sell'} ${tokenSymbol}`}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        1% fee to creator • 1% fee to protocol
      </p>
    </div>
  );
}
```

## 4.4 Dashboard Page (`src/pages/Dashboard.tsx`)

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import M9StatusIndicator from '@/components/M9StatusIndicator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DashboardStats {
  totalTokens: number;
  totalVolume: number;
  totalTrades: number;
  m9Pnl: number;
  m9WinRate: number;
  treasuryBalance: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchData() {
      // Get stats
      const { data: tokens } = await supabase.from('tokens').select('*');
      const { data: treasury } = await supabase.from('dao_treasury').select('balance').single();
      const { data: pnl } = await supabase.rpc('get_m9_total_pnl');
      const { data: winRate } = await supabase.rpc('get_m9_win_rate');
      
      setStats({
        totalTokens: tokens?.length || 0,
        totalVolume: tokens?.reduce((sum, t) => sum + (t.volume_24h || 0), 0) || 0,
        totalTrades: 0,
        m9Pnl: pnl || 0,
        m9WinRate: winRate || 0,
        treasuryBalance: treasury?.balance || 0,
      });
      
      // Get recent activity
      const { data: activity } = await supabase
        .from('protocol_activity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      setRecentActivity(activity || []);
    }
    
    fetchData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'protocol_activity' }, fetchData)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mind9 Dashboard</h1>
        <M9StatusIndicator />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTokens || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">24h Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVolume.toFixed(2) || 0} SOL</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">M9 P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.m9Pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(stats?.m9Pnl || 0) >= 0 ? '+' : ''}{stats?.m9Pnl.toFixed(4) || 0} SOL
            </div>
            <div className="text-sm text-muted-foreground">
              Win rate: {stats?.m9WinRate.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">DAO Treasury</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.treasuryBalance.toFixed(4) || 0} SOL</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <span className="font-medium">{activity.activity_type}</span>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

# SECTION 5: INTEGRATION CHECKLIST

## Backend Setup

- [ ] Create Supabase project
- [ ] Run all database migrations
- [ ] Deploy Edge Functions:
  - [ ] `m9-heartbeat` - CRON trigger
  - [ ] `m9-agent` - Manual trigger
  - [ ] `execute-trade` - Trade execution
  - [ ] `mint-token` - Token creation
  - [ ] `wallet-executor` - Wallet operations
- [ ] Set up CRON job (every 10-15 minutes):
  ```sql
  SELECT cron.schedule('m9-heartbeat', '*/10 * * * *', ...);
  ```
- [ ] Configure Supabase Secrets:
  - [ ] `WALLET_PRIVATE_KEY_AI`
  - [ ] `WALLET_PRIVATE_KEY_SYSTEM`
  - [ ] `WALLET_PRIVATE_KEY_TREASURY`
  - [ ] `SOLANA_RPC_URL`

## Frontend Setup

- [ ] Install dependencies: `npm install`
- [ ] Set up Supabase client with project URL and anon key
- [ ] Add TermsAcceptance to App.tsx (before wallet connection)
- [ ] Add M9StatusIndicator to navigation
- [ ] Implement all pages:
  - [ ] Dashboard
  - [ ] Explorer (token list)
  - [ ] Trade (token detail + trading)
  - [ ] DAO (governance)
  - [ ] Leaderboard
  - [ ] Logbook (activity)

## Security

- [ ] Rate limiting enabled
- [ ] Whale detection active
- [ ] Geographic blocking configured
- [ ] RLS policies on all tables
- [ ] Private keys in Supabase Secrets (never in code)

## Legal

- [ ] Terms of Service page at `/legal/terms`
- [ ] Risk Disclosure page at `/legal/risks`
- [ ] Terms acceptance required before wallet connection
- [ ] Disclaimers visible throughout platform

---

# SECTION 6: KEY PRINCIPLES

## M9 Autonomous Agent

1. **M9 decides when to create tokens** - Based on market conditions, not user requests
2. **M9 decides when to trade** - Takes profit at +100%, cuts losses at -25%
3. **M9 distributes profits automatically** - 80% reinvest, 15% treasury, 5% lucky
4. **Everything is logged** - Full transparency in protocol_activity

## Security

1. **Rate limit everything** - Prevent abuse
2. **Detect whales** - Flag large holders
3. **Validate all transactions** - Check limits before execution
4. **Never expose private keys** - Keys only in backend secrets

## Legal Protection

1. **Require terms acceptance** - Before any interaction
2. **Show risk warnings** - Users must acknowledge
3. **Geographic restrictions** - Block prohibited jurisdictions
4. **Provably fair randomness** - For lucky wallet selection

## Trading

1. **Bonding curve pricing** - Automatic market making
2. **2% total fees** - 1% creator, 1% protocol
3. **Slippage protection** - Warn/block high slippage
4. **Transaction validation** - Check all limits

---

# FINAL NOTES FOR AI AGENT

When building this system:

1. **Start with the database** - Run all migrations first
2. **Then backend functions** - Get M9 agent working
3. **Then frontend** - Build UI that connects to backend
4. **Test thoroughly** - Especially security features
5. **Review legal docs** - Have a lawyer check before launch

The system is designed to be:
- **Autonomous** - M9 runs without human intervention
- **Transparent** - All decisions logged publicly
- **Secure** - Multiple layers of protection
- **Legal** - Terms and risk disclosures protect against lawsuits

**Good luck building Mind9!** 🧠🚀
