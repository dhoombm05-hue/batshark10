import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Layers, ExternalLink, Eye, Pencil, Globe2, Lock, Database, Server, Monitor,
  Activity, ShieldCheck, Trash2, RefreshCw, Copy, Sparkles, KeyRound, BarChart3,
} from 'lucide-react';

type Platform = any;

/**
 * Professional Black & White Linked Platforms management panel.
 * Used both inside /b99 (sidebar) and inside the main BatShark Economy app sidebar.
 *
 * Pass the current authenticated userId. If null/undefined, the panel shows a login gate.
 * If `ownerOverride=true` (CEO), shows ALL platforms.
 */
export default function LinkedPlatformsPanel({
  userId,
  ownerOverride = false,
}: {
  userId?: string | null;
  ownerOverride?: boolean;
}) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Platform | null>(null);
  const [view, setView] = useState<'frontend' | 'backend'>('frontend');

  const load = async () => {
    setLoading(true);
    let q = supabase.from('generated_platforms').select('*').order('created_at', { ascending: false });
    if (!ownerOverride && userId) q = q.eq('user_id', userId);
    const { data, error } = await q;
    if (!error) {
      setPlatforms(data || []);
      setActive((curr) => curr ?? data?.[0] ?? null);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId, ownerOverride]);

  const updateField = async (id: string, patch: Partial<Platform>) => {
    const { error } = await supabase.from('generated_platforms').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('حُفظ التغيير');
    setPlatforms(p => p.map(x => x.id === id ? { ...x, ...patch } : x));
    if (active?.id === id) setActive({ ...active, ...patch });
  };

  const remove = async (id: string) => {
    if (!confirm('حذف نهائي للمنصة وكل بياناتها؟')) return;
    const { error } = await supabase.from('generated_platforms').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('تم الحذف');
    setPlatforms(p => p.filter(x => x.id !== id));
    if (active?.id === id) setActive(null);
  };

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success('تم النسخ'); };

  if (!userId && !ownerOverride) {
    return (
      <Card className="border-2 border-black bg-white p-8 text-center">
        <Lock className="w-10 h-10 mx-auto text-black mb-3" />
        <h2 className="text-xl font-black text-black">سجّل الدخول لإدارة منصاتك المربوطة</h2>
        <p className="text-sm text-neutral-700 mt-2">هذه اللوحة خاصة بمالك المنصات فقط — لا يمكن للزوار رؤيتها أو التعديل عليها.</p>
        <Button asChild className="mt-5 bg-black text-white hover:bg-neutral-800 font-bold">
          <Link to="/login">دخول الآن</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* HEADER — pure B/W with one subtle accent */}
      <Card className="relative overflow-hidden border-2 border-black bg-white p-6 rounded-2xl shadow-[6px_6px_0_0_#000]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="mb-2 bg-black text-white border-0 rounded-md text-[10px] tracking-[0.2em] font-black">LINKED PLATFORMS</Badge>
            <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-black text-black">
              <Layers className="w-7 h-7" /> منصاتك المربوطة
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-700 leading-relaxed font-medium">
              إدارة احترافية لكل المواقع التي بنيتها — Frontend (الواجهة) و Backend (البنية والإعدادات والربط) من مكان واحد، بأسلوب أبيض/أسود نظيف.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={load} variant="outline" className="border-2 border-black bg-white text-black hover:bg-black hover:text-white font-bold gap-1 rounded-lg">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> تحديث
            </Button>
            <Button asChild className="bg-black text-white hover:bg-neutral-800 font-black gap-1 rounded-lg shadow-[3px_3px_0_0_#000]">
              <Link to="/b99/platforms"><Sparkles className="w-4 h-4" /> منصة جديدة</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* SIDEBAR LIST — clean white cards on white */}
        <Card className="border-2 border-black bg-white p-3 rounded-2xl shadow-[4px_4px_0_0_#000]">
          <div className="px-2 py-2 text-[11px] font-black tracking-[0.2em] text-black border-b-2 border-black mb-2">
            القائمة ({platforms.length})
          </div>
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
            {loading && <div className="text-xs text-neutral-500 px-2 py-3 font-bold">يحمّل...</div>}
            {!loading && platforms.length === 0 && (
              <div className="text-xs text-neutral-600 px-2 py-3 font-medium">
                لم تنشئ أي منصة بعد. <Link to="/b99/platforms" className="text-black underline font-black">ابدأ هنا</Link>
              </div>
            )}
            {platforms.map(p => {
              const isActive = active?.id === p.id;
              return (
                <button key={p.id} onClick={() => setActive(p)}
                  className={`w-full text-right p-3 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-neutral-300 hover:border-black hover:shadow-[2px_2px_0_0_#000]'
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-black truncate">{p.name}</div>
                    <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded ${isActive ? 'bg-white text-black' : 'bg-black text-white'}`}>
                      {p.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className={`text-[10px] truncate font-mono mt-0.5 ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>/p/{p.slug}</div>
                  <div className={`flex items-center gap-2 mt-2 text-[10px] font-bold ${isActive ? 'text-neutral-200' : 'text-neutral-700'}`}>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.views ?? 0}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {p.is_public ? <Globe2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {p.is_public ? 'عامة' : 'محمية'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* DETAIL */}
        <div className="space-y-4">
          {!active && (
            <Card className="border-2 border-dashed border-black bg-white p-12 text-center text-black text-sm font-bold rounded-2xl">
              اختر منصة من القائمة لعرض تفاصيلها وإدارتها.
            </Card>
          )}

          <AnimatePresence mode="wait">
            {active && (
              <motion.div key={active.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-2 border-black bg-white p-5 rounded-2xl shadow-[4px_4px_0_0_#000]">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b-2 border-black">
                    <div>
                      <div className="text-[11px] tracking-[0.25em] text-neutral-600 font-black">PLATFORM</div>
                      <h2 className="text-2xl font-black text-black">{active.name}</h2>
                      <div className="text-xs text-neutral-700 font-medium mt-0.5">{active.tagline}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button asChild variant="outline" className="border-2 border-black bg-white text-black hover:bg-black hover:text-white font-bold gap-1 rounded-lg">
                        <a href={`/p/${active.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /> فتح</a>
                      </Button>
                      <Button asChild className="bg-black text-white hover:bg-neutral-800 font-bold gap-1 rounded-lg">
                        <Link to={`/p/${active.slug}/edit`}><Pencil className="w-4 h-4" /> تحرير المحتوى</Link>
                      </Button>
                      <Button onClick={() => remove(active.id)} variant="outline" className="border-2 border-black bg-white text-black hover:bg-red-600 hover:text-white hover:border-red-600 font-bold gap-1 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* TABS — strong black/white */}
                  <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                    <TabsList className="bg-white border-2 border-black rounded-lg p-1 h-auto gap-1">
                      <TabsTrigger
                        value="frontend"
                        className="data-[state=active]:bg-black data-[state=active]:text-white text-black font-black gap-1 rounded-md px-4 py-2"
                      >
                        <Monitor className="w-4 h-4" /> Frontend
                      </TabsTrigger>
                      <TabsTrigger
                        value="backend"
                        className="data-[state=active]:bg-black data-[state=active]:text-white text-black font-black gap-1 rounded-md px-4 py-2"
                      >
                        <Server className="w-4 h-4" /> Backend
                      </TabsTrigger>
                    </TabsList>

                    {/* FRONTEND */}
                    <TabsContent value="frontend" className="mt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatBox icon={Eye} label="المشاهدات" value={String(active.views ?? 0)} />
                        <StatBox icon={BarChart3} label="عدد الصفحات" value={String((active.pages || []).length)} />
                        <StatBox icon={Activity} label="الحالة" value={active.status} />
                      </div>

                      <div className="rounded-xl border-2 border-black bg-white overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-black bg-black">
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
                          <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                          <div className="text-[10px] text-white font-mono mx-auto tracking-wider">{location.host}/p/{active.slug}</div>
                        </div>
                        <iframe title="frontend-preview" src={`/p/${active.slug}`} className="w-full h-[460px] bg-white" />
                      </div>

                      <Card className="border-2 border-black bg-white p-4 rounded-xl">
                        <h3 className="text-sm font-black text-black mb-3 flex items-center gap-2 pb-2 border-b border-black">
                          <Monitor className="w-4 h-4" /> إعدادات الواجهة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <RowEdit label="اسم المنصة" value={active.name} onSave={(v) => updateField(active.id, { name: v })} />
                          <RowEdit label="الشعار/الوصف" value={active.tagline || ''} onSave={(v) => updateField(active.id, { tagline: v })} />
                          <RowSwitch label="عامة للزوار" checked={!!active.is_public} onChange={(v) => updateField(active.id, { is_public: v })} />
                          <RowEdit label="رمز دخول الزوار" value={active.access_code || ''} placeholder="فارغ = عامة" onSave={(v) => updateField(active.id, { access_code: v || null })} />
                        </div>
                      </Card>
                    </TabsContent>

                    {/* BACKEND */}
                    <TabsContent value="backend" className="mt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatBox icon={Database} label="نوع المنصة" value={active.platform_type} />
                        <StatBox icon={ShieldCheck} label="الملكية" value={active.owner_password ? 'مفعّلة' : 'غير مفعّلة'} />
                        <StatBox icon={KeyRound} label="معروضة للبيع" value={active.is_for_sale ? `${active.sale_price} ر.س` : 'لا'} />
                      </div>

                      <Card className="border-2 border-black bg-white p-4 rounded-xl">
                        <h3 className="text-sm font-black text-black mb-3 flex items-center gap-2 pb-2 border-b border-black">
                          <Server className="w-4 h-4" /> الربط والباكند
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <RowEdit label="رابط الباكند" value={active.backend_link || ''} placeholder="batshark99 أو URL خارجي" onSave={(v) => updateField(active.id, { backend_link: v })} />
                          <RowEdit label="إيميل المالك" value={active.owner_email || ''} onSave={(v) => updateField(active.id, { owner_email: v })} />
                          <RowEdit label="رمز الملكية" value={active.owner_password || ''} placeholder="يُمنح للمشتري عند البيع" onSave={(v) => updateField(active.id, { owner_password: v || null })} />
                          <RowSwitch label="معروضة للبيع" checked={!!active.is_for_sale} onChange={(v) => updateField(active.id, { is_for_sale: v })} />
                          {active.is_for_sale && (
                            <RowEdit label="سعر البيع (ر.س)" value={String(active.sale_price ?? 0)} onSave={(v) => updateField(active.id, { sale_price: Number(v) || 0 })} />
                          )}
                        </div>
                      </Card>

                      <Card className="border-2 border-black bg-white p-4 rounded-xl">
                        <h3 className="text-sm font-black text-black mb-3 flex items-center gap-2 pb-2 border-b border-black">
                          <Database className="w-4 h-4" /> الروابط والمعرفات
                        </h3>
                        <div className="space-y-2 text-xs">
                          <KV k="رابط عام" v={`${location.origin}/p/${active.slug}`} onCopy={copy} />
                          <KV k="معرّف الموقع" v={active.id} onCopy={copy} />
                          <KV k="نمط البناء" v={active.layout_mode} />
                          <KV k="مستوى البناء" v={active.build_level} />
                          <KV k="آخر تحديث" v={new Date(active.updated_at).toLocaleString('ar-SA')} />
                        </div>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }: any) {
  return (
    <Card className="border-2 border-black bg-white p-3 flex items-center gap-3 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-neutral-600 font-black tracking-wider uppercase">{label}</div>
        <div className="text-sm font-black text-black truncate">{value}</div>
      </div>
    </Card>
  );
}

function RowEdit({ label, value, onSave, placeholder }: { label: string; value: string; onSave: (v: string) => void; placeholder?: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <div className="text-[11px] text-black mb-1 font-black tracking-wider uppercase">{label}</div>
      <div className="flex gap-1.5">
        <Input value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} className="bg-white border-2 border-black text-black placeholder:text-neutral-400 font-medium" />
        {v !== value && (
          <Button size="sm" onClick={() => onSave(v)} className="bg-black text-white hover:bg-neutral-800 font-black">حفظ</Button>
        )}
      </div>
    </div>
  );
}

function RowSwitch({ label, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between rounded-xl border-2 border-black bg-white px-3 py-2.5">
      <div className="text-[12px] text-black font-black uppercase tracking-wider">{label}</div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function KV({ k, v, onCopy }: { k: string; v: string; onCopy?: (s: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white border-2 border-black px-3 py-2">
      <div className="text-black font-black text-[11px] uppercase tracking-wider">{k}</div>
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-black truncate max-w-[280px] font-mono">{v}</code>
        {onCopy && <button onClick={() => onCopy(v)} className="text-black hover:bg-black hover:text-white p-1 rounded transition"><Copy className="w-3.5 h-3.5" /></button>}
      </div>
    </div>
  );
}
