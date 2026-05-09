import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Plug, Bot, Check, Star, ShieldCheck, Globe2, Zap, Megaphone, Search, LayoutDashboard, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import logo from '@/assets/batshark-logo-official.png';

const PACKAGES = [
  {
    id: 1, level: 'level/1', icon: Sparkles, name: 'البناء من الصفر', tagline: 'منصتك الرقمية تُولد هنا',
    price: 100, period: 'اشتراك تأسيس', highlight: false,
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
    price: 250, period: 'باقة تكامل', highlight: true,
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
    price: 500, period: 'باقة الذكاء التشغيلي',
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

  useEffect(() => {
    document.title = 'بات شارك 99 — منصة بناء وتعزيز الأعمال الرقمية';
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'منصة بات شارك 99 — ابنِ أعمالك الرقمية، عزّز موقعك، أو وظّف موظفًا رقميًا ذكيًا يعمل لك 24/7.');
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0a0f] text-white relative overflow-x-hidden">
      {/* Luxury background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(212,175,55,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_30%,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_70%,rgba(34,211,238,0.10),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0f]/70 border-b border-amber-500/10">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="بات شارك 99" className="w-9 h-9 drop-shadow-[0_0_18px_rgba(212,175,55,0.5)]" />
            <div className="leading-tight">
              <div className="text-[9px] tracking-[0.35em] text-amber-300/70">BATSHARK · THE GREATEST</div>
              <div className="font-black text-base bg-gradient-to-l from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">بات شارك 99</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => nav('/b99')} variant="ghost" size="sm" className="text-amber-200 hover:text-amber-100 hover:bg-amber-500/10 text-xs">
              جولة المنصة
            </Button>
            <Button onClick={() => nav('/login')} size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500 font-bold text-xs gap-1">
              <LogIn className="w-3.5 h-3.5" /> دخول العملاء
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-5 pt-20 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] tracking-[0.2em] mb-8">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> منصة الأعمال الرقمية الأكثر احترافية
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-amber-400/30 blur-3xl scale-150" />
          <img src={logo} alt="" className="relative w-28 h-28 mx-auto drop-shadow-[0_0_60px_rgba(212,175,55,0.7)]" />
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
          <Button onClick={() => nav('/b99')} size="lg" className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-900 hover:scale-105 transition-transform font-black px-8 h-12 shadow-[0_8px_32px_rgba(212,175,55,0.4)]">
            ابدأ جولتك الآن <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
          <Button onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })} size="lg" variant="outline" className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10 hover:text-amber-100 h-12 px-8">
            استعرض الباقات
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-[11px] text-white/40">
          <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> دفع آمن</div>
          <div className="flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5 text-cyan-400" /> دعم عربي وإنجليزي</div>
          <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> إطلاق خلال أيام</div>
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
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${p.highlight ? 'bg-amber-500/20 border border-amber-400/40' : 'bg-white/5 border border-white/10'}`}>
                <p.icon className={`w-7 h-7 ${p.highlight ? 'text-amber-300' : 'text-amber-400/80'}`} />
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
            <h2 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-b from-white to-amber-200 bg-clip-text text-transparent">جاهز لتنطلق؟</h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">ادخل تجربة بات شارك 99 الآن. جولة كاملة قبل أي التزام.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={() => nav('/b99')} size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-black h-12 px-8 hover:scale-105 transition-transform">
                ابدأ الجولة المجانية <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
              <Button onClick={() => nav('/login')} size="lg" variant="outline" className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10 h-12 px-8">
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
