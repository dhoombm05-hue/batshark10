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
import {
  AlertTriangle, Calendar, Check, Copy, Image as ImageIcon, Megaphone, RefreshCw,
  Sparkles, Target, TrendingUp, Video, Mic, Film, Layers as LayersIcon,
  ChevronLeft, ChevronRight, Play,
} from 'lucide-react';
import logo from '@/assets/batshark-logo-official.png';
import { cn } from '@/lib/utils';

const PRESETS = [
  { id: 'padel',        name: 'ملاعب بادل',     goal: 'حجوزات',        audience: 'شباب وموظفين 18-40 داخل المدينة، يهتمون بالرياضة والترفيه' },
  { id: 'umbrella',     name: 'مظلات سيارات',   goal: 'عملاء محتملين', audience: 'أصحاب منازل واستراحات وشركات يحتاجون تركيب مظلات' },
  { id: 'healthy-food', name: 'أكل صحي',         goal: 'مبيعات مباشرة', audience: 'موظفين ورياضيين ومهتمين بالدايت' },
  { id: 'perfumes',     name: 'عطور فاخرة',      goal: 'مبيعات مباشرة', audience: 'محبي العطور والهدايا الفاخرة' },
  { id: 'custom',       name: 'مخصص',            goal: 'حسب الاختيار',   audience: '' },
];

const STEPS = [
  { id: 'business',  label: 'النشاط' },
  { id: 'objective', label: 'الهدف والميزانية' },
  { id: 'creative',  label: 'الإبداع والشكل' },
  { id: 'review',    label: 'المراجعة والتوليد' },
];

const FORMATS = [
  { value: 'vertical',   label: 'عمودي 9:16', sub: 'TikTok · Reels · Shorts' },
  { value: 'square',     label: 'مربع 1:1',    sub: 'Feed · Instagram' },
  { value: 'horizontal', label: 'أفقي 16:9',  sub: 'YouTube · Web' },
];

const DURATIONS = [6, 15, 30, 60];

