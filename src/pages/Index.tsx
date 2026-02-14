import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import HealthScore from '@/components/HealthScore';
import { projects, companyMetrics, formatCurrency, formatPercent } from '@/data/mockData';

const allMonthlyData = projects[0].monthlyData.map((item, i) => ({
  month: item.month,
  البادل: projects[0].monthlyData[i].profit,
  الشاشات: projects[1].monthlyData[i].profit,
  Umbrex: projects[2].monthlyData[i].profit,
  total: projects[0].monthlyData[i].profit + projects[1].monthlyData[i].profit + projects[2].monthlyData[i].profit,
}));

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

export default function Dashboard() {
  return (
    <Layout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gradient-gold mb-2">
          BatShark Economy
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base">
          قيادة مالية مبنية على البيانات، وتحليل استراتيجي يقود النمو المستدام
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(companyMetrics.totalRevenue)}
          icon={DollarSign}
          change={formatPercent(companyMetrics.monthlyGrowth)}
          changeType="positive"
          delay={0}
        />
        <StatCard
          title="إجمالي المصروفات"
          value={formatCurrency(companyMetrics.totalExpenses)}
          icon={TrendingDown}
          delay={0.1}
        />
        <StatCard
          title="صافي الربح"
          value={formatCurrency(companyMetrics.netProfit)}
          icon={TrendingUp}
          change={companyMetrics.netProfit > 0 ? 'ربح' : 'خسارة'}
          changeType={companyMetrics.netProfit > 0 ? 'positive' : 'negative'}
          delay={0.2}
        />
        <StatCard
          title="نسبة النمو الشهرية"
          value={formatPercent(companyMetrics.monthlyGrowth)}
          icon={BarChart3}
          change="مستقر"
          changeType="positive"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-gradient-card rounded-xl border border-border p-5 shadow-card"
        >
          <h3 className="text-sm font-heading text-muted-foreground mb-4">أرباح المشاريع الشهرية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={allMonthlyData}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43, 65%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(43, 65%, 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 60%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 60%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 25%, 18%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="البادل" stroke="hsl(43, 65%, 55%)" fill="url(#goldGrad)" strokeWidth={2} name="البادل" />
              <Area type="monotone" dataKey="Umbrex" stroke="hsl(152, 60%, 45%)" fill="url(#greenGrad)" strokeWidth={2} name="Umbrex" />
              <Area type="monotone" dataKey="الشاشات" stroke="hsl(0, 72%, 51%)" fill="none" strokeWidth={2} strokeDasharray="4 4" name="الشاشات" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <HealthScore score={companyMetrics.healthScore} />

          {/* Quick Project Status */}
          <div className="mt-4 bg-gradient-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-heading text-muted-foreground mb-3">حالة المشاريع</h3>
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{project.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    project.status === 'profitable' ? 'bg-success/15 text-success' :
                    project.status === 'loss' ? 'bg-destructive/15 text-destructive' :
                    'bg-warning/15 text-warning'
                  }`}>
                    {project.status === 'profitable' ? 'مربح' : project.status === 'loss' ? 'خسارة' : 'تعادل'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Revenue vs Expenses Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-card rounded-xl border border-border p-5 shadow-card"
      >
        <h3 className="text-sm font-heading text-muted-foreground mb-4">مقارنة الإيرادات والمصروفات حسب المشروع</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={projects.map(p => ({ name: p.name, الإيرادات: p.totalRevenue, المصروفات: p.totalExpenses }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 25%, 18%)" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(215, 15%, 55%)' }} />
            <Bar dataKey="الإيرادات" fill="hsl(43, 65%, 55%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="المصروفات" fill="hsl(222, 30%, 30%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </Layout>
  );
}
