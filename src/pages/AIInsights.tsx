import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';
import { useTasks } from '@/hooks/useTasks';
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Lightbulb, Target, Zap, BarChart3, RefreshCw, Sparkles,
  DollarSign, Users, FolderKanban, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AIInsight {
  id: string;
  type: 'profit-forecast' | 'error-detection' | 'recommendation' | 'trend';
  severity: 'info' | 'warning' | 'success' | 'critical';
  title: string;
  description: string;
  confidence: number;
  action?: string;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
}

export default function AIInsights() {
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const { tasks, doneTasks, todoTasks } = useTasks();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  // Calculate metrics
  const totalRevenue = projects.reduce((sum, p) => sum + p.total_revenue, 0);
  const totalExpenses = projects.reduce((sum, p) => sum + p.total_expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const avgGrowth = projects.length > 0 
    ? projects.reduce((sum, p) => sum + p.growth_rate, 0) / projects.length 
    : 0;

  // Generate forecast data
  const generateForecast = () => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس'];
    const baseProfit = netProfit;
    const growthFactor = 1 + (avgGrowth / 100);
    
    return months.map((month, i) => ({
      month,
      actual: i < 4 ? baseProfit * (0.7 + i * 0.1) : null,
      forecast: baseProfit * Math.pow(growthFactor, i) * (1 + (Math.random() - 0.5) * 0.1),
      confidence: 95 - i * 5,
    }));
  };

  const [forecastData, setForecastData] = useState(generateForecast());

  // Generate AI insights
  const generateInsights = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const newInsights: AIInsight[] = [];

      // Profit forecast insight
      const forecastedProfit = netProfit * Math.pow(1 + avgGrowth / 100, 6);
      newInsights.push({
        id: 'forecast-1',
        type: 'profit-forecast',
        severity: forecastedProfit > netProfit ? 'success' : 'warning',
        title: 'توقع الأرباح للنصف القادم',
        description: `بناءً على معدل النمو الحالي (${avgGrowth.toFixed(1)}%)، من المتوقع أن يصل صافي الربح إلى ${forecastedProfit.toLocaleString()} ر.س خلال 6 أشهر`,
        confidence: 85,
        value: forecastedProfit,
        trend: forecastedProfit > netProfit ? 'up' : 'down',
      });

      // Error detection - expense anomaly
      const expenseRatio = totalExpenses / totalRevenue;
      if (expenseRatio > 0.7) {
        newInsights.push({
          id: 'error-1',
          type: 'error-detection',
          severity: 'critical',
          title: 'تنبيه: نسبة مصروفات مرتفعة',
          description: `نسبة المصروفات للإيرادات (${(expenseRatio * 100).toFixed(1)}%) تتجاوز المعدل الطبيعي. يُنصح بمراجعة بنود المصروفات`,
          confidence: 92,
          action: 'مراجعة المصروفات',
        });
      }

      // Loss projects detection
      const lossProjects = projects.filter(p => p.status === 'loss');
      if (lossProjects.length > 0) {
        newInsights.push({
          id: 'error-2',
          type: 'error-detection',
          severity: 'warning',
          title: `${lossProjects.length} مشروع يحقق خسائر`,
          description: `المشاريع الخاسرة: ${lossProjects.map(p => p.name).join('، ')}. تحليل الأسباب قد يساعد في تحسين الأداء`,
          confidence: 98,
          action: 'تحليل المشاريع',
        });
      }

      // Task completion recommendation
      const taskCompletionRate = tasks.length > 0 ? (doneTasks.length / tasks.length) * 100 : 0;
      if (taskCompletionRate < 50) {
        newInsights.push({
          id: 'rec-1',
          type: 'recommendation',
          severity: 'info',
          title: 'توصية: تحسين معدل إنجاز المهام',
          description: `معدل إنجاز المهام الحالي ${taskCompletionRate.toFixed(0)}%. زيادة التركيز على المهام المتأخرة قد يحسن الإنتاجية بنسبة 20%`,
          confidence: 78,
          action: 'عرض المهام المتأخرة',
        });
      }

      // Growth trend insight
      newInsights.push({
        id: 'trend-1',
        type: 'trend',
        severity: avgGrowth > 5 ? 'success' : avgGrowth > 0 ? 'info' : 'warning',
        title: 'اتجاه النمو',
        description: avgGrowth > 5 
          ? `معدل نمو ممتاز (${avgGrowth.toFixed(1)}%)! الشركة في مسار تصاعدي قوي`
          : avgGrowth > 0 
          ? `نمو معتدل (${avgGrowth.toFixed(1)}%). هناك فرص للتحسين`
          : `تراجع في النمو (${avgGrowth.toFixed(1)}%). يُنصح بمراجعة الاستراتيجية`,
        confidence: 88,
        trend: avgGrowth > 0 ? 'up' : avgGrowth < 0 ? 'down' : 'stable',
      });

      // Employee efficiency recommendation
      const avgPerformance = employees.length > 0 
        ? employees.reduce((sum, e) => sum + (e.performance || 0), 0) / employees.length 
        : 0;
      newInsights.push({
        id: 'rec-2',
        type: 'recommendation',
        severity: avgPerformance > 70 ? 'success' : 'info',
        title: 'كفاءة فريق العمل',
        description: `متوسط أداء الموظفين ${avgPerformance.toFixed(0)}%. ${avgPerformance > 70 ? 'أداء ممتاز! استمروا' : 'تحسين التدريب والتحفيز قد يرفع الأداء 15%'}`,
        confidence: 82,
      });

      setInsights(newInsights);
      setForecastData(generateForecast());
      setIsAnalyzing(false);
    }, 2000);
  };

  useEffect(() => {
    generateInsights();
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'profit-forecast': return TrendingUp;
      case 'error-detection': return AlertTriangle;
      case 'recommendation': return Lightbulb;
      case 'trend': return BarChart3;
      default: return Brain;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              الذكاء الاصطناعي المتقدم
            </h1>
            <p className="text-muted-foreground text-sm">تحليلات ذكية وتوقعات مالية</p>
          </div>
          <Button onClick={generateInsights} disabled={isAnalyzing}>
            <RefreshCw className={`w-4 h-4 ml-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'جارٍ التحليل...' : 'تحليل جديد'}
          </Button>
        </div>

        {/* AI Analysis Status */}
        {isAnalyzing && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Brain className="w-12 h-12 text-primary animate-pulse" />
                  <Zap className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">BatShark AI يحلل البيانات...</h3>
                  <p className="text-sm text-muted-foreground">جارٍ فحص المؤشرات المالية واكتشاف الأنماط</p>
                  <Progress value={65} className="mt-2 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-section-revenue/10">
                  <DollarSign className="w-5 h-5 text-section-revenue" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">صافي الربح</p>
                  <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-section-revenue' : 'text-destructive'}`}>
                    {netProfit.toLocaleString()} ر.س
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-section-forecast/10">
                  <TrendingUp className="w-5 h-5 text-section-forecast" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">معدل النمو</p>
                  <p className="text-lg font-bold">{avgGrowth.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-section-ai/10">
                  <Brain className="w-5 h-5 text-section-ai" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">رؤى AI</p>
                  <p className="text-lg font-bold">{insights.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-section-strategic/10">
                  <Shield className="w-5 h-5 text-section-strategic" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">متوسط الثقة</p>
                  <p className="text-lg font-bold">
                    {insights.length > 0 
                      ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forecast Chart */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              توقع الأرباح (6 أشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: string) => [
                    `${Number(value).toLocaleString()} ر.س`,
                    name === 'actual' ? 'الفعلي' : 'المتوقع'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={0}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  name="actual"
                />
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorForecast)"
                  name="forecast"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-0.5 bg-primary" />
                <span className="text-muted-foreground">الفعلي</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-0.5 bg-primary" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--primary)) 50%, transparent 50%)', backgroundSize: '8px 1px' }} />
                <span className="text-muted-foreground">المتوقع</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {insights.map((insight, i) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`border-l-4 ${
                    insight.severity === 'critical' ? 'border-l-destructive' :
                    insight.severity === 'warning' ? 'border-l-yellow-500' :
                    insight.severity === 'success' ? 'border-l-section-revenue' :
                    'border-l-primary'
                  } bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          insight.severity === 'critical' ? 'bg-destructive/10' :
                          insight.severity === 'warning' ? 'bg-yellow-500/10' :
                          insight.severity === 'success' ? 'bg-section-revenue/10' :
                          'bg-primary/10'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            insight.severity === 'critical' ? 'text-destructive' :
                            insight.severity === 'warning' ? 'text-yellow-500' :
                            insight.severity === 'success' ? 'text-section-revenue' :
                            'text-primary'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-foreground">{insight.title}</h3>
                            {insight.trend && (
                              <Badge variant="outline" className="text-xs">
                                {insight.trend === 'up' ? <TrendingUp className="w-3 h-3 ml-1" /> : 
                                 insight.trend === 'down' ? <TrendingDown className="w-3 h-3 ml-1" /> : null}
                                {insight.trend === 'up' ? 'صاعد' : insight.trend === 'down' ? 'هابط' : 'مستقر'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">الثقة:</span>
                              <Progress value={insight.confidence} className="w-20 h-1.5" />
                              <span className="text-xs font-medium">{insight.confidence}%</span>
                            </div>
                            {insight.action && (
                              <Button variant="ghost" size="sm" className="text-xs h-7">
                                {insight.action}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {insights.length === 0 && !isAnalyzing && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">لا توجد رؤى حالياً</h3>
              <p className="text-muted-foreground mb-4">اضغط على "تحليل جديد" لبدء التحليل الذكي</p>
              <Button onClick={generateInsights}>
                <Sparkles className="w-4 h-4 ml-2" />
                بدء التحليل
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
