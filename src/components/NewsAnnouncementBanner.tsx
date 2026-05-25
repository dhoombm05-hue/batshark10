import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Sparkles, User, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import logo from '@/assets/batshark-logo-official.png';

interface IncomingNews {
  id: string;
  title: string;
  author_id: string;
  author_name?: string | null;
  author_avatar?: string | null;
  content_type?: string;
  news_number?: number;
}

interface EnrichedNews extends IncomingNews {
  author_avatar?: string | null;
  author_name?: string | null;
  author_job_title?: string | null;
  is_ceo?: boolean;
}

/**
 * Global 3-second cinematic banner shown on every page when a news item goes live.
 * Triggered by:
 *  - INSERT on news where is_published = true (instant publish)
 *  - UPDATE on news where is_published transitions false → true (scheduled publish)
 *
 * Skips the author themselves and avoids re-firing for the same news id.
 */
export default function NewsAnnouncementBanner() {
  const { user } = useAuthContext();
  const [item, setItem] = useState<EnrichedNews | null>(null);
  const shownRef = useRef<Set<string>>(new Set());
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Seed cache from session storage so refreshing the dashboard doesn't replay banners
    try {
      const seen = JSON.parse(sessionStorage.getItem('news-banner-seen') || '[]');
      if (Array.isArray(seen)) shownRef.current = new Set(seen);
    } catch {}
  }, []);

  const enrichAndShow = async (raw: IncomingNews) => {
    if (!raw?.id) return;
    if (shownRef.current.has(raw.id)) return;
    if (user?.id && raw.author_id === user.id) {
      // Don't show to author themselves, but mark as seen
      shownRef.current.add(raw.id);
      return;
    }

    let author_name = raw.author_name || null;
    let author_avatar = raw.author_avatar || null;
    let author_job_title: string | null = null;
    let is_ceo = false;

    try {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, avatar_url, job_title')
          .eq('user_id', raw.author_id)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', raw.author_id),
      ]);
      if (profile) {
        author_name = profile.display_name || author_name;
        author_avatar = profile.avatar_url || author_avatar;
        author_job_title = profile.job_title || null;
      }
      is_ceo = !!(roles || []).find((r: any) => r.role === 'ceo');
    } catch {}

    shownRef.current.add(raw.id);
    try {
      sessionStorage.setItem(
        'news-banner-seen',
        JSON.stringify(Array.from(shownRef.current).slice(-50))
      );
    } catch {}

    setItem({ ...raw, author_name, author_avatar, author_job_title, is_ceo });

    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setItem(null), 3000);
  };

  useEffect(() => {
    if (!user?.id) return; // only show for signed-in users
    const ch = supabase
      .channel('news-announcement')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'news' },
        (payload) => {
          const n = payload.new as any;
          if (n?.is_published) enrichAndShow(n);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'news' },
        (payload) => {
          const n = payload.new as any;
          const o = payload.old as any;
          if (n?.is_published && !o?.is_published) enrichAndShow(n);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-start justify-center pt-6 sm:pt-10"
          dir="rtl"
        >
          {/* Soft top backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/40 via-black/15 to-transparent"
          />

          <motion.div
            initial={{ y: -40, scale: 0.92, opacity: 0, filter: 'blur(6px)' }}
            animate={{
              y: 0,
              scale: 1,
              opacity: 1,
              filter: 'blur(0px)',
              transition: { type: 'spring', stiffness: 240, damping: 22 },
            }}
            exit={{ y: -30, opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
            className="relative pointer-events-auto max-w-xl w-[92%] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10"
          >
            {/* gradient brand bar */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(210,75%,40%)] to-[hsl(var(--royal))]" />
            <div className="absolute inset-0 opacity-25 mix-blend-overlay bg-[radial-gradient(circle_at_20%_20%,white,transparent_55%)]" />

            <div className="relative flex items-center gap-3 px-4 py-3.5 text-white">
              {/* Brand logo */}
              <motion.img
                src={logo}
                alt="logo"
                initial={{ rotate: -25, scale: 0 }}
                animate={{ rotate: 0, scale: 1, transition: { delay: 0.05, type: 'spring', damping: 12 } }}
                className="w-12 h-12 rounded-xl shadow-lg shrink-0 bg-white/10 p-1"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">
                  <Sparkles className="w-3 h-3" />
                  خبر جديد
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <Newspaper className="w-3 h-3" />
                  <span className="font-mono">#{item.news_number ?? ''}</span>
                </div>
                <div className="font-heading font-black text-base sm:text-lg leading-tight truncate mt-0.5">
                  {item.title}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/85 mt-0.5">
                  {item.author_avatar ? (
                    <img
                      src={item.author_avatar}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover ring-1 ring-white/40"
                    />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <span className="font-bold truncate">{item.author_name || 'مستخدم'}</span>
                  {item.is_ceo && <Crown className="w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />}
                  {item.author_job_title && (
                    <span className="text-white/60 truncate">• {item.author_job_title}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 3s progress */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%', transition: { duration: 3, ease: 'linear' } }}
              className="relative h-1 bg-white/60"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
