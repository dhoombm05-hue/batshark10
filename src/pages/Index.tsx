import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Users, FolderKanban,
  Brain, FlaskConical, Shield, Activity, Gauge, Wallet, PiggyBank, Target,
  Bell, Settings, Plus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import Layout from '@/components/Layout';
import HealthScore from '@/components/HealthScore';
import { projects, companyMetrics, formatCurrency, formatPercent } from '@/data/mockData';
import logo from '@/assets/batshark-logo-new.png';

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

// Section panel component
const SectionPanel = ({ to, icon: Icon, label, desc, colorClass, glowColor, children, className = '', span = '' }: {
  to: string; icon: any; label: string; desc: string; colorClass: string; glowColor: string; children?: React.ReactNode; className?: string; span?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01, y: -2 }}
    transition={{ duration: 0.3 }}
    className={`${span} ${className}`}
  >
    <Link to={to} className="block h-full">
      <div
        className="h-full bg-gradient-card rounded-2xl border border-border p-5 shadow-card hover:shadow-elevated transition-all duration-300 relative overflow-hidden group"
        style={{ borderColor: `hsl(${glowColor} / 0.15)` }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
          background: `radial-gradient(circle at 50% 0%, hsl(${glowColor} / 0.08), transparent 70%)`
        }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${colorClass}`} style={{ boxShadow: `0 4px 12px hsl(${glowColor} / 0.2)` }}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground text-sm group-hover:text-foreground/90">{label}</h3>
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
  return (
    <Layout>
      {/* Header with logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-4"
      >
        <img src={logo} alt="BatShark" className="w-12 h-12 rounded-xl shadow-card" />
        <div>
          <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gradient-gold mb-1">
            BatShark Economy
          </h1>
          <p className="text-muted-foreground text-sm">
            مركز القيادة المالي — نظام تشغيل استراتيجي مبني على البيانات
          </p>
        </div>
      </motion.div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { title: 'إجمالي الإيرادات', value: formatCurrency(companyMetrics.totalRevenue), icon: DollarSign, change: formatPercent(companyMetrics.monthlyGrowth), type: 'positive' as const, glow: '152 60% 45%' },
          { title: 'إجمالي المصروفات', value: formatCurrency(companyMetrics.totalExpenses), icon: TrendingDown, glow: '0 65% 50%' },
          { title: 'صافي الربح', value: formatCurrency(companyMetrics.netProfit), icon: TrendingUp, change: 'ربح', type: 'positive' as const, glow: '43 65% 55%' },
          { title: 'النمو الشهري', value: formatPercent(companyMetrics.monthlyGrowth), icon: BarChart3, change: 'مستقر', type: 'positive' as const, glow: '210 80% 58%' },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-gradient-card rounded-xl border border-border p-4 shadow-card"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg" style={{ background: `hsl(${stat.glow} / 0.12)` }}>
                <stat.icon className="w-4 h-4" style={{ color: `hsl(${stat.glow})` }} />
              </div>
              {stat.change && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${stat.type === 'positive' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{stat.title}</p>
            <p className="text-lg font-heading font-bold text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Grid Layout - Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* المشاريع - Wide */}
        <SectionPanel
          to="/projects" icon={FolderKanban} label="المشاريع" desc="إدارة ومتابعة أداء المشاريع"
          colorClass="bg-section-revenue/15 text-section-revenue"
          glowColor="152 60% 45%"
          span="lg:col-span-2"
        >
          <div className="space-y-2 mt-2">
            {projects.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/30">
                <span className="text-foreground font-medium">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className={p.netProfit >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(p.netProfit)}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                    p.status === 'profitable' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                  }`}>
                    {p.status === 'profitable' ? 'مربح' : 'خسارة'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        {/* الموظفين */}
        <SectionPanel
          to="/employees" icon={Users} label="الموظفين" desc="تقييم الأداء والإنتاجية"
          colorClass="bg-section-employees/15 text-section-employees"
          glowColor="25 85% 55%"
        >
          <div className="flex items-center gap-2 mt-2">
            <div className="text-2xl font-heading font-bold text-foreground">5</div>
            <div className="text-[10px] text-muted-foreground">أعضاء الفريق<br/>متوسط الأداء: <span className="text-section-employees font-bold">85%</span></div>
          </div>
        </SectionPanel>

        {/* التحليل الاستراتيجي */}
        <SectionPanel
          to="/strategic" icon={Shield} label="التحليل الاستراتيجي" desc="SWOT والتدفق النقدي"
          colorClass="bg-section-strategic/15 text-section-strategic"
          glowColor="175 60% 45%"
        >
          <div className="grid grid-cols-2 gap-1 mt-2">
            <div className="text-center p-1.5 rounded bg-success/10 text-success text-[10px]">قوة: 4</div>
            <div className="text-center p-1.5 rounded bg-destructive/10 text-destructive text-[10px]">ضعف: 3</div>
            <div className="text-center p-1.5 rounded bg-primary/10 text-primary text-[10px]">فرص: 4</div>
            <div className="text-center p-1.5 rounded bg-warning/10 text-warning text-[10px]">تهديد: 4</div>
          </div>
        </SectionPanel>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* التوقعات */}
        <SectionPanel
          to="/forecasts" icon={TrendingUp} label="التوقعات المالية" desc="تحليل شبه اكتواري"
          colorClass="bg-section-forecast/15 text-section-forecast"
          glowColor="270 60% 55%"
        >
          <div className="space-y-1 mt-2 text-[10px]">
            <div className="flex justify-between"><span className="text-muted-foreground">شهر</span><span className="text-success">{formatCurrency(33000)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">3 أشهر</span><span className="text-success">{formatCurrency(120000)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">سنة</span><span className="text-success">{formatCurrency(550000)}</span></div>
          </div>
        </SectionPanel>

        {/* Financial Lab */}
        <SectionPanel
          to="/lab" icon={FlaskConical} label="BatShark Financial Lab" desc="مختبر النمذجة والسيناريوهات"
          colorClass="bg-section-invest/15 text-section-invest"
          glowColor="43 65% 55%"
          span="lg:col-span-2"
        >
          <div className="flex gap-2 mt-2 flex-wrap">
            {['ROI', 'NPV', 'IRR', 'CAGR', 'سيناريوهات', 'جداول'].map(tag => (
              <span key={tag} className="text-[9px] px-2 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">{tag}</span>
            ))}
          </div>
        </SectionPanel>

        {/* BatShark AI */}
        <SectionPanel
          to="/ai" icon={Brain} label="BatShark AI" desc="المستشار المالي الذكي"
          colorClass="bg-section-ai/15 text-section-ai"
          glowColor="190 80% 50%"
        >
          <div className="mt-2 text-[10px] text-muted-foreground">
            اسأل عن أي شيء: أرباح، توقعات، أداء، مخاطر
          </div>
        </SectionPanel>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-gradient-card rounded-2xl border border-border p-5 shadow-card relative overflow-hidden"
        >
          {/* Watermark */}
          <img src={logo} alt="" className="absolute bottom-3 left-3 w-12 h-12 opacity-[0.04] pointer-events-none" />
          <h3 className="text-sm font-heading text-muted-foreground mb-4">📊 أرباح المشاريع الشهرية</h3>
          <ResponsiveContainer width="100%" height={280}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 20%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="البادل" stroke="hsl(43, 65%, 55%)" fill="url(#goldGrad)" strokeWidth={2} name="البادل" />
              <Area type="monotone" dataKey="Umbrex" stroke="hsl(152, 60%, 45%)" fill="url(#greenGrad)" strokeWidth={2} name="Umbrex" />
              <Area type="monotone" dataKey="الشاشات" stroke="hsl(0, 65%, 50%)" fill="none" strokeWidth={2} strokeDasharray="4 4" name="الشاشات" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          <HealthScore score={companyMetrics.healthScore} />

          {/* Advanced Indicators */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="bg-gradient-card rounded-2xl border border-border p-4 shadow-card">
            <h3 className="text-[11px] font-heading text-muted-foreground mb-3">📈 مؤشرات متقدمة</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'ROI', value: `${companyMetrics.roi}%`, color: 'text-success' },
                { label: 'EBITDA', value: formatCurrency(companyMetrics.ebitda), color: 'text-gold' },
                { label: 'هامش الربح', value: `${companyMetrics.grossMargin}%`, color: 'text-primary' },
                { label: 'السيولة', value: `${companyMetrics.liquidityRatio}x`, color: 'text-teal' },
              ].map(ind => (
                <div key={ind.label} className="text-center p-2 rounded-lg bg-secondary/30">
                  <p className="text-[9px] text-muted-foreground">{ind.label}</p>
                  <p className={`text-sm font-heading font-bold ${ind.color}`}>{ind.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Board */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="bg-gradient-card rounded-2xl border border-border p-4 shadow-card">
            <h3 className="text-[11px] font-heading text-muted-foreground mb-3">👑 مجلس الإدارة</h3>
            <div className="space-y-1.5">
              {[
                { emoji: '👑', name: 'عبدالرحمن بن بندر', role: 'CEO' },
                { emoji: '⚙️', name: 'محمد بن تركي', role: 'COO' },
                { emoji: '📊', name: 'فهد سلطان', role: 'استراتيجي' },
                { emoji: '📣', name: 'سعد سلطان', role: 'تسويق' },
                { emoji: '💻', name: 'نايف المطيري', role: 'تقنية' },
              ].map(m => (
                <div key={m.name} className="flex items-center gap-2 text-xs">
                  <span>{m.emoji}</span>
                  <span className="text-foreground">{m.name}</span>
                  <span className="text-muted-foreground mr-auto">— {m.role}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Revenue vs Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-card rounded-2xl border border-border p-5 shadow-card relative overflow-hidden"
      >
        <img src={logo} alt="" className="absolute bottom-3 left-3 w-12 h-12 opacity-[0.04] pointer-events-none" />
        <h3 className="text-sm font-heading text-muted-foreground mb-4">مقارنة الإيرادات والمصروفات</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={projects.map(p => ({ name: p.name, الإيرادات: p.totalRevenue, المصروفات: p.totalExpenses }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 20%)" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(210, 15%, 55%)' }} />
            <Bar dataKey="الإيرادات" fill="hsl(43, 65%, 55%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="المصروفات" fill="hsl(220, 22%, 28%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </Layout>
  );
}
