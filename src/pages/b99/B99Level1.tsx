import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wrench, ArrowRight, Globe, Database, Bot, CheckCircle2, ExternalLink, Copy, KeyRound, Pencil, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SmartQuestionEngine, { SmartQuestion } from '@/components/b99/SmartQuestionEngine';

type Mode = 'choose' | 'scratch' | 'connect' | 'building' | 'done';

const SCRATCH_QUESTIONS: SmartQuestion[] = [
  {
    key: 'business_kind', title: 'وش نوع البزنس الي تبي تبنيه؟', hint: 'اختر الأقرب لفكرتك.', type: 'cards',
    options: [
      { value: 'food', label: 'مطعم/أكل صحي', emoji: '🥗', desc: 'منصة طلبات وقوائم' },
      { value: 'sport', label: 'ملاعب/حجوزات', emoji: '🎾', desc: 'بادل، صالات، ملاعب' },
      { value: 'shop', label: 'متجر منتجات', emoji: '🛍️', desc: 'عطور، ملابس، إكسسوار' },
      { value: 'service', label: 'خدمات', emoji: '🛠️', desc: 'مظلات، تنظيف، صيانة' },
      { value: 'edu', label: 'تعليم/كورسات', emoji: '📚', desc: 'دورات ومحتوى تعليمي' },
      { value: 'saas', label: 'منصة برمجية SaaS', emoji: '💻', desc: 'أدوات ولوحات تحكم' },
      { value: 'realestate', label: 'عقار', emoji: '🏢', desc: 'وحدات، إيجارات، عروض' },
      { value: 'other', label: 'فكرة أخرى', emoji: '✨', desc: 'سنفهمها من وصفك' },
    ],
  },
  { key: 'idea', title: 'بكلماتك، وش الفكرة بالضبط؟', hint: 'جملة أو سطرين، خلّها واضحة.', type: 'textarea', placeholder: 'مثلاً: متجر يبيع أكلات صحية بالرياض مع توصيل يومي...' },
  { key: 'business_name', title: 'اسم البزنس / المنصة؟', type: 'text', placeholder: 'مثلاً: Greenly، PadelHub، أوميغا...' },
  { key: 'unique_value', title: 'ما الذي يميّزك عن المنافسين؟', hint: 'الميزة الواحدة التي تتفوق فيها.', type: 'textarea', placeholder: 'توصيل خلال 30 دقيقة، أرخص 20%، تجربة مستخدم استثنائية...' },
  { key: 'city', title: 'وين سوقك الأساسي؟', type: 'text', placeholder: 'الرياض، جدة، الدمام، الخليج، عالمي...' },
  {
    key: 'audience', title: 'لمن تبني؟ (الجمهور المستهدف)', type: 'cards',
    options: [
      { value: 'b2c_young', label: 'مستهلكين شباب 18-30', emoji: '🧑‍🎓' },
      { value: 'b2c_family', label: 'عائلات', emoji: '👨‍👩‍👧' },
      { value: 'b2c_premium', label: 'فئة فاخرة', emoji: '💎' },
      { value: 'b2b', label: 'شركات وأعمال', emoji: '🏢' },
    ],
  },
  {
    key: 'brand_vibe', title: 'الإحساس البصري للعلامة؟', hint: 'يحدد لك الألوان والخطوط تلقائياً.', type: 'cards',
    options: [
      { value: 'luxury', label: 'فخامة وذهبي', emoji: '✨', desc: 'أسود/ذهبي/كريمي' },
      { value: 'modern', label: 'عصري ونظيف', emoji: '◻️', desc: 'أزرق/أبيض/رمادي' },
      { value: 'vibrant', label: 'حيوي وجريء', emoji: '🌈', desc: 'بنفسجي/زهري/سماوي' },
      { value: 'natural', label: 'طبيعي ومريح', emoji: '🌿', desc: 'أخضر/بيج/خشبي' },
      { value: 'tech', label: 'تقني داكن', emoji: '🌌', desc: 'كحلي/سيان/نيون' },
      { value: 'minimal', label: 'مينيمال أبيض', emoji: '⚪', desc: 'أبيض/أسود فقط' },
    ],
  },
  {
    key: 'pages', title: 'وش الصفحات المطلوبة؟', hint: 'اختر اللي تحتاجه (أكثر من واحد).', type: 'multi',
    options: [
      { value: 'home', label: 'رئيسية', emoji: '🏠' },
      { value: 'products', label: 'منتجات/قائمة', emoji: '📋' },
      { value: 'booking', label: 'حجوزات', emoji: '📅' },
      { value: 'pricing', label: 'الأسعار والباقات', emoji: '💰' },
      { value: 'about', label: 'من نحن', emoji: 'ℹ️' },
      { value: 'contact', label: 'تواصل', emoji: '📞' },
      { value: 'gallery', label: 'معرض صور', emoji: '🖼️' },
      { value: 'blog', label: 'مدونة/مقالات', emoji: '✍️' },
      { value: 'dashboard', label: 'لوحة تحكم العميل', emoji: '📊' },
    ],
  },
  {
    key: 'features', title: 'مزايا تقنية إضافية؟', type: 'multi', optional: true,
    options: [
      { value: 'auth', label: 'تسجيل دخول للعملاء', emoji: '🔐' },
      { value: 'payments', label: 'دفع إلكتروني', emoji: '💳' },
      { value: 'reviews', label: 'تقييمات ومراجعات', emoji: '⭐' },
      { value: 'multilang', label: 'متعدد اللغات', emoji: '🌍' },
      { value: 'newsletter', label: 'نشرة بريدية', emoji: '✉️' },
      { value: 'live_chat', label: 'دردشة مباشرة', emoji: '💬' },
    ],
  },
  {
    key: 'payment', title: 'كيف تستقبل المدفوعات؟', type: 'cards',
    options: [
      { value: 'cash', label: 'كاش فقط', emoji: '💵' },
      { value: 'transfer', label: 'تحويل بنكي', emoji: '🏦' },
      { value: 'cod', label: 'دفع عند الاستلام', emoji: '📦' },
      { value: 'card', label: 'بطاقة/Apple Pay', emoji: '💳' },
    ],
  },
  {
    key: 'database_choice', title: 'أين تريد تخزين بياناتك؟', hint: 'تستطيع تغييرها لاحقاً من لوحة المالك.', type: 'cards',
    options: [
      { value: 'bs99_hosted', label: 'استضافة بات شارك (الأسرع)', emoji: '⚡', desc: 'قاعدة بيانات جاهزة مدارة بالكامل' },
      { value: 'external', label: 'قاعدة بياناتي الخاصة', emoji: '🔌', desc: 'سأربط Supabase/Firebase خاصتي لاحقاً' },
      { value: 'none_yet', label: 'بدون قاعدة بيانات الآن', emoji: '📝', desc: 'موقع عرض فقط، أُضيف لاحقاً' },
    ],
  },
  {
    key: 'inspiration_home', title: 'شكل الصفحة الرئيسية المرجعي؟', hint: 'اختر منصة عالمية تعجبك بصرياً، أو دع بات شارك يبدع.',
    type: 'inspiration', focus: 'الصفحة الرئيسية / الهيرو',
    topicFrom: (a) => `${a.idea || a.business_kind || ''} — صفحة رئيسية`,
    optional: true,
  },
  {
    key: 'inspiration_auth', title: 'شكل صفحة الدخول/التسجيل؟', hint: 'مثال: شكل دخول أمازون، شوبيفاي، أو مخصص.',
    type: 'inspiration', focus: 'صفحة الدخول والتسجيل',
    topicFrom: (a) => `${a.idea || a.business_kind || ''} — صفحة تسجيل الدخول`,
    optional: true,
  },
  { key: 'hero_image', title: 'وصف صورة الواجهة (اختياري)', hint: 'اوصف ما تريد عرضه في صدر الموقع.', type: 'text', placeholder: 'صورة وجبات صحية، واجهة محل، ملعب بادل...', optional: true },
  { key: 'owner_email', title: 'إيميلك كمالك للمنصة', hint: 'يُستخدم لاسترجاع الوصول والتنبيهات.', type: 'text', placeholder: 'you@example.com' },
  { key: 'owner_password', title: 'اختر كلمة سر للدخول كمالك', hint: 'بهذه الكلمة فقط تستطيع تعديل تصميم الموقع لاحقاً.', type: 'text', placeholder: 'كلمة سرّية قوية (8 أحرف فأكثر)' },
];

