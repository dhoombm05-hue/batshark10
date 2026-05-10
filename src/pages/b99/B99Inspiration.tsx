import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Lightbulb, TrendingUp, Sparkles, Layers, Search, Star, ArrowLeft, Palette, MousePointerClick, Smartphone, Globe2, Zap, Eye, ShoppingBag, Calendar, Users, Briefcase, GraduationCap, Stethoscope, Utensils, Dumbbell, Plane, Home as HomeIcon, Wand2 } from 'lucide-react';

/**
 * Inspiration & Self-Improvement Engine
 * — قاعدة بيانات ضخمة لكل نوع موقع، مع توقعات بصرية واقتراحات ذكية قابلة للتطبيق.
 */

type Suggestion = {
  title: string;
  detail: string;
  impact: 'عالي' | 'متوسط' | 'منخفض';
  area: string;
};

type Mockup = {
  title: string;
  hint: string;
  // CSS gradient + simple visual
  bg: string;
  pattern: 'cards' | 'split' | 'hero' | 'grid' | 'list';
};

type BizType = {
  key: string;
  name: string;
  icon: any;
  color: string;
  benchmarks: { label: string; v: string; sub: string }[];
  inspirations: { name: string; why: string; tags: string[] }[];
  suggestions: Suggestion[];
  mockups: Mockup[];
};

