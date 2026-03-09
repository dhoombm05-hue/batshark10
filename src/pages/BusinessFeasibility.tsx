import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessFeasibilities, type BusinessFeasibilityRecord } from '@/hooks/useBusinessFeasibility';
import { Building2, Brain, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Trash2, Eye, Plus, Loader2, Shield, DollarSign, Users, Clock, BarChart3, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

const BUSINESS_QUESTIONS = [
  { id: 'name', label: 'اسم البزنس / المشروع', type: 'text', placeholder: 'مثال: مطعم سوشي ياباني' },
  { id: 'type', label: 'نوع البزنس', type: 'select', options: ['مطعم / كافيه', 'تجارة إلكترونية', 'خدمات تقنية', 'عقارات', 'تصنيع', 'استشارات', 'تعليم وتدريب', 'صحة وجمال', 'سياحة وسفر', 'لوجستيات ونقل', 'زراعة', 'ترفيه وفعاليات', 'أخرى'] },
  { id: 'description', label: 'وصف مختصر للبزنس', type: 'textarea', placeholder: 'اشرح فكرة البزنس بالتفصيل...' },
  { id: 'target_market', label: 'السوق المستهدف', type: 'select', options: ['محلي - مدينة واحدة', 'محلي - عدة مدن', 'وطني', 'إقليمي (خليجي)', 'دولي'] },
  { id: 'target_audience', label: 'الجمهور المستهدف', type: 'textarea', placeholder: 'من هم العملاء المحتملين؟ أعمارهم؟ اهتماماتهم؟' },
  { id: 'startup_budget', label: 'الميزانية المبدئية (ريال)', type: 'select', options: ['أقل من 50,000', '50,000 - 200,000', '200,000 - 500,000', '500,000 - 1,000,000', '1,000,000 - 5,000,000', 'أكثر من 5,000,000'] },
  { id: 'monthly_expenses', label: 'المصاريف الشهرية المتوقعة (ريال)', type: 'select', options: ['أقل من 10,000', '10,000 - 30,000', '30,000 - 100,000', '100,000 - 300,000', 'أكثر من 300,000'] },
  { id: 'expected_revenue', label: 'الإيرادات الشهرية المتوقعة (ريال)', type: 'select', options: ['أقل من 20,000', '20,000 - 50,000', '50,000 - 200,000', '200,000 - 500,000', 'أكثر من 500,000'] },
  { id: 'has_rent', label: 'هل يتطلب موقع / إيجار؟', type: 'select', options: ['نعم - موقع واحد', 'نعم - عدة مواقع', 'لا - أونلاين فقط', 'نعم وأونلاين معاً'] },
  { id: 'rent_cost', label: 'تكلفة الإيجار الشهرية (إن وجد)', type: 'select', options: ['لا يوجد', 'أقل من 5,000', '5,000 - 15,000', '15,000 - 50,000', '50,000 - 100,000', 'أكثر من 100,000'] },
  { id: 'employees_needed', label: 'عدد الموظفين المطلوبين', type: 'select', options: ['لا يحتاج موظفين', '1-3', '4-10', '11-25', '26-50', 'أكثر من 50'] },
  { id: 'competition_level', label: 'مستوى المنافسة', type: 'select', options: ['منافسة ضعيفة (سوق جديد)', 'منافسة متوسطة', 'منافسة شديدة', 'منافسة شديدة جداً (سوق مشبع)'] },
  { id: 'competitive_advantage', label: 'الميزة التنافسية', type: 'textarea', placeholder: 'ما الذي يميز بزنسك عن المنافسين؟' },
  { id: 'revenue_model', label: 'نموذج الإيرادات', type: 'select', options: ['بيع مباشر', 'اشتراكات شهرية', 'عمولات', 'إعلانات', 'ترخيص', 'فريميوم', 'متعدد المصادر'] },
  { id: 'licenses_needed', label: 'هل يحتاج تراخيص خاصة؟', type: 'select', options: ['لا يحتاج', 'نعم - سجل تجاري فقط', 'نعم - تراخيص متخصصة', 'نعم - تراخيص حكومية معقدة'] },
  { id: 'technology_required', label: 'المتطلبات التقنية', type: 'select', options: ['لا يحتاج تقنية', 'موقع إلكتروني بسيط', 'تطبيق جوال', 'منصة متكاملة', 'برمجيات متخصصة', 'ذكاء اصطناعي / تقنيات متقدمة'] },
  { id: 'timeline_to_launch', label: 'الوقت المتوقع للإطلاق', type: 'select', options: ['أقل من شهر', '1-3 أشهر', '3-6 أشهر', '6-12 شهر', 'أكثر من سنة'] },
  { id: 'scalability', label: 'إمكانية التوسع', type: 'select', options: ['صعب التوسع', 'ممكن بتكاليف عالية', 'ممكن بتكاليف متوسطة', 'سهل التوسع', 'قابل للتوسع بشكل كبير'] },
  { id: 'seasonality', label: 'هل البزنس موسمي؟', type: 'select', options: ['لا - طوال السنة', 'نعم - موسم واحد', 'نعم - عدة مواسم', 'متقلب حسب الظروف'] },
  { id: 'partnerships', label: 'هل يحتاج شراكات؟', type: 'textarea', placeholder: 'هل تحتاج موردين؟ شركاء؟ موزعين؟' },
  { id: 'risks_known', label: 'المخاطر التي تتوقعها', type: 'textarea', placeholder: 'ما المخاطر التي تراها في هذا البزنس؟' },
  { id: 'why_now', label: 'لماذا الآن؟', type: 'textarea', placeholder: 'ما الذي يجعل هذا الوقت مناسباً لبدء هذا البزنس؟' },
  { id: 'exit_strategy', label: 'استراتيجية الخروج', type: 'select', options: ['لم أفكر بعد', 'بيع البزنس لاحقاً', 'تحويله لفرانشايز', 'طرح عام (IPO)', 'دمج مع شركة أخرى', 'بزنس مستمر طويل الأمد'] },
  { id: 'additional_notes', label: 'ملاحظات إضافية', type: 'textarea', placeholder: 'أي معلومات أخرى تريد إضافتها...' },
];

const recommendationConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  strongly_recommended: { label: 'موصى به بشدة', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle2 },
  recommended: { label: 'موصى به', color: 'bg-section-revenue/20 text-section-revenue', icon: TrendingUp },
  cautious: { label: 'يحتاج حذر', color: 'bg-amber-500/20 text-amber-400', icon: AlertTriangle },
  not_recommended: { label: 'غير موصى به', color: 'bg-destructive/20 text-destructive', icon: XCircle },
};

