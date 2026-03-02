
-- Chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  project_id UUID REFERENCES public.projects(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES public.chat_messages(id),
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat room members
CREATE TABLE public.chat_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Message read receipts
CREATE TABLE public.chat_read_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_receipts ENABLE ROW LEVEL SECURITY;

-- Policies for chat_rooms
CREATE POLICY "Authenticated can view rooms" ON public.chat_rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create rooms" ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creator can update rooms" ON public.chat_rooms FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creator or CEO can delete rooms" ON public.chat_rooms FOR DELETE USING (auth.uid() = created_by OR has_role(auth.uid(), 'ceo'));

-- Policies for chat_messages
CREATE POLICY "Authenticated can view messages" ON public.chat_messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Author can delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Policies for chat_room_members
CREATE POLICY "Authenticated can view members" ON public.chat_room_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can join rooms" ON public.chat_room_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own membership" ON public.chat_room_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.chat_room_members FOR DELETE USING (auth.uid() = user_id);

-- Policies for chat_read_receipts
CREATE POLICY "Authenticated can view receipts" ON public.chat_read_receipts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can mark read" ON public.chat_read_receipts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Index for performance
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members(user_id);
