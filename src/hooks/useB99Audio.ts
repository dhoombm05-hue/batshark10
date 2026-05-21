import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================
// Native Browser TTS (ar-SA) — per project memory rule
// ============================================
export function useArabicTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis?.getVoices?.() || [];
      const score = (v: SpeechSynthesisVoice) => {
        const n = (v.name || '').toLowerCase(); let s = 0;
        if (/ar.SA/i.test(v.lang)) s += 50;
        else if (/^ar/i.test(v.lang)) s += 30;
        if (/google/.test(n)) s += 25;
        if (/microsoft/.test(n)) s += 20;
        if (/natural|neural|online|premium|enhanced/.test(n)) s += 30;
        if (/hamed|naayf|salim|hoda|zariyah/.test(n)) s += 15;
        return s;
      };
      const sorted = [...voices].sort((a, b) => score(b) - score(a));
      setVoice(sorted[0] || null);
    };
    pickVoice();
    window.speechSynthesis?.addEventListener?.('voiceschanged', pickVoice);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', pickVoice);
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    u.rate = 0.9;
    u.pitch = 1.05;
    u.volume = 1;
    if (voice) u.voice = voice;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [voice]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}

// ============================================
// Ambient Cinematic Music — generated with Web Audio API
// (no external file needed; soft drone pad in Cmaj)
// ============================================
export function useAmbientMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const [playing, setPlaying] = useState(false);

  const start = useCallback(async () => {
    if (playing) return;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    const ctx: AudioContext = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    // soft low-pass
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.Q.value = 0.6;
    lp.connect(master);

    // pad chord — Am9 feel: A2, E3, G3, B3, D4
    const freqs = [110, 164.81, 196, 246.94, 293.66];
    const oscs: OscillatorNode[] = [];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      // detune slightly for warmth
      osc.detune.value = (Math.random() - 0.5) * 8;
      g.gain.value = 0.12 / freqs.length;
      osc.connect(g).connect(lp);
      osc.start();
      oscs.push(osc);
    });
    oscsRef.current = oscs;

    // slow LFO on master for breathing
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();
    lfoRef.current = lfo;

    // fade in
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2);
    setPlaying(true);
  }, [playing]);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) { setPlaying(false); return; }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    setTimeout(() => {
      try {
        oscsRef.current.forEach(o => { try { o.stop(); o.disconnect(); } catch {} });
        lfoRef.current?.stop();
        lfoRef.current?.disconnect();
        master.disconnect();
      } catch {}
      oscsRef.current = [];
      lfoRef.current = null;
      masterRef.current = null;
      setPlaying(false);
    }, 1300);
  }, []);

  const toggle = useCallback(() => { playing ? stop() : start(); }, [playing, start, stop]);

  useEffect(() => () => { stop(); }, [stop]);

  return { playing, start, stop, toggle };
}
