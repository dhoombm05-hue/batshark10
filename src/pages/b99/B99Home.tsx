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
    <div className="space-y-24">
      {/* ============ LUXURY HERO ============ */}
      <section className="relative -mx-4 md:-mx-6 lg:-mx-8 -mt-6 px-4 md:px-8 pt-10 pb-20 overflow-hidden rounded-b-[3rem]">
        {/* Deep luxury backdrop: midnight + gold */}
        <div className="absolute inset-0 bg-[#0a0a12]" />
        <div className="absolute inset-0 opacity-90"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(212,175,55,0.18), transparent 45%), radial-gradient(circle at 85% 80%, rgba(139,92,246,0.22), transparent 50%), radial-gradient(circle at 50% 50%, rgba(34,211,238,0.08), transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* gold sparkle dots */}
        {[...Array(18)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-300/70"
            style={{ top: `${(i * 53) % 95 + 2}%`, left: `${(i * 37) % 95 + 2}%` }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.6, 1] }}
            transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

        <div className="relative max-w-6xl mx-auto">
          {/* Tiny English tagline at top */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-8">
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/60" />
            <span className="text-[10px] tracking-[0.5em] text-amber-300/90 font-light uppercase">
              Batshark · The Greatest
            </span>
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/60" />
          </motion.div>

          {/* Centered logo emblem */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="relative w-44 h-44 md:w-56 md:h-56 mx-auto mb-8"
          >
            {/* gold halo rings */}
            <motion.div
              className="absolute inset-0 rounded-full border border-amber-400/30"
              animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute -inset-4 rounded-full border border-dashed border-amber-300/20"
              animate={{ rotate: -360 }} transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/10 via-transparent to-violet-500/10 blur-2xl" />
            <motion.img
              src={logo}
              alt="BATSHARK"
              className="relative w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(212,175,55,0.45)] invert brightness-200"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Main wordmark */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-center mb-6">
            <h1 className="font-black tracking-tight leading-[0.95]">
              <span className="block text-5xl md:text-7xl bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(212,175,55,0.3)]">
                بات شارك
              </span>
              <span className="block text-7xl md:text-[8rem] mt-2 font-black bg-gradient-to-b from-white via-amber-100 to-amber-400 bg-clip-text text-transparent leading-none">
                99
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="text-center max-w-2xl mx-auto text-base md:text-lg text-slate-300/90 leading-relaxed mb-10 font-light">
            منصة سيادية لبناء وتعزيز وتوظيف الذكاء لأي بزنس —
            <span className="text-amber-200/90 font-normal"> ثلاث مسارات احترافية</span>،
            ربط باكند فوري، وموظف رقمي يعمل ٢٤/٧.
          </motion.p>

          {/* CTA bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Button onClick={() => attack('/b99/level/1')} size="lg"
              className="h-14 px-8 bg-gradient-to-l from-amber-400 via-amber-300 to-amber-500 hover:opacity-95 text-slate-950 font-black gap-2 rounded-full shadow-[0_15px_50px_rgba(212,175,55,0.4)] border border-amber-200">
              <Sparkles className="w-4 h-4" /> ابدأ المسار الأول
            </Button>
            <Button onClick={() => nav('/login')} size="lg" variant="outline"
              className="h-14 px-7 bg-white/5 backdrop-blur-md border-amber-300/30 text-amber-100 hover:bg-amber-400/10 hover:text-white hover:border-amber-200 font-bold gap-2 rounded-full">
              <LogIn className="w-4 h-4" /> دخول الأعضاء
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> دخول داخلي + وضع زائر</span>
            <span className="flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5 text-cyan-400" /> رابط مشاركة مستقل</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> ذكاء اصطناعي مدمج</span>
          </motion.div>
        </div>
      </section>

      {/* THREE LEVELS */}
      <section>
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-500/60" />
            <span className="text-[10px] tracking-[0.4em] text-amber-700 font-bold uppercase">Three Tiers</span>
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-500/60" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-3">اختر <span className="bg-gradient-to-l from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent">مسارك الاحترافي</span></h2>
          <p className="text-slate-600 max-w-2xl mx-auto">كل مستوى تجربة مختلفة كلياً — ليست نفس النموذج بألوان مختلفة.</p>
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
