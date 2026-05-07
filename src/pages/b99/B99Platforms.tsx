import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, Copy, ExternalLink, Eye, Globe2, Image, Layers, Lock, RefreshCw, Rocket, Sparkles, StepForward, WalletCards } from 'lucide-react';

const TYPES = [
  { v: 'landing', l: 'صفحة هبوط' },
  { v: 'ecommerce', l: 'منصة بيع / متجر' },
  { v: 'booking', l: 'حجوزات ومواعيد' },
  { v: 'service', l: 'منصة خدمات' },
  { v: 'startup', l: 'شركة ناشئة' },
  { v: 'community', l: 'مجتمع' },
];

const REQUIREMENT_STEPS = [
  { key: 'heroImage', label: 'الصورة الرئيسية', icon: Image, placeholder: 'مثال: صورة أطباق صحية أو ملعب بادل أو مظلة سيارة' },
  { key: 'sections', label: 'الأقسام المطلوبة', icon: Layers, placeholder: 'الرئيسية، المنتجات، الأسعار، الأسئلة، التواصل...' },
  { key: 'payment', label: 'الدفع', icon: WalletCards, placeholder: 'كاش فقط، تحويل، دفع عند الاستلام...' },
  { key: 'customerFlow', label: 'رحلة العميل', icon: StepForward, placeholder: 'يشوف العرض → يطلب → يتواصل واتساب → يدفع كاش' },
];

