import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, Copy, ExternalLink, Eye, Globe2, Layers, Lock, RefreshCw, Rocket, Sparkles, KeyRound, QrCode, Tag, Database } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const TYPES = [
  { v: 'landing', l: 'صفحة هبوط' },
  { v: 'ecommerce', l: 'متجر / منصة بيع' },
  { v: 'booking', l: 'حجوزات ومواعيد' },
  { v: 'service', l: 'منصة خدمات' },
  { v: 'startup', l: 'شركة ناشئة' },
  { v: 'community', l: 'مجتمع' },
];

const STEPS = [
  { id: 'identity', label: 'الهوية' },
  { id: 'requirements', label: 'المتطلبات' },
  { id: 'layout', label: 'التخطيط' },
  { id: 'access', label: 'الدخول والملكية' },
  { id: 'review', label: 'المعاينة والبناء' },
];

export default function B99Platforms() {
  const { identity }: any = useOutletContext();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    purpose: '',
    platformType: 'ecommerce',
    accessCode: '',
    ownerPassword: '',
    ownerEmail: '',
    isForSale: false,
    salePrice: 0,
    backendLink: 'batshark99',
    layoutMode: 'longform',
    themeMode: 'dark',
    heroImage: '',
    sections: 'الرئيسية، المنتجات، الأسعار، الأسئلة، التواصل',
    payment: 'كاش فقط',
    customerFlow: 'يشاهد المنتج → يطلب → يتواصل واتساب → يدفع كاش عند الاستلام',
    needsVideo: true,
    needsProductImages: true,
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
    if (!form.name.trim() || !form.purpose.trim()) return toast.error('اكمل اسم المنصة والهدف');
    setLoading(true);
    setGenerated(null);
    try {
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
            ownerPassword: form.ownerPassword,
            backendLink: form.backendLink,
            isForSale: form.isForSale,
            salePrice: form.salePrice,
            layoutMode: form.layoutMode,
            themeMode: form.themeMode,
            buildMode: 'platform-studio',
            requirements: {
              heroImage: form.heroImage,
              sections: form.sections,
              payment: form.payment,
              customerFlow: form.customerFlow,
              needsVideo: form.needsVideo,
              needsProductImages: form.needsProductImages,
              source: identity?.userId ? 'internal-member' : 'external-guest',
            },
          },
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setGenerated(data.platform);
      toast.success('تم بناء المنصة المستقلة');
      loadHistory();
      setStep(STEPS.length - 1);
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

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/80 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,hsl(190_90%_50%/0.16),transparent_38%),radial-gradient(circle_at_80%_0%,hsl(330_90%_55%/0.16),transparent_38%)]" />
        <div className="relative">
          <Badge className="mb-2 border-white/20 bg-white/10 text-white">Platform Studio</Badge>
          <h1 className="flex items-center gap-2 text-2xl md:text-4xl font-black"><Layers className="w-7 h-7 text-cyan-300" /> منصة تبني منصات حقيقية</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200 leading-relaxed">حدّد متطلباتك، اختر الشكل، فعّل الملكية والـQR، وأنا أبني لك موقعاً كاملاً برابط مستقل وصلاحيات مالك قابلة للبيع.</p>
        </div>
      </header>

      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => setStep(i)}
            className={`px-3 py-2 rounded-full text-xs font-bold border transition-all ${i === step ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-transparent' : 'bg-white/5 border-white/15 text-slate-300 hover:text-white'}`}>
            <span className="opacity-60">{i + 1}.</span> {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <Card className="border-white/15 bg-white/[0.04] p-5">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="اسم المنصة *"><Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="مثال: Healthy Bowl Riyadh" className="bg-slate-950/70 border-white/15" /></Field>
                  <Field label="نوع المنصة">
                    <Select value={form.platformType} onValueChange={(v) => update('platformType', v)}>
                      <SelectTrigger className="bg-slate-950/70 border-white/15"><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <div className="md:col-span-2"><Field label="ماذا تقدم المنصة؟ *"><Textarea value={form.purpose} onChange={(e) => update('purpose', e.target.value)} rows={4} placeholder="اشرح المنتج/الخدمة، الجمهور، والميزة الأهم..." className="bg-slate-950/70 border-white/15" /></Field></div>
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><Field label="الصورة الرئيسية (وصف)"><Input value={form.heroImage} onChange={(e) => update('heroImage', e.target.value)} placeholder="صورة وجبات صحية، ملعب بادل، عبوة عطور..." className="bg-slate-950/70 border-white/15" /></Field></div>
                  <div className="md:col-span-2"><Field label="الأقسام المطلوبة"><Input value={form.sections} onChange={(e) => update('sections', e.target.value)} className="bg-slate-950/70 border-white/15" /></Field></div>
                  <Field label="طريقة الدفع">
                    <Select value={form.payment} onValueChange={(v) => update('payment', v)}>
                      <SelectTrigger className="bg-slate-950/70 border-white/15"><SelectValue /></SelectTrigger>
                      <SelectContent>{['كاش فقط','تحويل بنكي','دفع عند الاستلام','بطاقة + Apple Pay','واتساب فقط'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <div className="md:col-span-2"><Field label="رحلة العميل"><Textarea value={form.customerFlow} onChange={(e) => update('customerFlow', e.target.value)} rows={3} className="bg-slate-950/70 border-white/15" /></Field></div>
                  <Toggle label="أحتاج فيديوهات إعلانية داخل الموقع" value={form.needsVideo} onChange={(v) => update('needsVideo', v)} />
                  <Toggle label="أحتاج عرض صور المنتجات" value={form.needsProductImages} onChange={(v) => update('needsProductImages', v)} />
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="نمط الموقع">
                    <Select value={form.layoutMode} onValueChange={(v) => update('layoutMode', v)}>
                      <SelectTrigger className="bg-slate-950/70 border-white/15"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="longform">صفحة طويلة بالنزول (Scroll)</SelectItem>
                        <SelectItem value="slides">سلايدات أفقية احترافية</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="الستايل">
                    <Select value={form.themeMode} onValueChange={(v) => update('themeMode', v)}>
                      <SelectTrigger className="bg-slate-950/70 border-white/15"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">داكن سينمائي</SelectItem>
                        <SelectItem value="light">فاتح أنيق</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="md:col-span-2 rounded-xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-300 leading-relaxed">
                    <Database className="inline w-4 h-4 ml-1 text-cyan-300" /> الباكند يُربط افتراضياً بـ Batshark99 لتخزين الطلبات والمحتوى. يمكنك ربطه لاحقاً بنظام خارجي عبر إعدادات المالك.
                  </div>
                  <div className="md:col-span-2"><Field label="ربط الباكند"><Input value={form.backendLink} onChange={(e) => update('backendLink', e.target.value)} className="bg-slate-950/70 border-white/15" placeholder="batshark99 أو رابط API خارجي" /></Field></div>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="رمز دخول الزوار (اختياري)"><Input value={form.accessCode} onChange={(e) => update('accessCode', e.target.value)} className="bg-slate-950/70 border-white/15" placeholder="اتركه فارغاً للزيارة العامة" /></Field>
                  <Field label="رمز ملكية المنصة (للتسليم)"><Input value={form.ownerPassword} onChange={(e) => update('ownerPassword', e.target.value)} className="bg-slate-950/70 border-white/15" placeholder="يعطي صلاحيات تحكم كاملة" /></Field>
                  <Field label="إيميل المالك"><Input value={form.ownerEmail} onChange={(e) => update('ownerEmail', e.target.value)} type="email" className="bg-slate-950/70 border-white/15" placeholder="owner@example.com" /></Field>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2"><Tag className="w-4 h-4 text-amber-300" /> اعرضها للبيع</div>
                      <div className="text-[11px] text-slate-300">يظهر سعرها لزوار المنصة</div>
                    </div>
                    <Switch checked={form.isForSale} onCheckedChange={(v) => update('isForSale', v)} />
                  </div>
                  {form.isForSale && <Field label="سعر البيع (ر.س)"><Input type="number" value={form.salePrice} onChange={(e) => update('salePrice', Number(e.target.value))} className="bg-slate-950/70 border-white/15" /></Field>}
                  <div className="md:col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200 flex items-start gap-2">
                    <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>تسليم المنصة: شارك رمز الملكية مع المشتري ليحصل على لوحة تحكم كاملة لهذه المنصة فقط.</div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <SummaryRow k="الاسم" v={form.name || '—'} />
                  <SummaryRow k="النوع" v={TYPES.find((t) => t.v === form.platformType)?.l || form.platformType} />
                  <SummaryRow k="النمط" v={form.layoutMode === 'slides' ? 'سلايدات أفقية' : 'صفحة طويلة بالنزول'} />
                  <SummaryRow k="الستايل" v={form.themeMode === 'light' ? 'فاتح' : 'داكن'} />
                  <SummaryRow k="الدفع" v={form.payment} />
                  <SummaryRow k="ملكية" v={form.ownerPassword ? 'مفعّلة (قابلة للبيع/التسليم)' : 'غير مفعّلة'} />
                  <SummaryRow k="حماية الزوار" v={form.accessCode ? 'برمز' : 'عامة'} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={prev} disabled={step === 0} className="border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white">السابق</Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} className="bg-gradient-to-l from-cyan-500 to-violet-500 text-white">التالي</Button>
            ) : (
              <Button onClick={generate} disabled={loading} className="bg-gradient-to-l from-cyan-500 via-blue-500 to-violet-500 text-white font-bold gap-2">
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> يبني الموقع...</> : <><Sparkles className="w-4 h-4" /> ابنِ المنصة الآن</>}
              </Button>
            )}
          </div>
        </Card>

        <aside className="space-y-3">
          <Card className="border-white/15 bg-slate-950/70 p-5">
            <Rocket className="mb-3 h-6 w-6 text-cyan-300" />
            <h3 className="font-black text-white">منصة فعلية وليست نصاً</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-200">يتم إنشاء صفحات الموقع، الرابط المستقل، QR Code، رمز دخول، وصلاحيات مالك قابلة للتسليم.</p>
          </Card>
          {history.length > 0 && (
            <Card className="border-white/15 bg-white/[0.04] p-5">
              <h3 className="mb-3 text-sm font-black text-white">منصاتك السابقة</h3>
              <div className="space-y-2">
                {history.map((p) => (
                  <Link key={p.id} to={`/p/${p.slug}`} target="_blank" className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/30">
                    <div>
                      <div className="text-sm font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400">/p/{p.slug}</div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-slate-300"><Eye className="h-3 w-3" /> {p.views}</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </aside>
      </div>

      <AnimatePresence>
        {generated && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-white/15 bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-rose-500/10 p-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-center">
                <div>
                  <Badge className="mb-2 border-emerald-500/30 bg-emerald-500/15 text-emerald-200">منصة جاهزة</Badge>
                  <h2 className="text-2xl md:text-3xl font-black text-white">{generated.name}</h2>
                  <p className="mt-1 text-sm text-cyan-100">{generated.tagline}</p>
                  <div className="mt-3 text-xs text-slate-300">
                    {generated.is_public ? <><Globe2 className="inline h-3 w-3" /> عامة للزيارة</> : <><Lock className="inline h-3 w-3" /> محمية برمز مرور</>}
                    {generated.owner_password && <span className="mr-3"><KeyRound className="inline h-3 w-3" /> ملكية مفعّلة</span>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild className="bg-white text-slate-950 hover:bg-slate-200"><Link to={`/p/${generated.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /> افتح المنصة</Link></Button>
                    <Button onClick={() => copyLink(generated.slug)} variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} نسخ الرابط
                    </Button>
                    {form.ownerPassword && (
                      <Button asChild variant="outline" className="border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 hover:text-amber-100">
                        <Link to={`/p/${generated.slug}?owner=1`} target="_blank"><KeyRound className="h-4 w-4" /> فتح كمالك</Link>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-2xl">
                  <QRCodeCanvas value={`${window.location.origin}/p/${generated.slug}`} size={140} level="M" includeMargin={false} />
                  <div className="text-[10px] text-slate-700 flex items-center gap-1"><QrCode className="w-3 h-3" /> امسح للدخول</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div><Label className="mb-2 block text-xs text-slate-200">{label}</Label>{children}</div>;
}
function Toggle({ label, value, onChange }: any) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 flex items-center justify-between gap-3">
      <div className="text-sm text-white">{label}</div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
function SummaryRow({ k, v }: any) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
      <div className="text-xs text-slate-300">{k}</div>
      <div className="text-sm font-bold text-white">{v}</div>
    </div>
  );
}
