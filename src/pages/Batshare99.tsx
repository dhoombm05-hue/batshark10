import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Brain, Target, TrendingUp, Lightbulb, Rocket, Wrench, BarChart3, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

type Track = 'beginner' | 'intermediate' | 'professional' | 'analysis';

const TRACKS: { id: Track; title: string; subtitle: string; desc: string; icon: any; color: string; gradient: string }[] = [
  {
    id: 'beginner',
    title: 'المبتدئ',
    subtitle: 'لا أملك بزنس / كفاءة < 70%',
    desc: 'اختبار ذكي شامل يحلل ميزانيتك ووقتك ومهاراتك ويولد فكرة بزنس مخصصة بنسبة توافق حقيقية، مع زر إنشاء المشروع الكامل',
    icon: Rocket,
    color: 'section-revenue',
    gradient: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    id: 'intermediate',
    title: 'المتوسط',
    subtitle: 'مشروع قائم - بنية هشة',
    desc: 'تشخيص دقيق لمواطن الخلل التقنية والتسويقية، خارطة طريق للتطوير، وأدوات تحسين الأنظمة',
    icon: Wrench,
    color: 'section-invest',
    gradient: 'from-amber-500/20 to-orange-500/10',
  },
  {
    id: 'professional',
    title: 'المحترف',
    subtitle: 'إدارة أعمال متقدمة',
    desc: 'تحليل الفجوات التشغيلية، نظام إعادة الإنعاش الأسطوري للمشاريع الفاشلة، ومساعد تنفيذي كامل',
    icon: TrendingUp,
    color: 'section-finance',
    gradient: 'from-blue-500/20 to-indigo-500/10',
  },
  {
    id: 'analysis',
    title: 'التحليل فقط',
    subtitle: 'بيانات معقدة - منطق رياضي',
    desc: 'خدمة عميقة للتعامل مع البيانات المعقدة وتقديم توقعات وتحسينات عملية مبنية على منطق سوقي بحت',
    icon: BarChart3,
    color: 'section-strategic',
    gradient: 'from-violet-500/20 to-purple-500/10',
  },
];

const colorMap: Record<string, string> = {
  'section-finance': 'text-section-finance border-section-finance/40',
  'section-revenue': 'text-section-revenue border-section-revenue/40',
  'section-invest': 'text-section-invest border-section-invest/40',
  'section-strategic': 'text-section-strategic border-section-strategic/40',
};