export default function B99Platforms() {
  const { identity }: any = useOutletContext();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;
  const [form, setForm] = useState({
    name: '',
    purpose: '',
    platformType: 'ecommerce',
    accessCode: '',
    ownerEmail: '',
    buildLevel: 'custom',
    heroImage: '',
    sections: '',
    payment: 'كاش فقط',
    customerFlow: '',
  });
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (prefill) {
      setForm((f) => ({ ...f, name: prefill.name || '', purpose: prefill.purpose || '', platformType: prefill.platform_type || 'ecommerce' }));
    }
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!identity?.userId) return;
    const { data } = await supabase.from('generated_platforms').select('*').eq('user_id', identity.userId).order('created_at', { ascending: false }).limit(10);
    setHistory(data || []);
  };

  const generate = async () => {
    if (!form.name.trim() || !form.purpose.trim()) return toast.error('اسم المنصة والهدف مطلوبان');
    setLoading(true);
    setGenerated(null);
    try {
      const requirements = {
        heroImage: form.heroImage,
        sections: form.sections,
        payment: form.payment || 'كاش فقط',
        customerFlow: form.customerFlow,
        source: identity?.userId ? 'internal-member' : 'external-guest',
      };
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: {
          action: 'generate_platform',
          userId: identity?.userId,
          payload: {
            name: form.name,
            purpose: form.purpose,
            platformType: form.platformType,
            ownerEmail: form.ownerEmail || identity?.email || '',
            accessCode: form.accessCode,
            buildLevel: form.buildLevel,
            buildMode: 'platform-studio',
            requirements,
          },
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGenerated(data.platform);
      toast.success('تم بناء منصة مستقلة كاملة');
      loadHistory();
    } catch (e: any) {
      toast.error(e.message || 'تعذر بناء المنصة');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
    setCopied(true);
    toast.success('تم نسخ الرابط');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,hsl(190_90%_50%/0.14),transparent_35%),radial-gradient(circle_at_80%_0%,hsl(330_90%_55%/0.14),transparent_38%)]" />
        <div className="relative">
          <div className="text-xs text-slate-400 uppercase tracking-widest">مولد المنصات المستقلة</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl md:text-4xl font-black"><Layers className="w-7 h-7 text-cyan-400" /> منصة تبني منصة</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 leading-relaxed">اكتب المتطلبات مثل العميل: صورة الشاشة الرئيسية، الصفحات، طريقة الدفع، رحلة الطلب — وسيتم إنشاء موقع كامل منفصل مرتبط ببيانات Batshark99.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-5">
        <Card className="border-white/10 bg-white/[0.035] p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-xs">اسم المنصة *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 border-white/10 bg-slate-950/70" placeholder="مثال: Healthy Bowl Riyadh" /></div>
            <div><Label className="text-xs">نوع المنصة</Label><Select value={form.platformType} onValueChange={(v) => setForm({ ...form, platformType: v })}><SelectTrigger className="mt-2 border-white/10 bg-slate-950/70"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">مستوى البناء</Label><Select value={form.buildLevel} onValueChange={(v) => setForm({ ...form, buildLevel: v })}><SelectTrigger className="mt-2 border-white/10 bg-slate-950/70"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Level 1 مبتدئ</SelectItem><SelectItem value="intermediate">Level 2 متوسط</SelectItem><SelectItem value="advanced">Level 3 متقدم</SelectItem><SelectItem value="analyst">Level 4 محلل</SelectItem><SelectItem value="custom">مخصص</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs flex items-center gap-1"><Lock className="w-3 h-3" /> رمز مرور اختياري</Label><Input value={form.accessCode} onChange={(e) => setForm({ ...form, accessCode: e.target.value })} className="mt-2 border-white/10 bg-slate-950/70" placeholder="اتركه فارغاً للعامة" /></div>
            <div className="md:col-span-2"><Label className="text-xs">ماذا تقدم المنصة؟ *</Label><Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={4} className="mt-2 border-white/10 bg-slate-950/70" placeholder="مثال: منصة بيع أكل صحي تعرض الوجبات والباقات وتستقبل الطلبات والدفع كاش عند الاستلام" /></div>
            {REQUIREMENT_STEPS.map((r) => {
              const Icon = r.icon;
              return <div key={r.key} className="md:col-span-2"><Label className="flex items-center gap-2 text-xs"><Icon className="h-3.5 w-3.5 text-cyan-300" /> {r.label}</Label><Input value={(form as any)[r.key]} onChange={(e) => setForm({ ...form, [r.key]: e.target.value })} className="mt-2 border-white/10 bg-slate-950/70" placeholder={r.placeholder} /></div>;
            })}
          </div>
          <Button onClick={generate} disabled={loading} className="mt-5 h-12 w-full bg-gradient-to-l from-cyan-500 via-blue-500 to-violet-500 font-bold text-white">
            {loading ? <><RefreshCw className="h-4 w-4 animate-spin" /> يبني الموقع صفحة صفحة...</> : <><Sparkles className="h-4 w-4" /> نفّذ المتطلبات وأنشئ المنصة</>}
          </Button>
        </Card>

        <aside className="space-y-3">
          <Card className="border-white/10 bg-slate-950/80 p-5">
            <Rocket className="mb-3 h-6 w-6 text-cyan-300" />
            <h3 className="font-black">الناتج ليس نصاً فقط</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">النظام ينشئ منصة فعلية بصفحاتها، رابطها، شكلها، متطلبات العميل، وآلية الطلب والدفع التي كتبتها.</p>
          </Card>
          {history.length > 0 && <Card className="border-white/10 bg-white/[0.03] p-5"><h3 className="mb-3 text-sm font-black">منصاتك السابقة</h3><div className="space-y-2">{history.map((p) => <Link key={p.id} to={`/p/${p.slug}`} target="_blank" className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/30"><div><div className="text-sm font-bold">{p.name}</div><div className="text-[10px] text-slate-500">/p/{p.slug}</div></div><span className="flex items-center gap-1 text-[10px] text-slate-400"><Eye className="h-3 w-3" /> {p.views}</span></Link>)}</div></Card>}
        </aside>
      </div>

      <AnimatePresence>
        {generated && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-white/10 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <Badge className="mb-2 border-emerald-500/30 bg-emerald-500/15 text-emerald-300">منصة جاهزة</Badge>
                  <h2 className="text-2xl md:text-3xl font-black">{generated.name}</h2>
                  <p className="mt-1 text-sm text-cyan-200">{generated.tagline}</p>
                  <div className="mt-3 text-xs text-slate-400">{generated.is_public ? <><Globe2 className="inline h-3 w-3" /> عامة للزيارة</> : <><Lock className="inline h-3 w-3" /> محمية برمز مرور</>}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild className="bg-white text-slate-950 hover:bg-slate-200"><Link to={`/p/${generated.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /> افتح المنصة</Link></Button>
                  <Button onClick={() => copyLink(generated.slug)} variant="ghost" className="text-cyan-300">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} نسخ الرابط</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}