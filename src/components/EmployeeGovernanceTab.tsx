import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, ShieldCheck, ShieldAlert, Zap, Clock,
  BarChart3, AlertTriangle, CheckCircle, XCircle, FileText, Brain, ArrowUpRight,
  ArrowDownRight, Minus, Eye, Pencil, Plus, Trash2, RefreshCw, Target, Shield,
  Gauge, CalendarDays
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { useActivityImpactLogs, type ActivityImpactEntry } from '@/hooks/useActivityImpact';
import { usePerformanceScoring } from '@/hooks/usePerformanceScoring';
import { Badge } from '@/components/ui/badge';

interface Props {
  employeeUserId?: string;
  employeeName: string;
}

function getVerdict(score: number): { label: string; color: string; emoji: string; border: string } {
  if (score >= 85) return { label: 'أداء استثنائي — إيجابي جداً للشركة', color: 'text-emerald-400', emoji: '🏆', border: 'border-emerald-500/30' };
  if (score >= 70) return { label: 'أداء جيد — مساهم إيجابي', color: 'text-green-400', emoji: '✅', border: 'border-green-500/30' };
  if (score >= 50) return { label: 'أداء متوسط — يحتاج تطوير', color: 'text-amber-400', emoji: '⚠️', border: 'border-amber-500/30' };
  if (score >= 30) return { label: 'أداء ضعيف — سلبي على الشركة', color: 'text-orange-400', emoji: '🔻', border: 'border-orange-500/30' };
  return { label: 'أداء خطير — تأثير سلبي كبير', color: 'text-red-400', emoji: '🚨', border: 'border-red-500/30' };
}

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? 'hsl(152 60% 45%)' : score >= 50 ? 'hsl(43 90% 55%)' : 'hsl(0 72% 51%)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={6} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-heading font-black text-foreground">{score}</span>
        <span className="text-[8px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function MiniScore({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-secondary/50">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: value >= 70 ? 'hsl(152 60% 45%)' : value >= 50 ? 'hsl(43 90% 55%)' : 'hsl(0 72% 51%)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(value, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs font-bold text-foreground w-8 text-left">{value}%</span>
        </div>
      </div>
    </div>
  );
}

const ACTION_ICONS: Record<string, any> = {
  view: Eye, update: Pencil, create: Plus, delete: Trash2, override: RefreshCw,
};
const ACTION_LABELS: Record<string, string> = {
  view: 'عرض', update: 'تعديل', create: 'إضافة', delete: 'حذف', override: 'تجاوز يدوي',
};
const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
};

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all';
const PERIOD_LABELS: Record<TimePeriod, { label: string; icon: any }> = {
  daily: { label: 'اليوم', icon: Clock },
  weekly: { label: 'الأسبوع', icon: CalendarDays },
  monthly: { label: 'الشهر', icon: CalendarDays },
  all: { label: 'الكل', icon: BarChart3 },
};

const chartTooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 10,
  fontSize: 11,
  color: 'hsl(var(--foreground))',
};

