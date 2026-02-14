import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, TrendingUp, TrendingDown, DollarSign, Droplets, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import Layout from '@/components/Layout';
import { projects, companyMetrics, formatCurrency, formatPercent } from '@/data/mockData';
import { Slider } from '@/components/ui/slider';

interface Scenario {
  adSpendChange: number;
  priceChange: number;
  occupancyChange: number;
  costReduction: number;
  newBranch: boolean;
  campaignIncrease: number;
}

const defaultScenario: Scenario = {
  adSpendChange: 0,
  priceChange: 0,
  occupancyChange: 0,
  costReduction: 0,
  newBranch: false,
  campaignIncrease: 0,
};

function simulateImpact(scenario: Scenario) {
  const baseRevenue = companyMetrics.totalRevenue;
  const baseExpenses = companyMetrics.totalExpenses;

  // Revenue impact
  const adRevenueBoost = baseRevenue * (scenario.adSpendChange / 100) * 0.6; // 60% conversion
  const priceRevenueBoost = baseRevenue * (scenario.priceChange / 100) * 0.85; // slight volume loss
  const occupancyBoost = baseRevenue * (scenario.occupancyChange / 100) * 0.4; // padel-weighted
  const campaignBoost = baseRevenue * (scenario.campaignIncrease / 100) * 0.35;
  const branchRevenue = scenario.newBranch ? baseRevenue * 0.3 : 0;

  const newRevenue = baseRevenue + adRevenueBoost + priceRevenueBoost + occupancyBoost + campaignBoost + branchRevenue;

  // Expense impact
  const adCostIncrease = baseExpenses * 0.05 * (scenario.adSpendChange / 100) * 1.0;
  const costSavings = baseExpenses * (scenario.costReduction / 100);
  const branchCost = scenario.newBranch ? baseExpenses * 0.4 : 0;
  const campaignCost = baseExpenses * 0.03 * (scenario.campaignIncrease / 100);

  const newExpenses = baseExpenses + adCostIncrease - costSavings + branchCost + campaignCost;

  const newProfit = newRevenue - newExpenses;
  const profitChange = newProfit - companyMetrics.netProfit;
  const newMargin = (newProfit / newRevenue) * 100;
  const newROI = ((newProfit / newExpenses) * 100);
  const newLiquidity = companyMetrics.liquidityRatio * (newProfit > 0 ? 1 + (profitChange / baseRevenue) * 0.5 : 1 - Math.abs(profitChange / baseRevenue) * 0.3);
  const newBurnRate = newExpenses / 12;
  const newRunway = newProfit > 0 ? Math.round((companyMetrics.netProfit + profitChange * 2) / newBurnRate * 12) : Math.max(1, Math.round(companyMetrics.runway * (newProfit / companyMetrics.netProfit)));

  return {
    revenue: newRevenue,
    expenses: newExpenses,
    profit: newProfit,
    profitChange,
    margin: newMargin,
    roi: newROI,
    liquidity: newLiquidity,
    burnRate: newBurnRate,
    runway: Math.max(1, newRunway),
    revenueChange: newRevenue - baseRevenue,
    expenseChange: newExpenses - baseExpenses,
  };
}

const SliderControl = ({ label, value, onChange, min, max, step, unit, color }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string; color: string;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-heading font-bold" style={{ color }}>
        {value > 0 ? '+' : ''}{value}{unit}
      </span>
    </div>
    <Slider value={[value]} onValueChange={v => onChange(v[0])} min={min} max={max} step={step} className="w-full" />
  </div>
);

