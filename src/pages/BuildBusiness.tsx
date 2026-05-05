import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Sparkles, Brain, Rocket, Wrench, BarChart3, RefreshCw, ArrowLeft, ArrowRight,
  TrendingUp, Lightbulb, Target, ShieldCheck, User2, Globe2, ChevronRight,
  Check, AlertTriangle, Zap, Map, DollarSign, Users, Compass, FileBarChart,
  Sword, Trophy, Activity, LineChart, Layers,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'analyst';

const LEVELS: { id: Level; title: string; tagline: string; depth: string; icon: any; accent: string; ring: string }[] = [
  { id: 'beginner',     title: 'مبتدئ',         tagline: 'انطلاقة أولى — لا خبرة سابقة', depth: 'أفكار منخفضة المخاطر + خطوات تنفيذ مبسطة + رأس مال صغير',           icon: Rocket,    accent: 'from-emerald-400 via-teal-500 to-cyan-500',  ring: 'ring-emerald-400/40' },
  { id: 'intermediate', title: 'متوسط',         tagline: 'أساسيات أو مشروع قائم بسيط',  depth: 'تحليل تنافسي مختصر + هيكل تكاليف + خطة 90 يوم',                       icon: Wrench,    accent: 'from-amber-400 via-orange-500 to-rose-500',   ring: 'ring-amber-400/40' },
  { id: 'advanced',     title: 'متقدم',         tagline: 'إدارة أعمال فعلية',           depth: 'نماذج أعمال مبتكرة + استراتيجيات نمو وتسعير + مقارنة استثمارية',     icon: TrendingUp, accent: 'from-blue-400 via-indigo-500 to-violet-500', ring: 'ring-indigo-400/40' },
  { id: 'analyst',      title: 'محلل احترافي',  tagline: 'تحليل كمي عميق',              depth: 'TAM/SAM/SOM • CAC/LTV • Burn • Break-even • سيناريوهات حساسية',       icon: BarChart3, accent: 'from-fuchsia-400 via-purple-500 to-pink-500', ring: 'ring-fuchsia-400/40' },
];

// Per-level step definitions
type StepDef = { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'select' | 'slider'; placeholder?: string; options?: { v: string; l: string }[]; min?: number; max?: number; step?: number; suffix?: string };

const COMMON_STEPS: StepDef[] = [
  { key: 'budget_amount', label: 'الميزانية المتاحة (ر.س)', type: 'number', placeholder: '5000', suffix: 'ر.س' },
  { key: 'available_time', label: 'الوقت المتاح', type: 'select', options: [
    { v: 'part_time', l: 'جزئي (2-4 ساعات يومياً)' }, { v: 'full_time', l: 'كامل (8+ ساعات)' }, { v: 'weekends', l: 'عطل نهاية الأسبوع فقط' },
  ]},
  { key: 'risk_tolerance', label: 'تحمّل المخاطرة', type: 'select', options: [
    { v: 'low', l: 'منخفض — أفضّل الأمان' }, { v: 'medium', l: 'متوسط — متوازن' }, { v: 'high', l: 'عالي — أتقبل التحدي' },
  ]},
  { key: 'location', label: 'المدينة / السوق المستهدف', type: 'text', placeholder: 'الرياض، جدة، الخليج…' },
  { key: 'skills', label: 'مهاراتك الحالية', type: 'text', placeholder: 'تصميم، برمجة، مبيعات، طبخ…' },
  { key: 'interests', label: 'اهتماماتك وشغفك', type: 'text', placeholder: 'تقنية، رياضة، طعام، موضة…' },
  { key: 'motivation', label: 'دافعك الحقيقي للبزنس (لتحليل سلوكك)', type: 'textarea', placeholder: 'اكتب بصراحة — يحلّله الذكاء الاصطناعي سلوكياً' },
];

