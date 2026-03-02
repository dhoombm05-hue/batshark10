import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GUIDE_RESPONSES: Record<string, { answer: string; route?: string; highlight?: string }> = {
  'قيد': { answer: 'تعال معي نروح لمختبر النمذجة وتسجل القيد هناك!', route: '/lab', highlight: 'القيود' },
  'مشروع': { answer: 'خلنا نشوف المشاريع سوا!', route: '/projects' },
  'موظف': { answer: 'نروح لصفحة الموظفين ونشوف الأداء!', route: '/employees' },
  'تحليل': { answer: 'التحليل الاستراتيجي هنا، تعال!', route: '/strategic' },
  'توقع': { answer: 'صفحة التوقعات فيها كل اللي تحتاجه!', route: '/forecasts' },
  'ملف': { answer: 'مركز الملفات جاهز لك!', route: '/documents' },
  'نقاش': { answer: 'غرفة النقاشات تنتظرك!', route: '/chat' },
  'ذكاء': { answer: 'اسأل BatShark AI أي سؤال تبيه!', route: '/ai' },
};

export default function BatSharkRobot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<{ answer: string; route?: string } | null>(null);
  const navigate = useNavigate();

  const handleAsk = useCallback(() => {
    if (!question.trim()) return;
    const q = question.toLowerCase();
    const match = Object.entries(GUIDE_RESPONSES).find(([key]) => q.includes(key));
    if (match) {
      setResponse(match[1]);
    } else {
      setResponse({ answer: 'أقدر أساعدك بالتنقل! اسألني عن: مشروع، موظف، قيد، تحليل، توقع، ملف، نقاش، أو ذكاء اصطناعي.', route: undefined });
    }
    setQuestion('');
  }, [question]);

  const handleNavigate = useCallback(() => {
    if (response?.route) {
      navigate(response.route);
      setResponse(null);
      setOpen(false);
    }
  }, [response, navigate]);

  return (
    <>
      {/* Floating Robot Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)] text-white shadow-elevated flex items-center justify-center hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>

      {/* Robot Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-6 z-50 w-80 bg-card border border-border rounded-2xl shadow-elevated overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center gap-2" style={{ background: 'var(--gradient-ai)' }}>
              <Bot className="w-5 h-5 text-white" />
              <span className="font-heading font-bold text-sm text-white">مساعد BatShark</span>
              <Sparkles className="w-3.5 h-3.5 text-white/60 mr-auto" />
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {response ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-sm text-foreground leading-relaxed">{response.answer}</p>
                  </div>
                  {response.route && (
                    <button
                      onClick={handleNavigate}
                      className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg py-2.5 text-sm font-medium transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      خذني هناك
                    </button>
                  )}
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
                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-1.5">
                    {['قيد محاسبي', 'مشروع', 'موظف', 'تحليل', 'نقاش'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setQuestion(q); }}
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
