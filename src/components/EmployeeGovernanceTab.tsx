import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, ShieldCheck, ShieldAlert, Zap, Clock,
  BarChart3, AlertTriangle, CheckCircle, XCircle, FileText, Brain, ArrowUpRight,
  ArrowDownRight, Minus, Eye, Pencil, Plus, Trash2, RefreshCw
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

// Governance verdict
function getVerdict(score: number): { label: string; color: string; emoji: string; bg: string } {
  if (score >= 85) return { label: 'أداء استثنائي — إيجابي جداً للشركة', color: 'text-emerald-400', emoji: '🏆', bg: 'from-emerald-500/20 to-emerald-900/10' };
  if (score >= 70) return { label: 'أداء جيد — مساهم إيجابي', color: 'text-green-400', emoji: '✅', bg: 'from-green-500/15 to-green-900/5' };
  if (score >= 50) return { label: 'أداء متوسط — يحتاج تطوير', color: 'text-amber-400', emoji: '⚠️', bg: 'from-amber-500/15 to-amber-900/5' };
  if (score >= 30) return { label: 'أداء ضعيف — سلبي على الشركة', color: 'text-orange-400', emoji: '🔻', bg: 'from-orange-500/15 to-orange-900/5' };
  return { label: 'أداء خطير — تأثير سلبي كبير', color: 'text-red-400', emoji: '🚨', bg: 'from-red-500/20 to-red-900/10' };
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const verdict = getVerdict(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(220 15% 20%)" strokeWidth={8} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={score >= 70 ? 'hsl(152 60% 45%)' : score >= 50 ? 'hsl(43 90% 55%)' : 'hsl(0 72% 51%)'}
          strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-heading font-black text-foreground">{score}</span>
        <span className="text-[9px] text-muted-foreground">من 100</span>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, trend, color }: {
  icon: any; label: string; value: string | number; sub?: string; trend?: 'up' | 'down' | 'neutral'; color: string;
}) {
  return (
    <div className="bg-card/50 rounded-xl border border-border p-3.5 hover:border-primary/20 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[11px] text-muted-foreground">{label}</span>
        {trend && (
          <span className="mr-auto">
            {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
            {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
            {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
          </span>
        )}
      </div>
      <p className="text-lg font-heading font-bold text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
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

export default function EmployeeGovernanceTab({ employeeUserId, employeeName }: Props) {
  const { data: allLogs = [] } = useActivityImpactLogs({ userId: employeeUserId });
  const { data: allScores = [] } = usePerformanceScoring();

  const userScore = allScores.find(s => s.userId === employeeUserId);

  const analytics = useMemo(() => {
    if (!allLogs.length) return null;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const weeklyLogs = allLogs.filter(l => new Date(l.created_at) >= weekAgo);
    const monthlyLogs = allLogs.filter(l => new Date(l.created_at) >= monthAgo);

    // Action breakdown
    const actionCounts: Record<string, number> = {};
    const sectionCounts: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};
    const hourMap: Record<number, number> = {};
    let totalProfitImpact = 0;
    let totalLiquidityImpact = 0;
    let totalGrowthImpact = 0;
    let positiveActions = 0;
    let negativeActions = 0;
    let neutralActions = 0;
    let overrideCount = 0;
    let criticalCount = 0;
    let highRiskCount = 0;

    for (const log of allLogs) {
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

    // Daily activity chart
    const dailyData = Object.entries(dailyMap).slice(-14).map(([day, count]) => ({ day, count }));

    // Action type chart
    const actionData = Object.entries(actionCounts).map(([type, count]) => ({
      type: ACTION_LABELS[type] || type, count,
    }));

    // Section radar
    const sectionData = Object.entries(sectionCounts).slice(0, 8).map(([name, count]) => ({ name, count }));

    // Impact pie
    const impactData = [
      { name: 'إيجابي', value: positiveActions, fill: 'hsl(152 60% 45%)' },
      { name: 'سلبي', value: negativeActions, fill: 'hsl(0 72% 51%)' },
      { name: 'محايد', value: neutralActions, fill: 'hsl(220 15% 45%)' },
    ].filter(d => d.value > 0);

    // Productivity = weighted score
    const productivityScore = Math.min(Math.round(
      ((actionCounts['create'] || 0) * 3 +
       (actionCounts['update'] || 0) * 2 +
       (actionCounts['view'] || 0) * 0.5 -
       overrideCount * 1.5 -
       criticalCount * 5) / Math.max(allLogs.length, 1) * 25 + 50
    ), 100);

    // Quality score
    const qualityScore = Math.max(0, Math.min(100,
      85 - criticalCount * 10 - highRiskCount * 3 + (positiveActions / Math.max(allLogs.length, 1)) * 20
    ));

    // Governance radar
    const governanceRadar = [
      { metric: 'الإنتاجية', value: Math.min(productivityScore, 100) },
      { metric: 'الجودة', value: Math.round(qualityScore) },
      { metric: 'الأثر المالي', value: Math.min(Math.round((positiveActions / Math.max(positiveActions + negativeActions, 1)) * 100), 100) },
      { metric: 'الانتظام', value: Math.min(Math.round(Object.keys(dailyMap).length / 30 * 100), 100) },
      { metric: 'التنوع', value: Math.min(Math.round(Object.keys(entityCounts).length / 8 * 100), 100) },
      { metric: 'الأمان', value: Math.max(0, 100 - criticalCount * 15 - highRiskCount * 5) },
    ];

    // Final governance score
    const governanceScore = Math.round(governanceRadar.reduce((s, r) => s + r.value, 0) / governanceRadar.length);

    // Peak hours
    const peakHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];

    return {
      total: allLogs.length,
      weekly: weeklyLogs.length,
      monthly: monthlyLogs.length,
      actionCounts, sectionCounts, entityCounts,
      dailyData, actionData, sectionData, impactData, governanceRadar,
      totalProfitImpact, totalLiquidityImpact, totalGrowthImpact,
      positiveActions, negativeActions, neutralActions,
      overrideCount, criticalCount, highRiskCount,
      productivityScore, qualityScore, governanceScore,
      peakHour: peakHour ? `${peakHour[0]}:00` : '--',
      activeDays: Object.keys(dailyMap).length,
    };
  }, [allLogs]);

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ShieldCheck className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm">لا توجد بيانات نشاط مسجلة لهذا الموظف</p>
        <p className="text-xs mt-1">سيتم عرض التحليل عند بدء الموظف بالعمل في النظام</p>
      </div>
    );
  }

  const verdict = getVerdict(analytics.governanceScore);
  const recentLogs = allLogs.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Governance Verdict Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${verdict.bg} rounded-2xl border border-border p-6`}
      >
        <div className="flex items-center gap-6 flex-wrap">
          <ScoreRing score={analytics.governanceScore} size={130} />
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-lg font-heading font-bold text-foreground mb-1">
              {verdict.emoji} حوكمة أداء {employeeName}
            </h3>
            <p className={`text-sm font-semibold ${verdict.color} mb-3`}>{verdict.label}</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">إجمالي العمليات</p>
                <p className="text-sm font-bold text-foreground">{analytics.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">هذا الأسبوع</p>
                <p className="text-sm font-bold text-foreground">{analytics.weekly}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">هذا الشهر</p>
                <p className="text-sm font-bold text-foreground">{analytics.monthly}</p>
              </div>
            </div>
          </div>
          {userScore && (
            <div className="text-center bg-card/50 rounded-xl border border-border p-4 min-w-[120px]">
              <p className="text-[10px] text-muted-foreground mb-1">الترتيب بين الفريق</p>
              <p className="text-3xl font-heading font-black text-primary">#{userScore.rank}</p>
              <p className="text-[10px] text-muted-foreground">من {allScores.length}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={TrendingUp} label="الأثر على الأرباح" color="bg-emerald-500/10 text-emerald-400"
          value={`${analytics.totalProfitImpact >= 0 ? '+' : ''}${analytics.totalProfitImpact.toLocaleString()}`}
          trend={analytics.totalProfitImpact > 0 ? 'up' : analytics.totalProfitImpact < 0 ? 'down' : 'neutral'}
          sub="ريال سعودي" />
        <MetricCard icon={ShieldCheck} label="نقاط الجودة" color="bg-blue-500/10 text-blue-400"
          value={`${Math.round(analytics.qualityScore)}%`}
          trend={analytics.qualityScore >= 70 ? 'up' : 'down'}
          sub={analytics.criticalCount > 0 ? `${analytics.criticalCount} تنبيه حرج` : 'لا تنبيهات'} />
        <MetricCard icon={Zap} label="الإنتاجية" color="bg-amber-500/10 text-amber-400"
          value={`${analytics.productivityScore}%`}
          trend={analytics.productivityScore >= 60 ? 'up' : 'down'}
          sub={`${analytics.activeDays} يوم نشط`} />
        <MetricCard icon={Clock} label="ذروة النشاط" color="bg-purple-500/10 text-purple-400"
          value={analytics.peakHour}
          sub={`${analytics.overrideCount} تجاوز يدوي`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Governance Radar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-sm font-heading text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> مؤشرات الحوكمة الشاملة
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={analytics.governanceRadar}>
              <PolarGrid stroke="hsl(220 15% 25%)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(220 10% 60%)', fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="الأداء" dataKey="value" stroke="hsl(190 80% 50%)" fill="hsl(190 80% 50%)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Daily Activity */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-sm font-heading text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-section-employees" /> النشاط اليومي (آخر 14 يوم)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analytics.dailyData}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(25 85% 52%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(25 85% 52%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(220 10% 55%)', fontSize: 9 }} />
              <YAxis tick={{ fill: 'hsl(220 10% 55%)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(220 20% 14%)', border: '1px solid hsl(220 15% 25%)', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" name="العمليات" stroke="hsl(25 85% 52%)" fill="url(#actGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Impact & Action Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Impact Pie */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-sm font-heading text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> تأثير العمليات
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={analytics.impactData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {analytics.impactData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(220 20% 14%)', border: '1px solid hsl(220 15% 25%)', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {analytics.impactData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                <span className="text-[10px] text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Types Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-sm font-heading text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-section-forecast" /> أنواع العمليات
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.actionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
              <XAxis type="number" tick={{ fill: 'hsl(220 10% 55%)', fontSize: 10 }} />
              <YAxis type="category" dataKey="type" tick={{ fill: 'hsl(220 10% 55%)', fontSize: 10 }} width={60} />
              <Tooltip contentStyle={{ background: 'hsl(220 20% 14%)', border: '1px solid hsl(220 15% 25%)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" name="العدد" fill="hsl(190 80% 50%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Risk Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-sm font-heading text-foreground mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" /> ملخص المخاطر
          </h4>
          <div className="space-y-3">
            {[
              { label: 'عمليات حرجة', count: analytics.criticalCount, color: 'text-red-400', icon: XCircle },
              { label: 'عمليات عالية الخطورة', count: analytics.highRiskCount, color: 'text-orange-400', icon: AlertTriangle },
              { label: 'تجاوزات يدوية', count: analytics.overrideCount, color: 'text-amber-400', icon: RefreshCw },
              { label: 'عمليات إيجابية', count: analytics.positiveActions, color: 'text-emerald-400', icon: CheckCircle },
              { label: 'عمليات سلبية', count: analytics.negativeActions, color: 'text-red-400', icon: TrendingDown },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/20 border border-border">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity Log */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="bg-card rounded-xl border border-border p-5">
        <h4 className="text-sm font-heading text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-section-ai" /> آخر 20 عملية مسجلة
        </h4>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {recentLogs.map((log) => {
            const ActionIcon = ACTION_ICONS[log.action_type] || Eye;
            const riskClass = RISK_COLORS[log.risk_level] || RISK_COLORS.low;
            return (
              <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/10 border border-border hover:bg-secondary/20 transition-colors">
                <div className={`p-1.5 rounded-lg ${riskClass}`}>
                  <ActionIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {ACTION_LABELS[log.action_type] || log.action_type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">—</span>
                    <span className="text-[11px] text-muted-foreground truncate">{log.entity_name || log.entity_type}</span>
                  </div>
                  {(log.old_value || log.new_value) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {log.old_value && <span className="text-[10px] text-red-400/70 line-through">{log.old_value}</span>}
                      {log.new_value && <span className="text-[10px] text-emerald-400">{log.new_value}</span>}
                    </div>
                  )}
                </div>
                <div className="text-left shrink-0">
                  {log.impact_on_net_profit !== 0 && (
                    <p className={`text-[10px] font-bold ${log.impact_on_net_profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {log.impact_on_net_profit > 0 ? '+' : ''}{log.impact_on_net_profit.toLocaleString()} ر.س
                    </p>
                  )}
                  <p className="text-[9px] text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[9px] shrink-0 border ${riskClass}`}>
                  {log.risk_level === 'low' ? 'آمن' : log.risk_level === 'medium' ? 'متوسط' : log.risk_level === 'high' ? 'عالي' : 'حرج'}
                </Badge>
              </div>
            );
          })}
          {recentLogs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد عمليات مسجلة</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
