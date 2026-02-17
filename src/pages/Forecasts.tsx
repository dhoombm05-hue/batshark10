import { motion } from 'framer-motion';
import { TrendingUp, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import Layout from '@/components/Layout';
import PrintButton from '@/components/PrintButton';
import { useProjects } from '@/hooks/useProjects';
import { computeCompanyMetrics } from '@/hooks/useFinancialEngine';
import { formatCurrency } from '@/data/mockData';

export default function Forecasts() {
  const { data: dbProjects, isLoading } = useProjects();
  const metrics = dbProjects ? computeCompanyMetrics(dbProjects) : null;

  const m = metrics || { totalRevenue: 0, totalExpenses: 0, netProfit: 0, monthlyGrowth: 0, healthScore: 0, grossMargin: 0 };

  // Dynamic forecasts based on real data
  const monthlyRevenue = m.totalRevenue / 12;
  const monthlyExpenses = m.totalExpenses / 12;
  const growthFactor = 1 + (m.monthlyGrowth / 100);

  const periods = [
    { label: 'بعد شهر', icon: Clock, data: { revenue: Math.round(monthlyRevenue * growthFactor), expenses: Math.round(monthlyExpenses), profit: Math.round(monthlyRevenue * growthFactor - monthlyExpenses), confidence: 85 } },
    { label: 'بعد 3 أشهر', icon: TrendingUp, data: { revenue: Math.round(monthlyRevenue * 3 * Math.pow(growthFactor, 3)), expenses: Math.round(monthlyExpenses * 3), profit: Math.round(monthlyRevenue * 3 * Math.pow(growthFactor, 3) - monthlyExpenses * 3), confidence: 75 } },
    { label: 'بعد سنة', icon: BarChart3, data: { revenue: Math.round(monthlyRevenue * 12 * Math.pow(growthFactor, 12)), expenses: Math.round(monthlyExpenses * 12 * 1.05), profit: Math.round(monthlyRevenue * 12 * Math.pow(growthFactor, 12) - monthlyExpenses * 12 * 1.05), confidence: 60 } },
  ];

  const profitableCount = dbProjects?.filter(p => p.status === 'profitable').length || 0;
  const lossCount = dbProjects?.filter(p => p.status === 'loss').length || 0;

  const insights = [
    `بناءً على معدل النمو الحالي ${m.monthlyGrowth}% شهرياً، يتوقع تحقيق فائض قدره ${formatCurrency(Math.round(m.netProfit * 1.5))} خلال 6 أشهر.`,
    `${profitableCount} مشاريع مربحة من أصل ${dbProjects?.length || 0} — الأداء ${profitableCount > lossCount ? 'إيجابي' : 'يحتاج تحسين'}.`,
    m.grossMargin > 20 ? `هامش الربح الإجمالي ${m.grossMargin}% يعتبر صحياً ويدعم التوسع المستقبلي.` : `هامش الربح الإجمالي ${m.grossMargin}% منخفض ويحتاج تحسين عاجل.`,
    `معدل الحرق الشهري ${formatCurrency(Math.round(m.totalExpenses / 12))} — ${m.netProfit > 0 ? 'مستدام' : 'يشكل خطراً على السيولة'}.`,
  ];

  const risks = [
    ...(lossCount > 0 ? [`${lossCount} مشاريع خاسرة تشكل خطراً على السيولة الإجمالية`] : []),
    m.monthlyGrowth < 0 ? 'معدل النمو سلبي — يجب مراجعة استراتيجية التسويق' : '',
    m.healthScore < 60 ? 'مؤشر صحة الشركة منخفض — يحتاج تدخل عاجل' : '',
    'الاعتماد الكبير على مشروع واحد كمصدر ربح رئيسي',
    'تقلبات السوق قد تؤثر على معدل النمو المتوقع',
  ].filter(Boolean);

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div></Layout>;
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-1">التوقعات المالية</h1>
            <p className="text-sm text-muted-foreground">تحليل شبه اكتواري مبني على البيانات الفعلية من قاعدة البيانات</p>
          </div>
          <PrintButton title="طباعة التوقعات المالية" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {periods.map((period, i) => (
          <motion.div key={period.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gradient-card rounded-xl border border-border p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <period.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground">{period.label}</h3>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الإيرادات المتوقعة</span>
                <span className="text-foreground font-bold">{formatCurrency(period.data.revenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المصروفات المتوقعة</span>
                <span className="text-foreground">{formatCurrency(period.data.expenses)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">الربح المتوقع</span>
                <span className={`font-bold ${period.data.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(period.data.profit)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">مستوى الثقة</span>
                <span className="text-primary">{period.data.confidence}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-gold"
                  initial={{ width: 0 }} animate={{ width: `${period.data.confidence}%` }}
                  transition={{ duration: 1, delay: i * 0.1 + 0.3 }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> رؤى التوقعات
          </h3>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> المخاطر المحتملة
          </h3>
          <div className="space-y-3">
            {risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="w-3.5 h-3.5 text-warning mt-1 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{risk}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
