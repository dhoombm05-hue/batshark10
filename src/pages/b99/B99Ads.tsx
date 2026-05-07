import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useOutletContext } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Calendar, Check, Copy, Hash, Image as ImageIcon, Megaphone, RefreshCw, Rocket, Search, Sparkles, Target, TrendingUp, Video } from 'lucide-react';

const PRESETS = [
  { id: 'padel', name: 'ملاعب بادل', goal: 'حجوزات', audience: 'شباب وموظفين 18-40 داخل المدينة، يهتمون بالرياضة والترفيه' },
  { id: 'umbrella', name: 'مظلات سيارات', goal: 'عملاء محتملين', audience: 'أصحاب منازل واستراحات وشركات يحتاجون تركيب مظلات' },
  { id: 'healthy-food', name: 'أكل صحي', goal: 'مبيعات مباشرة', audience: 'موظفين ورياضيين ومهتمين بالدايت' },
  { id: 'custom', name: 'مخصص', goal: 'حسب الاختيار', audience: '' },
];

export default function B99Ads() {
  const { identity }: any = useOutletContext();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;
  const [preset, setPreset] = useState('padel');
  const [form, setForm] = useState({
    businessType: 'ملاعب بادل',
    goal: 'حجوزات',
    audience: 'شباب وموظفين 18-40 داخل المدينة، يهتمون بالرياضة والترفيه',
    budget: 1000,
    city: 'الرياض',
    productOffer: '',
    brief: '',
    tone: 'لهجة سعودية احترافية',
    assets: 'لا يوجد',
    currentPlatforms: '',
  });
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (prefill) {
      setForm((f) => ({ ...f, businessType: prefill.businessType || f.businessType, brief: prefill.brief || f.brief }));
      setPreset('custom');
    }
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!identity?.userId) return;
    const { data } = await supabase.from('ad_campaigns').select('*').eq('user_id', identity.userId).order('created_at', { ascending: false }).limit(8);
    setHistory(data || []);
  };

  const applyPreset = (p: string) => {
    setPreset(p);
    const found = PRESETS.find((x) => x.id === p);
    if (found && p !== 'custom') setForm((f) => ({ ...f, businessType: found.name, goal: found.goal, audience: found.audience }));
  };

  const generate = async () => {
    setLoading(true);
    setCampaign(null);
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generate_campaign', userId: identity?.userId, payload: form },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setCampaign(data.campaign);
      toast.success('تم بناء غرفة عمليات الحملة');
      loadHistory();
    } catch (e: any) {
      toast.error(e.message || 'تعذر توليد الحملة');
    } finally {
      setLoading(false);
    }
  };

  const copyTemplate = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(i);
    toast.success('تم النسخ');
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(10_90%_55%/0.18),transparent_35%),radial-gradient(circle_at_80%_0%,hsl(45_95%_55%/0.14),transparent_35%)]" />
        <div className="relative">
          <div className="text-xs text-slate-400 uppercase tracking-widest">Advertising War Room</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl md:text-4xl font-black"><Megaphone className="w-7 h-7 text-rose-400" /> منصة الحملات الإعلانية</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 leading-relaxed">أعطها معطيات خفيفة؛ ترجع لك خطة نشر، أفضل أوقات، قوالب لكل منصة، فكرة فيديو، وزوايا إعلانية جاهزة.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[390px_1fr] gap-5">
        <Card className="border-white/10 bg-white/[0.035] p-5">
          <div className="mb-4 text-xs text-slate-400">قوالب يومية سريعة</div>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {PRESETS.map((p) => <button key={p.id} onClick={() => applyPreset(p.id)} className={`rounded-xl border px-3 py-2 text-xs transition-all ${preset === p.id ? 'border-transparent bg-rose-500 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'}`}>{p.name}</button>)}
          </div>
          <div className="space-y-3">
            <Field label="نوع النشاط"><Input value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} className="border-white/10 bg-slate-950/70" /></Field>
            <Field label="المدينة"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border-white/10 bg-slate-950/70" /></Field>
            <Field label="الهدف"><Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v })}><SelectTrigger className="border-white/10 bg-slate-950/70"><SelectValue /></SelectTrigger><SelectContent>{['حجوزات', 'وعي بالعلامة', 'مبيعات مباشرة', 'عملاء محتملين', 'زيارات موقع', 'رسائل واتساب'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="الميزانية اليومية/الأسبوعية"><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} className="border-white/10 bg-slate-950/70" /></Field>
            <Field label="العرض أو المنتج"><Input value={form.productOffer} onChange={(e) => setForm({ ...form, productOffer: e.target.value })} placeholder="خصم، باقة، حجز ساعة..." className="border-white/10 bg-slate-950/70" /></Field>
            <Field label="الجمهور"><Textarea value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} rows={3} className="border-white/10 bg-slate-950/70" /></Field>
            <Field label="ملاحظات إضافية"><Textarea value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} rows={3} className="border-white/10 bg-slate-950/70" placeholder="مميزاتك، منافسك، وقت الافتتاح، أي عرض خاص..." /></Field>
          </div>
          <Button onClick={generate} disabled={loading} className="mt-5 h-12 w-full bg-gradient-to-l from-rose-500 via-orange-500 to-amber-400 font-bold text-white">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin" /> يحلل السوق والتوقيت...</> : <><Sparkles className="h-4 w-4" /> ولّد غرفة عمليات الإعلان</>}
          </Button>
        </Card>

        <div className="space-y-4">
          {!campaign && <EmptyOps />}
          <AnimatePresence>
            {campaign && (
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Card className="border-white/10 bg-gradient-to-br from-rose-500/15 to-amber-500/10 p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <Badge className="mb-2 border-emerald-500/30 bg-emerald-500/15 text-emerald-300">جاهزة للنشر</Badge>
                      <h2 className="text-2xl md:text-3xl font-black">{campaign.name}</h2>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">{campaign.ad_copy}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center"><div className="text-[10px] text-slate-500">CTA</div><div className="mt-1 font-black text-amber-300">{campaign.cta}</div></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">{campaign.platforms?.map((p: string) => <Badge key={p} className="border-white/20 bg-white/10 text-[10px] text-white">{p}</Badge>)}</div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(campaign.best_times || []).map((t: any, i: number) => <Card key={i} className="border-white/10 bg-white/[0.035] p-4"><Calendar className="mb-2 h-4 w-4 text-amber-300" /><div className="text-sm font-bold">{t.day}</div><div className="text-xs text-amber-200">{t.time}</div><p className="mt-2 text-[11px] text-slate-400">{t.reason}</p></Card>)}
                </div>

                <Card className="border-white/10 bg-white/[0.035] p-5"><h3 className="mb-3 flex items-center gap-2 text-sm font-black"><Video className="h-4 w-4 text-cyan-300" /> قوالب وزوايا جاهزة</h3><div className="space-y-3">{campaign.templates?.map((t: any, i: number) => <div key={i} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"><div className="mb-2 flex items-center justify-between gap-2"><Badge variant="outline" className="border-white/20 text-slate-300 text-[10px]">{t.platform}</Badge><button onClick={() => copyTemplate(`${t.headline}\n\n${t.body}\n\n${t.visual_idea || ''}`, i)} className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white">{copiedIdx === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} نسخ</button></div><h4 className="font-bold">{t.headline}</h4><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">{t.body}</p>{t.visual_idea && <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-200"><ImageIcon className="inline h-3.5 w-3.5" /> {t.visual_idea}</div>}</div>)}</div></Card>

                {campaign.ai_analysis && <Card className="border-white/10 bg-white/[0.035] p-5"><h3 className="mb-3 flex items-center gap-2 text-sm font-black"><Target className="h-4 w-4 text-emerald-300" /> تحليل وتنفيذ</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Info label="التموضع" value={campaign.ai_analysis.positioning} icon={TrendingUp} /><Info label="الوصول المتوقع" value={campaign.ai_analysis.expected_reach} icon={Search} /><Info label="CTR" value={campaign.ai_analysis.expected_ctr} icon={Target} /><Info label="توزيع الميزانية" value={campaign.ai_analysis.budget_split} icon={Megaphone} /></div>{campaign.ai_analysis.risks?.length > 0 && <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3"><div className="mb-2 flex items-center gap-1 text-xs font-bold text-rose-300"><AlertTriangle className="h-3 w-3" /> انتبه</div><ul className="list-disc pr-4 text-xs text-slate-300">{campaign.ai_analysis.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul></div>}</Card>}
              </motion.div>
            )}
          </AnimatePresence>

          {history.length > 0 && <Card className="border-white/10 bg-white/[0.03] p-5"><h3 className="mb-3 text-sm font-black">حملاتك السابقة</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{history.map((h: any) => <button key={h.id} onClick={() => setCampaign({ ...h, ad_copy: h.ad_copy })} className="rounded-xl border border-white/10 bg-white/5 p-3 text-right hover:border-white/30"><div className="text-sm font-bold">{h.name}</div><div className="text-[10px] text-slate-500">{h.business_type}</div></button>)}</div></Card>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div><Label className="mb-2 block text-xs text-slate-300">{label}</Label>{children}</div>;
}

function Info({ label, value, icon: Icon }: any) {
  return <div className="rounded-xl border border-white/10 bg-black/25 p-3"><Icon className="mb-1 h-4 w-4 text-cyan-300" /><div className="text-[10px] text-slate-500">{label}</div><div className="mt-1 text-xs text-slate-200">{value || '—'}</div></div>;
}

function EmptyOps() {
  return <Card className="border-white/10 bg-slate-950/80 p-8 text-center"><Megaphone className="mx-auto mb-3 h-12 w-12 text-rose-300" /><h2 className="text-xl font-black">غرفة العمليات تنتظر المعطيات</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">اختر قالب يومي مثل البادل أو المظلات، أو اكتب نشاطك. سيولد النظام إعلاناً عملياً وليس كلاماً عاماً.</p></Card>;
}