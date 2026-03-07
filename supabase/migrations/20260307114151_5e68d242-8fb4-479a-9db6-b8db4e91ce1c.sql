
-- Private conversations table
CREATE TABLE public.private_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  last_message text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Private messages table
CREATE TABLE public.private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.private_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  file_url text,
  file_name text,
  message_type text NOT NULL DEFAULT 'text',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'message',
  title text NOT NULL DEFAULT '',
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  sender_id uuid,
  entity_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.private_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS for private_conversations
CREATE POLICY "Users can view own conversations" ON public.private_conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON public.private_conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own conversations" ON public.private_conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS for private_messages
CREATE POLICY "Users can view messages in own conversations" ON public.private_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.private_conversations c
      WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in own conversations" ON public.private_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.private_conversations c
      WHERE c.id = conversation_id AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Sender can update own messages" ON public.private_messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Sender can delete own messages" ON public.private_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- RLS for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
