import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, VolumeX, Play, Pause, Music, Users, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const DEFAULT_TRACK = '/bg-music.mp3';

interface ControlRow {
  is_playing: boolean;
  track_url: string | null;
  track_title: string | null;
  target_all: boolean;
  target_user_ids: string[];
  updated_at: string;
}

interface ProfileLite {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
}

/**
 * Centralized background music.
 *  - Only the CEO can toggle play/pause and pick which employees hear it.
 *  - The audio plays only for users included in `target_user_ids` (or for everyone
 *    when `target_all` is true). The CEO always hears their own session.
 *  - Plays continuously (loop). Local mute is per-user.
 */
export default function BackgroundMusic() {
  const { isCEO, user } = useAuthContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<ControlRow | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try { return localStorage.getItem('bs_music_muted') === '1'; } catch { return false; }
  });
  const [unlocked, setUnlocked] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [people, setPeople] = useState<ProfileLite[]>([]);
  const [search, setSearch] = useState('');
  const [draftTargets, setDraftTargets] = useState<Set<string>>(new Set());
  const [draftAll, setDraftAll] = useState(false);

  // ----- Fetch initial + subscribe to realtime changes -----
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    supabase
      .from('music_control')
      .select('is_playing, track_url, track_title, target_all, target_user_ids, updated_at')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted || !data) return;
        const row = data as any;
        setState({
          is_playing: !!row.is_playing,
          track_url: row.track_url ?? null,
          track_title: row.track_title ?? null,
          target_all: !!row.target_all,
          target_user_ids: row.target_user_ids ?? [],
          updated_at: row.updated_at,
        });
      });

    const ch = supabase
      .channel('music-control')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'music_control', filter: 'id=eq.1' },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (!row) return;
          setState({
            is_playing: !!row.is_playing,
            track_url: row.track_url ?? null,
            track_title: row.track_title ?? null,
            target_all: !!row.target_all,
            target_user_ids: row.target_user_ids ?? [],
            updated_at: row.updated_at,
          });
        }
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user?.id]);

  // ----- Unlock browser autoplay on first user interaction -----
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

  // ----- Should THIS user hear the audio? -----
  const shouldHear = useMemo(() => {
    if (!state?.is_playing || !user?.id) return false;
    if (isCEO) return true;
    if (state.target_all) return true;
    return state.target_user_ids?.includes(user.id) ?? false;
  }, [state, user?.id, isCEO]);

  // ----- Drive the audio element from state -----
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

    if (shouldHear) {
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      audio.pause();
    }
  }, [shouldHear, state?.track_url, muted, unlocked]);

  // ----- Persist mute pref -----
  useEffect(() => {
    try { localStorage.setItem('bs_music_muted', muted ? '1' : '0'); } catch {}
  }, [muted]);

  // ----- Cleanup -----
  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  // ----- Load team list lazily when CEO opens picker -----
  useEffect(() => {
    if (!pickerOpen || people.length > 0) return;
    supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, job_title')
      .order('display_name', { ascending: true })
      .then(({ data }) => setPeople((data || []) as ProfileLite[]));
  }, [pickerOpen, people.length]);

  // ----- Seed picker draft from current state when opening -----
  useEffect(() => {
    if (!pickerOpen) return;
    setDraftAll(!!state?.target_all);
    setDraftTargets(new Set(state?.target_user_ids ?? []));
  }, [pickerOpen, state]);

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = people.filter((p) => p.user_id !== user?.id); // exclude self (CEO always hears)
    if (!q) return list;
    return list.filter((p) =>
      (p.display_name || '').toLowerCase().includes(q) ||
      (p.job_title || '').toLowerCase().includes(q)
    );
  }, [people, search, user?.id]);

  const toggleTarget = (id: string) => {
    setDraftTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const saveAndPlay = useCallback(async (playState?: boolean) => {
    if (!isCEO) return;
    const next = typeof playState === 'boolean' ? playState : true;
    const { error } = await supabase
      .from('music_control')
      .update({
        is_playing: next,
        target_all: draftAll,
        target_user_ids: draftAll ? [] : Array.from(draftTargets),
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', 1);
    if (error) {
      toast({ title: 'تعذّر تحديث الموسيقى', description: error.message, variant: 'destructive' });
      return;
    }
    setPickerOpen(false);
    const count = draftAll ? 'كل الموظفين' : `${draftTargets.size} موظف`;
    toast({
      title: next ? `▶︎ تم تشغيل الموسيقى لـ ${count}` : '⏸ تم إيقاف الموسيقى',
    });
  }, [isCEO, draftAll, draftTargets, user?.id]);

  const ceoStop = useCallback(async () => {
    if (!isCEO) return;
    const { error } = await supabase
      .from('music_control')
      .update({
        is_playing: false,
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', 1);
    if (error) {
      toast({ title: 'تعذّر الإيقاف', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '⏸ تم إيقاف الموسيقى' });
  }, [isCEO, user?.id]);

  const playing = !!state?.is_playing;
  const audienceLabel = state?.target_all
    ? 'الكل'
    : `${state?.target_user_ids?.length ?? 0} مستمع`;

  return (
    <div className="flex items-center gap-1">
      {isCEO ? (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => (playing ? ceoStop() : setPickerOpen(true))}
          className={`relative flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
            playing
              ? 'bg-primary/15 border-primary/40 text-primary'
              : 'bg-card/80 border-border text-muted-foreground hover:bg-secondary/60'
          }`}
          title={playing ? `إيقاف (يستمع: ${audienceLabel})` : 'تشغيل الموسيقى — اختر المستمعين'}
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
          className={`relative flex items-center justify-center w-8 h-8 rounded-full border ${
            shouldHear
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-card/60 border-border text-muted-foreground/60'
          }`}
          title={shouldHear ? 'الموسيقى مفعلة لك (يتحكم بها الرئيس)' : 'الموسيقى متوقفة'}
        >
          <Music className="w-3.5 h-3.5" />
          {shouldHear && (
            <motion.span
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="absolute inset-0 rounded-full border-2 border-primary/30 pointer-events-none"
            />
          )}
        </div>
      )}

      {/* CEO quick-edit audience even while playing */}
      {isCEO && playing && (
        <motion.button
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setPickerOpen(true)}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-card/60 border border-border/50 hover:bg-secondary/40 transition-colors text-primary"
          title={`تعديل المستمعين (${audienceLabel})`}
        >
          <Users className="w-3.5 h-3.5" />
        </motion.button>
      )}

      {/* Personal mute */}
      {shouldHear && (
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

      {/* CEO audience picker dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent dir="rtl" className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="font-heading font-black text-base flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              اختر من يستمع للموسيقى
            </DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground">
              أنت تسمع الموسيقى دائماً. اختر بقية المستمعين أو فعّل "الجميع".
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 pt-3 pb-2 space-y-2">
            <button
              type="button"
              onClick={() => setDraftAll((v) => !v)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
                draftAll
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-card border-border text-foreground hover:bg-secondary/40'
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-bold">
                <Users className="w-4 h-4" />
                تشغيل لجميع الموظفين
              </span>
              {draftAll && <Check className="w-4 h-4" />}
            </button>

            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن موظف..."
                className="pr-8 h-9 text-xs"
                disabled={draftAll}
              />
            </div>
          </div>

          <div className={`max-h-[42vh] overflow-y-auto px-3 pb-3 ${draftAll ? 'opacity-40 pointer-events-none' : ''}`}>
            {filteredPeople.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">لا يوجد موظفون مطابقون</div>
            ) : (
              <ul className="space-y-1">
                {filteredPeople.map((p) => {
                  const checked = draftTargets.has(p.user_id);
                  return (
                    <li key={p.user_id}>
                      <button
                        type="button"
                        onClick={() => toggleTarget(p.user_id)}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg border transition-colors text-right ${
                          checked
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-transparent border-transparent hover:bg-secondary/40'
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          {p.avatar_url ? (
                            <AvatarImage src={p.avatar_url} alt={p.display_name || ''} />
                          ) : (
                            <AvatarFallback className="text-[10px]">
                              {(p.display_name || '?').slice(0, 1)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{p.display_name || 'مستخدم'}</div>
                          {p.job_title && (
                            <div className="text-[10px] text-muted-foreground truncate">{p.job_title}</div>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 bg-muted/30">
            <span className="text-[11px] text-muted-foreground">
              {draftAll
                ? 'سيستمع: الجميع'
                : `سيستمع: ${draftTargets.size} موظف${draftTargets.size === 1 ? '' : ''}`}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPickerOpen(false)} className="h-8 text-xs">
                <X className="w-3.5 h-3.5 ml-1" /> إلغاء
              </Button>
              <Button
                size="sm"
                onClick={() => saveAndPlay(true)}
                disabled={!draftAll && draftTargets.size === 0}
                className="h-8 text-xs gap-1 font-bold"
              >
                <Play className="w-3.5 h-3.5" />
                تشغيل
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
