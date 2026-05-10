import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
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

export default function B99Linked() {
  const { identity }: any = useOutletContext();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Platform | null>(null);
  const [view, setView] = useState<'frontend' | 'backend'>('frontend');

  const load = async () => {
    setLoading(true);
    let q = supabase.from('generated_platforms').select('*').order('created_at', { ascending: false });
    if (identity?.userId) q = q.eq('user_id', identity.userId);
    const { data, error } = await q;
    if (!error) {
      setPlatforms(data || []);
      if (!active && data?.length) setActive(data[0]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [identity?.userId]);

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

  if (!identity?.userId) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/10 p-6 text-center">
        <Lock className="w-8 h-8 mx-auto text-amber-300 mb-2" />
        <h2 className="text-lg font-black text-white">سجّل الدخول لإدارة منصاتك المربوطة</h2>
        <p className="text-sm text-amber-100 mt-1">هذه اللوحة خاصة بمالك المنصات فقط — لا يمكن للزوار رؤيتها أو التعديل عليها.</p>
        <Button asChild className="mt-4 bg-amber-500 text-slate-900 hover:bg-amber-400 font-bold">
          <Link to="/login">دخول الآن</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/80 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,hsl(280_90%_55%/0.18),transparent_40%),radial-gradient(circle_at_90%_0%,hsl(190_90%_55%/0.18),transparent_40%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="mb-2 border-white/20 bg-white/10 text-white">Linked Platforms · مالك فقط</Badge>
            <h1 className="flex items-center gap-2 text-2xl md:text-4xl font-black">
              <Layers className="w-7 h-7 text-cyan-300" /> المنصات المربوطة
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 leading-relaxed">
              راجع وعدّل كل المواقع التي بنيتها — Frontend (الواجهة) وBackend (البنية والإعدادات والربط) من مكان واحد.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={load} variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white gap-1">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> تحديث
            </Button>
            <Button asChild className="bg-gradient-to-l from-cyan-500 to-violet-500 text-white font-bold gap-1">
              <Link to="/b99/platforms"><Sparkles className="w-4 h-4" /> منصة جديدة</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Sidebar list */}
        <Card className="border-white/15 bg-slate-950/70 p-3">
          <div className="px-2 py-2 text-[11px] font-black tracking-wider text-slate-300">قائمة المنصات ({platforms.length})</div>
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
            {loading && <div className="text-xs text-slate-400 px-2 py-3">يحمّل...</div>}
            {!loading && platforms.length === 0 && (
              <div className="text-xs text-slate-400 px-2 py-3">لم تنشئ أي منصة بعد. <Link to="/b99/platforms" className="text-cyan-300 underline">ابدأ هنا</Link></div>
            )}
            {platforms.map(p => (
              <button key={p.id} onClick={() => setActive(p)}
                className={`w-full text-right p-3 rounded-xl border transition-all ${active?.id === p.id ? 'bg-gradient-to-l from-cyan-500/20 to-violet-500/20 border-cyan-400/40' : 'bg-white/[0.03] border-white/10 hover:border-white/30'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-black text-white truncate">{p.name}</div>
                  <span className="text-[9px] font-black tracking-wider text-emerald-300">{p.status}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">/p/{p.slug}</div>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.views ?? 0}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">{p.is_public ? <Globe2 className="w-3 h-3 text-cyan-300" /> : <Lock className="w-3 h-3 text-amber-300" />} {p.is_public ? 'عامة' : 'محمية'}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Detail */}
        <div className="space-y-4">
          {!active && (
            <Card className="border-white/15 bg-white/[0.03] p-10 text-center text-slate-300 text-sm">
              اختر منصة من القائمة لعرض تفاصيلها وإدارتها.
            </Card>
          )}

          <AnimatePresence mode="wait">
            {active && (
              <motion.div key={active.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <Card className="border-white/15 bg-slate-950/70 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="text-[11px] tracking-wider text-cyan-300 font-black">PLATFORM</div>
                      <h2 className="text-2xl font-black text-white">{active.name}</h2>
                      <div className="text-xs text-slate-300 mt-1">{active.tagline}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white gap-1">
                        <a href={`/p/${active.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /> فتح</a>
                      </Button>
                      <Button asChild className="bg-gradient-to-l from-cyan-500 to-violet-500 text-white gap-1">
                        <Link to={`/p/${active.slug}/edit`}><Pencil className="w-4 h-4" /> تحرير المحتوى</Link>
                      </Button>
                      <Button onClick={() => remove(active.id)} variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 gap-1">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                    <TabsList className="bg-slate-900/80 border border-white/10">
                      <TabsTrigger value="frontend" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white gap-1">
                        <Monitor className="w-4 h-4" /> Frontend
                      </TabsTrigger>
                      <TabsTrigger value="backend" className="data-[state=active]:bg-gradient-to-l data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white gap-1">
                        <Server className="w-4 h-4" /> Backend
                      </TabsTrigger>
                    </TabsList>

                    {/* FRONTEND */}
                    <TabsContent value="frontend" className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatBox icon={Eye} label="المشاهدات" value={String(active.views ?? 0)} color="text-cyan-300" />
                        <StatBox icon={BarChart3} label="عدد الصفحات" value={String((active.pages || []).length)} color="text-violet-300" />
                        <StatBox icon={Activity} label="الحالة" value={active.status} color="text-emerald-300" />
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/40">
                          <div className="w-2 h-2 rounded-full bg-rose-400/70" />
                          <div className="w-2 h-2 rounded-full bg-amber-400/70" />
                          <div className="w-2 h-2 rounded-full bg-emerald-400/70" />
                          <div className="text-[10px] text-slate-400 font-mono mx-auto">{location.host}/p/{active.slug}</div>
                        </div>
                        <iframe title="frontend-preview" src={`/p/${active.slug}`} className="w-full h-[440px] bg-white" />
                      </div>

                      <Card className="border-white/10 bg-slate-950/60 p-4">
                        <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2"><Monitor className="w-4 h-4 text-cyan-300" /> إعدادات الواجهة</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <RowEdit label="اسم المنصة" value={active.name} onSave={(v) => updateField(active.id, { name: v })} />
                          <RowEdit label="الشعار/الوصف" value={active.tagline || ''} onSave={(v) => updateField(active.id, { tagline: v })} />
                          <RowSwitch label="عامة للزوار" checked={!!active.is_public} onChange={(v) => updateField(active.id, { is_public: v })} />
                          <RowEdit label="رمز دخول الزوار" value={active.access_code || ''} placeholder="فارغ = عامة" onSave={(v) => updateField(active.id, { access_code: v || null })} />
                        </div>
                      </Card>
                    </TabsContent>

                    {/* BACKEND */}
                    <TabsContent value="backend" className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatBox icon={Database} label="نوع المنصة" value={active.platform_type} color="text-violet-300" />
                        <StatBox icon={ShieldCheck} label="الملكية" value={active.owner_password ? 'مفعّلة' : 'غير مفعّلة'} color={active.owner_password ? 'text-emerald-300' : 'text-amber-300'} />
                        <StatBox icon={KeyRound} label="معروضة للبيع" value={active.is_for_sale ? `${active.sale_price} ر.س` : 'لا'} color="text-amber-300" />
                      </div>

                      <Card className="border-white/10 bg-slate-950/60 p-4">
                        <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2"><Server className="w-4 h-4 text-violet-300" /> الربط والباكند</h3>
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

                      <Card className="border-white/10 bg-slate-950/60 p-4">
                        <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-cyan-300" /> الروابط والمعرفات</h3>
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

function StatBox({ icon: Icon, label, value, color }: any) {
  return (
    <Card className="border-white/10 bg-slate-950/70 p-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-slate-400 font-medium">{label}</div>
        <div className="text-sm font-black text-white truncate">{value}</div>
      </div>
    </Card>
  );
}

function RowEdit({ label, value, onSave, placeholder }: { label: string; value: string; onSave: (v: string) => void; placeholder?: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <div className="text-[11px] text-slate-300 mb-1 font-bold">{label}</div>
      <div className="flex gap-1.5">
        <Input value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} className="bg-slate-950/70 border-white/15 text-white" />
        {v !== value && (
          <Button size="sm" onClick={() => onSave(v)} className="bg-emerald-500/80 text-white hover:bg-emerald-500">حفظ</Button>
        )}
      </div>
    </div>
  );
}

function RowSwitch({ label, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
      <div className="text-[12px] text-white font-bold">{label}</div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function KV({ k, v, onCopy }: { k: string; v: string; onCopy?: (s: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2">
      <div className="text-slate-400 font-medium">{k}</div>
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-cyan-200 truncate max-w-[280px]">{v}</code>
        {onCopy && <button onClick={() => onCopy(v)} className="text-slate-400 hover:text-white"><Copy className="w-3.5 h-3.5" /></button>}
      </div>
    </div>
  );
}