const CONNECT_QUESTIONS: SmartQuestion[] = [
  { key: 'site_url', title: 'وش رابط موقعك الحالي؟', type: 'text', placeholder: 'https://my-site.com' },
  {
    key: 'site_problem', title: 'وش المشكلة الأساسية في موقعك؟', type: 'cards',
    options: [
      { value: 'no_backend', label: 'ما فيه باكند', emoji: '🔌', desc: 'صفحات فقط بدون قاعدة بيانات' },
      { value: 'slow', label: 'بطيء أو متهاوي', emoji: '🐌', desc: 'يحتاج تسريع وتعزيز' },
      { value: 'no_data', label: 'ما يجمع بيانات', emoji: '📊', desc: 'ما فيه طلبات/إحصائيات' },
      { value: 'no_ai', label: 'يحتاج ذكاء', emoji: '🤖', desc: 'دردشة AI، اقتراحات' },
    ],
  },
  { key: 'business_name', title: 'اسم البزنس؟', type: 'text', placeholder: 'مطعمي / متجري...' },
  {
    key: 'wanted', title: 'وش تبي بات شارك يضيف لموقعك؟', type: 'multi',
    options: [
      { value: 'orders', label: 'استقبال طلبات', emoji: '📦' },
      { value: 'analytics', label: 'لوحة إحصائيات', emoji: '📈' },
      { value: 'ai_chat', label: 'مساعد AI للزوار', emoji: '💬' },
      { value: 'auth', label: 'تسجيل دخول للعملاء', emoji: '🔐' },
      { value: 'payments', label: 'دفع إلكتروني', emoji: '💳' },
    ],
  },
];

