import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowLeft, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function BatSharkRobot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<{ answer: string; route?: string } | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleAsk = useCallback(() => {
    if (!question.trim()) return;
    setIsThinking(true);
    const q = question.toLowerCase();
    setQuestion('');
    setTimeout(() => {
      const match = Object.entries(GUIDE_RESPONSES).find(([key]) => q.includes(key));
      if (match) {
        setResponse(match[1]);
      } else {
        setResponse({ answer: 'أقدر أساعدك بالتنقل! اسألني عن: مشروع، موظف، قيد، تحليل، توقع، ملف، نقاش، جدول، أو ذكاء اصطناعي.' });
      }
      setIsThinking(false);
    }, 600);
  }, [question]);

  const handleNavigate = useCallback(() => {
    if (response?.route) {
      navigate(response.route);
      setResponse(null);
      setOpen(false);
    }
  }, [response, navigate]);

  const speakAnswer = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arVoice) utterance.voice = arVoice;
    window.speechSynthesis.speak(utterance);
  }, []);

  return (
    <>
      {/* Floating Bat - Top Center, flying freely */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
        <motion.button
          onClick={() => setOpen(!open)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative flex items-center justify-center cursor-pointer border-0 bg-transparent p-0"
          whileHover={{ scale: 1.25 }}
          whileTap={{ scale: 0.85 }}
          animate={
            open
              ? { y: 0, rotate: 0, scale: 1 }
              : {
                  y: [0, -14, 0, -8, 0, -5, 0],
                  rotate: [0, -3, 3, -2, 2, 0],
                  scale: [1, 1.08, 0.97, 1.05, 1],
                }
          }
          transition={{
            y: { repeat: open ? 0 : Infinity, duration: 5, ease: 'easeInOut' },
            rotate: { repeat: open ? 0 : Infinity, duration: 5, ease: 'easeInOut' },
            scale: { repeat: open ? 0 : Infinity, duration: 5, ease: 'easeInOut' },
          }}
        >
          {/* Subtle shadow beneath the bat */}
          <motion.span
            className="absolute bottom-[-8px] w-10 h-3 rounded-full bg-foreground/10 blur-md"
            animate={{ scaleX: [1, 0.7, 1], opacity: [0.3, 0.15, 0.3] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          />

          <AnimatePresence mode="wait">
            {open ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.25 }}
                className="w-12 h-12 rounded-full bg-card border border-border shadow-elevated flex items-center justify-center"
              >
                <X className="w-5 h-5 text-primary" />
              </motion.div>
            ) : (
              <motion.img
                key="bat"
                src={assistantLogo}
                alt="BatShark AI"
                className="w-16 h-16 object-contain drop-shadow-lg"
                style={{ filter: 'drop-shadow(0 4px 12px hsl(210 80% 40% / 0.3))' }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            )}
          </AnimatePresence>

          {/* Thinking dots */}
          <AnimatePresence>
            {isThinking && !open && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -bottom-3 flex gap-0.5"
              >
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Hover tooltip */}
        <AnimatePresence>
          {isHovered && !open && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.9 }}
              className="mt-1 bg-card border border-border rounded-xl px-3 py-1.5 shadow-elevated text-xs font-medium text-foreground whitespace-nowrap"
            >
              💬 اسأل BatShark AI
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-24 left-6 z-50 w-80 bg-card border border-border rounded-2xl shadow-elevated overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center gap-2 relative overflow-hidden" style={{ background: 'var(--gradient-ai)' }}>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              />
              <img src={assistantLogo} alt="BatShark" className="w-7 h-7 object-contain relative z-10 rounded-full bg-white/20 p-0.5" />
              <span className="font-heading font-bold text-sm text-white relative z-10">مساعد BatShark</span>
              <Sparkles className="w-3.5 h-3.5 text-white/60 mr-auto relative z-10" />
            </div>

            <div className="p-4 space-y-3">
              {isThinking ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-4">
                  <motion.div
                    className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 overflow-hidden"
                    animate={{ boxShadow: ['0 0 0px hsl(190 80% 50% / 0)', '0 0 20px hsl(190 80% 50% / 0.3)', '0 0 0px hsl(190 80% 50% / 0)'] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <motion.img
                      src={assistantLogo}
                      alt="thinking"
                      className="w-9 h-9 object-contain"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                  </motion.div>
                  <TypingDots />
                  <span className="text-[10px] text-muted-foreground mt-1">يفكر...</span>
                </motion.div>
              ) : response ? (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-sm text-foreground leading-relaxed">{response.answer}</p>
                  </div>
                  <div className="flex gap-2">
                    {response.route && (
                      <button
                        onClick={handleNavigate}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg py-2.5 text-sm font-medium transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" /> خذني هناك
                      </button>
                    )}
                    <button
                      onClick={() => speakAnswer(response.answer)}
                      className="h-10 w-10 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center text-accent transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setResponse(null)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    اسأل سؤال آخر
                  </button>
                </motion.div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">وين تبي تروح؟ اسألني وأوريك الطريق! 🚀</p>
                  <div className="flex gap-2">
                    <input
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAsk()}
                      placeholder="مثال: كيف أسوي قيد؟"
                      className="flex-1 text-xs bg-secondary/30 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                      onClick={handleAsk}
                      className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      اسأل
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['قيد محاسبي', 'مشروع', 'موظف', 'تحليل', 'نقاش', 'جدول'].map(q => (
                      <button
                        key={q}
                        onClick={() => setQuestion(q)}
                        className="text-[10px] px-2 py-1 rounded-md bg-secondary/40 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                      >
                        {q}
                      </button>
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
