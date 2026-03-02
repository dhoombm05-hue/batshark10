
-- Add is_pinned, is_edited, reactions to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';

-- Allow message authors to update their own messages
CREATE POLICY "Author can update own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);

-- Listen for updates too
ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