export default function B99Level1() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>('choose');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScratch = async (answers: Record<string, any>) => {
    setLoading(true); setMode('building');
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generate_platform', payload: { level: 1, mode: 'scratch', answers } },
      });
      if (error) throw error;
      setResult(data);
      setMode('done');
      toast.success('تم بناء منصتك! 🎉');
    } catch (e: any) {
      toast.error(e.message || 'خطأ بالبناء'); setMode('scratch');
    } finally { setLoading(false); }
  };

  const handleConnect = async (answers: Record<string, any>) => {
    setLoading(true); setMode('building');
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generate_integration', payload: { level: 1, mode: 'connect', answers } },
      });
      if (error) throw error;
      setResult(data);
      setMode('done');
      toast.success('تم تجهيز رابط الباكند بموقعك!');
    } catch (e: any) {
      toast.error(e.message || 'خطأ'); setMode('connect');
    } finally { setLoading(false); }
  };

  if (mode === 'choose') {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <Header level={1} title="ابني من الصفر" subtitle="اختر مسارك المناسب — كل مسار يأخذك مباشرة لما تحتاجه." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ChoiceCard
            onClick={() => setMode('scratch')}
            icon={Sparkles}
            accent="from-violet-500 via-fuchsia-500 to-pink-500"
            badge="من الصفر"
            title="ما عندي شي"
            desc="نبني لك منصة كاملة من الصفر مع باكند وقاعدة بيانات وصفحات مالك."
            bullets={['تصميم احترافي جاهز', 'باكند مدمج', 'لوحة مالك للتحكم', 'رابط مستقل + QR']}
          />
          <ChoiceCard
            onClick={() => setMode('connect')}
            icon={Wrench}
            accent="from-cyan-500 via-sky-500 to-indigo-500"
            badge="عندي موقع غير احترافي"
            title="عندي موقع لكن ضعيف"
            desc="نربط الباكند والذكاء الاصطناعي حقّنا بموقعك ونعطيك ما ينقصه."
            bullets={['Embed Snippet جاهز', 'API key خاص', 'Webhook للأحداث', 'تشغيل خلال دقائق']}
          />
        </div>
      </div>
    );
  }

  if (mode === 'scratch') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Header level={1} title="من الصفر" subtitle="6 أسئلة سريعة، ثم نبني منصتك مباشرة." onBack={() => setMode('choose')} />
        <SmartQuestionEngine questions={SCRATCH_QUESTIONS} onComplete={handleScratch} loading={loading} accent="from-violet-500 to-pink-500" ctaLabel="ابني منصتي الآن" />
      </div>
    );
  }

  if (mode === 'connect') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Header level={1} title="ربط موقعي" subtitle="جاوب 4 أسئلة وسنعطيك كود الربط الجاهز." onBack={() => setMode('choose')} />
        <SmartQuestionEngine questions={CONNECT_QUESTIONS} onComplete={handleConnect} loading={loading} accent="from-cyan-500 to-indigo-500" ctaLabel="جهّز كود الربط" />
      </div>
    );
  }

  if (mode === 'building') {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-violet-200 border-t-violet-600" />
        <h3 className="text-2xl font-black text-slate-900 mb-2">جاري بناء منصتك...</h3>
        <p className="text-slate-600">بات شارك يفكر، يصمم، ويربط الباكند.</p>
      </div>
    );
  }

  // done
  const ownerPwd = result?.platform?.owner_password || result?.owner_password;
  const slug = result?.platform?.slug;
  const copy = (t: string, l: string) => { navigator.clipboard.writeText(t); toast.success(`${l} نُسخت`); };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Header level={1} title="جاهز! 🎉" subtitle="منصتك أصبحت حية ولديك تحكّم كامل." />
      <Card className="bg-white border-slate-200 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{result?.platform?.name || result?.name || 'منصتك'}</div>
            <div className="text-sm text-slate-500">{result?.platform?.tagline || result?.tagline}</div>
          </div>
        </div>

        {slug && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={() => nav(`/p/${slug}`)}
              className="text-right p-4 rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white hover:border-violet-400 transition-all">
              <Globe className="w-6 h-6 text-violet-600 mb-2" />
              <div className="font-black text-slate-900 mb-1">رابط الموقع</div>
              <div className="text-[11px] font-mono text-slate-600 truncate">/p/{slug}</div>
              <div className="text-[10px] text-violet-600 mt-2 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> فتح</div>
            </button>

            <button onClick={() => nav(`/p/${slug}/edit`)}
              className="text-right p-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white hover:border-amber-500 transition-all">
              <Pencil className="w-6 h-6 text-amber-600 mb-2" />
              <div className="font-black text-slate-900 mb-1">عدّل التصميم</div>
              <div className="text-[11px] text-slate-600">غيّر الألوان، النصوص، الأقسام</div>
              <div className="text-[10px] text-amber-700 mt-2">محرر مرن لحظي</div>
            </button>

            <div className="text-right p-4 rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white">
              <KeyRound className="w-6 h-6 text-slate-700 mb-2" />
              <div className="font-black text-slate-900 mb-1">دخول المالك</div>
              {ownerPwd ? (
                <div className="flex items-center gap-1">
                  <code className="text-[11px] font-mono bg-slate-100 px-2 py-1 rounded truncate flex-1">{ownerPwd}</code>
                  <button onClick={() => copy(ownerPwd, 'كلمة السر')} className="p-1 hover:bg-slate-100 rounded"><Copy className="w-3 h-3" /></button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">احتفظها سراً</div>
              )}
              <div className="text-[10px] text-slate-500 mt-2">احفظها — لن تظهر لاحقاً</div>
            </div>
          </div>
        )}

        {result?.integration && (
          <IntegrationBox integration={result.integration} />
        )}

        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100">
          <Button variant="outline" onClick={() => nav('/b99/platforms')} className="gap-2">
            <Database className="w-4 h-4" /> كل منصاتي
          </Button>
          <Button variant="outline" onClick={() => nav('/b99/ads')} className="gap-2">
            ⚡ أنشئ إعلاناً للمنصة
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function Header({ level, title, subtitle, onBack }: { level: number; title: string; subtitle: string; onBack?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Badge className="bg-violet-100 text-violet-700 border-violet-200 mb-2">المستوى {level}</Badge>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">{title}</h1>
        <p className="text-slate-600 mt-1">{subtitle}</p>
      </div>
      {onBack && (
        <Button variant="ghost" onClick={onBack} size="sm" className="text-slate-500 gap-1">
          <ArrowRight className="w-4 h-4" /> رجوع
        </Button>
      )}
    </div>
  );
}

