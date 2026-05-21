import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Plug, Bot, ArrowLeft, LogIn, Zap, Layers, Megaphone, Search, CheckCircle2, Globe2 } from 'lucide-react';
import logo from '@/assets/batshark-logo-official.png';

const LEVELS = [
  {
    id: 1,
    to: '/b99/level/1',
    icon: Sparkles,
    title: 'المستوى 1 — ابني من الصفر',
    desc: 'لا تملك موقعاً. نبني لك منصة كاملة بالباكند والذكاء الاصطناعي ورابط مستقل.',
    badge: 'الأكثر طلباً',
    accent: 'bg-blue-600',
    pillars: ['بناء كامل من الصفر', 'ربط باكند جاهز', 'لوحة مالك', 'منشور برابط مستقل'],
  },
  {
    id: 2,
    to: '/b99/level/2',
    icon: Plug,
    title: 'المستوى 2 — عزّز موقعي',
    desc: 'لديك موقع وتريد تعزيزه: إحصائيات، ذكاء اصطناعي، إعلانات، ومحلل متقدم.',
    badge: 'ربط مباشر',
    accent: 'bg-green-600',
    pillars: ['Embed Snippet جاهز', 'Webhook + API Key', 'AI داخل موقعك', 'تحليلات حية'],
  },
  {
    id: 3,
    to: '/b99/level/3',
    icon: Bot,
    title: 'المستوى 3 — وظّف بات شارك',
    desc: 'موظف ذكي 24/7: يحلل، يرسل إيميلات، يتابع، ويعالج البيانات.',
    badge: 'موظف رقمي',
    accent: 'bg-black',
    pillars: ['تقارير دورية', 'مراقبة KPIs', 'إشعارات إيميل/واتساب', 'معالجة بيانات معقدة'],
  },
];

const PORTALS = [
  { icon: Layers, to: '/b99/platforms', t: 'إدارة منصاتي', d: 'كل المنصات الناتجة' },
  { icon: Megaphone, to: '/b99/ads', t: 'استوديو الإعلانات', d: 'فيديوهات بالـAI' },
  { icon: Search, to: '/b99/search', t: 'البحث الذكي', d: 'إجابات فورية بمصادر' },
];

export default function B99Home() {
  const nav = useNavigate();

  return (
    <div className="space-y-16">
      {/* HERO — clean, contrast, 4 colors only */}
      <section className="relative bg-white border-2 border-black p-8 md:p-14 shadow-[8px_8px_0_0_#000]">
        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-black text-white text-[10px] tracking-[0.4em] font-bold uppercase mb-5">
              Batshark · The Greatest
            </div>
            <h1 className="font-black tracking-tight leading-[0.95] text-black">
              <span className="block text-5xl md:text-7xl">بات شارك</span>
              <span className="block text-7xl md:text-[9rem] text-blue-600 leading-none">99</span>
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg text-black/80 leading-relaxed">
              منصة سيادية لبناء وتعزيز وتوظيف الذكاء لأي بزنس —
              <span className="text-blue-600 font-bold"> ثلاث مسارات احترافية</span>،
              ربط باكند فوري، وموظف رقمي يعمل ٢٤/٧.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button onClick={() => nav('/b99/level/1')} size="lg"
                className="h-14 px-7 bg-blue-600 hover:bg-blue-700 text-white font-black gap-2 rounded-none border-2 border-black shadow-[4px_4px_0_0_#000]">
                <Sparkles className="w-4 h-4" /> ابدأ المسار الأول
              </Button>
              <Button onClick={() => nav('/login')} size="lg" variant="outline"
                className="h-14 px-6 bg-white border-2 border-black text-black hover:bg-black hover:text-white font-bold gap-2 rounded-none">
                <LogIn className="w-4 h-4" /> دخول الأعضاء
              </Button>
            </div>
          </div>
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
            src={logo} alt="BATSHARK"
            className="w-40 md:w-56 mx-auto drop-shadow-[6px_6px_0_#000]"
          />
        </div>
      </section>

      {/* THREE LEVELS */}
      <section>
        <div className="mb-8">
          <div className="text-[10px] tracking-[0.4em] text-blue-600 font-bold uppercase mb-2">Three Tiers</div>
          <h2 className="text-3xl md:text-5xl font-black text-black">اختر مسارك الاحترافي</h2>
          <p className="mt-2 text-black/70 max-w-2xl">كل مستوى تجربة مختلفة كلياً — ليست نفس النموذج بألوان مختلفة.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {LEVELS.map((l, i) => (
            <motion.button
              key={l.id}
              onClick={() => nav(l.to)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group text-right relative p-6 bg-white border-2 border-black hover:shadow-[6px_6px_0_0_#000] transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${l.accent} text-white border-2 border-black`}>
                  <l.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] px-2 py-1 bg-black text-white font-bold">{l.badge}</span>
              </div>

              <h3 className="text-xl font-black text-black mb-2">{l.title}</h3>
              <p className="text-sm text-black/70 leading-relaxed mb-5 min-h-[64px]">{l.desc}</p>

              <ul className="space-y-2 mb-5">
                {l.pillars.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-black">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> {p}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-4 border-t-2 border-black">
                <span className="text-sm font-black text-blue-600">ابدأ المستوى {l.id}</span>
                <ArrowLeft className="w-5 h-5 text-black group-hover:-translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* PORTALS */}
      <section>
        <h2 className="text-2xl md:text-3xl font-black text-black mb-5">بوابات سريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PORTALS.map((p) => (
            <button key={p.to} onClick={() => nav(p.to)}
              className="group text-right p-5 bg-white border-2 border-black hover:bg-blue-600 hover:text-white transition-colors">
              <p.icon className="w-7 h-7 mb-3" />
              <div className="font-black">{p.t}</div>
              <div className="text-xs opacity-70 mt-1">{p.d}</div>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white p-10 md:p-12 text-center border-2 border-black">
        <Globe2 className="w-12 h-12 mx-auto mb-4 text-blue-400" />
        <h3 className="text-3xl md:text-4xl font-black mb-3">جاهز لتطلق بزنسك؟</h3>
        <p className="text-base md:text-lg opacity-90 mb-6 max-w-xl mx-auto">منصة فعلية برابط مستقل + ذكاء اصطناعي + استوديو إعلانات + موظف ذكي.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => nav('/b99/level/1')} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-black gap-2 h-12 px-6 rounded-none border-2 border-white">
            <Zap className="w-4 h-4" /> ابدأ الآن مجاناً
          </Button>
          <Button onClick={() => nav('/b99/level/2')} size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black gap-2 h-12 px-6 rounded-none font-bold">
            <Plug className="w-4 h-4" /> اربط موقعي
          </Button>
        </div>
      </section>
    </div>
  );
}
