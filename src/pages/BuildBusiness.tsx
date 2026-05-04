import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles, Brain, Rocket, Wrench, BarChart3, RefreshCw, ArrowLeft,
  TrendingUp, Lightbulb, Target, ShieldCheck, User2, Globe2, ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'analyst';

const LEVELS: { id: Level; title: string; tagline: string; depth: string; icon: any; accent: string }[] = [
  { id: 'beginner',     title: 'مبتدئ',         tagline: 'لا تملك خبرة سابقة',          depth: 'خطوات مبسطة + أفكار منخفضة المخاطر',                              icon: Rocket,    accent: 'from-emerald-500 to-teal-500' },
  { id: 'intermediate', title: 'متوسط',         tagline: 'لديك أساسيات أو مشروع بسيط',  depth: 'تحليل تنافسي + خطة تطوير + مؤشرات مالية',                          icon: Wrench,    accent: 'from-amber-500 to-orange-500' },
  { id: 'advanced',     title: 'متقدم',         tagline: 'إدارة أعمال فعلية',           depth: 'نماذج أعمال مبتكرة + استراتيجيات توسع + مقارنات استثمارية',         icon: TrendingUp, accent: 'from-blue-500 to-indigo-500' },
  { id: 'analyst',      title: 'محلل احترافي',  tagline: 'تحليل كمي عميق',              depth: 'TAM/SAM/SOM، CAC/LTV، Burn، Break-even، سيناريوهات حساسية',         icon: BarChart3, accent: 'from-violet-500 to-fuchsia-500' },
];

const baseAnswers = {
  budget_amount: 5000,
  available_time: 'part_time',
  risk_tolerance: 'medium',
  skills: '',
  location: '',
  interests: '',
  experience: 'none',
  motivation: '',
  // advanced/analyst
  target_market: '',
  competitors: '',
  unique_value: '',
  expected_revenue: 0,
  data_points: '',
};