const LEVEL_STEPS: Record<Level, StepDef[]> = {
  beginner: [
    ...COMMON_STEPS,
    { key: 'experience', label: 'مستوى الخبرة', type: 'select', options: [
      { v: 'none', l: 'لا توجد' }, { v: 'beginner', l: 'مبتدئ' },
    ]},
    { key: 'fear', label: 'أكبر خوف يمنعك من البدء؟', type: 'textarea', placeholder: 'الفشل، الخسارة، عدم المعرفة…' },
  ],
  intermediate: [
    ...COMMON_STEPS,
    { key: 'experience', label: 'مستوى الخبرة', type: 'select', options: [
      { v: 'beginner', l: 'مبتدئ' }, { v: 'intermediate', l: 'متوسط' }, { v: 'expert', l: 'خبير' },
    ]},
    { key: 'has_business', label: 'هل تملك مشروعاً قائماً؟', type: 'select', options: [
      { v: 'no', l: 'لا' }, { v: 'yes_weak', l: 'نعم، أداؤه ضعيف' }, { v: 'yes_okay', l: 'نعم، أداؤه مقبول' },
    ]},
    { key: 'monthly_revenue', label: 'الإيراد الشهري الحالي (إن وُجد)', type: 'number', suffix: 'ر.س' },
    { key: 'main_problem', label: 'أكبر مشكلة تواجهك حالياً', type: 'textarea' },
  ],
  advanced: [
    ...COMMON_STEPS,
    { key: 'experience', label: 'مستوى الخبرة', type: 'select', options: [
      { v: 'intermediate', l: 'متوسط' }, { v: 'expert', l: 'خبير' }, { v: 'serial', l: 'رائد أعمال متسلسل' },
    ]},
    { key: 'target_market', label: 'السوق/الشريحة المستهدفة', type: 'text', placeholder: 'B2B SaaS، مطاعم فاخرة، Gen Z…' },
    { key: 'competitors', label: 'أبرز 3 منافسين', type: 'text', placeholder: 'سمّهم وافصل بفاصلة' },
    { key: 'unique_value', label: 'ميزتك التنافسية الفريدة (UVP)', type: 'textarea' },
    { key: 'expected_revenue', label: 'الإيراد المتوقع شهرياً (سنة 1)', type: 'number', suffix: 'ر.س' },
    { key: 'business_model', label: 'نموذج الإيراد المفضّل', type: 'select', options: [
      { v: 'subscription', l: 'اشتراكات' }, { v: 'transaction', l: 'عمولات/معاملات' }, { v: 'product', l: 'بيع منتجات' }, { v: 'service', l: 'خدمات' }, { v: 'marketplace', l: 'منصة وسيطة' },
    ]},
  ],
  analyst: [
    ...COMMON_STEPS,
    { key: 'target_market', label: 'السوق المستهدف', type: 'text' },
    { key: 'tam_estimate', label: 'حجم السوق الكلي المقدّر TAM (ر.س)', type: 'number', suffix: 'ر.س' },
    { key: 'expected_cac', label: 'تكلفة اكتساب العميل المتوقعة CAC', type: 'number', suffix: 'ر.س' },
    { key: 'expected_ltv', label: 'القيمة الدائمة للعميل المتوقعة LTV', type: 'number', suffix: 'ر.س' },
    { key: 'expected_revenue', label: 'الإيراد المتوقع شهرياً', type: 'number', suffix: 'ر.س' },
    { key: 'monthly_burn', label: 'الحرق الشهري المتوقع', type: 'number', suffix: 'ر.س' },
    { key: 'competitors', label: 'المنافسون الرئيسيون', type: 'text' },
    { key: 'unique_value', label: 'ميزتك التنافسية', type: 'textarea' },
    { key: 'data_points', label: 'بيانات / مؤشرات إضافية للتحليل', type: 'textarea', placeholder: 'نمو السوق %، نسب التحويل، أرقام مرجعية…' },
  ],
};