export default function BusinessFeasibility() {
  const { feasibilities, isLoading, createFeasibility, analyzeBusiness, deleteFeasibility } = useBusinessFeasibilities();
  const [showForm, setShowForm] = useState(false);
  const [showResult, setShowResult] = useState<BusinessFeasibilityRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const STEP_SIZE = 6;
  const totalSteps = Math.ceil(BUSINESS_QUESTIONS.length / STEP_SIZE);
  const currentQuestions = BUSINESS_QUESTIONS.slice(currentStep * STEP_SIZE, (currentStep + 1) * STEP_SIZE);
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleSubmit = async () => {
    const name = answers.name || 'بزنس جديد';
    setAnalyzing(true);
    try {
      const record = await createFeasibility.mutateAsync({
        title: name,
        businessType: answers.type || '',
        answers,
      });
      const result = await analyzeBusiness.mutateAsync({
        feasibilityId: record.id,
        answers,
      });
      setShowForm(false);
      setAnswers({});
      setCurrentStep(0);
      // Show result
      setShowResult({ ...record, ai_analysis: result.data, status: 'analyzed', feasibility_score: result.data?.feasibility_score || 0, risk_score: result.data?.risk_score || 0, recommendation: result.data?.recommendation || 'cautious' });
    } catch { /* handled */ }
    setAnalyzing(false);
  };

  const renderField = (q: typeof BUSINESS_QUESTIONS[0]) => {
    if (q.type === 'select') {
      return (
        <Select value={answers[q.id] || ''} onValueChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}>
          <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
          <SelectContent>
            {q.options!.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (q.type === 'textarea') {
      return <Textarea placeholder={q.placeholder} value={answers[q.id] || ''} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} rows={3} />;
    }
    return <Input placeholder={q.placeholder} value={answers[q.id] || ''} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} />;
  };

  const renderAnalysis = (analysis: any) => {
    if (!analysis) return null;
    const rec = recommendationConfig[analysis.recommendation] || recommendationConfig.cautious;
    const RecIcon = rec.icon;

    return (
      <div className="space-y-6">
        {/* Header Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/80 border-section-revenue/30">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto text-section-revenue mb-2" />
              <p className="text-3xl font-bold text-foreground">{analysis.feasibility_score}%</p>
              <p className="text-sm text-muted-foreground">درجة الجدوى</p>
              <Progress value={analysis.feasibility_score} className="mt-2" />
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-amber-500/30">
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 mx-auto text-amber-400 mb-2" />
              <p className="text-3xl font-bold text-foreground">{analysis.risk_score}%</p>
              <p className="text-sm text-muted-foreground">درجة المخاطر</p>
              <Progress value={analysis.risk_score} className="mt-2" />
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-section-ai/30">
            <CardContent className="p-4 text-center">
              <RecIcon className="w-8 h-8 mx-auto mb-2" />
              <Badge className={`text-lg px-4 py-1 ${rec.color}`}>{rec.label}</Badge>
              <p className="text-sm text-muted-foreground mt-2">التوصية النهائية</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="bg-card/80 border-section-ai/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-section-ai" /> الملخص التنفيذي</CardTitle></CardHeader>
          <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis.summary}</p></CardContent>
        </Card>

        {/* Recommendation Text */}
        {analysis.recommendation_text && (
          <Card className="bg-card/80 border-section-forecast/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><RecIcon className="w-5 h-5" /> التوصية التفصيلية</CardTitle></CardHeader>
            <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis.recommendation_text}</p></CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        {analysis.key_metrics?.length > 0 && (
          <Card className="bg-card/80 border-section-finance/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-section-finance" /> المؤشرات الرئيسية</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {analysis.key_metrics.map((m: any, i: number) => (
                  <div key={i} className={`p-3 rounded-lg border ${m.status === 'positive' ? 'border-section-revenue/30 bg-section-revenue/5' : m.status === 'negative' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30'}`}>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-bold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strengths */}
        {analysis.strengths?.length > 0 && (
          <Card className="bg-card/80 border-section-revenue/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-section-revenue" /> نقاط القوة</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-foreground"><CheckCircle2 className="w-4 h-4 text-section-revenue mt-1 shrink-0" />{s}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Risks */}
        {analysis.risks?.length > 0 && (
          <Card className="bg-card/80 border-amber-500/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-400" /> المخاطر وخطة التخفيف</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.risks.map((r: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={r.severity === 'critical' ? 'text-destructive border-destructive' : r.severity === 'high' ? 'text-amber-400 border-amber-400' : 'text-muted-foreground'}>{r.severity === 'critical' ? 'حرج' : r.severity === 'high' ? 'عالي' : r.severity === 'medium' ? 'متوسط' : 'منخفض'}</Badge>
                      <span className="font-semibold text-foreground">{r.risk}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">💡 {r.mitigation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Analysis */}
        {analysis.financial_analysis && (
          <Card className="bg-card/80 border-section-finance/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-section-finance" /> التحليل المالي</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'تكلفة التأسيس', value: analysis.financial_analysis.estimated_startup_cost },
                  { label: 'المصاريف الشهرية', value: analysis.financial_analysis.estimated_monthly_expenses },
                  { label: 'الإيرادات الشهرية', value: analysis.financial_analysis.estimated_monthly_revenue },
                  { label: 'العائد على الاستثمار', value: analysis.financial_analysis.estimated_roi_months ? `${analysis.financial_analysis.estimated_roi_months} شهر` : '-' },
                  { label: 'نقطة التعادل', value: analysis.financial_analysis.break_even_months ? `${analysis.financial_analysis.break_even_months} شهر` : '-' },
                  { label: 'هامش الربح', value: analysis.financial_analysis.profit_margin_estimate },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-bold text-foreground">{item.value || '-'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Fit */}
        {analysis.company_fit && (
          <Card className="bg-card/80 border-section-strategic/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-section-strategic" /> التوافق مع الشركة</CardTitle></CardHeader>
            <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis.company_fit}</p></CardContent>
          </Card>
        )}

        {/* Suitable Employees */}
        {analysis.suitable_employees?.length > 0 && (
          <Card className="bg-card/80 border-section-employees/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-section-employees" /> الموظفين المناسبين</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.suitable_employees.map((e: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border border-border bg-muted/20 flex items-start gap-3">
                    <Users className="w-5 h-5 text-section-employees mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">{e.name} {e.role_suggestion && <Badge variant="outline" className="mr-2">{e.role_suggestion}</Badge>}</p>
                      <p className="text-sm text-muted-foreground">{e.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {analysis.timeline?.length > 0 && (
          <Card className="bg-card/80 border-section-forecast/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-section-forecast" /> الجدول الزمني المقترح</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.timeline.map((phase: any, i: number) => (
                  <div key={i} className="relative pr-6 border-r-2 border-section-forecast/30">
                    <div className="absolute -right-2 top-0 w-4 h-4 rounded-full bg-section-forecast" />
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground">{phase.phase}</span>
                        <Badge variant="outline">{phase.duration}</Badge>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {phase.tasks.map((t: string, j: number) => <li key={j}>• {t}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Show result detail
  if (showResult) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
                <Building2 className="w-6 h-6 text-section-ai" />
                تحليل جدوى: {showResult.title}
              </h1>
            </div>
            <Button variant="outline" onClick={() => setShowResult(null)}>← العودة للقائمة</Button>
          </div>
          {renderAnalysis(showResult.ai_analysis)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-section-invest/15">
                <Building2 className="w-6 h-6 text-section-invest" />
              </div>
              تحليل جدوى البزنس الذكي
            </h1>
            <p className="text-muted-foreground text-sm mt-1">تحليل شامل بالذكاء الاصطناعي لأي بزنس جديد قبل البدء فيه</p>
          </div>
          <Button onClick={() => { setShowForm(true); setCurrentStep(0); setAnswers({}); }} className="gap-2">
            <Plus className="w-4 h-4" /> تحليل بزنس جديد
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي التحليلات', value: feasibilities.length, icon: BarChart3, color: 'text-section-finance' },
            { label: 'موصى به', value: feasibilities.filter(f => f.recommendation === 'recommended' || f.recommendation === 'strongly_recommended').length, icon: CheckCircle2, color: 'text-section-revenue' },
            { label: 'يحتاج حذر', value: feasibilities.filter(f => f.recommendation === 'cautious').length, icon: AlertTriangle, color: 'text-amber-400' },
            { label: 'غير موصى', value: feasibilities.filter(f => f.recommendation === 'not_recommended').length, icon: XCircle, color: 'text-destructive' },
          ].map(stat => (
            <Card key={stat.label} className="bg-card/80 backdrop-blur-sm border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="bg-card/90 backdrop-blur-sm border-section-invest/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Brain className="w-5 h-5 text-section-ai" /> استبيان تحليل البزنس ({currentStep + 1}/{totalSteps})</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </CardTitle>
              <Progress value={progress} className="mt-2" />
            </CardHeader>
            <CardContent className="space-y-5">
              {currentQuestions.map(q => (
                <div key={q.id} className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">{q.label}</label>
                  {renderField(q)}
                </div>
              ))}

              <div className="flex gap-2 justify-between pt-4">
                <div className="flex gap-2">
                  {currentStep > 0 && <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)}>← السابق</Button>}
                  <Button variant="ghost" onClick={() => { setShowForm(false); setAnswers({}); setCurrentStep(0); }}>إلغاء</Button>
                </div>
                {currentStep < totalSteps - 1 ? (
                  <Button onClick={() => setCurrentStep(s => s + 1)}>التالي →</Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={analyzing || !answers.name?.trim()} className="gap-2">
                    {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحليل الذكي...</> : <><Brain className="w-4 h-4" /> تحليل بالذكاء الاصطناعي</>}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="bg-card/80"><CardContent className="p-8 text-center text-muted-foreground">جاري التحميل...</CardContent></Card>
          ) : feasibilities.length === 0 && !showForm ? (
            <Card className="bg-card/80"><CardContent className="p-8 text-center text-muted-foreground">لا توجد تحليلات بعد. ابدأ بتحليل بزنس جديد!</CardContent></Card>
          ) : (
            feasibilities.map(f => {
              const rec = recommendationConfig[f.recommendation || 'cautious'] || recommendationConfig.cautious;
              const RecIcon = rec.icon;
              return (
                <Card key={f.id} className="bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors cursor-pointer border-border" onClick={() => setShowResult(f)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${rec.color}`}><RecIcon className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-foreground truncate">{f.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{f.business_type || 'عام'}</span>
                        <span>•</span>
                        <span>جدوى: {f.feasibility_score}%</span>
                        <span>•</span>
                        <span>مخاطر: {f.risk_score}%</span>
                        <span>•</span>
                        <span>{format(new Date(f.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                      </div>
                    </div>
                    <Badge className={rec.color}>{rec.label}</Badge>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteFeasibility.mutate(f.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
