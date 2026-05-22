import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Image,
  Layers,
  Lock,
  Megaphone,
  RefreshCw,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
} from 'lucide-react';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'analyst';

type Question = {
  key: string;
  label: string;
  hint: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

const LEVEL_CONFIG: Record<Level, { title: string; short: string; route: string; icon: any; accent: string; promise: string; questions: Question[] }> = {
  beginner: {
    title: 'المستوى 1 — مبتدئ',
    short: 'يبني لك الفكرة من الصفر',
    route: '/b99/generator/beginner',
    icon: Rocket,
    accent: 'from-emerald-400 via-teal-400 to-cyan-500',
    promise: 'أسئلة سهلة، قرار واضح، ومنصة جاهزة بدون تعقيد.',
    questions: [
      { key: 'business_request', label: 'وش تبي تبني بالضبط؟', hint: 'مثال: منصة بيع أكل صحي، حجز ملاعب بادل، مظلات سيارات.', type: 'textarea', required: true, placeholder: 'اكتب طلبك مثل ما هو في بالك...' },
      { key: 'city', label: 'المدينة والسوق', hint: 'نحدد اللغة والعروض والتوقيت حسب المكان.', type: 'text', placeholder: 'الرياض، جدة، الدمام...' },
      { key: 'budget', label: 'ميزانيتك التقريبية', hint: 'حتى نقترح نسخة واقعية قابلة للتنفيذ.', type: 'number', placeholder: '5000' },
      { key: 'main_image', label: 'الصورة المطلوبة في الشاشة الرئيسية', hint: 'إذا عندك وصف لصورة الشركة أو المنتج اكتبه هنا.', type: 'text', placeholder: 'صورة وجبات صحية، ملعب بادل، واجهة متجر...' },
      { key: 'payment', label: 'طريقة الدفع', hint: 'مثال طلبك: الدفع كاش فقط.', type: 'select', options: ['كاش فقط', 'تحويل بنكي', 'دفع عند الاستلام', 'بطاقة/Apple Pay لاحقاً'] },
    ],
  },
  intermediate: {
    title: 'المستوى 2 — متوسط',
    short: 'يطور بزنس قائم',
    route: '/b99/generator/intermediate',
    icon: Wrench,
    accent: 'from-amber-300 via-orange-400 to-rose-500',
    promise: 'تشخيص، تحسين تجربة العميل، وصفحات بيع أقوى.',
    questions: [
      { key: 'business_request', label: 'ما هو البزنس الحالي؟', hint: 'اكتب النشاط والوضع الحالي.', type: 'textarea', required: true },
      { key: 'current_problem', label: 'أكبر مشكلة الآن', hint: 'مبيعات، حجوزات، ثقة، إعلان، تشغيل؟', type: 'textarea', required: true },
      { key: 'monthly_revenue', label: 'الإيراد الشهري الحالي', hint: 'يساعد في اقتراح خطة نمو واقعية.', type: 'number' },
      { key: 'customer_path', label: 'كيف يطلب منك العميل حالياً؟', hint: 'واتساب، اتصال، موقع، إنستقرام...', type: 'text' },
      { key: 'upgrade_goal', label: 'هدف التطوير', hint: 'اختر النتيجة الأهم.', type: 'select', options: ['زيادة الحجوزات', 'زيادة المبيعات', 'تحسين الثقة', 'تقليل الأسئلة المتكررة', 'تنظيم الطلبات'] },
    ],
  },
  advanced: {
    title: 'المستوى 3 — متقدم',
    short: 'يصمم منصة تشغيل ونمو',
    route: '/b99/generator/advanced',
    icon: TrendingUp,
    accent: 'from-sky-400 via-blue-500 to-indigo-500',
    promise: 'هيكل منصة، صفحات تشغيل، عروض، حملات، وربط نمو.',
    questions: [
      { key: 'business_request', label: 'نوع المنصة المطلوبة', hint: 'منصة بيع، حجوزات، خدمات، مجتمع، SaaS...', type: 'textarea', required: true },
      { key: 'segments', label: 'شرائح العملاء', hint: 'اكتب كل شريحة وفائدتها.', type: 'textarea' },
      { key: 'offers', label: 'العروض أو الباقات', hint: 'مثال: اشتراك شهري، باقة VIP، طلب فردي.', type: 'textarea' },
      { key: 'operations', label: 'ماذا يحدث بعد الطلب؟', hint: 'تأكيد، توصيل، موعد، فريق، متابعة...', type: 'textarea' },
      { key: 'growth_channel', label: 'قناة النمو الأساسية', hint: 'القناة التي تريد أن يبنى عليها التسويق.', type: 'select', options: ['Instagram/Snapchat', 'TikTok', 'Google Search', 'WhatsApp Sales', 'شراكات ومؤثرين'] },
    ],
  },
  analyst: {
    title: 'المستوى 4 — محلل احترافي',
    short: 'يبني بقرارات رقمية',
    route: '/b99/generator/analyst',
    icon: BarChart3,
    accent: 'from-fuchsia-400 via-violet-500 to-indigo-500',
    promise: 'فرضيات، CAC/LTV، صفحات اختبار، ومؤشرات إطلاق.',
    questions: [
      { key: 'business_request', label: 'الفرضية الأساسية للمنصة', hint: 'ما المشكلة، لمن، ولماذا الآن؟', type: 'textarea', required: true },
      { key: 'tam_sam_som', label: 'حجم السوق أو تصورك له', hint: 'اكتب أرقامك أو توقعك لو غير متأكد.', type: 'textarea' },
      { key: 'unit_economics', label: 'اقتصاد الوحدة', hint: 'سعر البيع، التكلفة، الهامش، تكرار الشراء.', type: 'textarea' },
      { key: 'risk', label: 'أكبر مخاطرة', hint: 'قانونية، طلب، تشغيل، منافسة، تمويل.', type: 'textarea' },
      { key: 'experiment', label: 'نوع الاختبار الأول', hint: 'كيف نثبت الطلب بأقل تكلفة؟', type: 'select', options: ['صفحة هبوط + إعلان', 'انتظار مسبق', 'حملة واتساب', 'مقابلات عملاء', 'MVP مدفوع'] },
    ],
  },
};

const LEVELS = Object.keys(LEVEL_CONFIG) as Level[];

const BUILD_STEPS = [
  { id: 'analyze', label: 'تحليل متطلباتك وفهم النشاط', detail: 'يقرأ إجاباتك ويستخرج هوية المنصة والجمهور المستهدف' },
  { id: 'research', label: 'بحث عميق عن مرجعيات السوق', detail: 'يجمع أنماط منصات شبيهة محلياً وعالمياً' },
  { id: 'blueprint', label: 'كتابة المخطط الكامل (Blueprint)', detail: 'صفحات + أقسام + هوية بصرية + ميزات' },
  { id: 'content', label: 'كتابة محتوى احترافي لكل صفحة', detail: 'عناوين، أوصاف، باقات، أسئلة شائعة، شهادات' },
  { id: 'brand', label: 'توليد هوية بصرية واختيار الألوان', detail: 'لوحة ألوان، شعار رمزي، مزاج بصري متناسق' },
  { id: 'wire', label: 'ربط قاعدة بيانات وحساب مالك', detail: 'بناء حسابك، كلمة السر، وصلاحيات التعديل' },
  { id: 'publish', label: 'نشر المنصة على رابط مستقل', detail: 'إصدار رابط /p/slug جاهز للزيارة المباشرة' },
];

export default function B99Generator() {
  const { level: routeLevel } = useParams();
  const navigate = useNavigate();
  const { identity }: any = useOutletContext();
  const level = LEVELS.includes(routeLevel as Level) ? (routeLevel as Level) : null;
  const config = level ? LEVEL_CONFIG[level] : null;
  const [answers, setAnswers] = useState<Record<string, any>>({ payment: 'كاش فقط' });
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<any>(null);
  const [buildStep, setBuildStep] = useState(0);
  const [buildLog, setBuildLog] = useState<string[]>([]);

  const progress = useMemo(() => {
    if (!config) return 0;
    const total = config.questions.length;
    const filled = config.questions.filter((q) => String(answers[q.key] ?? '').trim()).length;
    return Math.round((filled / total) * 100);
  }, [answers, config]);

  const attackNavigate = (to: string) => window.dispatchEvent(new CustomEvent('batshark:attack', { detail: { to } }));

  const update = (key: string, value: any) => setAnswers((a) => ({ ...a, [key]: value }));

  const levelNumber = (l: Level) => ({ beginner: 1, intermediate: 2, advanced: 3, analyst: 4 }[l]);

  const generate = async () => {
    if (!config || !level) return;
    const missing = config.questions.find((q) => q.required && !String(answers[q.key] ?? '').trim());
    if (missing) return toast.error(`أكمل: ${missing.label}`);
    setLoading(true);
    setPlatform(null);
    setBuildStep(0);
    setBuildLog([`▶ بدء البناء — ${new Date().toLocaleTimeString('ar-SA')}`]);

    // Live progressive build steps while AI works
    let stepIdx = 0;
    const stepTimer = setInterval(() => {
      if (stepIdx < BUILD_STEPS.length - 1) {
        stepIdx++;
        setBuildStep(stepIdx);
        setBuildLog((l) => [...l, `✓ ${BUILD_STEPS[stepIdx - 1].label}`]);
      }
    }, 1800);

    try {
      const enriched = {
        ...answers,
        level_track: level,
        owner_email: identity?.email || answers.owner_email,
        platform_type_hint: inferPlatformType(String(answers.business_request || '')),
        access_code: answers.access_code || '',
      };
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generate_platform', userId: identity?.userId, payload: { level: levelNumber(level), answers: enriched } },
      });
      clearInterval(stepTimer);
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.platform) throw new Error('لم يتم بناء المنصة');
      setBuildStep(BUILD_STEPS.length - 1);
      setBuildLog((l) => [...l, `✓ نشر المنصة على /p/${data.platform.slug}`, `✅ تم بناء منصة مستقلة فعلية — ${data.platform.name}`]);
      setPlatform(data.platform);
      toast.success('تم بناء منصة فعلية ورابط مستقل');
    } catch (e: any) {
      clearInterval(stepTimer);
      setBuildLog((l) => [...l, `✗ خطأ: ${e.message || 'فشل البناء'}`]);
      toast.error(e.message || 'تعذر البناء');
    } finally {
      setLoading(false);
    }
  };



  if (!config) {
    return (
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(190_90%_50%/0.16),transparent_32%),radial-gradient(circle_at_80%_30%,hsl(330_90%_55%/0.16),transparent_34%)]" />
          <div className="relative max-w-3xl">
            <Badge className="mb-4 border-white/15 bg-white/10 text-white">اختر صفحة المستوى</Badge>
            <h1 className="text-3xl md:text-5xl font-black leading-tight">كل مستوى له صفحة، أسئلة، وذكاء بناء مختلف</h1>
            <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed">اختر مستواك، أجب على متطلباتك، ثم حوّل الطلب إلى منصة مستقلة فعلية قابلة للزيارة ومربوطة ببيانات Batshark99.</p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEVELS.map((id, i) => {
            const item = LEVEL_CONFIG[id];
            const Icon = item.icon;
            return (
              <motion.button
                key={id}
                onClick={() => attackNavigate(item.route)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-right hover:border-white/30"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${item.accent}`} />
                <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${item.accent} p-3 shadow-2xl`}><Icon className="h-7 w-7 text-white" /></div>
                <h3 className="text-xl font-black text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-cyan-200">{item.short}</p>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{item.promise}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-300"><Bot className="h-3.5 w-3.5" /> {item.questions.length} متطلبات مخصصة</div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Button variant="ghost" onClick={() => attackNavigate('/b99/generator')} className="mb-2 gap-2 text-slate-400"><ArrowLeft className="h-4 w-4" /> كل المستويات</Button>
          <div className="text-xs uppercase tracking-widest text-slate-500">صفحة مستقلة للمستوى</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl md:text-4xl font-black"><Icon className="h-7 w-7 text-cyan-300" /> {config.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{config.promise}</p>
        </div>
        <Badge className={`w-fit border-0 bg-gradient-to-l ${config.accent} px-4 py-1.5 text-white`}>تقدّم المتطلبات {progress}%</Badge>
      </header>

      <Progress value={progress} className="h-2 bg-white/10" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <Card className="border-white/10 bg-white/[0.035] p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.questions.map((q) => (
              <div key={q.key} className={q.type === 'textarea' ? 'md:col-span-2' : ''}>
                <Label className="text-xs text-slate-300">{q.label}{q.required && ' *'}</Label>
                <p className="mb-2 mt-1 text-[11px] text-slate-500">{q.hint}</p>
                {q.type === 'textarea' ? (
                  <Textarea value={answers[q.key] || ''} onChange={(e) => update(q.key, e.target.value)} rows={4} placeholder={q.placeholder} className="border-white/10 bg-slate-950/70" />
                ) : q.type === 'select' ? (
                  <Select value={answers[q.key] || q.options?.[0]} onValueChange={(v) => update(q.key, v)}>
                    <SelectTrigger className="border-white/10 bg-slate-950/70"><SelectValue /></SelectTrigger>
                    <SelectContent>{q.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input type={q.type} value={answers[q.key] || ''} onChange={(e) => update(q.key, q.type === 'number' ? Number(e.target.value) : e.target.value)} placeholder={q.placeholder} className="border-white/10 bg-slate-950/70" />
                )}
              </div>
            ))}
            <div className="md:col-span-2">
              <Label className="flex items-center gap-1 text-xs text-slate-300"><Lock className="h-3 w-3" /> رمز مرور للمنصة الناتجة (اختياري)</Label>
              <Input value={answers.access_code || ''} onChange={(e) => update('access_code', e.target.value)} placeholder="اتركه فارغ للزيارة العامة" className="mt-2 border-white/10 bg-slate-950/70" />
            </div>
          </div>
          <Button onClick={generate} disabled={loading} className={`mt-5 h-12 w-full bg-gradient-to-l ${config.accent} font-bold text-white`}>
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin" /> يبني المخطط...</> : <><Sparkles className="h-4 w-4" /> حلّل المتطلبات وابنِ المخطط</>}
          </Button>
        </Card>

        <aside className="space-y-3">
          <Card className="border-white/10 bg-slate-950/80 p-5">
            <ClipboardList className="mb-3 h-6 w-6 text-cyan-300" />
            <h3 className="font-black">آلية هذا المستوى</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-400">
              <Step n="1" text="يجمع متطلبات خاصة بالمستوى" />
              <Step n="2" text="يحلل الطلب بذكاء مختلف" />
              <Step n="3" text="ينتج مخطط منصة قابل للتنفيذ" />
              <Step n="4" text="يبني رابط منصة مستقل للزوار" />
            </div>
          </Card>
          <Card className="border-white/10 bg-white/[0.03] p-5">
            <Megaphone className="mb-3 h-6 w-6 text-rose-300" />
            <h3 className="font-black">بعد البناء</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">تقدر تنقلها مباشرة لركن الإعلانات لبناء حملات جاهزة للنشر حسب نوع المنصة والجمهور.</p>
          </Card>
        </aside>
      </div>

      <AnimatePresence>
        {platform && (
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="overflow-hidden border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 p-6">
              <Badge className="mb-3 border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                <CheckCircle2 className="ml-1 inline h-3 w-3" /> منصة فعلية جاهزة
              </Badge>
              <h2 className="text-2xl md:text-4xl font-black">{platform.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{platform.tagline}</p>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                <MiniStat icon={Layers} label="عدد الصفحات" value={String((platform.pages || []).length)} />
                <MiniStat icon={CreditCard} label="الدفع" value={answers.payment || 'كاش فقط'} />
                <MiniStat icon={Image} label="الهيرو" value={answers.main_image || 'حسب النشاط'} />
                <MiniStat icon={Target} label="نوع المنصة" value={platform.platform_type || inferPlatformType(String(answers.business_request || ''))} />
              </div>
            </Card>

            <Card className="border-white/10 bg-slate-950/80 p-5">
              <h3 className="mb-3 flex items-center gap-2 font-black"><Rocket className="h-4 w-4 text-cyan-300" /> منصتك أصبحت حية</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button onClick={() => window.open(`/p/${platform.slug}`, '_blank')} className="h-12 bg-cyan-500 text-white hover:bg-cyan-400"><ExternalLink className="h-4 w-4" /> فتح المنصة الحية</Button>
                <Button onClick={() => window.open(`/p/${platform.slug}/edit`, '_blank')} className="h-12 bg-white text-slate-950 hover:bg-slate-200"><Wrench className="h-4 w-4" /> محرر المالك</Button>
                <Button onClick={() => navigate('/b99/ads', { state: { prefill: { businessType: platform.name, brief: platform.tagline } } })} className="h-12 bg-rose-500 text-white hover:bg-rose-400"><Megaphone className="h-4 w-4" /> حملة إعلانية لها</Button>
              </div>
              <p className="mt-3 text-xs text-emerald-300"><CheckCircle2 className="inline h-3.5 w-3.5" /> الرابط: /p/{platform.slug}</p>
              {platform.owner_password && (
                <p className="mt-1 text-[11px] text-amber-300"><Lock className="inline h-3 w-3" /> كلمة سر المالك (احفظها): <code className="rounded bg-black/40 px-1.5 py-0.5">{platform.owner_password}</code></p>
              )}
            </Card>
          </motion.section>
        )}
      </AnimatePresence>

    </div>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white">{n}</span>{text}</div>;
}

function MiniStat({ icon: Icon, label, value }: any) {
  return <div className="rounded-xl border border-white/10 bg-black/25 p-3"><Icon className="mb-1 h-4 w-4 text-cyan-300" /><div className="text-[10px] text-slate-500">{label}</div><div className="truncate text-xs font-bold text-white">{value}</div></div>;
}

function inferPlatformType(text: string) {
  if (/بيع|متجر|اكل|أكل|منتج|طلب/.test(text)) return 'ecommerce';
  if (/حجز|موعد|ملعب|padel|بادل/.test(text)) return 'booking';
  if (/خدمة|استشارة|تركيب/.test(text)) return 'service';
  return 'landing';
}