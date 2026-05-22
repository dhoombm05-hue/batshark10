import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Lucide from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

/* ============================================================
   منصة احترافية مولّدة — تتنوع حسب نوع المنصة (ecommerce / booking / service / landing)
   لكل منصة هوية مستقلة، تنقل خاص، أقسام حقيقية، وعناصر تفاعلية بسيطة (سلة، حجز، تواصل)
   ============================================================ */

type Platform = any;

export default function PlatformView() {
  const { slug } = useParams();
  const [platform, setPlatform] = useState<Platform>(null);
  const [loading, setLoading] = useState(true);
  const [pageIdx, setPageIdx] = useState(0);
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('generated_platforms')
        .select('id,user_id,owner_email,slug,name,tagline,platform_type,is_public,brand,pages,features,meta,status,views,requirements,build_level,build_mode,created_at,updated_at')
        .eq('slug', slug!)
        .maybeSingle();
      setLoading(false);
      if (error || !data) return;
      setPlatform(data);
      if (!data.is_public) setNeedsCode(true); else setAuthorized(true);
      supabase.from('generated_platforms').update({ views: (data.views || 0) + 1 }).eq('id', data.id);
    })();
  }, [slug]);

  const brand = platform?.brand || {};
  const primary = brand.primary_color || '#2563eb';
  const accent = brand.accent_color || '#10b981';
  const type = (platform?.platform_type || 'landing').toLowerCase();
  const theme = useMemo(() => themeFor(type, primary, accent), [type, primary, accent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm font-bold">جاري فتح المنصة...</div>
        </div>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black p-6">
        <Card className="p-8 text-center max-w-md border-2 border-black rounded-none shadow-[6px_6px_0_0_#000]">
          <Lucide.AlertCircle className="w-10 h-10 mx-auto text-red-600 mb-3" />
          <h1 className="text-2xl font-black mb-2">المنصة غير موجودة</h1>
          <p className="text-sm text-black/60 mb-4">الرابط خاطئ أو تم حذف المنصة.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-none border-2 border-black"><Link to="/b99">عودة لـ Batshark 99</Link></Button>
        </Card>
      </div>
    );
  }

  if (needsCode && !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black p-6" dir="rtl">
        <Card className="p-8 max-w-md w-full border-2 border-black rounded-none shadow-[6px_6px_0_0_#000]">
          <Lucide.Lock className="w-10 h-10 mx-auto text-blue-600 mb-3" />
          <h1 className="text-xl font-black text-center mb-1">{platform.name}</h1>
          <p className="text-xs text-black/60 text-center mb-4">منصة محمية — أدخل رمز المرور</p>
          <Input type="password" value={code} onChange={(e) => setCode(e.target.value)} className="border-2 border-black rounded-none mb-3 h-11" />
          <Button onClick={async () => {
            const { data } = await (supabase as any).rpc('verify_platform_access', { _slug: platform.slug, _access_code: code });
            if (data) setAuthorized(true); else alert('رمز غير صحيح');
          }} className="w-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-black rounded-none font-bold">دخول</Button>
        </Card>
      </div>
    );
  }

  const pages = platform.pages || [];
  const currentPage = pages[pageIdx];
  const features = platform.features || [];

  return (
    <div dir="rtl" className={`min-h-screen ${theme.bg} ${theme.text}`} style={{ ['--brand-p' as any]: primary, ['--brand-a' as any]: accent }}>
      {/* HEADER — يتغير الشكل حسب النوع */}
      <header className={`sticky top-0 z-40 ${theme.header} border-b-2 ${theme.borderHard}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 flex items-center justify-center text-2xl border-2 border-black" style={{ background: theme.logoStyle === 'gradient' ? `linear-gradient(135deg, ${primary}, ${accent})` : primary }}>
              <span className="drop-shadow-[1px_1px_0_#000]">{brand.logo_emoji || theme.fallbackEmoji}</span>
            </div>
            <div className="leading-tight">
              <div className="font-black text-lg">{platform.name}</div>
              {platform.tagline && <div className="text-[10px] opacity-70">{platform.tagline}</div>}
            </div>
          </div>
          <nav className="hidden md:flex gap-1">
            {pages.map((p: any, i: number) => {
              const Icon = (Lucide as any)[p.icon] || Lucide.Circle;
              const active = i === pageIdx;
              return (
                <button key={i} onClick={() => setPageIdx(i)}
                  className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 border-2 transition-colors ${active ? `${theme.navActiveBg} ${theme.navActiveText} ${theme.navActiveBorder}` : 'border-transparent hover:border-current opacity-70 hover:opacity-100'}`}>
                  <Icon className="w-3.5 h-3.5" /> {p.title}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {type === 'ecommerce' && (
              <button className="relative p-2 border-2 border-black bg-white text-black">
                <Lucide.ShoppingBag className="w-4 h-4" />
                {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] bg-red-600 text-white rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
              </button>
            )}
            {type === 'booking' && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white border-2 border-black rounded-none font-bold text-xs h-9 gap-1">
                <Lucide.Calendar className="w-3.5 h-3.5" /> احجز الآن
              </Button>
            )}
          </div>
        </div>
        {/* mobile tabs */}
        <div className="md:hidden border-t-2 border-black overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            {pages.map((p: any, i: number) => (
              <button key={i} onClick={() => setPageIdx(i)}
                className={`px-3 py-1.5 text-xs whitespace-nowrap border-2 ${i === pageIdx ? `${theme.navActiveBg} ${theme.navActiveText} ${theme.navActiveBorder}` : 'border-transparent opacity-70'}`}>
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </header>

      <motion.main key={pageIdx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {currentPage?.sections?.map((s: any, i: number) => (
          <SectionRenderer key={i} section={s} primary={primary} accent={accent} type={type} theme={theme}
            onAddToCart={(item: any) => setCart((c) => [...c, item])} />
        ))}

        {/* خصائص ذكية تظهر فقط على الصفحة الأولى */}
        {pageIdx === 0 && features.length > 0 && (
          <section className={`p-6 border-2 ${theme.borderHard} ${theme.cardBg}`}>
            <h3 className="font-black text-lg mb-3 flex items-center gap-2"><Lucide.Zap className="w-5 h-5" style={{ color: accent }} /> ميزات هذه المنصة</h3>
            <div className="flex flex-wrap gap-2">
              {features.map((f: string, i: number) => (
                <Badge key={i} className={`${theme.tagBg} ${theme.tagText} border-2 border-black rounded-none px-3 py-1 text-xs font-bold`}>{f}</Badge>
              ))}
            </div>
          </section>
        )}
      </motion.main>

      <footer className={`border-t-2 ${theme.borderHard} py-6 text-center text-xs opacity-70`}>
        © {new Date().getFullYear()} {platform.name} — منصة مستقلة بُنيت عبر <Link to="/b99" className="font-bold underline">Batshark 99</Link>
      </footer>
    </div>
  );
}

