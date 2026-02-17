
-- Create community_messages table
CREATE TABLE public.community_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL,
  content text,
  media_url text,
  media_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT content_or_media CHECK (content IS NOT NULL OR media_url IS NOT NULL),
  CONSTRAINT content_length CHECK (content IS NULL OR length(content) <= 1000),
  CONSTRAINT media_type_valid CHECK (media_type IS NULL OR media_type IN ('image', 'gif'))
);

-- Enable RLS
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read messages
CREATE POLICY "Community messages viewable by everyone"
  ON public.community_messages
  FOR SELECT
  USING (true);

-- Validated wallet address can insert messages
CREATE POLICY "Wallet holders can send messages"
  ON public.community_messages
  FOR INSERT
  WITH CHECK (
    (length(wallet_address) >= 32)
    AND (length(wallet_address) <= 44)
    AND (wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]+$')
    AND (content IS NULL OR (length(content) >= 1 AND length(content) <= 1000))
  );

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-media
CREATE POLICY "Chat media is publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'chat-media');

CREATE POLICY "Anyone can upload chat media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (octet_length(name) > 0)
  );
