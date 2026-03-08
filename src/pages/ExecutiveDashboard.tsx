import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';
import { useJournalMetrics } from '@/hooks/useJournalMetrics';
import { useTasks } from '@/hooks/useTasks';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, FolderKanban, 
  AlertTriangle, CheckCircle2, Clock, Target, Activity,
  ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function ExecutiveDashboard() {
  const { projects } = useProjects();
  const { employees } = useEmployees();
  const { metrics } = useJournalMetrics();
  const { tasks, todoTasks, inProgressTasks, doneTasks } = useTasks();

  const totalRevenue = projects.reduce((sum, p) => sum + (p.override_total_revenue ?? p.total_revenue), 0);
  const totalExpenses = projects.reduce((sum, p) => sum + (p.override_total_expenses ?? p.total_expenses), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;
  
  const avgGrowth = projects.length > 0 
    ? (projects.reduce((sum, p) => sum + (p.override_growth_rate ?? p.growth_rate), 0) / projects.length).toFixed(1)
    : 0;

  const healthScore = Math.min(100, Math.max(0, 
    (netProfit > 0 ? 30 : 0) + 
    (Number(profitMargin) > 10 ? 25 : Number(profitMargin) > 0 ? 15 : 0) +
    (Number(avgGrowth) > 5 ? 25 : Number(avgGrowth) > 0 ? 15 : 0) +
    (doneTasks.length > todoTasks.length ? 20 : 10)
  ));

  const monthlyData = [
    { month: 'يناير', revenue: totalRevenue * 0.7, expenses: totalExpenses * 0.8 },
    { month: 'فبراير', revenue: totalRevenue * 0.75, expenses: totalExpenses * 0.82 },
    { month: 'مارس', revenue: totalRevenue * 0.85, expenses: totalExpenses * 0.85 },
    { month: 'أبريل', revenue: totalRevenue * 0.9, expenses: totalExpenses * 0.88 },
    { month: 'مايو', revenue: totalRevenue * 0.95, expenses: totalExpenses * 0.9 },
    { month: 'يونيو', revenue: totalRevenue, expenses: totalExpenses },
  ];

  const projectStatusData = [
    { name: 'مربح', value: projects.filter(p => p.status === 'profitable').length },
    { name: 'متعادل', value: projects.filter(p => p.status === 'breakeven').length },
    { name: 'خاسر', value: projects.filter(p => p.status === 'loss').length },
  ];

  const kpiCards = [
    { title: 'إجمالي الإيرادات', value: totalRevenue.toLocaleString(), icon: DollarSign, trend: '+12%', positive: true, color: 'section-revenue' },
    { title: 'إجمالي المصروفات', value: totalExpenses.toLocaleString(), icon: Wallet, trend: '+5%', positive: false, color: 'section-employees' },
    { title: 'صافي الربح', value: netProfit.toLocaleString(), icon: PiggyBank, trend: netProfit > 0 ? '+18%' : '-8%', positive: netProfit > 0, color: netProfit > 0 ? 'section-revenue' : 'destructive' },
    { title: 'معدل النمو', value: `${avgGrowth}%`, icon: TrendingUp, trend: '+3%', positive: true, color: 'section-forecast' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">لوحة التحكم التنفيذية</h1>
            <p className="text-muted-foreground text-sm">نظرة شاملة على أداء الشركة</p>
          </div>
          <Badge variant={healthScore >= 70 ? 'default' : healthScore >= 40 ? 'secondary' : 'destructive'} className="text-lg px-4 py-2">
            <Activity className="w-5 h-5 ml-2" />
            مؤشر الصحة: {healthScore}/100
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-${kpi.color}/10`}>
                      <kpi.icon className={`w-5 h-5 text-${kpi.color}`} />
                    </div>
                    <Badge variant={kpi.positive ? 'default' : 'destructive'} className="text-xs">
                      {kpi.positive ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
                      {kpi.trend}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground">{kpi.title}</p>
                    <p className="text-xl font-bold text-foreground">{kpi.value} ر.س</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue vs Expenses Chart */}
          <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                الإيرادات مقابل المصروفات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
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
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" name="الإيرادات" />
                  <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorExpenses)" name="المصروفات" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Status Pie */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-primary" />
                حالة المشاريع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {projectStatusData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <FolderKanban className="w-8 h-8 mx-auto text-section-revenue mb-2" />
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-xs text-muted-foreground">المشاريع</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-section-employees mb-2" />
              <p className="text-2xl font-bold">{employees.length}</p>
              <p className="text-xs text-muted-foreground">الموظفين</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto text-section-ai mb-2" />
              <p className="text-2xl font-bold">{doneTasks.length}</p>
              <p className="text-xs text-muted-foreground">مهام مكتملة</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto text-section-forecast mb-2" />
              <p className="text-2xl font-bold">{inProgressTasks.length}</p>
              <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
            </CardContent>
          </Card>
        </div>

        {/* Health Score Details */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              تفاصيل مؤشر صحة الشركة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>الربحية</span>
                  <span>{netProfit > 0 ? '30/30' : '0/30'}</span>
                </div>
                <Progress value={netProfit > 0 ? 100 : 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>هامش الربح</span>
                  <span>{Number(profitMargin) > 10 ? '25/25' : Number(profitMargin) > 0 ? '15/25' : '0/25'}</span>
                </div>
                <Progress value={Number(profitMargin) > 10 ? 100 : Number(profitMargin) > 0 ? 60 : 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>معدل النمو</span>
                  <span>{Number(avgGrowth) > 5 ? '25/25' : Number(avgGrowth) > 0 ? '15/25' : '0/25'}</span>
                </div>
                <Progress value={Number(avgGrowth) > 5 ? 100 : Number(avgGrowth) > 0 ? 60 : 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>إنجاز المهام</span>
                  <span>{doneTasks.length > todoTasks.length ? '20/20' : '10/20'}</span>
                </div>
                <Progress value={doneTasks.length > todoTasks.length ? 100 : 50} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
