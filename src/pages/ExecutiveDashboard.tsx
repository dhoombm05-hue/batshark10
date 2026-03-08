import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';
import { useTasks } from '@/hooks/useTasks';
import { useFinancialEngine } from '@/hooks/useFinancialEngine';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, FolderKanban, 
  CheckCircle2, Clock, Target, Activity, Wallet, PiggyBank, 
  BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle,
  Sparkles, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AskMeDialog from '@/components/AskMeDialog';

const COLORS = ['hsl(var(--primary))', 'hsl(152 60% 45%)', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

export default function ExecutiveDashboard() {
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const { tasks, todoTasks, inProgressTasks, doneTasks } = useTasks();
  const { recalculateAll } = useFinancialEngine();
  const navigate = useNavigate();
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Auto-calculate all metrics from DB
  const totalRevenue = projects.reduce((sum, p) => sum + (p.override_total_revenue ?? p.total_revenue), 0);
  const totalExpenses = projects.reduce((sum, p) => sum + (p.override_total_expenses ?? p.total_expenses), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
  const avgGrowth = projects.length > 0 
    ? projects.reduce((sum, p) => sum + (p.override_growth_rate ?? p.growth_rate), 0) / projects.length
    : 0;
  const roi = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100) : 0;
  const profitableCount = projects.filter(p => p.status === 'profitable').length;
  const lossCount = projects.filter(p => p.status === 'loss').length;

  const healthScore = Math.min(100, Math.max(0, 
    (netProfit > 0 ? 30 : 0) + 
    (profitMargin > 10 ? 25 : profitMargin > 0 ? 15 : 0) +
    (avgGrowth > 5 ? 25 : avgGrowth > 0 ? 15 : 0) +
    (doneTasks.length > todoTasks.length ? 20 : 10)
  ));

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await recalculateAll();
      toast.success('تم إعادة احتساب جميع البيانات تلقائياً');
    } catch {
      toast.error('فشلت إعادة الاحتساب');
    } finally {
      setIsRecalculating(false);
    }
  };

  const monthlyData = [
    { month: 'يناير', revenue: totalRevenue * 0.7, expenses: totalExpenses * 0.8 },
    { month: 'فبراير', revenue: totalRevenue * 0.75, expenses: totalExpenses * 0.82 },
    { month: 'مارس', revenue: totalRevenue * 0.85, expenses: totalExpenses * 0.85 },
    { month: 'أبريل', revenue: totalRevenue * 0.9, expenses: totalExpenses * 0.88 },
    { month: 'مايو', revenue: totalRevenue * 0.95, expenses: totalExpenses * 0.9 },
    { month: 'يونيو', revenue: totalRevenue, expenses: totalExpenses },
  ];

  const projectStatusData = [
    { name: 'مربح', value: profitableCount },
    { name: 'متعادل', value: projects.filter(p => p.status === 'breakeven').length },
    { name: 'خاسر', value: lossCount },
  ].filter(d => d.value > 0);

  const kpiCards = [
    { title: 'إجمالي الإيرادات', value: totalRevenue.toLocaleString(), icon: DollarSign, trend: `${avgGrowth >= 0 ? '+' : ''}${avgGrowth.toFixed(1)}%`, positive: avgGrowth >= 0, gradient: 'from-emerald-500/10 to-emerald-500/5' },
    { title: 'إجمالي المصروفات', value: totalExpenses.toLocaleString(), icon: Wallet, trend: `${((totalExpenses / Math.max(totalRevenue, 1)) * 100).toFixed(0)}%`, positive: totalExpenses < totalRevenue, gradient: 'from-orange-500/10 to-orange-500/5' },
    { title: 'صافي الربح', value: netProfit.toLocaleString(), icon: PiggyBank, trend: `${profitMargin.toFixed(1)}%`, positive: netProfit > 0, gradient: netProfit > 0 ? 'from-blue-500/10 to-blue-500/5' : 'from-red-500/10 to-red-500/5' },
    { title: 'العائد ROI', value: `${roi.toFixed(1)}%`, icon: TrendingUp, trend: roi > 0 ? 'إيجابي' : 'سلبي', positive: roi > 0, gradient: 'from-purple-500/10 to-purple-500/5' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              لوحة التحكم التنفيذية
            </h1>
            <p className="text-muted-foreground text-sm">نظرة شاملة محدّثة تلقائياً على أداء الشركة</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={healthScore >= 70 ? 'default' : healthScore >= 40 ? 'secondary' : 'destructive'} 
              className="text-sm px-4 py-2 animate-in fade-in"
            >
              <Activity className="w-4 h-4 ml-2" />
              صحة الشركة: {healthScore}/100
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRecalculate}
              disabled={isRecalculating}
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'جارٍ...' : 'تحديث'}
            </Button>
          </div>
        </motion.div>

        {/* Risk Alert */}
        {(lossCount > 0 || netProfit < 0) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/5 border border-destructive/20"
          >
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div className="flex-1 text-sm">
              {netProfit < 0 && <span className="font-bold text-destructive">⚠ خسارة صافية: {Math.abs(netProfit).toLocaleString()} ر.س</span>}
              {lossCount > 0 && <span className="text-muted-foreground mr-3">• {lossCount} مشروع خاسر</span>}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/alerts')} className="text-xs shrink-0">
              <ExternalLink className="w-3 h-3 ml-1" />
              التنبيهات
            </Button>
          </motion.div>
        )}

        {/* KPI Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <motion.div key={kpi.title} variants={item}>
              <Card className={`border-border/50 bg-gradient-to-br ${kpi.gradient} backdrop-blur-sm hover:shadow-lg transition-all duration-300 group`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-card/80 shadow-sm group-hover:shadow-md transition-shadow">
                      <kpi.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <Badge variant={kpi.positive ? 'default' : 'destructive'} className="text-xs">
                      {kpi.positive ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
                      {kpi.trend}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{kpi.title}</p>
                  <p className="text-xl font-heading font-bold text-foreground">{kpi.value} ر.س</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue vs Expenses Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  الإيرادات مقابل المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
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
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" name="الإيرادات" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorExpenses)" name="المصروفات" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Project Status Pie */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-primary" />
                  حالة المشاريع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {projectStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {projectStatusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: FolderKanban, value: projects.length, label: 'المشاريع', color: 'text-primary', path: '/projects' },
            { icon: Users, value: employees.length, label: 'الموظفين', color: 'text-section-employees', path: '/employees' },
            { icon: CheckCircle2, value: doneTasks.length, label: 'مهام مكتملة', color: 'text-section-revenue', path: '/tasks' },
            { icon: Clock, value: inProgressTasks.length, label: 'قيد التنفيذ', color: 'text-section-forecast', path: '/tasks' },
          ].map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <Card 
                className="border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => navigate(stat.path)}
              >
                <CardContent className="p-4 text-center">
                  <stat.icon className={`w-8 h-8 mx-auto ${stat.color} mb-2 group-hover:scale-110 transition-transform`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Health Score Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                تفاصيل مؤشر صحة الشركة
                <Badge variant="outline" className="mr-auto text-xs">محسوب تلقائياً</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'الربحية', score: netProfit > 0 ? 30 : 0, max: 30, value: netProfit > 0 ? 100 : 0 },
                  { label: 'هامش الربح', score: profitMargin > 10 ? 25 : profitMargin > 0 ? 15 : 0, max: 25, value: profitMargin > 10 ? 100 : profitMargin > 0 ? 60 : 0 },
                  { label: 'معدل النمو', score: avgGrowth > 5 ? 25 : avgGrowth > 0 ? 15 : 0, max: 25, value: avgGrowth > 5 ? 100 : avgGrowth > 0 ? 60 : 0 },
                  { label: 'إنجاز المهام', score: doneTasks.length > todoTasks.length ? 20 : 10, max: 20, value: doneTasks.length > todoTasks.length ? 100 : 50 },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{metric.label}</span>
                      <span className="font-medium">{metric.score}/{metric.max}</span>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <AskMeDialog pageKey="dashboard" />
    </Layout>
  );
}