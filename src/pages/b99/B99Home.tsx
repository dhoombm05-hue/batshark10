import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plug, Bot, ArrowLeft, LogIn, ShieldCheck, Zap, Layers, Megaphone, Search, CheckCircle2, Globe2 } from 'lucide-react';
import logo from '@/assets/batshark-logo-official.png';

const LEVELS = [
  {
    id: 1,
    to: '/b99/level/1',
    icon: Sparkles,
    title: 'المستوى 1 — ابني من الصفر',
    desc: 'لا تملك موقعاً، أو لديك موقع غير احترافي. نبني لك منصة كاملة بالباكند والذكاء الاصطناعي.',
    accent: 'from-violet-500 via-fuchsia-500 to-pink-500',
    badge: 'الأكثر طلباً',
    pillars: ['بناء كامل من الصفر', 'ربط باكند جاهز', 'لوحة مالك', 'منشور برابط مستقل'],
  },
  {
    id: 2,
    to: '/b99/level/2',
    icon: Plug,
    title: 'المستوى 2 — عزّز موقعي',
    desc: 'لديك موقع احترافي وتريد تعزيزه: إحصائيات، ذكاء اصطناعي، إعلانات، ومحلل متقدم يعمل داخل موقعك.',
    accent: 'from-cyan-500 via-sky-500 to-indigo-500',
    badge: 'ربط مباشر',
    pillars: ['Embed Snippet جاهز', 'Webhook + API Key', 'AI داخل موقعك', 'تحليلات حية'],
  },
  {
    id: 3,
    to: '/b99/level/3',
    icon: Bot,
    title: 'المستوى 3 — وظّف بات شارك',
    desc: 'عندك كل شيء ويعجبك أن يكون لك موظف ذكي 24/7: يحلل الإحصائيات، يرسل إيميلات، يتابع موظفينك ويعالج البيانات المعقدة.',
    accent: 'from-amber-500 via-orange-500 to-rose-500',
    badge: 'موظف رقمي',
    pillars: ['تقارير دورية', 'مراقبة KPIs', 'إشعارات إيميل/واتساب', 'معالجة بيانات معقدة'],
  },
];

const PORTALS = [
  { icon: Layers, to: '/b99/platforms', t: 'إدارة منصاتي', d: 'كل المنصات الناتجة' },
  { icon: Megaphone, to: '/b99/ads', t: 'استوديو الإعلانات', d: 'فيديوهات بالـAI' },
  { icon: Search, to: '/b99/search', t: 'البحث الذكي', d: 'إجابات فورية مدعومة' },
];

