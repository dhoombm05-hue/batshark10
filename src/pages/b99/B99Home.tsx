import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Megaphone, Layers, Search, BarChart3, Brain, Rocket, Shield, ArrowLeft, Zap, Globe2, Target } from 'lucide-react';

const HERO_FEATURES = [
  { icon: Sparkles, title: 'مولد أفكار تفاعلي', desc: 'حوار ذكي بـ4 مستويات يولّد فكرة بزنس مع تحليل مالي وتنافسي كامل', to: '/b99/generator', color: 'from-violet-500 to-fuchsia-500' },
  { icon: Megaphone, title: 'الحملات الإعلانية', desc: 'بناء حملات احترافية بقوالب جاهزة + أفضل وقت نشر + توزيع منصات', to: '/b99/ads', color: 'from-rose-500 to-orange-500' },
  { icon: Layers, title: 'مولد منصات مستقلة', desc: 'يولّد منصة فعلية كاملة بصفحات وأقسام جاهزة برابطها الخاص', to: '/b99/platforms', color: 'from-cyan-500 to-blue-500' },
  { icon: Search, title: 'محرك البحث الذكي', desc: 'بحث سياقي يعطي إجابة مباشرة ونتائج عملية + اقتراحات', to: '/b99/search', color: 'from-amber-500 to-yellow-500' },
];

const PILLARS = [
  { icon: Brain, t: 'تحليل سلوكي عميق', d: 'الـAI يفهم نمط تفكيرك قبل التوصية' },
  { icon: Shield, t: 'بيانات حقيقية', d: 'أرقام ومؤشرات سوقية للسعودية والخليج' },
  { icon: Zap, t: 'نتائج فورية', d: 'بدون انتظار، توليد مباشر وحفظ تلقائي' },
  { icon: Globe2, t: 'منصة سيادية', d: 'مستقلة برابط ودومين خاص لكل بزنس' },
];

export default function B99Home() {
  const nav = useNavigate();
  return (
    <div className="space-y-12">
      <section className="text-center pt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-l from-violet-500/15 to-cyan-500/15 border border-white/10 text-xs text-slate-300 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-violet-300" /> الإصدار 99 — ذكاء اقتصادي مدمج
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black mb-4 leading-tight">
          <span className="bg-gradient-to-l from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">منصة سيادية كاملة</span><br/>
          <span className="text-2xl md:text-4xl bg-gradient-to-l from-amber-200 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent">لبناء وإطلاق الأعمال</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          توليد أفكار، حملات إعلانية احترافية، منصات مستقلة، وبحث ذكي — بقرارات نابعة من تحليل حقيقي لا عشوائية فيه.
        </motion.p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {HERO_FEATURES.map((f, i) => (
          <motion.button key={f.to} onClick={() => nav(f.to)}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
            className="group text-right relative rounded-2xl p-6 bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 hover:border-white/30 transition-all overflow-hidden">
            <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${f.color} opacity-10 blur-3xl group-hover:opacity-30 transition-opacity`} />
            <div className="relative flex items-start gap-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${f.color} shadow-xl`}>
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black">{f.title}</h3>
                  <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                </div>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </section>

      <section>
        <div className="text-center mb-6 text-xs text-slate-400 uppercase tracking-widest">لماذا Batshark 99</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PILLARS.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p.icon className="w-5 h-5 text-violet-300 mb-2" />
              <div className="text-sm font-bold text-white">{p.t}</div>
              <div className="text-xs text-slate-400 mt-1">{p.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <Card className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-cyan-500/10 border-white/10 p-8 text-center">
        <Target className="w-10 h-10 mx-auto text-violet-300 mb-3" />
        <h3 className="text-2xl font-black mb-2">جاهز لبناء بزنسك التالي؟</h3>
        <p className="text-sm text-slate-400 mb-5 max-w-xl mx-auto">ابدأ من المولّد التفاعلي وسيرشدك BatShark خطوة بخطوة حتى توليد منصة فعلية لفكرتك.</p>
        <Button onClick={() => nav('/b99/generator')} size="lg" className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-xl gap-2">
          <Rocket className="w-4 h-4" /> ابدأ الآن
        </Button>
      </Card>
    </div>
  );
}
