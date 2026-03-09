import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { X, Sparkles, ArrowLeft, Volume2, Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import assistantLogo from '@/assets/batshark-assistant.png';

const GUIDE_RESPONSES: Record<string, { answer: string; route?: string }> = {
  'قيد': { answer: 'القيود المحاسبية موجودة في مختبر النمذجة! تعال أوريك.', route: '/lab' },
  'مشروع': { answer: 'خلنا نشوف المشاريع والأرقام الحقيقية.', route: '/projects' },
  'موظف': { answer: 'صفحة الموظفين فيها كل التفاصيل والأداء.', route: '/employees' },
  'تحليل': { answer: 'التحليل الاستراتيجي جاهز لك!', route: '/strategic' },
  'توقع': { answer: 'التوقعات المالية المبنية على بياناتك الفعلية.', route: '/forecasts' },
  'ملف': { answer: 'مركز الملفات ينتظرك!', route: '/documents' },
  'نقاش': { answer: 'غرفة النقاشات الذكية جاهزة.', route: '/chat' },
  'ذكاء': { answer: 'اسأل BatShark AI أي سؤال اقتصادي!', route: '/ai' },
  'جدول': { answer: 'الجداول المخصصة — أقوى من Excel!', route: '/tables' },
  'لوحة': { answer: 'لوحة التحكم الرئيسية فيها كل المؤشرات.', route: '/' },
};

function stripMarkdown(md: string): string {
  return md.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: 'hsl(190, 80%, 50%)' }}
          animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function FlyingBatIcon({ size = 64, isActive = false }: { size?: number; isActive?: boolean }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-[-8px] rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(190 80% 50% / 0.15), transparent 70%)' }}
        animate={isActive ? { scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] } : { scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ repeat: Infinity, duration: isActive ? 1.5 : 3 }}
      />
      <motion.img
        src={assistantLogo}
        alt="BatShark AI"
        className="w-full h-full object-contain relative z-10"
        style={{ filter: 'drop-shadow(0 6px 16px hsl(210 80% 30% / 0.35))' }}
        animate={isActive ? {
          scaleX: [1, 0.88, 1, 0.9, 1],
          scaleY: [1, 1.06, 0.96, 1.03, 1],
          rotate: [0, -3, 3, -2, 0],
        } : {
          scaleX: [1, 0.94, 1],
          scaleY: [1, 1.03, 1],
          rotate: [0, -1.5, 1.5, 0],
        }}
        transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.8, ease: 'easeInOut' }}
      />
    </div>
  );
}

function getRandomWaypoint() {
  const padding = 80;
  const w = typeof window !== 'undefined' ? window.innerWidth : 800;
  const h = typeof window !== 'undefined' ? window.innerHeight : 600;
  return {
    x: padding + Math.random() * (w - padding * 2),
    y: padding + Math.random() * (h - padding * 2),
  };
}

