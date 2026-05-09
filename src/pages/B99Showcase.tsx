import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Sparkles, Plug, Bot, Check, Star, ShieldCheck, Globe2, Zap, Megaphone, Search, LayoutDashboard, LogIn, Volume2, VolumeX, Music, Play, BarChart3, Bell, MessageSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import logo from '@/assets/batshark-logo-official.png';
import { useArabicTTS, useAmbientMusic } from '@/hooks/useB99Audio';

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

const WELCOME_NARRATION =
  'أهلاً بك في بات شارك تسعة وتسعين. منصتك الرقمية تبدأ هنا. اختر باقتك، ودعنا نبني مستقبل عملك بأعلى معايير الاحترافية.';

export default function B99Showcase() {
  const nav = useNavigate();
  const { speak, stop, speaking } = useArabicTTS();
  const { playing: musicOn, toggle: toggleMusic } = useAmbientMusic();
  const [hasInteracted, setHasInteracted] = useState(false);
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

  // First user interaction: prompt to enable music + welcome
  const enableExperience = () => {
    if (hasInteracted) return;
    setHasInteracted(true);
    toggleMusic();
    setTimeout(() => speak(WELCOME_NARRATION), 800);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#070710] text-white relative overflow-x-hidden" onClick={enableExperience}>
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
            <button
              onClick={(e) => { e.stopPropagation(); toggleMusic(); }}
              title={musicOn ? 'إيقاف الموسيقى' : 'تشغيل موسيقى الجلسة'}
              className={`h-9 w-9 rounded-full flex items-center justify-center border transition ${musicOn ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-white/5 border-white/10 text-white/60 hover:text-amber-200'}`}>
              <Music className={`w-4 h-4 ${musicOn ? 'animate-pulse' : ''}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); speaking ? stop() : speak(WELCOME_NARRATION); }}
              title="استمع للترحيب"
              className={`h-9 w-9 rounded-full flex items-center justify-center border transition ${speaking ? 'bg-rose-500/20 border-rose-400 text-rose-200' : 'bg-white/5 border-white/10 text-white/60 hover:text-amber-200'}`}>
              {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <Button onClick={(e) => { e.stopPropagation(); nav('/b99'); }} variant="ghost" size="sm" className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/10 text-xs">
              جولة المنصة
            </Button>
            <Button onClick={(e) => { e.stopPropagation(); nav('/login'); }} size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500 font-bold text-xs gap-1">
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] tracking-[0.2em] mb-8">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> منصة الأعمال الرقمية الأكثر احترافية
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
            <span className="block text-2xl md:text-3xl font-light text-white/70 mt-3">المنصة التي تبني، تربط، وتُشغّل أعمالك الرقمية</span>
          </h1>

          <p className="max-w-2xl mx-auto text-white/60 leading-relaxed mb-10 text-sm md:text-base">
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

          {!hasInteracted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
              className="mt-8 inline-flex items-center gap-2 text-[11px] text-amber-300/60">
              <Music className="w-3 h-3" /> اضغط في أي مكان لتشغيل التجربة الصوتية الكاملة
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* REELS — animated demo videos (Framer Motion mockups) */}
      <section id="reels" className="relative max-w-7xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <div className="text-[10px] tracking-[0.4em] text-amber-400/70 mb-2">LIVE REELS</div>
          <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-b from-white to-amber-200/70 bg-clip-text text-transparent">شاهد بات شارك في حركة</h2>
          <p className="text-white/50 text-sm mt-2">مقاطع حية مصممة لتشرح ما يحدث داخل المنصة فعلياً</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <ReelDashboard />
          <ReelChat />
          <ReelAlerts />
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-7xl mx-auto px-5 py-16">
        <div className="text-center mb-14">
          <div className="text-[10px] tracking-[0.4em] text-amber-400/70 mb-2">CORE CAPABILITIES</div>
          <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-b from-white to-amber-200/70 bg-clip-text text-transparent">قدرات احترافية تحت تصرفك</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/5 hover:border-amber-500/30 transition-all">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 transition-all" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-amber-300" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="relative max-w-7xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <div className="text-[10px] tracking-[0.4em] text-amber-400/70 mb-2">PACKAGES</div>
          <h2 className="text-3xl md:text-5xl font-black mb-3 bg-gradient-to-b from-white to-amber-200/70 bg-clip-text text-transparent">اختر مسارك</h2>
          <p className="text-white/50 text-sm">كل باقة مصممة بدقة لمرحلة محددة من رحلة عملك الرقمي</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {PACKAGES.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
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
              <div className="text-[10px] tracking-[0.3em] text-amber-300/70 mb-1">المستوى {p.id}</div>
              <h3 className="text-xl font-black text-white mb-1">{p.name}</h3>
              <p className="text-sm text-white/50 mb-5">{p.tagline}</p>
              <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-white/10">
                <span className="text-4xl font-black bg-gradient-to-b from-amber-200 to-amber-400 bg-clip-text text-transparent">{p.price}</span>
                <span className="text-sm text-white/40">ر.س</span>
                <span className="text-xs text-white/40 mr-auto">{p.period}</span>
              </div>
              <ul className="space-y-3 mb-7">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-white/70">
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
            <h2 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-b from-white to-amber-200 bg-clip-text text-transparent">جاهز لتنطلق؟</h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">ادخل تجربة بات شارك 99 الآن. جولة كاملة قبل أي التزام.</p>
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

      <footer className="relative border-t border-white/5 py-8 text-center text-xs text-white/30">
        © {new Date().getFullYear()} بات شارك 99 — كل الحقوق محفوظة
      </footer>
    </div>
  );
}

// =============== Reels — animated demo "videos" ===============
function ReelFrame({ title, badge, color, children }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="group relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:border-amber-500/30 transition shadow-2xl">
      {/* mock browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-black/30">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
        <div className={`mr-auto text-[9px] tracking-widest font-black uppercase ${color}`}>{badge}</div>
      </div>
      <div className="relative aspect-[16/11] bg-gradient-to-br from-slate-900 to-black p-4 overflow-hidden">
        {children}
      </div>
      <div className="px-4 py-3 border-t border-white/5">
        <div className="text-sm font-black text-white">{title}</div>
      </div>
    </motion.div>
  );
}

function ReelDashboard() {
  return (
    <ReelFrame title="لوحة قيادة تنفيذية حيّة" badge="DASHBOARD" color="text-cyan-300/80">
      <div className="absolute inset-4 grid grid-cols-2 gap-2">
        {[
          { label: 'الإيرادات', value: '128K', icon: TrendingUp, c: 'from-emerald-500 to-cyan-500' },
          { label: 'العملاء', value: '2,341', icon: BarChart3, c: 'from-amber-400 to-rose-500' },
          { label: 'الطلبات', value: '847', icon: Sparkles, c: 'from-violet-500 to-fuchsia-500' },
          { label: 'النمو', value: '+24%', icon: TrendingUp, c: 'from-blue-500 to-cyan-400' },
        ].map((k, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.15, duration: 0.5 }}
            className={`rounded-xl p-2.5 bg-gradient-to-br ${k.c} bg-opacity-20 border border-white/10`}>
            <k.icon className="w-3.5 h-3.5 text-white/80 mb-1" />
            <div className="text-[10px] text-white/60">{k.label}</div>
            <motion.div className="text-lg font-black text-white"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.15 }}>
              {k.value}
            </motion.div>
          </motion.div>
        ))}
      </div>
      {/* animated bar chart */}
      <motion.div className="absolute bottom-3 left-3 right-3 h-12 flex items-end gap-1">
        {[40, 65, 50, 80, 55, 90, 70, 95, 60, 100].map((h, i) => (
          <motion.div key={i}
            initial={{ height: 0 }} whileInView={{ height: `${h}%` }}
            transition={{ delay: 0.8 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
            className="flex-1 bg-gradient-to-t from-amber-400 to-amber-200 rounded-sm" />
        ))}
      </motion.div>
    </ReelFrame>
  );
}

function ReelChat() {
  const messages = [
    { from: 'ai', text: 'مرحباً! كيف أساعدك اليوم؟', delay: 0.2 },
    { from: 'user', text: 'حلل لي مبيعات الأسبوع', delay: 1 },
    { from: 'ai', text: '📊 ارتفعت 24% — بادل في الصدارة', delay: 1.8 },
    { from: 'user', text: 'ممتاز! اقترح حملة', delay: 2.6 },
    { from: 'ai', text: '✨ جاهز ستوريبورد كامل', delay: 3.4 },
  ];
  return (
    <ReelFrame title="موظف بات شارك الذكي" badge="AI EMPLOYEE" color="text-violet-300/80">
      <div className="absolute inset-4 flex flex-col gap-2 justify-end">
        {messages.map((m, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10, x: m.from === 'user' ? 20 : -20 }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: m.delay, duration: 0.4 }}
            className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-[11px] ${
              m.from === 'ai'
                ? 'self-start bg-violet-500/20 border border-violet-400/30 text-violet-100 rounded-bl-sm'
                : 'self-end bg-amber-500/20 border border-amber-400/30 text-amber-100 rounded-br-sm'
            }`}>
            {m.text}
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 4 }}
          className="self-start flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-[9px] text-white/50">
          <MessageSquare className="w-2.5 h-2.5" /> يكتب...
        </motion.div>
      </div>
    </ReelFrame>
  );
}

function ReelAlerts() {
  const alerts = [
    { icon: Bell, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-400/30', title: 'تنبيه استباقي', desc: 'تكلفة الكهرباء ارتفعت 15%', delay: 0.3 },
    { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-400/30', title: 'فرصة نمو', desc: 'العملاء الجدد +42% الأسبوع', delay: 1.2 },
    { icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-400/30', title: 'توصية AI', desc: 'حدّث أسعار باقة 3 لزيادة الهامش', delay: 2.1 },
  ];
  return (
    <ReelFrame title="تنبيهات وتوصيات لحظية" badge="SMART ALERTS" color="text-amber-300/80">
      <div className="absolute inset-4 flex flex-col gap-2 justify-center">
        {alerts.map((a, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: a.delay, duration: 0.5 }}
            className={`flex items-start gap-2 p-2.5 rounded-xl border ${a.bg}`}>
            <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-black/30 ${a.color}`}>
              <a.icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-white">{a.title}</div>
              <div className="text-[10px] text-white/60 leading-snug">{a.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </ReelFrame>
  );
}
