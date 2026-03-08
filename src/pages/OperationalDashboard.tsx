import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useDataImports } from '@/hooks/useDataImports';
import { useActivityLog } from '@/hooks/useActivityLog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Activity, Clock, CheckCircle2, AlertCircle, TrendingUp,
  FileUp, ListTodo, Users, Zap, RefreshCw, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function OperationalDashboard() {
  const { projects } = useProjects();
  const { tasks, todoTasks, inProgressTasks, doneTasks } = useTasks();
  const { imports } = useDataImports();
  const { logs } = useActivityLog();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Today's activities
  const todayLogs = logs.filter(log => log.created_at.startsWith(todayStr));
  const todayImports = imports.filter(imp => imp.created_at.startsWith(todayStr));
  const todayTasks = tasks.filter(t => t.updated_at.startsWith(todayStr));

  // Activity by hour (last 24 hours)
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    activities: todayLogs.filter(log => {
      const logHour = new Date(log.created_at).getHours();
      return logHour === i;
    }).length
  }));

  // Task completion rate
  const completionRate = tasks.length > 0 
    ? Math.round((doneTasks.length / tasks.length) * 100) 
    : 0;

  // Projects performance today
  const projectsData = projects.slice(0, 5).map(p => ({
    name: p.name.slice(0, 10),
    revenue: p.override_total_revenue ?? p.total_revenue,
    expenses: p.override_total_expenses ?? p.total_expenses,
  }));

  const operationalMetrics = [
    { 
      title: 'نشاطات اليوم', 
      value: todayLogs.length, 
      icon: Activity, 
      color: 'section-ai',
      description: 'عمليات تم تسجيلها'
    },
    { 
      title: 'مهام قيد التنفيذ', 
      value: inProgressTasks.length, 
      icon: Clock, 
      color: 'section-forecast',
      description: 'مهام نشطة الآن'
    },
    { 
      title: 'استيرادات اليوم', 
      value: todayImports.length, 
      icon: FileUp, 
      color: 'section-invest',
      description: 'ملفات تم معالجتها'
    },
    { 
      title: 'معدل الإنجاز', 
      value: `${completionRate}%`, 
      icon: CheckCircle2, 
      color: 'section-revenue',
      description: 'من إجمالي المهام'
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">لوحة التشغيل اليومية</h1>
            <p className="text-muted-foreground text-sm">
              <Calendar className="w-4 h-4 inline ml-1" />
              {format(today, 'EEEE, d MMMM yyyy', { locale: ar })}
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {operationalMetrics.map((metric, i) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg bg-${metric.color}/10`}>
                      <metric.icon className={`w-5 h-5 text-${metric.color}`} />
                    </div>
                    <Zap className="w-4 h-4 text-muted-foreground animate-pulse" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-sm font-medium text-foreground">{metric.title}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Activity */}
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
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activities" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="النشاطات"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Projects Performance */}
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
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="الإيرادات" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="المصروفات" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Overview */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              ملخص المهام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold text-yellow-500">{todoTasks.length}</p>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold text-blue-500">{inProgressTasks.length}</p>
                <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold text-green-500">{doneTasks.length}</p>
                <p className="text-sm text-muted-foreground">مكتمل</p>
              </div>
            </div>
            <Progress value={completionRate} className="h-3" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              معدل الإنجاز الإجمالي: {completionRate}%
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
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
                    <p className="text-xs text-muted-foreground">
                      {log.action_type} - {log.entity_type}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), 'HH:mm')}
                  </span>
                </motion.div>
              ))}
              {todayLogs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد نشاطات مسجلة اليوم
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
