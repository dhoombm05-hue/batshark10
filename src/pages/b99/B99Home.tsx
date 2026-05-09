import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Megaphone, Layers, Search, BarChart3, Brain, Rocket, Shield, ArrowLeft, Zap, Globe2, Target, Wrench, TrendingUp, LogIn, Building2, Users2, ScanLine, Video, KeyRound } from 'lucide-react';
import logo from '@/assets/batshark-logo-official.png';

const PORTALS = [
  { icon: Sparkles, title: 'مولد بزنس بـ4 مستويات', desc: 'كل مستوى تجربة كاملة منفصلة: مبتدئ، متوسط، متقدم، محلل', to: '/b99/generator', tag: 'AI Wizard', accent: 'from-violet-500 via-fuchsia-500 to-pink-500' },
  { icon: Layers, title: 'باني المنصات المستقلة', desc: 'منصة فعلية برابط، QR، رمز دخول، وصلاحيات مالك للبيع', to: '/b99/platforms', tag: 'Platform Studio', accent: 'from-cyan-500 via-blue-500 to-indigo-500' },
  { icon: Video, title: 'استوديو الإعلانات بالفيديو', desc: 'استبيان ذكي يولّد سكربت فيديو إعلاني متكامل + Storyboard + Prompt', to: '/b99/ads', tag: 'Video Ads Studio', accent: 'from-rose-500 via-orange-500 to-amber-400' },
  { icon: Search, title: 'البحث العلمي الذكي', desc: 'محرك بحث داخل المنصة + إجابات مدعومة بالـAI لخدمة عملائك', to: '/b99/search', tag: 'Research Engine', accent: 'from-emerald-400 via-teal-400 to-cyan-500' },
];

const PILLARS = [
  { icon: Brain, t: 'تحليل سلوكي عميق', d: 'الـAI يفهم نمط تفكيرك قبل التوصية' },
  { icon: Shield, t: 'بيانات حقيقية', d: 'أرقام ومؤشرات سوقية للسعودية والخليج' },
  { icon: Zap, t: 'نتائج فورية', d: 'بدون انتظار، توليد مباشر وحفظ تلقائي' },
  { icon: Globe2, t: 'منصة سيادية', d: 'مستقلة برابط ودومين خاص لكل بزنس' },
];

const LEVELS = [
  { to: '/b99/generator/beginner', icon: Rocket, t: 'Level 1 — مبتدئ', d: 'أكتب طلبك بكلمة وسأبني لك منصة كاملة', accent: 'from-emerald-400 to-cyan-500' },
  { to: '/b99/generator/intermediate', icon: Wrench, t: 'Level 2 — متوسط', d: 'عندك بزنس قائم؟ نطوّره ونحوّله لمنصة أقوى', accent: 'from-amber-300 to-rose-500' },
  { to: '/b99/generator/advanced', icon: TrendingUp, t: 'Level 3 — متقدم', d: 'منصة تشغيل ونمو بعروض ومسارات عمل', accent: 'from-sky-400 to-indigo-500' },
  { to: '/b99/generator/analyst', icon: BarChart3, t: 'Level 4 — محلل', d: 'فرضيات وأرقام CAC/LTV وتجارب إطلاق', accent: 'from-fuchsia-400 to-violet-600' },
];

