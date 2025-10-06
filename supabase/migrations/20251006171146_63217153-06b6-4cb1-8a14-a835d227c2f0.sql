-- Create enum for token moods
CREATE TYPE token_mood AS ENUM (
  'troll',
  'hype', 
  'philosopher',
  'casino',
  'doomcore',
  'discofi',
  'cosmic',
  'glitch',
  'chaos',
  'zen'
);

-- Create token_profiles table
CREATE TABLE public.token_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  bio TEXT NOT NULL,
  mood token_mood NOT NULL,
  mint_reason TEXT NOT NULL,
  image_url TEXT,
  social_text TEXT NOT NULL,
  audio_url TEXT,
  style TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(token_id)
);

-- Enable RLS
ALTER TABLE public.token_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Token profiles are viewable by everyone"
  ON public.token_profiles
  FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_token_profiles_token_id ON public.token_profiles(token_id);