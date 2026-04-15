import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MUSIC_SRC = '/bg-music.mp3';
const DURATION_MS = 120_000;

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    clearTimeout(timerRef.current);
  }, []);

  const play = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.loop = true;
    a.volume = 0.25;
    a.play().then(() => {
      setPlaying(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(stop, DURATION_MS);
    }).catch(() => {});
  }, [stop]);

  // Auto-play on mount
  useEffect(() => {
    const a = new Audio(MUSIC_SRC);
    a.preload = 'auto';
    audioRef.current = a;

    // Try autoplay
    const tryPlay = () => {
      if (started) return;
      setStarted(true);
      play();
    };

    // Browsers may block autoplay; try immediately then on first interaction
    a.addEventListener('canplaythrough', tryPlay, { once: true });
    const fallback = () => { tryPlay(); document.removeEventListener('click', fallback); };
    document.addEventListener('click', fallback, { once: true });

    return () => {
      stop();
      a.pause();
      a.src = '';
      document.removeEventListener('click', fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    if (playing) {
      stop();
    } else {
      play();
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggle}
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-card/80 border border-border hover:bg-secondary/60 transition-colors"
        title={playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
      >
        {playing ? (
          <Volume2 className="w-4 h-4 text-primary" />
        ) : (
          <VolumeX className="w-4 h-4 text-muted-foreground" />
        )}
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

      {playing && (
        <motion.button
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-card/60 border border-border/50 hover:bg-secondary/40 transition-colors"
          title={muted ? 'إلغاء الكتم' : 'كتم الصوت'}
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