export default function EmployeeGovernanceTab({ employeeUserId, employeeName }: Props) {
  const { data: allLogs = [] } = useActivityImpactLogs({ userId: employeeUserId });
  const { data: allScores = [] } = usePerformanceScoring();
  const [period, setPeriod] = useState<TimePeriod>('monthly');

  const userScore = allScores.find(s => s.userId === employeeUserId);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    if (period === 'daily') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return allLogs.filter(l => new Date(l.created_at) >= start);
    }
    if (period === 'weekly') return allLogs.filter(l => new Date(l.created_at) >= new Date(now.getTime() - 7 * 86400000));
    if (period === 'monthly') return allLogs.filter(l => new Date(l.created_at) >= new Date(now.getTime() - 30 * 86400000));
    return allLogs;
  }, [allLogs, period]);

  const analytics = useMemo(() => {
    if (!filteredLogs.length) return null;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    const weeklyLogs = allLogs.filter(l => new Date(l.created_at) >= weekAgo);
    const monthlyLogs = allLogs.filter(l => new Date(l.created_at) >= monthAgo);
    const todayLogs = allLogs.filter(l => {
      const d = new Date(l.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    });

    const logs = filteredLogs;
    const actionCounts: Record<string, number> = {};
    const sectionCounts: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};
    const hourMap: Record<number, number> = {};
    let totalProfitImpact = 0, totalLiquidityImpact = 0, totalGrowthImpact = 0;
    let positiveActions = 0, negativeActions = 0, neutralActions = 0;
    let overrideCount = 0, criticalCount = 0, highRiskCount = 0;

    for (const log of logs) {
      actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
      if (log.section) sectionCounts[log.section] = (sectionCounts[log.section] || 0) + 1;
      entityCounts[log.entity_type] = (entityCounts[log.entity_type] || 0) + 1;
      const day = new Date(log.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
      dailyMap[day] = (dailyMap[day] || 0) + 1;
      const hour = new Date(log.created_at).getHours();
      hourMap[hour] = (hourMap[hour] || 0) + 1;
      totalProfitImpact += log.impact_on_net_profit;
      totalLiquidityImpact += log.impact_on_liquidity;
      totalGrowthImpact += log.impact_on_growth;
      if (log.impact_on_net_profit > 0) positiveActions++;
      else if (log.impact_on_net_profit < 0) negativeActions++;
      else neutralActions++;
      if (log.is_manual_override) overrideCount++;
      if (log.risk_level === 'critical') criticalCount++;
      if (log.risk_level === 'high') highRiskCount++;
    }

    const dailyData = Object.entries(dailyMap).slice(-14).map(([day, count]) => ({ day, count }));
    const actionData = Object.entries(actionCounts).map(([type, count]) => ({ type: ACTION_LABELS[type] || type, count }));
    const impactData = [
      { name: 'إيجابي', value: positiveActions, fill: 'hsl(152 60% 45%)' },
      { name: 'سلبي', value: negativeActions, fill: 'hsl(0 72% 51%)' },
      { name: 'محايد', value: neutralActions, fill: 'hsl(var(--muted-foreground))' },
    ].filter(d => d.value > 0);

    const productivityScore = Math.min(Math.round(
      ((actionCounts['create'] || 0) * 3 + (actionCounts['update'] || 0) * 2 +
       (actionCounts['view'] || 0) * 0.5 - overrideCount * 1.5 - criticalCount * 5)
       / Math.max(logs.length, 1) * 25 + 50
    ), 100);

    const qualityScore = Math.max(0, Math.min(100,
      85 - criticalCount * 10 - highRiskCount * 3 + (positiveActions / Math.max(logs.length, 1)) * 20
    ));

    const financialScore = Math.min(Math.round((positiveActions / Math.max(positiveActions + negativeActions, 1)) * 100), 100);
    const consistencyScore = Math.min(Math.round(Object.keys(dailyMap).length / 30 * 100), 100);
    const diversityScore = Math.min(Math.round(Object.keys(entityCounts).length / 8 * 100), 100);
    const safetyScore = Math.max(0, 100 - criticalCount * 15 - highRiskCount * 5);

    const governanceRadar = [
      { metric: 'الإنتاجية', value: Math.min(productivityScore, 100) },
      { metric: 'الجودة', value: Math.round(qualityScore) },
      { metric: 'الأثر المالي', value: financialScore },
      { metric: 'الانتظام', value: consistencyScore },
      { metric: 'التنوع', value: diversityScore },
      { metric: 'الأمان', value: safetyScore },
    ];

    const governanceScore = Math.round(governanceRadar.reduce((s, r) => s + r.value, 0) / governanceRadar.length);
    const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];

    return {
      total: logs.length, today: todayLogs.length, weekly: weeklyLogs.length, monthly: monthlyLogs.length,
      actionCounts, dailyData, actionData, impactData, governanceRadar,
      totalProfitImpact, totalLiquidityImpact, totalGrowthImpact,
      positiveActions, negativeActions, neutralActions,
      overrideCount, criticalCount, highRiskCount,
      productivityScore, qualityScore, financialScore, consistencyScore, diversityScore, safetyScore,
      governanceScore,
      peakHour: peakHour ? `${peakHour[0]}:00` : '--',
      activeDays: Object.keys(dailyMap).length,
    };
  }, [filteredLogs, allLogs]);

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ShieldCheck className="w-16 h-16 mb-4 opacity-15" />
        <p className="text-sm">لا توجد بيانات نشاط مسجلة لهذا الموظف</p>
        <p className="text-xs mt-1 opacity-60">سيتم عرض التحليل عند بدء الموظف بالعمل في النظام</p>
      </div>
    );
  }

  const verdict = getVerdict(analytics.governanceScore);
  const recentLogs = filteredLogs.slice(0, 25);

  const anim = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.4 } });

  return (
    <div className="space-y-5">

      {/* ═══════════ ROW 1: Period + Score + Summary ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
        {/* Main score card */}
        <motion.div {...anim(0)} className={`bg-card rounded-2xl border ${verdict.border} p-5`}>
          <div className="flex items-center gap-5 flex-wrap">
            <ScoreRing score={analytics.governanceScore} size={110} />
            <div className="flex-1 min-w-[180px]">
              <p className="text-xs text-muted-foreground mb-1">مؤشر الحوكمة الشامل — {PERIOD_LABELS[period].label}</p>
              <h3 className="text-base font-heading font-bold text-foreground mb-1">
                {verdict.emoji} {verdict.label}
              </h3>
              <div className="flex gap-5 mt-3">
                {(Object.keys(PERIOD_LABELS) as TimePeriod[]).map(p => {
                  const PIcon = PERIOD_LABELS[p].icon;
                  return (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                        period === p
                          ? 'bg-primary/10 text-primary border-primary/25'
                          : 'bg-transparent text-muted-foreground border-transparent hover:bg-secondary/40'
                      }`}
                    >
                      <PIcon className="w-3 h-3" />
                      {PERIOD_LABELS[p].label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick stats strip */}
        <motion.div {...anim(1)} className="flex flex-row lg:flex-col gap-3 justify-center">
          {[
            { label: 'اليوم', val: analytics.today, active: period === 'daily' },
            { label: 'الأسبوع', val: analytics.weekly, active: period === 'weekly' },
            { label: 'الشهر', val: analytics.monthly, active: period === 'monthly' },
          ].map(s => (
            <div key={s.label} className={`text-center px-4 py-2.5 rounded-xl border ${s.active ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
              <p className="text-lg font-heading font-bold text-foreground">{s.val}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
          {userScore && (
            <div className="text-center px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5">
              <p className="text-lg font-heading font-bold text-primary">#{userScore.rank}</p>
              <p className="text-[9px] text-muted-foreground">الترتيب</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══════════ ROW 2: 6 Governance Axes ═══════════ */}
      <motion.div {...anim(2)}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniScore label="الإنتاجية" value={analytics.productivityScore} icon={Zap} color="bg-amber-500/10 text-amber-400" />
          <MiniScore label="الجودة" value={Math.round(analytics.qualityScore)} icon={Target} color="bg-blue-500/10 text-blue-400" />
          <MiniScore label="الأثر المالي" value={analytics.financialScore} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" />
          <MiniScore label="الانتظام" value={analytics.consistencyScore} icon={CalendarDays} color="bg-purple-500/10 text-purple-400" />
          <MiniScore label="التنوع" value={analytics.diversityScore} icon={Brain} color="bg-teal-500/10 text-teal-400" />
          <MiniScore label="الأمان" value={analytics.safetyScore} icon={Shield} color="bg-red-500/10 text-red-400" />
        </div>
      </motion.div>

      {/* ═══════════ ROW 3: 4 KPI Cards ═══════════ */}
      <motion.div {...anim(3)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: TrendingUp, label: 'الأثر على الأرباح',
              value: `${analytics.totalProfitImpact >= 0 ? '+' : ''}${analytics.totalProfitImpact.toLocaleString()} ر.س`,
              color: analytics.totalProfitImpact >= 0 ? 'text-emerald-400' : 'text-red-400',
              bg: analytics.totalProfitImpact >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
            },
            {
              icon: AlertTriangle, label: 'تنبيهات حرجة',
              value: `${analytics.criticalCount + analytics.highRiskCount}`,
              color: analytics.criticalCount > 0 ? 'text-red-400' : 'text-emerald-400',
              bg: analytics.criticalCount > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
            },
            {
              icon: RefreshCw, label: 'تجاوزات يدوية',
              value: `${analytics.overrideCount}`,
              color: analytics.overrideCount > 3 ? 'text-amber-400' : 'text-muted-foreground',
              bg: 'bg-amber-500/10',
            },
            {
              icon: Clock, label: 'ذروة النشاط',
              value: analytics.peakHour,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10',
            },
          ].map((card, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
                  <card.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] text-muted-foreground">{card.label}</span>
              </div>
              <p className={`text-lg font-heading font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════ ROW 4: Radar + Daily Activity ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...anim(4)} className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-xs font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" /> خريطة الحوكمة
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={analytics.governanceRadar}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...anim(5)} className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-xs font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-section-employees" /> النشاط اليومي
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={analytics.dailyData}>
              <defs>
                <linearGradient id="govActGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="count" name="العمليات" stroke="hsl(var(--primary))" fill="url(#govActGrad)" strokeWidth={2} dot={{ r: 2.5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ═══════════ ROW 5: Impact Pie + Action Bar + Risk Summary ═══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Impact Donut */}
        <motion.div {...anim(6)} className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-xs font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> تصنيف الأثر
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={analytics.impactData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={4} strokeWidth={0}>
                {analytics.impactData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-1">
            {analytics.impactData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                <span className="text-[10px] text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Types */}
        <motion.div {...anim(7)} className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-xs font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-section-forecast" /> أنواع العمليات
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.actionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis type="category" dataKey="type" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={55} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" name="العدد" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Risk Summary */}
        <motion.div {...anim(8)} className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-xs font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" /> ملخص المخاطر
          </h4>
          <div className="space-y-2.5">
            {[
              { label: 'عمليات حرجة', count: analytics.criticalCount, color: 'text-red-400', icon: XCircle, bg: 'bg-red-500/8' },
              { label: 'عالية الخطورة', count: analytics.highRiskCount, color: 'text-orange-400', icon: AlertTriangle, bg: 'bg-orange-500/8' },
              { label: 'تجاوزات يدوية', count: analytics.overrideCount, color: 'text-amber-400', icon: RefreshCw, bg: 'bg-amber-500/8' },
              { label: 'إيجابية', count: analytics.positiveActions, color: 'text-emerald-400', icon: CheckCircle, bg: 'bg-emerald-500/8' },
              { label: 'سلبية', count: analytics.negativeActions, color: 'text-red-400', icon: TrendingDown, bg: 'bg-red-500/8' },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-2.5 p-2 rounded-lg ${item.bg} border border-border`}>
                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span className="text-[11px] text-muted-foreground flex-1">{item.label}</span>
                <span className={`text-sm font-bold font-heading ${item.color}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ═══════════ ROW 6: Activity Log ═══════════ */}
      <motion.div {...anim(9)} className="bg-card rounded-xl border border-border p-5">
        <h4 className="text-xs font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-section-ai" /> سجل العمليات — آخر {recentLogs.length} عملية
        </h4>
        <div className="space-y-1 max-h-[420px] overflow-y-auto">
          {recentLogs.map((log) => {
            const ActionIcon = ACTION_ICONS[log.action_type] || Eye;
            const riskClass = RISK_COLORS[log.risk_level] || RISK_COLORS.low;
            return (
              <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/15 transition-colors group">
                <div className={`p-1.5 rounded-lg ${riskClass}`}>
                  <ActionIcon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-foreground">
                      {ACTION_LABELS[log.action_type] || log.action_type}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">{log.entity_name || log.entity_type}</span>
                  </div>
                  {(log.old_value || log.new_value) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {log.old_value && <span className="text-[9px] text-red-400/60 line-through">{log.old_value}</span>}
                      {log.new_value && <span className="text-[9px] text-emerald-400/80">{log.new_value}</span>}
                    </div>
                  )}
                </div>
                {log.impact_on_net_profit !== 0 && (
                  <span className={`text-[10px] font-bold shrink-0 ${log.impact_on_net_profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {log.impact_on_net_profit > 0 ? '+' : ''}{log.impact_on_net_profit.toLocaleString()} ر.س
                  </span>
                )}
                <span className="text-[9px] text-muted-foreground shrink-0 w-16 text-left">
                  {new Date(log.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                </span>
                <Badge variant="outline" className={`text-[8px] shrink-0 border ${riskClass} px-1.5`}>
                  {log.risk_level === 'low' ? 'آمن' : log.risk_level === 'medium' ? 'متوسط' : log.risk_level === 'high' ? 'عالي' : 'حرج'}
                </Badge>
              </div>
            );
          })}
          {recentLogs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">لا توجد عمليات في هذه الفترة</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
