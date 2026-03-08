import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Users, FolderKanban,
  Brain, FlaskConical, Shield, Settings, User, RotateCcw, FileSpreadsheet,
  ListTodo, FileUp, Activity, Newspaper, MessageSquare, Mail
} from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import Layout from '@/components/Layout';
import HealthScore from '@/components/HealthScore';
import DashboardCustomizer, { loadPrefs, savePrefs, type DashboardPrefs, type LayoutMode } from '@/components/DashboardCustomizer';
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

/* ───── helpers to generate bg from hsl color ───── */
function colorToBgLight(hsl: string): string {
  // "hsl(152,60%,40%)" → "hsl(152,60%,96%)"
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return 'bg-secondary/20';
  return `bg-[hsl(${match[1]},${match[2]}%,96%)]`;
}
function colorToBorder(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return 'border-border';
  return `border-[${hsl}]/25`;
}

/* ───── section card type ───── */
interface SectionItem {
  key: string;
  to: string;
  icon: any;
  label: string;
  desc: string;
  defaultColor: string;
  children?: React.ReactNode;
  span2?: boolean;
}

/* ───── grid card ───── */
function GridCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
      whileHover={{ scale: 1.025, y: -4 }}
      className={item.span2 ? 'md:col-span-2' : ''}
    >
      <Link to={item.to} className="block h-full">
        <div
          className="h-full rounded-[20px] p-5 shadow-card hover:shadow-elevated transition-all duration-300 border relative overflow-hidden group"
          style={{
            borderColor: `${color}40`,
            background: `linear-gradient(135deg, ${color}08, ${color}04)`,
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-white/80 shadow-sm" style={{ color }}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-sm truncate" style={{ color }}>{item.label}</h3>
                <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
              </div>
            </div>
            {item.children}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ───── circle card ───── */
function CircleCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ scale: 1.1, y: -6 }}
      className="flex flex-col items-center"
    >
      <Link to={item.to} className="flex flex-col items-center gap-2 group">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-card hover:shadow-elevated transition-all duration-300 border-2 relative overflow-hidden"
          style={{
            borderColor: color,
            background: `radial-gradient(circle at 30% 30%, ${color}15, ${color}08)`,
          }}
        >
          <item.icon className="w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-110" style={{ color }} />
        </div>
        <span className="font-heading font-bold text-xs text-foreground text-center leading-tight max-w-[100px]">{item.label}</span>
        <span className="text-[9px] text-muted-foreground text-center max-w-[100px] hidden sm:block">{item.desc}</span>
      </Link>
    </motion.div>
  );
}

/* ───── list card ───── */
function ListCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 26 }}
    >
      <Link to={item.to} className="block">
        <div
          className="flex items-center gap-4 p-4 rounded-2xl border shadow-sm hover:shadow-card transition-all duration-300 group"
          style={{
            borderColor: `${color}40`,
            background: `linear-gradient(135deg, ${color}06, transparent)`,
          }}
        >
          <div className="p-3 rounded-xl bg-white/80 shadow-sm shrink-0" style={{ color }}>
            <item.icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-sm" style={{ color }}>{item.label}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
          </div>
          <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*                         DASHBOARD                              */
