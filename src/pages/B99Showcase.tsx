import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Sparkles, Plug, Bot, Check, Star, ShieldCheck, Globe2, Zap, Megaphone, Search, LayoutDashboard, LogIn, Play, BarChart3, Bell, MessageSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import logo from '@/assets/batshark-logo-official.png';

const PACKAGES = [
  {
    id: 1, level: 'level/1', icon: Sparkles, name: 'البناء من الصفر', tagline: 'منصتك الرقمية تُولد هنا',
    price: 100, period: 'اشتراك تأسيس', highlight: false, color: 'from-cyan-400 to-blue-500',
    features: [
      'محرك أسئلة ذكي يبني الهوية والمحتوى',
      'مكتبة إلهام بصري بصور حية لمنصات عالمية',
      'تصميم واجهات ولوحة تحكم احترافية',
      'إعداد القاعدة التقنية والاستضافة الكاملة',
      'تكامل مع منظومة بات شارك التحليلية',
    ],
  },
  {
    id: 2, level: 'level/2', icon: Plug, name: 'تعزيز موقعك الحالي', tagline: 'ربط احترافي + قوة بات شارك',
    price: 250, period: 'باقة تكامل', highlight: true, color: 'from-amber-400 to-amber-600',
    features: [
      'فحص فعلي للموقع (HTTP, سرعة، Meta, OG)',
      'ربط API ثنائي الاتجاه مع منصتك',
      'لوحة تحكم موحدة لكل مؤشراتك',
      'تحسين SEO وتدقيق تقني شامل',
      'اقتراحات تحسين بصرية واستراتيجية',
    ],
  },
  {
    id: 3, level: 'level/3', icon: Bot, name: 'وظّف بات شارك', tagline: 'موظف رقمي 24/7 يعمل لأجلك',
    price: 500, period: 'باقة الذكاء التشغيلي', highlight: false, color: 'from-violet-500 to-fuchsia-500',
    features: [
      'موظف رقمي يدير المهام والعمليات',
      'تحليل بيانات لحظي + توصيات يومية',
      'إنشاء تقارير ومحتوى تلقائي',
      'تنبيهات استباقية وتدخل ذكي',
      'تكامل مع الإعلانات والمبيعات',
    ],
  },
];

const FEATURES = [
  { icon: Search, title: 'بحث علمي حقيقي', desc: 'محرك متصل بـGoogle يجلب مصادر ومراجع حية ويولد ملخصات ذكية' },
  { icon: Megaphone, title: 'استوديو إعلانات سينمائي', desc: 'سكربتات وستوريبورد وفيديو-برومبتس جاهزة بمعايير احترافية' },
  { icon: LayoutDashboard, title: 'لوحات قيادة تنفيذية', desc: 'KPIs مالية وتشغيلية لحظية مرتبطة بنظام محاسبة مزدوج' },
  { icon: ShieldCheck, title: 'هوية وأمان مؤسسي', desc: 'صلاحيات RBAC، تدقيق كامل، وتوثيق فعلي للمواقع المرتبطة' },
  { icon: Globe2, title: 'جاهزية عالمية', desc: 'دعم متعدد اللغات وبنية تحتية قابلة للتوسع لملايين المستخدمين' },
  { icon: Zap, title: 'سرعة الإنجاز', desc: 'من الفكرة إلى الإطلاق في أيام، مع أتمتة تختصر شهور العمل' },
];

