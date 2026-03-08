import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { 
  FolderKanban, TrendingUp, TrendingDown, DollarSign, 
  AlertTriangle, CheckCircle2, Search, Filter, ExternalLink,
  Target, Wallet, PiggyBank, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export default function ProjectsDashboard() {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate project health for each project
  const getProjectHealth = (project: any) => {
    const revenue = project.override_total_revenue ?? project.total_revenue;
    const expenses = project.override_total_expenses ?? project.total_expenses;
    const profit = revenue - expenses;
    const growth = project.override_growth_rate ?? project.growth_rate;
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    const taskCompletion = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 50;

    return {
      profitability: profit > 0 ? Math.min(100, (profit / revenue) * 100) : 0,
      growth: Math.max(0, Math.min(100, growth + 50)),
      taskCompletion,
      risk: project.data_reliability_score,
    };
  };

  // Radar chart data for selected project comparison
  const radarData = filteredProjects.slice(0, 3).map(p => {
    const health = getProjectHealth(p);
    return {
      subject: p.name.slice(0, 8),
      الربحية: health.profitability,
      النمو: health.growth,
      المهام: health.taskCompletion,
      الموثوقية: health.risk,
    };
  });

  // Projects comparison bar chart
  const comparisonData = filteredProjects.map(p => ({
    name: p.name.slice(0, 10),
    profit: (p.override_total_revenue ?? p.total_revenue) - (p.override_total_expenses ?? p.total_expenses),
    status: p.status,
  }));

  const statusColors: Record<string, string> = {
    profitable: 'hsl(var(--primary))',
    breakeven: 'hsl(var(--secondary))',
    loss: 'hsl(var(--destructive))',
  };

  const totalRevenue = projects.reduce((sum, p) => sum + (p.override_total_revenue ?? p.total_revenue), 0);
  const totalExpenses = projects.reduce((sum, p) => sum + (p.override_total_expenses ?? p.total_expenses), 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">لوحة تحكم المشاريع</h1>
            <p className="text-muted-foreground text-sm">تحليل شامل لأداء جميع المشاريع</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 w-48"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">جميع الحالات</option>
              <option value="profitable">مربح</option>
              <option value="breakeven">متعادل</option>
              <option value="loss">خاسر</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderKanban className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المشاريع</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-section-revenue/10">
                  <DollarSign className="w-5 h-5 text-section-revenue" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-section-employees/10">
                  <Wallet className="w-5 h-5 text-section-employees" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalExpenses.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${totalProfit >= 0 ? 'bg-section-revenue/10' : 'bg-destructive/10'}`}>
                  <PiggyBank className={`w-5 h-5 ${totalProfit >= 0 ? 'text-section-revenue' : 'text-destructive'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-section-revenue' : 'text-destructive'}`}>
                    {totalProfit.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">صافي الربح</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects Comparison */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                مقارنة أرباح المشاريع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="profit" name="الربح" radius={[4, 4, 0, 0]}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.status] || 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Analysis */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                تحليل الأداء (أفضل 3 مشاريع)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={[
                  { metric: 'الربحية', value: radarData[0]?.الربحية || 0 },
                  { metric: 'النمو', value: radarData[0]?.النمو || 0 },
                  { metric: 'المهام', value: radarData[0]?.المهام || 0 },
                  { metric: 'الموثوقية', value: radarData[0]?.الموثوقية || 0 },
                ]}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Radar name="الأداء" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, i) => {
            const revenue = project.override_total_revenue ?? project.total_revenue;
            const expenses = project.override_total_expenses ?? project.total_expenses;
            const profit = revenue - expenses;
            const health = getProjectHealth(project);
            const projectTasks = tasks.filter(t => t.project_id === project.id);

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{project.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{project.name_en || project.slug}</p>
                      </div>
                      <Badge 
                        variant={project.status === 'profitable' ? 'default' : project.status === 'loss' ? 'destructive' : 'secondary'}
                      >
                        {project.status === 'profitable' ? 'مربح' : project.status === 'loss' ? 'خاسر' : 'متعادل'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">الإيرادات</p>
                        <p className="font-semibold text-section-revenue">{revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">المصروفات</p>
                        <p className="font-semibold text-section-employees">{expenses.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">صافي الربح</span>
                      <span className={`font-bold ${profit >= 0 ? 'text-section-revenue' : 'text-destructive'}`}>
                        {profit >= 0 ? '+' : ''}{profit.toLocaleString()} ر.س
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">صحة المشروع</span>
                        <span>{Math.round((health.profitability + health.growth + health.taskCompletion + health.risk) / 4)}%</span>
                      </div>
                      <Progress value={(health.profitability + health.growth + health.taskCompletion + health.risk) / 4} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3" />
                        {projectTasks.filter(t => t.status === 'done').length}/{projectTasks.length} مهام
                      </div>
                      <Link to={`/projects/${project.slug}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <ExternalLink className="w-3 h-3 ml-1" />
                          تفاصيل
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد مشاريع مطابقة للبحث</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