const DB: BizType[] = [
  {
    key: 'ecommerce', name: 'متجر إلكتروني', icon: ShoppingBag, color: 'from-amber-500 to-rose-500',
    benchmarks: [
      { label: 'وقت تحميل الصفحة', v: '< 1.8s', sub: 'Amazon/Shopify benchmark' },
      { label: 'معدل تحويل صحي', v: '2.5% – 4%', sub: 'متوسط القطاع' },
      { label: 'سلة مهجورة', v: '< 65%', sub: 'الأفضل في فئته' },
    ],
    inspirations: [
      { name: 'Apple Store', why: 'صور منتج عملاقة + تايبوغرافي نظيف + فيديو منتج 360°', tags: ['Hero ضخم', 'سرد بصري', 'حركة سلسة'] },
      { name: 'Allbirds', why: 'لوحة ألوان طبيعية، تركيز على القصة، سلة بنقرة واحدة', tags: ['Storytelling', 'Sustainability', 'One-click'] },
      { name: 'Aesop', why: 'تباعد مدروس، خط أنيق، صفحات منتج كقصيدة', tags: ['Editorial', 'Whitespace', 'Premium'] },
    ],
    suggestions: [
      { title: 'صور منتج 360° + Zoom', detail: 'أضف عرض دوار للمنتج وزووم بدقة عالية، يرفع معدل التحويل +28%', impact: 'عالي', area: 'صفحة منتج' },
      { title: 'Sticky Add-to-Cart', detail: 'زر إضافة للسلة يبقى ظاهراً عند التمرير على الموبايل', impact: 'عالي', area: 'تجربة موبايل' },
      { title: 'Cross-sell ذكي', detail: 'اقتراح "أضيف معه" بناءً على تحليل سلال العملاء — يرفع متوسط الطلب +18%', impact: 'متوسط', area: 'سلة' },
      { title: 'Trust badges + مراجعات', detail: 'شارات أمان الدفع + 5 مراجعات على الأقل بكل صفحة منتج', impact: 'عالي', area: 'ثقة' },
      { title: 'Checkout بخطوة واحدة', detail: 'دمج العنوان + الدفع + الملخص في صفحة واحدة', impact: 'عالي', area: 'دفع' },
    ],
    mockups: [
      { title: 'Hero مع منتج عائم', hint: 'صورة كبيرة، عنوان غامق، CTA ذهبي', bg: 'from-amber-200 to-rose-200', pattern: 'hero' },
      { title: 'شبكة منتجات أنيقة', hint: '3 أعمدة، ظل ناعم، Hover Reveal', bg: 'from-slate-100 to-slate-200', pattern: 'grid' },
      { title: 'Split: قصة + شراء', hint: 'نصف صورة، نصف نص + سعر', bg: 'from-stone-100 to-amber-100', pattern: 'split' },
    ],
  },
  {
    key: 'booking', name: 'حجوزات ومواعيد', icon: Calendar, color: 'from-cyan-500 to-blue-500',
    benchmarks: [
      { label: 'خطوات الحجز', v: '≤ 3 خطوات', sub: 'الأفضل في فئته' },
      { label: 'إلغاء قبل ساعتين', v: '< 8%', sub: 'صحي' },
      { label: 'إعادة حجز خلال شهر', v: '> 35%', sub: 'ولاء قوي' },
    ],
    inspirations: [
      { name: 'Calendly', why: 'تقويم فوري بنقرة، اختيار وقت بدون تسجيل', tags: ['Frictionless', 'Calendar-first'] },
      { name: 'OpenTable', why: 'نتائج فورية + تقييمات + خرائط', tags: ['Search', 'Reviews', 'Maps'] },
      { name: 'Booking.com', why: 'فلاتر قوية + نُدرة (متبقي 2 فقط) + صور حقيقية', tags: ['Urgency', 'Filters', 'Photos'] },
    ],
    suggestions: [
      { title: 'تقويم مرئي بألوان الإتاحة', detail: 'أخضر متاح، أصفر مزدحم، أحمر ممتلئ — بدل قوائم نصية', impact: 'عالي', area: 'UX' },
      { title: 'تذكير WhatsApp تلقائي', detail: 'قبل الموعد بساعة + رابط إعادة الجدولة بضغطة', impact: 'عالي', area: 'احتفاظ' },
      { title: 'حجز سريع من الإعلان', detail: 'رابط Deep-link يفتح وقت محدد جاهز للتأكيد', impact: 'متوسط', area: 'تسويق' },
    ],
    mockups: [
      { title: 'Hero بتقويم مدمج', hint: 'العنوان + اختر يوم/وقت في نفس الشاشة', bg: 'from-cyan-100 to-blue-200', pattern: 'hero' },
      { title: 'بطاقات الخدمة', hint: 'سعر + مدة + زر "احجز"', bg: 'from-sky-100 to-cyan-100', pattern: 'cards' },
    ],
  },
  {
    key: 'restaurant', name: 'مطعم / كافيه', icon: Utensils, color: 'from-rose-500 to-amber-500',
    benchmarks: [
      { label: 'صور قائمة الطعام', v: '> 80% من الأصناف', sub: 'الأفضل' },
      { label: 'وقت الإعداد', v: 'يظهر بوضوح', sub: 'يقلل الشكاوى 40%' },
    ],
    inspirations: [
      { name: 'Sweetgreen', why: 'بناء وجبة تفاعلي + ألوان طازجة', tags: ['Build-a-bowl', 'Fresh palette'] },
      { name: 'Chipotle', why: 'تطبيق بسيط + طلب مسبق + مكافآت', tags: ['Order-ahead', 'Loyalty'] },
    ],
    suggestions: [
      { title: 'صور احترافية لكل صنف', detail: 'صور علوية بإضاءة طبيعية + خلفية موحدة', impact: 'عالي', area: 'محتوى' },
      { title: 'منيو حسب الفئة + فلاتر', detail: 'نباتي / حار / صحي / حلا — يقلل وقت اتخاذ القرار', impact: 'متوسط', area: 'UX' },
      { title: 'برنامج ولاء بسيط', detail: 'كل 10 وجبات = وجبة مجانية + إشعار تلقائي', impact: 'عالي', area: 'احتفاظ' },
    ],
    mockups: [
      { title: 'Hero طعام دافئ', hint: 'صورة طبق + CTA "اطلب الآن"', bg: 'from-orange-100 to-rose-200', pattern: 'hero' },
      { title: 'منيو بصري', hint: 'شبكة صور + سعر + إضافة سريعة', bg: 'from-amber-100 to-orange-200', pattern: 'grid' },
    ],
  },
  {
    key: 'fitness', name: 'لياقة / نادي رياضي', icon: Dumbbell, color: 'from-emerald-500 to-cyan-500',
    benchmarks: [
      { label: 'معدل تجديد الاشتراك', v: '> 70%', sub: 'صحي' },
      { label: 'حضور أسبوعي', v: '≥ 3 مرات', sub: 'مؤشر ولاء' },
    ],
    inspirations: [
      { name: 'Equinox', why: 'تصوير سينمائي + تجربة Premium', tags: ['Cinematic', 'Premium'] },
      { name: 'ClassPass', why: 'حجز فصول من تطبيق واحد', tags: ['Multi-gym', 'Easy booking'] },
    ],
    suggestions: [
      { title: 'فيديوهات تمارين قصيرة', detail: '15-30 ثانية لكل تمرين، تشغل تلقائياً عند التمرير', impact: 'عالي', area: 'محتوى' },
      { title: 'تتبع تقدم العميل', detail: 'لوحة شخصية تعرض الحضور والتقدم — يرفع الاحتفاظ +25%', impact: 'عالي', area: 'احتفاظ' },
    ],
    mockups: [
      { title: 'Hero فيديو ديناميكي', hint: 'فيديو خلفية + شعار + CTA كبير', bg: 'from-emerald-200 to-cyan-200', pattern: 'hero' },
    ],
  },
  {
    key: 'service', name: 'منصة خدمات', icon: Briefcase, color: 'from-violet-500 to-fuchsia-500',
    benchmarks: [
      { label: 'وقت الرد على طلب', v: '< 4 ساعات', sub: 'يرفع الحجز 3×' },
      { label: 'مراجعات بـ 5 نجوم', v: '> 75%', sub: 'هدف' },
    ],
    inspirations: [
      { name: 'Fiverr', why: 'بطاقات خدمة موحدة + سعر بادئ + تقييم', tags: ['Cards', 'Starting price', 'Reviews'] },
      { name: 'Thumbtack', why: 'مطابقة ذكية + عرض أسعار', tags: ['Matching', 'Quotes'] },
    ],
    suggestions: [
      { title: 'باقات بثلاث مستويات', detail: 'Basic / Pro / Premium — يبسّط القرار ويرفع الـAOV', impact: 'عالي', area: 'تسعير' },
      { title: 'نموذج طلب ذكي', detail: '5 أسئلة فقط، يولّد عرض سعر تلقائي', impact: 'متوسط', area: 'تحويل' },
    ],
    mockups: [
      { title: 'Split Hero خدمة', hint: 'نص + صورة عمل سابق', bg: 'from-violet-200 to-fuchsia-200', pattern: 'split' },
      { title: '3 باقات سعرية', hint: 'بطاقة وسطى مميزة بلون', bg: 'from-violet-100 to-purple-200', pattern: 'cards' },
    ],
  },
  {
    key: 'community', name: 'مجتمع / مدونة', icon: Users, color: 'from-fuchsia-500 to-pink-500',
    benchmarks: [
      { label: 'أعضاء نشطين شهرياً', v: '> 30%', sub: 'مؤشر صحة' },
      { label: 'مدة الجلسة', v: '> 4 دقائق', sub: 'محتوى جذّاب' },
    ],
    inspirations: [
      { name: 'Substack', why: 'تركيز على القراءة + اشتراك بضغطة', tags: ['Reading-first', 'Subscription'] },
      { name: 'Discord', why: 'قنوات + أدوار + هوية مرئية', tags: ['Channels', 'Roles'] },
    ],
    suggestions: [
      { title: 'صفحة كاتب احترافية', detail: 'سيرة + كل المقالات + اشتراك مباشر', impact: 'متوسط', area: 'محتوى' },
      { title: 'إشعارات RSS + Email', detail: 'لكل قسم اشتراك مستقل', impact: 'متوسط', area: 'احتفاظ' },
    ],
    mockups: [
      { title: 'List مقالات', hint: 'صورة + عنوان + كاتب + وقت قراءة', bg: 'from-pink-100 to-fuchsia-200', pattern: 'list' },
    ],
  },
  {
    key: 'startup', name: 'شركة ناشئة / SaaS', icon: Sparkles, color: 'from-indigo-500 to-violet-500',
    benchmarks: [
      { label: 'Trial → Paid', v: '> 25%', sub: 'صحي' },
      { label: 'Time-to-Value', v: '< 5 دقائق', sub: 'الأفضل' },
    ],
    inspirations: [
      { name: 'Linear', why: 'تايبوغرافي + موشن دقيق + Dark mode', tags: ['Typography', 'Motion', 'Dark'] },
      { name: 'Stripe', why: 'وثائق + أمثلة كود حية', tags: ['Docs', 'Live demos'] },
      { name: 'Notion', why: 'منتج تفاعلي في الصفحة الأولى', tags: ['Product-led', 'Interactive'] },
    ],
    suggestions: [
      { title: 'Demo تفاعلي بدون تسجيل', detail: 'يجرب المنتج فوراً + يحفظ تقدمه عند التسجيل', impact: 'عالي', area: 'تحويل' },
      { title: 'Logos عملاء + شهادات', detail: 'أعلى الصفحة + بطاقات مقتطفات', impact: 'متوسط', area: 'ثقة' },
      { title: 'Pricing مقارن وشفاف', detail: 'جدول مقارنة + FAQ + ضمان استرجاع', impact: 'عالي', area: 'تسعير' },
    ],
    mockups: [
      { title: 'Hero عنوان غامق', hint: 'عنوان عملاق + sub + CTA + screenshot', bg: 'from-indigo-100 to-violet-200', pattern: 'hero' },
      { title: 'Logo cloud', hint: 'شعارات عملاء بصف واحد', bg: 'from-slate-100 to-indigo-100', pattern: 'list' },
    ],
  },
  {
    key: 'education', name: 'تعليم / كورسات', icon: GraduationCap, color: 'from-blue-500 to-cyan-500',
    benchmarks: [
      { label: 'إكمال الكورس', v: '> 60%', sub: 'هدف' },
      { label: 'تقييم بعد الكورس', v: '> 4.5/5', sub: 'تميّز' },
    ],
    inspirations: [
      { name: 'Coursera', why: 'مسارات منظمة + شهادات + مدرسون معروفون', tags: ['Paths', 'Certificates'] },
      { name: 'MasterClass', why: 'إنتاج سينمائي + خبراء عالميون', tags: ['Cinematic', 'Experts'] },
    ],
    suggestions: [
      { title: 'مقدمة فيديو لكل كورس', detail: '60-90 ثانية تعرض المدرس والمحتوى', impact: 'عالي', area: 'تحويل' },
      { title: 'مسارات تعليمية', detail: 'اربط الكورسات في رحلة واحدة', impact: 'متوسط', area: 'محتوى' },
    ],
    mockups: [
      { title: 'بطاقات كورس', hint: 'صورة + مدرس + مدة + سعر', bg: 'from-blue-100 to-cyan-200', pattern: 'cards' },
    ],
  },
];