/* ===== Theme presets per platform type ===== */
function themeFor(type: string, primary: string, accent: string) {
  if (type === 'ecommerce') {
    return {
      bg: 'bg-white', text: 'text-black',
      header: 'bg-white', borderHard: 'border-black',
      cardBg: 'bg-white',
      navActiveBg: 'bg-black', navActiveText: 'text-white', navActiveBorder: 'border-black',
      tagBg: 'bg-amber-100', tagText: 'text-black',
      logoStyle: 'solid', fallbackEmoji: '🛍️',
      heroLayout: 'split',
    };
  }
  if (type === 'booking') {
    return {
      bg: 'bg-emerald-50', text: 'text-black',
      header: 'bg-white', borderHard: 'border-black',
      cardBg: 'bg-white',
      navActiveBg: 'bg-green-600', navActiveText: 'text-white', navActiveBorder: 'border-green-600',
      tagBg: 'bg-green-100', tagText: 'text-green-900',
      logoStyle: 'gradient', fallbackEmoji: '🎾',
      heroLayout: 'centered-cta',
    };
  }
  if (type === 'service') {
    return {
      bg: 'bg-blue-50', text: 'text-black',
      header: 'bg-white', borderHard: 'border-black',
      cardBg: 'bg-white',
      navActiveBg: 'bg-blue-600', navActiveText: 'text-white', navActiveBorder: 'border-blue-600',
      tagBg: 'bg-blue-100', tagText: 'text-blue-900',
      logoStyle: 'gradient', fallbackEmoji: '🛠️',
      heroLayout: 'centered',
    };
  }
  // landing default
  return {
    bg: 'bg-white', text: 'text-black',
    header: 'bg-white', borderHard: 'border-black',
    cardBg: 'bg-white',
    navActiveBg: 'bg-blue-600', navActiveText: 'text-white', navActiveBorder: 'border-blue-600',
    tagBg: 'bg-slate-100', tagText: 'text-black',
    logoStyle: 'gradient', fallbackEmoji: '✨',
    heroLayout: 'centered',
  };
}

