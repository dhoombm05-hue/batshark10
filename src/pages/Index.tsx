import { useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Users, FolderKanban,
  Shield, User, RotateCcw, FileSpreadsheet, Sparkles,
  ListTodo, FileUp, Activity, Newspaper, MessageSquare, Mail, FlaskConical,
  ChevronLeft
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
  span2?: boolean;
}

/* ───── Card Components ───── */
function GridCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.035, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -3 }}
      className={item.span2 ? 'md:col-span-2' : ''}
    >
      <Link to={item.to} className="block h-full group">
        <div
          className="h-full rounded-2xl p-5 transition-all duration-300 border relative overflow-hidden hover:shadow-lg"
          style={{ borderColor: `${color}30`, background: `linear-gradient(145deg, ${color}06 0%, ${color}02 100%)` }}
        >
          <div className="absolute top-0 left-0 w-full h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: color }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}12`, color }}>
                  <item.icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-[13px] text-foreground truncate">{item.label}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            {item.children}
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
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 280, damping: 22 }}
      whileHover={{ y: -5 }}
      className="flex flex-col items-center"
    >
      <Link to={item.to} className="flex flex-col items-center gap-2.5 group">
        <div
          className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-full flex items-center justify-center transition-all duration-300 border group-hover:shadow-lg"
          style={{ borderColor: `${color}35`, background: `radial-gradient(circle at 35% 35%, ${color}12, ${color}04)` }}
        >
          <item.icon className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110" style={{ color }} strokeWidth={1.6} />
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
    >
      <Link to={item.to} className="block group">
        <div
          className="flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 hover:shadow-md"
          style={{ borderColor: `${color}25`, background: `linear-gradient(135deg, ${color}04, transparent)` }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}10`, color }}>
            <item.icon className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-[13px] text-foreground">{item.label}</h3>
            <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ───── compact card ───── */
function CompactCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ y: -3 }}
    >
      <Link to={item.to} className="flex flex-col items-center gap-1.5 group p-3 rounded-xl hover:bg-muted/40 transition-colors">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all" style={{ background: `${color}12`, color }}>
          <item.icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
        <span className="font-heading font-bold text-[10px] text-foreground text-center leading-tight">{item.label}</span>
      </Link>
    </motion.div>
  );
}

/* ───── masonry card ───── */
function MasonryCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  const isLarge = index % 3 === 0;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -3 }}
      className={isLarge ? 'sm:col-span-2' : ''}
    >
      <Link to={item.to} className="block h-full group">
        <div
          className={`h-full rounded-2xl border transition-all duration-300 hover:shadow-lg relative overflow-hidden ${isLarge ? 'p-6' : 'p-4'}`}
          style={{ borderColor: `${color}25`, background: `linear-gradient(160deg, ${color}08, ${color}02)` }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.06]" style={{ background: color, transform: 'translate(30%, -30%)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}12`, color }}>
                <item.icon className="w-4 h-4" strokeWidth={1.8} />
              </div>
              <h3 className="font-heading font-bold text-sm text-foreground">{item.label}</h3>
            </div>
            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            {isLarge && item.children && <div className="mt-2">{item.children}</div>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ───── hexagon card ───── */
function HexCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ scale: 1.08, y: -4 }}
      className="flex flex-col items-center"
    >
      <Link to={item.to} className="flex flex-col items-center gap-2 group">
        <div
          className="w-[76px] h-[76px] sm:w-[90px] sm:h-[90px] flex items-center justify-center transition-all duration-300 group-hover:shadow-lg"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: `linear-gradient(135deg, ${color}18, ${color}08)`,
          }}
        >
          <item.icon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color }} strokeWidth={1.6} />
        </div>
        <span className="font-heading font-bold text-[11px] text-foreground text-center leading-tight max-w-[90px]">{item.label}</span>
      </Link>
    </motion.div>
  );
}

/* ───── minimal card ───── */
function MinimalCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.025 }}
    >
      <Link to={item.to} className="flex items-center gap-3 py-2.5 px-1 group border-b border-border/30 hover:bg-muted/20 transition-colors rounded-lg">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">— {item.desc}</span>
        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground/30 mr-auto group-hover:text-muted-foreground transition-colors" />
      </Link>
    </motion.div>
  );
}