export default function B99Showcase() {
  const nav = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  useEffect(() => {
    document.title = 'بات شارك 99 — منصة بناء وتعزيز الأعمال الرقمية';
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'منصة بات شارك 99 — ابنِ أعمالك الرقمية، عزّز موقعك، أو وظّف موظفًا رقميًا ذكيًا يعمل لك 24/7.');
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[#070710] text-white relative overflow-x-hidden">
      {/* Luxury animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(212,175,55,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_30%,rgba(139,92,246,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_70%,rgba(34,211,238,0.12),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />
        {/* floating golden particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-300/60"
            initial={{ x: `${(i * 83) % 100}%`, y: `${(i * 47) % 100}%`, opacity: 0 }}
            animate={{ y: ['0%', '-20%', '0%'], opacity: [0, 0.8, 0] }}
            transition={{ duration: 6 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      {/* Top bar with audio controls */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#070710]/80 border-b border-amber-500/10">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="بات شارك 99" className="w-9 h-9 drop-shadow-[0_0_18px_rgba(212,175,55,0.5)]" />
            <div className="leading-tight">
              <div className="text-[9px] tracking-[0.35em] text-amber-300/70">BATSHARK · THE GREATEST</div>
              <div className="font-black text-base bg-gradient-to-l from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">بات شارك 99</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button onClick={() => nav('/b99')} variant="ghost" size="sm" className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/10 text-xs">
              جولة المنصة
            </Button>
            <Button onClick={() => nav('/login')} size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500 font-bold text-xs gap-1">
              <LogIn className="w-3.5 h-3.5" /> دخول العملاء
            </Button>
          </div>
        </div>
      </header>

      {/* HERO — cinematic */}
      <section ref={heroRef} className="relative max-w-7xl mx-auto px-5 pt-16 pb-20 text-center">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 text-sm font-semibold mb-8">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> منصة الأعمال الرقمية الأكثر احترافية
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} className="relative inline-block mb-8">
            <motion.div
              className="absolute inset-0 bg-amber-400/30 blur-3xl scale-150"
              animate={{ scale: [1.5, 1.8, 1.5], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <img src={logo} alt="" className="relative w-32 h-32 mx-auto drop-shadow-[0_0_60px_rgba(212,175,55,0.7)]" />
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent">بات شارك 99</span>
            <span className="block text-2xl md:text-3xl font-bold text-white mt-4">المنصة التي تبني، تربط، وتُشغّل أعمالك الرقمية</span>
          </h1>

          <p className="max-w-2xl mx-auto text-white/85 leading-loose mb-10 text-base md:text-lg font-medium">
            ثلاث باقات احترافية. محرك ذكاء صناعي حقيقي. ربط فعلي بمواقعك. موظف رقمي يعمل 24/7.
            كل ما تحتاجه لإطلاق أو تعزيز عملك — تحت سقف واحد بمعايير عالمية.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={(e) => { e.stopPropagation(); nav('/b99'); }} size="lg" className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-900 hover:scale-105 transition-transform font-black px-8 h-12 shadow-[0_8px_32px_rgba(212,175,55,0.4)]">
              ابدأ جولتك الآن <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
            <Button onClick={(e) => { e.stopPropagation(); document.getElementById('reels')?.scrollIntoView({ behavior: 'smooth' }); }} size="lg" variant="outline" className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10 hover:text-amber-100 h-12 px-8 gap-2">
              <Play className="w-4 h-4" /> شاهد المنصة في حركة
            </Button>
          </div>

        </motion.div>
      </section>

      {/* REELS — animated demo videos (Framer Motion mockups) */}
      <section id="reels" className="relative max-w-7xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <div className="text-xs tracking-[0.4em] text-amber-400 font-bold mb-3">LIVE REELS</div>
          <h2 className="text-3xl md:text-4xl font-black text-white">شاهد بات شارك في حركة</h2>
          <p className="text-white/80 text-base mt-3 font-medium">مقاطع حية مصممة لتشرح ما يحدث داخل المنصة فعلياً</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ReelDashboard />
          <ReelChat />
          <ReelAlerts />
          <ReelAdsStudio />
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-7xl mx-auto px-5 py-16">
        <div className="text-center mb-14">
          <div className="text-xs tracking-[0.4em] text-amber-400 font-bold mb-3">CORE CAPABILITIES</div>
          <h2 className="text-3xl md:text-4xl font-black text-white">قدرات احترافية تحت تصرفك</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}  transition={{ delay: i * 0.05 }}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/5 hover:border-amber-500/30 transition-all">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 transition-all" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-amber-300" />
                </div>
                <h3 className="font-black text-lg text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/80 leading-relaxed font-medium">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="relative max-w-7xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <div className="text-xs tracking-[0.4em] text-amber-400 font-bold mb-3">PACKAGES</div>
          <h2 className="text-3xl md:text-5xl font-black mb-3 text-white">اختر مسارك</h2>
          <p className="text-white/80 text-base font-medium">كل باقة مصممة بدقة لمرحلة محددة من رحلة عملك الرقمي</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {PACKAGES.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}  transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl p-7 border transition-all hover:scale-[1.02] ${
                p.highlight
                  ? 'bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent border-amber-400/50 shadow-[0_20px_60px_rgba(212,175,55,0.25)]'
                  : 'bg-gradient-to-b from-white/[0.04] to-white/[0.01] border-white/10 hover:border-amber-500/30'
              }`}>
              {p.highlight && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 text-[10px] font-black tracking-wider">
                  الأكثر اختياراً
                </div>
              )}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br ${p.color} shadow-lg`}>
                <p.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs text-amber-300 font-bold mb-1">المستوى {p.id}</div>
              <h3 className="text-2xl font-black text-white mb-1">{p.name}</h3>
              <p className="text-sm text-white/75 mb-5 font-medium">{p.tagline}</p>
              <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-white/10">
                <span className="text-4xl font-black bg-gradient-to-b from-amber-200 to-amber-400 bg-clip-text text-transparent">{p.price}</span>
                <span className="text-sm text-white/70 font-bold">ر.س</span>
                <span className="text-xs text-white/60 mr-auto font-medium">{p.period}</span>
              </div>
              <ul className="space-y-3 mb-7">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-white/90 font-medium leading-relaxed">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${p.highlight ? 'text-amber-400' : 'text-emerald-400/80'}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={(e) => { e.stopPropagation(); nav(`/b99/${p.level}`); }} className={`w-full h-11 font-bold ${
                p.highlight
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500'
                  : 'bg-white/10 text-white hover:bg-amber-500/20 hover:text-amber-200 border border-white/10'
              }`}>
                اختر هذه الباقة
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative max-w-5xl mx-auto px-5 py-24 text-center">
        <div className="relative rounded-3xl p-12 bg-gradient-to-br from-amber-500/10 via-transparent to-violet-500/10 border border-amber-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.15),transparent_70%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-white">جاهز لتنطلق؟</h2>
            <p className="text-white/85 mb-8 max-w-xl mx-auto text-base font-medium">ادخل تجربة بات شارك 99 الآن. جولة كاملة قبل أي التزام.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={(e) => { e.stopPropagation(); nav('/b99'); }} size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-black h-12 px-8 hover:scale-105 transition-transform">
                ابدأ الجولة المجانية <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); nav('/login'); }} size="lg" variant="outline" className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10 h-12 px-8">
                <LogIn className="w-4 h-4 ml-2" /> دخول العملاء
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/10 py-8 text-center text-sm text-white/60 font-medium">
        © {new Date().getFullYear()} بات شارك 99 — كل الحقوق محفوظة
      </footer>
    </div>
  );
}

// =============== Reels — cinematic interactive demos ===============
function useLoopKey(intervalMs = 9000) {
  const [k, setK] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setK(v => v + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return k;
}

function ReelFrame({ title, subtitle, badge, color, loopKey, children }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} 
      className="group relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:border-amber-500/40 transition shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-black/40">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
        <div className="mx-auto px-3 py-0.5 rounded-md bg-white/5 text-[10px] text-white/60 font-mono">batshark99.app/{badge.toLowerCase().replace(/\s+/g,'-')}</div>
        <div className={`text-[10px] tracking-widest font-black uppercase ${color} flex items-center gap-1`}>
          <motion.span className="inline-block w-1.5 h-1.5 rounded-full bg-current"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
          LIVE
        </div>
      </div>
      <div key={loopKey} className="relative aspect-[16/10] bg-gradient-to-br from-[#0a0a18] via-[#0c0c20] to-black overflow-hidden">
        {children}
      </div>
      <div className="px-5 py-4 border-t border-white/10 bg-black/50 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-black text-white">{title}</div>
          {subtitle && <div className="text-xs text-white/65 mt-0.5 font-medium">{subtitle}</div>}
        </div>
        <div className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider border bg-white/5 ${color} border-current/30`}>{badge}</div>
      </div>
    </motion.div>
  );
}

