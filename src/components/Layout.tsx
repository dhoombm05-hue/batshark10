import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Users, TrendingUp, Shield,
  Menu, X, ChevronLeft, ChevronDown, Brain, FlaskConical, LogOut, UserCog, FolderOpen, MessageSquare, Newspaper, Mail, User, ListTodo, FileUp,
  BarChart3, Activity, AlertTriangle, FileText, Sparkles, BookOpen, Building2, GraduationCap, Receipt
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useNews, useNewsReadStatus } from '@/hooks/useNews';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import ThemeSettings from '@/components/ThemeSettings';
import logo from '@/assets/batshark-logo-main.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ROLE_LABELS: Record<string, string> = {
  ceo: '👑 عبدالرحمن CEO',
  coo: '⚙️ العمليات',
  strategic_director: '📊 الاستراتيجي',
  marketing_director: '📣 التسويق',
  tech_director: '💻 التقنية',
};

type NavItem = { path: string; label: string; icon: React.ElementType; color: string };

const navGroups: { groupLabel: string; groupIcon: React.ElementType; groupColor: string; items: NavItem[] }[] = [
  {
    groupLabel: 'اللوحات الرئيسية',
    groupIcon: LayoutDashboard,
    groupColor: 'section-finance',
    items: [
      { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard, color: 'section-finance' },
      { path: '/executive', label: 'اللوحة التنفيذية', icon: BarChart3, color: 'section-revenue' },
      { path: '/operational', label: 'التشغيل اليومي', icon: Activity, color: 'section-ai' },
      { path: '/projects-dashboard', label: 'لوحة المشاريع', icon: FolderKanban, color: 'section-forecast' },
    ],
  },
  {
    groupLabel: 'الأعمال والموارد',
    groupIcon: FolderKanban,
    groupColor: 'section-revenue',
    items: [
      { path: '/projects', label: 'المشاريع', icon: FolderKanban, color: 'section-revenue' },
      { path: '/employees', label: 'الموظفين', icon: Users, color: 'section-employees' },
      { path: '/tasks', label: 'إدارة المهام', icon: ListTodo, color: 'section-employees' },
      { path: '/task-distribution', label: 'توزيع المهام الذكي', icon: Sparkles, color: 'section-ai' },
      { path: '/business-feasibility', label: 'تحليل جدوى البزنس', icon: Building2, color: 'section-invest' },
      { path: '/quizzes', label: 'الاختبارات الأسبوعية', icon: GraduationCap, color: 'section-strategic' },
    ],
  },
  {
    groupLabel: 'التحليل والتوقعات',
    groupIcon: TrendingUp,
    groupColor: 'section-forecast',
    items: [
      { path: '/forecasts', label: 'التوقعات', icon: TrendingUp, color: 'section-forecast' },
      { path: '/strategic', label: 'التحليل الاستراتيجي', icon: Shield, color: 'section-strategic' },
      { path: '/lab', label: 'مختبر النمذجة', icon: FlaskConical, color: 'section-invest' },
      { path: '/alerts', label: 'التنبيهات الذكية', icon: AlertTriangle, color: 'section-employees' },
    ],
  },
  {
    groupLabel: 'الذكاء الاصطناعي',
    groupIcon: Brain,
    groupColor: 'section-ai',
    items: [
      { path: '/ai', label: 'اسأل BatShark', icon: Brain, color: 'section-ai' },
      { path: '/ai-insights', label: 'رؤى AI المتقدمة', icon: Sparkles, color: 'section-ai' },
    ],
  },
  {
    groupLabel: 'التواصل والمحتوى',
    groupIcon: MessageSquare,
    groupColor: 'section-forecast',
    items: [
      { path: '/chat', label: 'غرفة النقاشات', icon: MessageSquare, color: 'section-ai' },
      { path: '/messages', label: 'الرسائل الخاصة', icon: Mail, color: 'section-forecast' },
      { path: '/news', label: 'الأخبار', icon: Newspaper, color: 'section-revenue' },
    ],
  },
  {
    groupLabel: 'الملفات والبيانات',
    groupIcon: FileText,
    groupColor: 'section-invest',
    items: [
      { path: '/reports', label: 'التقارير', icon: FileText, color: 'section-finance' },
      { path: '/documents', label: 'مركز الملفات', icon: FolderOpen, color: 'section-finance' },
      { path: '/import', label: 'مركز الاستيراد', icon: FileUp, color: 'section-invest' },
      { path: '/dictionary', label: 'قاموس البيانات', icon: BookOpen, color: 'section-strategic' },
    ],
  },
];

