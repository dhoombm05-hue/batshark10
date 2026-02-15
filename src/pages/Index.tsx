import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Users, FolderKanban,
  Brain, FlaskConical, Shield, Bell, Settings, UserCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '@/components/Layout';
import HealthScore from '@/components/HealthScore';
import { useAuthContext } from '@/contexts/AuthContext';
import { projects, companyMetrics, formatCurrency, formatPercent } from '@/data/mockData';
import logo from '@/assets/batshark-logo-main.png';

const allMonthlyData = projects[0].monthlyData.map((item, i) => ({
  month: item.month,
  البادل: projects[0].monthlyData[i].profit,
  الشاشات: projects[1].monthlyData[i].profit,
  Umbrex: projects[2].monthlyData[i].profit,
}));

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

// Color-coded section card
const SectionCard = ({ to, icon: Icon, label, desc, bgColor, textColor, borderColor, glowStyle, children, className = '' }: {
  to: string; icon: any; label: string; desc: string; bgColor: string; textColor: string; borderColor: string; glowStyle?: string; children?: React.ReactNode; className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, y: -4 }}
    transition={{ duration: 0.35, type: 'spring', stiffness: 300 }}
    className={className}
  >
    <Link to={to} className="block h-full">
      <div
        className={`h-full rounded-[20px] p-5 shadow-card hover:shadow-elevated transition-all duration-300 relative overflow-hidden group border ${borderColor} ${bgColor}`}
      >
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
  return (
    <Layout>
      {/* Background watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center">
        <img src={logo} alt="" className="w-[500px] h-[500px] opacity-[0.03]" />
      </div>

      <div className="relative z-10">
        {/* Top Bar: Profile, Notifications, Settings */}
        <div className="flex items-center justify-between mb-8">
          {/* Logo & Title */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-4"
          >
            <motion.img
              src={logo}
              alt="BatShark"
              className="w-16 h-16 drop-shadow-lg"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
            />
            <div>
              <h1 className="text-3xl lg:text-4xl font-heading font-black tracking-tight text-foreground">
                BATSHARK
              </h1>
              <p className="text-sm text-muted-foreground font-medium -mt-1">
                Economy Intelligence Platform
              </p>
            </div>
          </motion.div>

          {/* Top right actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2"
          >
            <Link to="/ai" className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-section-ai">
              <Brain className="w-5 h-5" />
            </Link>
            <button className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-muted-foreground relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-card" />
            </button>
            <button className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-muted-foreground">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(210,80%,52%)] to-[hsl(190,80%,45%)] flex items-center justify-center text-white font-heading font-bold text-sm shadow-card mr-1">
              {profile?.display_name?.charAt(0) || '؟'}
            </div>
          </motion.div>
        </div>

        {/* ===== Row 1: Stats Cards - White with colored accents ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { title: 'إجمالي الإيرادات', value: formatCurrency(companyMetrics.totalRevenue), icon: DollarSign, change: formatPercent(companyMetrics.monthlyGrowth), type: 'positive' as const, color: 'hsl(152, 60%, 40%)', borderColor: 'border-[hsl(152,60%,40%)]/20' },
            { title: 'إجمالي المصروفات', value: formatCurrency(companyMetrics.totalExpenses), icon: TrendingDown, color: 'hsl(0, 72%, 55%)', borderColor: 'border-[hsl(0,72%,55%)]/20' },
            { title: 'صافي الربح', value: formatCurrency(companyMetrics.netProfit), icon: TrendingUp, change: 'ربح', type: 'positive' as const, color: 'hsl(210, 80%, 52%)', borderColor: 'border-[hsl(210,80%,52%)]/20' },
            { title: 'النمو الشهري', value: formatPercent(companyMetrics.monthlyGrowth), icon: BarChart3, change: 'مستقر', type: 'positive' as const, color: 'hsl(270, 60%, 55%)', borderColor: 'border-[hsl(270,60%,55%)]/20' },
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

        {/* ===== Row 2: Projects, Employees, Investment, Strategic ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* المشاريع - Green */}
          <SectionCard
            to="/projects" icon={FolderKanban} label="المشاريع" desc="إدارة ومتابعة أداء المشاريع"
            bgColor="bg-[hsl(152,60%,96%)]" textColor="text-success" borderColor="border-success/25"
            className="lg:col-span-2"
          >
            <div className="space-y-2 mt-2">
              {projects.map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/70 shadow-sm">
                  <span className="text-foreground font-semibold">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={p.netProfit >= 0 ? 'text-success font-bold' : 'text-destructive font-bold'}>{formatCurrency(p.netProfit)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      p.status === 'profitable' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                    }`}>
                      {p.status === 'profitable' ? 'مربح' : 'خسارة'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* الموظفين - Orange */}
          <SectionCard
            to="/employees" icon={Users} label="الموظفين" desc="تقييم الأداء والإنتاجية"
            bgColor="bg-[hsl(25,85%,96%)]" textColor="text-orange" borderColor="border-orange/25"
          >
            <div className="flex items-center gap-3 mt-3">
              <div className="text-3xl font-heading font-black text-orange">5</div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                أعضاء الفريق<br/>
                متوسط الأداء: <span className="text-orange font-bold">85%</span>
              </div>
            </div>
          </SectionCard>

          {/* التحليل الاستراتيجي - Teal */}
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

        {/* ===== Row 3: Forecasts, Financial Lab ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* التوقعات - Purple gradient */}
          <SectionCard
            to="/forecasts" icon={TrendingUp} label="التوقعات المالية" desc="تحليل شبه اكتواري"
            bgColor="bg-gradient-to-br from-[hsl(270,60%,96%)] to-[hsl(270,60%,92%)]" textColor="text-purple" borderColor="border-purple/25"
          >
            <div className="space-y-1.5 mt-2">
              {[
                { label: 'شهر', value: formatCurrency(33000) },
                { label: '3 أشهر', value: formatCurrency(120000) },
                { label: 'سنة', value: formatCurrency(550000) },
              ].map(f => (
                <div key={f.label} className="flex justify-between text-[11px] p-1.5 rounded-lg bg-white/60">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="text-success font-bold">{f.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Financial Lab - Gold */}
          <SectionCard
            to="/lab" icon={FlaskConical} label="BatShark Financial Lab" desc="مختبر النمذجة والسيناريوهات"
            bgColor="bg-[hsl(43,65%,96%)]" textColor="text-gold" borderColor="border-gold/25"
            className="lg:col-span-2"
          >
            <div className="flex gap-2 mt-3 flex-wrap">
              {['ROI', 'NPV', 'IRR', 'CAGR', 'سيناريوهات', 'جداول'].map(tag => (
                <span key={tag} className="text-[10px] px-3 py-1.5 rounded-full bg-white/70 text-gold-dark border border-gold/20 font-semibold shadow-sm">{tag}</span>
              ))}
            </div>
          </SectionCard>

          {/* Health Score */}
          <div>
            <HealthScore score={companyMetrics.healthScore} />
          </div>
        </div>

        {/* ===== BatShark AI - Full Width Premium Card ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="mb-6"
        >
          <Link to="/ai" className="block">
            <div className="relative rounded-[20px] overflow-hidden shadow-elevated hover:shadow-[0_12px_48px_-12px_hsl(190,80%,45%,0.25)] transition-all duration-500 group">
              {/* Background with logo */}
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
                  <h2 className="text-2xl font-heading font-black text-white mb-1">
                    🦈 BatShark AI
                  </h2>
                  <p className="text-[hsl(210,20%,70%)] text-sm">
                    المستشار المالي الذكي — اسأل عن الأرباح، التوقعات، الأداء، والمخاطر
                  </p>
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

        {/* ===== Charts Section ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 bg-card rounded-[20px] border border-border p-6 shadow-card relative overflow-hidden"
          >
            <img src={logo} alt="" className="absolute bottom-4 left-4 w-14 h-14 opacity-[0.04] pointer-events-none" />
            <h3 className="text-sm font-heading font-bold text-foreground mb-4">📊 أرباح المشاريع الشهرية</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={allMonthlyData}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(43, 65%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(43, 65%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 48%)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(220, 10%, 48%)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="البادل" stroke="hsl(43, 65%, 50%)" fill="url(#goldGrad)" strokeWidth={2.5} name="البادل" />
                <Area type="monotone" dataKey="Umbrex" stroke="hsl(152, 60%, 40%)" fill="url(#greenGrad)" strokeWidth={2.5} name="Umbrex" />
                <Area type="monotone" dataKey="الشاشات" stroke="hsl(0, 72%, 55%)" fill="none" strokeWidth={2} strokeDasharray="4 4" name="الشاشات" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Advanced Indicators & Board */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="bg-card rounded-[20px] border border-border p-5 shadow-card">
              <h3 className="text-xs font-heading font-bold text-foreground mb-3">📈 مؤشرات متقدمة</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'ROI', value: `${companyMetrics.roi}%`, color: 'text-success' },
                  { label: 'EBITDA', value: formatCurrency(companyMetrics.ebitda), color: 'text-gold' },
                  { label: 'هامش الربح', value: `${companyMetrics.grossMargin}%`, color: 'text-primary' },
                  { label: 'السيولة', value: `${companyMetrics.liquidityRatio}x`, color: 'text-teal' },
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
                ].map(m => (
                  <div key={m.name} className="flex items-center gap-2 text-xs p-1.5 rounded-lg hover:bg-secondary/40 transition-colors">
                    <span>{m.emoji}</span>
                    <span className="text-foreground font-medium">{m.name}</span>
                    <span className="text-muted-foreground mr-auto">— {m.role}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
