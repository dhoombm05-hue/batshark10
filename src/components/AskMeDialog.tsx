import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, BookOpen, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import logo from '@/assets/batshark-logo-new.png';

interface AskMeDialogProps {
  pageKey: string;
}

const PAGE_HELP: Record<string, { title: string; sections: { heading: string; content: string }[] }> = {
  dashboard: {
    title: 'لوحة التحكم الرئيسية',
    sections: [
      { heading: '📊 ما هي لوحة التحكم؟', content: 'لوحة التحكم تعرض ملخصاً شاملاً لأداء جميع المشاريع والمؤشرات المالية في مكان واحد. جميع الأرقام محسوبة من قاعدة البيانات مباشرة.' },
      { heading: '🔄 إعادة الاحتساب', content: 'اضغط زر إعادة الاحتساب (↻) لتحديث جميع الأرقام من البيانات الفعلية. القيم المعدلة يدوياً لن تتأثر.' },
      { heading: '📈 مؤشر الصحة', content: 'يتم حسابه من: صافي الربح (30%)، النمو (20%)، هامش الربح (25%)، وصحة المشاريع (25%). النتيجة من 100.' },
      { heading: '💡 مثال عملي', content: 'إذا كان لديك 3 مشاريع: 2 مربحة و1 خاسر، ستكون نسبة صحة المشاريع 67%. مع ربح إيجابي ونمو متوسط، قد يكون المؤشر حوالي 72/100.' },
    ],
  },
  project: {
    title: 'تفاصيل المشروع',
    sections: [
      { heading: '✏️ تعديل البيانات', content: 'مرر الماوس فوق أي رقم واضغط أيقونة القلم للتعديل. التعديلات اليدوية محمية من إعادة الاحتساب التلقائي.' },
      { heading: '🔒 التعديل اليدوي (Override)', content: 'عند تعديل الإيرادات أو الأرباح يدوياً، يظهر شارة "يدوي" 🔒. هذا يعني أن القيمة محمية ولن تتغير عند إعادة الاحتساب.' },
      { heading: '📊 الرسوم البيانية', content: 'الرسوم تعتمد على البيانات الشهرية الفعلية. يمكنك تعديل كل شهر على حدة من جدول البيانات الشهرية.' },
      { heading: '💡 مثال', content: 'لتعديل إيرادات البادل: مرر فوق الرقم → اضغط ✏️ → أدخل القيمة الجديدة → اضغط حفظ. القيمة ستبقى حتى بعد تسجيل الخروج.' },
    ],
  },
  lab: {
    title: 'BatShark Financial Lab',
    sections: [
      { heading: '🔬 محرك السيناريوهات', content: 'يمكنك محاكاة قرارات مالية مثل زيادة الإعلانات أو فتح فرع جديد ورؤية تأثيرها على الأرباح والسيولة والمخاطر فوراً.' },
      { heading: '📊 نظام الجداول', content: 'بيئة شبيهة بـ Excel لإنشاء جداول مخصصة. يمكنك إضافة أعمدة وصفوف وإدخال بيانات رقمية أو نصية.' },
      { heading: '📝 القيود المحاسبية', content: 'نظام قيد مزدوج: كل قيد يجب أن يكون متوازناً (مدين = دائن). القيود تؤثر على التقارير المالية تلقائياً.' },
      { heading: '💡 مثال سيناريو', content: 'اختر "سيناريو التوسع" → سيزيد الإعلانات 30% والأسعار 5% → شاهد كيف يتأثر الربح والمخاطرة. إذا كانت المخاطرة > 60%، فالقرار يحتاج مراجعة.' },
      { heading: '📐 الدوال المالية', content: 'ROI = العائد على الاستثمار، NPV = صافي القيمة الحالية، IRR = معدل العائد الداخلي، CAGR = النمو السنوي المركب.' },
    ],
  },
  tables: {
    title: 'نظام الجداول المخصصة',
    sections: [
      { heading: '📋 ما هو؟', content: 'نظام لإنشاء جداول بيانات مخصصة وحفظها في قاعدة البيانات. يمكنك إنشاء جداول مالية أو تشغيلية أو للعقود.' },
      { heading: '➕ إنشاء جدول', content: 'اضغط "جدول جديد" → اختر الاسم والنوع → حدد الأعمدة → ابدأ الإدخال. كل تغيير يُحفظ تلقائياً.' },
      { heading: '🔗 الربط بالمشاريع', content: 'يمكنك ربط أي جدول بمشروع محدد ليظهر في تقارير ذلك المشروع.' },
      { heading: '💡 مثال', content: 'أنشئ جدول "عقود البادل" بأعمدة: اسم العميل، المبلغ، تاريخ البدء، تاريخ الانتهاء. أي تعديل يُسجل في سجل النشاط تلقائياً.' },
    ],
  },
  forecasts: {
    title: 'التوقعات المالية',
    sections: [
      { heading: '📈 كيف تعمل؟', content: 'التوقعات مبنية على البيانات الشهرية التاريخية الفعلية. يتم حساب الاتجاه (Trend) وتطبيقه للأشهر القادمة.' },
      { heading: '⚙️ الخوارزمية', content: 'تستخدم المتوسط المتحرك والانحدار الخطي لتقدير الإيرادات والمصروفات المستقبلية بناءً على آخر 6-12 شهراً.' },
      { heading: '💡 مثال', content: 'إذا كانت إيرادات آخر 3 أشهر: 100K, 110K, 120K، فالتوقع للشهر القادم ≈ 130K (نمو 10K/شهر).' },
    ],
  },
  employees: {
    title: 'إدارة الموظفين',
    sections: [
      { heading: '👥 نظام التقييم', content: 'كل موظف له مؤشر أداء يُحسب من: جودة التعديلات، التأثير المالي، عدد العمليات، والالتزام بالميزانية.' },
      { heading: '📊 سجل النشاط', content: 'كل عملية يقوم بها الموظف تُسجل تلقائياً: تعديلات، إضافات، حذف، مشاهدة صفحات. لا يمكن تعطيل التسجيل.' },
      { heading: '💡 مثال', content: 'تدخل ملف "محمد" وتشوف: عدّل إيرادات البادل 5 مرات هذا الأسبوع، رفع 3 ملفات، مجموع تأثيره المالي: +45,000 ريال.' },
    ],
  },
  documents: {
    title: 'مركز الملفات',
    sections: [
      { heading: '📁 التنظيم', content: 'الملفات منظمة حسب البزنس (بادل / أومبركس / الشاشات) ثم حسب النوع (مالية / تشغيل / عقود).' },
      { heading: '📤 رفع ملف', content: 'اضغط "رفع ملف جديد" → اختر البزنس → اختر القسم → ارفق الملف مع عنوان ووصف.' },
      { heading: '💡 مثال', content: 'ارفع عقد جديد: اختر "البادل" → "عقود" → ارفق PDF → اكتب "عقد إيجار الملعب الثاني". سيظهر في ملفات البادل تلقائياً.' },
    ],
  },
  strategic: {
    title: 'التحليل الاستراتيجي',
    sections: [
      { heading: '📊 تحليل SWOT', content: 'نقاط القوة والضعف والفرص والتهديدات. كل عنصر قابل للتعديل والإضافة والحذف.' },
      { heading: '💰 التدفقات النقدية', content: 'يعرض حركة الأموال الداخلة والخارجة شهرياً مبنية على البيانات الفعلية.' },
      { heading: '💡 مثال', content: 'أضف نقطة قوة: "شراكة جديدة مع نادي رياضي" → ستظهر في تحليل SWOT وتؤثر على التقييم الاستراتيجي.' },
    ],
  },
};

