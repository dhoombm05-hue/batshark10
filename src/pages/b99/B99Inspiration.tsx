import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Lightbulb, TrendingUp, Sparkles, Layers, Search, Star, ArrowLeft, Palette,
  Smartphone, Zap, ShoppingBag, Calendar, Users, Briefcase, GraduationCap,
  Utensils, Dumbbell, Wand2, Rocket, Target, Gauge, CheckCircle2, FileCode2,
} from 'lucide-react';

type Suggestion = { title: string; detail: string; impact: 'عالي' | 'متوسط' | 'منخفض'; area: string };
type Mockup = { title: string; hint: string; pattern: 'cards' | 'split' | 'hero' | 'grid' | 'list' };
type BizType = {
  key: string; name: string; icon: any;
  benchmarks: { label: string; v: string; sub: string }[];
  inspirations: { name: string; why: string; tags: string[] }[];
  suggestions: Suggestion[];
  mockups: Mockup[];
};

const DB: BizType[] = [
  { key: 'ecommerce', name: 'متجر إلكتروني', icon: ShoppingBag,
    benchmarks: [
      { label: 'وقت التحميل', v: '< 1.8s', sub: 'Amazon/Shopify' },
      { label: 'معدل التحويل', v: '2.5–4%', sub: 'صحي' },
      { label: 'سلة مهجورة', v: '< 65%', sub: 'الأفضل' },
    ],
    inspirations: [
      { name: 'Apple Store', why: 'صور منتج عملاقة + تايبوغرافي نظيف', tags: ['Hero ضخم', 'سرد بصري'] },
      { name: 'Allbirds', why: 'لوحة طبيعية، قصة، سلة بنقرة', tags: ['Storytelling', 'One-click'] },
      { name: 'Aesop', why: 'تباعد مدروس، خط أنيق', tags: ['Editorial', 'Premium'] },
    ],
    suggestions: [
      { title: 'صور 360° + Zoom', detail: 'يرفع التحويل +28%', impact: 'عالي', area: 'منتج' },
      { title: 'Sticky Add-to-Cart', detail: 'زر إضافة ثابت بالموبايل', impact: 'عالي', area: 'موبايل' },
      { title: 'Cross-sell ذكي', detail: 'أضيف معه — يرفع AOV +18%', impact: 'متوسط', area: 'سلة' },
      { title: 'Trust badges + مراجعات', detail: '5 مراجعات بكل صفحة', impact: 'عالي', area: 'ثقة' },
      { title: 'Checkout بخطوة', detail: 'دمج العنوان + الدفع', impact: 'عالي', area: 'دفع' },
    ],
    mockups: [
      { title: 'Hero مع منتج عائم', hint: 'صورة كبيرة + CTA', pattern: 'hero' },
      { title: 'شبكة منتجات', hint: '3 أعمدة، Hover Reveal', pattern: 'grid' },
      { title: 'Split: قصة + شراء', hint: 'نصف صورة، نصف نص', pattern: 'split' },
    ] },
  { key: 'booking', name: 'حجوزات', icon: Calendar,
    benchmarks: [
      { label: 'خطوات الحجز', v: '≤ 3', sub: 'الأفضل' },
      { label: 'إعادة حجز', v: '> 35%', sub: 'ولاء قوي' },
    ],
    inspirations: [
      { name: 'Calendly', why: 'تقويم فوري بنقرة', tags: ['Frictionless'] },
      { name: 'OpenTable', why: 'نتائج + تقييمات + خرائط', tags: ['Search', 'Maps'] },
      { name: 'Booking.com', why: 'فلاتر + نُدرة + صور', tags: ['Urgency', 'Filters'] },
    ],
    suggestions: [
      { title: 'تقويم بألوان الإتاحة', detail: 'بدل قوائم نصية', impact: 'عالي', area: 'UX' },
      { title: 'تذكير WhatsApp', detail: 'قبل بساعة + جدولة', impact: 'عالي', area: 'احتفاظ' },
    ],
    mockups: [
      { title: 'Hero بتقويم مدمج', hint: 'اختر يوم في نفس الشاشة', pattern: 'hero' },
      { title: 'بطاقات الخدمة', hint: 'سعر + مدة + احجز', pattern: 'cards' },
    ] },
  { key: 'restaurant', name: 'مطعم', icon: Utensils,
    benchmarks: [{ label: 'صور القائمة', v: '> 80%', sub: 'الأفضل' }],
    inspirations: [
      { name: 'Sweetgreen', why: 'بناء وجبة تفاعلي', tags: ['Build-a-bowl'] },
      { name: 'Chipotle', why: 'طلب مسبق + مكافآت', tags: ['Order-ahead'] },
    ],
    suggestions: [
      { title: 'صور احترافية', detail: 'علوية بإضاءة طبيعية', impact: 'عالي', area: 'محتوى' },
      { title: 'فلاتر منيو', detail: 'نباتي/حار/صحي', impact: 'متوسط', area: 'UX' },
    ],
    mockups: [{ title: 'Hero طعام دافئ', hint: 'طبق + اطلب الآن', pattern: 'hero' }] },
  { key: 'fitness', name: 'نادي رياضي', icon: Dumbbell,
    benchmarks: [{ label: 'تجديد الاشتراك', v: '> 70%', sub: 'صحي' }],
    inspirations: [
      { name: 'Equinox', why: 'سينمائي + Premium', tags: ['Cinematic'] },
      { name: 'ClassPass', why: 'حجز فصول من تطبيق', tags: ['Easy booking'] },
    ],
    suggestions: [
      { title: 'فيديوهات تمارين قصيرة', detail: '15-30 ثانية تلقائياً', impact: 'عالي', area: 'محتوى' },
      { title: 'تتبع تقدم العميل', detail: 'لوحة شخصية للحضور', impact: 'عالي', area: 'احتفاظ' },
    ],
    mockups: [{ title: 'Hero فيديو ديناميكي', hint: 'فيديو خلفية + CTA', pattern: 'hero' }] },
  { key: 'service', name: 'خدمات', icon: Briefcase,
    benchmarks: [{ label: 'وقت الرد', v: '< 4 ساعات', sub: 'يرفع الحجز 3×' }],
    inspirations: [
      { name: 'Fiverr', why: 'بطاقات + سعر بادئ + تقييم', tags: ['Cards'] },
      { name: 'Thumbtack', why: 'مطابقة ذكية + عروض', tags: ['Matching'] },
    ],
    suggestions: [
      { title: '٣ باقات', detail: 'Basic/Pro/Premium', impact: 'عالي', area: 'تسعير' },
      { title: 'نموذج طلب ذكي', detail: '5 أسئلة + عرض تلقائي', impact: 'متوسط', area: 'تحويل' },
    ],
    mockups: [{ title: '3 باقات سعرية', hint: 'بطاقة وسطى مميزة', pattern: 'cards' }] },
  { key: 'community', name: 'مجتمع/مدونة', icon: Users,
    benchmarks: [{ label: 'نشطين شهرياً', v: '> 30%', sub: 'صحة' }],
    inspirations: [
      { name: 'Substack', why: 'تركيز على القراءة', tags: ['Reading-first'] },
      { name: 'Discord', why: 'قنوات + أدوار', tags: ['Channels'] },
    ],
    suggestions: [{ title: 'صفحة كاتب', detail: 'سيرة + اشتراك', impact: 'متوسط', area: 'محتوى' }],
    mockups: [{ title: 'List مقالات', hint: 'صورة + عنوان + وقت', pattern: 'list' }] },
  { key: 'startup', name: 'SaaS', icon: Sparkles,
    benchmarks: [{ label: 'Trial → Paid', v: '> 25%', sub: 'صحي' }],
    inspirations: [
      { name: 'Linear', why: 'تايبوغرافي + موشن دقيق', tags: ['Motion'] },
      { name: 'Stripe', why: 'وثائق + أمثلة حية', tags: ['Docs'] },
    ],
    suggestions: [
      { title: 'Demo تفاعلي', detail: 'يجرب فوراً بدون تسجيل', impact: 'عالي', area: 'تحويل' },
      { title: 'Logos عملاء', detail: 'أعلى الصفحة', impact: 'متوسط', area: 'ثقة' },
    ],
    mockups: [{ title: 'Hero عنوان غامق', hint: 'عملاق + sub + CTA', pattern: 'hero' }] },
  { key: 'education', name: 'كورسات', icon: GraduationCap,
    benchmarks: [{ label: 'إكمال الكورس', v: '> 60%', sub: 'هدف' }],
    inspirations: [
      { name: 'Coursera', why: 'مسارات + شهادات', tags: ['Paths'] },
      { name: 'MasterClass', why: 'إنتاج سينمائي', tags: ['Cinematic'] },
    ],
    suggestions: [{ title: 'مقدمة فيديو 60 ثانية', detail: 'لكل كورس', impact: 'عالي', area: 'تحويل' }],
    mockups: [{ title: 'بطاقات كورس', hint: 'صورة + مدرس + سعر', pattern: 'cards' }] },
];

