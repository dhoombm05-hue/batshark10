import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Lucide from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export default function PlatformView() {
  const { slug } = useParams();
  const [platform, setPlatform] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageIdx, setPageIdx] = useState(0);
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState('');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('generated_platforms').select('*').eq('slug', slug!).maybeSingle();
      setLoading(false);
      if (error || !data) return;
      setPlatform(data);
      if (data.access_code && !data.is_public) setNeedsCode(true); else setAuthorized(true);
      // increment views
      supabase.from('generated_platforms').update({ views: (data.views || 0) + 1 }).eq('id', data.id);
    })();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">جاري التحميل...</div>;
  if (!platform) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <Card className="p-8 text-center max-w-md bg-slate-900 border-white/10">
        <h1 className="text-2xl font-bold mb-2">المنصة غير موجودة</h1>
        <p className="text-sm text-slate-400 mb-4">قد يكون الرابط خاطئاً أو تم حذف المنصة.</p>
        <Button asChild><Link to="/b99">عودة لـ Batshark 99</Link></Button>
      </Card>
    </div>
  );

  if (needsCode && !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6" dir="rtl">
        <Card className="p-8 max-w-md w-full bg-slate-900 border-white/10">
          <Lucide.Lock className="w-10 h-10 mx-auto text-amber-400 mb-3" />
          <h1 className="text-xl font-bold text-center mb-1">{platform.name}</h1>
          <p className="text-xs text-slate-400 text-center mb-4">منصة محمية — أدخل رمز المرور</p>
          <Input type="password" value={code} onChange={(e) => setCode(e.target.value)} className="bg-slate-800 border-white/10 mb-3" />
          <Button onClick={() => { if (code === platform.access_code) setAuthorized(true); else alert('رمز غير صحيح'); }} className="w-full">دخول</Button>
        </Card>
      </div>
    );
  }

  const brand = platform.brand || {};
  const primary = brand.primary_color || '#8b5cf6';
  const accent = brand.accent_color || '#06b6d4';
  const pages = platform.pages || [];
  const currentPage = pages[pageIdx];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white" style={{ '--brand-p': primary, '--brand-a': accent } as any}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-lg" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
              {brand.logo_emoji || '✨'}
            </div>
            <div>
              <div className="font-black text-lg">{platform.name}</div>
              {platform.tagline && <div className="text-[10px] text-slate-400">{platform.tagline}</div>}
            </div>
          </div>
          <nav className="hidden md:flex gap-1">
            {pages.map((p: any, i: number) => {
              const Icon = (Lucide as any)[p.icon] || Lucide.Circle;
              return (
                <button key={i} onClick={() => setPageIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${i === pageIdx ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  style={i === pageIdx ? { background: `linear-gradient(135deg, ${primary}40, ${accent}40)` } : {}}>
                  <Icon className="w-4 h-4" /> {p.title}
                </button>
              );
            })}
          </nav>
          <div className="text-[10px] text-slate-500">
            <Link to="/b99" className="hover:text-white">Powered by Batshark 99</Link>
          </div>
        </div>
        {/* mobile tabs */}
        <div className="md:hidden border-t border-white/5 overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            {pages.map((p: any, i: number) => (
              <button key={i} onClick={() => setPageIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${i === pageIdx ? 'bg-white/10 text-white' : 'text-slate-400'}`}>
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </header>

      <motion.main key={pageIdx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {currentPage?.sections?.map((s: any, i: number) => (
          <SectionRenderer key={i} section={s} primary={primary} accent={accent} />
        ))}
      </motion.main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        © {platform.name} — منصة مولّدة عبر <Link to="/b99" className="text-violet-300 hover:text-white">Batshark 99</Link>
      </footer>
    </div>
  );
}

function SectionRenderer({ section, primary, accent }: any) {
  const grad = `linear-gradient(135deg, ${primary}, ${accent})`;
  switch (section.type) {
    case 'hero':
      return (
        <section className="text-center py-16 relative">
          <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(circle at 50% 30%, ${primary}30, transparent 70%)` }} />
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight" style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{section.heading}</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">{section.body}</p>
          {section.items?.[0]?.title && (
            <Button className="mt-6 text-white" style={{ background: grad }} size="lg">{section.items[0].title}</Button>
          )}
        </section>
      );
    case 'features':
      return (
        <section>
          <h2 className="text-3xl font-black text-center mb-2">{section.heading}</h2>
          {section.body && <p className="text-center text-slate-400 mb-8">{section.body}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {section.items?.map((it: any, i: number) => (
              <Card key={i} className="bg-white/[0.04] border-white/10 p-5">
                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-xl" style={{ background: `${primary}25` }}>✦</div>
                <h3 className="font-bold mb-1">{it.title}</h3>
                <p className="text-sm text-slate-400">{it.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      );
    case 'pricing':
      return (
        <section>
          <h2 className="text-3xl font-black text-center mb-2">{section.heading}</h2>
          {section.body && <p className="text-center text-slate-400 mb-8">{section.body}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {section.items?.map((it: any, i: number) => (
              <Card key={i} className={`bg-white/[0.04] border p-6 ${i === 1 ? 'border-violet-500/50 shadow-xl' : 'border-white/10'}`}>
                <h3 className="font-bold text-lg">{it.title}</h3>
                <div className="text-3xl font-black my-3" style={{ color: i === 1 ? accent : 'white' }}>{it.value}</div>
                <p className="text-sm text-slate-400">{it.desc}</p>
                <Button className="w-full mt-4 text-white" style={{ background: i === 1 ? grad : 'rgba(255,255,255,0.1)' }}>اختر</Button>
              </Card>
            ))}
          </div>
        </section>
      );
    case 'stats':
      return (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {section.items?.map((it: any, i: number) => (
            <Card key={i} className="bg-white/[0.04] border-white/10 p-5 text-center">
              <div className="text-3xl font-black" style={{ color: accent }}>{it.value}</div>
              <div className="text-xs text-slate-400 mt-1">{it.title}</div>
            </Card>
          ))}
        </section>
      );
    case 'testimonials':
      return (
        <section>
          <h2 className="text-3xl font-black text-center mb-8">{section.heading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.items?.map((it: any, i: number) => (
              <Card key={i} className="bg-white/[0.04] border-white/10 p-5">
                <p className="text-sm italic text-slate-300">"{it.desc}"</p>
                <div className="text-xs font-bold mt-3" style={{ color: accent }}>— {it.title}</div>
              </Card>
            ))}
          </div>
        </section>
      );
    case 'faq':
      return (
        <section>
          <h2 className="text-3xl font-black text-center mb-8">{section.heading}</h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {section.items?.map((it: any, i: number) => (
              <details key={i} className="bg-white/[0.04] border border-white/10 rounded-lg p-4 group">
                <summary className="font-bold cursor-pointer">{it.title}</summary>
                <p className="text-sm text-slate-400 mt-2">{it.desc}</p>
              </details>
            ))}
          </div>
        </section>
      );
    case 'cta':
      return (
        <section className="text-center py-12 rounded-2xl" style={{ background: `linear-gradient(135deg, ${primary}20, ${accent}20)` }}>
          <h2 className="text-3xl font-black mb-3">{section.heading}</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">{section.body}</p>
          <Button size="lg" className="text-white" style={{ background: grad }}>{section.items?.[0]?.title || 'ابدأ الآن'}</Button>
        </section>
      );
    case 'contact':
      return (
        <section>
          <h2 className="text-3xl font-black text-center mb-8">{section.heading}</h2>
          <Card className="max-w-xl mx-auto bg-white/[0.04] border-white/10 p-6 space-y-3">
            <Input placeholder="الاسم" className="bg-slate-900/60 border-white/10" />
            <Input placeholder="الإيميل" className="bg-slate-900/60 border-white/10" />
            <textarea placeholder="الرسالة" rows={4} className="w-full bg-slate-900/60 border border-white/10 rounded-md p-3 text-sm" />
            <Button className="w-full text-white" style={{ background: grad }}>إرسال</Button>
          </Card>
        </section>
      );
    case 'gallery':
      return (
        <section>
          <h2 className="text-3xl font-black text-center mb-8">{section.heading}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {section.items?.map((it: any, i: number) => (
              <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-center p-3" style={{ background: `linear-gradient(135deg, ${primary}30, ${accent}30)` }}>
                <div>
                  <div className="text-2xl mb-2">🖼️</div>
                  <div className="text-xs font-bold">{it.title}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    default:
      return (
        <section>
          {section.heading && <h2 className="text-2xl font-black mb-3">{section.heading}</h2>}
          {section.body && <p className="text-slate-300">{section.body}</p>}
        </section>
      );
  }
}