export default function B99Home() {
  const nav = useNavigate();
  const attack = (to: string) => window.dispatchEvent(new CustomEvent('batshark:attack', { detail: { to } }));

  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="relative pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white mb-6">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" /> الإصدار 99 — ذكاء اقتصادي مدمج
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="text-4xl md:text-6xl font-black mb-5 leading-[1.05]">
              <span className="bg-gradient-to-l from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">منصة سيادية</span><br/>
              <span className="bg-gradient-to-l from-amber-200 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent">لبناء البزنس وإطلاقه</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="text-slate-200 max-w-xl text-base leading-relaxed mb-7">
              من الفكرة إلى المنصة الفعلية برابط مستقل، QR، إعلانات فيديو احترافية، وبحث علمي مدعوم بالذكاء الاصطناعي.
            </motion.p>

            {/* Dual Entry Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <Button onClick={() => attack('/b99/generator')} size="lg"
                className="h-14 bg-gradient-to-l from-violet-500 via-fuchsia-500 to-cyan-500 text-white font-bold gap-2 shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                <Sparkles className="w-4 h-4" /> دخول خارجي — ابدأ الآن
              </Button>
              <Button onClick={() => nav('/login')} size="lg" variant="outline"
                className="h-14 bg-white/5 border-white/30 text-white hover:bg-white/15 hover:text-white font-bold gap-2">
                <LogIn className="w-4 h-4" /> دخول داخلي للأعضاء
              </Button>
            </div>
            <p className="mt-3 text-[11px] text-slate-300 leading-relaxed">
              الدخول الخارجي للزوار والمستثمرين بدون حساب • الدخول الداخلي لأعضاء BatShark Economy لربط البيانات.
            </p>
          </div>

          {/* Logo emblem */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
            className="relative aspect-square max-w-md mx-auto">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-violet-500/20" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-8 rounded-full border border-cyan-500/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.3),transparent_60%)] blur-2xl" />
            <motion.img src={logo} alt="BatShark" className="invert relative z-10 w-full h-full object-contain p-12 drop-shadow-[0_0_60px_rgba(139,92,246,0.7)]"
              animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          </motion.div>
        </div>
      </section>

      {/* PORTALS */}
      <section className="space-y-5">
        <div>
          <div className="text-xs text-slate-300 uppercase tracking-[0.3em]">البوابات الرئيسية</div>
          <h2 className="text-2xl md:text-3xl font-black mt-1">اختر ما تحتاجه — كل بوابة منصة كاملة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PORTALS.map((p, i) => (
            <motion.button key={p.to} onClick={() => attack(p.to)}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
              className="group text-right relative rounded-3xl p-6 bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/15 hover:border-white/40 transition-all overflow-hidden">
              <div className={`absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br ${p.accent} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity`} />
              <div className="relative flex items-start gap-4">
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${p.accent} shadow-2xl shrink-0`}>
                  <p.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge className="mb-2 border-white/20 bg-white/10 text-white text-[10px]">{p.tag}</Badge>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg md:text-xl font-black text-white">{p.title}</h3>
                    <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-white group-hover:-translate-x-1 transition-all shrink-0" />
                  </div>
                  <p className="text-sm text-slate-200 mt-2 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* LEVELS */}
      <section className="space-y-5">
        <div>
          <div className="text-xs text-slate-300 uppercase tracking-[0.3em]">المولّد بـ4 مستويات</div>
          <h2 className="text-2xl md:text-3xl font-black mt-1">كل مستوى تجربة وأسئلة مختلفة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {LEVELS.map((l, i) => (
            <motion.button key={l.to} onClick={() => attack(l.to)}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-white/15 bg-slate-900/60 p-4 text-right hover:border-white/40">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${l.accent}`} />
              <l.icon className="w-7 h-7 text-cyan-300 mb-3" />
              <h3 className="font-black text-white">{l.t}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-200">{l.d}</p>
              <ArrowLeft className="mt-4 w-4 h-4 text-slate-300 group-hover:text-white group-hover:-translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section>
        <div className="text-center mb-6 text-xs text-slate-300 uppercase tracking-[0.3em]">لماذا Batshark 99</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PILLARS.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl bg-white/[0.05] border border-white/10">
              <p.icon className="w-6 h-6 text-violet-300 mb-3" />
              <div className="text-sm font-bold text-white">{p.t}</div>
              <div className="text-xs text-slate-300 mt-1 leading-relaxed">{p.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { i: Building2, t: 'حدّد متطلباتك', d: 'صورة الهيرو، الأقسام، طريقة الدفع، رحلة العميل، هل سلايد طولي أم متعدد.' },
          { i: ScanLine, t: 'يبني المنصة فعلياً', d: 'رابط مستقل + QR Code + رمز دخول للمالك + تحكم كامل بالمحتوى.' },
          { i: KeyRound, t: 'بِع أو سلّم المنصة', d: 'فعّل وضع البيع، حدّد سعراً، وسلّم المالك صلاحياته الكاملة برمز.' },
        ].map((s, i) => (
          <Card key={i} className="bg-white/[0.04] border-white/10 p-5">
            <s.i className="w-7 h-7 text-cyan-300 mb-3" />
            <div className="text-base font-black text-white">{s.t}</div>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">{s.d}</p>
          </Card>
        ))}
      </section>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-cyan-500/15 border-white/15 p-8 text-center">
        <Target className="w-10 h-10 mx-auto text-violet-200 mb-3" />
        <h3 className="text-2xl md:text-3xl font-black mb-2 text-white">جاهز لبناء بزنسك التالي؟</h3>
        <p className="text-sm text-slate-200 mb-5 max-w-xl mx-auto">ابدأ من المولّد التفاعلي وسيرشدك BatShark خطوة بخطوة حتى توليد منصة فعلية وفيديو إعلاني جاهز للنشر.</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={() => attack('/b99/generator')} size="lg" className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-xl gap-2">
            <Rocket className="w-4 h-4" /> ابدأ الآن
          </Button>
          <Button onClick={() => attack('/b99/ads')} size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white gap-2">
            <Video className="w-4 h-4" /> استوديو الإعلانات
          </Button>
        </div>
      </Card>
    </div>
  );
}