export default function B99Inspiration() {
  const [active, setActive] = useState<BizType>(DB[0]);
  const [q, setQ] = useState('');

  useEffect(() => { document.title = 'محرك الإلهام — بات شارك 99'; }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return DB;
    return DB.filter(b => b.name.includes(q) || b.key.includes(q.toLowerCase()));
  }, [q]);

  return (
    <div dir="rtl" className="space-y-6 text-black">
      {/* HEADER — B/W with blue accent */}
      <Card className="border-2 border-black bg-white p-6 rounded-none shadow-[6px_6px_0_0_#000]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="mb-2 bg-blue-600 text-white border-0 text-[10px] tracking-[0.2em] font-black rounded-none">SELF-IMPROVEMENT ENGINE</Badge>
            <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-black text-black">
              <Lightbulb className="w-7 h-7 text-blue-600" /> محرك الإلهام والتطوير
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-black/70 leading-relaxed font-medium">
              قاعدة بيانات حيّة لكل نوع موقع — تحليل أفضل المنصات، توصيات قابلة للتطبيق، وتوقعات بصرية.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في أنواع الأعمال..."
              className="bg-white border-2 border-black text-black pr-10 rounded-none h-11 font-medium" />
          </div>
        </div>
      </Card>

      {/* Types grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {filtered.map(t => {
          const isActive = active.key === t.key;
          return (
            <button key={t.key} onClick={() => setActive(t)}
              className={`group p-4 text-right border-2 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-[4px_4px_0_0_#000]'
                  : 'bg-white text-black border-black hover:shadow-[3px_3px_0_0_#000]'
              }`}>
              <div className={`w-10 h-10 flex items-center justify-center mb-2 border-2 ${isActive ? 'bg-white border-white text-blue-600' : 'bg-black border-black text-white'}`}>
                <t.icon className="w-5 h-5" />
              </div>
              <div className="text-sm font-black">{t.name}</div>
              <div className={`text-[10px] mt-0.5 ${isActive ? 'text-white/80' : 'text-black/60'}`}>
                {t.suggestions.length} توصية · {t.inspirations.length} مرجع
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={active.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          <Card className="border-2 border-black bg-white p-5 rounded-none shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-black">
              <div className="w-12 h-12 bg-blue-600 text-white border-2 border-black flex items-center justify-center">
                <active.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] tracking-[0.25em] text-blue-600 font-black">BUSINESS TYPE</div>
                <h2 className="text-2xl font-black text-black">{active.name}</h2>
              </div>
            </div>

            <Tabs defaultValue="transformation">
              <TabsList className="bg-white border-2 border-black h-auto flex-wrap gap-1 p-1 rounded-none">
                {[
                  { v: 'transformation', i: Rocket, l: 'خطة التحوّل' },
                  { v: 'suggestions', i: Wand2, l: 'توصيات' },
                  { v: 'mockups', i: Palette, l: 'توقعات بصرية' },
                  { v: 'inspirations', i: Star, l: 'مراجع' },
                  { v: 'benchmarks', i: TrendingUp, l: 'معايير' },
                ].map(t => (
                  <TabsTrigger key={t.v} value={t.v}
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black font-black gap-1 rounded-none px-3 py-2">
                    <t.i className="w-4 h-4" /> {t.l}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="transformation" className="mt-5">
                <TransformationPlan biz={active} />
              </TabsContent>

              <TabsContent value="suggestions" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {active.suggestions.map((s, i) => {
                  const tone = s.impact === 'عالي' ? 'bg-red-600' : s.impact === 'متوسط' ? 'bg-blue-600' : 'bg-black';
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="border-2 border-black bg-white p-4 hover:shadow-[3px_3px_0_0_#000] transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`${tone} text-white border-0 rounded-none text-[10px] font-black`}>أثر {s.impact}</Badge>
                        <span className="text-[10px] text-black/60 font-bold">{s.area}</span>
                      </div>
                      <h3 className="text-sm font-black text-black mb-1">{s.title}</h3>
                      <p className="text-xs text-black/70 leading-relaxed">{s.detail}</p>
                      <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-700 text-white border-2 border-black rounded-none gap-1 h-8 text-xs font-bold">
                        <Sparkles className="w-3 h-3" /> طبّق على موقعي
                      </Button>
                    </motion.div>
                  );
                })}
              </TabsContent>

              <TabsContent value="mockups" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {active.mockups.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="border-2 border-black overflow-hidden bg-white">
                      <div className="h-44 bg-white border-b-2 border-black relative">
                        <MockupRender pattern={m.pattern} />
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-black text-black">{m.title}</div>
                        <div className="text-[11px] text-black/60 mt-0.5">{m.hint}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="inspirations" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {active.inspirations.map((insp, i) => (
                  <div key={i} className="border-2 border-black bg-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                      <h3 className="text-base font-black text-black">{insp.name}</h3>
                    </div>
                    <p className="text-xs text-black/70 leading-relaxed mb-2">{insp.why}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {insp.tags.map((t, j) => <Badge key={j} className="border-2 border-black bg-white text-[10px] text-black rounded-none font-bold">{t}</Badge>)}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="benchmarks" className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {active.benchmarks.map((b, i) => (
                  <div key={i} className="border-2 border-black bg-white p-4 text-center">
                    <div className="text-[11px] text-blue-600 font-black mb-1">{b.label}</div>
                    <div className="text-3xl font-black text-black">{b.v}</div>
                    <div className="text-[10px] text-black/60 mt-1">{b.sub}</div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      </AnimatePresence>

      <Card className="border-2 border-black bg-black text-white p-5 flex flex-wrap items-center justify-between gap-4 rounded-none">
        <div>
          <h3 className="text-lg font-black">جاهز لتطبيق التوصيات على موقعك؟</h3>
          <p className="text-xs text-white/70 mt-1">انتقل لاستوديو المنصات ونفّذ التحوّل مباشرة.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-white rounded-none font-black gap-2">
          <a href="/b99/platforms"><Sparkles className="w-4 h-4" /> ابدأ التطوير <ArrowLeft className="w-4 h-4" /></a>
        </Button>
      </Card>
    </div>
  );
}

function MockupRender({ pattern }: { pattern: Mockup['pattern'] }) {
  const block = 'bg-black/10 border border-black/30';
  if (pattern === 'hero') return (
    <div className="absolute inset-0 p-4 flex flex-col">
      <div className="h-3 w-24 bg-black/30 mb-3" />
      <div className="h-6 w-3/4 bg-black mb-2" />
      <div className="h-3 w-1/2 bg-black/40 mb-4" />
      <div className="h-7 w-28 bg-blue-600" />
      <div className="absolute right-4 bottom-4 w-20 h-20 bg-black/10 border-2 border-black" />
    </div>
  );
  if (pattern === 'split') return (
    <div className="absolute inset-0 p-4 flex gap-3">
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-24 bg-black/30" />
        <div className="h-5 w-full bg-black" />
        <div className="h-3 w-3/4 bg-black/40" />
        <div className="h-7 w-24 bg-blue-600 mt-auto" />
      </div>
      <div className="w-1/2 bg-black/15 border-2 border-black" />
    </div>
  );
  if (pattern === 'grid') return (
    <div className="absolute inset-0 p-3 grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`${block} h-full`} />)}
    </div>
  );
  if (pattern === 'cards') return (
    <div className="absolute inset-0 p-3 flex gap-2 items-stretch">
      {[0,1,2].map(i => (
        <div key={i} className={`${block} flex-1 ${i === 1 ? 'bg-blue-600/20 border-blue-600 border-2' : ''}`} />
      ))}
    </div>
  );
  return (
    <div className="absolute inset-0 p-3 flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-2 items-center">
          <div className="w-10 h-10 bg-black/15 border border-black/30" />
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-2.5 w-3/4 bg-black/40" />
            <div className="h-2 w-1/2 bg-black/25" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TransformationPlan({ biz }: { biz: BizType }) {
  const steps = [
    { icon: Target, title: '١. التشخيص', detail: `نحلل موقعك الحالي مقابل أفضل ${biz.inspirations.length} منصات عالمية في "${biz.name}"، ونحدد الفجوات في UX والأداء والمحتوى.` },
    { icon: Palette, title: '٢. الهوية البصرية', detail: `سنطبّق لوحة ألوان متناسقة مستوحاة من ${biz.inspirations[0]?.name || 'الأفضل'}، مع تايبوغرافي محترف.` },
    { icon: Layers, title: '٣. إعادة هيكلة', detail: `سنحوّل الرئيسية إلى نمط (${biz.mockups[0]?.title || 'Hero قوي'})، الزائر يصل للهدف خلال ٣ نقرات.` },
    { icon: Zap, title: '٤. تطبيق التوصيات', detail: `سنفعّل ${biz.suggestions.length} توصية — منها ${biz.suggestions.filter(s => s.impact === 'عالي').length} عالية الأثر.` },
    { icon: Smartphone, title: '٥. تجربة Mobile-First', detail: 'CTA ثابت، تحميل سريع، تفاعلات ناعمة بدون قفزات.' },
    { icon: Gauge, title: '٦. الأداء والقياس', detail: `أداء يصل لـ ${biz.benchmarks[0]?.v || 'معيار القطاع'} + لوحة قياس حية.` },
  ];

  const high = biz.suggestions.filter(s => s.impact === 'عالي').length;
  const cLift = 12 + high * 6;
  const sLift = 30 + biz.suggestions.length * 3;
  const rLift = 10 + Math.round(biz.inspirations.length * 4);

  return (
    <div className="space-y-5">
      <div className="border-2 border-black bg-blue-600 text-white p-5">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-5 h-5" />
          <h3 className="text-lg font-black">شرح كامل: كيف سيتحوّل موقعك؟</h3>
        </div>
        <p className="text-sm leading-relaxed">
          بناءً على نوع عملك <b>"{biz.name}"</b> — خطة تحوّل كاملة من الشكل الحالي إلى موقع بمستوى منافسي القطاع العالميين،
          مع توقّعات رقمية واقعية لما سيتغيّر بصرياً وتقنياً وتسويقياً.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        <Card className="border-2 border-black bg-white p-4 rounded-none">
          <Badge className="bg-red-600 text-white border-0 rounded-none text-[10px] font-black mb-2">قبل</Badge>
          <h4 className="text-sm font-black text-black mb-2">الموقع الحالي</h4>
          <ul className="text-xs text-black/80 space-y-1.5 list-disc pr-4 leading-relaxed font-medium">
            <li>هوية بصرية مشتّتة، ألوان غير متناسقة</li>
            <li>صفحة رئيسية عامة بدون CTA واضح</li>
            <li>تجربة موبايل ضعيفة، تحميل بطيء</li>
            <li>لا يوجد دليل اجتماعي</li>
            <li>تدفّق بـ ٥+ نقرات</li>
          </ul>
        </Card>
        <div className="hidden md:flex items-center justify-center text-black">
          <ArrowLeft className="w-10 h-10" />
        </div>
        <Card className="border-2 border-black bg-green-600 text-white p-4 rounded-none">
          <Badge className="bg-white text-green-700 border-0 rounded-none text-[10px] font-black mb-2">بعد</Badge>
          <h4 className="text-sm font-black mb-2">موقعك المُحوّل</h4>
          <ul className="text-xs space-y-1.5 list-disc pr-4 leading-relaxed font-medium">
            <li>هوية متماسكة بنمط <b>{biz.inspirations[0]?.name || 'عالمي'}</b></li>
            <li>Hero قوي يوصل لقرار الشراء بنقرتين</li>
            <li>Mobile-First بسرعة {biz.benchmarks[0]?.v || '< 2s'}</li>
            <li>دليل اجتماعي بكل صفحة</li>
            <li>تدفّق بثلاث نقرات أو أقل</li>
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiDelta label="معدل التحويل" delta={`+${cLift}%`} hint="خلال 30-60 يوم" color="green" />
        <KpiDelta label="سرعة التحميل" delta={`-${sLift}%`} hint="زمن أول محتوى" color="blue" />
        <KpiDelta label="معدل الاحتفاظ" delta={`+${rLift}%`} hint="عودة خلال أسبوع" color="red" />
      </div>

      <div>
        <h4 className="text-sm font-black text-black mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" /> ٦ خطوات تنفّذ تلقائياً
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="border-2 border-black bg-white p-4 hover:shadow-[3px_3px_0_0_#000] transition-shadow">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 bg-blue-600 text-white border-2 border-black flex items-center justify-center">
                  <s.icon className="w-4 h-4" />
                </div>
                <h5 className="text-sm font-black text-black">{s.title}</h5>
              </div>
              <p className="text-xs text-black/75 leading-relaxed font-medium">{s.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <Card className="border-2 border-black bg-white p-4 rounded-none">
        <h4 className="text-sm font-black text-black mb-3 flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-blue-600" /> ما الذي ستحصل عليه فعلياً
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-black font-medium">
          {[
            'تطبيق نمط الـHero الجديد',
            `${biz.mockups.length} نمط بصري للتبديل بنقرة`,
            `${biz.suggestions.length} توصية مفعّلة + سجل تنفيذ`,
            'هوية ألوان وتايبوغرافي موحّدة',
            'بنية Mobile-First + تحسين سرعة',
            'لوحة قياس مؤشرات حيّة',
            'تحديث تلقائي شهري',
            'نسخة احتياطية قبل كل تحوّل',
          ].map((d, i) => (
            <div key={i} className="flex items-start gap-2 border-2 border-black px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{d}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function KpiDelta({ label, delta, hint, color }: { label: string; delta: string; hint: string; color: 'green' | 'blue' | 'red' }) {
  const bg = color === 'green' ? 'bg-green-600' : color === 'blue' ? 'bg-blue-600' : 'bg-red-600';
  return (
    <div className={`border-2 border-black ${bg} text-white p-4`}>
      <div className="text-[11px] font-black tracking-wider uppercase opacity-90">{label}</div>
      <div className="text-3xl font-black mt-1">{delta}</div>
      <div className="text-[11px] mt-1 opacity-90">{hint}</div>
    </div>
  );
}
