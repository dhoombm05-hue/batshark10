import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusinessProposals, type BusinessProposal } from '@/hooks/useBusinessProposals';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Sparkles, Brain, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Trash2,
  Loader2, Shield, DollarSign, Users, Clock, BarChart3, Target, Lightbulb,
  Scale, Building2, Rocket, ThumbsUp, ThumbsDown, ArrowRight, FileSpreadsheet,
  Gavel, Search, Eye, MapPin, Calendar, RefreshCw, ChevronDown, ChevronUp,
  Briefcase, Zap, TrendingDown, Award, ExternalLink, ShoppingCart, Drama,
  FootprintsIcon, Star, Package, Store, Navigation
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const recommendationConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  strongly_recommended: { label: '✅ موصى به بشدة', color: 'text-emerald-400', icon: CheckCircle2, bg: 'from-emerald-500/20 to-emerald-600/5' },
  recommended: { label: '👍 موصى به', color: 'text-blue-400', icon: TrendingUp, bg: 'from-blue-500/20 to-blue-600/5' },
  cautious: { label: '⚠️ يحتاج حذر', color: 'text-amber-400', icon: AlertTriangle, bg: 'from-amber-500/20 to-amber-600/5' },
  pending: { label: '⏳ قيد التحليل', color: 'text-muted-foreground', icon: Clock, bg: 'from-muted/20 to-muted/5' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '⏳ بانتظار القرار', color: 'bg-amber-500/20 text-amber-400' },
  accepted: { label: '✅ تم القبول', color: 'bg-emerald-500/20 text-emerald-400' },
  rejected: { label: '❌ مرفوض', color: 'bg-destructive/20 text-destructive' },
};

const severityColors: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-destructive/20 text-destructive',
};

interface ProposalDetailProps {
  proposal: BusinessProposal;
  onBack: () => void;
  onAccept: (id: string, notes: string) => void;
  onReject: (id: string, reason: string) => void;
  accepting: boolean;
  isCeo: boolean;
}

