import { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Megaphone, Layers, Home, Menu, X, Send, Bot, LogIn, ShieldCheck, Plug, Link2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/batshark-logo-official.png';

const NAV = [
  { to: '/b99', icon: Home, label: 'الرئيسية', exact: true },
  { to: '/b99/level/1', icon: Sparkles, label: 'بناء من الصفر' },
  { to: '/b99/level/2', icon: Plug, label: 'تعزيز موقعي' },
  { to: '/b99/level/3', icon: Bot, label: 'وظّف بات شارك' },
  { to: '/b99/ads', icon: Megaphone, label: 'استوديو الإعلانات' },
  { to: '/b99/platforms', icon: Layers, label: 'منصاتي' },
  { to: '/b99/linked', icon: Link2, label: 'المنصات المربوطة' },
  { to: '/b99/inspiration', icon: Lightbulb, label: 'محرك الإلهام' },
  { to: '/b99/search', icon: Search, label: 'البحث الذكي' },
];

export default function B99Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const [identity, setIdentity] = useState<{ userId?: string; name?: string; email?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chat, setChat] = useState<any[]>([
    { role: 'assistant', content: 'أهلاً بك في بات شارك 99. اكتب ما تريد بناءه وسأرشدك مباشرة.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const lastPath = useRef(loc.pathname);

  useEffect(() => {
    document.title = 'بات شارك 99 — منصة بناء وتعزيز الأعمال';
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (u) {
        const { data: prof } = await supabase.from('profiles').select('display_name').eq('user_id', u.id).maybeSingle();
        setIdentity({ userId: u.id, email: u.email, name: prof?.display_name || u.email?.split('@')[0] });
      }
    })();
  }, []);

  useEffect(() => { lastPath.current = loc.pathname; }, [loc.pathname]);

  const goTo = (to: string) => { setMenuOpen(false); nav(to); };

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
      if (data.action_route) setTimeout(() => goTo(data.action_route), 400);
    } catch (e: any) { toast.error(e.message || 'خطأ بالمساعد'); }
    finally { setChatLoading(false); }
  };

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    nav(`/b99/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-40 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => goTo('/b99')} className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt="بات شارك 99" className="w-9 h-9" />
            <div className="hidden sm:block leading-tight">
              <div className="font-black text-lg text-black">بات شارك <span className="text-blue-600">99</span></div>
              <div className="text-[9px] text-black/60 tracking-[0.3em] -mt-0.5">BUILD · CONNECT · SCALE</div>
            </div>
          </button>

          <form onSubmit={doSearch} className="flex-1 max-w-xl mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
              <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                placeholder="ابحث في كل المنصة..."
                className="bg-white border-2 border-black text-black placeholder:text-black/40 pr-10 h-10 rounded-none text-sm" />
            </div>
          </form>

          <nav className="hidden xl:flex items-center gap-0.5">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.exact}
                className={({ isActive }) => `px-2.5 py-2 text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap border-2 ${isActive ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'text-black border-transparent hover:border-black'}`}>
                <n.icon className="w-3.5 h-3.5" /> {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto xl:ml-0 flex items-center gap-2">
            {identity ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold">
                <ShieldCheck className="w-3 h-3" /> {identity.name}
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => nav('/login')} className="bg-white border-2 border-black text-black hover:bg-black hover:text-white rounded-none text-xs gap-1 font-bold">
                <LogIn className="w-3.5 h-3.5" /> دخول
              </Button>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="xl:hidden p-2 border-2 border-black text-black">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="xl:hidden overflow-hidden border-t-2 border-black bg-white">
              <div className="p-4 space-y-1">
                <form onSubmit={doSearch} className="mb-3">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
                    <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="بحث..." className="bg-white border-2 border-black text-black pr-10 h-10 rounded-none" />
                  </div>
                </form>
                {NAV.map((n) => (
                  <button key={n.to} onClick={() => goTo(n.to)}
                    className="w-full text-right px-3 py-3 flex items-center gap-2 text-sm text-black hover:bg-blue-600 hover:text-white border-2 border-transparent hover:border-blue-600 font-bold">
                    <n.icon className="w-4 h-4" /> {n.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet context={{ identity }} />
      </main>

      <button onClick={() => setAssistantOpen(true)} aria-label="مساعد بات شارك"
        className="fixed bottom-5 left-5 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white border-2 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center transition-colors">
        <Bot className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {assistantOpen && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-24 left-5 z-40 w-[min(380px,calc(100vw-2rem))] h-[480px] bg-white border-2 border-black shadow-[6px_6px_0_0_#000] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b-2 border-black bg-blue-600 text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <div className="text-sm font-bold">مساعد بات شارك</div>
              </div>
              <button onClick={() => setAssistantOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] px-3 py-2 text-sm border-2 ${m.role === 'user' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-black text-black'}`}>
                    {m.content}
                    {(m as any).suggestions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(m as any).suggestions.map((s: string, j: number) => (
                          <button key={j} onClick={() => setChatInput(s)}
                            className="text-[11px] px-2 py-1 border-2 border-black bg-white hover:bg-black hover:text-white font-bold">{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-xs text-black/60">يفكر...</div>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="p-2 border-t-2 border-black flex gap-2 bg-white">
              <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="اسأل أو وجّهني..." className="bg-white border-2 border-black text-sm h-10 rounded-none" />
              <Button type="submit" size="sm" disabled={chatLoading} className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-black rounded-none font-bold"><Send className="w-4 h-4" /></Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
