import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusinessFeasibilities, type BusinessFeasibilityRecord } from '@/hooks/useBusinessFeasibility';
import { Building2, Brain, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Trash2, Plus, Loader2, Shield, DollarSign, Users, Clock, BarChart3, Target, Lightbulb, Scale, TrendingDown, ArrowRight, Sparkles, FileText, Gavel, Search, Rocket } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import BusinessProposals from '@/components/BusinessProposals';

const SECTORS = [
  { value: 'food_beverage', label: '🍽️ مطاعم وكافيهات ومأكولات' },
  { value: 'ecommerce', label: '🛒 تجارة إلكترونية وتجزئة' },
  { value: 'tech_services', label: '💻 خدمات تقنية وبرمجيات' },
  { value: 'real_estate', label: '🏗️ عقارات وتطوير عمراني' },
  { value: 'manufacturing', label: '🏭 تصنيع وإنتاج' },
  { value: 'consulting', label: '📋 استشارات وخدمات مهنية' },
  { value: 'education', label: '🎓 تعليم وتدريب وتطوير' },
  { value: 'health_beauty', label: '💆 صحة وجمال وعناية شخصية' },
  { value: 'tourism', label: '✈️ سياحة وسفر وضيافة' },
  { value: 'logistics', label: '🚚 لوجستيات ونقل وشحن' },
  { value: 'agriculture', label: '🌾 زراعة وإنتاج غذائي' },
  { value: 'entertainment', label: '🎯 ترفيه وفعاليات ورياضة' },
  { value: 'fintech', label: '🏦 خدمات مالية وتقنية مالية' },
  { value: 'media', label: '📱 إعلام ومحتوى رقمي' },
  { value: 'other', label: '📌 قطاع آخر' },
];

const LOCATIONS = [
  { value: 'local_city', label: '📍 محلي - مدينة واحدة' },
  { value: 'local_multi', label: '🏙️ محلي - عدة مدن' },
  { value: 'national', label: '🇸🇦 وطني - جميع أنحاء المملكة' },
  { value: 'gcc', label: '🌍 إقليمي - دول الخليج' },
  { value: 'mena', label: '🌐 الشرق الأوسط وشمال أفريقيا' },
  { value: 'international', label: '🌏 دولي - أسواق عالمية' },
];

const recommendationConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  strongly_recommended: { label: '✅ موصى به بشدة', color: 'bg-section-revenue/20 text-section-revenue', icon: CheckCircle2 },
  recommended: { label: '👍 موصى به', color: 'bg-section-forecast/20 text-section-forecast', icon: TrendingUp },
  cautious: { label: '⚠️ يحتاج حذر ودراسة', color: 'bg-section-invest/20 text-section-invest', icon: AlertTriangle },
  not_recommended: { label: '❌ غير موصى به حالياً', color: 'bg-destructive/20 text-destructive', icon: XCircle },
};