function useTickingNumber(target: number, duration = 2000, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number; const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-US');
}

function Sparkline({ data, color = '#fbbf24' }: { data: number[]; color?: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 100, h = 30;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
      <motion.polygon points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity={0.18}
        initial={{ opacity: 0 }} animate={{ opacity: 0.18 }} transition={{ duration: 1.2 }} />
      <motion.polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, ease: 'easeInOut' }} />
    </svg>
  );
}

function ReelDashboard() {
  const loopKey = useLoopKey(10000);
  const revenue = useTickingNumber(128450, 2500);
  const customers = useTickingNumber(2341, 2200);
  const orders = useTickingNumber(847, 1800);
  const growth = useTickingNumber(24.6, 2400, 1);
  const chartData = [42, 58, 51, 67, 60, 78, 72, 88, 81, 96, 90, 112, 105, 128];

  const kpis = [
    { label: 'الإيرادات', value: revenue, suffix: ' ر.س', delta: '+18.4%', icon: TrendingUp, c: 'from-emerald-500/30 to-emerald-500/5', t: 'text-emerald-300' },
    { label: 'العملاء', value: customers, suffix: '', delta: '+312', icon: BarChart3, c: 'from-cyan-500/30 to-cyan-500/5', t: 'text-cyan-300' },
    { label: 'الطلبات', value: orders, suffix: '', delta: '+57', icon: Sparkles, c: 'from-violet-500/30 to-violet-500/5', t: 'text-violet-300' },
    { label: 'النمو', value: growth, suffix: '%', delta: '↑', icon: TrendingUp, c: 'from-amber-500/30 to-amber-500/5', t: 'text-amber-300' },
  ];

  return (
    <ReelFrame loopKey={loopKey} title="لوحة قيادة تنفيذية حيّة" subtitle="مؤشرات مالية وتشغيلية تتحدّث لحظياً من قيود محاسبية مزدوجة" badge="DASHBOARD" color="text-cyan-300">
      <div className="absolute inset-0 p-4 flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-2">
          {kpis.map((k, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.1, duration: 0.5 }}
              className={`relative rounded-xl p-2.5 bg-gradient-to-br ${k.c} border border-white/10 overflow-hidden`}>
              <div className="flex items-center justify-between mb-1.5">
                <k.icon className={`w-3.5 h-3.5 ${k.t}`} />
                <span className={`text-[9px] font-black ${k.t}`}>{k.delta}</span>
              </div>
              <div className="text-[9px] text-white/60 font-medium">{k.label}</div>
              <div className="text-base font-black text-white tabular-nums">{k.value}{k.suffix}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex-1 relative rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[10px] text-white/55 font-medium">إيرادات آخر 14 يوم</div>
              <div className="text-sm font-black text-white">128,450 ر.س <span className="text-emerald-400 text-[10px]">▲ 18.4%</span></div>
            </div>
            <div className="flex gap-1">
              {['1ي','7ي','14ي','30ي'].map((t, i) => (
                <div key={i} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${i === 2 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-white/40'}`}>{t}</div>
              ))}
            </div>
          </div>
          <div className="absolute inset-x-3 bottom-3 top-12">
            <svg viewBox="0 0 280 80" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[20, 40, 60].map((y, i) => (
                <line key={i} x1="0" x2="280" y1={y} y2={y} stroke="white" strokeOpacity="0.06" strokeDasharray="2 4" />
              ))}
              {(() => {
                const max = Math.max(...chartData), min = Math.min(...chartData);
                const pts = chartData.map((v, i) => `${(i / (chartData.length - 1)) * 280},${80 - ((v - min) / (max - min)) * 70 - 5}`).join(' ');
                return (
                  <>
                    <motion.polygon points={`0,80 ${pts} 280,80`} fill="url(#areaGrad)"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.6 }} />
                    <motion.polyline points={pts} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: 'easeInOut', delay: 0.4 }} />
                    {chartData.map((v, i) => {
                      const x = (i / (chartData.length - 1)) * 280;
                      const y = 80 - ((v - min) / (max - min)) * 70 - 5;
                      return (
                        <motion.circle key={i} cx={x} cy={y} r="2" fill="#fbbf24"
                          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.1 }} />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
          <motion.div className="absolute top-3 right-3 flex items-center gap-1.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <span className="text-[9px] text-emerald-300 font-black tracking-wider">LIVE</span>
          </motion.div>
        </div>
      </div>
    </ReelFrame>
  );
}

function ReelChat() {
  const loopKey = useLoopKey(8000);
  const messages = [
    { from: 'user', text: 'حلل أداء بادل هذا الأسبوع', delay: 0.3 },
    { from: 'ai', text: 'أحلل البيانات الآن', delay: 1.2, thinking: true },
    { from: 'ai', text: '✓ ارتفعت الحجوزات 24% مقابل الأسبوع السابق. الذروة الجمعة 7-10 مساءً.', delay: 2.4 },
    { from: 'user', text: 'اقترح حملة ترويجية', delay: 3.6 },
    { from: 'ai', text: '🎯 جاهزة: حملة "ليلة الأبطال" — جمعة 8 مساءً، خصم 15%', delay: 4.8 },
  ];

  return (
    <ReelFrame loopKey={loopKey} title="موظف بات شارك الذكي" subtitle="يفهم بياناتك، يحلل، ويقترح خطوات تنفيذية فورية" badge="AI EMPLOYEE" color="text-violet-300">
      <div className="absolute inset-0 p-4 flex flex-col">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <motion.div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg"
            animate={{ boxShadow: ['0 0 0 0 rgba(168,85,247,0.4)', '0 0 0 10px rgba(168,85,247,0)'] }}
            transition={{ duration: 2, repeat: Infinity }}>
            <Bot className="w-4 h-4 text-white" />
            <motion.div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0a18]"
              animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-white">بات شارك AI</div>
            <div className="text-[10px] text-emerald-300 font-medium">متصل · يحلل 12 مصدر بيانات</div>
          </div>
          <div className="text-[9px] px-2 py-1 rounded bg-violet-500/15 text-violet-300 font-black border border-violet-400/20">GPT-5</div>
        </div>

        <div className="flex-1 flex flex-col gap-2 justify-end overflow-hidden py-3">
          {messages.map((m, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 14, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: m.delay, duration: 0.45, ease: 'easeOut' }}
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed ${
                m.from === 'ai'
                  ? 'self-start bg-gradient-to-br from-violet-500/25 to-violet-500/5 border border-violet-400/30 text-violet-50 rounded-bl-sm'
                  : 'self-end bg-gradient-to-br from-amber-500/25 to-amber-500/5 border border-amber-400/30 text-amber-50 rounded-br-sm'
              }`}>
              {(m as any).thinking ? (
                <span className="flex items-center gap-1">
                  {m.text}
                  {[0, 1, 2].map(d => (
                    <motion.span key={d} className="w-1 h-1 rounded-full bg-current"
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
                  ))}
                </span>
              ) : m.text}
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 5.4, duration: 0.5 }}
            className="self-start max-w-[90%] rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border border-violet-400/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/30 flex items-center justify-center">
                <Megaphone className="w-3 h-3 text-violet-200" />
              </div>
              <div className="text-[10px] font-black text-violet-100">حملة "ليلة الأبطال"</div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { l: 'وصول متوقع', v: '12K' },
                { l: 'حجوزات', v: '+85' },
                { l: 'ROI', v: '4.2x' },
              ].map((s, i) => (
                <div key={i} className="rounded-lg bg-black/40 p-1.5 text-center">
                  <div className="text-[8px] text-white/55">{s.l}</div>
                  <div className="text-xs font-black text-white">{s.v}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6 }}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
          <div className="text-[10px] text-white/45 flex-1">اكتب طلبك للذكاء الاصطناعي...</div>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </motion.div>
      </div>
    </ReelFrame>
  );
}

function ReelAlerts() {
  const loopKey = useLoopKey(7000);
  const alerts = [
    { icon: Bell, palette: { bg: 'bg-rose-500/15', border: 'border-rose-400/30', icon: 'text-rose-300', iconBg: 'bg-rose-500/20', actionT: 'text-rose-300', actionBg: 'bg-rose-500/10' }, title: 'تنبيه تكاليف', desc: 'ارتفاع الكهرباء 15% — مراجعة فورية', spark: [3, 4, 3, 5, 6, 7, 9, 8, 11, 14], delay: 0.3, sparkColor: '#fb7185', action: 'تحقق' },
    { icon: TrendingUp, palette: { bg: 'bg-emerald-500/15', border: 'border-emerald-400/30', icon: 'text-emerald-300', iconBg: 'bg-emerald-500/20', actionT: 'text-emerald-300', actionBg: 'bg-emerald-500/10' }, title: 'فرصة نمو', desc: 'العملاء الجدد +42% — استثمر بالإعلانات', spark: [5, 6, 8, 7, 10, 12, 14, 16, 19, 22], delay: 1.1, sparkColor: '#34d399', action: 'إطلاق' },
    { icon: Sparkles, palette: { bg: 'bg-amber-500/15', border: 'border-amber-400/30', icon: 'text-amber-300', iconBg: 'bg-amber-500/20', actionT: 'text-amber-300', actionBg: 'bg-amber-500/10' }, title: 'توصية AI', desc: 'رفع سعر الباقة 3 بـ8% يزيد الهامش 12%', spark: [10, 11, 9, 12, 11, 13, 12, 14, 13, 15], delay: 1.9, sparkColor: '#fbbf24', action: 'تطبيق' },
    { icon: ShieldCheck, palette: { bg: 'bg-cyan-500/15', border: 'border-cyan-400/30', icon: 'text-cyan-300', iconBg: 'bg-cyan-500/20', actionT: 'text-cyan-300', actionBg: 'bg-cyan-500/10' }, title: 'مخاطر منخفضة', desc: 'مؤشر الصحة المالية 87/100', spark: [70, 72, 75, 78, 80, 82, 84, 85, 86, 87], delay: 2.7, sparkColor: '#22d3ee', action: 'التقرير' },
  ];

  return (
    <ReelFrame loopKey={loopKey} title="تنبيهات وتوصيات لحظية" subtitle="الذكاء الاصطناعي يراقب 24/7 ويرسل لك ما يهم فقط" badge="ALERTS" color="text-amber-300">
      <div className="absolute inset-0 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <motion.div className="w-2 h-2 rounded-full bg-amber-400"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <div className="text-[10px] font-black text-amber-300 tracking-wider">4 تنبيهات نشطة</div>
          </div>
          <div className="text-[9px] text-white/50 font-medium">آخر فحص: قبل 12 ثانية</div>
        </div>

        {alerts.map((a, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: a.delay, duration: 0.5 }}
            className={`relative flex items-center gap-3 p-2.5 rounded-xl border ${a.palette.bg} ${a.palette.border}`}>
            <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${a.palette.iconBg} border ${a.palette.border}`}>
              <a.icon className={`w-4 h-4 ${a.palette.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="text-[11px] font-black text-white">{a.title}</div>
                <div className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded ${a.palette.actionT} ${a.palette.actionBg}`}>{a.action}</div>
              </div>
              <div className="text-[10px] text-white/75 leading-snug font-medium truncate">{a.desc}</div>
            </div>
            <div className="w-16 h-7 shrink-0">
              <Sparkline data={a.spark} color={a.sparkColor} />
            </div>
          </motion.div>
        ))}
      </div>
    </ReelFrame>
  );
}