function ProposalDetail({ proposal, onBack, onAccept, onReject, accepting, isCeo }: ProposalDetailProps) {
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const research = proposal.ai_research || {};
  const analysis = proposal.ai_analysis || {};
  const financial = proposal.financial_plan || {};
  const actionPlan = proposal.action_plan?.phases || [];
  const competitors = proposal.competitors || [];
  const licenses = proposal.licenses || [];
  const riskData = proposal.risk_assessment?.risks || [];
  const rec = recommendationConfig[proposal.recommendation || 'pending'] || recommendationConfig.pending;
  const RecIcon = rec.icon;
  const expenseBreakdown = financial.expense_breakdown || proposal.excel_data || [];
  const revenueStreams = financial.revenue_streams || [];
  const st = statusConfig[proposal.status] || statusConfig.pending;

  const toggleSection = (section: string) => setActiveSection(prev => prev === section ? null : section);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowRight className="w-4 h-4" /> رجوع
        </Button>
        <Badge className={st.color}>{st.label}</Badge>
      </div>

      {/* Hero Card */}
      <Card className={`bg-gradient-to-br ${rec.bg} border-primary/20`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Rocket className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">{proposal.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{proposal.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {proposal.business_type && <Badge variant="outline" className="gap-1"><Building2 className="w-3 h-3" />{proposal.business_type}</Badge>}
                {proposal.location && <Badge variant="outline" className="gap-1"><MapPin className="w-3 h-3" />{proposal.location}</Badge>}
                <Badge variant="outline" className="gap-1"><Calendar className="w-3 h-3" />{format(new Date(proposal.created_at), 'dd MMM yyyy', { locale: ar })}</Badge>
                {proposal.auto_generated && <Badge className="bg-primary/20 text-primary gap-1"><Zap className="w-3 h-3" />توليد تلقائي</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/80 border-emerald-500/20">
          <CardContent className="p-5 text-center space-y-2">
            <Target className="w-10 h-10 mx-auto text-emerald-400" />
            <p className="text-4xl font-bold text-foreground">{proposal.feasibility_score}<span className="text-lg text-muted-foreground">%</span></p>
            <p className="text-sm text-muted-foreground">درجة الجدوى</p>
            <Progress value={proposal.feasibility_score} className="mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-amber-500/20">
          <CardContent className="p-5 text-center space-y-2">
            <Shield className="w-10 h-10 mx-auto text-amber-400" />
            <p className="text-4xl font-bold text-foreground">{proposal.risk_score}<span className="text-lg text-muted-foreground">%</span></p>
            <p className="text-sm text-muted-foreground">مستوى المخاطر</p>
            <Progress value={proposal.risk_score} className="mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-primary/20">
          <CardContent className="p-5 text-center space-y-2">
            <RecIcon className="w-10 h-10 mx-auto" />
            <Badge className={`text-base px-4 py-1.5 ${rec.color} bg-card/50`}>{rec.label}</Badge>
            <p className="text-sm text-muted-foreground">التوصية</p>
          </CardContent>
        </Card>
      </div>

      {/* Why this business */}
      {research.why_this_business && (
        <Card className="bg-card/80 border-primary/20">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="w-5 h-5 text-primary" /> لماذا هذا البزنس؟</CardTitle></CardHeader>
          <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{research.why_this_business}</p></CardContent>
        </Card>
      )}

      {/* Executive Summary */}
      {research.summary && (
        <Card className="bg-card/80 border-primary/20">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Brain className="w-5 h-5 text-primary" /> الملخص التنفيذي</CardTitle></CardHeader>
          <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{research.summary}</p></CardContent>
        </Card>
      )}

      {/* Tabs for detailed sections */}
      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-card/80">
          <TabsTrigger value="financial" className="gap-1 text-xs"><DollarSign className="w-3 h-3" />المالية</TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-1 text-xs"><ShoppingCart className="w-3 h-3" />الموردين</TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-1 text-xs"><BarChart3 className="w-3 h-3" />السيناريوهات</TabsTrigger>
          <TabsTrigger value="guide" className="gap-1 text-xs"><Navigation className="w-3 h-3" />دليل التنفيذ</TabsTrigger>
          <TabsTrigger value="market" className="gap-1 text-xs"><Search className="w-3 h-3" />السوق</TabsTrigger>
          <TabsTrigger value="competitors" className="gap-1 text-xs"><Users className="w-3 h-3" />المنافسين</TabsTrigger>
          <TabsTrigger value="risks" className="gap-1 text-xs"><AlertTriangle className="w-3 h-3" />المخاطر</TabsTrigger>
          <TabsTrigger value="swot" className="gap-1 text-xs"><BarChart3 className="w-3 h-3" />SWOT</TabsTrigger>
          <TabsTrigger value="plan" className="gap-1 text-xs"><Clock className="w-3 h-3" />الخطة</TabsTrigger>
          <TabsTrigger value="licenses" className="gap-1 text-xs"><Gavel className="w-3 h-3" />التراخيص</TabsTrigger>
          <TabsTrigger value="team" className="gap-1 text-xs"><Award className="w-3 h-3" />الفريق</TabsTrigger>
          <TabsTrigger value="tips" className="gap-1 text-xs"><Star className="w-3 h-3" />نصائح ذهبية</TabsTrigger>
          <TabsTrigger value="excel" className="gap-1 text-xs"><FileSpreadsheet className="w-3 h-3" />Excel</TabsTrigger>
        </TabsList>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'رأس المال التأسيسي', value: financial.startup_cost, icon: DollarSign },
              { label: 'المصاريف الشهرية', value: financial.monthly_expenses, icon: TrendingDown },
              { label: 'الإيرادات الشهرية المتوقعة', value: financial.expected_monthly_revenue, icon: TrendingUp },
              { label: 'الربح الشهري المتوقع', value: financial.expected_monthly_profit, icon: BarChart3 },
              { label: 'فترة العائد (ROI)', value: financial.roi_months ? `${financial.roi_months} شهر` : '-', icon: Clock },
              { label: 'نقطة التعادل', value: financial.break_even_months ? `${financial.break_even_months} شهر` : '-', icon: Target },
              { label: 'هامش الربح', value: financial.profit_margin, icon: Scale },
              { label: 'إيرادات السنة الأولى', value: financial.first_year_revenue, icon: Sparkles },
              { label: 'أرباح السنة الأولى', value: financial.first_year_profit, icon: Award },
            ].map((item, i) => (
              <Card key={i} className="bg-card/60">
                <CardContent className="p-3 text-center">
                  <item.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-bold text-foreground text-sm mt-1">{item.value || '-'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-3">
          {(research.suppliers || []).length > 0 ? (
            <div className="space-y-3">
              {(research.suppliers || []).map((s: any, i: number) => (
                <Card key={i} className="bg-card/60">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-foreground">{s.item_name}</h4>
                          <Badge variant="outline" className="text-primary">{s.price_range}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">🏪 المورد:</span> <span className="text-foreground">{s.supplier_name}</span></div>
                          <div><span className="text-muted-foreground">📍 مكان الشراء:</span> <span className="text-foreground">{s.where_to_buy || '-'}</span></div>
                          {s.alternative && <div><span className="text-muted-foreground">💡 بديل أرخص:</span> <span className="text-foreground">{s.alternative}</span></div>}
                          {s.warranty_info && <div><span className="text-muted-foreground">🛡️ الضمان:</span> <span className="text-foreground">{s.warranty_info}</span></div>}
                        </div>
                        {s.purchase_advice && <p className="text-xs text-muted-foreground bg-muted/30 rounded p-2">💬 {s.purchase_advice}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground p-8">لا توجد بيانات موردين - جرب توليد اقتراح جديد</p>
          )}
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          {research.scenarios ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'optimistic', label: '🟢 سيناريو متفائل', color: 'border-emerald-500/30 bg-emerald-500/5', data: research.scenarios.optimistic },
                { key: 'realistic', label: '🔵 سيناريو واقعي', color: 'border-blue-500/30 bg-blue-500/5', data: research.scenarios.realistic },
                { key: 'pessimistic', label: '🔴 سيناريو متشائم', color: 'border-destructive/30 bg-destructive/5', data: research.scenarios.pessimistic },
              ].map((scenario) => scenario.data && (
                <Card key={scenario.key} className={`${scenario.color}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{scenario.label}</CardTitle>
                    {scenario.data.label && <CardDescription>{scenario.data.label}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">الإيرادات الشهرية</span><span className="font-bold text-foreground">{Number(scenario.data.monthly_revenue || 0).toLocaleString()} ر.س</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">المصاريف الشهرية</span><span className="font-bold text-foreground">{Number(scenario.data.monthly_expenses || 0).toLocaleString()} ر.س</span></div>
                      <div className="flex justify-between border-t border-border/50 pt-2"><span className="text-muted-foreground">الربح الشهري</span><span className={`font-bold ${scenario.data.monthly_profit > 0 ? 'text-emerald-400' : 'text-destructive'}`}>{Number(scenario.data.monthly_profit || 0).toLocaleString()} ر.س</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">فترة الاسترداد</span><span className="font-bold text-foreground">{scenario.data.roi_months} شهر</span></div>
                    </div>
                    {scenario.data.description && <p className="text-xs text-muted-foreground bg-card/50 rounded p-2">{scenario.data.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground p-8">لا توجد سيناريوهات - جرب توليد اقتراح جديد</p>
          )}
        </TabsContent>

        {/* Step-by-Step Guide Tab */}
        <TabsContent value="guide" className="space-y-3">
          {(research.step_by_step_guide || []).length > 0 ? (
            <div className="space-y-3">
              {(research.step_by_step_guide || []).map((step: any, i: number) => (
                <Card key={i} className="bg-card/60">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {step.step_number || i + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-bold text-foreground text-base">{step.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {step.where_to_go && <div className="bg-muted/30 rounded p-2"><span className="text-muted-foreground">📍 أين تذهب:</span> <span className="text-foreground">{step.where_to_go}</span></div>}
                          {step.estimated_time && <div className="bg-muted/30 rounded p-2"><span className="text-muted-foreground">⏱️ الوقت:</span> <span className="text-foreground">{step.estimated_time}</span></div>}
                          {step.estimated_cost && <div className="bg-muted/30 rounded p-2"><span className="text-muted-foreground">💰 التكلفة:</span> <span className="text-foreground">{step.estimated_cost}</span></div>}
                          {step.documents_needed && <div className="bg-muted/30 rounded p-2"><span className="text-muted-foreground">📄 المستندات:</span> <span className="text-foreground">{step.documents_needed}</span></div>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground p-8">لا يوجد دليل تنفيذ - جرب توليد اقتراح جديد</p>
          )}
        </TabsContent>
        {/* Market Tab */}
        <TabsContent value="market">
          <Card className="bg-card/80">
            <CardContent className="p-5 space-y-4">
              {Object.entries(proposal.market_data || analysis.market_research || {}).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {key === 'market_size' ? '📊 حجم السوق' :
                     key === 'growth_trend' ? '📈 اتجاه النمو' :
                     key === 'target_audience' ? '🎯 الفئة المستهدفة' :
                     key === 'demand_analysis' ? '📋 تحليل الطلب' :
                     key === 'market_gap' ? '🔍 الفجوة في السوق' : key}
                  </p>
                  <p className="text-foreground">{String(value)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors">
          {competitors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنافس</TableHead>
                  <TableHead className="text-right">نقاط القوة</TableHead>
                  <TableHead className="text-right">نقاط الضعف</TableHead>
                  <TableHead className="text-right">الحصة السوقية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((c: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.strengths}</TableCell>
                    <TableCell className="text-sm">{c.weaknesses}</TableCell>
                    <TableCell><Badge variant="outline">{c.market_share || '-'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground p-8">لا توجد بيانات منافسين</p>
          )}
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks">
          <div className="space-y-3">
            {riskData.map((r: any, i: number) => (
              <Card key={i} className="bg-card/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <p className="font-medium text-foreground">{r.risk}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">🛡️ {r.mitigation}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={severityColors[r.severity] || ''}>{r.severity}</Badge>
                      {r.probability && <Badge variant="outline">{r.probability}</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {riskData.length === 0 && <p className="text-center text-muted-foreground p-8">لا توجد مخاطر محددة</p>}
          </div>
        </TabsContent>

        {/* SWOT Tab */}
        <TabsContent value="swot">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: '💪 نقاط القوة', items: research.strengths, color: 'border-emerald-500/30' },
              { title: '⚡ نقاط الضعف', items: research.weaknesses, color: 'border-amber-500/30' },
              { title: '🚀 الفرص', items: research.opportunities, color: 'border-blue-500/30' },
              { title: '⚠️ التهديدات', items: research.threats, color: 'border-destructive/30' },
            ].map((section, i) => (
              <Card key={i} className={`bg-card/60 ${section.color}`}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{section.title}</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {(section.items || []).map((item: string, j: number) => (
                      <li key={j} className="text-sm text-foreground flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                    {(!section.items || section.items.length === 0) && <li className="text-sm text-muted-foreground">-</li>}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Action Plan Tab */}
        <TabsContent value="plan">
          <div className="space-y-3">
            {actionPlan.map((phase: any, i: number) => (
              <Card key={i} className="bg-card/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{i + 1}</div>
                    <div>
                      <p className="font-medium text-foreground">{phase.phase}</p>
                      <p className="text-xs text-muted-foreground">{phase.duration} {phase.budget && `| ${phase.budget}`}</p>
                    </div>
                  </div>
                  {phase.milestone && <p className="text-sm text-primary mb-2">🎯 {phase.milestone}</p>}
                  <ul className="space-y-1 mr-11">
                    {(phase.tasks || []).map((task: string, j: number) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 mt-1 shrink-0 text-primary/60" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
            {actionPlan.length === 0 && <p className="text-center text-muted-foreground p-8">لا توجد خطة عمل</p>}
          </div>
        </TabsContent>

        {/* Licenses Tab */}
        <TabsContent value="licenses">
          {licenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الترخيص</TableHead>
                  <TableHead className="text-right">الجهة المانحة</TableHead>
                  <TableHead className="text-right">التكلفة</TableHead>
                  <TableHead className="text-right">المدة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((l: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.authority || '-'}</TableCell>
                    <TableCell>{l.cost || '-'}</TableCell>
                    <TableCell>{l.duration || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground p-8">لا توجد تراخيص</p>
          )}
          {analysis.legal_structure && (
            <Card className="bg-card/60 mt-4">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Scale className="w-4 h-4" /> الهيكل القانوني المقترح</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {analysis.legal_structure.type && <p><strong>النوع:</strong> {analysis.legal_structure.type}</p>}
                {analysis.legal_structure.reason && <p><strong>السبب:</strong> {analysis.legal_structure.reason}</p>}
                {analysis.legal_structure.requirements && <p><strong>المتطلبات:</strong> {analysis.legal_structure.requirements}</p>}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <div className="space-y-3">
            {(research.suitable_employees || []).map((emp: any, i: number) => (
              <Card key={i} className="bg-card/60">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.current_role} → <span className="text-primary">{emp.suggested_role}</span></p>
                    <p className="text-sm text-muted-foreground mt-1">{emp.reason}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!research.suitable_employees || research.suitable_employees.length === 0) && (
              <p className="text-center text-muted-foreground p-8">لا يوجد ترشيح للموظفين</p>
            )}
          </div>
        </TabsContent>

        {/* Excel Tab */}
        <TabsContent value="excel" className="space-y-4">
          {expenseBreakdown.length > 0 && (
            <Card className="bg-card/80">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="w-4 h-4 text-destructive" /> تفصيل المصاريف</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">البند</TableHead>
                      <TableHead className="text-right">المبلغ (ريال)</TableHead>
                      <TableHead className="text-right">التكرار</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseBreakdown.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.category}</TableCell>
                        <TableCell>{Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.frequency === 'once' ? 'مرة واحدة' : item.frequency === 'monthly' ? 'شهري' : item.frequency === 'yearly' ? 'سنوي' : item.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell>الإجمالي</TableCell>
                      <TableCell>{expenseBreakdown.reduce((s: number, i: any) => s + Number(i.amount || 0), 0).toLocaleString()}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {revenueStreams.length > 0 && (
            <Card className="bg-card/80">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> مصادر الإيرادات</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المصدر</TableHead>
                      <TableHead className="text-right">المبلغ المتوقع (ريال)</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueStreams.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.source}</TableCell>
                        <TableCell>{Number(item.expected_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell>الإجمالي</TableCell>
                      <TableCell>{revenueStreams.reduce((s: number, i: any) => s + Number(i.expected_amount || 0), 0).toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* KPIs */}
          {research.kpis && research.kpis.length > 0 && (
            <Card className="bg-card/80">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> مؤشرات الأداء (KPIs)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المؤشر</TableHead>
                      <TableHead className="text-right">الهدف</TableHead>
                      <TableHead className="text-right">الإطار الزمني</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {research.kpis.map((kpi: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{kpi.metric}</TableCell>
                        <TableCell>{kpi.target}</TableCell>
                        <TableCell>{kpi.timeframe || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* CEO Decision Panel */}
      {isCeo && proposal.status === 'pending' && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="w-5 h-5 text-primary" />
              قرار الرئيس التنفيذي
            </CardTitle>
            <CardDescription>اتخذ قرارك بشأن هذا الاقتراح. القبول سينشئ المشروع تلقائياً ويربطه بالقيود المالية.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="ملاحظات إضافية (اختياري)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-card/50"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => onAccept(proposal.id, notes)}
                disabled={accepting}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                موافقة وإنشاء المشروع
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="gap-2"
              >
                <ThumbsDown className="w-4 h-4" /> رفض
              </Button>
            </div>
            <AnimatePresence>
              {showRejectForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-3 pt-2">
                    <Textarea
                      placeholder="سبب الرفض..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="bg-card/50"
                    />
                    <Button variant="destructive" onClick={() => onReject(proposal.id, rejectReason)} className="w-full gap-2">
                      <XCircle className="w-4 h-4" /> تأكيد الرفض
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Decision info for accepted/rejected */}
      {proposal.ceo_decision && (
        <Card className={`bg-card/60 ${proposal.ceo_decision === 'accepted' ? 'border-emerald-500/30' : 'border-destructive/30'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {proposal.ceo_decision === 'accepted' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-destructive" />}
              <p className="font-medium">{proposal.ceo_decision === 'accepted' ? 'تم القبول وإنشاء المشروع' : 'تم الرفض'}</p>
              {proposal.decided_at && <span className="text-xs text-muted-foreground mr-auto">{format(new Date(proposal.decided_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>}
            </div>
            {proposal.ceo_notes && <p className="text-sm text-muted-foreground">{proposal.ceo_notes}</p>}
            {proposal.project_id && (
              <Button variant="link" className="gap-1 p-0 mt-2 text-primary" asChild>
                <a href={`/projects`}><ExternalLink className="w-3 h-3" /> عرض المشروع</a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

export default function BusinessProposals() {
  const { proposals, pendingProposals, acceptedProposals, rejectedProposals, isLoading, generateProposal, acceptProposal, rejectProposal, deleteProposal } = useBusinessProposals();
  const { isCEO } = useAuthContext();
  const [selectedProposal, setSelectedProposal] = useState<BusinessProposal | null>(null);
  const [generating, setGenerating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const isCeo = isCEO;

  const handleGenerate = async () => {
    setGenerating(true);
    try { await generateProposal.mutateAsync(); } catch {}
    setGenerating(false);
  };

  const handleAccept = async (proposalId: string, notes: string) => {
    setAccepting(true);
    try {
      await acceptProposal.mutateAsync({ proposalId, ceoNotes: notes });
      setSelectedProposal(null);
    } catch {}
    setAccepting(false);
  };

  const handleReject = async (proposalId: string, reason: string) => {
    await rejectProposal.mutateAsync({ proposalId, reason });
    setSelectedProposal(null);
  };

  if (selectedProposal) {
    const fresh = proposals.find(p => p.id === selectedProposal.id) || selectedProposal;
    return (
      <ProposalDetail
        proposal={fresh}
        onBack={() => setSelectedProposal(null)}
        onAccept={handleAccept}
        onReject={handleReject}
        accepting={accepting}
        isCeo={isCeo}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Rocket className="w-7 h-7 text-primary" />
            مقترحات البزنس الذكية
          </h2>
          <p className="text-muted-foreground mt-1">اقتراحات بزنس مبتكرة من الذكاء الاصطناعي بناءً على تحليل السوق وموارد الشركة</p>
        </div>
        {isCeo && (
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            توليد اقتراح جديد
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الاقتراحات', value: proposals.length, icon: Brain, color: 'text-primary' },
          { label: 'بانتظار القرار', value: pendingProposals.length, icon: Clock, color: 'text-amber-400' },
          { label: 'تم القبول', value: acceptedProposals.length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'مرفوض', value: rejectedProposals.length, icon: XCircle, color: 'text-destructive' },
        ].map((s, i) => (
          <Card key={i} className="bg-card/80">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Auto-generation info */}
      <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">التوليد التلقائي: كل 3 أيام</p>
            <p className="text-xs text-muted-foreground">الذكاء الاصطناعي يبحث ويحلل السوق ويقترح فرص بزنس جديدة تلقائياً</p>
          </div>
          {isCeo && (
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating} className="mr-auto gap-1">
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              توليد الآن
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Proposals List */}
      {!isLoading && proposals.length === 0 && (
        <Card className="bg-card/60">
          <CardContent className="p-12 text-center">
            <Rocket className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد اقتراحات بعد</h3>
            <p className="text-muted-foreground mb-4">اضغط "توليد اقتراح جديد" لتبدأ</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {proposals.map((proposal) => {
          const rec = recommendationConfig[proposal.recommendation || 'pending'] || recommendationConfig.pending;
          const st = statusConfig[proposal.status] || statusConfig.pending;
          return (
            <motion.div key={proposal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout>
              <Card className={`bg-card/80 hover:bg-card/90 cursor-pointer transition-all border-l-4 ${
                proposal.status === 'accepted' ? 'border-l-emerald-500' :
                proposal.status === 'rejected' ? 'border-l-destructive' : 'border-l-primary'
              }`} onClick={() => setSelectedProposal(proposal)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Rocket className="w-5 h-5 text-primary shrink-0" />
                        <h3 className="font-bold text-foreground truncate">{proposal.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{proposal.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={st.color}>{st.label}</Badge>
                        <Badge variant="outline" className="gap-1"><Target className="w-3 h-3" />{proposal.feasibility_score}%</Badge>
                        <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" />{proposal.risk_score}%</Badge>
                        {proposal.business_type && <Badge variant="outline">{proposal.business_type}</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedProposal(proposal); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {isCeo && proposal.status !== 'accepted' && (
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteProposal.mutate(proposal.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true, locale: ar })}
                    </span>
                    {proposal.auto_generated && <Badge className="bg-primary/10 text-primary text-xs gap-1"><Zap className="w-3 h-3" />تلقائي</Badge>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
