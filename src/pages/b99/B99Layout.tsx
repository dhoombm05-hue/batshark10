import { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Megaphone, Layers, LayoutDashboard, Home, Menu, X, Send, Bot, LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/batshark-logo-official.png';

const NAV = [
  { to: '/b99', icon: Home, label: 'الرئيسية', exact: true },
  { to: '/b99/generator', icon: Sparkles, label: 'المولد' },
  { to: '/b99/ads', icon: Megaphone, label: 'استوديو الإعلانات' },
  { to: '/b99/platforms', icon: Layers, label: 'بناء المنصات' },
  { to: '/b99/search', icon: Search, label: 'البحث العلمي' },
  { to: '/b99/dashboard', icon: LayoutDashboard, label: 'لوحتي' },
];

export default function B99Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const [identity, setIdentity] = useState<{ userId?: string; name?: string; email?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [batFlying, setBatFlying] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chat, setChat] = useState<any[]>([
    { role: 'assistant', content: 'أهلاً بك في Batshark99. اكتب ما تريد بناءه أو فهمه وسأرشدك مباشرة.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const lastPath = useRef(loc.pathname);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    document.title = 'Batshark 99 — منصة الأعمال السيادية';
    const attack = (event: Event) => {
      const to = (event as CustomEvent<{ to?: string }>).detail?.to;
      setBatFlying(true);
      setTimeout(() => { if (to) nav(to); }, 720);
      setTimeout(() => setBatFlying(false), 1700);
    };
    window.addEventListener('batshark:attack', attack as EventListener);
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (u) {
        const { data: prof } = await supabase.from('profiles').select('display_name').eq('user_id', u.id).maybeSingle();
        setIdentity({ userId: u.id, email: u.email, name: prof?.display_name || u.email?.split('@')[0] });
      }
    })();
    return () => window.removeEventListener('batshark:attack', attack as EventListener);
  }, []);

  useEffect(() => {
    if (lastPath.current !== loc.pathname) {
      setBatFlying(true);
      lastPath.current = loc.pathname;
      const t = setTimeout(() => setBatFlying(false), 1500);
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
      if (data.action_route) setTimeout(() => goWithBat(data.action_route), 800);
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
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -20, 0] }} transition={{ duration: 18, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-violet-600/15 blur-[120px]" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 22, repeat: Infinity }}
          className="absolute top-1/3 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/12 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,transparent_50%,#000_100%)]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => goWithBat('/b99')} className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="BatShark" className="w-10 h-10 invert drop-shadow-[0_0_18px_rgba(139,92,246,0.85)]" />
            <div className="hidden sm:block leading-tight">
              <div className="font-black text-lg bg-gradient-to-l from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">BATSHARK 99</div>
              <div className="text-[9px] text-slate-400 tracking-[0.3em] -mt-0.5">SOVEREIGN PLATFORM</div>
            </div>
          </button>

          <form onSubmit={doSearch} className="flex-1 max-w-xl mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                placeholder="ابحث علمياً في كل المنصة... (Enter)"
                className="bg-slate-900/60 border-white/10 pr-10 h-10 rounded-full text-sm" />
            </div>
          </form>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.exact}
                className={({ isActive }) => `px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                <n.icon className="w-4 h-4" /> {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto lg:ml-0 flex items-center gap-2">
            {identity ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs">
                <ShieldCheck className="w-3 h-3" /> {identity.name}
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => nav('/login')} className="text-slate-200 hover:text-white text-xs gap-1">
                <LogIn className="w-3.5 h-3.5" /> دخول داخلي
              </Button>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-lg bg-white/10 text-white">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t border-white/10 bg-black/80 backdrop-blur-xl">
              <div className="p-4 space-y-1">
                <form onSubmit={doSearch} className="mb-3">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="بحث..." className="bg-slate-900/60 border-white/10 pr-10 h-10 rounded-full" />
                  </div>
                </form>
                {NAV.map((n) => (
                  <button key={n.to} onClick={() => goWithBat(n.to)}
                    className="w-full text-right px-3 py-3 rounded-lg flex items-center gap-2 text-sm text-white hover:bg-white/10">
                    <n.icon className="w-4 h-4" /> {n.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Cinematic bat attack overlay */}
      <AnimatePresence>
        {batFlying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
          >
            {/* Darkness curtain */}
            <motion.div className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0.85, 0.4, 0] }}
              transition={{ duration: 1.5, times: [0, 0.3, 0.55, 0.75, 1] }} />

            {/* Distant clouds whoosh */}
            <motion.div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.35),transparent_60%)]"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 0.6, 1.4, 2.2], opacity: [0, 0.6, 0.9, 0] }}
              transition={{ duration: 1.5 }} />

            {/* Bat: flies in from far depth, fills the screen, then flies back */}
            <motion.img
              src={logo}
              alt=""
              className="invert relative z-10 drop-shadow-[0_0_80px_rgba(34,211,238,1)]"
              initial={{ scale: 0.05, opacity: 0, rotate: -8, y: 40 }}
              animate={{
                scale: [0.05, 0.4, 1.4, 3.4, 1.2, 0.3],
                opacity: [0, 0.7, 1, 1, 1, 0],
                rotate: [-8, -3, 2, 0, -2, 6],
                y: [40, 20, 0, -10, -10, -60],
              }}
              transition={{ duration: 1.5, ease: [0.6, 0.05, 0.3, 1], times: [0, 0.2, 0.45, 0.6, 0.8, 1] }}
              style={{ width: '38vmin', height: 'auto' }}
            />

            {/* Wing flap bursts */}
            <motion.div className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.85, 0, 0] }}
              transition={{ duration: 1.5, times: [0, 0.55, 0.6, 0.65, 1] }} />

            {/* shockwave ring at impact */}
            <motion.div className="absolute rounded-full border-2 border-cyan-300"
              initial={{ width: 0, height: 0, opacity: 0 }}
              animate={{ width: ['0vmin','0vmin','120vmin'], height: ['0vmin','0vmin','120vmin'], opacity: [0, 0.9, 0] }}
              transition={{ duration: 1.5, times: [0, 0.55, 0.95] }} />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Outlet context={{ identity }} />
      </main>

      <button onClick={() => setAssistantOpen(true)} aria-label="مساعد BatShark"
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
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-violet-500/20 text-violet-100 border border-violet-500/30' : 'bg-white/5 border border-white/10 text-slate-100'}`}>
                    {m.content}
                    {(m as any).suggestions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(m as any).suggestions.map((s: string, j: number) => (
                          <button key={j} onClick={() => setChatInput(s)}
                            className="text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/15 hover:bg-white/20">{s}</button>
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