export default function BuildBusiness() {
  const [identity, setIdentity] = useState<{ name?: string; email?: string; userId?: string } | null>(null);
  const [identityChecked, setIdentityChecked] = useState(false);
  const [level, setLevel] = useState<Level | null>(null);
  const [answers, setAnswers] = useState({ ...baseAnswers });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isGuest = !identity?.userId;

  useEffect(() => {
    document.title = 'Batshare 99 — مولد البزنس الذكي';
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (u) {
        const { data: prof } = await supabase.from('profiles').select('display_name').eq('user_id', u.id).maybeSingle();
        setIdentity({ userId: u.id, email: u.email, name: prof?.display_name || u.email?.split('@')[0] });
      }
      setIdentityChecked(true);
    })();
  }, []);

  const update = (k: string, v: any) => setAnswers((a) => ({ ...a, [k]: v }));

  const submit = async () => {
    if (!level) return;
    setLoading(true);
    try {
      const body: any = { action: 'smart_assessment', payload: { track: level, answers } };
      if (identity?.userId) body.userId = identity.userId;
      else body.guest = true;
      const { data, error } = await supabase.functions.invoke('batshare99-ai', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast.success(`تم توليد ${data.recommendations.length} اقتراحات بمستوى ${LEVELS.find(l => l.id === level)?.title}`);
    } catch (e: any) {
      toast.error(e.message || 'فشل التوليد');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (recId: string) => {
    if (isGuest) {
      toast.info('يجب تسجيل الدخول لإنشاء مشروع داخل النظام');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('batshare99-ai', {
        body: { action: 'create_full_project', userId: identity!.userId, payload: { recommendationId: recId } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`🚀 تم إنشاء المشروع: ${data.project.name}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setLevel(null); setResult(null); setAnswers({ ...baseAnswers }); };

  const activeLevel = useMemo(() => LEVELS.find(l => l.id === level), [level]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 relative overflow-x-hidden">
      {/* Ambient lights */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">Batshare 99</div>
              <div className="text-[11px] text-slate-400">مولد البزنس الذكي — منصة مستقلة</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {!identityChecked ? null : isGuest ? (
              <Badge variant="outline" className="border-slate-600 text-slate-300 gap-1"><Globe2 className="w-3 h-3" /> زائر</Badge>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 gap-1"><User2 className="w-3 h-3" /> {identity?.name}</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        {/* Hero */}
        {!level && !result && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 mb-4">
              <Brain className="w-3.5 h-3.5 text-violet-400" /> ذكاء اصطناعي يبني فكرة بزنس مخصصة لك بدقة
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-l from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
              ابنِ بزنس حقيقي… بقرار حقيقي
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
              نظام مستقل يحلل سلوكك وميزانيتك ومهاراتك ويولّد فكرة بزنس بنسبة توافق فعلية، باختلاف عمق التحليل حسب مستواك.
            </p>
            {isGuest && identityChecked && (
              <div className="text-[11px] text-slate-500 mt-3">أنت تستخدم النظام كزائر — التحليل سيظهر مرة واحدة دون حفظ.</div>
            )}
          </motion.section>
        )}

        <AnimatePresence mode="wait">
          {/* Level picker */}
          {!level && !result && (
            <motion.div key="levels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LEVELS.map((l, i) => (
                <motion.button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.015 }}
                  className="group text-right relative rounded-2xl p-5 bg-white/[0.03] border border-white/10 hover:border-white/30 transition overflow-hidden"
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition bg-gradient-to-br ${l.accent}`} />
                  <div className="relative flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${l.accent} shadow-lg`}>
                      <l.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">{l.title}</h3>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:-translate-x-1 transition" />
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{l.tagline}</div>
                      <div className="text-sm text-slate-300 mt-3">{l.depth}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Form */}
          {level && !result && activeLevel && (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Button variant="ghost" onClick={reset} className="text-slate-300 hover:text-white gap-2 mb-4">
                <ArrowLeft className="w-4 h-4 rotate-180" /> اختيار مستوى آخر
              </Button>
              <Card className="bg-white/[0.04] border-white/10 backdrop-blur-md p-6 text-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${activeLevel.accent}`}><activeLevel.icon className="w-5 h-5 text-white" /></div>
                  <div>
                    <h2 className="font-bold text-lg">مستوى: {activeLevel.title}</h2>
                    <div className="text-xs text-slate-400">{activeLevel.depth}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-5">أجب بصدق — كلما كانت إجاباتك دقيقة، كانت توصية الذكاء الاصطناعي أكثر مطابقة.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="الميزانية المتاحة (ر.س)">
                    <Input type="number" value={answers.budget_amount} onChange={(e) => update('budget_amount', Number(e.target.value))} className="bg-slate-900/60 border-white/10" />
                  </Field>
                  <Field label="الوقت المتاح">
                    <Select value={answers.available_time} onValueChange={(v) => update('available_time', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="part_time">جزئي (2-4 ساعات)</SelectItem>
                        <SelectItem value="full_time">كامل (8+ ساعات)</SelectItem>
                        <SelectItem value="weekends">عطل أسبوعية</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="تحمّل المخاطرة">
                    <Select value={answers.risk_tolerance} onValueChange={(v) => update('risk_tolerance', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفض</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">عالي</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="مستوى الخبرة">
                    <Select value={answers.experience} onValueChange={(v) => update('experience', v)}>
                      <SelectTrigger className="bg-slate-900/60 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">لا توجد</SelectItem>
                        <SelectItem value="beginner">مبتدئ</SelectItem>
                        <SelectItem value="intermediate">متوسط</SelectItem>
                        <SelectItem value="expert">خبير</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="المدينة / الموقع">
                    <Input value={answers.location} onChange={(e) => update('location', e.target.value)} placeholder="الرياض، جدة..." className="bg-slate-900/60 border-white/10" />
                  </Field>
                  <Field label="المهارات">
                    <Input value={answers.skills} onChange={(e) => update('skills', e.target.value)} placeholder="تصميم، برمجة، تسويق..." className="bg-slate-900/60 border-white/10" />
                  </Field>
                  <Field label="الاهتمامات والشغف" full>
                    <Input value={answers.interests} onChange={(e) => update('interests', e.target.value)} placeholder="تقنية، طعام، رياضة..." className="bg-slate-900/60 border-white/10" />
                  </Field>
                  <Field label="دافعك الحقيقي للبزنس (تحليل سلوكي)" full>
                    <Textarea rows={3} value={answers.motivation} onChange={(e) => update('motivation', e.target.value)} className="bg-slate-900/60 border-white/10" />
                  </Field>

                  {(level === 'advanced' || level === 'analyst') && (
                    <>
                      <Field label="السوق المستهدف">
                        <Input value={answers.target_market} onChange={(e) => update('target_market', e.target.value)} className="bg-slate-900/60 border-white/10" />
                      </Field>
                      <Field label="الإيراد المتوقع شهرياً (ر.س)">
                        <Input type="number" value={answers.expected_revenue} onChange={(e) => update('expected_revenue', Number(e.target.value))} className="bg-slate-900/60 border-white/10" />
                      </Field>
                      <Field label="المنافسون الرئيسيون" full>
                        <Input value={answers.competitors} onChange={(e) => update('competitors', e.target.value)} className="bg-slate-900/60 border-white/10" />
                      </Field>
                      <Field label="ميزتك التنافسية" full>
                        <Textarea rows={2} value={answers.unique_value} onChange={(e) => update('unique_value', e.target.value)} className="bg-slate-900/60 border-white/10" />
                      </Field>
                    </>
                  )}

                  {level === 'analyst' && (
                    <Field label="بيانات / مؤشرات للتحليل (اختياري)" full>
                      <Textarea rows={3} value={answers.data_points} onChange={(e) => update('data_points', e.target.value)} placeholder="أرقام سوق، CAC، LTV، نمو..." className="bg-slate-900/60 border-white/10" />
                    </Field>
                  )}
                </div>

                <Button onClick={submit} disabled={loading} size="lg"
                  className={`w-full mt-6 gap-2 bg-gradient-to-r ${activeLevel.accent} hover:opacity-90 text-white shadow-lg`}>
                  {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> الذكاء الاصطناعي يحلل…</> : <><Sparkles className="w-4 h-4" /> توليد توصية ذكية</>}
                </Button>
                <div className="text-[11px] text-slate-500 mt-3 flex items-center gap-1 justify-center">
                  <ShieldCheck className="w-3 h-3" /> {isGuest ? 'لن يتم حفظ بياناتك — وضع الزائر' : 'سيتم حفظ التحليل وربطه بحسابك'}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Result */}
          {result && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button variant="ghost" onClick={reset} className="text-slate-300 hover:text-white gap-2 mb-4">
                <ArrowLeft className="w-4 h-4 rotate-180" /> تحليل جديد
              </Button>

              <Card className="bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border-white/10 p-5 mb-4 text-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-violet-300" />
                  <h3 className="font-bold">تحليل سلوكي ذكي</h3>
                </div>
                {result.ai_summary && <p className="text-sm text-slate-300 mb-3">{result.ai_summary}</p>}
                {result.behavior && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <Stat label="نمط التفكير" value={result.behavior.thinking_pattern} />
                    <Stat label="نمط المخاطرة" value={result.behavior.risk_profile} />
                    <Stat label="أسلوب القرار" value={result.behavior.decision_style} />
                  </div>
                )}
              </Card>

              <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-amber-400" /> الاقتراحات المخصصة لك</h3>
              <div className="space-y-3">
                {result.recommendations.map((rec: any) => (
                  <Card key={rec.id} className="bg-white/[0.04] border-white/10 p-4 text-slate-100">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="font-bold text-base">{rec.title}</h4>
                        <Badge variant="outline" className="mt-1 border-white/20 text-slate-300">{rec.business_type}</Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold bg-gradient-to-l from-violet-300 to-cyan-300 bg-clip-text text-transparent">{rec.match_percentage}%</div>
                        <div className="text-[10px] text-slate-400">توافق</div>
                      </div>
                    </div>
                    <Progress value={rec.match_percentage} className="h-1.5 mb-3 bg-white/10" />
                    <p className="text-sm text-slate-300 mb-3">{rec.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <Mini label="الميزانية" value={`${rec.required_budget?.toLocaleString()} ر.س`} />
                      <Mini label="ROI متوقع" value={`${rec.estimated_roi}%`} accent="text-emerald-300" />
                      <Mini label="الصعوبة" value={rec.difficulty} />
                    </div>
                    {rec.ai_analysis?.why_match && (
                      <div className="text-xs text-slate-400 mb-2"><span className="text-slate-200 font-semibold">لماذا تناسبك: </span>{rec.ai_analysis.why_match}</div>
                    )}
                    {rec.ai_analysis?.market_insight && (
                      <div className="text-xs text-slate-400 mb-3"><span className="text-slate-200 font-semibold">رؤية السوق: </span>{rec.ai_analysis.market_insight}</div>
                    )}
                    {rec.action_steps?.length > 0 && (
                      <div className="text-xs text-slate-300 mb-3">
                        <div className="font-semibold mb-1">خطوات التنفيذ:</div>
                        <ul className="list-disc mr-4 space-y-0.5 text-slate-400">
                          {rec.action_steps.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {!isGuest ? (
                      <Button onClick={() => createProject(rec.id)} disabled={loading} className="w-full gap-2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white">
                        <Rocket className="w-4 h-4" /> إنشاء المشروع داخل النظام
                      </Button>
                    ) : (
                      <div className="text-[11px] text-center text-slate-500 border border-dashed border-white/10 rounded-md py-2">
                        <Lightbulb className="w-3 h-3 inline ml-1" /> سجّل دخولك لإنشاء المشروع تلقائياً داخل المنظومة
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center text-[11px] text-slate-600 mt-12 pb-6">
          © Batshare 99 — منصة مستقلة لتوليد البزنس الذكي
        </footer>
      </main>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <Label className="text-slate-300 text-xs mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-md p-2 border border-white/10">
      <div className="text-slate-400 text-[10px]">{label}</div>
      <div className="text-slate-100 font-semibold mt-0.5 truncate">{value}</div>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded p-2 text-center">
      <div className="text-slate-400 text-[10px]">{label}</div>
      <div className={`font-bold mt-0.5 ${accent || 'text-slate-100'}`}>{value}</div>
    </div>
  );
}
