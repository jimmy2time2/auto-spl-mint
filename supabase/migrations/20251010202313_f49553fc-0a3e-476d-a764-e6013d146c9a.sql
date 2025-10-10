-- Create heartbeat_log table to track AI "thinking" sessions
CREATE TABLE IF NOT EXISTS public.heartbeat_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_heartbeat_at TIMESTAMP WITH TIME ZONE NOT NULL,
  interval_hours NUMERIC NOT NULL,
  entropy_factor NUMERIC NOT NULL,
  decision_triggered BOOLEAN NOT NULL DEFAULT false,
  decision_result TEXT,
  market_activity_score NUMERIC,
  time_of_day_factor NUMERIC,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.heartbeat_log ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Heartbeat logs viewable by everyone"
  ON public.heartbeat_log
  FOR SELECT
  USING (true);

-- Create index for querying latest heartbeat
CREATE INDEX idx_heartbeat_log_timestamp ON public.heartbeat_log(timestamp DESC);
CREATE INDEX idx_heartbeat_log_next ON public.heartbeat_log(next_heartbeat_at ASC);

-- Create settings table for heartbeat configuration
CREATE TABLE IF NOT EXISTS public.heartbeat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_interval_hours NUMERIC NOT NULL DEFAULT 3,
  max_interval_hours NUMERIC NOT NULL DEFAULT 12,
  entropy_weight NUMERIC NOT NULL DEFAULT 0.3,
  volume_threshold NUMERIC NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.heartbeat_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Heartbeat settings viewable by everyone"
  ON public.heartbeat_settings
  FOR SELECT
  USING (true);

-- Insert default settings
INSERT INTO public.heartbeat_settings (
  min_interval_hours,
  max_interval_hours,
  entropy_weight,
  volume_threshold,
  active
) VALUES (3, 12, 0.3, 100, true)
ON CONFLICT DO NOTHING;