export default function BusinessFeasibility() {
  const { feasibilities, isLoading, createFeasibility, analyzeBusiness, deleteFeasibility } = useBusinessFeasibilities();
  const [showForm, setShowForm] = useState(false);
  const [showResult, setShowResult] = useState<BusinessFeasibilityRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);

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
      setShowResult({ ...record, ai_analysis: result.data, status: 'analyzed', feasibility_score: result.data?.feasibility_score || 0, risk_score: result.data?.risk_score || 0, recommendation: result.data?.recommendation || 'cautious' });
    } catch { /* handled */ }
    setAnalyzing(false);
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
            <CardContent className="p-5 text-center space-y-2">
              <Target className="w-10 h-10 mx-auto text-section-revenue" />
              <p className="text-4xl font-bold text-foreground">{analysis.feasibility_score}<span className="text-lg text-muted-foreground">%</span></p>
              <p className="text-sm font-medium text-muted-foreground">درجة الجدوى الاقتصادية</p>
              <Progress value={analysis.feasibility_score} className="mt-2" />
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-section-invest/30">
            <CardContent className="p-5 text-center space-y-2">
              <Shield className="w-10 h-10 mx-auto text-section-invest" />
              <p className="text-4xl font-bold text-foreground">{analysis.risk_score}<span className="text-lg text-muted-foreground">%</span></p>
              <p className="text-sm font-medium text-muted-foreground">مستوى المخاطر</p>
              <Progress value={analysis.risk_score} className="mt-2" />
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-section-ai/30">
            <CardContent className="p-5 text-center space-y-2">
              <RecIcon className="w-10 h-10 mx-auto" />
              <Badge className={`text-base px-4 py-1.5 ${rec.color}`}>{rec.label}</Badge>
              <p className="text-sm font-medium text-muted-foreground">التوصية النهائية</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="bg-card/80 border-section-ai/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-section-ai" /> الملخص التنفيذي</CardTitle></CardHeader>
          <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis.summary}</p></CardContent>
        </Card>

        {analysis.recommendation_text && (
          <Card className="bg-card/80 border-section-forecast/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-section-forecast" /> التوصية التفصيلية</CardTitle></CardHeader>
            <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis.recommendation_text}</p></CardContent>
          </Card>
        )}

        {/* Market Research - NEW */}
        {analysis.market_research && (
          <Card className="bg-card/80 border-section-forecast/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-section-forecast" /> بحث وتحليل السوق</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.market_research.market_size && (
                  <div className="p-3 rounded-xl border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">📊 حجم السوق المقدر</p>
                    <p className="text-foreground">{analysis.market_research.market_size}</p>
                  </div>
                )}
                {analysis.market_research.growth_trend && (
                  <div className="p-3 rounded-xl border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">📈 اتجاه النمو</p>
                    <p className="text-foreground">{analysis.market_research.growth_trend}</p>
                  </div>
                )}
                {analysis.market_research.target_demographics && (
                  <div className="p-3 rounded-xl border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">🎯 الفئة المستهدفة</p>
                    <p className="text-foreground">{analysis.market_research.target_demographics}</p>
                  </div>
                )}
                {analysis.market_research.demand_analysis && (
                  <div className="p-3 rounded-xl border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">📋 تحليل الطلب</p>
                    <p className="text-foreground">{analysis.market_research.demand_analysis}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competitors - NEW */}
        {analysis.competitors_analysis?.length > 0 && (
          <Card className="bg-card/80 border-section-strategic/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-section-strategic" /> تحليل المنافسين</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.competitors_analysis.map((c: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-muted/20">
                    <p className="font-semibold text-foreground">{c.name}</p>
                    {c.strengths && <p className="text-sm text-muted-foreground mt-1">💪 نقاط القوة: {c.strengths}</p>}
                    {c.weaknesses && <p className="text-sm text-muted-foreground mt-1">📉 نقاط الضعف: {c.weaknesses}</p>}
                    {c.market_share && <p className="text-sm text-muted-foreground mt-1">📊 الحصة السوقية: {c.market_share}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Licenses - NEW */}
        {analysis.required_licenses?.length > 0 && (
          <Card className="bg-card/80 border-section-invest/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Gavel className="w-5 h-5 text-section-invest" /> التراخيص والمتطلبات القانونية</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.required_licenses.map((l: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/20">
                    <FileText className="w-4 h-4 text-section-invest mt-1 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{l.name}</p>
                      {l.issuing_authority && <p className="text-xs text-muted-foreground">الجهة: {l.issuing_authority}</p>}
                      {l.estimated_cost && <p className="text-xs text-muted-foreground">التكلفة التقريبية: {l.estimated_cost}</p>}
                      {l.duration && <p className="text-xs text-muted-foreground">المدة: {l.duration}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legal Structure - NEW */}
        {analysis.recommended_legal_structure && (
          <Card className="bg-card/80 border-section-finance/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-section-finance" /> الهيكل القانوني المقترح</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.recommended_legal_structure.type && (
                  <div className="p-3 rounded-xl border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">📋 النوع المقترح</p>
                    <p className="font-semibold text-foreground">{analysis.recommended_legal_structure.type}</p>
                  </div>
                )}
                {analysis.recommended_legal_structure.reason && (
                  <div className="p-3 rounded-xl border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">💡 السبب</p>
                    <p className="text-foreground">{analysis.recommended_legal_structure.reason}</p>
                  </div>
                )}
                {analysis.recommended_legal_structure.requirements && (
                  <div className="p-3 rounded-xl border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">📝 المتطلبات</p>
                    <p className="text-foreground">{analysis.recommended_legal_structure.requirements}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.key_metrics?.length > 0 && (
          <Card className="bg-card/80 border-section-finance/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-section-finance" /> المؤشرات الرئيسية</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {analysis.key_metrics.map((m: any, i: number) => (
                  <div key={i} className={`p-3 rounded-xl border ${m.status === 'positive' ? 'border-section-revenue/30 bg-section-revenue/5' : m.status === 'negative' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30'}`}>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-bold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.strengths?.length > 0 && (
          <Card className="bg-card/80 border-section-revenue/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-section-revenue" /> نقاط القوة والفرص</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-foreground p-2 rounded-lg bg-section-revenue/5"><CheckCircle2 className="w-4 h-4 text-section-revenue mt-1 shrink-0" /><span>{s}</span></li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysis.risks?.length > 0 && (
          <Card className="bg-card/80 border-section-invest/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-section-invest" /> تحليل المخاطر وخطط التخفيف</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.risks.map((r: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={r.severity === 'critical' ? 'text-destructive border-destructive' : r.severity === 'high' ? 'text-section-invest border-section-invest' : 'text-muted-foreground'}>
                        {r.severity === 'critical' ? '🔴 حرج' : r.severity === 'high' ? '🟠 عالي' : r.severity === 'medium' ? '🟡 متوسط' : '🟢 منخفض'}
                      </Badge>
                      <span className="font-semibold text-foreground">{r.risk}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pr-2">💡 <span className="font-medium">خطة التخفيف:</span> {r.mitigation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.financial_analysis && (
          <Card className="bg-card/80 border-section-finance/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-section-finance" /> التحليل المالي التفصيلي</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'رأس المال المقترح', value: analysis.financial_analysis.estimated_startup_cost, icon: '🏗️' },
                  { label: 'المصاريف الشهرية المتوقعة', value: analysis.financial_analysis.estimated_monthly_expenses, icon: '📉' },
                  { label: 'الإيرادات الشهرية المتوقعة', value: analysis.financial_analysis.estimated_monthly_revenue, icon: '📈' },
                  { label: 'العائد على الاستثمار (ROI)', value: analysis.financial_analysis.estimated_roi_months ? `${analysis.financial_analysis.estimated_roi_months} شهر` : '-', icon: '🔄' },
                  { label: 'نقطة التعادل (Break Even)', value: analysis.financial_analysis.break_even_months ? `${analysis.financial_analysis.break_even_months} شهر` : '-', icon: '⚖️' },
                  { label: 'هامش الربح المتوقع', value: analysis.financial_analysis.profit_margin_estimate, icon: '💹' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground">{item.icon} {item.label}</p>
                    <p className="text-lg font-bold text-foreground mt-1">{item.value || '-'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.company_fit && (
          <Card className="bg-card/80 border-section-strategic/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-section-strategic" /> مدى التوافق مع الشركة</CardTitle></CardHeader>
            <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis.company_fit}</p></CardContent>
          </Card>
        )}

        {analysis.suitable_employees?.length > 0 && (
          <Card className="bg-card/80 border-section-employees/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-section-employees" /> الموظفين المرشحين للإدارة</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.suitable_employees.map((e: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 flex items-start gap-3">
                    <Users className="w-5 h-5 text-section-employees mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">{e.name} {e.role_suggestion && <Badge variant="outline" className="mr-2">{e.role_suggestion}</Badge>}</p>
                      <p className="text-sm text-muted-foreground mt-1">{e.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.timeline?.length > 0 && (
          <Card className="bg-card/80 border-section-forecast/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-section-forecast" /> خطة التنفيذ المقترحة</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.timeline.map((phase: any, i: number) => (
                  <div key={i} className="relative pr-8 border-r-2 border-section-forecast/30">
                    <div className="absolute -right-[9px] top-1 w-4 h-4 rounded-full bg-section-forecast ring-4 ring-card" />
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-section-forecast/15 text-section-forecast">{`المرحلة ${i + 1}`}</Badge>
                        <span className="font-bold text-foreground">{phase.phase}</span>
                        <Badge variant="outline">{phase.duration}</Badge>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1 pr-2">
                        {phase.tasks.map((t: string, j: number) => <li key={j} className="flex items-start gap-2"><span className="text-section-forecast mt-0.5">›</span> {t}</li>)}
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

  if (showResult) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
                <div className="p-2 rounded-xl bg-section-ai/15"><Sparkles className="w-6 h-6 text-section-ai" /></div>
                تقرير تحليل الجدوى: {showResult.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">تم التحليل والبحث بالكامل بواسطة الذكاء الاصطناعي</p>
            </div>
            <Button variant="outline" onClick={() => setShowResult(null)} className="gap-2"><ArrowRight className="w-4 h-4" /> العودة للقائمة</Button>
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
              محلل جدوى الأعمال الذكي
            </h1>
            <p className="text-muted-foreground text-sm mt-1">تحليل الجدوى ومقترحات البزنس الذكية</p>
          </div>
        </div>

        <Tabs defaultValue="proposals" className="w-full">
          <TabsList className="h-auto p-1 bg-card/80 flex flex-wrap gap-1">
            <TabsTrigger value="proposals" className="gap-2">
              <Rocket className="w-4 h-4" /> مقترحات البزنس الذكية
            </TabsTrigger>
            <TabsTrigger value="feasibility" className="gap-2">
              <Brain className="w-4 h-4" /> تحليل جدوى يدوي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="mt-4">
            <BusinessProposals />
          </TabsContent>

          <TabsContent value="feasibility" className="mt-4 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => { setShowForm(true); setAnswers({}); }} className="gap-2 bg-section-invest hover:bg-section-invest/90">
            <Plus className="w-4 h-4" /> تحليل فرصة جديدة
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي التحليلات', value: feasibilities.length, icon: BarChart3, color: 'text-section-finance' },
            { label: 'فرص موصى بها', value: feasibilities.filter(f => f.recommendation === 'recommended' || f.recommendation === 'strongly_recommended').length, icon: CheckCircle2, color: 'text-section-revenue' },
            { label: 'تحتاج دراسة أعمق', value: feasibilities.filter(f => f.recommendation === 'cautious').length, icon: Scale, color: 'text-section-invest' },
            { label: 'غير مجدية', value: feasibilities.filter(f => f.recommendation === 'not_recommended').length, icon: TrendingDown, color: 'text-destructive' },
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

        {/* Simplified Form - 5 inputs only */}
        {showForm && (
          <Card className="bg-card/90 backdrop-blur-sm border-section-invest/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-section-ai/15">
                  <Brain className="w-6 h-6 text-section-ai" />
                </div>
                <div>
                  <CardTitle className="text-lg">أخبرنا عن فكرتك</CardTitle>
                  <CardDescription>أدخل المعلومات الأساسية فقط — الذكاء الاصطناعي سيبحث ويحلل السوق والمنافسين والتكاليف والتراخيص تلقائياً</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 1. Business Name */}
              <div className="space-y-2 p-4 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-foreground">اسم البزنس / المشروع</label>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">مطلوب</Badge>
                </div>
                <p className="text-xs text-muted-foreground">الاسم التجاري أو اسم العلامة التجارية المقترحة</p>
                <Input
                  placeholder='مثال: مطعم "أومامي" للمأكولات اليابانية'
                  value={answers.name || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* 2. Sector */}
              <div className="space-y-2 p-4 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-foreground">القطاع / تصنيف النشاط</label>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">مطلوب</Badge>
                </div>
                <p className="text-xs text-muted-foreground">حدد المجال الرئيسي الذي ينتمي إليه البزنس</p>
                <Select value={answers.type || ''} onValueChange={v => setAnswers(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر القطاع..." /></SelectTrigger>
                  <SelectContent>
                    {SECTORS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Description */}
              <div className="space-y-2 p-4 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-foreground">وصف الفكرة والقيمة المضافة</label>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">مطلوب</Badge>
                </div>
                <p className="text-xs text-muted-foreground">اشرح الفكرة بالتفصيل: ماذا تقدم؟ كيف تعمل؟ ما الذي يميزها؟</p>
                <Textarea
                  placeholder="مثال: مطعم متخصص في المأكولات اليابانية الأصيلة مع تجربة تفاعلية حيث يراقب العميل تحضير طعامه أمامه..."
                  value={answers.description || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* 4. Location */}
              <div className="space-y-2 p-4 rounded-xl border border-border/50 bg-muted/20">
                <label className="text-sm font-bold text-foreground">الموقع الجغرافي / نطاق العمل</label>
                <p className="text-xs text-muted-foreground">حدد المدى الجغرافي للعمليات</p>
                <Select value={answers.location || ''} onValueChange={v => setAnswers(prev => ({ ...prev, location: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر النطاق الجغرافي..." /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Additional Notes */}
              <div className="space-y-2 p-4 rounded-xl border border-border/50 bg-muted/20">
                <label className="text-sm font-bold text-foreground">ملاحظات إضافية <span className="text-muted-foreground font-normal">(اختياري)</span></label>
                <p className="text-xs text-muted-foreground">أي تفاصيل إضافية تود أن يأخذها الذكاء الاصطناعي بعين الاعتبار</p>
                <Textarea
                  placeholder="مثال: لدي خبرة سابقة في المجال، الميزانية محدودة، أريد البدء خلال 3 أشهر..."
                  value={answers.additional_notes || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, additional_notes: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* AI will research notice */}
              <div className="p-4 rounded-xl bg-section-ai/5 border border-section-ai/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-section-ai mt-0.5 shrink-0" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">الذكاء الاصطناعي سيبحث ويحلل تلقائياً:</p>
                    <ul className="grid grid-cols-2 gap-1 text-xs">
                      <li>📊 حجم السوق واتجاهات النمو</li>
                      <li>🏢 المنافسين الرئيسيين</li>
                      <li>💰 رأس المال والتكاليف المتوقعة</li>
                      <li>📋 التراخيص المطلوبة</li>
                      <li>⚖️ الهيكل القانوني المناسب</li>
                      <li>👥 الموارد البشرية المطلوبة</li>
                      <li>⚠️ المخاطر وخطط التخفيف</li>
                      <li>🗓️ خطة التنفيذ المقترحة</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => { setShowForm(false); setAnswers({}); }}>إلغاء</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={analyzing || !answers.name?.trim() || !answers.type || !answers.description?.trim()}
                  className="gap-2 bg-section-ai hover:bg-section-ai/90"
                >
                  {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري البحث والتحليل...</> : <><Brain className="w-4 h-4" /> ابدأ التحليل الذكي</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="bg-card/80"><CardContent className="p-12 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />جاري تحميل التحليلات...</CardContent></Card>
          ) : feasibilities.length === 0 && !showForm ? (
            <Card className="bg-card/80 border-dashed border-2 border-section-invest/20">
              <CardContent className="p-12 text-center space-y-4">
                <Building2 className="w-16 h-16 mx-auto text-section-invest/30" />
                <div>
                  <h3 className="text-lg font-bold text-foreground">لا توجد تحليلات بعد</h3>
                  <p className="text-sm text-muted-foreground mt-1">أدخل فكرة بزنسك فقط والذكاء الاصطناعي يتكفل بكل شيء</p>
                </div>
                <Button onClick={() => { setShowForm(true); setAnswers({}); }} className="gap-2 bg-section-invest hover:bg-section-invest/90">
                  <Plus className="w-4 h-4" /> تحليل فرصة جديدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            feasibilities.map(f => {
              const rec = recommendationConfig[f.recommendation || 'cautious'] || recommendationConfig.cautious;
              const RecIcon = rec.icon;
              return (
                <Card key={f.id} className="bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-all cursor-pointer border-border hover:shadow-md" onClick={() => setShowResult(f)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${rec.color}`}><RecIcon className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-foreground truncate">{f.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{f.business_type || 'عام'}</span>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> جدوى: <strong className="text-foreground">{f.feasibility_score}%</strong></span>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> مخاطر: <strong className="text-foreground">{f.risk_score}%</strong></span>
                        <span className="text-border">|</span>
                        <span>{format(new Date(f.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                      </div>
                    </div>
                    <Badge className={`${rec.color} hidden sm:inline-flex`}>{rec.label}</Badge>
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
