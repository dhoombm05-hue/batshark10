import { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Megaphone, Layers, LayoutDashboard, Home, Menu, X, MessageCircle, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/batshark-logo-main.png';

const NAV = [
  { to: '/b99', icon: Home, label: 'الرئيسية', exact: true },
  { to: '/b99/generator', icon: Sparkles, label: 'مولد الأفكار' },
  { to: '/b99/ads', icon: Megaphone, label: 'الحملات الإعلانية' },
  { to: '/b99/platforms', icon: Layers, label: 'مولد المنصات' },
  { to: '/b99/search', icon: Search, label: 'البحث الذكي' },
  { to: '/b99/dashboard', icon: LayoutDashboard, label: 'لوحتي' },
];

export default function B99Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const [identity, setIdentity] = useState<{ userId?: string; name?: string; email?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [batFlying, setBatFlying] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chat, setChat] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'أهلاً! أنا BatShark، مرشدك داخل Batshark99. اكتب ما تريده وسأرشدك للقسم المناسب.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const lastPath = useRef(loc.pathname);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    document.title = 'Batshark 99 — منصة الأعمال السيادية';
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (u) {
        const { data: prof } = await supabase.from('profiles').select('display_name').eq('user_id', u.id).maybeSingle();
        setIdentity({ userId: u.id, email: u.email, name: prof?.display_name || u.email?.split('@')[0] });
      }
    })();
  }, []);

  // bat flight on route change
  useEffect(() => {
    if (lastPath.current !== loc.pathname) {
      setBatFlying(true);
      lastPath.current = loc.pathname;
      const t = setTimeout(() => setBatFlying(false), 1100);
      return () => clearTimeout(t);
    }
  }, [loc.pathname]);

  const goWithBat = (to: string) => { setMenuOpen(false); nav(to); };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChat((c) => [...c, { role: 'user', content: msg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'assistant', payload: { history: chat, message: msg, context: loc.pathname } },
      });
      if (error) throw error;
      setChat((c) => [...c, { role: 'assistant', content: data.reply, route: data.action_route, suggestions: data.suggestions } as any]);
      if (data.action_route) {
        setTimeout(() => goWithBat(data.action_route), 800);
      }
    } catch (e: any) { toast.error(e.message || 'خطأ بالمساعد'); }
    finally { setChatLoading(false); }
  };

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    nav(`/b99/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#04050b] text-slate-100 relative overflow-x-hidden">
      {/* ambient bg */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -20, 0] }} transition={{ duration: 18, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-violet-600/20 blur-[120px]" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 22, repeat: Infinity }}
          className="absolute top-1/3 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,transparent_50%,#000_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => goWithBat('/b99')} className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="BatShark" className="w-9 h-9 drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
            <div className="hidden sm:block">
              <div className="font-black text-lg leading-tight bg-gradient-to-l from-white to-violet-200 bg-clip-text text-transparent">BATSHARK 99</div>
              <div className="text-[9px] text-slate-400 tracking-[0.3em] -mt-0.5">SOVEREIGN PLATFORM</div>
            </div>
          </button>

          <form onSubmit={doSearch} className="flex-1 max-w-xl mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                placeholder="ابحث في كل المنصة... (اضغط Enter)"
                className="bg-slate-900/60 border-white/10 pr-10 h-10 rounded-full text-sm" />
            </div>
          </form>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.exact}
                className={({ isActive }) => `px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <n.icon className="w-4 h-4" /> {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto lg:ml-0 flex items-center gap-2">
            {identity ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {identity.name}
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => window.open('/login', '_self')} className="text-slate-300 hover:text-white text-xs">دخول</Button>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-lg bg-white/5">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t border-white/5 bg-black/60 backdrop-blur-xl">
              <div className="p-4 space-y-1">
                <form onSubmit={doSearch} className="mb-3">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="بحث..." className="bg-slate-900/60 border-white/10 pr-10 h-10 rounded-full" />
                  </div>
                </form>
                {NAV.map((n) => (
                  <button key={n.to} onClick={() => goWithBat(n.to)}
                    className="w-full text-right px-3 py-2.5 rounded-lg flex items-center gap-2 text-sm hover:bg-white/5">
                    <n.icon className="w-4 h-4" /> {n.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Bat flying overlay */}
      <AnimatePresence>
        {batFlying && (
          <motion.div
            initial={{ x: '110vw', y: '20vh', rotate: -15, opacity: 0, scale: 0.5 }}
            animate={{ x: '-30vw', y: ['20vh', '5vh', '60vh', '30vh'], rotate: [-15, 10, -10, 5], opacity: [0, 1, 1, 0.8, 0], scale: [0.5, 1.4, 1.6, 1.2, 0.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center"
          >
            <motion.img src={logo} alt="" className="w-32 h-32 drop-shadow-[0_0_40px_rgba(139,92,246,0.9)]"
              animate={{ scaleX: [1, -1, 1, -1, 1] }} transition={{ duration: 0.3, repeat: 3 }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Outlet context={{ identity }} />
      </main>

      {/* AI Assistant FAB */}
      <button onClick={() => setAssistantOpen(true)}
        className="fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 shadow-[0_0_30px_rgba(139,92,246,0.6)] flex items-center justify-center hover:scale-110 transition-transform">
        <Bot className="w-7 h-7 text-white" />
      </button>

      <AnimatePresence>
        {assistantOpen && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 left-5 z-40 w-[min(380px,calc(100vw-2rem))] h-[480px] rounded-2xl bg-slate-950/95 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-violet-500/20 to-cyan-500/20">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
                <div>
                  <div className="text-sm font-bold">BatShark Assistant</div>
                  <div className="text-[10px] text-emerald-300 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> متصل</div>
                </div>
              </div>
              <button onClick={() => setAssistantOpen(false)}><X className="w-4 h-4 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-violet-500/20 text-violet-100 border border-violet-500/30' : 'bg-white/5 border border-white/10 text-slate-200'}`}>
                    {m.content}
                    {(m as any).suggestions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(m as any).suggestions.map((s: string, j: number) => (
                          <button key={j} onClick={() => { setChatInput(s); }}
                            className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10">{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-xs text-slate-400 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-bounce" /> يفكر...</div>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="p-3 border-t border-white/10 flex gap-2">
              <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="اسأل أو وجّهني..." className="bg-slate-900/60 border-white/10 text-sm h-10" />
              <Button type="submit" size="sm" disabled={chatLoading} className="bg-gradient-to-r from-violet-500 to-cyan-500"><Send className="w-4 h-4" /></Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