// =============== BEGINNER ASSESSMENT FORM ===============
function BeginnerAssessment({ onBack }: { onBack: () => void }) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [answers, setAnswers] = useState({
    budget: '',
    budget_amount: 5000,
    available_time: 'part_time',
    risk_tolerance: 'medium',
    skills: '',
    location: '',
    interests: '',
    experience: 'none',
    motivation: '',
    has_business: 'no',
    current_efficiency: 50,
  });

  const update = (k: string, v: any) => setAnswers((a) => ({ ...a, [k]: v }));

  const submit = async () => {
    if (!user) return toast.error('يجب تسجيل الدخول');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('batshare99-ai', {
        body: { action: 'smart_assessment', userId: user.id, payload: { track: 'beginner', answers } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['batshare-recommendations'] });
      toast.success(`تم توليد ${data.recommendations.length} اقتراحات مخصصة!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (recId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('batshare99-ai', {
        body: { action: 'create_full_project', userId: user.id, payload: { recommendationId: recId } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`🚀 تم إنشاء المشروع: ${data.project.name}`);
      queryClient.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> رجوع</Button>
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold">تحليل نمط تفكيرك</h3>
          </div>
          <p className="text-sm text-muted-foreground">{result.behavior?.thinking_pattern}</p>
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div><span className="text-muted-foreground">نمط المخاطرة:</span> <Badge variant="secondary">{result.behavior?.risk_profile}</Badge></div>
            <div><span className="text-muted-foreground">أسلوب القرار:</span> <Badge variant="secondary">{result.behavior?.decision_style}</Badge></div>
          </div>
        </Card>
        <h3 className="font-heading font-bold text-lg">🎯 الاقتراحات المخصصة لك</h3>
        {result.recommendations.map((rec: any) => (
          <Card key={rec.id} className="p-4 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="font-heading font-bold text-base">{rec.title}</h4>
                <Badge variant="outline" className="mt-1">{rec.business_type}</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{rec.match_percentage}%</div>
                <div className="text-[10px] text-muted-foreground">توافق</div>
              </div>
            </div>
            <Progress value={rec.match_percentage} className="h-1.5 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className="text-muted-foreground">الميزانية</div>
                <div className="font-bold">{rec.required_budget?.toLocaleString()} ر.س</div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className="text-muted-foreground">ROI متوقع</div>
                <div className="font-bold text-emerald-500">{rec.estimated_roi}%</div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className="text-muted-foreground">الصعوبة</div>
                <div className="font-bold">{rec.difficulty}</div>
              </div>
            </div>
            <Button onClick={() => createProject(rec.id)} disabled={loading} className="w-full gap-2">
              <Rocket className="w-4 h-4" /> إنشاء المشروع الكامل
            </Button>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> رجوع</Button>
      <Card className="p-5">
        <h3 className="font-heading font-bold text-lg mb-1">🧠 الاختبار الذكي الشامل</h3>
        <p className="text-sm text-muted-foreground mb-4">حلل ميزانيتك ووقتك ومهاراتك واهتماماتك للحصول على فكرة بزنس مخصصة بنسبة توافق حقيقية</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>هل تملك بزنس حالياً؟</Label>
            <Select value={answers.has_business} onValueChange={(v) => update('has_business', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">لا أملك بزنس</SelectItem>
                <SelectItem value="weak">أملك ولكن كفاءته أقل من 70%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الميزانية المتاحة (ر.س)</Label>
            <Input type="number" value={answers.budget_amount} onChange={(e) => update('budget_amount', Number(e.target.value))} />
          </div>
          <div>
            <Label>الوقت المتاح</Label>
            <Select value={answers.available_time} onValueChange={(v) => update('available_time', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="part_time">دوام جزئي (2-4 ساعات يومياً)</SelectItem>
                <SelectItem value="full_time">دوام كامل (8+ ساعات)</SelectItem>
                <SelectItem value="weekends">عطل أسبوعية فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>تحمّل المخاطرة</Label>
            <Select value={answers.risk_tolerance} onValueChange={(v) => update('risk_tolerance', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">منخفض - أفضل الأمان</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="high">عالي - أتقبل التحدي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الخبرة</Label>
            <Select value={answers.experience} onValueChange={(v) => update('experience', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">لا توجد</SelectItem>
                <SelectItem value="beginner">مبتدئ</SelectItem>
                <SelectItem value="intermediate">متوسط</SelectItem>
                <SelectItem value="expert">خبير</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الموقع / المدينة</Label>
            <Input value={answers.location} onChange={(e) => update('location', e.target.value)} placeholder="مثال: الرياض" />
          </div>
          <div className="md:col-span-2">
            <Label>المهارات (افصل بفاصلة)</Label>
            <Input value={answers.skills} onChange={(e) => update('skills', e.target.value)} placeholder="تصميم، برمجة، تسويق..." />
          </div>
          <div className="md:col-span-2">
            <Label>الاهتمامات والشغف</Label>
            <Input value={answers.interests} onChange={(e) => update('interests', e.target.value)} placeholder="تقنية، رياضة، طعام..." />
          </div>
          <div className="md:col-span-2">
            <Label>دافعك الحقيقي للبزنس (تحليل سلوكي)</Label>
            <Textarea value={answers.motivation} onChange={(e) => update('motivation', e.target.value)} placeholder="اكتب بصراحة - سيُحلَّل سلوكياً" rows={3} />
          </div>
        </div>

        <Button onClick={submit} disabled={loading} className="w-full mt-5 gap-2" size="lg">
          {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> AI يحلل ويُولّد...</> : <><Sparkles className="w-4 h-4" /> توليد اقتراحات مخصصة</>}
        </Button>
      </Card>
    </div>
  );
}

// =============== INTERMEDIATE: DIAGNOSE ===============
function IntermediateDiagnose({ onBack }: { onBack: () => void }) {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({ businessName: '', sector: '', revenue: 0, expenses: 0, problems: '', team_size: 1 });

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('batshare99-ai', {
        body: { action: 'diagnose_business', userId: user.id, payload: { businessName: form.businessName, currentState: form } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.diagnostic);
      toast.success('تم التشخيص');
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setResult(null)} className="gap-2"><ArrowLeft className="w-4 h-4" /> اختبار جديد</Button>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-lg">تشخيص: {result.business_name}</h3>
            <div className="text-center">
              <div className={`text-3xl font-bold ${result.health_score >= 70 ? 'text-emerald-500' : result.health_score >= 40 ? 'text-amber-500' : 'text-destructive'}`}>{result.health_score}</div>
              <div className="text-[10px] text-muted-foreground">صحة البزنس</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <h4 className="font-bold text-sm mb-2 text-destructive">⚠️ نقاط الضعف</h4>
              {result.weak_areas?.map((w: any, i: number) => (
                <div key={i} className="bg-destructive/5 border border-destructive/20 rounded p-2 mb-2 text-xs">
                  <div className="font-bold">{w.area} <Badge variant="destructive" className="text-[9px]">{w.severity}</Badge></div>
                  <div className="text-muted-foreground mt-1">{w.impact}</div>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-bold text-sm mb-2 text-emerald-500">✓ نقاط القوة</h4>
              {result.strong_areas?.map((s: string, i: number) => (
                <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2 mb-2 text-xs">{s}</div>
              ))}
            </div>
          </div>
          <h4 className="font-bold text-sm mb-2">🗺️ خارطة طريق التطوير</h4>
          {result.improvement_roadmap?.map((p: any, i: number) => (
            <Card key={i} className="p-3 mb-2 bg-muted/30">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm">{p.phase}</span>
                <Badge variant="outline" className="text-[10px]">{p.duration}</Badge>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc mr-4">
                {p.actions?.map((a: string, j: number) => <li key={j}>{a}</li>)}
              </ul>
            </Card>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> رجوع</Button>
      <Card className="p-5">
        <h3 className="font-heading font-bold text-lg mb-1">🔧 تشخيص البزنس القائم</h3>
        <p className="text-sm text-muted-foreground mb-4">حدد مواطن الخلل التقنية والتسويقية واحصل على خارطة طريق تطوير</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label>اسم البزنس</Label><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></div>
          <div><Label>القطاع</Label><Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} /></div>
          <div><Label>الإيراد الشهري (ر.س)</Label><Input type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: Number(e.target.value) })} /></div>
          <div><Label>المصاريف الشهرية</Label><Input type="number" value={form.expenses} onChange={(e) => setForm({ ...form, expenses: Number(e.target.value) })} /></div>
          <div><Label>عدد الفريق</Label><Input type="number" value={form.team_size} onChange={(e) => setForm({ ...form, team_size: Number(e.target.value) })} /></div>
          <div className="md:col-span-2"><Label>ما هي المشاكل التي تواجهها؟</Label><Textarea value={form.problems} onChange={(e) => setForm({ ...form, problems: e.target.value })} rows={4} /></div>
        </div>
        <Button onClick={submit} disabled={loading || !form.businessName} className="w-full mt-4 gap-2" size="lg">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
          تشخيص ذكي
        </Button>
      </Card>
    </div>
  );
}

// =============== PROFESSIONAL: REVIVAL ===============
function ProfessionalRevival({ onBack }: { onBack: () => void }) {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({ name: '', what_happened: '', when_failed: '', initial_capital: 0, lessons: '' });

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('batshare99-ai', {
        body: { action: 'revival_plan', userId: user.id, payload: { failedProjectName: form.name, failureContext: form } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.revival);
      toast.success('تم وضع خطة الإنعاش');
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setResult(null)} className="gap-2"><ArrowLeft className="w-4 h-4" /> خطة جديدة</Button>
        <Card className="p-5 bg-gradient-to-br from-section-strategic/10 to-transparent">
          <h3 className="font-heading font-bold text-lg mb-3">♻️ خطة إعادة الإنعاش: {result.failed_project_name}</h3>
          <p className="text-sm mb-4">{result.ai_analysis}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <h4 className="font-bold text-sm mb-2">❌ أسباب الفشل</h4>
              {result.failure_reasons?.map((r: string, i: number) => <div key={i} className="bg-destructive/5 border border-destructive/20 rounded p-2 mb-1 text-xs">{r}</div>)}
            </div>
            <div>
              <h4 className="font-bold text-sm mb-2">⚡ الأخطاء الجوهرية</h4>
              {result.core_mistakes?.map((m: string, i: number) => <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded p-2 mb-1 text-xs">{m}</div>)}
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-bold text-sm mb-2">🎯 استراتيجية الإنعاش</h4>
            <div className="bg-muted/50 rounded p-3 text-sm">
              <div><strong>الرؤية:</strong> {result.revival_strategy?.vision}</div>
              <div className="mt-2"><strong>المدة:</strong> {result.revival_strategy?.timeline}</div>
              <div className="mt-2"><strong>التغييرات الأساسية:</strong></div>
              <ul className="list-disc mr-4 mt-1 text-xs">
                {result.revival_strategy?.key_changes?.map((c: string, i: number) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-bold text-sm mb-2">🛡️ تقليل المخاطر</h4>
            {result.risk_reduction?.map((r: string, i: number) => <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2 mb-1 text-xs">{r}</div>)}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> رجوع</Button>
      <Card className="p-5">
        <h3 className="font-heading font-bold text-lg mb-1">♻️ نظام إعادة الإنعاش الأسطوري</h3>
        <p className="text-sm text-muted-foreground mb-4">حلل أسباب فشل مشروع سابق واحصل على خطة إعادة تشغيل محسنة</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label>اسم المشروع الفاشل</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>متى فشل؟</Label><Input value={form.when_failed} onChange={(e) => setForm({ ...form, when_failed: e.target.value })} placeholder="مثال: 2024" /></div>
          <div><Label>رأس المال الأولي</Label><Input type="number" value={form.initial_capital} onChange={(e) => setForm({ ...form, initial_capital: Number(e.target.value) })} /></div>
          <div className="md:col-span-2"><Label>ماذا حدث بالضبط؟</Label><Textarea value={form.what_happened} onChange={(e) => setForm({ ...form, what_happened: e.target.value })} rows={4} /></div>
          <div className="md:col-span-2"><Label>الدروس المستفادة</Label><Textarea value={form.lessons} onChange={(e) => setForm({ ...form, lessons: e.target.value })} rows={3} /></div>
        </div>
        <Button onClick={submit} disabled={loading || !form.name} className="w-full mt-4 gap-2" size="lg">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          توليد خطة الإنعاش
        </Button>
      </Card>
    </div>
  );
}

// =============== ANALYSIS ONLY ===============
function AnalysisOnly({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> رجوع</Button>
      <Card className="p-5">
        <h3 className="font-heading font-bold text-lg mb-1">📊 خدمة التحليل العميق</h3>
        <p className="text-sm text-muted-foreground mb-4">رفع بيانات معقدة للحصول على توقعات وتحسينات مبنية على منطق رياضي وسوقي بحت</p>
        <Card className="p-4 bg-muted/30 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-section-strategic mb-3" />
          <p className="text-sm">هذه الخدمة المتقدمة تتكامل مع <strong>مركز الاستيراد</strong> و<strong>مختبر النمذجة</strong> الموجودين في المنظومة. ارفع بياناتك من /import وحلّل عبر /lab.</p>
        </Card>
      </Card>
    </div>
  );
}

// =============== MAIN PAGE ===============
export default function Batshare99() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);

  const { data: recommendations = [] } = useQuery({
    queryKey: ['batshare-recommendations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('batshare_recommendations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-section-ai/10 blur-3xl -z-10" />
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-section-ai" />
            <Badge className="bg-section-ai/15 text-section-ai border-section-ai/30">الإصدار 99</Badge>
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-gradient-gold mb-2">Batshare 99</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            مولد البزنس الذكي - عقل مدبر لكل مستخدم يبني ويشخّص ويُنعش الأعمال بقرارات نابعة من تحليل حقيقي
          </p>
        </motion.div>

        <Card className="p-6 bg-gradient-to-br from-primary/10 via-section-ai/5 to-transparent border-primary/30">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">بناء بزنس معين</h3>
                <p className="text-sm text-muted-foreground max-w-xl mt-1">
                  منصة مستقلة بواجهة خاصة ورابط مستقل. تتعرف عليك تلقائياً عند الدخول من النظام، وتعمل كزائر عند الدخول من رابط خارجي.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['مبتدئ', 'متوسط', 'متقدم', 'محلل احترافي'].map((l) => (
                    <Badge key={l} variant="outline" className="text-[11px]">{l}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg hover:opacity-90 whitespace-nowrap">
              <a href="/b99" target="_blank" rel="noopener noreferrer">
                <Sparkles className="w-4 h-4" /> فتح Batshark99
              </a>
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> ذكاء اصطناعي يوجّه ويقترح أفضل الخيارات</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> 4 مستويات بعمق مختلف من التحليل</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> رابط مشاركة مستقل قابل للتوسع</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> تخصيص تلقائي للأعضاء، ووضع زائر للزوار</div>
          </div>
        </Card>

        {/* Recent recommendations */}
        {!activeTrack && recommendations.length > 0 && (
          <Card className="p-5">
            <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> اقتراحاتك السابقة</h3>
            <div className="space-y-2">
              {recommendations.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.business_type} • {r.match_percentage}% توافق</div>
                  </div>
                  {r.status === 'activated' ? (
                    <Badge className="bg-emerald-500/15 text-emerald-500 gap-1"><CheckCircle2 className="w-3 h-3" /> مُفعّل</Badge>
                  ) : (
                    <Badge variant="outline">مقترح</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