/* ════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { profile } = useAuthContext();
  const { data: dbProjects, isLoading: loadingProjects } = useProjects();
  const { data: dbEmployees } = useEmployees();
  const { recalculateAll } = useFinancialEngine();
  const { data: journalData, isLoading: loadingJournal } = useJournalDerivedMetrics();

  const [prefs, setPrefs] = useState<DashboardPrefs>(loadPrefs);

  const handlePrefsChange = (p: DashboardPrefs) => {
    setPrefs(p);
    savePrefs(p);
  };

  const metrics = journalData?.companyMetrics || null;
  const isLoading = loadingProjects || loadingJournal;

  const handleRecalcAll = async () => {
    try { await recalculateAll(); } catch { toast.error('فشلت إعادة الاحتساب'); }
  };

  /* ─── stat definitions ─── */
  const statDefs = useMemo(() => [
    { key: 'إجمالي الإيرادات', title: 'إجمالي الإيرادات', icon: DollarSign, defaultColor: 'hsl(152,60%,40%)' },
    { key: 'إجمالي المصروفات', title: 'إجمالي المصروفات', icon: TrendingDown, defaultColor: 'hsl(0,72%,55%)' },
    { key: 'صافي الربح', title: 'صافي الربح', icon: TrendingUp, defaultColor: 'hsl(210,80%,52%)' },
    { key: 'النمو الشهري', title: 'النمو الشهري', icon: BarChart3, defaultColor: 'hsl(270,60%,55%)' },
  ], []);

  /* ─── section definitions ─── */
  const sectionDefs: SectionItem[] = useMemo(() => [
    { key: 'المشاريع', to: '/projects', icon: FolderKanban, label: 'المشاريع', desc: 'إدارة ومتابعة أداء المشاريع', defaultColor: 'hsl(152,60%,40%)', span2: true },
    { key: 'الموظفين', to: '/employees', icon: Users, label: 'الموظفين', desc: 'تقييم الأداء والإنتاجية', defaultColor: 'hsl(25,85%,50%)' },
    { key: 'التحليل الاستراتيجي', to: '/strategic', icon: Shield, label: 'التحليل الاستراتيجي', desc: 'SWOT والتدفق النقدي', defaultColor: 'hsl(175,60%,38%)' },
    { key: 'التوقعات المالية', to: '/forecasts', icon: TrendingUp, label: 'التوقعات المالية', desc: 'تحليل شبه اكتواري', defaultColor: 'hsl(270,60%,55%)' },
    { key: 'المختبر المالي', to: '/lab', icon: FlaskConical, label: 'المختبر المالي', desc: 'سيناريوهات وقيود محاسبية', defaultColor: 'hsl(43,65%,45%)' },
    { key: 'الجداول المخصصة', to: '/tables', icon: FileSpreadsheet, label: 'الجداول المخصصة', desc: 'إنشاء وإدارة جداول', defaultColor: 'hsl(210,80%,52%)' },
    { key: 'إدارة المهام', to: '/tasks', icon: ListTodo, label: 'إدارة المهام', desc: 'Kanban Board للفرق', defaultColor: 'hsl(25,85%,50%)', span2: true },
    { key: 'مركز الاستيراد', to: '/import', icon: FileUp, label: 'مركز الاستيراد', desc: 'رفع Excel و CSV', defaultColor: 'hsl(43,65%,45%)' },
    { key: 'الأخبار', to: '/news', icon: Newspaper, label: 'الأخبار', desc: 'آخر الأخبار والتحديثات', defaultColor: 'hsl(210,80%,52%)' },
    { key: 'غرف النقاش', to: '/chat', icon: MessageSquare, label: 'غرف النقاش', desc: 'محادثات الفريق', defaultColor: 'hsl(152,60%,40%)' },
    { key: 'الرسائل الخاصة', to: '/messages', icon: Mail, label: 'الرسائل الخاصة', desc: 'محادثات مباشرة', defaultColor: 'hsl(270,60%,55%)' },
    { key: 'مؤشرات الأداء', to: '/strategic', icon: Activity, label: 'مؤشرات الأداء', desc: 'KPIs متقدمة', defaultColor: 'hsl(175,60%,38%)' },
  ], []);

  const statDefaults = useMemo(() => Object.fromEntries(statDefs.map(s => [s.key, s.defaultColor])), [statDefs]);
  const sectionDefaults = useMemo(() => Object.fromEntries(sectionDefs.map(s => [s.key, s.defaultColor])), [sectionDefs]);

  /* ─── resolve colors ─── */
  const getStatColor = (key: string) => prefs.colors.stats[key] || statDefaults[key];
  const getSectionColor = (key: string) => prefs.colors.sections[key] || sectionDefaults[key];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60dvh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full"
          />
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

  const statValues: Record<string, { value: string; change?: string; type?: 'positive' | 'negative' }> = {
    'إجمالي الإيرادات': { value: formatCurrency(m.totalRevenue), change: formatPercent(m.monthlyGrowth), type: 'positive' },
    'إجمالي المصروفات': { value: formatCurrency(m.totalExpenses) },
    'صافي الربح': { value: formatCurrency(m.netProfit), change: m.netProfit >= 0 ? 'ربح' : 'خسارة', type: m.netProfit >= 0 ? 'positive' : 'negative' },
    'النمو الشهري': { value: formatPercent(m.monthlyGrowth), change: m.monthlyGrowth >= 0 ? 'مستقر' : 'تراجع', type: m.monthlyGrowth >= 0 ? 'positive' : 'negative' },
  };

  /* ─── section children (only for grid mode) ─── */
  const sectionChildren: Record<string, React.ReactNode> = {
    'المشاريع': (
      <div className="space-y-1.5 mt-2">
        {dbProjects?.slice(0, 3).map(p => {
          const jm = journalData?.companyMetrics.projectMetrics.get(p.id);
          const profit = jm?.netProfit ?? Number(p.net_profit);
          return (
            <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/70 shadow-sm">
              <span className="text-foreground font-semibold truncate">{p.name}</span>
              <span className={profit >= 0 ? 'text-success font-bold' : 'text-destructive font-bold'}>{formatCurrency(profit)}</span>
            </div>
          );
        })}
      </div>
    ),
    'الموظفين': (
      <div className="flex items-center gap-3 mt-3">
        <span className="text-2xl font-heading font-black" style={{ color: getSectionColor('الموظفين') }}>{dbEmployees?.length || 0}</span>
        <span className="text-[11px] text-muted-foreground">أعضاء الفريق</span>
      </div>
    ),
  };

  const enrichedSections = sectionDefs.map(s => ({
    ...s,
    children: prefs.layout === 'grid' ? sectionChildren[s.key] : undefined,
  }));

  return (
    <Layout>
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center">
        <img src={logo} alt="" className="w-[400px] h-[400px] opacity-[0.025]" />
      </div>

      <div className="relative z-10 pb-8">
        {/* ───── Top Bar ───── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <motion.img
              src={logo} alt="BatShark"
              className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-lg"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black tracking-tight text-foreground">BATSHARK</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium -mt-0.5">Economy Intelligence Platform</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-1.5">
            <DashboardCustomizer
              prefs={prefs}
              onChange={handlePrefsChange}
              statKeys={statDefs.map(s => s.key)}
              sectionKeys={sectionDefs.map(s => s.key)}
              statDefaults={statDefaults}
              sectionDefaults={sectionDefaults}
            />
            <button onClick={handleRecalcAll} className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-warning" title="إعادة احتساب">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <Link to="/ai" className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-section-ai">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link to="/users" className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-muted-foreground">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <PrintButton title="طباعة" />
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-card" />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(190,80%,45%)] flex items-center justify-center text-white shadow-card">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
          </motion.div>
        </div>

        {/* ───── Smart Alerts ───── */}
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

        {/* ───── Financial Stats ───── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {statDefs.map((stat, i) => {
            const color = getStatColor(stat.key);
            const val = statValues[stat.key];
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-card rounded-2xl sm:rounded-[20px] border border-border/60 p-4 sm:p-5 shadow-card hover:shadow-elevated transition-all"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-white shadow-sm" style={{ color }}>
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  {val.change && (
                    <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold ${
                      val.type === 'positive' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {val.change}
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{stat.title}</p>
                <p className="text-lg sm:text-xl font-heading font-black" style={{ color }}>{val.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ───── Sections (layout-dependent) ───── */}
        <LayoutGroup>
          <AnimatePresence mode="wait">
            <motion.div
              key={prefs.layout}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {prefs.layout === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  {enrichedSections.map((item, i) => (
                    <GridCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}

              {prefs.layout === 'circles' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8 mb-6 justify-items-center py-4">
                  {enrichedSections.map((item, i) => (
                    <CircleCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}

              {prefs.layout === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {enrichedSections.map((item, i) => (
                    <ListCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>

        {/* ───── Health Score ───── */}
        <div className="mb-6">
          <HealthScore score={m.healthScore} />
        </div>

        {/* ───── BatShark AI Card ───── */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring' }} className="mb-6">
          <Link to="/ai" className="block">
            <div className="relative rounded-2xl sm:rounded-[20px] overflow-hidden shadow-elevated hover:shadow-[0_12px_48px_-12px_hsl(190,80%,45%,0.25)] transition-all duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,20%,14%)] via-[hsl(210,25%,18%)] to-[hsl(190,30%,12%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <img src={logo} alt="" className="w-[200px] sm:w-[300px] opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-700" />
              </div>
              <div className="relative z-10 p-5 sm:p-8 flex items-center gap-4 sm:gap-6">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)] shadow-lg shrink-0">
                  <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-heading font-black text-white mb-0.5 sm:mb-1">🦈 BatShark AI</h2>
                  <p className="text-[hsl(210,20%,70%)] text-xs sm:text-sm truncate sm:whitespace-normal">المستشار المالي الذكي — اسأل عن الأرباح، التوقعات، والمخاطر</p>
                </div>
                <div className="hidden sm:block shrink-0">
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)] text-white font-heading font-bold text-sm shadow-lg group-hover:shadow-xl transition-shadow">
                    ابدأ المحادثة →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ───── Bottom Summary ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-card rounded-2xl sm:rounded-[20px] border border-border p-5 sm:p-6 shadow-card relative overflow-hidden">
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
                    <span className="text-xs text-foreground w-24 sm:w-28 truncate font-medium">{p.name}</span>
                    <div className="flex-1 h-3 bg-secondary/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${profit >= 0 ? 'bg-success' : 'bg-destructive'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.abs(profitPercent), 100)}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-12 text-left ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {profitPercent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="bg-card rounded-2xl sm:rounded-[20px] border border-border p-4 sm:p-5 shadow-card">
              <h3 className="text-xs font-heading font-bold text-foreground mb-3">📈 مؤشرات متقدمة</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'ROI', value: `${m.roi}%`, color: 'text-success' },
                  { label: 'EBITDA', value: formatCurrency(m.ebitda), color: 'text-gold' },
                  { label: 'هامش الربح', value: `${m.grossMargin}%`, color: 'text-primary' },
                  { label: 'السيولة', value: `${m.liquidityRatio}x`, color: 'text-teal' },
                ].map(ind => (
                  <div key={ind.label} className="text-center p-2 sm:p-2.5 rounded-xl bg-secondary/50">
                    <p className="text-[9px] text-muted-foreground">{ind.label}</p>
                    <p className={`text-xs sm:text-sm font-heading font-black ${ind.color}`}>{ind.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="bg-card rounded-2xl sm:rounded-[20px] border border-border p-4 sm:p-5 shadow-card">
              <h3 className="text-xs font-heading font-bold text-foreground mb-3">👑 مجلس الإدارة</h3>
              <div className="space-y-1.5">
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
