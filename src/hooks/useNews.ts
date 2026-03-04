import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface NewsItem {
  id: string;
  news_number: number;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  project_id: string | null;
  content_type: string;
  title: string;
  content: string;
  media_url: string | null;
  media_file_name: string | null;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsReaction {
  id: string;
  news_id: string;
  user_id: string;
  reaction_type: string;
}

export interface NewsComment {
  id: string;
  news_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
}

export function useNews(projectId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const newsQuery = useQuery({
    queryKey: ['news', projectId],
    queryFn: async () => {
      let q = supabase
        .from('news')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as NewsItem[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('news-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        queryClient.invalidateQueries({ queryKey: ['news'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_comments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['news-comments'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createNews = useMutation({
    mutationFn: async (params: {
      title: string;
      content: string;
      content_type: string;
      media_url?: string;
      media_file_name?: string;
      project_id?: string;
      author_name: string;
      author_avatar?: string;
    }) => {
      const { data, error } = await supabase.from('news').insert({
        author_id: user!.id,
        author_name: params.author_name,
        author_avatar: params.author_avatar || null,
        title: params.title,
        content: params.content,
        content_type: params.content_type,
        media_url: params.media_url || null,
        media_file_name: params.media_file_name || null,
        project_id: params.project_id || null,
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] }),
  });

  const deleteNews = useMutation({
    mutationFn: async (newsId: string) => {
      const { error } = await supabase.from('news').delete().eq('id', newsId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] }),
  });

  return { ...newsQuery, createNews, deleteNews };
}

export function useNewsReactions(newsId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const reactionsQuery = useQuery({
    queryKey: ['news-reactions', newsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_reactions')
        .select('*')
        .eq('news_id', newsId);
      if (error) throw error;
      return data as NewsReaction[];
    },
  });

  const toggleReaction = useMutation({
    mutationFn: async (type: 'like' | 'dislike') => {
      if (!user) return;
      const existing = reactionsQuery.data?.find(r => r.user_id === user.id);
      if (existing) {
        if (existing.reaction_type === type) {
          await supabase.from('news_reactions').delete().eq('id', existing.id);
        } else {
          await supabase.from('news_reactions').update({ reaction_type: type } as any).eq('id', existing.id);
        }
      } else {
        await supabase.from('news_reactions').insert({
          news_id: newsId,
          user_id: user.id,
          reaction_type: type,
        } as any);
      }
      // Update counts on news
      const { data: allReactions } = await supabase
        .from('news_reactions')
        .select('reaction_type')
        .eq('news_id', newsId);
      const likes = allReactions?.filter(r => r.reaction_type === 'like').length || 0;
      const dislikes = allReactions?.filter(r => r.reaction_type === 'dislike').length || 0;
      await supabase.from('news').update({ likes_count: likes, dislikes_count: dislikes } as any).eq('id', newsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-reactions', newsId] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });

  return { ...reactionsQuery, toggleReaction };
}

export function useNewsComments(newsId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const commentsQuery = useQuery({
    queryKey: ['news-comments', newsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_comments')
        .select('*')
        .eq('news_id', newsId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as NewsComment[];
    },
  });

  const addComment = useMutation({
    mutationFn: async (params: { content: string; user_name: string; user_avatar?: string }) => {
      const { error } = await supabase.from('news_comments').insert({
        news_id: newsId,
        user_id: user!.id,
        user_name: params.user_name,
        user_avatar: params.user_avatar || null,
        content: params.content,
      } as any);
      if (error) throw error;
      // Update comment count
      const { count } = await supabase
        .from('news_comments')
        .select('*', { count: 'exact', head: true })
        .eq('news_id', newsId);
      await supabase.from('news').update({ comments_count: count || 0 } as any).eq('id', newsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-comments', newsId] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      await supabase.from('news_comments').delete().eq('id', commentId);
      const { count } = await supabase
        .from('news_comments')
        .select('*', { count: 'exact', head: true })
        .eq('news_id', newsId);
      await supabase.from('news').update({ comments_count: count || 0 } as any).eq('id', newsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-comments', newsId] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });

  return { ...commentsQuery, addComment, deleteComment };
}

export function useNewsReadStatus() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const readStatusQuery = useQuery({
    queryKey: ['news-read-status', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('news_read_status')
        .select('news_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map(r => r.news_id) as string[];
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (newsId: string) => {
      if (!user) return;
      await supabase.from('news_read_status').upsert({
        news_id: newsId,
        user_id: user.id,
      } as any, { onConflict: 'news_id,user_id' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news-read-status'] }),
  });

  const unreadCount = (allNewsIds: string[]) => {
    const readIds = readStatusQuery.data || [];
    return allNewsIds.filter(id => !readIds.includes(id)).length;
  };

  return { readIds: readStatusQuery.data || [], markAsRead, unreadCount, isLoading: readStatusQuery.isLoading };
}