function SectionRenderer({ section, primary, accent, type, theme, onAddToCart }: any) {
  switch (section.type) {
    case 'hero':
      if (type === 'ecommerce') {
        return (
          <section className={`grid md:grid-cols-2 gap-6 items-center border-2 ${theme.borderHard} p-6 md:p-10`}>
            <div>
              <Badge className="bg-amber-400 text-black border-2 border-black rounded-none mb-3 font-bold">جديد · 2026</Badge>
              <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">{section.heading}</h1>
              <p className="text-base text-black/70 leading-relaxed">{section.body}</p>
              <div className="mt-5 flex gap-2">
                <Button className="bg-black text-white hover:bg-black/90 rounded-none border-2 border-black font-bold h-12 px-6"><Lucide.ShoppingBag className="w-4 h-4 ml-1" /> تسوق الآن</Button>
                <Button variant="outline" className="bg-white text-black rounded-none border-2 border-black font-bold h-12 px-6">شاهد الكتالوج</Button>
              </div>
            </div>
            <div className="aspect-square border-2 border-black flex items-center justify-center text-9xl" style={{ background: `linear-gradient(135deg, ${primary}30, ${accent}30)` }}>
              🛍️
            </div>
          </section>
        );
      }
      if (type === 'booking') {
        return (
          <section className={`text-center py-14 border-2 ${theme.borderHard}`} style={{ background: `linear-gradient(135deg, ${primary}15, ${accent}15)` }}>
            <Badge className="bg-green-600 text-white border-2 border-black rounded-none mb-4 font-bold">احجز خلال 30 ثانية</Badge>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3 px-4">{section.heading}</h1>
            <p className="text-base text-black/70 max-w-2xl mx-auto px-4">{section.body}</p>
            <div className="mt-6 inline-flex flex-col md:flex-row gap-2 p-2 bg-white border-2 border-black">
              <input type="date" className="px-3 py-2 border-2 border-black text-sm font-bold" />
              <input type="time" className="px-3 py-2 border-2 border-black text-sm font-bold" />
              <Button className="bg-green-600 hover:bg-green-700 text-white rounded-none border-2 border-black font-bold gap-1"><Lucide.Calendar className="w-4 h-4" /> أكّد الحجز</Button>
            </div>
          </section>
        );
      }
      return (
        <section className={`text-center py-14 border-2 ${theme.borderHard}`} style={{ background: `linear-gradient(135deg, ${primary}10, ${accent}10)` }}>
          <h1 className="text-3xl md:text-5xl font-black mb-3 px-4" style={{ color: primary }}>{section.heading}</h1>
          <p className="text-base text-black/70 max-w-2xl mx-auto px-4">{section.body}</p>
          {section.items?.[0]?.title && (
            <Button className="mt-6 text-white rounded-none border-2 border-black font-bold h-12 px-6" style={{ background: primary }}>{section.items[0].title}</Button>
          )}
        </section>
      );

    case 'features':
      return (
        <section>
          <h2 className="text-2xl md:text-3xl font-black text-center mb-2">{section.heading}</h2>
          {section.body && <p className="text-center text-black/60 mb-6">{section.body}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {section.items?.map((it: any, i: number) => (
              <Card key={i} className={`p-5 border-2 ${theme.borderHard} rounded-none ${theme.cardBg} shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000] transition-shadow`}>
                <div className="w-10 h-10 border-2 border-black flex items-center justify-center text-xl mb-3" style={{ background: `${accent}30` }}>✦</div>
                <h3 className="font-black mb-1">{it.title}</h3>
                <p className="text-sm text-black/70 leading-relaxed">{it.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'pricing':
      return (
        <section>
          <h2 className="text-2xl md:text-3xl font-black text-center mb-2">{section.heading}</h2>
          {section.body && <p className="text-center text-black/60 mb-6">{section.body}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {section.items?.map((it: any, i: number) => {
              const featured = i === 1;
              return (
                <Card key={i} className={`p-6 border-2 ${theme.borderHard} rounded-none ${featured ? 'shadow-[6px_6px_0_0_#000]' : 'shadow-[3px_3px_0_0_#000]'} ${theme.cardBg} relative`}>
                  {featured && <Badge className="absolute -top-3 right-4 bg-red-600 text-white border-2 border-black rounded-none font-bold">الأكثر طلباً</Badge>}
                  <h3 className="font-black text-lg">{it.title}</h3>
                  <div className="text-4xl font-black my-3" style={{ color: featured ? accent : primary }}>{it.value}</div>
                  <p className="text-sm text-black/70">{it.desc}</p>
                  <Button className={`w-full mt-4 rounded-none border-2 border-black font-bold ${featured ? 'text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`} style={featured ? { background: primary } : {}}>اختر الباقة</Button>
                </Card>
              );
            })}
          </div>
        </section>
      );

    case 'stats':
      return (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {section.items?.map((it: any, i: number) => (
            <Card key={i} className={`p-5 border-2 ${theme.borderHard} rounded-none ${theme.cardBg} text-center shadow-[3px_3px_0_0_#000]`}>
              <div className="text-3xl md:text-4xl font-black" style={{ color: accent }}>{it.value}</div>
              <div className="text-xs text-black/60 mt-1 font-bold">{it.title}</div>
            </Card>
          ))}
        </section>
      );

    case 'testimonials':
      return (
        <section>
          <h2 className="text-2xl md:text-3xl font-black text-center mb-6">{section.heading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.items?.map((it: any, i: number) => (
              <Card key={i} className={`p-5 border-2 ${theme.borderHard} rounded-none ${theme.cardBg} shadow-[3px_3px_0_0_#000]`}>
                <Lucide.Quote className="w-5 h-5 mb-2" style={{ color: primary }} />
                <p className="text-sm italic text-black/80 leading-relaxed">"{it.desc}"</p>
                <div className="text-xs font-black mt-3" style={{ color: accent }}>— {it.title}</div>
              </Card>
            ))}
          </div>
        </section>
      );

    case 'faq':
      return (
        <section>
          <h2 className="text-2xl md:text-3xl font-black text-center mb-6">{section.heading}</h2>
          <div className="space-y-2 max-w-3xl mx-auto">
            {section.items?.map((it: any, i: number) => (
              <details key={i} className={`border-2 ${theme.borderHard} ${theme.cardBg} p-4 group`}>
                <summary className="font-black cursor-pointer flex items-center justify-between"><span>{it.title}</span><Lucide.Plus className="w-4 h-4 group-open:rotate-45 transition-transform" /></summary>
                <p className="text-sm text-black/70 mt-3 leading-relaxed">{it.desc}</p>
              </details>
            ))}
          </div>
        </section>
      );

    case 'cta':
      return (
        <section className={`text-center py-12 border-2 ${theme.borderHard}`} style={{ background: `linear-gradient(135deg, ${primary}20, ${accent}20)` }}>
          <h2 className="text-2xl md:text-3xl font-black mb-3">{section.heading}</h2>
          <p className="text-black/70 mb-6 max-w-xl mx-auto px-4">{section.body}</p>
          <Button className="text-white rounded-none border-2 border-black font-bold h-12 px-7" style={{ background: primary }}>{section.items?.[0]?.title || 'ابدأ الآن'}</Button>
        </section>
      );

    case 'contact':
      return (
        <section>
          <h2 className="text-2xl md:text-3xl font-black text-center mb-6">{section.heading}</h2>
          <Card className={`max-w-xl mx-auto p-6 border-2 ${theme.borderHard} rounded-none ${theme.cardBg} shadow-[4px_4px_0_0_#000] space-y-3`}>
            <Input placeholder="الاسم" className="border-2 border-black rounded-none h-11" />
            <Input placeholder="الإيميل" type="email" className="border-2 border-black rounded-none h-11" />
            <Input placeholder="رقم الجوال" className="border-2 border-black rounded-none h-11" />
            <textarea placeholder="رسالتك" rows={4} className="w-full border-2 border-black rounded-none p-3 text-sm" />
            <Button className="w-full text-white rounded-none border-2 border-black font-bold h-12" style={{ background: primary }}>إرسال الرسالة</Button>
          </Card>
        </section>
      );

    case 'gallery':
      return (
        <section>
          <h2 className="text-2xl md:text-3xl font-black text-center mb-6">{section.heading}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {section.items?.map((it: any, i: number) => (
              <Card key={i} className={`aspect-square flex items-center justify-center text-center p-3 border-2 ${theme.borderHard} rounded-none shadow-[3px_3px_0_0_#000]`} style={{ background: `linear-gradient(135deg, ${primary}25, ${accent}25)` }}>
                <div>
                  <div className="text-3xl mb-2">🖼️</div>
                  <div className="text-xs font-black">{it.title}</div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      );

    default:
      return (
        <section>
          {section.heading && <h2 className="text-xl md:text-2xl font-black mb-3">{section.heading}</h2>}
          {section.body && <p className="text-black/70 leading-relaxed">{section.body}</p>}
        </section>
      );
  }
}
