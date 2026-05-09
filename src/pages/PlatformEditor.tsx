import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Lock, Save, ArrowRight, Eye, Palette, Plus, Trash2, Globe, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PRESET_PALETTES = [
  { name: 'فخامة ذهبية', primary: '#d4af37', accent: '#1a1a1a' },
  { name: 'بنفسجي عصري', primary: '#8b5cf6', accent: '#06b6d4' },
  { name: 'أخضر طبيعي', primary: '#10b981', accent: '#84cc16' },
  { name: 'أزرق احترافي', primary: '#3b82f6', accent: '#0ea5e9' },
  { name: 'وردي حيوي', primary: '#ec4899', accent: '#f59e0b' },
  { name: 'كحلي تقني', primary: '#1e3a8a', accent: '#22d3ee' },
  { name: 'أحمر جريء', primary: '#dc2626', accent: '#fbbf24' },
  { name: 'مينيمال أسود', primary: '#000000', accent: '#737373' },
];

export default function PlatformEditor() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platform, setPlatform] = useState<any>(null);
  const [pageIdx, setPageIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('generated_platforms')
        .select('id,slug,name,tagline,brand,pages,is_public,backend_link,owner_email')
        .eq('slug', slug!).maybeSingle();
      setPlatform(data);
      setLoading(false);
    })();
  }, [slug]);

  const verify = async () => {
    const { data } = await (supabase as any).rpc('verify_platform_owner', { _slug: slug, _owner_password: password });
    if (data) {
      setAuthorized(true);
      toast.success('مرحباً بك أيها المالك');
    } else {
      toast.error('كلمة سر غير صحيحة');
    }
  };

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('b99-engine', {
      body: {
        action: 'update_platform',
        payload: {
          slug, owner_password: password,
          patch: {
            name: platform.name, tagline: platform.tagline, brand: platform.brand,
            pages: platform.pages, is_public: platform.is_public, backend_link: platform.backend_link,
          },
        },
      },
    });
    setSaving(false);
    if (error || data?.error) { toast.error('فشل الحفظ'); return; }
    toast.success('تم حفظ التغييرات');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">جاري التحميل...</div>;
  if (!platform) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">المنصة غير موجودة</div>;

  if (!authorized) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 p-4">
        <Card className="max-w-md w-full p-8 bg-slate-900/80 backdrop-blur border-amber-500/20">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mb-4 mx-auto">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-white text-center mb-1">دخول المالك</h1>
          <p className="text-xs text-slate-400 text-center mb-5">{platform.name} — أدخل كلمة سر المالك للتعديل</p>
          <Input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verify()}
            placeholder="كلمة سر المالك" className="bg-slate-800 border-white/10 text-white mb-3 text-center"
          />
          <Button onClick={verify} className="w-full bg-amber-600 hover:bg-amber-700">دخول</Button>
          <Link to={`/p/${slug}`} className="block text-center text-xs text-slate-500 hover:text-white mt-4">
            ← عرض الموقع كزائر
          </Link>
        </Card>
      </div>
    );
  }

  const brand = platform.brand || {};
  const setBrand = (k: string, v: string) => setPlatform((p: any) => ({ ...p, brand: { ...(p.brand || {}), [k]: v } }));
  const pages = platform.pages || [];
  const cur = pages[pageIdx];
  const updateSection = (sIdx: number, patch: any) => {
    const newPages = [...pages];
    newPages[pageIdx] = { ...cur, sections: cur.sections.map((s: any, i: number) => i === sIdx ? { ...s, ...patch } : s) };
    setPlatform((p: any) => ({ ...p, pages: newPages }));
  };
  const removeSection = (sIdx: number) => {
    const newPages = [...pages];
    newPages[pageIdx] = { ...cur, sections: cur.sections.filter((_: any, i: number) => i !== sIdx) };
    setPlatform((p: any) => ({ ...p, pages: newPages }));
  };
  const addSection = (type: string) => {
    const newPages = [...pages];
    newPages[pageIdx] = { ...cur, sections: [...(cur.sections || []), { type, heading: 'عنوان جديد', body: 'وصف القسم...', items: [] }] };
    setPlatform((p: any) => ({ ...p, pages: newPages }));
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => nav('/b99/platforms')} className="gap-1">
              <ArrowRight className="w-4 h-4" /> رجوع
            </Button>
            <div>
              <div className="text-sm font-black text-slate-900">{platform.name}</div>
              <Badge variant="outline" className="text-[10px]">محرر تصميم — وضع المالك</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(`/p/${slug}`, '_blank')} className="gap-1">
              <Eye className="w-4 h-4" /> معاينة
            </Button>
            <Button size="sm" onClick={save} disabled={saving} className="gap-1 bg-amber-600 hover:bg-amber-700">
              <Save className="w-4 h-4" /> {saving ? 'يحفظ...' : 'حفظ'}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="p-4">
            <div className="text-xs font-black text-slate-500 mb-3 flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> الهوية البصرية</div>
            <label className="text-[11px] text-slate-600">اللون الأساسي</label>
            <div className="flex items-center gap-2 mb-3">
              <input type="color" value={brand.primary_color || '#8b5cf6'} onChange={(e) => setBrand('primary_color', e.target.value)} className="w-12 h-9 rounded border border-slate-200 cursor-pointer" />
              <Input value={brand.primary_color || '#8b5cf6'} onChange={(e) => setBrand('primary_color', e.target.value)} className="text-xs font-mono" />
            </div>
            <label className="text-[11px] text-slate-600">اللون المساعد</label>
            <div className="flex items-center gap-2 mb-3">
              <input type="color" value={brand.accent_color || '#06b6d4'} onChange={(e) => setBrand('accent_color', e.target.value)} className="w-12 h-9 rounded border border-slate-200 cursor-pointer" />
              <Input value={brand.accent_color || '#06b6d4'} onChange={(e) => setBrand('accent_color', e.target.value)} className="text-xs font-mono" />
            </div>
            <label className="text-[11px] text-slate-600">رمز الشعار</label>
            <Input value={brand.logo_emoji || '✨'} onChange={(e) => setBrand('logo_emoji', e.target.value)} className="text-center text-lg mb-3" maxLength={4} />
            <div className="text-[11px] text-slate-600 mb-2">باليتات جاهزة</div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PALETTES.map((p) => (
                <button key={p.name} onClick={() => { setBrand('primary_color', p.primary); setBrand('accent_color', p.accent); }}
                  className="text-right p-2 rounded-lg border border-slate-200 hover:border-amber-400 transition">
                  <div className="flex gap-1 mb-1">
                    <div className="w-4 h-4 rounded" style={{ background: p.primary }} />
                    <div className="w-4 h-4 rounded" style={{ background: p.accent }} />
                  </div>
                  <div className="text-[10px] text-slate-700">{p.name}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-black text-slate-500 mb-3 flex items-center gap-1"><Database className="w-3.5 h-3.5" /> الباكند والربط</div>
            <label className="text-[11px] text-slate-600">رابط قاعدة البيانات الخاصة (اختياري)</label>
            <Input value={platform.backend_link || ''} onChange={(e) => setPlatform({ ...platform, backend_link: e.target.value })}
              placeholder="https://your-supabase.co أو Firebase..." className="text-xs mb-3" />
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={!!platform.is_public} onChange={(e) => setPlatform({ ...platform, is_public: e.target.checked })} />
              <Globe className="w-3.5 h-3.5" /> الموقع متاح للعامة
            </label>
          </Card>

          <Card className="p-3">
            <div className="text-xs font-black text-slate-500 mb-2">الصفحات</div>
            <div className="space-y-1">
              {pages.map((p: any, i: number) => (
                <button key={i} onClick={() => setPageIdx(i)}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm transition ${i === pageIdx ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {p.title}
                </button>
              ))}
            </div>
          </Card>
        </aside>

        {/* Main editor */}
        <main className="space-y-4">
          <Card className="p-5">
            <label className="text-[11px] text-slate-500 font-bold">اسم المنصة</label>
            <Input value={platform.name} onChange={(e) => setPlatform({ ...platform, name: e.target.value })} className="text-lg font-black mb-3" />
            <label className="text-[11px] text-slate-500 font-bold">الشعار/الوصف القصير</label>
            <Input value={platform.tagline || ''} onChange={(e) => setPlatform({ ...platform, tagline: e.target.value })} />
          </Card>

          {cur && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-black text-slate-900">أقسام صفحة: {cur.title}</div>
                <div className="flex gap-1">
                  {['hero', 'features', 'pricing', 'stats', 'testimonials', 'faq', 'gallery', 'cta', 'contact'].map((t) => (
                    <button key={t} onClick={() => addSection(t)}
                      className="text-[10px] px-2 py-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700">+{t}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {(cur.sections || []).map((s: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px]">{s.type}</Badge>
                      <button onClick={() => removeSection(i)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <Input value={s.heading || ''} onChange={(e) => updateSection(i, { heading: e.target.value })}
                      placeholder="العنوان" className="font-bold mb-2" />
                    <Textarea value={s.body || ''} onChange={(e) => updateSection(i, { body: e.target.value })}
                      placeholder="النص" rows={2} className="text-sm mb-2" />
                    {Array.isArray(s.items) && s.items.length > 0 && (
                      <div className="space-y-1.5 pl-3 border-r-2 border-slate-200">
                        {s.items.map((it: any, k: number) => (
                          <div key={k} className="grid grid-cols-3 gap-1.5">
                            <Input value={it.title || ''} onChange={(e) => {
                              const items = [...s.items]; items[k] = { ...it, title: e.target.value };
                              updateSection(i, { items });
                            }} placeholder="عنوان" className="text-xs h-8" />
                            <Input value={it.desc || ''} onChange={(e) => {
                              const items = [...s.items]; items[k] = { ...it, desc: e.target.value };
                              updateSection(i, { items });
                            }} placeholder="وصف" className="text-xs h-8" />
                            <Input value={it.value || ''} onChange={(e) => {
                              const items = [...s.items]; items[k] = { ...it, value: e.target.value };
                              updateSection(i, { items });
                            }} placeholder="قيمة" className="text-xs h-8" />
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => updateSection(i, { items: [...(s.items || []), { title: '', desc: '', value: '' }] })}
                      className="mt-2 text-[10px] text-amber-700 hover:text-amber-900 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> أضف عنصر
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
