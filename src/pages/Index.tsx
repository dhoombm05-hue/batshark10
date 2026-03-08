import { useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Users, FolderKanban,
  Shield, User, RotateCcw, FileSpreadsheet, Sparkles, ArrowUpLeft, ArrowDownLeft,
  ListTodo, FileUp, Activity, Newspaper, MessageSquare, Mail, FlaskConical,
  ChevronLeft, Zap, Crown
} from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import Layout from '@/components/Layout';
import HealthScore from '@/components/HealthScore';
import DashboardCustomizer, { loadPrefs, savePrefs, type DashboardPrefs } from '@/components/DashboardCustomizer';
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

/* ───── types ───── */
interface SectionItem {
  key: string;
  to: string;
  icon: any;
  label: string;
  desc: string;
  defaultColor: string;
  children?: React.ReactNode;
}

/* ═══════════════════════════ CARD COMPONENTS ═══════════════════════════ */

function GridCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 26 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link to={item.to} className="block h-full group">
        <div className="h-full rounded-2xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden bg-card group-hover:shadow-xl"
          style={{
            borderWidth: 1, borderStyle: 'solid', borderColor: `${color}20`,
            boxShadow: `0 2px 12px -3px ${color}12`
          }}
        >
          {/* Accent glow on hover */}
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500" style={{ background: color }} />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
          
          <div className="relative z-10 flex flex-col items-center text-center gap-3 py-1">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
              style={{ background: `${color}10`, color, boxShadow: `0 4px 12px -4px ${color}30` }}>
              <item.icon className="w-5 h-5" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h3 className="font-heading font-bold text-[13px] text-foreground">{item.label}</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CircleCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ delay: index * 0.045, type: 'spring', stiffness: 300, damping: 22 }}
      whileHover={{ y: -6, scale: 1.05 }}
      className="flex flex-col items-center"
    >
      <Link to={item.to} className="flex flex-col items-center gap-2.5 group">
        <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-full flex items-center justify-center transition-all duration-300 group-hover:shadow-xl"
          style={{
            borderWidth: 2, borderStyle: 'solid', borderColor: `${color}28`,
            background: `radial-gradient(circle at 40% 40%, ${color}14, ${color}04)`,
            boxShadow: `0 4px 16px -4px ${color}18`
          }}
        >
          <item.icon className="w-7 h-7 sm:w-8 sm:h-8 transition-all duration-300 group-hover:scale-110" style={{ color }} strokeWidth={1.6} />
        </div>
        <div className="text-center">
          <span className="font-heading font-bold text-[11px] text-foreground block leading-tight">{item.label}</span>
          <span className="text-[9px] text-muted-foreground hidden sm:block mt-0.5">{item.desc}</span>
        </div>
      </Link>
    </motion.div>
  );
}

function ListCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ x: -3 }}
    >
      <Link to={item.to} className="block group">
        <div className="flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 hover:shadow-md bg-card"
          style={{ borderWidth: 1, borderStyle: 'solid', borderColor: `${color}18`, boxShadow: `0 1px 8px -2px ${color}08` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:shadow-md"
            style={{ background: `${color}10`, color, boxShadow: `0 2px 8px -2px ${color}20` }}>
            <item.icon className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-[13px] text-foreground">{item.label}</h3>
            <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground/20 group-hover:text-foreground/40 transition-colors shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}

function CompactCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 320, damping: 24 }}
      whileHover={{ y: -4, scale: 1.08 }}
    >
      <Link to={item.to} className="flex flex-col items-center gap-1.5 group p-3 rounded-xl hover:bg-card transition-all duration-200">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:shadow-md"
          style={{ background: `${color}10`, color, boxShadow: `0 2px 8px -3px ${color}15` }}>
          <item.icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <span className="font-heading font-bold text-[10px] text-foreground text-center leading-tight">{item.label}</span>
      </Link>
    </motion.div>
  );
}

function MasonryCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }}
    >
      <Link to={item.to} className="block h-full group">
        <div className="h-full rounded-2xl transition-all duration-300 hover:shadow-xl relative overflow-hidden p-4 bg-card"
          style={{ borderWidth: 1, borderStyle: 'solid', borderColor: `${color}18`, boxShadow: `0 2px 12px -3px ${color}10` }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.05] group-hover:opacity-[0.1] transition-opacity" style={{ background: color, transform: 'translate(30%, -30%)' }} />
          <div className="relative z-10 flex flex-col items-center text-center gap-2.5 py-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}10`, color }}>
              <item.icon className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <h3 className="font-heading font-bold text-sm text-foreground">{item.label}</h3>
            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function HexCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.4 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ scale: 1.1, y: -5 }}
      className="flex flex-col items-center"
    >
      <Link to={item.to} className="flex flex-col items-center gap-2 group">
        <div className="w-[76px] h-[76px] sm:w-[90px] sm:h-[90px] flex items-center justify-center transition-all duration-300"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: `linear-gradient(135deg, ${color}20, ${color}08)`,
          }}>
          <item.icon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color }} strokeWidth={1.6} />
        </div>
        <span className="font-heading font-bold text-[11px] text-foreground text-center leading-tight max-w-[90px]">{item.label}</span>
      </Link>
    </motion.div>
  );
}

function MinimalCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.025 }}>
      <Link to={item.to} className="flex items-center gap-3 py-3 px-3 group hover:bg-muted/20 transition-colors rounded-xl">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">— {item.desc}</span>
        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground/20 mr-auto group-hover:text-foreground/40 transition-colors" />
      </Link>
    </motion.div>
  );
}

function LargeCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -4 }}
    >
      <Link to={item.to} className="block group">
        <div className="rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl relative overflow-hidden bg-card"
          style={{ borderWidth: 1, borderStyle: 'solid', borderColor: `${color}18`, boxShadow: `0 2px 12px -3px ${color}10` }}>
          <div className="absolute top-0 left-0 w-full h-[2.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:shadow-lg"
              style={{ background: `${color}10`, color, boxShadow: `0 4px 12px -4px ${color}25` }}>
              <item.icon className="w-6 h-6" strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-[15px] text-foreground mb-0.5">{item.label}</h3>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronLeft className="w-5 h-5 text-muted-foreground/20 group-hover:text-foreground/40 transition-colors shrink-0" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ═══════════════════════════ DASHBOARD ═══════════════════════════ */