export default function B99Ads() {
  const { identity }: any = useOutletContext();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;

  const [step, setStep] = useState(0);
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
    currentPlatforms: 'TikTok, Snapchat, Instagram',
    duration: 15,
    format: 'vertical',
    targetPlatforms: ['TikTok', 'Snapchat', 'Instagram'],
  });
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sceneIdx, setSceneIdx] = useState(0);

  useEffect(() => {
    if (prefill) {
      setForm((f) => ({ ...f, businessType: prefill.businessType || f.businessType, brief: prefill.brief || f.brief }));
      setPreset('custom');
    }
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!identity?.userId) return;
    const { data } = await supabase.from('ad_campaigns')
      .select('*').eq('user_id', identity.userId)
      .order('created_at', { ascending: false }).limit(8);
    setHistory(data || []);
  };

  const applyPreset = (p: string) => {
    setPreset(p);
    const f = PRESETS.find((x) => x.id === p);
    if (f && p !== 'custom') setForm((s) => ({ ...s, businessType: f.name, goal: f.goal, audience: f.audience }));
  };

  const generate = async () => {
    setLoading(true); setCampaign(null); setSceneIdx(0);
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generate_video_ad', userId: identity?.userId, payload: form },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setCampaign(data.campaign || data);
      toast.success('تم بناء حملة الفيديو');
      loadHistory();
    } catch (e: any) {
      toast.error(e.message || 'تعذر التوليد');
    } finally { setLoading(false); }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('تم النسخ');
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const scenes = Array.isArray(campaign?.video_scenes) ? campaign.video_scenes : [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-white via-slate-50 to-amber-50/30">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-6">

        {/* HEADER — same identity as Home */}
        <header className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-500/60" />
            <span className="text-[10px] tracking-[0.4em] text-amber-700 font-bold uppercase">Video Ads Studio</span>
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-500/60" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
            استوديو <span className="bg-gradient-to-l from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent">الإعلانات الذكية</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            استبيان احترافي قصير ثم سكربت فيديو كامل: Hook، مشاهد، صوت، نص شاشة، Prompt جاهز للتوليد بالـAI.
          </p>
        </header>

        {/* STEPS BAR */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => setStep(i)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all',
                i === step
                  ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-md'
                  : i < step
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'
              )}>
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
                i === step ? 'bg-amber-400 text-slate-950' : i < step ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500')}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* MAIN FORM */}
          <Card className="relative overflow-hidden border border-slate-200 bg-white p-6 md:p-8 rounded-3xl shadow-[0_20px_60px_-30px_rgba(15,23,42,0.15)]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100/60 to-transparent rounded-bl-[6rem] pointer-events-none" />
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}>

                  {/* STEP 0 — Business */}
                  {step === 0 && (
                    <div className="space-y-5">
                      <SectionLabel index="01" title="نشاطك ومدينتك" />
                      <div>
                        <Label className="block text-xs font-bold text-slate-700 mb-2">قوالب جاهزة</Label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {PRESETS.map((p) => (
                            <button key={p.id} onClick={() => applyPreset(p.id)}
                              className={cn(
                                'rounded-xl px-3 py-2.5 text-xs font-bold border transition-all text-center',
                                preset === p.id
                                  ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-700'
                              )}>
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="نوع النشاط"><CleanInput value={form.businessType} onChange={(v) => update('businessType', v)} /></Field>
                        <Field label="المدينة"><CleanInput value={form.city} onChange={(v) => update('city', v)} /></Field>
                      </div>
                      <Field label="الجمهور المستهدف">
                        <Textarea value={form.audience} onChange={(e) => update('audience', e.target.value)} rows={3}
                          className="bg-white border-slate-200 focus-visible:ring-amber-400/40 focus-visible:border-amber-300 rounded-xl" />
                      </Field>
                    </div>
                  )}

                  {/* STEP 1 — Objective */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <SectionLabel index="02" title="الهدف والميزانية" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="الهدف من الإعلان">
                          <Select value={form.goal} onValueChange={(v) => update('goal', v)}>
                            <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['حجوزات','وعي بالعلامة','مبيعات مباشرة','عملاء محتملين','زيارات موقع','رسائل واتساب']
                                .map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="الميزانية اليومية (ر.س)">
                          <CleanInput type="number" value={String(form.budget)} onChange={(v) => update('budget', Number(v))} />
                        </Field>
                        <Field label="العرض / المنتج">
                          <CleanInput value={form.productOffer} onChange={(v) => update('productOffer', v)} placeholder="خصم، باقة، حجز ساعة..." />
                        </Field>
                        <Field label="منصاتك الحالية">
                          <CleanInput value={form.currentPlatforms} onChange={(v) => update('currentPlatforms', v)} />
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 — Creative */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <SectionLabel index="03" title="الإبداع والشكل" />

                      <div>
                        <Label className="block text-xs font-bold text-slate-700 mb-2">مدة الإعلان</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {DURATIONS.map((d) => (
                            <button key={d} onClick={() => update('duration', d)}
                              className={cn(
                                'py-3 rounded-xl text-sm font-bold border transition-all',
                                form.duration === d
                                  ? 'border-amber-500 bg-amber-50 text-amber-900'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'
                              )}>
                              {d}<span className="text-[10px] font-normal opacity-70"> ث</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="block text-xs font-bold text-slate-700 mb-2">نسبة الفيديو</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {FORMATS.map((f) => (
                            <button key={f.value} onClick={() => update('format', f.value)}
                              className={cn(
                                'p-3 rounded-xl text-right border transition-all',
                                form.format === f.value
                                  ? 'border-amber-500 bg-amber-50'
                                  : 'border-slate-200 bg-white hover:border-amber-300'
                              )}>
                              <div className={cn('text-sm font-bold', form.format === f.value ? 'text-amber-900' : 'text-slate-800')}>{f.label}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{f.sub}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="نبرة الإعلان"><CleanInput value={form.tone} onChange={(v) => update('tone', v)} /></Field>
                        <Field label="الأصول المتاحة"><CleanInput value={form.assets} onChange={(v) => update('assets', v)} /></Field>
                      </div>
                      <Field label="ملاحظات إضافية">
                        <Textarea value={form.brief} onChange={(e) => update('brief', e.target.value)} rows={3}
                          placeholder="مميزاتك، منافسك، عرض خاص..."
                          className="bg-white border-slate-200 focus-visible:ring-amber-400/40 focus-visible:border-amber-300 rounded-xl" />
                      </Field>
                    </div>
                  )}

                  {/* STEP 3 — Review */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <SectionLabel index="04" title="مراجعة سريعة قبل التوليد" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <SummaryRow k="النشاط" v={form.businessType} />
                        <SummaryRow k="المدينة" v={form.city} />
                        <SummaryRow k="الهدف" v={form.goal} />
                        <SummaryRow k="الميزانية اليومية" v={`${form.budget} ر.س`} />
                        <SummaryRow k="المدة" v={`${form.duration} ث`} />
                        <SummaryRow k="النسبة" v={FORMATS.find(f=>f.value===form.format)?.label || form.format} />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-between gap-3 pt-5 border-t border-slate-100">
                <Button variant="ghost" onClick={prev} disabled={step === 0}
                  className="text-slate-600 hover:text-amber-700 hover:bg-amber-50 gap-1">
                  <ChevronRight className="w-4 h-4" /> السابق
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={next}
                    className="h-11 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold gap-1">
                    التالي <ChevronLeft className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={generate} disabled={loading}
                    className="h-12 px-7 rounded-full bg-gradient-to-l from-amber-500 to-amber-400 hover:opacity-95 text-slate-950 font-black gap-2 shadow-[0_10px_30px_-10px_rgba(212,175,55,0.5)]">
                    {loading
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> يكتب السكربت...</>
                      : <><Sparkles className="w-4 h-4" /> ولّد الفيديو الإعلاني</>}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* SIDEBAR */}
          <aside className="space-y-3">
            <Card className="border border-slate-200 bg-white p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <img src={logo} alt="" className="w-8 h-8 object-contain" />
                <div>
                  <div className="text-[10px] tracking-[0.3em] text-amber-700 font-black uppercase">Premium</div>
                  <div className="text-sm font-black text-slate-900">إعلان متكامل</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                سكربت + Hook + مشاهد بالتفصيل + نص صوتي + نص شاشة + Prompt جاهز لأي مولّد فيديو AI.
              </p>
            </Card>

            {history.length > 0 && (
              <Card className="border border-slate-200 bg-white p-5 rounded-2xl">
                <h3 className="text-xs font-black text-slate-900 mb-3 tracking-wide">حملاتك السابقة</h3>
                <div className="space-y-2">
                  {history.map((h) => (
                    <button key={h.id} onClick={() => setCampaign(h)}
                      className="w-full text-right p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition">
                      <div className="text-sm font-bold text-slate-900 truncate">{h.name}</div>
                      <div className="text-[10px] text-slate-500">{h.business_type}</div>
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </aside>
        </div>

        {/* RESULT */}
        <AnimatePresence>
          {campaign && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pt-4">

              <Card className="relative overflow-hidden border border-amber-200 bg-gradient-to-br from-white via-amber-50/40 to-white p-6 md:p-8 rounded-3xl">
                <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-amber-200/40 to-transparent rounded-br-[5rem]" />
                <div className="relative flex flex-col md:flex-row items-start gap-4 md:justify-between">
                  <div>
                    <Badge className="mb-2 bg-emerald-100 text-emerald-800 border-emerald-200">جاهزة للنشر</Badge>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900">{campaign.name || 'حملة جديدة'}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-line max-w-2xl">
                      {campaign.ad_copy || campaign.hook}
                    </p>
                  </div>
                  {campaign.cta && (
                    <div className="rounded-2xl border border-amber-200 bg-white px-5 py-4 text-center shadow-sm">
                      <div className="text-[10px] tracking-[0.3em] text-amber-700 font-bold uppercase">CTA</div>
                      <div className="mt-1 font-black text-slate-900">{campaign.cta}</div>
                    </div>
                  )}
                </div>
                {campaign.platforms?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {campaign.platforms.map((p: string) => (
                      <Badge key={p} className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">{p}</Badge>
                    ))}
                  </div>
                )}
              </Card>

              {/* STORYBOARD */}
              {scenes.length > 0 && (
                <Card className="border border-slate-200 bg-white p-6 rounded-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <LayersIcon className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] tracking-[0.3em] text-amber-700 font-black uppercase">Storyboard</span>
                      <span className="text-sm font-black text-slate-900">— مشهد بمشهد</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {(campaign.duration_seconds || form.duration) + 'ث'} · {FORMATS.find(f=>f.value===(campaign.format || form.format))?.label}
                    </div>
                  </div>

                  <div className={cn(
                    'relative mx-auto rounded-3xl overflow-hidden border border-slate-200 bg-slate-950',
                    form.format === 'vertical' ? 'aspect-[9/16] max-w-[280px]'
                      : form.format === 'square' ? 'aspect-square max-w-md'
                      : 'aspect-video max-w-2xl'
                  )}>
                    <AnimatePresence mode="wait">
                      <motion.div key={sceneIdx}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex flex-col justify-between p-5"
                        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #422006 100%)' }}>
                        <div className="text-[10px] text-amber-300/80 uppercase tracking-widest">مشهد {sceneIdx + 1} / {scenes.length}</div>
                        <div className="space-y-2 text-center">
                          <div className="text-2xl md:text-3xl font-black text-white drop-shadow-lg leading-tight">
                            {scenes[sceneIdx].on_screen_text || scenes[sceneIdx].text_on_screen}
                          </div>
                          <div className="text-xs text-amber-100/70 italic">{scenes[sceneIdx].visual}</div>
                        </div>
                        <div className="rounded-lg bg-black/40 border border-amber-300/20 p-2.5">
                          <div className="text-[10px] text-amber-300 mb-0.5 flex items-center gap-1"><Mic className="w-3 h-3" /> صوت</div>
                          <div className="text-xs text-white">{scenes[sceneIdx].voiceover || scenes[sceneIdx].voice}</div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Button size="sm" variant="ghost" onClick={() => setSceneIdx((i) => Math.max(0, i - 1))} disabled={sceneIdx === 0}>
                      <ChevronRight className="w-4 h-4" /> السابق
                    </Button>
                    <div className="flex gap-1">
                      {scenes.map((_: any, i: number) => (
                        <div key={i} className={cn('w-2 h-2 rounded-full transition', i === sceneIdx ? 'bg-amber-500 w-5' : 'bg-slate-300')} />
                      ))}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setSceneIdx((i) => Math.min(scenes.length - 1, i + 1))} disabled={sceneIdx === scenes.length - 1}>
                      التالي <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* AI Video Prompt */}
              {campaign.video_prompt && (
                <Card className="border border-slate-200 bg-white p-6 rounded-3xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-black text-slate-900">Prompt جاهز لتوليد الفيديو بالـAI</span>
                    </div>
                    <button onClick={() => copy(campaign.video_prompt, 'prompt')}
                      className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1">
                      {copiedKey === 'prompt' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} نسخ
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-slate-700 bg-slate-50 border border-slate-100 p-4 rounded-2xl leading-relaxed">{campaign.video_prompt}</pre>
                </Card>
              )}

              {/* Voiceover */}
              {campaign.voiceover_script && (
                <Card className="border border-slate-200 bg-white p-6 rounded-3xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-black text-slate-900">النص الصوتي الكامل</span>
                    </div>
                    <button onClick={() => copy(campaign.voiceover_script, 'vo')}
                      className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1">
                      {copiedKey === 'vo' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} نسخ
                    </button>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{campaign.voiceover_script}</p>
                </Card>
              )}

              {/* Best times */}
              {campaign.best_times?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {campaign.best_times.map((t: any, i: number) => (
                    <Card key={i} className="border border-slate-200 bg-white p-4 rounded-2xl">
                      <Calendar className="mb-2 w-4 h-4 text-amber-600" />
                      <div className="text-sm font-bold text-slate-900">{typeof t === 'string' ? t : t.day}</div>
                      {t.time && <div className="text-xs text-amber-700">{t.time}</div>}
                      {t.reason && <p className="mt-2 text-[11px] text-slate-600">{t.reason}</p>}
                    </Card>
                  ))}
                </div>
              )}

              {/* Templates per platform */}
              {campaign.templates?.length > 0 && (
                <Card className="border border-slate-200 bg-white p-6 rounded-3xl">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-900">
                    <ImageIcon className="w-4 h-4 text-amber-600" /> قوالب نشر لكل منصة
                  </h3>
                  <div className="space-y-3">
                    {campaign.templates.map((t: any, i: number) => (
                      <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">{t.platform}</Badge>
                          <button onClick={() => copy(`${t.headline}\n\n${t.body}\n\n${t.visual_idea || ''}`, `tpl-${i}`)}
                            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-bold">
                            {copiedKey === `tpl-${i}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} نسخ
                          </button>
                        </div>
                        <h4 className="font-bold text-slate-900">{t.headline}</h4>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{t.body}</p>
                        {t.visual_idea && (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
                            <ImageIcon className="inline h-3.5 w-3.5 ml-1" /> {t.visual_idea}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {campaign.ai_analysis && (
                <Card className="border border-slate-200 bg-white p-6 rounded-3xl">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-900">
                    <Target className="w-4 h-4 text-amber-600" /> تحليل وتنفيذ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Info label="التموضع"          value={campaign.ai_analysis.positioning}     icon={TrendingUp} />
                    <Info label="الوصول المتوقع"   value={campaign.ai_analysis.expected_reach}  icon={Megaphone} />
                    <Info label="CTR متوقع"        value={campaign.ai_analysis.expected_ctr}    icon={Target} />
                    <Info label="توزيع الميزانية"  value={campaign.ai_analysis.budget_split}    icon={Film} />
                  </div>
                  {campaign.ai_analysis.risks?.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <div className="mb-2 flex items-center gap-1 text-xs font-bold text-rose-700"><AlertTriangle className="w-3.5 h-3.5" /> انتبه</div>
                      <ul className="list-disc pr-4 text-xs text-rose-900 space-y-1">
                        {campaign.ai_analysis.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ===== Helpers ===== */

function Field({ label, children }: any) {
  return (
    <div>
      <Label className="block text-xs font-bold text-slate-700 mb-2">{label}</Label>
      {children}
    </div>
  );
}

function CleanInput({ value, onChange, placeholder, type = 'text' }: any) {
  return (
    <Input type={type} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border-slate-200 h-11 rounded-xl focus-visible:ring-amber-400/40 focus-visible:border-amber-300" />
  );
}

function SectionLabel({ index, title }: any) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
      <span className="text-[10px] tracking-[0.3em] text-amber-700 font-black uppercase">Step {index}</span>
      <span className="text-base font-black text-slate-900">— {title}</span>
    </div>
  );
}

function SummaryRow({ k, v }: any) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
      <div className="text-xs font-bold text-slate-500">{k}</div>
      <div className="text-sm font-black text-slate-900 truncate">{v || '—'}</div>
    </div>
  );
}

function Info({ label, value, icon: Icon }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
      <Icon className="mb-1.5 w-4 h-4 text-amber-600" />
      <div className="text-[10px] tracking-wider text-slate-500 uppercase">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value || '—'}</div>
    </div>
  );
}
