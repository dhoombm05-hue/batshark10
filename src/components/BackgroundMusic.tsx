import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const DEFAULT_TRACK = '/bg-music.mp3';

interface ControlRow {
  is_playing: boolean;
  track_url: string | null;
  track_title: string | null;
  updated_at: string;
}

/**
 * Centralized background music.
 *  - Only the CEO can toggle play/pause (writes to `music_control` singleton row).
 *  - All signed-in users sync via realtime; when CEO presses play, everyone hears it.
 *  - Plays continuously (loop) — no time limit. Local mute is per-user.
 */
export default function BackgroundMusic() {
  const { isCEO, user } = useAuthContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<ControlRow | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try { return localStorage.getItem('bs_music_muted') === '1'; } catch { return false; }
  });
  const [unlocked, setUnlocked] = useState(false);

  // Fetch initial + subscribe to realtime changes
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    supabase
      .from('music_control')
      .select('is_playing, track_url, track_title, updated_at')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => { if (mounted && data) setState(data as ControlRow); });

    const ch = supabase
      .channel('music-control')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'music_control', filter: 'id=eq.1' },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (row) setState({
            is_playing: !!row.is_playing,
            track_url: row.track_url ?? null,
            track_title: row.track_title ?? null,
            updated_at: row.updated_at,
          });
        }
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user?.id]);

  // Unlock browser autoplay on first user interaction (silently)
  useEffect(() => {
    if (unlocked) return;
    const unlock = () => {
      setUnlocked(true);
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('touchstart', unlock);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, [unlocked]);

  // Drive the audio element from state
  useEffect(() => {
    const src = state?.track_url || DEFAULT_TRACK;
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.25;
      audioRef.current = audio;
    }
    if (audio.src.split('/').pop() !== src.split('/').pop()) {
      audio.src = src;
    }
    audio.muted = muted;

    if (state?.is_playing) {
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => { /* autoplay blocked — will retry after user interaction */ });
      }
    } else {
      audio.pause();
    }
    return () => { /* keep element alive across renders */ };
  }, [state?.is_playing, state?.track_url, muted, unlocked]);

  // Persist mute pref
  useEffect(() => {
    try { localStorage.setItem('bs_music_muted', muted ? '1' : '0'); } catch {}
  }, [muted]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  const ceoToggle = useCallback(async () => {
    if (!isCEO) return;
    const next = !state?.is_playing;
    const { error } = await supabase
      .from('music_control')
      .update({
        is_playing: next,
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', 1);
    if (error) {
      toast({ title: 'تعذّر تحديث الموسيقى', description: error.message, variant: 'destructive' });
      return;
    }
    setState((s) => ({
      is_playing: next,
      track_url: s?.track_url ?? null,
      track_title: s?.track_title ?? null,
      updated_at: new Date().toISOString(),
    }));
    toast({
      title: next ? '▶︎ تم تشغيل الموسيقى لكل الموظفين' : '⏸ تم إيقاف الموسيقى',
    });
  }, [isCEO, state?.is_playing, user?.id]);

  const playing = !!state?.is_playing;

  return (
    <div className="flex items-center gap-1">
      {/* CEO sees a true play/pause toggle; staff sees a live status indicator */}
      {isCEO ? (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={ceoToggle}
          className={`relative flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
            playing
              ? 'bg-primary/15 border-primary/40 text-primary'
              : 'bg-card/80 border-border text-muted-foreground hover:bg-secondary/60'
          }`}
          title={playing ? 'إيقاف الموسيقى للجميع' : 'تشغيل الموسيقى لجميع الموظفين'}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <AnimatePresence>
            {playing && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-full border-2 border-primary/40"
              />
            )}
          </AnimatePresence>
        </motion.button>
      ) : (
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full border ${
            playing ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card/60 border-border text-muted-foreground/60'
          }`}
          title={playing ? 'الموسيقى تعمل (يتحكم بها الرئيس)' : 'الموسيقى متوقفة'}
        >
          <Music className="w-3.5 h-3.5" />
          {playing && (
            <motion.span
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="absolute w-8 h-8 rounded-full border-2 border-primary/30 pointer-events-none"
            />
          )}
        </div>
      )}

      {/* Personal mute (any user) — only useful while music is on */}
      {playing && (
        <motion.button
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setMuted((m) => !m)}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-card/60 border border-border/50 hover:bg-secondary/40 transition-colors"
          title={muted ? 'إلغاء الكتم' : 'كتم الصوت لي فقط'}
        >
          {muted ? (
            <VolumeX className="w-3.5 h-3.5 text-destructive/70" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </motion.button>
      )}
    </div>
  );
}
