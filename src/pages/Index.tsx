import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Percent, Activity, Gauge, Wallet, PiggyBank, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, RadialBarChart, RadialBar } from 'recharts';
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

const IndicatorCard = ({ label, value, unit, color, delay }: { label: string; value: string | number; unit?: string; color: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="bg-gradient-card rounded-xl border border-border p-4 shadow-card text-center"
  >
    <p className="text-[11px] text-muted-foreground mb-1 font-heading">{label}</p>
    <p className="text-xl font-heading font-bold" style={{ color }}>{value}<span className="text-xs text-muted-foreground mr-1">{unit}</span></p>
  </motion.div>
);

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
          نظام تشغيل مالي استراتيجي — قيادة مبنية على البيانات والتحليل
        </p>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Advanced Financial Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-6"
      >
        <h3 className="text-sm font-heading text-muted-foreground mb-3">📊 المؤشرات المالية المتقدمة</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <IndicatorCard label="العائد على الاستثمار (ROI)" value={`${companyMetrics.roi}%`} color="hsl(152, 60%, 45%)" delay={0.4} />
          <IndicatorCard label="EBITDA" value={formatCurrency(companyMetrics.ebitda)} color="hsl(43, 65%, 55%)" delay={0.45} />
          <IndicatorCard label="معدل الحرق الشهري" value={formatCurrency(companyMetrics.burnRate)} color="hsl(0, 72%, 51%)" delay={0.5} />
          <IndicatorCard label="المدرج (Runway)" value={companyMetrics.runway} unit=" شهر" color="hsl(210, 70%, 55%)" delay={0.55} />
          <IndicatorCard label="نسبة السيولة" value={companyMetrics.liquidityRatio} unit="x" color="hsl(152, 60%, 45%)" delay={0.6} />
          <IndicatorCard label="هامش الربح الإجمالي" value={`${companyMetrics.grossMargin}%`} color="hsl(43, 65%, 55%)" delay={0.65} />
          <IndicatorCard label="هامش الربح التشغيلي" value={`${companyMetrics.operatingMargin}%`} color="hsl(38, 92%, 50%)" delay={0.7} />
          <IndicatorCard label="كفاءة التكلفة" value={`${(companyMetrics.costEfficiencyIndex * 100).toFixed(0)}%`} color="hsl(152, 60%, 45%)" delay={0.75} />
          <IndicatorCard label="الدين إلى الملكية" value={companyMetrics.debtToEquity} unit="x" color="hsl(210, 70%, 55%)" delay={0.8} />
          <IndicatorCard label="مؤشر الأداء العام" value={`${companyMetrics.performanceIndex}%`} color="hsl(43, 65%, 55%)" delay={0.85} />
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
          transition={{ delay: 0.6 }}
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

          {/* Board Members */}
          <div className="mt-4 bg-gradient-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-heading text-muted-foreground mb-3">مجلس الإدارة التنفيذي</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs"><span>👑</span><span className="text-foreground">عبدالرحمن بن بندر</span><span className="text-muted-foreground">— CEO</span></div>
              <div className="flex items-center gap-2 text-xs"><span>⚙️</span><span className="text-foreground">محمد بن تركي</span><span className="text-muted-foreground">— COO</span></div>
              <div className="flex items-center gap-2 text-xs"><span>📊</span><span className="text-foreground">فهد سلطان</span><span className="text-muted-foreground">— استراتيجي</span></div>
              <div className="flex items-center gap-2 text-xs"><span>📣</span><span className="text-foreground">سعد سلطان</span><span className="text-muted-foreground">— تسويق</span></div>
              <div className="flex items-center gap-2 text-xs"><span>💻</span><span className="text-foreground">نايف المطيري</span><span className="text-muted-foreground">— تقنية</span></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Revenue vs Expenses Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
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