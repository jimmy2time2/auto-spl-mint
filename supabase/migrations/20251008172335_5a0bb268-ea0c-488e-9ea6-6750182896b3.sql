-- Create engagement metrics table for AI decision making
CREATE TABLE IF NOT EXISTS public.engagement_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_connections INTEGER NOT NULL DEFAULT 0,
  trades_count INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  last_token_launch TIMESTAMP WITH TIME ZONE,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI mood state table
CREATE TABLE IF NOT EXISTS public.ai_mood_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_mood TEXT NOT NULL DEFAULT 'neutral',
  mood_intensity NUMERIC NOT NULL DEFAULT 50,
  last_mood_change TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decision_count INTEGER NOT NULL DEFAULT 0,
  last_decision TEXT,
  reasoning TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_mood_state ENABLE ROW LEVEL SECURITY;

-- Create policies for public viewing
CREATE POLICY "Engagement metrics viewable by everyone" 
ON public.engagement_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "AI mood viewable by everyone" 
ON public.ai_mood_state 
FOR SELECT 
USING (true);

-- Initialize default mood
INSERT INTO public.ai_mood_state (current_mood, mood_intensity, last_decision, reasoning)
VALUES ('neutral', 50, 'wait', 'System initialized')
ON CONFLICT DO NOTHING;
