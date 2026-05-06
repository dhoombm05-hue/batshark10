import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, useLocation, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Sparkles, RefreshCw, ExternalLink, Lock, Globe2, Eye, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TYPES = [
  { v: 'landing', l: 'صفحة هبوط' },
  { v: 'startup', l: 'منصة شركة ناشئة' },
  { v: 'service', l: 'منصة خدمات' },
  { v: 'ecommerce', l: 'متجر إلكتروني' },
  { v: 'community', l: 'مجتمع/منتدى' },
  { v: 'portfolio', l: 'بورتفوليو' },
];

export default function B99Platforms() {
  const { identity }: any = useOutletContext();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;
  const [form, setForm] = useState({
    name: '', purpose: '', platformType: 'landing', accessCode: '', ownerEmail: '',
    brand: { primary: '', accent: '' },
  });
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (prefill) setForm((f) => ({ ...f, name: prefill.name || '', purpose: prefill.purpose || '', platformType: prefill.platform_type || 'landing' }));
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!identity?.userId) return;
    const { data } = await supabase.from('generated_platforms').select('*').eq('user_id', identity.userId).order('created_at', { ascending: false }).limit(10);
    setHistory(data || []);
  };

  const generate = async () => {
    if (!form.name.trim() || !form.purpose.trim()) { toast.error('اسم المنصة والهدف مطلوبان'); return; }
    setLoading(true); setGenerated(null);
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generate_platform', userId: identity?.userId, payload: form },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGenerated(data.platform);
      toast.success('تم بناء المنصة بصفحاتها كاملة');
      loadHistory();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('تم نسخ الرابط');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs text-slate-400 uppercase tracking-widest">مولد المنصات المستقلة</div>
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2"><Layers className="w-6 h-6 text-cyan-400" /> أنشئ منصتك الخاصة</h1>
        <p className="text-sm text-slate-400 mt-2">يولّد منصة فعلية كاملة الصفحات والأقسام بمحتوى احترافي ورابط مستقل ورمز مرور اختياري.</p>
      </header>

      <Card className="bg-white/[0.03] border-white/10 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label className="text-xs">اسم المنصة *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-slate-900/60 border-white/10" placeholder="مثال: عطور كنز" /></div>
          <div><Label className="text-xs">نوع المنصة</Label>
            <Select value={form.platformType} onValueChange={(v) => setForm({...form, platformType: v})}>
              <SelectTrigger className="bg-slate-900/60 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label className="text-xs">الهدف وما تقدمه *</Label>
            <Textarea value={form.purpose} onChange={(e) => setForm({...form, purpose: e.target.value})} rows={3}
              placeholder="اشرح: ماذا تقدّم المنصة، لمن، وما الفائدة الرئيسية"
              className="bg-slate-900/60 border-white/10" />
          </div>
          <div><Label className="text-xs flex items-center gap-1"><Lock className="w-3 h-3" /> رمز مرور (اختياري)</Label>
            <Input value={form.accessCode} onChange={(e) => setForm({...form, accessCode: e.target.value})} className="bg-slate-900/60 border-white/10" placeholder="اتركه فارغاً للوصول العام" />
          </div>
          <div><Label className="text-xs">إيميل المالك (اختياري)</Label>
            <Input value={form.ownerEmail} onChange={(e) => setForm({...form, ownerEmail: e.target.value})} className="bg-slate-900/60 border-white/10" />
          </div>
        </div>

        <Button onClick={generate} disabled={loading} className="w-full mt-5 h-12 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 gap-2 font-bold">
          {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> يبني صفحات المنصة كاملة...</> : <><Sparkles className="w-4 h-4" /> ولّد المنصة</>}
        </Button>
      </Card>

      <AnimatePresence>
        {generated && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-cyan-500/15 to-violet-500/15 border-white/10 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">منصة جاهزة</Badge>
                  <h2 className="text-2xl md:text-3xl font-black mb-1">{generated.name}</h2>
                  {generated.tagline && <p className="text-cyan-300 text-sm">{generated.tagline}</p>}
                  <div className="text-xs text-slate-400 mt-3">
                    {generated.is_public ? <><Globe2 className="inline w-3 h-3 mr-1" /> منصة عامة</> : <><Lock className="inline w-3 h-3 mr-1" /> محمية برمز مرور</>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button asChild size="lg" className="bg-white text-black hover:bg-slate-200 gap-2">
                    <Link to={`/p/${generated.slug}`} target="_blank"><ExternalLink className="w-4 h-4" /> افتح المنصة</Link>
                  </Button>
                  <button onClick={() => copyLink(generated.slug)} className="text-xs text-violet-300 hover:text-white flex items-center gap-1 justify-center">
                    {copied ? <><Check className="w-3 h-3" /> منسوخ</> : <><Copy className="w-3 h-3" /> نسخ الرابط</>}
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <Stat label="صفحات" value={generated.pages?.length || 0} />
                <Stat label="مزايا" value={generated.features?.length || 0} />
                <Stat label="الـ slug" value={generated.slug} />
                <Stat label="النوع" value={generated.platform_type} />
              </div>
              {generated.features?.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10px] text-slate-400 uppercase mb-2">المزايا الرئيسية</div>
                  <div className="flex flex-wrap gap-1.5">
                    {generated.features.map((f: string, i: number) => <Badge key={i} variant="outline" className="border-white/20 text-slate-200">{f}</Badge>)}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <Card className="bg-white/[0.03] border-white/10 p-5">
          <h3 className="text-sm font-bold mb-3">منصاتك السابقة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {history.map((p: any) => (
              <Link key={p.id} to={`/p/${p.slug}`} target="_blank"
                className="p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/30 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.platform_type} • /p/{p.slug}</div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400"><Eye className="w-3 h-3" /> {p.views}</div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: any) {
  return <div className="bg-black/30 border border-white/10 rounded-lg p-2.5">
    <div className="text-[10px] text-slate-400">{label}</div>
    <div className="text-sm font-bold truncate">{value}</div>
  </div>;
}
