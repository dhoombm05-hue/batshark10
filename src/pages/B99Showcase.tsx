import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Sparkles, Plug, Bot, Check, Star, ShieldCheck, Globe2, Zap, Megaphone, Search, LayoutDashboard, LogIn, BarChart3, Layers, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
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
  { icon: Lightbulb, title: 'محرك إلهام وتطوير ذاتي', desc: 'يحلل أفضل المنصات العالمية ويقترح تحسينات بصرية تطبّق على موقعك' },
  { icon: Layers, title: 'منصات مربوطة بإدارة موحدة', desc: 'لوحة Backend/Frontend لكل موقع بنيته، تتحكم وتراجع كل شي من مكان واحد' },
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

      {/* Header — login is now visually loud */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#070710]/85 border-b border-amber-500/15">
        <div className="max-w-7xl mx-auto px-5 h-[68px] flex items-center justify-between gap-3">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group">
            <img src={logo} alt="بات شارك 99" className="w-10 h-10 drop-shadow-[0_0_24px_rgba(212,175,55,0.7)]" />
            <div className="leading-tight text-right">
              <div className="text-[9px] tracking-[0.35em] text-amber-300/80">BATSHARK · THE GREATEST</div>
              <div className="font-black text-base bg-gradient-to-l from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">بات شارك 99</div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Button onClick={() => nav('/b99')} variant="ghost" size="sm" className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/10 text-xs hidden sm:inline-flex">
              جولة المنصة
            </Button>
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(212,175,55,0.55)', '0 0 0 14px rgba(212,175,55,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-full"
            >
              <Button
                onClick={() => nav('/login')}
                className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 text-slate-900 hover:from-amber-400 hover:to-amber-500 font-black text-sm h-11 px-6 gap-2 shadow-[0_8px_24px_rgba(212,175,55,0.45)]"
              >
                <LogIn className="w-4 h-4" /> دخول العملاء
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* HERO */}
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

          {/* HUGE prominent login + tour CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div
              animate={{ boxShadow: ['0 10px 40px rgba(212,175,55,0.35)', '0 14px 60px rgba(212,175,55,0.6)', '0 10px 40px rgba(212,175,55,0.35)'] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              className="rounded-2xl"
            >
              <Button
                onClick={() => nav('/login')}
                size="lg"
                className="group relative overflow-hidden h-14 px-10 text-base font-black bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 text-slate-900 hover:from-amber-400 hover:to-amber-500 gap-3 rounded-2xl"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <LogIn className="w-5 h-5" /> دخول العملاء والشركاء
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </motion.div>
            <Button
              onClick={() => nav('/b99')}
              size="lg"
              variant="outline"
              className="h-14 px-10 text-base border-amber-500/40 bg-white/5 text-amber-100 hover:bg-amber-500/10 hover:text-amber-50 font-bold rounded-2xl"
            >
              ابدأ جولة المنصة <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          </div>

          <div className="mt-6 text-xs text-white/55 font-medium">
            للعملاء الحاليين: ادخل لمتابعة منصاتك المربوطة، Backend، وإعدادات الملكية.
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative max-w-7xl mx-auto px-5 py-16">
        <div className="text-center mb-14">
          <div className="text-xs tracking-[0.4em] text-amber-400 font-bold mb-3">CORE CAPABILITIES</div>
          <h2 className="text-3xl md:text-4xl font-black text-white">قدرات احترافية تحت تصرفك</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/5 hover:border-amber-500/30 transition-all">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-amber-300" />
                </div>
                <h3 className="font-black text-base text-white mb-2">{f.title}</h3>
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
            <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
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
              <Button onClick={() => nav(`/b99/${p.level}`)} className={`w-full h-11 font-bold ${
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
              <Button onClick={() => nav('/login')} size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-black h-12 px-8 hover:scale-105 transition-transform gap-2">
                <LogIn className="w-4 h-4" /> دخول العملاء
              </Button>
              <Button onClick={() => nav('/b99')} size="lg" variant="outline" className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10 h-12 px-8">
                ابدأ الجولة المجانية <ArrowLeft className="w-4 h-4 mr-2" />
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
