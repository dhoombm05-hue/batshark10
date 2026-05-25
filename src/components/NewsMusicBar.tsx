import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, Loader2, X, Search, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Track {
  title?: string;
  channel?: string;
  thumbnail?: string;
  videoId?: string;
  url?: string;
}

/** Extract a YouTube videoId from various URL shapes. */
function extractVideoId(track: Track | null): string | null {
  if (!track) return null;
  if (track.videoId) return track.videoId;
  const url = track.url || '';
  const m =
    url.match(/[?&]v=([^&#]+)/) ||
    url.match(/youtu\.be\/([^?&#]+)/) ||
    url.match(/embed\/([^?&#]+)/);
  return m ? m[1] : null;
}

/**
 * Compact music search + player bar for the News page.
 * Uses the music_search action of the b99-engine edge function to find a YouTube
 * audio track and plays it via a hidden iframe (autoplay).
 */
export default function NewsMusicBar() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const videoId = extractVideoId(track);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'music_search', payload: { query: q } },
      });
      if (error) throw error;
      if (!data?.track) throw new Error('لم نجد نتيجة لهذا البحث');
      setTrack(data.track);
      setPlaying(true);
      toast({ title: `▶︎ يشغّل: ${data.track.title || q}` });
    } catch (err: any) {
      toast({ title: err.message || 'تعذّر البحث عن الأغنية', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    if (!videoId) return;
    setPlaying((p) => !p);
  };

  const stop = () => {
    setTrack(null);
    setPlaying(false);
  };

  // YouTube iframe src — control play/pause by mounting/unmounting it
  const src = videoId && playing
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&playsinline=1`
    : '';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-primary border border-border rounded-full px-2.5 py-1"
        title="فتح مشغّل الموسيقى"
      >
        <Music className="w-3 h-3" /> الموسيقى
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-l from-card via-card to-primary/5 shadow-sm"
      dir="rtl"
    >
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--royal))] flex items-center justify-center shrink-0 shadow-md">
          <Music className="w-4 h-4 text-white" />
        </div>

        <form onSubmit={search} className="flex-1 flex items-center gap-2 min-w-0">
          <div className="relative flex-1">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن أغنية أو موسيقى خلفية..."
              className="pr-8 h-9 text-xs rounded-xl bg-background border-border"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={loading || !query.trim()}
            className="h-9 px-3 rounded-xl gap-1 text-xs font-bold shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            تشغيل
          </Button>
        </form>

        <AnimatePresence>
          {track && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="hidden md:flex items-center gap-2 min-w-0 max-w-[220px] border-r border-border pr-3"
            >
              {track.thumbnail && (
                <img src={track.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover" />
              )}
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-foreground truncate">{track.title}</div>
                {track.channel && (
                  <div className="text-[10px] text-muted-foreground truncate">{track.channel}</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {track && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={toggle}
              title={playing ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-destructive"
              onClick={stop}
              title="إيقاف"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground"
          onClick={() => setOpen(false)}
          title="إخفاء الشريط"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* playing indicator */}
      {playing && videoId && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 px-4 pb-1.5">
          <Volume2 className="w-3 h-3 text-primary animate-pulse" />
          <div className="flex items-end gap-0.5 h-2.5">
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                animate={{ height: ['30%', '100%', '50%', '90%', '30%'] }}
                transition={{ duration: 1 + i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                className="w-0.5 bg-primary rounded-full"
                style={{ height: '40%' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* hidden audio source */}
      {src && (
        <iframe
          ref={iframeRef}
          src={src}
          allow="autoplay; encrypted-media"
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          title="news-music"
        />
      )}
    </motion.div>
  );
}
