import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Users, TrendingUp, Shield,
  Menu, X, ChevronLeft, Brain
} from 'lucide-react';
import logo from '@/assets/batshark-logo.png';

const navItems = [
  { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/projects', label: 'المشاريع', icon: FolderKanban },
  { path: '/employees', label: 'الموظفين', icon: Users },
  { path: '/forecasts', label: 'التوقعات', icon: TrendingUp },
  { path: '/strategic', label: 'التحليل الاستراتيجي', icon: Shield },
  { path: '/ai', label: 'اسأل BatShark', icon: Brain },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
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
          flex flex-col border-l border-border
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
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${active
                    ? 'bg-primary/15 text-primary shadow-gold glow-gold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary' : ''}`} />
                {!collapsed && <span className="font-body text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              © 2024 BatShark Economy
            </p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
