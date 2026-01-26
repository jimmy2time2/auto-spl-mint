-- Create token_comments table for user comments on tokens
CREATE TABLE public.token_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.token_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments
CREATE POLICY "Comments are viewable by everyone"
ON public.token_comments
FOR SELECT
USING (true);

-- Anyone can insert comments (public feature)
CREATE POLICY "Anyone can add comments"
ON public.token_comments
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_token_comments_token_id ON public.token_comments(token_id);
CREATE INDEX idx_token_comments_created_at ON public.token_comments(created_at DESC);