const ImpactCard = ({ label, current, simulated, unit, inverse }: {
  label: string; current: number; simulated: number; unit?: string; inverse?: boolean;
}) => {
  const diff = simulated - current;
  const isPositive = inverse ? diff < 0 : diff > 0;
  return (
    <div className="bg-gradient-card rounded-xl border border-border p-4 shadow-card">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-heading font-bold text-foreground">
        {unit === 'ريال' ? formatCurrency(simulated) : `${simulated.toFixed(1)}${unit || ''}`}
      </p>
      {diff !== 0 && (
        <p className={`text-[10px] mt-1 flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {diff > 0 ? '+' : ''}{unit === 'ريال' ? formatCurrency(diff) : `${diff.toFixed(1)}${unit || ''}`}
        </p>
      )}
    </div>
  );
};

export default function FinancialLab() {
  const [scenario, setScenario] = useState<Scenario>({ ...defaultScenario });

  const impact = useMemo(() => simulateImpact(scenario), [scenario]);

  const comparisonData = [
    { name: 'الإيرادات', الحالي: companyMetrics.totalRevenue, المحاكاة: impact.revenue },
    { name: 'المصروفات', الحالي: companyMetrics.totalExpenses, المحاكاة: impact.expenses },
    { name: 'الربح', الحالي: companyMetrics.netProfit, المحاكاة: impact.profit },
  ];

  const monthlyProjection = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const factor = 1 + (impact.profitChange / companyMetrics.netProfit) * (month / 12) * 0.8;
    return {
      month: `شهر ${month}`,
      الحالي: Math.round(companyMetrics.netProfit / 12),
      المحاكاة: Math.round((companyMetrics.netProfit / 12) * factor),
    };
  });

  const reset = () => setScenario({ ...defaultScenario });

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

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <FlaskConical className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gradient-gold">🧮 مختبر النمذجة المالية</h1>
            <p className="text-sm text-muted-foreground">غيّر المتغيرات وشاهد التأثير الفوري على الربحية والسيولة</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading text-foreground">⚙️ متغيرات السيناريو</h3>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              <RotateCcw className="w-3 h-3" /> إعادة ضبط
            </button>
          </div>

          <SliderControl label="📣 تغيير ميزانية الإعلانات" value={scenario.adSpendChange} onChange={v => setScenario(s => ({ ...s, adSpendChange: v }))} min={-50} max={100} step={5} unit="%" color="hsl(43, 65%, 55%)" />
          <SliderControl label="💰 تغيير الأسعار" value={scenario.priceChange} onChange={v => setScenario(s => ({ ...s, priceChange: v }))} min={-20} max={30} step={1} unit="%" color="hsl(152, 60%, 45%)" />
          <SliderControl label="🏟 تغيير نسبة الإشغال" value={scenario.occupancyChange} onChange={v => setScenario(s => ({ ...s, occupancyChange: v }))} min={-30} max={50} step={5} unit="%" color="hsl(210, 70%, 55%)" />
          <SliderControl label="✂️ تخفيض التكاليف" value={scenario.costReduction} onChange={v => setScenario(s => ({ ...s, costReduction: v }))} min={0} max={30} step={1} unit="%" color="hsl(38, 92%, 50%)" />
          <SliderControl label="📈 زيادة الحملات" value={scenario.campaignIncrease} onChange={v => setScenario(s => ({ ...s, campaignIncrease: v }))} min={0} max={100} step={5} unit="%" color="hsl(280, 60%, 55%)" />

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">🏢 فتح فرع جديد</span>
            <button
              onClick={() => setScenario(s => ({ ...s, newBranch: !s.newBranch }))}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                scenario.newBranch
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'bg-secondary/30 border-border text-muted-foreground'
              }`}
            >
              {scenario.newBranch ? 'مفعّل ✓' : 'غير مفعّل'}
            </button>
          </div>
        </motion.div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Impact Cards */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-sm font-heading text-muted-foreground mb-3">📊 نتائج المحاكاة</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <ImpactCard label="الإيرادات المتوقعة" current={companyMetrics.totalRevenue} simulated={impact.revenue} unit="ريال" />
              <ImpactCard label="المصروفات المتوقعة" current={companyMetrics.totalExpenses} simulated={impact.expenses} unit="ريال" inverse />
              <ImpactCard label="صافي الربح" current={companyMetrics.netProfit} simulated={impact.profit} unit="ريال" />
              <ImpactCard label="هامش الربح" current={companyMetrics.grossMargin} simulated={impact.margin} unit="%" />
              <ImpactCard label="ROI" current={companyMetrics.roi} simulated={impact.roi} unit="%" />
              <ImpactCard label="نسبة السيولة" current={companyMetrics.liquidityRatio} simulated={impact.liquidity} unit="x" />
              <ImpactCard label="معدل الحرق/شهر" current={companyMetrics.burnRate} simulated={impact.burnRate} unit="ريال" inverse />
              <ImpactCard label="المدرج (أشهر)" current={companyMetrics.runway} simulated={impact.runway} unit=" شهر" />
            </div>
          </motion.div>

          {/* Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-card rounded-xl border border-border p-5 shadow-card"
          >
            <h3 className="text-sm font-heading text-muted-foreground mb-4">مقارنة: الوضع الحالي vs المحاكاة</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 25%, 18%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="الحالي" fill="hsl(222, 30%, 30%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="المحاكاة" fill="hsl(43, 65%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Monthly Projection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-card rounded-xl border border-border p-5 shadow-card"
          >
            <h3 className="text-sm font-heading text-muted-foreground mb-4">📈 توقع الربح الشهري (12 شهر)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 25%, 18%)" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="الحالي" stroke="hsl(222, 30%, 45%)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="المحاكاة" stroke="hsl(43, 65%, 55%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-card rounded-xl border border-border p-5 shadow-card"
          >
            <h3 className="text-sm font-heading text-muted-foreground mb-3">🎯 ملخص أثر القرار</h3>
            <div className="space-y-2 text-sm text-foreground">
              {impact.profitChange > 0 ? (
                <p className="text-success">✅ هذا السيناريو يزيد الربح بمقدار {formatCurrency(impact.profitChange)} ({((impact.profitChange / companyMetrics.netProfit) * 100).toFixed(1)}%)</p>
              ) : impact.profitChange < 0 ? (
                <p className="text-destructive">⚠️ هذا السيناريو يقلل الربح بمقدار {formatCurrency(Math.abs(impact.profitChange))} ({((Math.abs(impact.profitChange) / companyMetrics.netProfit) * 100).toFixed(1)}%)</p>
              ) : (
                <p className="text-muted-foreground">↔️ لا تغيير — عدّل المتغيرات لرؤية التأثير</p>
              )}
              {impact.revenueChange !== 0 && (
                <p className="text-muted-foreground text-xs">
                  الإيرادات {impact.revenueChange > 0 ? 'ترتفع' : 'تنخفض'} {formatCurrency(Math.abs(impact.revenueChange))} | المصروفات {impact.expenseChange > 0 ? 'ترتفع' : 'تنخفض'} {formatCurrency(Math.abs(impact.expenseChange))}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
