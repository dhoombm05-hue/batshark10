import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Loader2, ChevronRight, Sparkles, 
  LayoutDashboard, FolderKanban, Users, ListTodo, 
  Brain, Bell, FileText, FlaskConical, TrendingUp,
  Volume2, BookOpen, MessageCircle, Zap, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import logo from '@/assets/batshark-logo-new.png';

// ============================================================================
// COMPREHENSIVE EMPLOYEE GUIDE DATA
// ============================================================================

interface GuideSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  titleEn: string;
  description: string;
  color: string;
  gradient: string;
  topics: {
    question: string;
    answer: string;
  }[];
  tips: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: 'لوحة التحكم الرئيسية',
    titleEn: 'Main Dashboard',
    description: 'نظرة شاملة على كل مؤشرات الشركة المالية والتشغيلية',
    color: 'hsl(var(--primary))',
    gradient: 'from-primary/20 to-primary/5',
    topics: [
      { question: 'ما هو مؤشر الصحة المالية؟', answer: 'مقياس من 0-100 يحسب تلقائياً من: صافي الربح (30%)، هامش الربح (25%)، معدل النمو (25%)، وإنجاز المهام (20%)' },
      { question: 'كيف تُحدث الأرقام؟', answer: 'جميع الأرقام تُحسب تلقائياً من قاعدة البيانات. اضغط زر ↻ لإعادة الحساب الفوري' },
      { question: 'ماذا تعني البطاقات الإحصائية؟', answer: 'كل بطاقة تعرض مؤشر رئيسي: الإيرادات، المصروفات، صافي الربح، وعدد المشاريع النشطة' },
    ],
    tips: [
      'اضغط على أي بطاقة للانتقال مباشرة للقسم المعني',
      'الأسهم الخضراء ↑ تعني نمو، والحمراء ↓ تعني انخفاض',
      'راقب مؤشر الصحة يومياً — إذا نزل تحت 50 انتبه!',
    ],
  },
  {
    id: 'executive',
    icon: <Target className="w-5 h-5" />,
    title: 'اللوحة التنفيذية',
    titleEn: 'Executive Dashboard',
    description: 'لوحة القرارات الاستراتيجية للإدارة العليا',
    color: 'hsl(var(--chart-1))',
    gradient: 'from-chart-1/20 to-chart-1/5',
    topics: [
      { question: 'ما الفرق بينها وبين لوحة التحكم؟', answer: 'اللوحة التنفيذية تركز على KPIs الاستراتيجية والرسوم البيانية، بينما لوحة التحكم للعمليات اليومية' },
      { question: 'ما هي دورة الأداء؟', answer: 'نظام تقييم يتتبع إنتاجية كل مستخدم من خلال: عدد الإنشاءات، التعديلات، والأثر المالي' },
      { question: 'كيف أقرأ الرسوم البيانية؟', answer: 'الخط الأزرق = الإيرادات، الخط الأحمر = المصروفات، المساحة الخضراء = الربح' },
    ],
    tips: [
      'استخدم فلتر الفترة لمقارنة الأداء الشهري',
      'تابع "الاتجاه" — خط صاعد أفضل من رقم كبير ثابت',
      'اللوحة مُحسّنة للعرض على شاشات كبيرة',
    ],
  },
  {
    id: 'projects',
    icon: <FolderKanban className="w-5 h-5" />,
    title: 'إدارة المشاريع',
    titleEn: 'Projects Management',
    description: 'تتبع أداء كل مشروع بالتفصيل المالي والتشغيلي',
    color: 'hsl(var(--chart-2))',
    gradient: 'from-chart-2/20 to-chart-2/5',
    topics: [
      { question: 'كيف أعدّل إيرادات مشروع؟', answer: 'مرّر الماوس فوق الرقم → ستظهر أيقونة ✏️ → اضغط للتعديل → اكتب الرقم الجديد → Enter للحفظ' },
      { question: 'ما هو التجاوز اليدوي (Override)؟', answer: 'أرقام معدّلة يدوياً تظهر بعلامة 🔒 ولا تتأثر بالحسابات التلقائية' },
      { question: 'كيف أضيف مصروف جديد؟', answer: 'من صفحة المشروع → قسم المصروفات → زر "إضافة مصروف" → حدد الفئة والمبلغ' },
    ],
    tips: [
      'البيانات الشهرية تُستخدم في الرسوم البيانية والتوقعات',
      'حالة المشروع: نشط (أخضر)، متوقف (أصفر)، منتهي (رمادي)',
      'صافي الربح = إجمالي الإيرادات - إجمالي المصروفات',
    ],
  },
  {
    id: 'employees',
    icon: <Users className="w-5 h-5" />,
    title: 'إدارة الموظفين',
    titleEn: 'Employees Management',
    description: 'ملفات الموظفين وتقييمات الأداء والإحصائيات',
    color: 'hsl(var(--chart-3))',
    gradient: 'from-chart-3/20 to-chart-3/5',
    topics: [
      { question: 'كيف يُحسب أداء الموظف؟', answer: 'متوسط مرجح من: تقييم المدير (30%)، تحقيق KPI (25%)، الالتزام بالميزانية (20%)، روح الفريق (15%)، المبادرة (10%)' },
      { question: 'ما هو سجل النشاط؟', answer: 'كل إجراء يقوم به الموظف في النظام يُسجل تلقائياً مع الوقت والتفاصيل' },
      { question: 'كيف أربط موظف بمشروع؟', answer: 'من ملف الموظف → قسم المشاريع → "إضافة مشروع" → اختر المشاريع المعنية' },
    ],
    tips: [
      'التقييم الشهري يؤثر على الرسم البياني السنوي',
      'الأداء فوق 80 = ممتاز، 60-80 = جيد، تحت 60 = يحتاج تحسين',
      'استخدم "ملاحظات المدير" لتوثيق الإنجازات',
    ],
  },
  {
    id: 'tasks',
    icon: <ListTodo className="w-5 h-5" />,
    title: 'إدارة المهام',
    titleEn: 'Task Management',
    description: 'لوحة Kanban احترافية لتنظيم وتوزيع المهام',
    color: 'hsl(var(--chart-4))',
    gradient: 'from-chart-4/20 to-chart-4/5',
    topics: [
      { question: 'كيف أغير حالة مهمة؟', answer: 'اسحب (Drag) المهمة من عمود لآخر: قيد الانتظار → جاري العمل → منتهية' },
      { question: 'ما هي الأولويات؟', answer: 'عاجل (أحمر) → عالي (برتقالي) → متوسط (أزرق) → منخفض (رمادي)' },
      { question: 'كيف أعيّن مهمة لموظف؟', answer: 'افتح المهمة → حقل "المسؤول" → اختر الموظف من القائمة' },
    ],
    tips: [
      'اربط المهمة بمشروع لتظهر في تقارير المشروع',
      'تاريخ الاستحقاق المتجاوز يظهر باللون الأحمر',
      'المهام المنتهية تؤثر إيجابياً على مؤشر الصحة',
    ],
  },
  {
    id: 'ai',
    icon: <Brain className="w-5 h-5" />,
    title: 'BatShark AI',
    titleEn: 'AI Assistant',
    description: 'المستشار الاقتصادي الذكي للتحليل والدعم الفوري',
    color: 'hsl(var(--section-ai))',
    gradient: 'from-section-ai/20 to-section-ai/5',
    topics: [
      { question: 'ماذا يمكن أن أسأل؟', answer: 'أي سؤال اقتصادي أو تشغيلي: تحليل أرباح، مقارنة مشاريع، شرح مصطلحات، اقتراحات تحسين' },
      { question: 'هل يفهم بياناتي الفعلية؟', answer: 'نعم! الذكاء متصل بقاعدة بياناتك ويحلل أرقامك الحقيقية' },
      { question: 'ما هو وضع المراجعة الشاملة؟', answer: 'اكتب "مراجعة شاملة" ليفحص كل بياناتك ويكتشف الأخطاء والفرص' },
    ],
    tips: [
      'اطلب "أنشئ قيد محاسبي" وسيساعدك خطوة بخطوة',
      'استخدم الصوت للسؤال والاستماع للإجابة',
      'الذكاء يتعلم من محادثاتك ويتحسن مع الوقت',
    ],
  },
  {
    id: 'alerts',
    icon: <Bell className="w-5 h-5" />,
    title: 'التنبيهات الذكية',
    titleEn: 'Smart Alerts',
    description: 'نظام مراقبة آلي للمخاطر المالية والتشغيلية',
    color: 'hsl(var(--destructive))',
    gradient: 'from-destructive/20 to-destructive/5',
    topics: [
      { question: 'كيف تعمل التنبيهات؟', answer: 'النظام يراقب بياناتك باستمرار ويطلق تنبيه عند تجاوز الحدود المحددة' },
      { question: 'ما هي حدود التنبيه؟', answer: 'قيم قابلة للتعديل مثل: حد الخسارة، نسبة المصروفات، تأخر المهام' },
      { question: 'ما هو تحليل "ماذا لو"؟', answer: 'محاكاة تأثير تغيير الإيرادات أو المصروفات على الأرباح قبل اتخاذ القرار' },
    ],
    tips: [
      'التنبيهات الحرجة (أحمر) تحتاج إجراء فوري',
      'عدّل الحدود حسب طبيعة عملك من الإعدادات',
      'استخدم "ماذا لو" قبل أي قرار مالي كبير',
    ],
  },
  {
    id: 'reports',
    icon: <FileText className="w-5 h-5" />,
    title: 'التقارير',
    titleEn: 'Reports',
    description: 'إنشاء وتصدير التقارير المالية الاحترافية',
    color: 'hsl(var(--chart-5))',
    gradient: 'from-chart-5/20 to-chart-5/5',
    topics: [
      { question: 'ما أنواع التقارير المتاحة؟', answer: 'تقرير الأرباح والخسائر، الميزانية العمومية، التدفق النقدي، أداء المشاريع، تقييم الموظفين' },
      { question: 'كيف أصدّر تقرير Excel؟', answer: 'اختر التقرير → حدد الفترة → اضغط "تحميل Excel" → سيُحمّل الملف تلقائياً' },
      { question: 'هل يمكن جدولة التقارير؟', answer: 'نعم، من الإعدادات → التقارير التلقائية → حدد الفترة والمستلمين' },
    ],
    tips: [
      'استخدم "طباعة" للتقارير الرسمية بشعار الشركة',
      'فلتر الفترة يؤثر على كل الأرقام في التقرير',
      'قارن فترات مختلفة لاكتشاف الاتجاهات',
    ],
  },
  {
    id: 'lab',
    icon: <FlaskConical className="w-5 h-5" />,
    title: 'المختبر المالي',
    titleEn: 'Financial Lab',
    description: 'أدوات متقدمة للقيود المحاسبية والنمذجة المالية',
    color: 'hsl(var(--accent))',
    gradient: 'from-accent/20 to-accent/5',
    topics: [
      { question: 'ما هو القيد المحاسبي؟', answer: 'تسجيل يوثق كل معاملة مالية بطرف مدين وطرف دائن متساويين (القيد المزدوج)' },
      { question: 'كيف أنشئ قيد جديد؟', answer: 'زر "قيد جديد" → اختر الحسابات → أدخل المبالغ → تأكد أن المجموعين متساويين → حفظ' },
      { question: 'ما معنى "القيد متوازن"؟', answer: 'مجموع المدين = مجموع الدائن. هذا شرط أساسي لصحة القيد' },
    ],
    tips: [
      'اربط القيد بمشروع لتتبع أثره على أرباح المشروع',
      'استخدم AI لشرح أي قيد غير واضح',
      'شجرة الحسابات توضح التصنيف المحاسبي',
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function BatSharkGuide() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'guide' | 'ai'>('guide');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const currentSection = GUIDE_SECTIONS.find(s => s.id === selectedSection);

  const askAI = useCallback(async () => {
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
              { 
                role: 'system', 
                content: 'أنت مساعد BatShark Economy، تساعد الموظفين على فهم النظام واستخدامه. أجب بشكل مختصر ومفيد بالعربية.' 
              },
              { role: 'user', content: question },
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
      setAiResponse('عذراً، حدث خطأ. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [question, loading]);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, []);

  return (
    <>
      {/* ================================================================== */}
      {/* FLOATING TRIGGER BUTTON */}
      {/* ================================================================== */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 group print:hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-chart-1 to-section-ai opacity-60 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        />
        
        {/* Main button */}
        <div className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-foreground/95 backdrop-blur-md shadow-elevated border border-white/10">
          <span className="text-background font-heading font-bold text-sm">دليل BatShark</span>
          <div className="relative">
            <img 
              src={logo} 
              alt="BatShark" 
              className="w-8 h-8 object-contain drop-shadow-lg" 
            />
            {/* Subtle pulse */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
        </div>
      </motion.button>

      {/* ================================================================== */}
      {/* MAIN DIALOG */}
      {/* ================================================================== */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Dialog Container */}
            <motion.div
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-border bg-card shadow-elevated"
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* ============================================================ */}
              {/* HEADER */}
              {/* ============================================================ */}
              <div className="relative overflow-hidden border-b border-border">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-section-ai/10 to-chart-1/10" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                />
                
                <div className="relative flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    {/* Logo with animation */}
                    <motion.div 
                      className="relative"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                    >
                      <img 
                        src={logo} 
                        alt="BatShark" 
                        className="w-14 h-14 object-contain drop-shadow-lg" 
                      />
                      <motion.div
                        className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary/20 to-section-ai/20 blur-xl"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    </motion.div>
                    
                    <div>
                      <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
                        دليل BatShark الشامل
                        <Sparkles className="w-5 h-5 text-primary" />
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        كل ما تحتاج معرفته عن النظام في مكان واحد
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setOpen(false)} 
                    className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="relative flex px-5 pb-0">
                  <button
                    onClick={() => { setTab('guide'); setSelectedSection(null); }}
                    className={`relative flex items-center gap-2 px-5 py-3 font-heading text-sm transition-all ${
                      tab === 'guide' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    الدليل التعليمي
                    {tab === 'guide' && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-section-ai rounded-full"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setTab('ai')}
                    className={`relative flex items-center gap-2 px-5 py-3 font-heading text-sm transition-all ${
                      tab === 'ai' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    اسأل الذكاء الاصطناعي
                    {tab === 'ai' && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-section-ai rounded-full"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* ============================================================ */}
              {/* CONTENT */}
              {/* ============================================================ */}
              <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                {tab === 'guide' ? (
                  <div className="p-5">
                    {selectedSection && currentSection ? (
                      // Section Detail View
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                      >
                        {/* Back button */}
                        <button
                          onClick={() => { setSelectedSection(null); setExpandedTopic(null); }}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                          العودة للأقسام
                        </button>

                        {/* Section header */}
                        <div className={`p-5 rounded-2xl bg-gradient-to-br ${currentSection.gradient} border border-border`}>
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-14 h-14 rounded-2xl flex items-center justify-center"
                              style={{ backgroundColor: `${currentSection.color}20`, color: currentSection.color }}
                            >
                              {currentSection.icon}
                            </div>
                            <div>
                              <h3 className="font-heading font-bold text-xl text-foreground">
                                {currentSection.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {currentSection.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* FAQ Accordion */}
                        <div className="space-y-3">
                          <h4 className="font-heading font-bold text-foreground flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            الأسئلة الشائعة
                          </h4>
                          {currentSection.topics.map((topic, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="border border-border rounded-xl overflow-hidden"
                            >
                              <button
                                onClick={() => setExpandedTopic(expandedTopic === i ? null : i)}
                                className="w-full flex items-center justify-between p-4 text-right hover:bg-muted/30 transition-colors"
                              >
                                <span className="font-medium text-foreground">{topic.question}</span>
                                <ChevronRight 
                                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                                    expandedTopic === i ? 'rotate-90' : ''
                                  }`} 
                                />
                              </button>
                              <AnimatePresence>
                                {expandedTopic === i && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/20">
                                      {topic.answer}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </div>

                        {/* Tips */}
                        <div className="space-y-3">
                          <h4 className="font-heading font-bold text-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-chart-2" />
                            نصائح احترافية
                          </h4>
                          <div className="grid gap-2">
                            {currentSection.tips.map((tip, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                              >
                                <span 
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                  style={{ backgroundColor: `${currentSection.color}20`, color: currentSection.color }}
                                >
                                  {i + 1}
                                </span>
                                <p className="text-sm text-foreground">{tip}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      // Sections Grid
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {GUIDE_SECTIONS.map((section, i) => (
                          <motion.button
                            key={section.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedSection(section.id)}
                            className={`group p-5 rounded-2xl bg-gradient-to-br ${section.gradient} border border-border hover:border-primary/30 transition-all text-right`}
                          >
                            <div className="flex items-start gap-4">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                                style={{ backgroundColor: `${section.color}20`, color: section.color }}
                              >
                                {section.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                                  {section.title}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {section.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-end mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                              <span>{section.topics.length} أسئلة شائعة</span>
                              <ChevronRight className="w-4 h-4 mr-1" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // AI Tab
                  <div className="p-5 space-y-4">
                    {aiResponse && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-muted/30 rounded-2xl p-5 border border-border"
                      >
                        <button
                          onClick={() => speakText(aiResponse)}
                          className="absolute top-4 left-4 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <div className="prose prose-sm max-w-none text-foreground">
                          <ReactMarkdown>{aiResponse}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}

                    {!aiResponse && !loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                        >
                          <img 
                            src={logo} 
                            alt="BatShark AI" 
                            className="w-20 h-20 mx-auto mb-4 opacity-50" 
                          />
                        </motion.div>
                        <h3 className="font-heading font-bold text-foreground mb-2">
                          اسأل أي سؤال عن النظام
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          الذكاء الاصطناعي جاهز لمساعدتك في فهم واستخدام كل ميزات BatShark
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {[
                            'كيف أضيف مشروع جديد؟',
                            'اشرح لي القيود المحاسبية',
                            'كيف أصدر تقرير Excel؟',
                            'ما هو مؤشر الصحة؟',
                          ].map(q => (
                            <button
                              key={q}
                              onClick={() => setQuestion(q)}
                              className="text-xs px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12"
                      >
                        <motion.div
                          className="relative"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                        >
                          <img src={logo} alt="Loading" className="w-16 h-16 opacity-60" />
                        </motion.div>
                        <div className="flex items-center gap-1 mt-4">
                          {[0, 1, 2].map(i => (
                            <motion.span
                              key={i}
                              className="w-2 h-2 rounded-full bg-primary"
                              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">جارٍ التحليل...</p>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* AI INPUT */}
              {/* ============================================================ */}
              {tab === 'ai' && (
                <div className="p-5 border-t border-border bg-muted/30">
                  <div className="flex gap-3">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && askAI()}
                      placeholder="اكتب سؤالك هنا... مثال: كيف أستخدم لوحة المهام؟"
                      className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      dir="rtl"
                    />
                    <Button 
                      onClick={askAI} 
                      disabled={loading || !question.trim()} 
                      size="lg"
                      className="px-6 rounded-xl"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
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