function ChoiceCard({ icon: Icon, accent, badge, title, desc, bullets, onClick }: any) {
  return (
    <button onClick={onClick}
      className="group text-right p-7 rounded-3xl bg-white border border-slate-200 hover:border-transparent transition-all overflow-hidden shadow-lg hover:shadow-2xl relative">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l ${accent}`} />
      <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${accent} shadow-lg w-fit mb-4`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] mb-2">{badge}</Badge>
      <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{desc}</p>
      <ul className="space-y-1.5">
        {bullets.map((b: string) => (
          <li key={b} className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {b}
          </li>
        ))}
      </ul>
    </button>
  );
}

export function IntegrationBox({ integration }: { integration: any }) {
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} نُسخت`);
  };
  return (
    <div className="space-y-3 mt-4">
      <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">كود الربط بموقعك</div>
      {integration.client_api_key && (
        <CodeRow label="API Key" value={integration.client_api_key} onCopy={copy} />
      )}
      {integration.webhook_url && (
        <CodeRow label="Webhook URL" value={integration.webhook_url} onCopy={copy} />
      )}
      {integration.embed_snippet && (
        <div className="p-3 rounded-xl bg-slate-900 text-emerald-300 text-xs font-mono overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">Embed Snippet (الصق في &lt;head&gt;)</span>
            <button onClick={() => copy(integration.embed_snippet, 'Snippet')} className="text-violet-300 hover:text-violet-100">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-all">{integration.embed_snippet}</pre>
        </div>
      )}
    </div>
  );
}

function CodeRow({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string, l: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-slate-500 font-bold mb-0.5">{label}</div>
        <div className="text-xs font-mono text-slate-800 truncate">{value}</div>
      </div>
      <Button size="sm" variant="ghost" onClick={() => onCopy(value, label)} className="shrink-0">
        <Copy className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
