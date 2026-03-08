import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useDataImports } from '@/hooks/useDataImports';
import { useActivityImpactLogs } from '@/hooks/useActivityImpact';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Activity, Clock, CheckCircle2, TrendingUp,
  FileUp, ListTodo, Zap, RefreshCw, Calendar, ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import AskMeDialog from '@/components/AskMeDialog';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function OperationalDashboard() {
  const { data: projects = [] } = useProjects();
  const { tasks, todoTasks, inProgressTasks, doneTasks } = useTasks();
  const { imports } = useDataImports();
  const { data: logs = [] } = useActivityImpactLogs();
  const navigate = useNavigate();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const todayLogs = logs.filter(log => log.created_at.startsWith(todayStr));
  const todayImports = imports.filter(imp => imp.created_at.startsWith(todayStr));

  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    activities: todayLogs.filter(log => new Date(log.created_at).getHours() === i).length
  }));

  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  const projectsData = projects.slice(0, 5).map(p => ({
    name: p.name.slice(0, 10),
    revenue: p.total_revenue,
    expenses: p.total_expenses,
  }));

  const operationalMetrics = [
    { title: 'نشاطات اليوم', value: todayLogs.length, icon: Activity, color: 'text-section-ai', bgColor: 'bg-section-ai/10', description: 'عمليات تم تسجيلها', path: '/operational' },
    { title: 'مهام قيد التنفيذ', value: inProgressTasks.length, icon: Clock, color: 'text-section-forecast', bgColor: 'bg-section-forecast/10', description: 'مهام نشطة الآن', path: '/tasks' },
    { title: 'استيرادات اليوم', value: todayImports.length, icon: FileUp, color: 'text-section-invest', bgColor: 'bg-section-invest/10', description: 'ملفات تم معالجتها', path: '/import' },
    { title: 'معدل الإنجاز', value: `${completionRate}%`, icon: CheckCircle2, color: 'text-section-revenue', bgColor: 'bg-section-revenue/10', description: 'من إجمالي المهام', path: '/tasks' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              لوحة التشغيل اليومية
            </h1>
            <p className="text-muted-foreground text-sm">
              <Calendar className="w-4 h-4 inline ml-1" />
              {format(today, 'EEEE, d MMMM yyyy', { locale: ar })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </motion.div>

        {/* Quick Metrics */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {operationalMetrics.map((metric) => (
            <motion.div key={metric.title} variants={item}>
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(metric.path)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                      <metric.icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                    <Zap className="w-4 h-4 text-muted-foreground animate-pulse" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{metric.value}</p>
                    <p className="text-sm font-medium text-foreground">{metric.title}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  النشاط بالساعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={hourlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="activities" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} name="النشاطات" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  أداء المشاريع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={projectsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="الإيرادات" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="المصروفات" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tasks Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary" />
                ملخص المهام
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
                <ExternalLink className="w-3 h-3 ml-1" /> عرض الكل
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { value: todoTasks.length, label: 'في الانتظار', color: 'text-yellow-500' },
                  { value: inProgressTasks.length, label: 'قيد التنفيذ', color: 'text-blue-500' },
                  { value: doneTasks.length, label: 'مكتمل', color: 'text-green-500' },
                ].map(s => (
                  <div key={s.label} className="text-center p-4 rounded-xl bg-muted/30">
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <Progress value={completionRate} className="h-3" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                معدل الإنجاز: {completionRate}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                آخر النشاطات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {todayLogs.slice(0, 10).map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.user_name}</p>
                      <p className="text-xs text-muted-foreground">{log.action_type} - {log.entity_type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'HH:mm')}</span>
                  </motion.div>
                ))}
                {todayLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">لا توجد نشاطات مسجلة اليوم</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <AskMeDialog pageKey="dashboard" />
    </Layout>
  );
}