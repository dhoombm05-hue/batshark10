import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Sparkles, RefreshCw, Calendar, Hash, Copy, Check, TrendingUp, Target, AlertTriangle, Image as ImgIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PRESETS = [
  { id: 'padel', name: 'ملاعب بادل', goal: 'حجوزات' },
  { id: 'umbrella', name: 'مظلات سيارات', goal: 'استفسار وتركيب' },
  { id: 'screen', name: 'شاشات إعلانية', goal: 'عقود إيجار' },
  { id: 'custom', name: 'مخصص', goal: 'حسب الاختيار' },
];

const DEFAULT_PLATFORMS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'snapchat', name: 'Snapchat' },
  { id: 'twitter', name: 'X / Twitter' },
  { id: 'google_ads', name: 'Google Ads' },
  { id: 'youtube', name: 'YouTube' },
];

export default function B99Ads() {
  const { identity }: any = useOutletContext();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;
  const [preset, setPreset] = useState('padel');
  const [form, setForm] = useState({
    businessType: 'ملاعب بادل', goal: 'حجوزات', audience: 'شباب 18-35 محبي الرياضة',
    budget: 1000, brief: '', currentPlatforms: '',
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
    const found = PRESETS.find(x => x.id === p);
    if (found && p !== 'custom') setForm((f) => ({ ...f, businessType: found.name, goal: found.goal }));
  };

  const generate = async () => {
    setLoading(true); setCampaign(null);
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generate_campaign', userId: identity?.userId, payload: form },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setCampaign(data.campaign);
      toast.success('تم بناء الحملة');
      loadHistory();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const copyTemplate = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(i);
    toast.success('تم النسخ');
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs text-slate-400 uppercase tracking-widest">ركن الحملات الإعلانية</div>
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2"><Megaphone className="w-6 h-6 text-rose-400" /> إستوديو الإعلانات الذكي</h1>
        <p className="text-sm text-slate-400 mt-2">معطيات خفيفة → حملة جاهزة بقوالب نشر، أفضل أوقات، توزيع منصات.</p>
      </header>

      <Card className="bg-white/[0.03] border-white/10 p-5">
        <div className="text-xs text-slate-400 mb-2">قالب سريع</div>
        <div className="flex flex-wrap gap-2 mb-5">
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => applyPreset(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${preset === p.id ? 'bg-gradient-to-r from-rose-500 to-orange-500 border-transparent text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30'}`}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label className="text-xs">نوع النشاط</Label><Input value={form.businessType} onChange={(e) => setForm({...form, businessType: e.target.value})} className="bg-slate-900/60 border-white/10" /></div>
          <div><Label className="text-xs">الهدف من الحملة</Label>
            <Select value={form.goal} onValueChange={(v) => setForm({...form, goal: v})}>
              <SelectTrigger className="bg-slate-900/60 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['حجوزات','وعي بالعلامة','مبيعات مباشرة','عملاء محتملين','تنزيل تطبيق','زيارات موقع'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">الجمهور المستهدف</Label><Input value={form.audience} onChange={(e) => setForm({...form, audience: e.target.value})} className="bg-slate-900/60 border-white/10" placeholder="مثال: شباب 25-40 الرياض" /></div>
          <div><Label className="text-xs">الميزانية (ر.س)</Label><Input type="number" value={form.budget} onChange={(e) => setForm({...form, budget: Number(e.target.value)})} className="bg-slate-900/60 border-white/10" /></div>
          <div className="md:col-span-2"><Label className="text-xs">الموجز / ما تريد إيصاله</Label>
            <Textarea value={form.brief} onChange={(e) => setForm({...form, brief: e.target.value})} rows={3}
              placeholder="اكتب باختصار ما تريد إيصاله، أو ميزتك، أو عرض خاص..."
              className="bg-slate-900/60 border-white/10" />
          </div>
        </div>

        <Button onClick={generate} disabled={loading} className="w-full mt-5 h-12 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 gap-2 text-white font-bold">
          {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> AI يبني الحملة...</> : <><Sparkles className="w-4 h-4" /> ولّد الحملة الكاملة</>}
        </Button>
      </Card>

      <AnimatePresence>
        {campaign && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="bg-gradient-to-br from-rose-500/15 to-orange-500/10 border-white/10 p-6">
              <h2 className="text-2xl font-black mb-2">{campaign.name}</h2>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {campaign.platforms?.map((p: string) => <Badge key={p} className="bg-white/10 text-white border border-white/20 text-[10px] uppercase">{p}</Badge>)}
              </div>
              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                <div className="text-[10px] text-slate-400 mb-1">نسخة الإعلان الرئيسية</div>
                <div className="text-sm leading-relaxed whitespace-pre-line">{campaign.ad_copy}</div>
                <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  CTA: {campaign.cta}
                </div>
              </div>
              {campaign.hashtags?.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  {campaign.hashtags.map((h: string) => <span key={h} className="text-xs text-cyan-300">#{h.replace(/^#/, '')}</span>)}
                </div>
              )}
            </Card>

            {campaign.best_times?.length > 0 && (
              <Card className="bg-white/[0.03] border-white/10 p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-300" /> أفضل أوقات النشر</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {campaign.best_times.map((t: any, i: number) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="font-bold text-sm">{t.day}</div>
                      <div className="text-xs text-amber-300">{t.time}</div>
                      {t.reason && <div className="text-[11px] text-slate-400 mt-1">{t.reason}</div>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {campaign.templates?.length > 0 && (
              <Card className="bg-white/[0.03] border-white/10 p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-300" /> قوالب جاهزة للنشر ({campaign.templates.length})</h3>
                <div className="space-y-3">
                  {campaign.templates.map((t: any, i: number) => (
                    <div key={i} className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="border-white/20 text-slate-300 text-[10px] uppercase">{t.platform}</Badge>
                        <button onClick={() => copyTemplate(`${t.headline}\n\n${t.body}`, i)}
                          className="text-xs text-violet-300 hover:text-white flex items-center gap-1">
                          {copiedIdx === i ? <><Check className="w-3 h-3" /> تم النسخ</> : <><Copy className="w-3 h-3" /> نسخ</>}
                        </button>
                      </div>
                      <div className="font-bold text-sm mb-1.5">{t.headline}</div>
                      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{t.body}</div>
                      {t.visual_idea && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-cyan-300 bg-cyan-500/5 border border-cyan-500/20 rounded p-2">
                          <ImgIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <div><span className="font-bold">فكرة بصرية: </span>{t.visual_idea}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {campaign.ai_analysis && (
              <Card className="bg-white/[0.03] border-white/10 p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-300" /> تحليل الحملة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {campaign.ai_analysis.positioning && <Info label="التموضع" value={campaign.ai_analysis.positioning} />}
                  {campaign.ai_analysis.expected_reach && <Info label="الوصول المتوقع" value={campaign.ai_analysis.expected_reach} />}
                  {campaign.ai_analysis.expected_ctr && <Info label="CTR متوقع" value={campaign.ai_analysis.expected_ctr} />}
                  {campaign.ai_analysis.budget_split && <Info label="توزيع الميزانية" value={campaign.ai_analysis.budget_split} />}
                </div>
                {campaign.ai_analysis.risks?.length > 0 && (
                  <div className="mt-4 bg-rose-500/5 border border-rose-500/20 rounded-lg p-3">
                    <div className="text-xs font-bold text-rose-300 mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> مخاطر</div>
                    <ul className="text-xs text-slate-300 list-disc mr-4 space-y-0.5">
                      {campaign.ai_analysis.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <Card className="bg-white/[0.03] border-white/10 p-5">
          <h3 className="text-sm font-bold mb-3">حملاتك السابقة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {history.map((h: any) => (
              <button key={h.id} onClick={() => setCampaign({ ...h, ad_copy: h.ad_copy })}
                className="text-right p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/30">
                <div className="font-bold text-sm">{h.name}</div>
                <div className="text-[10px] text-slate-400">{h.business_type} • {(h.platforms||[]).slice(0,3).join(', ')}</div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: any) {
  return <div className="bg-white/5 border border-white/10 rounded p-2.5">
    <div className="text-[10px] text-slate-400">{label}</div>
    <div className="text-xs text-slate-200 mt-0.5">{value}</div>
  </div>;
}
