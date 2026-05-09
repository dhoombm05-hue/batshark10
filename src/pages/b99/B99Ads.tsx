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
import { AlertTriangle, Calendar, Check, Copy, Image as ImageIcon, Megaphone, RefreshCw, Search, Sparkles, Target, TrendingUp, Video, Mic, Film, Layers as LayersIcon, ChevronLeft, ChevronRight, Play } from 'lucide-react';

const PRESETS = [
  { id: 'padel', name: 'ملاعب بادل', goal: 'حجوزات', audience: 'شباب وموظفين 18-40 داخل المدينة، يهتمون بالرياضة والترفيه' },
  { id: 'umbrella', name: 'مظلات سيارات', goal: 'عملاء محتملين', audience: 'أصحاب منازل واستراحات وشركات يحتاجون تركيب مظلات' },
  { id: 'healthy-food', name: 'أكل صحي', goal: 'مبيعات مباشرة', audience: 'موظفين ورياضيين ومهتمين بالدايت' },
  { id: 'perfumes', name: 'عطور', goal: 'مبيعات مباشرة', audience: 'محبي العطور والهدايا الفاخرة' },
  { id: 'custom', name: 'مخصص', goal: 'حسب الاختيار', audience: '' },
];

const STEPS = [
  { id: 'business', label: 'النشاط' },
  { id: 'objective', label: 'الهدف والميزانية' },
  { id: 'creative', label: 'الإبداع والشكل' },
  { id: 'review', label: 'التوليد' },
];

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
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
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
    setSceneIdx(0);
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generate_campaign', userId: identity?.userId, payload: form },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setCampaign(data.campaign);
      toast.success('تم بناء حملة فيديو إعلانية كاملة');
      loadHistory();
    } catch (e: any) {
      toast.error(e.message || 'تعذر توليد الحملة');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(key);
    toast.success('تم النسخ');
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/80 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(10_90%_55%/0.18),transparent_38%),radial-gradient(circle_at_80%_0%,hsl(45_95%_55%/0.16),transparent_38%)]" />
        <div className="relative">
          <Badge className="mb-2 border-white/20 bg-white/10 text-white">Video Ads Studio</Badge>
          <h1 className="flex items-center gap-2 text-2xl md:text-4xl font-black text-white"><Video className="w-7 h-7 text-rose-300" /> استوديو الإعلانات بالفيديو</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200 leading-relaxed">استبيان احترافي قبل التوليد، ثم سكربت فيديو إعلاني كامل: Hook، مشاهد، صوت، نص شاشة، Prompt جاهز لمولّد الفيديو، وقوالب نشر لكل منصة.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => setStep(i)}
            className={`px-3 py-2 rounded-full text-xs font-bold border transition-all ${i === step ? 'bg-gradient-to-r from-rose-500 to-amber-400 text-white border-transparent' : 'bg-white/5 border-white/15 text-slate-300 hover:text-white'}`}>
            <span className="opacity-60">{i + 1}.</span> {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <Card className="border-white/15 bg-white/[0.04] p-5">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block text-xs text-slate-200">قوالب جاهزة سريعة</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {PRESETS.map((p) => (
                        <button key={p.id} onClick={() => applyPreset(p.id)}
                          className={`rounded-xl border px-3 py-2 text-xs transition-all ${preset === p.id ? 'border-transparent bg-rose-500 text-white' : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30'}`}>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="نوع النشاط"><Input value={form.businessType} onChange={(e) => update('businessType', e.target.value)} className="bg-slate-950/70 border-white/15" /></Field>
                  <Field label="المدينة"><Input value={form.city} onChange={(e) => update('city', e.target.value)} className="bg-slate-950/70 border-white/15" /></Field>
                  <Field label="الجمهور"><Textarea value={form.audience} onChange={(e) => update('audience', e.target.value)} rows={3} className="bg-slate-950/70 border-white/15" /></Field>
                </div>
              )}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="الهدف">
                    <Select value={form.goal} onValueChange={(v) => update('goal', v)}>
                      <SelectTrigger className="bg-slate-950/70 border-white/15"><SelectValue /></SelectTrigger>
                      <SelectContent>{['حجوزات','وعي بالعلامة','مبيعات مباشرة','عملاء محتملين','زيارات موقع','رسائل واتساب'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="الميزانية اليومية (ر.س)"><Input type="number" value={form.budget} onChange={(e) => update('budget', Number(e.target.value))} className="bg-slate-950/70 border-white/15" /></Field>
                  <Field label="العرض/المنتج"><Input value={form.productOffer} onChange={(e) => update('productOffer', e.target.value)} placeholder="خصم، باقة، حجز ساعة..." className="bg-slate-950/70 border-white/15" /></Field>
                  <Field label="المنصات الحالية"><Input value={form.currentPlatforms} onChange={(e) => update('currentPlatforms', e.target.value)} className="bg-slate-950/70 border-white/15" /></Field>
                </div>
              )}
              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="مدة الإعلان (ثانية)">
                    <Select value={String(form.duration)} onValueChange={(v) => update('duration', Number(v))}>
                      <SelectTrigger className="bg-slate-950/70 border-white/15"><SelectValue /></SelectTrigger>
                      <SelectContent>{[6,15,30,60].map((d) => <SelectItem key={d} value={String(d)}>{d} ثانية</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="نسبة الفيديو">
                    <Select value={form.format} onValueChange={(v) => update('format', v)}>
                      <SelectTrigger className="bg-slate-950/70 border-white/15"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vertical">عمودي 9:16 (Reels/TikTok)</SelectItem>
                        <SelectItem value="square">مربع 1:1 (Feed)</SelectItem>
                        <SelectItem value="horizontal">أفقي 16:9 (YouTube)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="نبرة الإعلان"><Input value={form.tone} onChange={(e) => update('tone', e.target.value)} className="bg-slate-950/70 border-white/15" /></Field>
                  <Field label="الأصول المتاحة"><Input value={form.assets} onChange={(e) => update('assets', e.target.value)} className="bg-slate-950/70 border-white/15" /></Field>
                  <div className="md:col-span-2"><Field label="ملاحظات إضافية"><Textarea value={form.brief} onChange={(e) => update('brief', e.target.value)} rows={3} className="bg-slate-950/70 border-white/15" placeholder="مميزاتك، منافسك، عرض خاص..." /></Field></div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-3">
                  <SummaryRow k="النشاط" v={form.businessType} />
                  <SummaryRow k="الهدف" v={form.goal} />
                  <SummaryRow k="المدة" v={`${form.duration} ثانية`} />
                  <SummaryRow k="النسبة" v={form.format === 'vertical' ? '9:16 عمودي' : form.format === 'square' ? '1:1 مربع' : '16:9 أفقي'} />
                  <SummaryRow k="الميزانية" v={`${form.budget} ر.س/يوم`} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={prev} disabled={step === 0} className="border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white">السابق</Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} className="bg-gradient-to-l from-rose-500 to-amber-400 text-white">التالي</Button>
            ) : (
              <Button onClick={generate} disabled={loading} className="bg-gradient-to-l from-rose-500 via-orange-500 to-amber-400 text-white font-bold gap-2">
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> يكتب السكربت ويرسم المشاهد...</> : <><Sparkles className="w-4 h-4" /> ولّد الفيديو الإعلاني</>}
              </Button>
            )}
          </div>
        </Card>

        <aside className="space-y-3">
          <Card className="border-white/15 bg-slate-950/70 p-5">
            <Film className="mb-3 h-6 w-6 text-rose-300" />
            <h3 className="font-black text-white">إعلان متكامل</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-200">سكربت + Hook + مشاهد بالتفصيل + نص صوتي + نص شاشة + Prompt جاهز لأي مولد فيديو AI.</p>
          </Card>
          {history.length > 0 && (
            <Card className="border-white/15 bg-white/[0.04] p-5">
              <h3 className="mb-3 text-sm font-black text-white">حملاتك السابقة</h3>
              <div className="space-y-2">
                {history.map((h) => (
                  <button key={h.id} onClick={() => setCampaign(h)} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-right hover:border-white/30">
                    <div className="text-sm font-bold text-white">{h.name}</div>
                    <div className="text-[10px] text-slate-400">{h.business_type}</div>
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
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="border-white/15 bg-gradient-to-br from-rose-500/15 to-amber-500/10 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge className="mb-2 border-emerald-500/30 bg-emerald-500/15 text-emerald-200">جاهزة للنشر</Badge>
                  <h2 className="text-2xl md:text-3xl font-black text-white">{campaign.name}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-200">{campaign.ad_copy}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/30 p-4 text-center">
                  <div className="text-[10px] text-slate-300">CTA</div>
                  <div className="mt-1 font-black text-amber-200">{campaign.cta}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">{campaign.platforms?.map((p: string) => <Badge key={p} className="border-white/20 bg-white/10 text-[10px] text-white">{p}</Badge>)}</div>
            </Card>

            {/* STORYBOARD */}
            {Array.isArray(campaign.video_scenes) && campaign.video_scenes.length > 0 && (
              <Card className="border-white/15 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-sm font-black text-white"><LayersIcon className="h-4 w-4 text-cyan-300" /> Storyboard مشهد بمشهد</h3>
                  <div className="text-[11px] text-slate-300">{campaign.duration_seconds || form.duration}ث · {campaign.format || form.format}</div>
                </div>

                {/* Animated preview */}
                <div className={`relative mx-auto rounded-2xl overflow-hidden border border-white/10 bg-black ${form.format === 'vertical' ? 'aspect-[9/16] max-w-[280px]' : form.format === 'square' ? 'aspect-square max-w-md' : 'aspect-video max-w-2xl'}`}>
                  <AnimatePresence mode="wait">
                    <motion.div key={sceneIdx} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35 }}
                      className="absolute inset-0 flex flex-col justify-between p-5"
                      style={{ background: `linear-gradient(135deg, hsl(${(sceneIdx * 60) % 360} 70% 18%), hsl(${(sceneIdx * 60 + 120) % 360} 70% 8%))` }}>
                      <div className="text-[10px] text-white/60 uppercase tracking-widest">مشهد {sceneIdx + 1} / {campaign.video_scenes.length}</div>
                      <div className="space-y-2 text-center">
                        <div className="text-2xl md:text-3xl font-black text-white drop-shadow-lg leading-tight">{campaign.video_scenes[sceneIdx].on_screen_text}</div>
                        <div className="text-xs text-white/70 italic">{campaign.video_scenes[sceneIdx].visual}</div>
                      </div>
                      <div className="rounded-lg bg-black/40 border border-white/10 p-2">
                        <div className="text-[10px] text-amber-200 mb-0.5 flex items-center gap-1"><Mic className="w-3 h-3" /> صوت</div>
                        <div className="text-xs text-white">{campaign.video_scenes[sceneIdx].voiceover}</div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Button size="sm" variant="ghost" onClick={() => setSceneIdx((i) => Math.max(0, i - 1))} disabled={sceneIdx === 0} className="text-white"><ChevronRight className="w-4 h-4" /> السابق</Button>
                  <div className="flex gap-1">{campaign.video_scenes.map((_: any, i: number) => <div key={i} className={`w-2 h-2 rounded-full ${i === sceneIdx ? 'bg-rose-400' : 'bg-white/20'}`} />)}</div>
                  <Button size="sm" variant="ghost" onClick={() => setSceneIdx((i) => Math.min(campaign.video_scenes.length - 1, i + 1))} disabled={sceneIdx === campaign.video_scenes.length - 1} className="text-white">التالي <ChevronLeft className="w-4 h-4" /></Button>
                </div>

                {/* Scene list */}
                <div className="mt-4 space-y-2">
                  {campaign.video_scenes.map((sc: any, i: number) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="border-white/20 text-slate-200 text-[10px]">مشهد {i + 1} · {sc.duration || '3'}ث</Badge>
                        <span className="text-slate-300">{sc.shot_type}</span>
                      </div>
                      <div className="mt-2 text-sm font-bold text-white">{sc.on_screen_text}</div>
                      <div className="mt-1 text-xs text-slate-300"><span className="text-cyan-300">المشهد:</span> {sc.visual}</div>
                      <div className="mt-1 text-xs text-slate-300"><span className="text-amber-300">الصوت:</span> {sc.voiceover}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AI Video Prompt */}
            {campaign.video_prompt && (
              <Card className="border-white/15 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="flex items-center gap-2 text-sm font-black text-white"><Play className="h-4 w-4 text-violet-300" /> Prompt جاهز لتوليد الفيديو بالـAI</h3>
                  <button onClick={() => copy(campaign.video_prompt, 'prompt')} className="text-xs text-cyan-200 hover:text-white flex items-center gap-1">{copiedIdx === 'prompt' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} نسخ</button>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-slate-100 bg-black/30 p-3 rounded-lg leading-relaxed">{campaign.video_prompt}</pre>
              </Card>
            )}

            {/* Voiceover */}
            {campaign.voiceover_script && (
              <Card className="border-white/15 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="flex items-center gap-2 text-sm font-black text-white"><Mic className="h-4 w-4 text-amber-300" /> النص الصوتي الكامل</h3>
                  <button onClick={() => copy(campaign.voiceover_script, 'vo')} className="text-xs text-cyan-200 hover:text-white flex items-center gap-1">{copiedIdx === 'vo' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} نسخ</button>
                </div>
                <p className="text-sm text-slate-100 whitespace-pre-line leading-relaxed">{campaign.voiceover_script}</p>
              </Card>
            )}

            {/* Best times */}
            {campaign.best_times?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {campaign.best_times.map((t: any, i: number) => (
                  <Card key={i} className="border-white/15 bg-white/[0.04] p-4">
                    <Calendar className="mb-2 h-4 w-4 text-amber-300" />
                    <div className="text-sm font-bold text-white">{t.day}</div>
                    <div className="text-xs text-amber-200">{t.time}</div>
                    <p className="mt-2 text-[11px] text-slate-200">{t.reason}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Templates per platform */}
            {campaign.templates?.length > 0 && (
              <Card className="border-white/15 bg-white/[0.04] p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-white"><ImageIcon className="h-4 w-4 text-cyan-300" /> قوالب نشر لكل منصة</h3>
                <div className="space-y-3">
                  {campaign.templates.map((t: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Badge variant="outline" className="border-white/20 text-slate-200 text-[10px]">{t.platform}</Badge>
                        <button onClick={() => copy(`${t.headline}\n\n${t.body}\n\n${t.visual_idea || ''}`, `tpl-${i}`)} className="flex items-center gap-1 text-xs text-cyan-200 hover:text-white">{copiedIdx === `tpl-${i}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} نسخ</button>
                      </div>
                      <h4 className="font-bold text-white">{t.headline}</h4>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-200">{t.body}</p>
                      {t.visual_idea && <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-100"><ImageIcon className="inline h-3.5 w-3.5" /> {t.visual_idea}</div>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {campaign.ai_analysis && (
              <Card className="border-white/15 bg-white/[0.04] p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-white"><Target className="h-4 w-4 text-emerald-300" /> تحليل وتنفيذ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Info label="التموضع" value={campaign.ai_analysis.positioning} icon={TrendingUp} />
                  <Info label="الوصول المتوقع" value={campaign.ai_analysis.expected_reach} icon={Search} />
                  <Info label="CTR" value={campaign.ai_analysis.expected_ctr} icon={Target} />
                  <Info label="توزيع الميزانية" value={campaign.ai_analysis.budget_split} icon={Megaphone} />
                </div>
                {campaign.ai_analysis.risks?.length > 0 && (
                  <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                    <div className="mb-2 flex items-center gap-1 text-xs font-bold text-rose-200"><AlertTriangle className="h-3 w-3" /> انتبه</div>
                    <ul className="list-disc pr-4 text-xs text-slate-200">{campaign.ai_analysis.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
                  </div>
                )}
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div><Label className="mb-2 block text-xs text-slate-200">{label}</Label>{children}</div>;
}
function Info({ label, value, icon: Icon }: any) {
  return <div className="rounded-xl border border-white/10 bg-black/25 p-3"><Icon className="mb-1 h-4 w-4 text-cyan-300" /><div className="text-[10px] text-slate-300">{label}</div><div className="mt-1 text-xs text-slate-100">{value || '—'}</div></div>;
}
function SummaryRow({ k, v }: any) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
      <div className="text-xs text-slate-300">{k}</div>
      <div className="text-sm font-bold text-white">{v}</div>
    </div>
  );
}
