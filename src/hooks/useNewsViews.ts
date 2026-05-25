import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface NewsViewRow {
  id: string;
  news_id: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  total_seconds: number;
  first_viewed_at: string;
  last_viewed_at: string;
}

/**
 * Tracks active viewing time of a news card while it's visible on screen and the
 * tab is focused. Persists `total_seconds` to `news_views` every ~10s and on unmount.
 */
export function useNewsViewTracker(newsId: string, enabled: boolean = true) {
  const { user, profile } = useAuthContext();
  const targetRef = useRef<HTMLDivElement | null>(null);
  const accumulatedRef = useRef(0); // seconds not yet flushed
  const visibleRef = useRef(false);
  const focusedRef = useRef(typeof document !== 'undefined' ? !document.hidden : true);
  const tickRef = useRef<number | null>(null);
  const flushRef = useRef<number | null>(null);
  const rowIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !user?.id || !newsId || !targetRef.current) return;

    const node = targetRef.current;

    const flush = async () => {
      const seconds = accumulatedRef.current;
      if (seconds <= 0) return;
      accumulatedRef.current = 0;
      try {
        // Try update first if we have a row, else upsert
        const payload = {
          news_id: newsId,
          user_id: user.id,
          user_name: profile?.display_name || null,
          user_avatar: profile?.avatar_url || null,
          last_viewed_at: new Date().toISOString(),
        };

        if (rowIdRef.current) {
          // Use RPC-like approach: fetch current total then add (avoids needing a db function)
          const { data: cur } = await supabase
            .from('news_views')
            .select('total_seconds')
            .eq('id', rowIdRef.current)
            .maybeSingle();
          const newTotal = (cur?.total_seconds || 0) + seconds;
          await supabase
            .from('news_views')
            .update({ ...payload, total_seconds: newTotal } as any)
            .eq('id', rowIdRef.current);
        } else {
          const { data: existing } = await supabase
            .from('news_views')
            .select('id, total_seconds')
            .eq('news_id', newsId)
            .eq('user_id', user.id)
            .maybeSingle();
          if (existing) {
            rowIdRef.current = existing.id;
            await supabase
              .from('news_views')
              .update({ ...payload, total_seconds: (existing.total_seconds || 0) + seconds } as any)
              .eq('id', existing.id);
          } else {
            const { data: ins } = await supabase
              .from('news_views')
              .insert({ ...payload, total_seconds: seconds, first_viewed_at: new Date().toISOString() } as any)
              .select('id')
              .single();
            if (ins) rowIdRef.current = ins.id;
          }
        }
      } catch {
        // silent — keep accumulating
        accumulatedRef.current += seconds;
      }
    };

    const startTick = () => {
      if (tickRef.current != null) return;
      tickRef.current = window.setInterval(() => {
        if (visibleRef.current && focusedRef.current) {
          accumulatedRef.current += 1;
        }
      }, 1000);
    };

    const startFlush = () => {
      if (flushRef.current != null) return;
      flushRef.current = window.setInterval(flush, 10000);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        visibleRef.current = e.isIntersecting && e.intersectionRatio >= 0.4;
      },
      { threshold: [0, 0.4, 0.7, 1] }
    );
    io.observe(node);

    const onVisibility = () => { focusedRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);

    startTick();
    startFlush();

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (tickRef.current != null) { clearInterval(tickRef.current); tickRef.current = null; }
      if (flushRef.current != null) { clearInterval(flushRef.current); flushRef.current = null; }
      // final flush (best-effort)
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsId, user?.id, enabled]);

  return targetRef;
}

/** Fetches the viewers (with their seconds) for a news item + realtime updates. */
export function useNewsViewers(newsId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['news-views', newsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_views')
        .select('*')
        .eq('news_id', newsId)
        .order('total_seconds', { ascending: false });
      if (error) throw error;
      return (data || []) as NewsViewRow[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`news-views-${newsId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_views', filter: `news_id=eq.${newsId}` }, () => {
        qc.invalidateQueries({ queryKey: ['news-views', newsId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [newsId, qc]);

  return query;
}

/** Returns formatted "Xم Yث" or "Yث". */
export function formatViewDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}ث`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return rs ? `${m}د ${rs}ث` : `${m}د`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}س ${rm}د` : `${h}س`;
}