export default function Dashboard() {
  const { profile } = useAuthContext();
  const { data: dbProjects, isLoading: loadingProjects } = useProjects();
  const { data: dbEmployees } = useEmployees();
  const { recalculateAll } = useFinancialEngine();
  const { data: journalData, isLoading: loadingJournal } = useJournalDerivedMetrics();

  const [prefs, setPrefs] = useState<DashboardPrefs>(loadPrefs);
  const handlePrefsChange = (p: DashboardPrefs) => { setPrefs(p); savePrefs(p); };

  const metrics = journalData?.companyMetrics || null;
  const isLoading = loadingProjects || loadingJournal;

  const handleRecalcAll = async () => {
    try { await recalculateAll(); } catch { toast.error('فشلت إعادة الاحتساب'); }
  };

  const statDefs = useMemo(() => [
    { key: 'إجمالي الإيرادات', title: 'إجمالي الإيرادات', icon: DollarSign, defaultColor: 'hsl(152,60%,40%)', trendIcon: ArrowUpLeft },
    { key: 'إجمالي المصروفات', title: 'إجمالي المصروفات', icon: TrendingDown, defaultColor: 'hsl(0,72%,55%)', trendIcon: ArrowDownLeft },
    { key: 'صافي الربح', title: 'صافي الربح', icon: TrendingUp, defaultColor: 'hsl(210,80%,52%)', trendIcon: ArrowUpLeft },
    { key: 'النمو الشهري', title: 'النمو الشهري', icon: BarChart3, defaultColor: 'hsl(270,60%,55%)', trendIcon: Zap },
  ], []);

  const sectionDefs: SectionItem[] = useMemo(() => [
    { key: 'المشاريع', to: '/projects', icon: FolderKanban, label: 'المشاريع', desc: 'إدارة ومتابعة أداء المشاريع', defaultColor: 'hsl(152,60%,40%)' },
    { key: 'الموظفين', to: '/employees', icon: Users, label: 'الموظفين', desc: 'تقييم الأداء والإنتاجية', defaultColor: 'hsl(25,85%,50%)' },
    { key: 'التحليل الاستراتيجي', to: '/strategic', icon: Shield, label: 'التحليل الاستراتيجي', desc: 'SWOT والتدفق النقدي', defaultColor: 'hsl(175,60%,38%)' },
    { key: 'التوقعات المالية', to: '/forecasts', icon: TrendingUp, label: 'التوقعات المالية', desc: 'تحليل شبه اكتواري', defaultColor: 'hsl(270,60%,55%)' },
    { key: 'المختبر المالي', to: '/lab', icon: FlaskConical, label: 'المختبر المالي', desc: 'سيناريوهات وقيود محاسبية', defaultColor: 'hsl(43,65%,45%)' },
    { key: 'الجداول المخصصة', to: '/tables', icon: FileSpreadsheet, label: 'الجداول المخصصة', desc: 'إنشاء وإدارة جداول', defaultColor: 'hsl(210,80%,52%)' },
    { key: 'إدارة المهام', to: '/tasks', icon: ListTodo, label: 'إدارة المهام', desc: 'Kanban Board للفرق', defaultColor: 'hsl(25,85%,50%)' },
    { key: 'مركز الاستيراد', to: '/import', icon: FileUp, label: 'مركز الاستيراد', desc: 'رفع Excel و CSV', defaultColor: 'hsl(43,65%,45%)' },
    { key: 'الأخبار', to: '/news', icon: Newspaper, label: 'الأخبار', desc: 'آخر الأخبار والتحديثات', defaultColor: 'hsl(210,80%,52%)' },
    { key: 'غرف النقاش', to: '/chat', icon: MessageSquare, label: 'غرف النقاش', desc: 'محادثات الفريق', defaultColor: 'hsl(152,60%,40%)' },
    { key: 'الرسائل الخاصة', to: '/messages', icon: Mail, label: 'الرسائل الخاصة', desc: 'محادثات مباشرة', defaultColor: 'hsl(270,60%,55%)' },
    { key: 'مؤشرات الأداء', to: '/strategic', icon: Activity, label: 'مؤشرات الأداء', desc: 'KPIs متقدمة', defaultColor: 'hsl(175,60%,38%)' },
  ], []);

  const statDefaults = useMemo(() => Object.fromEntries(statDefs.map(s => [s.key, s.defaultColor])), [statDefs]);
  const sectionDefaults = useMemo(() => Object.fromEntries(sectionDefs.map(s => [s.key, s.defaultColor])), [sectionDefs]);
  const getStatColor = (key: string) => prefs.colors.stats[key] || statDefaults[key];
  const getSectionColor = (key: string) => prefs.colors.sections[key] || sectionDefaults[key];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60dvh]">
          <div className="flex flex-col items-center gap-4">
            <motion.img src={logo} alt="" className="w-16 h-16" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
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

  const enrichedSections = sectionDefs.map(s => ({ ...s, children: undefined }));

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'صباح الخير' : greetHour < 17 ? 'مساء النور' : 'مساء الخير';

  return (
    <Layout>
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center">
        <img src={logo} alt="" className="w-[400px] h-[400px] opacity-[0.015]" />
      </div>

      <div className="relative z-10 pb-8">
        {/* ═══════ PREMIUM HEADER ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <motion.img
              src={logo}
              alt="BatShark"
              className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-lg shrink-0"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-foreground">BATSHARK</h1>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium -mt-0.5">
                {greeting}، {profile?.display_name?.split(' ')[0] || 'مدير'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <DashboardCustomizer
              prefs={prefs}
              onChange={handlePrefsChange}
              statKeys={statDefs.map(s => s.key)}
              sectionKeys={sectionDefs.map(s => s.key)}
              statDefaults={statDefaults}
              sectionDefaults={sectionDefaults}
            />
            <motion.button
              whileHover={{ rotate: -180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={handleRecalcAll}
              className="p-2.5 rounded-xl bg-card border border-border hover:border-warning/40 hover:shadow-card transition-all text-warning"
              title="إعادة احتساب"
            >
              <RotateCcw className="w-[18px] h-[18px]" />
            </motion.button>
            <Link to="/users" className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all text-muted-foreground hidden sm:flex">
              <Users className="w-[18px] h-[18px]" />
            </Link>
            <PrintButton title="طباعة" />
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-border shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-md">
                <User className="w-4.5 h-4.5" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Smart Alerts */}
        <SmartAlerts
          totalRevenue={m.totalRevenue} totalExpenses={m.totalExpenses}
          netProfit={m.netProfit} burnRate={m.burnRate}
          runway={m.runway} liquidityRatio={m.liquidityRatio}
          grossMargin={m.grossMargin} healthScore={m.healthScore}
        />

        {/* ═══════ FINANCIAL STATS — Premium Cards ═══════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {statDefs.map((stat, i) => {
            const color = getStatColor(stat.key);
            const val = statValues[stat.key];
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 26 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className="rounded-2xl p-4 sm:p-5 transition-all duration-300 relative overflow-hidden bg-card group"
                style={{
                  borderWidth: 1, borderStyle: 'solid', borderColor: `${color}18`,
                  boxShadow: `0 2px 16px -4px ${color}12`
                }}
              >
                {/* Decorative corner glow */}
                <div className="absolute -top-8 -left-8 w-20 h-20 rounded-full opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: color }} />
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${color}35, transparent)` }} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-md"
                      style={{ background: `${color}10`, color, boxShadow: `0 2px 8px -2px ${color}20` }}>
                      <stat.icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    </div>
                    {val.change && (
                      <span className={`text-[9px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                        val.type === 'positive' ? 'bg-success/8 text-success' : 'bg-destructive/8 text-destructive'
                      }`}>
                        <stat.trendIcon className="w-3 h-3" />
                        {val.change}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mb-1.5 font-medium">{stat.title}</p>
                  <p className="text-lg sm:text-xl font-heading font-black tracking-tight" style={{ color }}>{val.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ═══════ SECTIONS GRID ═══════ */}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                  {enrichedSections.map((item, i) => (
                    <GridCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'circles' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-5 sm:gap-7 mb-8 justify-items-center py-3">
                  {enrichedSections.map((item, i) => (
                    <CircleCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                  {enrichedSections.map((item, i) => (
                    <ListCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'compact' && (
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 mb-8 justify-items-center">
                  {enrichedSections.map((item, i) => (
                    <CompactCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'masonry' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                  {enrichedSections.map((item, i) => (
                    <MasonryCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'hexagon' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 mb-8 justify-items-center py-3">
                  {enrichedSections.map((item, i) => (
                    <HexCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'minimal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 mb-8 bg-card rounded-2xl border border-border/40 p-4 sm:p-5">
                  {enrichedSections.map((item, i) => (
                    <MinimalCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'cards-lg' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
                  {enrichedSections.map((item, i) => (
                    <LargeCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>

        {/* ═══════ HEALTH SCORE ═══════ */}
        <div className="mb-8">
          <HealthScore score={m.healthScore} />
        </div>

        {/* ═══════ AI CARD — PREMIUM ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 260 }}
          className="mb-8"
        >
          <Link to="/ai" className="block group">
            <div className="relative rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-700"
              style={{ boxShadow: '0 8px 40px -12px hsl(210 80% 30% / 0.2)' }}>
              {/* Dark gradient bg */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(220 22% 11%) 0%, hsl(215 20% 15%) 50%, hsl(210 25% 12%) 100%)' }} />
              
              {/* Animated accent line */}
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, hsl(190 80% 50% / 0.4), hsl(210 80% 55% / 0.3), transparent)' }} />
              
              {/* Logo watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000">
                <img src={logo} alt="" className="w-[250px] sm:w-[320px]" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8 flex items-center gap-5 sm:gap-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-xl shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(190 80% 45%), hsl(210 80% 50%))',
                    boxShadow: '0 8px 24px -6px hsl(200 80% 45% / 0.4)'
                  }}
                >
                  <span className="text-white font-heading font-black text-xl sm:text-2xl">AI</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg sm:text-xl font-heading font-black text-white">BatShark AI</h2>
                    <span className="text-[8px] px-2 py-0.5 rounded-md font-bold text-[hsl(190,80%,60%)] bg-[hsl(190,80%,45%)]/10 hidden sm:inline-block">PRO</span>
                  </div>
                  <p className="text-[hsl(210,15%,55%)] text-[11px] sm:text-[13px] leading-relaxed">المستشار المالي الذكي — تحليلات، توقعات، ومخاطر</p>
                </div>
                <div className="hidden sm:flex items-center shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="px-5 py-2.5 rounded-xl font-heading font-bold text-sm flex items-center gap-2 transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, hsl(190 80% 45% / 0.15), hsl(210 80% 55% / 0.1))',
                      color: 'hsl(190 80% 65%)',
                      border: '1px solid hsl(190 80% 50% / 0.2)'
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>ابدأ محادثة</span>
                  </motion.div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ═══════ BOTTOM SUMMARY ═══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Projects Performance */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-card rounded-2xl border border-border/40 p-5 sm:p-6 relative overflow-hidden"
          >
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-primary/[0.03]" />
            <h3 className="text-sm font-heading font-bold text-foreground mb-5 flex items-center gap-2.5 relative z-10">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
              </div>
              ملخص أداء المشاريع
            </h3>
            <div className="space-y-3 relative z-10">
              {dbProjects?.map((p, i) => {
                const jm = journalData?.companyMetrics.projectMetrics.get(p.id);
                const revenue = jm?.totalRevenue ?? Number(p.total_revenue);
                const profit = jm?.netProfit ?? Number(p.net_profit);
                const profitPercent = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs text-foreground w-24 sm:w-28 truncate font-medium">{p.name}</span>
                    <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${profit >= 0 ? 'bg-success' : 'bg-destructive'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.abs(profitPercent), 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                        style={{ boxShadow: profit >= 0 ? '0 2px 8px -2px hsl(152 60% 40% / 0.4)' : '0 2px 8px -2px hsl(0 72% 55% / 0.4)' }}
                      />
                    </div>
                    <span className={`text-xs font-black w-12 text-left font-heading ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {profitPercent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Side panels */}
          <div className="space-y-4">
            {/* KPIs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-2xl border border-border/40 p-4 sm:p-5"
            >
              <h3 className="text-xs font-heading font-bold text-foreground mb-3.5 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Activity className="w-3 h-3 text-primary" strokeWidth={2} />
                </div>
                مؤشرات متقدمة
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'ROI', value: `${m.roi}%`, color: 'hsl(152,60%,40%)' },
                  { label: 'EBITDA', value: formatCurrency(m.ebitda), color: 'hsl(43,65%,45%)' },
                  { label: 'هامش الربح', value: `${m.grossMargin}%`, color: 'hsl(210,80%,52%)' },
                  { label: 'السيولة', value: `${m.liquidityRatio}x`, color: 'hsl(175,60%,38%)' },
                ].map(ind => (
                  <div key={ind.label} className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-[9px] text-muted-foreground mb-1">{ind.label}</p>
                    <p className="text-xs sm:text-sm font-heading font-black" style={{ color: ind.color }}>{ind.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Board */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card rounded-2xl border border-border/40 p-4 sm:p-5"
            >
              <h3 className="text-xs font-heading font-bold text-foreground mb-3.5 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Crown className="w-3 h-3 text-primary" strokeWidth={2} />
                </div>
                مجلس الإدارة
              </h3>
              <div className="space-y-1.5">
                {[
                  { name: 'عبدالرحمن بن بندر', role: 'CEO', color: 'hsl(210,80%,52%)' },
                  { name: 'محمد بن تركي', role: 'COO', color: 'hsl(152,60%,40%)' },
                  { name: 'فهد سلطان', role: 'استراتيجي', color: 'hsl(270,60%,55%)' },
                  { name: 'سعد سلطان', role: 'تسويق', color: 'hsl(25,85%,50%)' },
                  { name: 'نايف المطيري', role: 'تقنية', color: 'hsl(175,60%,38%)' },
                ].map(member => (
                  <div key={member.name} className="flex items-center justify-between text-xs py-2 px-2 rounded-lg hover:bg-muted/20 transition-colors">
                    <span className="text-foreground font-medium">{member.name}</span>
                    <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold"
                      style={{ background: `${member.color}10`, color: member.color }}>
                      {member.role}
                    </span>
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
