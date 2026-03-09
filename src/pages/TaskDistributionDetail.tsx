import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTaskDistributions, useTaskDistributionItems } from '@/hooks/useTaskDistribution';
import { ArrowRight, Brain, CheckCircle2, User, Lightbulb, AlertTriangle, TrendingUp, Clock, Zap, Send } from 'lucide-react';

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'متوسطة', color: 'bg-section-forecast/20 text-section-forecast' },
  high: { label: 'عالية', color: 'bg-section-employees/20 text-section-employees' },
  critical: { label: 'حرجة', color: 'bg-destructive/20 text-destructive' },
};

export default function TaskDistributionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { distributions, approveDistribution } = useTaskDistributions();
  const { data: items = [], isLoading: itemsLoading } = useTaskDistributionItems(id);

  const dist = distributions.find(d => d.id === id);
  if (!dist) return <Layout><div className="p-8 text-center text-muted-foreground">جاري التحميل...</div></Layout>;

  const analysis = dist.ai_analysis || {};
  const insights = dist.employee_insights || [];
  const canApprove = dist.status === 'reviewed';

  const handleApprove = async () => {
    await approveDistribution.mutateAsync(dist.id);
  };

  // Group items by employee
  const byEmployee = new Map<string, typeof items>();
  items.forEach(item => {
    const name = item.assigned_to_name || 'غير معين';
    const arr = byEmployee.get(name) || [];
    arr.push(item);
    byEmployee.set(name, arr);
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/task-distribution')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-foreground">{dist.title}</h1>
            {dist.description && <p className="text-sm text-muted-foreground mt-1">{dist.description}</p>}
          </div>
          {canApprove && (
            <Button onClick={handleApprove} disabled={approveDistribution.isPending} className="gap-2 bg-section-revenue hover:bg-section-revenue/90">
              <Send className="w-4 h-4" />
              {approveDistribution.isPending ? 'جاري الاعتماد...' : 'اعتماد التوزيع'}
            </Button>
          )}
          {dist.status === 'distributed' && (
            <Badge className="bg-section-revenue/20 text-section-revenue gap-1">
              <CheckCircle2 className="w-3 h-3" /> تم الاعتماد
            </Badge>
          )}
        </div>

        {/* AI Analysis Summary */}
        {analysis.summary && (
          <Card className="bg-gradient-to-br from-section-ai/5 to-section-forecast/5 border-section-ai/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-section-ai" /> تحليل الذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>

              {analysis.recommendations?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-4 h-4 text-section-invest" /> التوصيات
                  </h4>
                  <ul className="space-y-1">
                    {analysis.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-section-invest mt-0.5">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.risks?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" /> المخاطر
                  </h4>
                  <ul className="space-y-1">
                    {analysis.risks.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-destructive mt-0.5">⚠️</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Employee Insights */}
        {Array.isArray(insights) && insights.length > 0 && (
          <div>
            <h2 className="text-lg font-heading font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-section-revenue" /> رؤى تطوير الموظفين
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {insights.map((insight: any, i: number) => (
                <Card key={i} className="bg-card/80 border-border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-section-employees/15">
                        <User className="w-4 h-4 text-section-employees" />
                      </div>
                      <span className="font-bold text-foreground">{insight.name}</span>
                      <Badge variant="secondary" className="mr-auto">{insight.assigned_count} مهام</Badge>
                    </div>
                    {insight.development_areas && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-section-forecast">مجالات التطوير:</span> {insight.development_areas}
                      </p>
                    )}
                    {insight.growth_notes && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-section-revenue">ملاحظات النمو:</span> {insight.growth_notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tasks by Employee */}
        <div>
          <h2 className="text-lg font-heading font-bold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-section-ai" /> توزيع المهام ({items.length} مهمة)
          </h2>

          {itemsLoading ? (
            <p className="text-muted-foreground text-center p-8">جاري التحميل...</p>
          ) : (
            [...byEmployee.entries()].map(([empName, empItems]) => (
              <div key={empName} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-section-employees" />
                  <span className="font-heading font-bold text-foreground">{empName}</span>
                  <Badge variant="outline" className="text-xs">{empItems.length} مهام</Badge>
                </div>
                <div className="space-y-2 mr-6">
                  {empItems.map(item => {
                    const pc = priorityConfig[item.priority] || priorityConfig.medium;
                    return (
                      <Card key={item.id} className="bg-card/70 border-border">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <Badge className={`${pc.color} shrink-0`}>{pc.label}</Badge>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                              {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                            </div>
                            {item.estimated_hours > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3" /> {item.estimated_hours}س
                              </span>
                            )}
                          </div>

                          {item.assignment_reason && (
                            <div className="bg-section-ai/5 rounded-lg p-2 text-xs text-muted-foreground">
                              <span className="font-semibold text-section-ai">سبب التعيين:</span> {item.assignment_reason}
                            </div>
                          )}

                          {item.employee_development_notes && (
                            <div className="bg-section-revenue/5 rounded-lg p-2 text-xs text-muted-foreground">
                              <span className="font-semibold text-section-revenue">فرصة التطوير:</span> {item.employee_development_notes}
                            </div>
                          )}

                          {item.required_skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.required_skills.map((skill, si) => (
                                <Badge key={si} variant="outline" className="text-[10px]">{skill}</Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
