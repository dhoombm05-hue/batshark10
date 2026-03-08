import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import logo from '@/assets/batshark-logo-new.png';

interface EmployeeGuideProps {
  /** Optional: restrict to specific context */
  context?: string;
}

const GUIDE_SECTIONS = [
  {
    title: '🏠 لوحة التحكم الرئيسية',
    description: 'تعرض ملخص الشركة المالي والمشاريع والموظفين',
    tips: [
      'جميع الأرقام محسوبة تلقائياً من قاعدة البيانات',
      'اضغط ↻ لإعادة احتساب كل الأرقام',
      'مؤشر الصحة يتراوح من 0 إلى 100',
    ],
  },
  {
    title: '📊 اللوحة التنفيذية',
    description: 'نظرة شاملة على KPIs الشركة والرسوم البيانية',
    tips: [
      'الإيرادات والمصروفات تُحدث تلقائياً',
      'اضغط على أي كارت إحصائي للتنقل للصفحة المعنية',
      'مؤشر الصحة يحسب من: الربح + النمو + الهامش + المهام',
    ],
  },
  {
    title: '📁 المشاريع',
    description: 'إدارة ومتابعة أداء كل مشروع على حدة',
    tips: [
      'مرّر فوق أي رقم واضغط ✏️ للتعديل',
      'التعديلات اليدوية محمية بعلامة 🔒',
      'البيانات الشهرية تؤثر على الرسوم البيانية',
    ],
  },
  {
    title: '👥 الموظفين',
    description: 'تقييمات الأداء والإحصائيات لكل موظف',
    tips: [
      'كل نشاط يُسجل تلقائياً في سجل النشاط',
      'التقييم الشهري يؤثر على مؤشر الأداء',
      'يمكن ربط الموظف بمشاريع معينة',
    ],
  },
  {
    title: '📝 إدارة المهام',
    description: 'لوحة Kanban لمتابعة المهام وتوزيعها',
    tips: [
      'اسحب المهمة بين الأعمدة لتغيير حالتها',
      'يمكن تعيين مهمة لموظف ومشروع معين',
      'الأولويات: عاجل (أحمر)، عالي (برتقالي)، متوسط (أزرق)، منخفض (رمادي)',
    ],
  },
  {
    title: '🤖 BatShark AI',
    description: 'المستشار الذكي يجيب عن أي سؤال مالي',
    tips: [
      'اسأل عن أرباح أي مشروع بالاسم',
      'اطلب إنشاء قيد محاسبي وسيساعدك',
      'اطلب "مراجعة شاملة" لفحص كل البيانات',
    ],
  },
  {
    title: '📈 التقارير',
    description: 'إنشاء تقارير مالية وتصديرها Excel أو طباعة',
    tips: [
      'اختر نوع التقرير ثم حدد الفترة',
      'اضغط "تحميل" لتصدير Excel',
      'اضغط "طباعة" لطباعة التقرير مباشرة',
    ],
  },
  {
    title: '⚡ التنبيهات الذكية',
    description: 'مراقبة تلقائية للمخاطر المالية',
    tips: [
      'عدّل حدود التنبيه من الإعدادات',
      'تحليل "ماذا لو" يساعد في اتخاذ القرارات',
      'التنبيهات الحرجة تظهر باللون الأحمر',
    ],
  },
];

export default function EmployeeGuide({ context }: EmployeeGuideProps) {
  const [open, setOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [tab, setTab] = useState<'guide' | 'ai'>('guide');
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setAiResponse('');

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batshark-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: `أنا موظف جديد وأحتاج مساعدة في فهم النظام. سؤالي: ${question}` },
            ],
          }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error('Failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAiResponse(fullText);
            }
          } catch {}
        }
      }
    } catch {
      setAiResponse('حدث خطأ. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Guide Button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-section-ai to-primary text-white shadow-lg hover:shadow-xl transition-all print:hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ bottom: '24px', right: '24px' }}
      >
        <img src={logo} alt="BatShark" className="w-6 h-6 object-contain" />
        <span className="font-heading font-bold text-sm">دليل الموظف</span>
      </motion.button>

      {/* Dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col mx-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-l from-section-ai/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-section-ai/10">
                    <GraduationCap className="w-5 h-5 text-section-ai" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-foreground">📖 دليل الموظف التفاعلي</h2>
                    <p className="text-xs text-muted-foreground">تعلّم كيف تستخدم كل قسم في المنصة</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => { setTab('guide'); setSelectedSection(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-heading transition-all ${tab === 'guide' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground'}`}
                >
                  <BookOpen className="w-4 h-4" /> الدليل التعليمي
                </button>
                <button
                  onClick={() => setTab('ai')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-heading transition-all ${tab === 'ai' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground'}`}
                >
                  <Sparkles className="w-4 h-4" /> اسأل الذكاء الاصطناعي
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {tab === 'guide' ? (
                  selectedSection !== null ? (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <button onClick={() => setSelectedSection(null)} className="text-sm text-primary mb-4 flex items-center gap-1 hover:underline">
                        ← العودة للقائمة
                      </button>
                      <div className="space-y-4">
                        <h3 className="text-xl font-heading font-bold text-foreground">
                          {GUIDE_SECTIONS[selectedSection].title}
                        </h3>
                        <p className="text-muted-foreground">{GUIDE_SECTIONS[selectedSection].description}</p>
                        <div className="space-y-3">
                          <h4 className="font-heading font-bold text-sm text-foreground">💡 نصائح مهمة:</h4>
                          {GUIDE_SECTIONS[selectedSection].tips.map((tip, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                            >
                              <span className="text-primary font-bold text-sm mt-0.5">{i + 1}</span>
                              <p className="text-sm text-foreground">{tip}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-2">
                      {GUIDE_SECTIONS.map((section, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedSection(i)}
                          className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/20 border border-border hover:bg-muted/40 hover:border-primary/30 transition-all text-right"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-heading font-bold text-sm text-foreground">{section.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </motion.button>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {aiResponse && (
                      <div className="bg-muted/30 rounded-xl p-4 border border-border prose prose-sm max-w-none text-foreground">
                        <ReactMarkdown>{aiResponse}</ReactMarkdown>
                      </div>
                    )}
                    {!aiResponse && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">اسأل الذكاء الاصطناعي عن أي شيء!</p>
                        <p className="text-xs mt-1">مثال: "كيف أعدّل إيرادات مشروع؟" أو "ما هو ROI؟"</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                          {['كيف أضيف مهمة جديدة؟', 'ما هو مؤشر الصحة؟', 'كيف أصدر تقرير Excel؟'].map(q => (
                            <button 
                              key={q} 
                              onClick={() => { setQuestion(q); }}
                              className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {loading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="mr-2 text-sm text-muted-foreground">جارٍ التحليل...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Input */}
              {tab === 'ai' && (
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && askAI()}
                      placeholder="اكتب سؤالك هنا... مثال: كيف أستخدم لوحة التحكم؟"
                      className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                      dir="rtl"
                    />
                    <Button onClick={askAI} disabled={loading || !question.trim()} className="px-4">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}