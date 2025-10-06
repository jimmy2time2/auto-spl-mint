-- Economy System Tables for Mind9

-- Coin distributions table: tracks token distribution at mint
CREATE TABLE public.coin_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  ai_wallet_amount NUMERIC NOT NULL DEFAULT 0,
  creator_wallet_amount NUMERIC NOT NULL DEFAULT 0,
  lucky_wallet_amount NUMERIC NOT NULL DEFAULT 0,
  system_wallet_amount NUMERIC NOT NULL DEFAULT 0,
  public_sale_amount NUMERIC NOT NULL DEFAULT 0,
  distribution_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_supply NUMERIC NOT NULL,
  CONSTRAINT valid_distribution CHECK (
    ai_wallet_amount + creator_wallet_amount + lucky_wallet_amount + 
    system_wallet_amount + public_sale_amount = total_supply
  )
);

-- Creator wallet profits: invisible revenue tracking
CREATE TABLE public.creator_wallet_profits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  creator_address TEXT NOT NULL,
  profit_source TEXT NOT NULL CHECK (profit_source IN ('mint_allocation', 'trade_fee', 'ai_profit_share')),
  amount NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transaction_hash TEXT
);

-- Trade fees log: 1% creator, 1% system
CREATE TABLE public.trade_fees_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  trader_address TEXT NOT NULL,
  trade_amount NUMERIC NOT NULL,
  creator_fee NUMERIC NOT NULL,
  system_fee NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transaction_hash TEXT
);

-- Profit events: AI wallet sales split tracking
CREATE TABLE public.profit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  sale_amount NUMERIC NOT NULL,
  reinvestment_amount NUMERIC NOT NULL,
  dao_amount NUMERIC NOT NULL,
  creator_amount NUMERIC NOT NULL,
  lucky_amount NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transaction_hash TEXT,
  CONSTRAINT valid_split CHECK (
    reinvestment_amount + dao_amount + creator_amount + lucky_amount = sale_amount
  )
);

-- DAO eligibility: whale detection and tracking
CREATE TABLE public.dao_eligibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  is_eligible BOOLEAN NOT NULL DEFAULT true,
  whale_status BOOLEAN NOT NULL DEFAULT false,
  total_bought NUMERIC NOT NULL DEFAULT 0,
  total_sold NUMERIC NOT NULL DEFAULT 0,
  max_buy_percentage NUMERIC NOT NULL DEFAULT 0,
  max_sell_percentage NUMERIC NOT NULL DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  flagged_reason TEXT
);

-- Wallet activity log: comprehensive tracking
CREATE TABLE public.wallet_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('buy', 'sell', 'mint', 'transfer')),
  amount NUMERIC NOT NULL,
  percentage_of_supply NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  transaction_hash TEXT,
  is_whale_flagged BOOLEAN NOT NULL DEFAULT false
);

-- DAO treasury: track DAO funds
CREATE TABLE public.dao_treasury (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_received NUMERIC NOT NULL DEFAULT 0,
  total_distributed NUMERIC NOT NULL DEFAULT 0,
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lucky wallet selections: track selection history
CREATE TABLE public.lucky_wallet_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  selection_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  distribution_amount NUMERIC NOT NULL DEFAULT 0,
  is_recent_minter BOOLEAN NOT NULL DEFAULT false,
  activity_score NUMERIC NOT NULL DEFAULT 0
);

-- Protocol activity: overall system tracking
CREATE TABLE public.protocol_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('token_mint', 'trade', 'fee_collection', 'profit_distribution', 'whale_flag')),
  token_id UUID REFERENCES public.tokens(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.coin_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_wallet_profits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_fees_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_wallet_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All tables viewable by everyone (read-only for frontend)
CREATE POLICY "Coin distributions viewable by everyone" ON public.coin_distributions FOR SELECT USING (true);
CREATE POLICY "Creator profits viewable by everyone" ON public.creator_wallet_profits FOR SELECT USING (true);
CREATE POLICY "Trade fees viewable by everyone" ON public.trade_fees_log FOR SELECT USING (true);
CREATE POLICY "Profit events viewable by everyone" ON public.profit_events FOR SELECT USING (true);
CREATE POLICY "DAO eligibility viewable by everyone" ON public.dao_eligibility FOR SELECT USING (true);
CREATE POLICY "Wallet activity viewable by everyone" ON public.wallet_activity_log FOR SELECT USING (true);
CREATE POLICY "DAO treasury viewable by everyone" ON public.dao_treasury FOR SELECT USING (true);
CREATE POLICY "Lucky selections viewable by everyone" ON public.lucky_wallet_selections FOR SELECT USING (true);
CREATE POLICY "Protocol activity viewable by everyone" ON public.protocol_activity FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_coin_distributions_token ON public.coin_distributions(token_id);
CREATE INDEX idx_creator_profits_token ON public.creator_wallet_profits(token_id);
CREATE INDEX idx_creator_profits_creator ON public.creator_wallet_profits(creator_address);
CREATE INDEX idx_trade_fees_token ON public.trade_fees_log(token_id);
CREATE INDEX idx_trade_fees_trader ON public.trade_fees_log(trader_address);
CREATE INDEX idx_profit_events_token ON public.profit_events(token_id);
CREATE INDEX idx_dao_eligibility_wallet ON public.dao_eligibility(wallet_address);
CREATE INDEX idx_wallet_activity_wallet ON public.wallet_activity_log(wallet_address);
CREATE INDEX idx_wallet_activity_token ON public.wallet_activity_log(token_id);
CREATE INDEX idx_lucky_selections_wallet ON public.lucky_wallet_selections(wallet_address);
CREATE INDEX idx_lucky_selections_token ON public.lucky_wallet_selections(token_id);
CREATE INDEX idx_protocol_activity_type ON public.protocol_activity(activity_type);

-- Initialize DAO treasury
INSERT INTO public.dao_treasury (balance, total_received, total_distributed) 
VALUES (0, 0, 0);