export default function B99Home() {
  const nav = useNavigate();
  const attack = (to: string) => window.dispatchEvent(new CustomEvent('batshark:attack', { detail: { to } }));

  return (
    <div className="space-y-20">
      {/* HERO */}
      <section className="relative pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-xs text-violet-700 font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> الإصدار 99 — منصة سيادية لبناء الأعمال
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="text-4xl md:text-6xl font-black mb-5 leading-[1.05] text-slate-900">
              <span className="bg-gradient-to-l from-violet-700 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">بات شارك 99</span><br/>
              <span className="text-slate-800">منصة بناء وتعزيز</span><br/>
              <span className="text-slate-800">و</span>
              <span className="bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent"> توظيف ذكاء</span>
              <span className="text-slate-800"> لأي بزنس</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="text-slate-600 max-w-xl text-base md:text-lg leading-relaxed mb-7">
              ثلاث مسارات احترافية: ابدأ من الصفر، اربط موقعك القائم بباكند وذكاء اصطناعي، أو وظّف بات شارك كموظف ذكي يدير لك التقارير والمتابعات.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mb-4">
              <Button onClick={() => attack('/b99/level/1')} size="lg"
                className="h-14 bg-gradient-to-l from-violet-600 via-fuchsia-600 to-cyan-600 text-white font-bold gap-2 shadow-[0_8px_30px_rgba(139,92,246,0.35)]">
                <Sparkles className="w-4 h-4" /> ابدأ من المستوى 1
              </Button>
              <Button onClick={() => nav('/login')} size="lg" variant="outline"
                className="h-14 bg-white border-slate-300 text-slate-700 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300 font-bold gap-2">
                <LogIn className="w-4 h-4" /> دخول داخلي للأعضاء
              </Button>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              الدخول الخارجي للزوار والمستثمرين بدون حساب • الدخول الداخلي لأعضاء بات شارك Economy
            </p>
          </div>

          {/* Hero — official BATSHARK logo as centerpiece */}
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
            className="relative aspect-square max-w-md mx-auto">
            {/* layered glow rings */}
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-violet-100 via-white to-cyan-100 border border-white shadow-2xl shadow-violet-200/50" />
            <motion.div
              className="absolute inset-6 rounded-[2.5rem] border border-violet-200/70"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-12 rounded-[2rem] border border-cyan-200/70 border-dashed"
              animate={{ rotate: -360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            />
            {/* official logo */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center p-16"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img src={logo} alt="بات شارك 99" className="w-full h-full object-contain drop-shadow-[0_15px_40px_rgba(15,23,42,0.25)]" />
            </motion.div>
            {/* corner badge */}
            <div className="absolute -bottom-3 -left-3 z-20 px-4 py-2 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">Official Identity</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* THREE LEVELS */}
      <section>
        <div className="text-center mb-10">
          <Badge className="bg-violet-100 text-violet-700 border-violet-200 mb-3">3 مستويات احترافية</Badge>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">اختر مستواك ومسارك</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">كل مستوى تجربة كاملة مختلفة — ليست نفس النموذج بألوان مختلفة.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {LEVELS.map((l, i) => (
            <motion.button
              key={l.id}
              onClick={() => attack(l.to)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="group text-right relative rounded-3xl p-7 bg-white border border-slate-200 hover:border-transparent transition-all overflow-hidden shadow-lg shadow-slate-200/40 hover:shadow-2xl"
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l ${l.accent}`} />
              <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br ${l.accent} opacity-10 group-hover:opacity-25 blur-3xl transition-opacity`} />

              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${l.accent} shadow-lg`}>
                    <l.icon className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">{l.badge}</Badge>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-2">{l.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5 min-h-[80px]">{l.desc}</p>

                <ul className="space-y-2 mb-6">
                  {l.pillars.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className={`text-sm font-bold bg-gradient-to-l ${l.accent} bg-clip-text text-transparent`}>ابدأ المستوى {l.id}</span>
                  <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-violet-600 group-hover:-translate-x-1 transition-all" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* PORTALS */}
      <section>
        <div className="mb-6">
          <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 mb-2">أدوات إضافية</Badge>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">بوابات سريعة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PORTALS.map((p) => (
            <button key={p.to} onClick={() => attack(p.to)}
              className="group text-right p-5 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 transition-all shadow-sm hover:shadow-lg">
              <p.icon className="w-7 h-7 text-violet-600 mb-3" />
              <div className="font-bold text-slate-900">{p.t}</div>
              <div className="text-xs text-slate-500 mt-1">{p.d}</div>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <Card className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-600 border-0 p-10 md:p-12 text-center text-white rounded-3xl shadow-2xl shadow-violet-300/30">
        <Globe2 className="w-12 h-12 mx-auto mb-4 opacity-90" />
        <h3 className="text-3xl md:text-4xl font-black mb-3">جاهز لتطلق بزنسك؟</h3>
        <p className="text-base md:text-lg opacity-90 mb-6 max-w-xl mx-auto">اختر مستواك وستحصل على منصة فعلية برابط مستقل + ربط ذكاء اصطناعي + استوديو إعلانات + موظف ذكي اختياري.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => attack('/b99/level/1')} size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold gap-2 h-12 px-6">
            <Zap className="w-4 h-4" /> ابدأ الآن مجاناً
          </Button>
          <Button onClick={() => attack('/b99/level/2')} size="lg" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-2 h-12 px-6">
            <Plug className="w-4 h-4" /> اربط موقعي
          </Button>
        </div>
      </Card>
    </div>
  );
}