const colorMap: Record<string, { text: string; bg: string; glow: string }> = {
  'section-finance': { text: 'text-section-finance', bg: 'bg-section-finance/15', glow: '0 0 20px hsl(210 80% 58% / 0.2)' },
  'section-revenue': { text: 'text-section-revenue', bg: 'bg-section-revenue/15', glow: '0 0 20px hsl(152 60% 45% / 0.2)' },
  'section-employees': { text: 'text-section-employees', bg: 'bg-section-employees/15', glow: '0 0 20px hsl(25 85% 55% / 0.2)' },
  'section-forecast': { text: 'text-section-forecast', bg: 'bg-section-forecast/15', glow: '0 0 20px hsl(270 60% 55% / 0.2)' },
  'section-strategic': { text: 'text-section-strategic', bg: 'bg-section-strategic/15', glow: '0 0 20px hsl(175 60% 45% / 0.2)' },
  'section-invest': { text: 'text-section-invest', bg: 'bg-section-invest/15', glow: '0 0 20px hsl(43 65% 55% / 0.2)' },
  'section-ai': { text: 'text-section-ai', bg: 'bg-section-ai/15', glow: '0 0 20px hsl(190 80% 50% / 0.2)' },
};

function NavSection({
  group,
  collapsed,
  location,
  onNav,
  newsUnread,
  pmUnread,
  chatUnread,
}: {
  group: typeof navGroups[0];
  collapsed: boolean;
  location: { pathname: string };
  onNav: () => void;
  newsUnread: number;
  pmUnread: number;
  chatUnread: number;
}) {
  const groupColors = colorMap[group.groupColor];

  return (
    <div className="space-y-0.5">
      {/* Section label */}
      {!collapsed && (
        <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
          <div className={`w-1 h-3.5 rounded-full ${groupColors.bg}`} style={{ boxShadow: groupColors.glow }} />
          <span className="font-heading text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">{group.groupLabel}</span>
        </div>
      )}
      {collapsed && <div className="h-px mx-2 my-1.5 bg-border/50" />}

      {/* Items */}
      {group.items.map((item) => {
        const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        const colors = colorMap[item.color];

        if (collapsed) {
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNav}
              title={item.label}
              className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${active ? `${colors.bg} ${colors.text}` : `${colors.text} opacity-60 hover:opacity-100 hover:${colors.bg}`}`}
              style={active ? { boxShadow: colors.glow } : undefined}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${colors.text}`} />
            </Link>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${active ? `${colors.bg} ${colors.text}` : `text-sidebar-foreground/80 hover:text-sidebar-foreground hover:${colors.bg}`}`}
            style={active ? { boxShadow: colors.glow } : undefined}
          >
            <div className={`p-1 rounded-md ${active ? colors.bg : `${colors.bg} opacity-40`}`}>
              <item.icon className={`w-3.5 h-3.5 shrink-0 ${colors.text}`} />
            </div>
            <span className="font-body text-[13px] font-medium flex-1">{item.label}</span>
            {item.path === '/news' && newsUnread > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                {newsUnread}
              </span>
            )}
            {item.path === '/messages' && pmUnread > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                {pmUnread}
              </span>
            )}
            {item.path === '/chat' && chatUnread > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                {chatUnread}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { profile, role, isCEO, signOut } = useAuthContext();
  const { data: prefs } = useUserPreferences();
  const { data: allNews = [] } = useNews();
  const { readIds, unreadCount } = useNewsReadStatus();
  const newsUnread = unreadCount(allNews.map(n => n.id));
  const latestUnreadNews = allNews.find((item) => !readIds.includes(item.id));
  const { pmUnread, chatUnread } = useUnreadCounts();

  const currentTheme = prefs?.theme || 'light';

  const getBodyBg = () => {
    if (currentTheme === 'dark') return 'linear-gradient(135deg, hsl(220 20% 10%), hsl(220 22% 7%))';
    if (currentTheme === 'glass') return 'linear-gradient(135deg, hsl(210 30% 92% / 0.7), hsl(220 20% 88% / 0.5))';
    if (currentTheme === 'custom' && prefs?.custom_bg_url) return undefined;
    return 'var(--background-gradient)';
  };

  const ceoGroup: typeof navGroups[0] | null = isCEO
    ? {
        groupLabel: 'الإدارة',
        groupIcon: UserCog,
        groupColor: 'section-finance',
        items: [{ path: '/users', label: 'إدارة المستخدمين', icon: UserCog, color: 'section-finance' }],
      }
    : null;

  const allGroups = ceoGroup ? [...navGroups, ceoGroup] : navGroups;

  return (
    <div className="flex min-h-screen min-h-[100dvh]">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 right-4 z-50 lg:hidden bg-card p-2 rounded-lg border border-border"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 right-0 h-screen z-50 lg:z-auto
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          flex flex-col border-l border-border lg:z-10
        `}
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <img src={logo} alt="BatShark" className="w-10 h-10 rounded-lg" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-bold text-sm text-gradient-gold leading-tight">BATSHARK</h1>
              <p className="text-[10px] text-muted-foreground">Economy Intelligence</p>
            </div>
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
            className="text-muted-foreground hover:text-foreground transition-colors hidden lg:block"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {!collapsed && latestUnreadNews && (
            <Link
              to="/news"
              onClick={() => setMobileOpen(false)}
              className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-card/70 p-2 hover:bg-secondary/50 transition-colors"
            >
              <Avatar className="w-7 h-7">
                <AvatarImage src={latestUnreadNews.author_avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-foreground truncate">
                  <span className="font-bold">📢 {latestUnreadNews.author_name}</span>
                  <span className="text-muted-foreground"> نشر خبر جديد</span>
                </p>
              </div>
              {newsUnread > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {newsUnread}
                </span>
              )}
            </Link>
          )}

          {allGroups.map((group) => (
            <NavSection
              key={group.groupLabel}
              group={group}
              collapsed={collapsed}
              location={location}
              onNav={() => setMobileOpen(false)}
              newsUnread={newsUnread}
              pmUnread={pmUnread}
              chatUnread={chatUnread}
            />
          ))}
        </nav>

        {/* Theme + User Info & Logout */}
        <div className="p-4 border-t border-border space-y-2">
          {!collapsed && <ThemeSettings />}
          {!collapsed && profile && (
            <div className="flex items-center gap-3 mt-1">
              <Avatar className="w-9 h-9 rounded-xl">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary rounded-xl">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-heading font-bold text-white truncate">{profile.display_name}</p>
                {role && <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[role] || role}</p>}
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all text-sm ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="font-body text-xs">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 min-h-screen overflow-auto relative ${currentTheme === 'dark' ? 'text-[hsl(210,20%,90%)]' : ''}`}
        style={{
          background: getBodyBg(),
          ...(currentTheme === 'custom' && prefs?.custom_bg_url ? {
            backgroundImage: `url(${prefs.custom_bg_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          } : {}),
        }}
      >
        {currentTheme === 'custom' && prefs?.custom_bg_url && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-none" style={{ zIndex: 0 }} />
        )}
        <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto relative safe-bottom" style={{ zIndex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