export default function BatSharkRobot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<{ answer: string; route?: string } | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Only fly on dashboard (root path)
  const isDashboard = location.pathname === '/';

  const posX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
  const posY = useMotionValue(80);
  const springX = useSpring(posX, { stiffness: 18, damping: 12, mass: 1.5 });
  const springY = useSpring(posY, { stiffness: 18, damping: 12, mass: 1.5 });
  const [facingLeft, setFacingLeft] = useState(false);
  const waypointTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Free-fly only on dashboard
  useEffect(() => {
    if (open || !isDashboard) {
      // Reset to center-top when not on dashboard
      if (!isDashboard) {
        posX.set(typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
        posY.set(40);
        setFacingLeft(false);
      }
      return;
    }

    const fly = () => {
      const wp = getRandomWaypoint();
      setFacingLeft(wp.x < posX.get());
      posX.set(wp.x);
      posY.set(wp.y);
      waypointTimer.current = setTimeout(fly, 3000 + Math.random() * 3000);
    };

    waypointTimer.current = setTimeout(fly, 1500);
    return () => { if (waypointTimer.current) clearTimeout(waypointTimer.current); };
  }, [open, posX, posY]);

  useEffect(() => {
    if (open) {
      posX.set(typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
      posY.set(60);
    }
  }, [open, posX, posY]);

  const handleAsk = useCallback(() => {
    if (!question.trim()) return;
    setIsThinking(true);
    const q = question.toLowerCase();
    setQuestion('');
    setTimeout(() => {
      const match = Object.entries(GUIDE_RESPONSES).find(([key]) => q.includes(key));
      setResponse(match ? match[1] : { answer: 'أقدر أساعدك بالتنقل! اسألني عن: مشروع، موظف، قيد، تحليل، توقع، ملف، نقاش، جدول، أو ذكاء اصطناعي.' });
      setIsThinking(false);
    }, 600);
  }, [question]);

  const handleNavigate = useCallback(() => {
    if (response?.route) { navigate(response.route); setResponse(null); setOpen(false); }
  }, [response, navigate]);

  const speakAnswer = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(stripMarkdown(text));
    u.lang = 'ar-SA'; u.rate = 0.95; u.pitch = 0.9;
    const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('ar'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }, []);

  return (
    <>
      {/* ═══════ BAT: flies on dashboard, fixed top-center elsewhere ═══════ */}
      <motion.div
        className="fixed z-50 print:hidden"
        style={isDashboard ? { left: springX, top: springY, x: '-50%', y: '-50%', pointerEvents: 'none' } : { left: '50%', top: '16px', x: '-50%', y: '0%', pointerEvents: 'none' }}
      >
        <motion.button
          onClick={() => setOpen(!open)}
          className="relative flex items-center justify-center cursor-pointer border-0 bg-transparent p-0"
          style={{ pointerEvents: 'auto', scaleX: facingLeft && !open && isDashboard ? -1 : 1 }}
          whileTap={{ scale: 0.88 }}
          animate={!isDashboard && !open ? { y: [0, -8, 0] } : undefined}
          transition={!isDashboard ? { repeat: Infinity, duration: 3, ease: 'easeInOut' } : undefined}
        >
          <motion.span
            className="absolute bottom-[-12px] w-8 h-2 rounded-full bg-foreground/6 blur-md"
            animate={{ scaleX: [1, 0.6, 1], opacity: [0.2, 0.08, 0.2] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          />
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                className="w-12 h-12 rounded-2xl bg-card border border-border/60 shadow-xl flex items-center justify-center backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-primary" />
              </motion.div>
            ) : (
              <motion.div key="bat" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                <FlyingBatIcon size={58} isActive={true} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* ═══════ CHAT PANEL ═══════ */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.92 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[340px] sm:w-[380px] rounded-3xl overflow-hidden print:hidden"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border) / 0.5)',
              boxShadow: '0 24px 64px -16px rgba(0,0,0,0.25), 0 0 0 1px hsl(var(--border) / 0.1)'
            }}
          >
            <div className="p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(210 25% 12%), hsl(200 30% 14%))' }}>
              <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 4, ease: 'linear' }} />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(190 80% 42%), hsl(210 80% 48%))' }}>
                  <img src={assistantLogo} alt="" className="w-7 h-7 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-heading font-black text-[14px] text-white block">مساعد BatShark</span>
                  <span className="text-[10px] text-white/40">دليلك الذكي في النظام</span>
                </div>
                <Sparkles className="w-4 h-4 text-white/30" />
              </div>
            </div>

            <div className="p-5 space-y-4">
              {isThinking ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-6">
                  <FlyingBatIcon size={56} isActive={true} />
                  <TypingDots />
                  <span className="text-[10px] text-muted-foreground/60 mt-1 font-bold">يفكر...</span>
                </motion.div>
              ) : response ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="bg-muted/30 rounded-2xl p-4 border border-border/30">
                    <p className="text-[13px] text-foreground leading-relaxed">{response.answer}</p>
                  </div>
                  <div className="flex gap-2">
                    {response.route && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNavigate}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl py-3 text-[12px] font-heading font-black transition-all border border-primary/10">
                        <ArrowLeft className="w-4 h-4" /> خذني هناك
                      </motion.button>
                    )}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => speakAnswer(response.answer)}
                      className="h-11 w-11 rounded-xl bg-accent/8 hover:bg-accent/15 flex items-center justify-center text-accent transition-all border border-accent/10">
                      <Volume2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <button onClick={() => setResponse(null)} className="w-full text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors py-1 font-bold">اسأل سؤال آخر</button>
                </motion.div>
              ) : (
                <>
                  <p className="text-[11px] text-muted-foreground/60 font-bold">وين تبي تروح؟ اسألني وأوريك الطريق! 🚀</p>
                  <div className="flex gap-2">
                    <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAsk()} placeholder="مثال: كيف أسوي قيد؟"
                      className="flex-1 text-[12px] bg-muted/20 border border-border/40 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" />
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAsk}
                      className="bg-primary text-primary-foreground rounded-xl px-4 py-3 text-[11px] font-heading font-black transition-all shadow-md"
                      style={{ boxShadow: '0 4px 12px -4px hsl(var(--primary) / 0.4)' }}>
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['قيد محاسبي', 'مشروع', 'موظف', 'تحليل', 'نقاش', 'جدول'].map(q => (
                      <motion.button key={q} whileHover={{ y: -1, scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setQuestion(q)}
                        className="text-[10px] px-3 py-1.5 rounded-lg bg-muted/20 text-muted-foreground/60 hover:bg-primary/8 hover:text-primary transition-all border border-border/30 hover:border-primary/20 font-bold">
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}