const baseAnswers: Record<string, any> = {
  budget_amount: 5000, available_time: 'part_time', risk_tolerance: 'medium',
  location: '', skills: '', interests: '', motivation: '',
  experience: 'none', has_business: 'no', monthly_revenue: 0, main_problem: '',
  target_market: '', competitors: '', unique_value: '', expected_revenue: 0,
  business_model: 'service', tam_estimate: 0, expected_cac: 0, expected_ltv: 0,
  monthly_burn: 0, data_points: '', fear: '',
};

export default function BuildBusiness() {
  const [identity, setIdentity] = useState<{ name?: string; email?: string; userId?: string } | null>(null);
  const [identityChecked, setIdentityChecked] = useState(false);
  const [level, setLevel] = useState<Level | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState({ ...baseAnswers });
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<any>(null);

  const isGuest = !identity?.userId;
  const activeLevel = useMemo(() => LEVELS.find((l) => l.id === level), [level]);
  const steps = level ? LEVEL_STEPS[level] : [];
  const currentStep = steps[stepIdx];
  const totalSteps = steps.length;

  useEffect(() => {
    document.title = 'Batshare 99 — منصة بناء البزنس';
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (u) {
        const { data: prof } = await supabase.from('profiles').select('display_name').eq('user_id', u.id).maybeSingle();
        setIdentity({ userId: u.id, email: u.email, name: prof?.display_name || u.email?.split('@')[0] });
      }
      setIdentityChecked(true);
    })();
  }, []);

  const update = (k: string, v: any) => setAnswers((a) => ({ ...a, [k]: v }));

  const next = () => {
    if (stepIdx < totalSteps - 1) setStepIdx((i) => i + 1);
    else submit();
  };
  const prev = () => stepIdx > 0 && setStepIdx((i) => i - 1);

  const submit = async () => {
    if (!level) return;
    setLoading(true);
    const messages = [
      'جاري قراءة إجاباتك…',
      'تحليل سلوكي عميق لنمط تفكيرك…',
      'مسح اتجاهات السوق المطابقة…',
      'بناء النموذج المالي والتنافسي…',
      'صياغة التوصيات الاحترافية…',
    ];
    let i = 0;
    setProgressMsg(messages[0]);
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setProgressMsg(messages[i]);
    }, 1800);
    try {
      const body: any = { action: 'smart_assessment', payload: { track: level, answers } };
      if (identity?.userId) body.userId = identity.userId; else body.guest = true;
      const { data, error } = await supabase.functions.invoke('batshare99-ai', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast.success('تم بناء التحليل الاحترافي');
    } catch (e: any) {
      toast.error(e.message || 'فشل التوليد');
    } finally {
      clearInterval(interval);
      setProgressMsg('');
      setLoading(false);
    }
  };

  const createProject = async (recId: string) => {
    if (isGuest) { toast.info('سجّل دخولك لإنشاء المشروع داخل النظام'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('batshare99-ai', {
        body: { action: 'create_full_project', userId: identity!.userId, payload: { recommendationId: recId } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`🚀 تم إنشاء المشروع: ${data.project.name}`);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  const reset = () => { setLevel(null); setResult(null); setStepIdx(0); setAnswers({ ...baseAnswers }); };

  return (
    <div dir="rtl" className="min-h-screen bg-[#05060d] text-slate-100 relative overflow-x-hidden">
      {/* Animated ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -20, 0] }} transition={{ duration: 18, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-violet-600/25 blur-[120px]" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 22, repeat: Infinity }}
          className="absolute top-1/3 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <motion.div animate={{ x: [0, 20, 0] }} transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,transparent_50%,#000_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-black/30 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity }}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)]">
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <div className="font-bold text-base leading-tight bg-gradient-to-l from-white to-violet-200 bg-clip-text text-transparent">Batshare 99</div>
              <div className="text-[10px] text-slate-400 tracking-wide">PROFESSIONAL BUSINESS BUILDER</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!identityChecked ? null : isGuest ? (
              <Badge variant="outline" className="border-slate-600 text-slate-300 gap-1 bg-slate-900/50"><Globe2 className="w-3 h-3" /> زائر</Badge>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 gap-1"><User2 className="w-3 h-3" /> {identity?.name}</Badge>
            )}
          </div>
        </div>
        {level && !result && (
          <div className="max-w-6xl mx-auto px-4 pb-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>المرحلة {stepIdx + 1} من {totalSteps} — {activeLevel?.title}</span>
              <span>{Math.round(((stepIdx + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div className={`h-full bg-gradient-to-l ${activeLevel?.accent}`}
                initial={{ width: 0 }} animate={{ width: `${((stepIdx + 1) / totalSteps) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {/* HERO + LEVEL PICKER */}
          {!level && !result && (
            <motion.div key="hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <section className="text-center mb-12">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-l from-violet-500/10 to-cyan-500/10 border border-white/10 text-xs text-slate-300 mb-5 backdrop-blur">
                  <Brain className="w-3.5 h-3.5 text-violet-300" /> منصة سيادية مدعومة بذكاء اصطناعي عميق
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                  <span className="bg-gradient-to-l from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">ابنِ بزنس حقيقي</span>
                  <br />
                  <span className="text-2xl md:text-4xl bg-gradient-to-l from-amber-200 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent">بقرار حقيقي ومدعوم بالأرقام</span>
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                  className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                  معالج تفاعلي متعدد الخطوات يحلّل سلوكك وميزانيتك ومهاراتك ويولّد فكرة بزنس مُخصَّصة بنسبة توافق فعلية، مع تحليل SWOT، مالي، تنافسي، وخارطة طريق احترافية.
                </motion.p>
                {isGuest && identityChecked && (
                  <div className="text-[11px] text-slate-500 mt-4">وضع الزائر — التحليل مرة واحدة دون حفظ</div>
                )}
              </section>

              <div className="text-center text-xs text-slate-400 mb-4 tracking-widest uppercase">اختر مستواك السيادي</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LEVELS.map((l, i) => (
                  <motion.button
                    key={l.id} onClick={() => { setLevel(l.id); setStepIdx(0); }}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                    className="group text-right relative rounded-2xl p-6 bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 hover:border-white/30 transition-all overflow-hidden backdrop-blur-sm">
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity bg-gradient-to-br ${l.accent}`} />
                    <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${l.accent} opacity-10 blur-2xl group-hover:opacity-30 transition-opacity`} />
                    <div className="relative flex items-start gap-4">
                      <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${l.accent} shadow-2xl ring-2 ${l.ring}`}>
                        <l.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-black">{l.title}</h3>
                          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:-translate-x-1.5 transition-all" />
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{l.tagline}</div>
                        <div className="text-sm text-slate-300 mt-3 leading-relaxed">{l.depth}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Trust strip */}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  { icon: Brain, t: 'تحليل سلوكي عميق' },
                  { icon: ShieldCheck, t: 'بيانات سوقية حقيقية' },
                  { icon: Zap, t: 'نتائج فورية احترافية' },
                  { icon: Trophy, t: '4 مستويات سيادية' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <f.icon className="w-4 h-4 text-violet-300" />
                    <span className="text-slate-300">{f.t}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* WIZARD STEPS */}
          {level && !result && currentStep && (
            <motion.div key={`step-${stepIdx}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <Button variant="ghost" onClick={reset} className="text-slate-400 hover:text-white gap-2 mb-4">
                <ArrowLeft className="w-4 h-4 rotate-180" /> تغيير المستوى
              </Button>

              <Card className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border-white/10 backdrop-blur-xl p-8 md:p-10 text-slate-100 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${activeLevel?.accent} shadow-lg`}>
                    {activeLevel && <activeLevel.icon className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">المستوى</div>
                    <div className="font-bold">{activeLevel?.title}</div>
                  </div>
                </div>

                <div className="mb-2 text-[11px] text-slate-500 uppercase tracking-wider">سؤال {stepIdx + 1}</div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">{currentStep.label}</h2>
                {currentStep.placeholder && (currentStep.type === 'textarea') && (
                  <p className="text-sm text-slate-400 mb-5">{currentStep.placeholder}</p>
                )}

                <div className="mt-6">
                  {currentStep.type === 'text' && (
                    <Input value={answers[currentStep.key] || ''} onChange={(e) => update(currentStep.key, e.target.value)} placeholder={currentStep.placeholder}
                      className="bg-slate-900/60 border-white/10 text-lg h-14" autoFocus />
                  )}
                  {currentStep.type === 'number' && (
                    <div className="relative">
                      <Input type="number" value={answers[currentStep.key] || 0} onChange={(e) => update(currentStep.key, Number(e.target.value))}
                        className="bg-slate-900/60 border-white/10 text-lg h-14 pr-16" autoFocus />
                      {currentStep.suffix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currentStep.suffix}</span>}
                    </div>
                  )}
                  {currentStep.type === 'textarea' && (
                    <Textarea value={answers[currentStep.key] || ''} onChange={(e) => update(currentStep.key, e.target.value)}
                      rows={5} className="bg-slate-900/60 border-white/10 text-base resize-none" autoFocus />
                  )}
                  {currentStep.type === 'select' && currentStep.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {currentStep.options.map((opt) => {
                        const selected = answers[currentStep.key] === opt.v;
                        return (
                          <button key={opt.v} onClick={() => update(currentStep.key, opt.v)}
                            className={`text-right p-4 rounded-xl border transition-all ${
                              selected ? `bg-gradient-to-br ${activeLevel?.accent} border-transparent text-white shadow-lg`
                                       : 'bg-slate-900/40 border-white/10 hover:border-white/30 text-slate-200'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{opt.l}</span>
                              {selected && <Check className="w-4 h-4" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                  <Button variant="ghost" onClick={prev} disabled={stepIdx === 0} className="text-slate-300 gap-2">
                    <ArrowRight className="w-4 h-4" /> السابق
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {steps.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIdx ? `w-6 bg-gradient-to-l ${activeLevel?.accent}` : i < stepIdx ? 'w-1.5 bg-white/40' : 'w-1.5 bg-white/10'}`} />
                    ))}
                  </div>
                  <Button onClick={next} disabled={loading}
                    className={`gap-2 bg-gradient-to-r ${activeLevel?.accent} hover:opacity-90 text-white shadow-lg px-6`}>
                    {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> جاري…</> :
                     stepIdx === totalSteps - 1 ? <><Sparkles className="w-4 h-4" /> توليد التحليل الكامل</> :
                     <>التالي <ArrowLeft className="w-4 h-4" /></>}
                  </Button>
                </div>
              </Card>

              {/* Loading overlay messages */}
              {loading && progressMsg && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-center text-sm text-slate-300 flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4 text-violet-300 animate-pulse" /> {progressMsg}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* RESULT */}
          {result && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={reset} className="text-slate-300 hover:text-white gap-2">
                  <ArrowLeft className="w-4 h-4 rotate-180" /> تحليل جديد
                </Button>
                <Badge className={`bg-gradient-to-l ${activeLevel?.accent} text-white border-0 px-3 py-1`}>
                  مستوى: {activeLevel?.title}
                </Badge>
              </div>

              {/* Behavior summary */}
              <Card className="bg-gradient-to-br from-violet-500/15 via-cyan-500/10 to-transparent border-white/10 p-6 mb-5 text-slate-100 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-violet-300" />
                  <h3 className="font-bold text-lg">التحليل السلوكي والاستراتيجي</h3>
                </div>
                {result.ai_summary && <p className="text-sm text-slate-300 mb-4 leading-relaxed">{result.ai_summary}</p>}
                {result.behavior && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                    <Stat icon={Brain} label="نمط التفكير" value={result.behavior.thinking_pattern} />
                    <Stat icon={ShieldCheck} label="نمط المخاطرة" value={result.behavior.risk_profile} />
                    <Stat icon={Compass} label="أسلوب القرار" value={result.behavior.decision_style} />
                  </div>
                )}
                {(result.behavior?.strengths?.length || result.behavior?.weaknesses?.length) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {result.behavior?.strengths?.length > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                        <div className="text-emerald-300 text-xs font-semibold mb-1.5 flex items-center gap-1"><Trophy className="w-3 h-3" /> نقاط قوتك</div>
                        <ul className="text-xs text-slate-200 space-y-1 list-disc mr-4">{result.behavior.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    )}
                    {result.behavior?.weaknesses?.length > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                        <div className="text-rose-300 text-xs font-semibold mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> ما يجب تطويره</div>
                        <ul className="text-xs text-slate-200 space-y-1 list-disc mr-4">{result.behavior.weaknesses.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </Card>

              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" /> التوصيات الاحترافية المخصصة
              </h3>
              <div className="space-y-5">
                {result.recommendations?.map((rec: any, idx: number) => (
                  <motion.div key={rec.id || idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                    <Card className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border-white/10 p-6 text-slate-100 backdrop-blur-xl shadow-2xl overflow-hidden relative">
                      <div className={`absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b ${activeLevel?.accent}`} />

                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xl mb-1">{rec.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="border-white/20 text-slate-300">{rec.business_type}</Badge>
                            <Badge variant="outline" className="border-white/20 text-slate-300">صعوبة: {rec.difficulty}</Badge>
                          </div>
                        </div>
                        <div className="text-center shrink-0">
                          <div className="text-4xl font-black bg-gradient-to-l from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">{rec.match_percentage}%</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">توافق</div>
                        </div>
                      </div>
                      <Progress value={rec.match_percentage} className="h-1.5 mb-4 bg-white/10" />

                      <p className="text-sm text-slate-300 mb-4 leading-relaxed">{rec.description}</p>

                      {/* KPIs */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                        <Mini icon={DollarSign} label="رأس المال" value={`${(rec.required_budget || 0).toLocaleString()} ر.س`} />
                        <Mini icon={TrendingUp} label="ROI متوقع" value={`${rec.estimated_roi || 0}%`} accent="text-emerald-300" />
                        {rec.financial_projections?.break_even_months && (
                          <Mini icon={Activity} label="نقطة التعادل" value={`${rec.financial_projections.break_even_months} شهر`} />
                        )}
                        {rec.financial_projections?.year1_revenue && (
                          <Mini icon={LineChart} label="إيراد سنة 1" value={`${rec.financial_projections.year1_revenue.toLocaleString()} ر.س`} accent="text-cyan-300" />
                        )}
                      </div>

                      {/* SWOT */}
                      {rec.swot && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                          <SwotBox color="emerald" title="قوة" items={rec.swot.strengths} />
                          <SwotBox color="rose" title="ضعف" items={rec.swot.weaknesses} />
                          <SwotBox color="cyan" title="فرص" items={rec.swot.opportunities} />
                          <SwotBox color="amber" title="تهديدات" items={rec.swot.threats} />
                        </div>
                      )}

                      {/* Why match + market insight */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {rec.ai_analysis?.why_match && (
                          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                            <div className="text-[11px] text-violet-300 font-semibold mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> لماذا تناسبك</div>
                            <div className="text-xs text-slate-200 leading-relaxed">{rec.ai_analysis.why_match}</div>
                          </div>
                        )}
                        {rec.ai_analysis?.market_insight && (
                          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                            <div className="text-[11px] text-cyan-300 font-semibold mb-1 flex items-center gap-1"><FileBarChart className="w-3 h-3" /> رؤية السوق</div>
                            <div className="text-xs text-slate-200 leading-relaxed">{rec.ai_analysis.market_insight}</div>
                          </div>
                        )}
                      </div>

                      {/* Competitors */}
                      {rec.competitors?.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1"><Sword className="w-3.5 h-3.5 text-rose-300" /> مشهد المنافسة</div>
                          <div className="space-y-1.5">
                            {rec.competitors.map((c: any, i: number) => (
                              <div key={i} className="bg-white/5 border border-white/10 rounded-md p-2.5 text-xs">
                                <div className="font-semibold text-slate-100">{c.name}</div>
                                <div className="text-slate-400 mt-0.5">{c.strength_weakness}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Roadmap */}
                      {rec.roadmap?.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1"><Map className="w-3.5 h-3.5 text-amber-300" /> خارطة الطريق التنفيذية</div>
                          <div className="space-y-2">
                            {rec.roadmap.map((p: any, i: number) => (
                              <div key={i} className="flex gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                                <div className={`shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${activeLevel?.accent} flex items-center justify-center text-white text-xs font-bold`}>{i + 1}</div>
                                <div className="flex-1 text-xs">
                                  <div className="font-semibold text-slate-100">{p.phase} <span className="text-slate-500 font-normal">• {p.duration}</span></div>
                                  <div className="text-slate-300 mt-1">{p.actions}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action steps fallback */}
                      {(!rec.roadmap || rec.roadmap.length === 0) && rec.action_steps?.length > 0 && (
                        <div className="mb-4 text-xs text-slate-300">
                          <div className="font-semibold mb-2 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> خطوات التنفيذ</div>
                          <ul className="list-disc mr-5 space-y-1 text-slate-400">
                            {rec.action_steps.map((s: string, i: number) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Risks */}
                      {rec.risks?.length > 0 && (
                        <div className="mb-4 bg-rose-500/5 border border-rose-500/20 rounded-lg p-3">
                          <div className="text-[11px] text-rose-300 font-semibold mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> مخاطر يجب الانتباه إليها</div>
                          <ul className="text-xs text-slate-300 space-y-0.5 list-disc mr-4">
                            {rec.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Analyst extras */}
                      {rec.analyst_metrics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-xs">
                          {Object.entries(rec.analyst_metrics).map(([k, v]: any) => (
                            <div key={k} className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-md p-2 text-center">
                              <div className="text-fuchsia-200/70 text-[10px] uppercase">{k}</div>
                              <div className="text-slate-100 font-semibold mt-0.5">{String(v)}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isGuest && rec.id && !String(rec.id).startsWith('guest-') ? (
                        <Button onClick={() => createProject(rec.id)} disabled={loading}
                          className={`w-full gap-2 bg-gradient-to-r ${activeLevel?.accent} text-white shadow-lg hover:opacity-90 mt-2`}>
                          <Rocket className="w-4 h-4" /> إنشاء المشروع داخل المنظومة
                        </Button>
                      ) : (
                        <div className="text-[11px] text-center text-slate-400 border border-dashed border-white/10 rounded-lg py-3 mt-2 bg-white/[0.02]">
                          <Lightbulb className="w-3 h-3 inline ml-1 text-amber-300" /> سجّل دخولك من النظام لإنشاء المشروع تلقائياً مع الحسابات والقيود
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center text-[11px] text-slate-600 mt-16 pb-6">
          © Batshare 99 • Professional Business Builder
        </footer>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
      <div className="text-slate-400 text-[10px] flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</div>
      <div className="text-slate-100 font-semibold mt-1 text-xs truncate">{value}</div>
    </div>
  );
}
function Mini({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
      <div className="text-slate-400 text-[10px] flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</div>
      <div className={`font-bold mt-0.5 text-sm ${accent || 'text-slate-100'}`}>{value}</div>
    </div>
  );
}
function SwotBox({ color, title, items }: { color: string; title: string; items?: string[] }) {
  if (!items?.length) return null;
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
  };
  return (
    <div className={`rounded-lg border p-2.5 ${colorMap[color]}`}>
      <div className="text-[10px] font-bold uppercase mb-1">{title}</div>
      <ul className="text-[11px] text-slate-200 space-y-0.5 list-disc mr-4">
        {items.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}
