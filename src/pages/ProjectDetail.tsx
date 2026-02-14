import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, DollarSign, TrendingUp, Users, Megaphone, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { projects, formatCurrency, formatPercent } from '@/data/mockData';

const COLORS = ['hsl(43,65%,55%)', 'hsl(222,30%,35%)', 'hsl(152,60%,45%)', 'hsl(0,72%,51%)', 'hsl(200,70%,50%)', 'hsl(280,60%,55%)'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-elevated">
      <p className="text-sm font-heading text-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span style={{ color: p.color }}>●</span> {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function ProjectDetail() {
  const { id } = useParams();
  const project = projects.find(p => p.id === id);
  if (!project) return <Layout><p className="text-foreground">المشروع غير موجود</p></Layout>;

  // Calculate break-even month
  let cumulative = 0;
  const breakEvenMonth = project.monthlyData.find(m => {
    cumulative += m.profit;
    return cumulative > 0;
  });

  return (
    <Layout>
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowRight className="w-4 h-4" />
        العودة للمشاريع
      </Link>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.description}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="إجمالي الإيرادات" value={formatCurrency(project.totalRevenue)} icon={DollarSign} delay={0} />
        <StatCard title="صافي الربح" value={formatCurrency(project.netProfit)} icon={TrendingUp}
          change={formatPercent(project.growthRate)}
          changeType={project.growthRate >= 0 ? 'positive' : 'negative'} delay={0.1} />
        <StatCard title="العملاء" value={project.clientCount.toLocaleString('ar-SA')} icon={Users} delay={0.2} />
        <StatCard title="الحملات" value={`${project.campaignCount} حملة`} icon={Megaphone} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue vs Expenses */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4">الإيرادات مقابل المصروفات</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={project.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,25%,18%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="الإيرادات" fill="hsl(43,65%,55%)" radius={[3,3,0,0]} />
              <Bar dataKey="expenses" name="المصروفات" fill="hsl(222,30%,30%)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4">توزيع المصروفات</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={project.expenseBreakdown} dataKey="amount" nameKey="category"
                cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'hsl(215,15%,55%)' }}
              >
                {project.expenseBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Profit Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-gradient-card rounded-xl border border-border p-5 shadow-card mb-8">
        <h3 className="text-sm font-heading text-muted-foreground mb-4">اتجاه الأرباح الشهرية</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={project.monthlyData}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={project.netProfit >= 0 ? 'hsl(152,60%,45%)' : 'hsl(0,72%,51%)'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={project.netProfit >= 0 ? 'hsl(152,60%,45%)' : 'hsl(0,72%,51%)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,25%,18%)" />
            <XAxis dataKey="month" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="profit" name="الربح"
              stroke={project.netProfit >= 0 ? 'hsl(152,60%,45%)' : 'hsl(0,72%,51%)'}
              fill="url(#profitGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Analysis & Break-even */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> تحليل الأداء
          </h3>
          <div className="space-y-3">
            {project.analysis.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4">نقطة التعادل</h3>
          {breakEvenMonth ? (
            <div className="text-center py-6">
              <p className="text-3xl font-heading font-bold text-primary mb-2">{breakEvenMonth.month}</p>
              <p className="text-sm text-muted-foreground">تم الوصول لنقطة التعادل</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-destructive">لم يتم الوصول لنقطة التعادل بعد</p>
            </div>
          )}
          {project.occupancyRate && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">نسبة الإشغال</span>
                <span className="text-primary font-bold">{project.occupancyRate}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${project.occupancyRate}%` }}
                  transition={{ duration: 1, delay: 1 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
