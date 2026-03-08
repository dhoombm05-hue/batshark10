import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Users, FolderKanban,
  Brain, FlaskConical, Shield, Bell, Settings, UserCircle, RotateCcw, FileSpreadsheet, User, ListTodo, FileUp, Activity
} from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '@/components/Layout';
import HealthScore from '@/components/HealthScore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';
import { useFinancialEngine } from '@/hooks/useFinancialEngine';
import { useJournalDerivedMetrics } from '@/hooks/useJournalMetrics';
import { formatCurrency, formatPercent } from '@/data/mockData';
import { toast } from 'sonner';
import logo from '@/assets/batshark-logo-main.png';
import SmartAlerts from '@/components/SmartAlerts';
import AskMeDialog from '@/components/AskMeDialog';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-2xl p-3 shadow-elevated">
      <p className="text-sm font-heading text-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span style={{ color: p.color }}>●</span> {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const SectionCard = ({ to, icon: Icon, label, desc, bgColor, textColor, borderColor, children, className = '' }: {
  to: string; icon: any; label: string; desc: string; bgColor: string; textColor: string; borderColor: string; children?: React.ReactNode; className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, y: -4 }}
    transition={{ duration: 0.35, type: 'spring', stiffness: 300 }}
    className={className}
  >
    <Link to={to} className="block h-full">
      <div className={`h-full rounded-[20px] p-5 shadow-card hover:shadow-elevated transition-all duration-300 relative overflow-hidden group border ${borderColor} ${bgColor}`}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${textColor} bg-white/80 shadow-sm`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-heading font-bold text-sm ${textColor}`}>{label}</h3>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </Link>
  </motion.div>
);

