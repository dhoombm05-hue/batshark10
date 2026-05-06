import { useEffect, useState } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Megaphone, Layers, Lightbulb, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function B99Dashboard() {
  const { identity }: any = useOutletContext();
  const nav = useNavigate();
  const [data, setData] = useState<any>({ campaigns: [], platforms: [], recs: [] });

  useEffect(() => {
    if (!identity?.userId) return;
    (async () => {
      const [c, p, r] = await Promise.all([
        supabase.from('ad_campaigns').select('*').eq('user_id', identity.userId).order('created_at', { ascending: false }).limit(6),
        supabase.from('generated_platforms').select('*').eq('user_id', identity.userId).order('created_at', { ascending: false }).limit(6),
        supabase.from('batshare_recommendations').select('*').eq('user_id', identity.userId).order('created_at', { ascending: false }).limit(6),
      ]);
      setData({ campaigns: c.data || [], platforms: p.data || [], recs: r.data || [] });
    })();
  }, [identity]);

  if (!identity?.userId) {
    return (
      <Card className="bg-white/[0.03] border-white/10 p-10 text-center">
        <LayoutDashboard className="w-12 h-12 mx-auto text-slate-500 mb-3" />
        <h2 className="text-xl font-bold mb-2">سجّل دخولك لرؤية لوحتك</h2>
        <p className="text-sm text-slate-400 mb-4">لوحة التحكم الشخصية متاحة للأعضاء فقط لحفظ ومتابعة الحملات والمنصات.</p>
        <Button asChild><Link to="/login">تسجيل الدخول</Link></Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs text-slate-400 uppercase tracking-widest">لوحة التحكم</div>
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-violet-400" /> مرحباً، {identity.name}
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard icon={Megaphone} label="حملاتي" count={data.campaigns.length} color="from-rose-500 to-orange-500" onClick={() => nav('/b99/ads')} />
        <SummaryCard icon={Layers} label="منصاتي" count={data.platforms.length} color="from-cyan-500 to-blue-500" onClick={() => nav('/b99/platforms')} />
        <SummaryCard icon={Lightbulb} label="أفكاري" count={data.recs.length} color="from-violet-500 to-fuchsia-500" onClick={() => nav('/b99/generator')} />
      </div>

      <Section title="آخر الحملات" empty={data.campaigns.length === 0} cta={() => nav('/b99/ads')}>
        {data.campaigns.map((c: any) => (
          <div key={c.id} className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
            <div><div className="font-bold text-sm">{c.name}</div><div className="text-[10px] text-slate-400">{c.business_type}</div></div>
            <Badge variant="outline" className="border-white/20 text-slate-300 text-[10px]">{c.status}</Badge>
          </div>
        ))}
      </Section>

      <Section title="آخر المنصات" empty={data.platforms.length === 0} cta={() => nav('/b99/platforms')}>
        {data.platforms.map((p: any) => (
          <Link key={p.id} to={`/p/${p.slug}`} target="_blank"
            className="p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/30 flex items-center justify-between">
            <div><div className="font-bold text-sm">{p.name}</div><div className="text-[10px] text-slate-400">/p/{p.slug}</div></div>
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">{p.status}</Badge>
          </Link>
        ))}
      </Section>
    </div>
  );
}

function SummaryCard({ icon: I, label, count, color, onClick }: any) {
  return (
    <button onClick={onClick} className="text-right p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/30 transition-all">
      <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${color} mb-3`}><I className="w-5 h-5 text-white" /></div>
      <div className="text-3xl font-black">{count}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
    </button>
  );
}

function Section({ title, empty, cta, children }: any) {
  return (
    <Card className="bg-white/[0.03] border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">{title}</h3>
        <Button onClick={cta} size="sm" variant="ghost" className="text-violet-300 gap-1 text-xs"><Plus className="w-3 h-3" /> جديد</Button>
      </div>
      {empty ? <div className="text-center py-6 text-xs text-slate-500">لا يوجد بعد</div> : <div className="space-y-2">{children}</div>}
    </Card>
  );
}