export default function AskMeDialog({ pageKey }: AskMeDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'help' | 'ai'>('help');
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const help = PAGE_HELP[pageKey] || PAGE_HELP.dashboard;

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
              { role: 'user', content: `أنا في صفحة "${help.title}". سؤالي: ${question}` },
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
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary to-[hsl(190,80%,45%)] text-white shadow-lg hover:shadow-xl transition-all print:hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <img src={logo} alt="BatShark" className="w-6 h-6 object-contain" />
        <span className="font-heading font-bold text-sm">اسألني</span>
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
              className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col mx-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-l from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="BatShark" className="w-10 h-10 object-contain" />
                  <div>
                    <h2 className="font-heading font-bold text-foreground">مركز المساعدة — BatShark</h2>
                    <p className="text-xs text-muted-foreground">{help.title}</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setTab('help')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-heading transition-all ${tab === 'help' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground'}`}
                >
                  <BookOpen className="w-4 h-4" /> شرح الصفحة
                </button>
                <button
                  onClick={() => setTab('ai')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-heading transition-all ${tab === 'ai' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground'}`}
                >
                  <MessageCircle className="w-4 h-4" /> اسأل BatShark AI
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {tab === 'help' ? (
                  <div className="space-y-4">
                    {help.sections.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-muted/30 rounded-xl p-4 border border-border"
                      >
                        <h3 className="font-heading font-bold text-foreground text-sm mb-2">{s.heading}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiResponse && (
                      <div className="bg-muted/30 rounded-xl p-4 border border-border prose prose-sm max-w-none text-foreground">
                        <ReactMarkdown>{aiResponse}</ReactMarkdown>
                      </div>
                    )}
                    {!aiResponse && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">اكتب سؤالك وسيجيبك BatShark AI</p>
                        <p className="text-xs mt-1">يمكنك السؤال عن أي شيء متعلق بهذه الصفحة</p>
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
                      placeholder="اكتب سؤالك هنا..."
                      className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                      dir="rtl"
                    />
                    <button
                      onClick={askAI}
                      disabled={loading || !question.trim()}
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
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