export default function Dashboard() {
  const { profile } = useAuthContext();
  const { data: dbProjects, isLoading: loadingProjects } = useProjects();
  const { data: dbEmployees } = useEmployees();
  const { recalculateAll } = useFinancialEngine();
  const { data: journalData, isLoading: loadingJournal } = useJournalDerivedMetrics();

  // Use journal-derived metrics as the SINGLE SOURCE OF TRUTH
  const metrics = journalData?.companyMetrics || null;
  const isLoading = loadingProjects || loadingJournal;

  const handleRecalcAll = async () => {
    try {
      await recalculateAll();
    } catch {
      toast.error('فشلت إعادة الاحتساب');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const m = metrics || {
    totalRevenue: 0, totalExpenses: 0, netProfit: 0, monthlyGrowth: 0,
    healthScore: 0, roi: 0, ebitda: 0, burnRate: 0, runway: 0,
    liquidityRatio: 0, grossMargin: 0, operatingMargin: 0, debtToEquity: 0,
    costEfficiencyIndex: 0, performanceIndex: 0,
  };

  return (
    <Layout>
      {/* Background watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center">
        <img src={logo} alt="" className="w-[500px] h-[500px] opacity-[0.03]" />
      </div>

      <div className="relative z-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="flex items-center gap-4">
            <motion.img src={logo} alt="BatShark" className="w-16 h-16 drop-shadow-lg" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: 'spring' }} />
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-black tracking-tight text-foreground">BATSHARK</h1>
              <p className="text-sm text-muted-foreground font-medium -mt-1">Economy Intelligence Platform</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center gap-2">
            <button onClick={handleRecalcAll} className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-warning" title="إعادة احتساب الكل">
              <RotateCcw className="w-5 h-5" />
            </button>
            <Link to="/ai" className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-section-ai">
              <Brain className="w-5 h-5" />
            </Link>
            <Link to="/documents" className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-muted-foreground relative" title="مركز الملفات">
              <Bell className="w-5 h-5" />
            </Link>
            <Link to="/users" className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-muted-foreground" title="إدارة المستخدمين">
              <Settings className="w-5 h-5" />
            </Link>
            <PrintButton title="طباعة التقرير" />
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover shadow-card mr-1" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(210,80%,52%)] to-[hsl(190,80%,45%)] flex items-center justify-center text-white shadow-card mr-1">
                <User className="w-5 h-5" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Smart Alerts with risk analysis & suggestions */}
        <SmartAlerts
          totalRevenue={m.totalRevenue}
          totalExpenses={m.totalExpenses}
          netProfit={m.netProfit}
          burnRate={m.burnRate}
          runway={m.runway}
          liquidityRatio={m.liquidityRatio}
          grossMargin={m.grossMargin}
          healthScore={m.healthScore}
        />

        {/* Stats Cards - from real DB */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { title: 'إجمالي الإيرادات', value: formatCurrency(m.totalRevenue), icon: DollarSign, change: formatPercent(m.monthlyGrowth), type: 'positive' as const, color: 'hsl(152, 60%, 40%)', borderColor: 'border-[hsl(152,60%,40%)]/20' },
            { title: 'إجمالي المصروفات', value: formatCurrency(m.totalExpenses), icon: TrendingDown, color: 'hsl(0, 72%, 55%)', borderColor: 'border-[hsl(0,72%,55%)]/20' },
            { title: 'صافي الربح', value: formatCurrency(m.netProfit), icon: TrendingUp, change: m.netProfit >= 0 ? 'ربح' : 'خسارة', type: (m.netProfit >= 0 ? 'positive' : 'negative') as any, color: 'hsl(210, 80%, 52%)', borderColor: 'border-[hsl(210,80%,52%)]/20' },
            { title: 'النمو الشهري', value: formatPercent(m.monthlyGrowth), icon: BarChart3, change: m.monthlyGrowth >= 0 ? 'مستقر' : 'تراجع', type: (m.monthlyGrowth >= 0 ? 'positive' : 'negative') as any, color: 'hsl(270, 60%, 55%)', borderColor: 'border-[hsl(270,60%,55%)]/20' },
          ].map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
              whileHover={{ scale: 1.03, y: -2 }}
              className={`bg-card rounded-[20px] border ${stat.borderColor} p-5 shadow-card hover:shadow-elevated transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-white shadow-sm" style={{ color: stat.color }}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.change && (
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${stat.type === 'positive' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-xl font-heading font-black text-foreground" style={{ color: stat.color }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Row 2: Projects from DB, Employees, Strategic */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SectionCard
            to="/projects" icon={FolderKanban} label="المشاريع" desc="إدارة ومتابعة أداء المشاريع"
            bgColor="bg-[hsl(152,60%,96%)]" textColor="text-success" borderColor="border-success/25"
            className="lg:col-span-2"
          >
            <div className="space-y-2 mt-2">
              {dbProjects?.map(p => {
                // Use journal-derived metrics for each project
                const jm = journalData?.companyMetrics.projectMetrics.get(p.id);
                const revenue = jm?.totalRevenue ?? Number(p.total_revenue);
                const profit = jm?.netProfit ?? Number(p.net_profit);
                const status = jm?.status ?? p.status;
                return (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/70 shadow-sm">
                    <span className="text-foreground font-semibold">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={profit >= 0 ? 'text-success font-bold' : 'text-destructive font-bold'}>{formatCurrency(profit)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        status === 'profitable' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                      }`}>
                        {status === 'profitable' ? 'مربح' : status === 'loss' ? 'خسارة' : 'متعادل'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {(!dbProjects || dbProjects.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-2">لا توجد مشاريع</p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            to="/employees" icon={Users} label="الموظفين" desc="تقييم الأداء والإنتاجية"
            bgColor="bg-[hsl(25,85%,96%)]" textColor="text-orange" borderColor="border-orange/25"
          >
            <div className="flex items-center gap-3 mt-3">
              <div className="text-3xl font-heading font-black text-orange">{dbEmployees?.length || 0}</div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                أعضاء الفريق<br/>
                متوسط الأداء: <span className="text-orange font-bold">{dbEmployees && dbEmployees.length > 0 ? Math.round(dbEmployees.reduce((s, e) => s + e.performance, 0) / dbEmployees.length) : 0}%</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            to="/strategic" icon={Shield} label="التحليل الاستراتيجي" desc="SWOT والتدفق النقدي"
            bgColor="bg-[hsl(175,60%,96%)]" textColor="text-teal" borderColor="border-teal/25"
          >
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <div className="text-center p-2 rounded-xl bg-success/10 text-success text-[10px] font-bold">قوة: 4</div>
              <div className="text-center p-2 rounded-xl bg-destructive/10 text-destructive text-[10px] font-bold">ضعف: 3</div>
              <div className="text-center p-2 rounded-xl bg-primary/10 text-primary text-[10px] font-bold">فرص: 4</div>
              <div className="text-center p-2 rounded-xl bg-warning/10 text-warning text-[10px] font-bold">تهديد: 4</div>
            </div>
          </SectionCard>
        </div>

        {/* Row 3: Forecasts, Financial Lab */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SectionCard
            to="/forecasts" icon={TrendingUp} label="التوقعات المالية" desc="تحليل شبه اكتواري"
            bgColor="bg-gradient-to-br from-[hsl(270,60%,96%)] to-[hsl(270,60%,92%)]" textColor="text-purple" borderColor="border-purple/25"
          >
            <div className="space-y-1.5 mt-2">
              {[
                { label: 'شهر', value: formatCurrency(Math.round(m.totalRevenue / 12)) },
                { label: '3 أشهر', value: formatCurrency(Math.round(m.totalRevenue / 4)) },
                { label: 'سنة', value: formatCurrency(m.totalRevenue) },
              ].map(f => (
                <div key={f.label} className="flex justify-between text-[11px] p-1.5 rounded-lg bg-white/60">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="text-success font-bold">{f.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            to="/lab" icon={FlaskConical} label="المختبر المالي" desc="سيناريوهات وقيود محاسبية"
            bgColor="bg-[hsl(43,65%,96%)]" textColor="text-gold" borderColor="border-gold/25"
          >
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {['ROI', 'NPV', 'سيناريوهات'].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-white/70 text-gold-dark border border-gold/20 font-semibold shadow-sm">{tag}</span>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            to="/tables" icon={FileSpreadsheet} label="الجداول المخصصة" desc="إنشاء وإدارة جداول بيانات"
            bgColor="bg-[hsl(200,60%,96%)]" textColor="text-primary" borderColor="border-primary/25"
          >
            <p className="text-[10px] text-muted-foreground mt-2">CRUD كامل • ربط بالمشاريع</p>
          </SectionCard>

          <div>
            <HealthScore score={m.healthScore} />
          </div>
        </div>

        {/* BatShark AI Card */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, type: 'spring' }} className="mb-6">
          <Link to="/ai" className="block">
            <div className="relative rounded-[20px] overflow-hidden shadow-elevated hover:shadow-[0_12px_48px_-12px_hsl(190,80%,45%,0.25)] transition-all duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,20%,14%)] via-[hsl(210,25%,18%)] to-[hsl(190,30%,12%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <img src={logo} alt="" className="w-[300px] h-[300px] opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-700" />
              </div>
              <div className="absolute inset-0 backdrop-blur-[1px]" />
              <div className="relative z-10 p-8 flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)] shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-heading font-black text-white mb-1">🦈 BatShark AI</h2>
                  <p className="text-[hsl(210,20%,70%)] text-sm">المستشار المالي الذكي — اسأل عن الأرباح، التوقعات، الأداء، والمخاطر</p>
                </div>
                <div className="hidden lg:flex items-center gap-3">
                  <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)] text-white font-heading font-bold text-sm shadow-lg group-hover:shadow-xl transition-shadow">
                    ابدأ المحادثة →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Advanced Indicators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="lg:col-span-2 bg-card rounded-[20px] border border-border p-6 shadow-card relative overflow-hidden">
            <img src={logo} alt="" className="absolute bottom-4 left-4 w-14 h-14 opacity-[0.04] pointer-events-none" />
            <h3 className="text-sm font-heading font-bold text-foreground mb-4">📊 ملخص أداء المشاريع</h3>
            <div className="space-y-3">
              {dbProjects?.map(p => {
                const jm = journalData?.companyMetrics.projectMetrics.get(p.id);
                const revenue = jm?.totalRevenue ?? Number(p.total_revenue);
                const profit = jm?.netProfit ?? Number(p.net_profit);
                const profitPercent = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs text-foreground w-28 truncate font-medium">{p.name}</span>
                    <div className="flex-1 h-3 bg-secondary/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${profit >= 0 ? 'bg-success' : 'bg-destructive'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.abs(profitPercent), 100)}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-14 text-left ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {profitPercent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="bg-card rounded-[20px] border border-border p-5 shadow-card">
              <h3 className="text-xs font-heading font-bold text-foreground mb-3">📈 مؤشرات متقدمة</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'ROI', value: `${m.roi}%`, color: 'text-success' },
                  { label: 'EBITDA', value: formatCurrency(m.ebitda), color: 'text-gold' },
                  { label: 'هامش الربح', value: `${m.grossMargin}%`, color: 'text-primary' },
                  { label: 'السيولة', value: `${m.liquidityRatio}x`, color: 'text-teal' },
                ].map(ind => (
                  <div key={ind.label} className="text-center p-2.5 rounded-xl bg-secondary/50">
                    <p className="text-[9px] text-muted-foreground">{ind.label}</p>
                    <p className={`text-sm font-heading font-black ${ind.color}`}>{ind.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="bg-card rounded-[20px] border border-border p-5 shadow-card">
              <h3 className="text-xs font-heading font-bold text-foreground mb-3">👑 مجلس الإدارة</h3>
              <div className="space-y-2">
                {[
                  { emoji: '👑', name: 'عبدالرحمن بن بندر', role: 'CEO' },
                  { emoji: '⚙️', name: 'محمد بن تركي', role: 'COO' },
                  { emoji: '📊', name: 'فهد سلطان', role: 'استراتيجي' },
                  { emoji: '📣', name: 'سعد سلطان', role: 'تسويق' },
                  { emoji: '💻', name: 'نايف المطيري', role: 'تقنية' },
                ].map(member => (
                  <div key={member.name} className="flex items-center gap-2 text-xs p-1.5 rounded-lg hover:bg-secondary/40 transition-colors">
                    <span>{member.emoji}</span>
                    <span className="text-foreground font-medium">{member.name}</span>
                    <span className="text-muted-foreground mr-auto">— {member.role}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <AskMeDialog pageKey="dashboard" />
    </Layout>
  );
}
