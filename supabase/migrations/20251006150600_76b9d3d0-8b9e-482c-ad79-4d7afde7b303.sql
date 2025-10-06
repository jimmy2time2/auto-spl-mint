-- Create tokens table for AI-minted SPL tokens
CREATE TABLE public.tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  liquidity NUMERIC NOT NULL DEFAULT 0,
  volume_24h NUMERIC NOT NULL DEFAULT 0,
  holders INTEGER NOT NULL DEFAULT 0,
  supply NUMERIC NOT NULL,
  mint_address TEXT UNIQUE,
  pool_address TEXT,
  launch_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bonding_curve_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallet types enum
CREATE TYPE public.wallet_type AS ENUM ('treasury', 'creator', 'router', 'lucky_distributor', 'public_lucky');

-- Create wallets table (internal AI wallets + public lucky wallets)
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  type public.wallet_type NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_rewards NUMERIC NOT NULL DEFAULT 0,
  reward_count INTEGER NOT NULL DEFAULT 0,
  last_reward_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create logs table for AI actions
CREATE TABLE public.logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  token_id UUID REFERENCES public.tokens(id),
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table for AI configuration
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  launch_freq_hours INTEGER NOT NULL DEFAULT 12,
  fee_split_creator INTEGER NOT NULL DEFAULT 20,
  fee_split_lucky INTEGER NOT NULL DEFAULT 30,
  fee_split_treasury INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  next_launch_timestamp TIMESTAMP WITH TIME ZONE,
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.settings (launch_freq_hours, fee_split_creator, fee_split_lucky, fee_split_treasury, status, next_launch_timestamp)
VALUES (12, 20, 30, 50, 'ACTIVE', now() + INTERVAL '12 hours');

-- Enable RLS on all tables
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Public read-only policies for tokens
CREATE POLICY "Tokens are viewable by everyone"
ON public.tokens FOR SELECT
USING (true);

-- Public lucky wallets are viewable by everyone
CREATE POLICY "Public lucky wallets are viewable by everyone"
ON public.wallets FOR SELECT
USING (type = 'public_lucky');

-- Logs are viewable by everyone (transparency)
CREATE POLICY "Logs are viewable by everyone"
ON public.logs FOR SELECT
USING (true);

-- Settings are viewable by everyone
CREATE POLICY "Settings are viewable by everyone"
ON public.settings FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_tokens_launch_timestamp ON public.tokens(launch_timestamp DESC);
CREATE INDEX idx_wallets_type ON public.wallets(type);
CREATE INDEX idx_wallets_total_rewards ON public.wallets(total_rewards DESC);
CREATE INDEX idx_logs_timestamp ON public.logs(timestamp DESC);
CREATE INDEX idx_logs_token_id ON public.logs(token_id);