function ReelAdsStudio() {
  const loopKey = useLoopKey(9000);
  const reach = useTickingNumber(284000, 2500);
  const conv = useTickingNumber(7.4, 2000, 1);

  const storyboard = [
    { t: '0:00', label: 'افتتاحية', c: 'from-amber-500 to-rose-500' },
    { t: '0:03', label: 'هوية العلامة', c: 'from-violet-500 to-fuchsia-500' },
    { t: '0:08', label: 'العرض', c: 'from-cyan-500 to-blue-500' },
    { t: '0:14', label: 'دعوة تنفيذ', c: 'from-emerald-500 to-teal-500' },
  ];

  const lines = [
    { time: '0:00', text: 'لقطة جوية لملعب بادل في ساعة الذروة', delay: 0.4 },
    { time: '0:05', text: '"الجمعة هذي مختلفة" — صوت راوٍ عميق', delay: 0.9 },
    { time: '0:10', text: 'لقطة قريبة لكرة تصطدم — صوت كرستالي', delay: 1.4 },
    { time: '0:13', text: 'شعار + خصم 15% + الحجز الآن', delay: 1.9 },
  ];

  return (
    <ReelFrame loopKey={loopKey} title="استوديو الإعلانات السينمائي" subtitle="سكربت + ستوريبورد + برومبت فيديو جاهز للإنتاج" badge="ADS" color="text-rose-300">
      <div className="absolute inset-0 p-4 flex flex-col gap-3">
        <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center">
                <Megaphone className="w-3 h-3 text-rose-300" />
              </div>
              <div className="text-[11px] font-black text-white">سكربت "ليلة الأبطال" — 15 ثانية</div>
            </div>
            <div className="text-[9px] text-emerald-300 font-black">✓ جاهز</div>
          </div>
          <div className="space-y-1 text-[10px] font-medium">
            {lines.map((line, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: line.delay, duration: 0.4 }}
                className="flex gap-2 items-start">
                <span className="text-rose-300 font-mono font-bold shrink-0">{line.time}</span>
                <span className="text-white/80">{line.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {storyboard.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2 + i * 0.12 }}
              className={`relative aspect-video rounded-lg bg-gradient-to-br ${s.c} overflow-hidden border border-white/10`}>
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute top-1 left-1 text-[8px] font-mono font-black text-white/95 bg-black/60 px-1 rounded">{s.t}</div>
              <div className="absolute bottom-1 left-1 right-1 text-[8px] font-black text-white text-center leading-tight">{s.label}</div>
              <motion.div className="absolute inset-0 bg-white/20"
                animate={{ opacity: [0, 0.3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="rounded-lg bg-rose-500/10 border border-rose-400/20 p-2">
            <div className="text-[9px] text-white/55 font-medium">وصول متوقع</div>
            <div className="text-sm font-black text-white tabular-nums">{reach}</div>
          </div>
          <div className="rounded-lg bg-amber-500/10 border border-amber-400/20 p-2">
            <div className="text-[9px] text-white/55 font-medium">معدل تحويل</div>
            <div className="text-sm font-black text-white tabular-nums">{conv}%</div>
          </div>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/20 p-2">
            <div className="text-[9px] text-white/55 font-medium">عائد الإنفاق</div>
            <div className="text-sm font-black text-white">4.2x</div>
          </div>
        </div>
      </div>
    </ReelFrame>
  );
}