/* ───── large card ───── */
function LargeCard({ item, color, index }: { item: SectionItem; color: string; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -3 }}
    >
      <Link to={item.to} className="block group">
        <div
          className="rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg relative overflow-hidden"
          style={{ borderColor: `${color}25`, background: `linear-gradient(145deg, ${color}06, ${color}02)` }}
        >
          <div className="absolute top-0 left-0 w-full h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: color }} />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}12`, color }}>
              <item.icon className="w-6 h-6" strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-base text-foreground mb-1">{item.label}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
              {item.children && <div className="mt-3">{item.children}</div>}
            </div>
            <ChevronLeft className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
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
    { key: 'إجمالي الإيرادات', title: 'إجمالي الإيرادات', icon: DollarSign, defaultColor: 'hsl(152,60%,40%)' },
    { key: 'إجمالي المصروفات', title: 'إجمالي المصروفات', icon: TrendingDown, defaultColor: 'hsl(0,72%,55%)' },
    { key: 'صافي الربح', title: 'صافي الربح', icon: TrendingUp, defaultColor: 'hsl(210,80%,52%)' },
    { key: 'النمو الشهري', title: 'النمو الشهري', icon: BarChart3, defaultColor: 'hsl(270,60%,55%)' },
  ], []);

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
  const getStatColor = (key: string) => prefs.colors.stats[key] || statDefaults[key];
  const getSectionColor = (key: string) => prefs.colors.sections[key] || sectionDefaults[key];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60dvh]">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
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

  const sectionChildren: Record<string, React.ReactNode> = {
    'المشاريع': (
      <div className="space-y-1.5 mt-2">
        {dbProjects?.slice(0, 3).map(p => {
          const jm = journalData?.companyMetrics.projectMetrics.get(p.id);
          const profit = jm?.netProfit ?? Number(p.net_profit);
          return (
            <div key={p.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-background/60">
              <span className="text-foreground font-medium truncate">{p.name}</span>
              <span className={`font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(profit)}</span>
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
        <img src={logo} alt="" className="w-[400px] h-[400px] opacity-[0.02]" />
      </div>

      <div className="relative z-10 pb-8">
        {/* ───── Top Bar ───── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="BatShark" className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-md shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black tracking-tight text-foreground truncate">BATSHARK</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium -mt-0.5">Economy Intelligence Platform</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-1.5 shrink-0">
            <DashboardCustomizer
              prefs={prefs}
              onChange={handlePrefsChange}
              statKeys={statDefs.map(s => s.key)}
              sectionKeys={sectionDefs.map(s => s.key)}
              statDefaults={statDefaults}
              sectionDefaults={sectionDefaults}
            />
            <button onClick={handleRecalcAll} className="p-2.5 rounded-xl bg-card border border-border hover:border-warning/40 hover:shadow-card transition-all text-warning" title="إعادة احتساب">
              <RotateCcw className="w-[18px] h-[18px]" />
            </button>
            <Link to="/users" className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all text-muted-foreground hidden sm:flex">
              <Users className="w-[18px] h-[18px]" />
            </Link>
            <PrintButton title="طباعة" />
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(190,80%,45%)] flex items-center justify-center text-white shadow-sm">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Smart Alerts */}
        <SmartAlerts
          totalRevenue={m.totalRevenue} totalExpenses={m.totalExpenses}
          netProfit={m.netProfit} burnRate={m.burnRate}
          runway={m.runway} liquidityRatio={m.liquidityRatio}
          grossMargin={m.grossMargin} healthScore={m.healthScore}
        />

        {/* ───── Financial Stats ───── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statDefs.map((stat, i) => {
            const color = getStatColor(stat.key);
            const val = statValues[stat.key];
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 260 }}
                whileHover={{ y: -2 }}
                className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}12`, color }}>
                    <stat.icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  </div>
                  {val.change && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold ${
                      val.type === 'positive' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {val.change}
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-lg sm:text-xl font-heading font-black tracking-tight" style={{ color }}>{val.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ───── Sections ───── */}
        <LayoutGroup>
          <AnimatePresence mode="wait">
            <motion.div
              key={prefs.layout}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {prefs.layout === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  {enrichedSections.map((item, i) => (
                    <GridCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'circles' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-5 sm:gap-7 mb-6 justify-items-center py-2">
                  {enrichedSections.map((item, i) => (
                    <CircleCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                  {enrichedSections.map((item, i) => (
                    <ListCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'compact' && (
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1 mb-6 justify-items-center">
                  {enrichedSections.map((item, i) => (
                    <CompactCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'masonry' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {enrichedSections.map((item, i) => (
                    <MasonryCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'hexagon' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 mb-6 justify-items-center py-3">
                  {enrichedSections.map((item, i) => (
                    <HexCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'minimal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 mb-6 bg-card rounded-2xl border border-border/50 p-4">
                  {enrichedSections.map((item, i) => (
                    <MinimalCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
              {prefs.layout === 'cards-lg' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {enrichedSections.map((item, i) => (
                    <LargeCard key={item.key} item={item} color={getSectionColor(item.key)} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>

        {/* Health Score */}
        <div className="mb-6">
          <HealthScore score={m.healthScore} />
        </div>

        {/* ───── AI Card — Clean, no brain icon ───── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring' }} className="mb-6">
          <Link to="/ai" className="block group">
            <div className="relative rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-l from-[hsl(220,18%,13%)] via-[hsl(215,20%,16%)] to-[hsl(210,22%,11%)]" />
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-700">
                <img src={logo} alt="" className="w-[220px] sm:w-[280px]" />
              </div>
              <div className="relative z-10 p-5 sm:p-7 flex items-center gap-4 sm:gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[hsl(190,80%,45%)] to-[hsl(210,80%,50%)] flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-white font-heading font-black text-lg sm:text-xl">AI</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-xl font-heading font-black text-white mb-0.5">BatShark AI</h2>
                  <p className="text-[hsl(210,15%,60%)] text-[11px] sm:text-sm truncate sm:whitespace-normal">المستشار المالي الذكي — تحليلات، توقعات، ومخاطر</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <div className="px-4 py-2 rounded-xl bg-white/10 text-white/90 font-heading font-bold text-sm group-hover:bg-white/15 transition-colors flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>ابدأ محادثة</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ───── Bottom Summary ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-5 sm:p-6 relative overflow-hidden">
            <h3 className="text-sm font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" strokeWidth={1.8} />
              ملخص أداء المشاريع
            </h3>
            <div className="space-y-2.5">
              {dbProjects?.map(p => {
                const jm = journalData?.companyMetrics.projectMetrics.get(p.id);
                const revenue = jm?.totalRevenue ?? Number(p.total_revenue);
                const profit = jm?.netProfit ?? Number(p.net_profit);
                const profitPercent = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs text-foreground w-24 sm:w-28 truncate font-medium">{p.name}</span>
                    <div className="flex-1 h-2.5 bg-secondary/40 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${profit >= 0 ? 'bg-success' : 'bg-destructive'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.abs(profitPercent), 100)}%` }}
                        transition={{ duration: 0.8 }}
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

          <div className="space-y-3">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
              <h3 className="text-xs font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                مؤشرات متقدمة
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'ROI', value: `${m.roi}%`, color: 'text-success' },
                  { label: 'EBITDA', value: formatCurrency(m.ebitda), color: 'text-gold' },
                  { label: 'هامش الربح', value: `${m.grossMargin}%`, color: 'text-primary' },
                  { label: 'السيولة', value: `${m.liquidityRatio}x`, color: 'text-teal' },
                ].map(ind => (
                  <div key={ind.label} className="text-center p-2.5 rounded-xl bg-muted/40">
                    <p className="text-[9px] text-muted-foreground">{ind.label}</p>
                    <p className={`text-xs sm:text-sm font-heading font-black ${ind.color}`}>{ind.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
              <h3 className="text-xs font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                مجلس الإدارة
              </h3>
              <div className="space-y-1">
                {[
                  { name: 'عبدالرحمن بن بندر', role: 'CEO', badge: 'bg-primary/10 text-primary' },
                  { name: 'محمد بن تركي', role: 'COO', badge: 'bg-success/10 text-success' },
                  { name: 'فهد سلطان', role: 'استراتيجي', badge: 'bg-purple/10 text-purple' },
                  { name: 'سعد سلطان', role: 'تسويق', badge: 'bg-orange/10 text-orange' },
                  { name: 'نايف المطيري', role: 'تقنية', badge: 'bg-teal/10 text-teal' },
                ].map(member => (
                  <div key={member.name} className="flex items-center justify-between text-xs py-1.5">
                    <span className="text-foreground font-medium">{member.name}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${member.badge}`}>{member.role}</span>
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