const ALL_TYPES = DB;

export default function B99Inspiration() {
  const [active, setActive] = useState<BizType>(DB[0]);
  const [q, setQ] = useState('');

  useEffect(() => { document.title = 'محرك الإلهام والتطوير الذاتي — بات شارك 99'; }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return ALL_TYPES;
    const t = q.trim().toLowerCase();
    return ALL_TYPES.filter(b => b.name.includes(q) || b.key.includes(t));
  }, [q]);

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/80 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,hsl(45_90%_55%/0.18),transparent_40%),radial-gradient(circle_at_85%_5%,hsl(280_90%_55%/0.18),transparent_40%)]" />
        <div className="relative">
          <Badge className="mb-2 border-white/20 bg-white/10 text-white">Self-Improvement Engine</Badge>
          <h1 className="flex items-center gap-2 text-2xl md:text-4xl font-black">
            <Lightbulb className="w-7 h-7 text-amber-300" /> محرك الإلهام والتطوير الذاتي
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200 leading-relaxed">
            قاعدة بيانات حيّة لكل نوع موقع — تحليل أفضل المنصات العالمية، توصيات قابلة للتطبيق، وتوقعات بصرية لشكل موقعك بعد التطوير.
            اختر نوع عملك وستحصل على خطة تحسين كاملة.
          </p>
          <div className="mt-4 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في أنواع الأعمال..." className="bg-slate-950/70 border-white/15 text-white pr-10" />
            </div>
          </div>
        </div>
      </header>

      {/* Types selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {filtered.map(t => (
          <button key={t.key} onClick={() => setActive(t)}
            className={`group relative p-3 rounded-2xl border transition-all overflow-hidden text-right ${active.key === t.key ? 'border-amber-400/60 bg-amber-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/30'}`}>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-2 shadow-lg`}>
              <t.icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm font-black text-white">{t.name}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{t.suggestions.length} توصية · {t.inspirations.length} مرجع</div>
          </button>
        ))}
      </div>

      {/* Active type detail */}
      <AnimatePresence mode="wait">
        <motion.div key={active.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <Card className="border-white/15 bg-slate-950/70 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${active.color} flex items-center justify-center shadow-lg`}>
                <active.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-[11px] tracking-wider text-amber-300 font-black">BUSINESS TYPE</div>
                <h2 className="text-2xl font-black text-white">{active.name}</h2>
              </div>
            </div>

            <Tabs defaultValue="suggestions">
              <TabsList className="bg-slate-900/80 border border-white/10 flex-wrap h-auto">
                <TabsTrigger value="suggestions" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-amber-500 data-[state=active]:to-rose-500 data-[state=active]:text-white gap-1">
                  <Wand2 className="w-4 h-4" /> توصيات قابلة للتطبيق
                </TabsTrigger>
                <TabsTrigger value="mockups" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-cyan-500 data-[state=active]:to-violet-500 data-[state=active]:text-white gap-1">
                  <Palette className="w-4 h-4" /> توقعات بصرية
                </TabsTrigger>
                <TabsTrigger value="inspirations" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white gap-1">
                  <Star className="w-4 h-4" /> مراجع عالمية
                </TabsTrigger>
                <TabsTrigger value="benchmarks" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white gap-1">
                  <TrendingUp className="w-4 h-4" /> معايير الأداء
                </TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {active.suggestions.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-4 hover:border-amber-400/40 transition">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge className={`${s.impact === 'عالي' ? 'bg-rose-500/20 text-rose-200 border-rose-400/30' : s.impact === 'متوسط' ? 'bg-amber-500/20 text-amber-200 border-amber-400/30' : 'bg-slate-500/20 text-slate-200 border-slate-400/30'} text-[10px] font-black border`}>
                        أثر {s.impact}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-bold">{s.area}</span>
                    </div>
                    <h3 className="text-sm font-black text-white mb-1">{s.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{s.detail}</p>
                    <Button size="sm" className="mt-3 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 border border-amber-400/30 gap-1 h-8 text-xs">
                      <Sparkles className="w-3 h-3" /> طبّق على موقعي
                    </Button>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="mockups" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {active.mockups.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="rounded-2xl border border-white/10 overflow-hidden bg-slate-950/50">
                      <div className={`h-44 bg-gradient-to-br ${m.bg} relative overflow-hidden`}>
                        <MockupRender pattern={m.pattern} />
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-black text-white">{m.title}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{m.hint}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <Lightbulb className="inline w-4 h-4 ml-1" /> هذه توقعات بصرية مبنية على أفضل ممارسات قطاع <b>{active.name}</b>. اختر النمط الأقرب لرؤيتك واطلب من بات شارك تطبيقه.
                </div>
              </TabsContent>

              <TabsContent value="inspirations" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {active.inspirations.map((insp, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <h3 className="text-base font-black text-white">{insp.name}</h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-2">{insp.why}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {insp.tags.map((t, j) => <Badge key={j} variant="outline" className="border-white/15 bg-white/5 text-[10px] text-slate-200">{t}</Badge>)}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="benchmarks" className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {active.benchmarks.map((b, i) => (
                  <Card key={i} className="border-emerald-400/20 bg-emerald-500/5 p-4 text-center">
                    <div className="text-[11px] text-emerald-300 font-bold mb-1">{b.label}</div>
                    <div className="text-3xl font-black text-white">{b.v}</div>
                    <div className="text-[10px] text-slate-300 mt-1">{b.sub}</div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      </AnimatePresence>

      <Card className="border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-white">جاهز لتطبيق التوصيات على موقعك؟</h3>
          <p className="text-xs text-slate-200 mt-1">انتقل إلى Platform Studio واطلب التحسينات مباشرة.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black gap-2">
          <a href="/b99/platforms"><Sparkles className="w-4 h-4" /> ابدأ التطوير <ArrowLeft className="w-4 h-4" /></a>
        </Button>
      </Card>
    </div>
  );
}

function MockupRender({ pattern }: { pattern: Mockup['pattern'] }) {
  const block = 'bg-white/80 rounded shadow-sm';
  if (pattern === 'hero') return (
    <div className="absolute inset-0 p-4 flex flex-col">
      <div className="h-3 w-24 bg-white/70 rounded mb-3" />
      <div className="h-6 w-3/4 bg-white rounded mb-2" />
      <div className="h-3 w-1/2 bg-white/70 rounded mb-4" />
      <div className="h-7 w-28 bg-slate-900/80 rounded-lg" />
      <div className="absolute right-4 bottom-4 w-20 h-20 bg-white rounded-2xl shadow-lg" />
    </div>
  );
  if (pattern === 'split') return (
    <div className="absolute inset-0 p-4 flex gap-3">
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-24 bg-white/70 rounded" />
        <div className="h-5 w-full bg-white rounded" />
        <div className="h-3 w-3/4 bg-white/70 rounded" />
        <div className="h-7 w-24 bg-slate-900/80 rounded-lg mt-auto" />
      </div>
      <div className="w-1/2 bg-white/80 rounded-xl shadow" />
    </div>
  );
  if (pattern === 'grid') return (
    <div className="absolute inset-0 p-3 grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`${block} h-full`} />
      ))}
    </div>
  );
  if (pattern === 'cards') return (
    <div className="absolute inset-0 p-3 flex gap-2 items-stretch">
      {[0,1,2].map(i => (
        <div key={i} className={`${block} flex-1 ${i === 1 ? 'scale-105 shadow-md ring-2 ring-slate-900/30' : ''}`} />
      ))}
    </div>
  );
  // list
  return (
    <div className="absolute inset-0 p-3 flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-2 items-center">
          <div className="w-10 h-10 bg-white/80 rounded-lg" />
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-2.5 w-3/4 bg-white/80 rounded" />
            <div className="h-2 w-1/2 bg-white/60 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
