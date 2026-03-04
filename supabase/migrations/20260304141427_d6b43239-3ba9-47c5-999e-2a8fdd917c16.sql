
-- News table
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_number serial NOT NULL,
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  author_avatar text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  content_type text NOT NULL DEFAULT 'text',
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  media_url text,
  media_file_name text,
  likes_count integer NOT NULL DEFAULT 0,
  dislikes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- News reactions (like/dislike per user)
CREATE TABLE public.news_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(news_id, user_id)
);

-- News comments
CREATE TABLE public.news_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  user_avatar text,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- News read status per user
CREATE TABLE public.news_read_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(news_id, user_id)
);

-- Enable RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_read_status ENABLE ROW LEVEL SECURITY;

-- News policies
CREATE POLICY "Authenticated can view news" ON public.news FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create news" ON public.news FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author or CEO can update news" ON public.news FOR UPDATE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'ceo'));
CREATE POLICY "Author or CEO can delete news" ON public.news FOR DELETE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'ceo'));

-- Reactions policies
CREATE POLICY "Authenticated can view reactions" ON public.news_reactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can react" ON public.news_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update own reaction" ON public.news_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own reaction" ON public.news_reactions FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Authenticated can view comments" ON public.news_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can comment" ON public.news_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Author or CEO can update comment" ON public.news_comments FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo'));
CREATE POLICY "Author or CEO can delete comment" ON public.news_comments FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo'));

-- Read status policies
CREATE POLICY "User can view own read status" ON public.news_read_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can mark as read" ON public.news_read_status FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for news
ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_comments;
