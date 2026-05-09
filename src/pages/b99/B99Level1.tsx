import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wrench, ArrowRight, Globe, Database, Bot, CheckCircle2, ExternalLink, Copy, KeyRound, Pencil, Lock, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SmartQuestionEngine, { SmartQuestion } from '@/components/b99/SmartQuestionEngine';

type Mode = 'choose' | 'scratch' | 'connect' | 'reserve' | 'building' | 'done';

const SCRATCH_QUESTIONS: SmartQuestion[] = [
  {
    key: 'business_kind', title: 'وش نوع البزنس الي تبي تبنيه؟', hint: 'اختر الأقرب لفكرتك.', type: 'cards',
    whyThis: 'نوع البزنس يحدد جوهرياً شكل الموقع، الأقسام، نوع قاعدة البيانات، وطريقة استقبال الطلبات. مطعم يحتاج قائمة طعام وسلة، بينما ملعب يحتاج تقويم حجوزات.',
    examples: [
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.thefork.com', label: 'TheFork — مطاعم', url: 'https://www.thefork.com', tag: 'food' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.playtomic.io', label: 'Playtomic — بادل', url: 'https://www.playtomic.io', tag: 'sport' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.shopify.com', label: 'Shopify — متاجر', url: 'https://www.shopify.com', tag: 'shop' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.coursera.org', label: 'Coursera — تعليم', url: 'https://www.coursera.org', tag: 'edu' },
    ],
    videoEmbed: 'https://www.youtube.com/embed/8nbXKW-1uE0',
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
  { key: 'idea', title: 'بكلماتك، وش الفكرة بالضبط؟', hint: 'جملة أو سطرين، خلّها واضحة.', type: 'textarea', placeholder: 'مثلاً: متجر يبيع أكلات صحية بالرياض مع توصيل يومي...',
    whyThis: 'وصفك بكلماتك يلتقطه الذكاء الاصطناعي ليبني محتوى صفحاتك (Hero، عن المنصة، خدماتنا) بنبرتك أنت لا بنبرة قالب جاهز.' },
  { key: 'business_name', title: 'اسم البزنس / المنصة؟', type: 'text', placeholder: 'مثلاً: Greenly، PadelHub، أوميغا...',
    whyThis: 'الاسم يصبح: عنوان التبويب في المتصفح، اللوغو، الـ slug في الرابط (/p/your-name)، وعنوان كل الإيميلات الرسمية.' },
  { key: 'unique_value', title: 'ما الذي يميّزك عن المنافسين؟', hint: 'الميزة الواحدة التي تتفوق فيها.', type: 'textarea', placeholder: 'توصيل خلال 30 دقيقة، أرخص 20%، تجربة مستخدم استثنائية...',
    whyThis: 'هذه الجملة تتحول مباشرة إلى الـ Hero الرئيسي وأول ما يقرأه الزائر — وهي العامل الأول في قرار الشراء/التسجيل.' },
  { key: 'city', title: 'وين سوقك الأساسي؟', type: 'text', placeholder: 'الرياض، جدة، الدمام، الخليج، عالمي...',
    whyThis: 'السوق الجغرافي يحدد: العملة الافتراضية، اللغة الأساسية، خرائط جوجل المضمّنة، وكلمات SEO المحلية.' },
  {
    key: 'audience', title: 'لمن تبني؟ (الجمهور المستهدف)', type: 'cards',
    whyThis: 'الجمهور يحدد نبرة الكتابة، حجم الخطوط، كثافة العناصر، وحتى نوع الصور: شباب يحبون كثافة وجرأة، فئة فاخرة تحب الفراغات الواسعة والذهبي.',
    liveExamplesFor: 'website design for',
    examples: [
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.gymshark.com', label: 'Gymshark — شباب', url: 'https://www.gymshark.com' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.disneyplus.com', label: 'Disney+ — عائلات', url: 'https://www.disneyplus.com' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.rolex.com', label: 'Rolex — فاخر', url: 'https://www.rolex.com' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.salesforce.com', label: 'Salesforce — B2B', url: 'https://www.salesforce.com' },
    ],
    options: [
      { value: 'b2c_young', label: 'مستهلكين شباب 18-30', emoji: '🧑‍🎓' },
      { value: 'b2c_family', label: 'عائلات', emoji: '👨‍👩‍👧' },
      { value: 'b2c_premium', label: 'فئة فاخرة', emoji: '💎' },
      { value: 'b2b', label: 'شركات وأعمال', emoji: '🏢' },
    ],
  },
  {
    key: 'brand_vibe', title: 'الإحساس البصري للعلامة؟', hint: 'يحدد لك الألوان والخطوط تلقائياً.', type: 'cards',
    whyThis: 'الإحساس البصري = شخصية علامتك. اخترت "فخامة"؟ هنا تبدأ بات شارك تستخدم ذهبي/أسود وخطوط Serif. اخترت "تقني داكن"؟ سيان نيون على كحلي. هذا أهم اختيار جمالي.',
    liveExamplesFor: 'website design',
    examples: [
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.dior.com', label: 'Dior — فخامة', url: 'https://www.dior.com', tag: 'luxury' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.apple.com', label: 'Apple — عصري نظيف', url: 'https://www.apple.com', tag: 'modern' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://stripe.com', label: 'Stripe — حيوي', url: 'https://stripe.com', tag: 'vibrant' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://www.airbnb.com', label: 'Airbnb — طبيعي', url: 'https://www.airbnb.com', tag: 'natural' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://vercel.com', label: 'Vercel — تقني داكن', url: 'https://vercel.com', tag: 'tech' },
      { image: 'https://image.thum.io/get/width/600/crop/400/noanimate/https://linear.app', label: 'Linear — مينيمال', url: 'https://linear.app', tag: 'minimal' },
    ],
    videoEmbed: 'https://www.youtube.com/embed/Pe0jFDPHkzo',
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
    whyThis: 'كل صفحة تختارها تُبنى لها روتها الخاص (مثل /pricing, /about) مع أقسام جاهزة. زيادة الصفحات بدون داعٍ تُربك الزائر، فاختر بحكمة.',
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
    whyThis: 'المزايا تفعّل أنظمة كاملة في الباكند: تسجيل الدخول يفعّل جداول المستخدمين، الدفع يربط Stripe، الدردشة تفتح قناة WebSocket. اختر فقط ما تحتاجه فعلاً.',
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
    whyThis: 'طريقة الدفع تحدد نسبة إتمام الطلب (Conversion). الدفع بالبطاقة يرفع الإتمام ضعفين مقارنة بالتحويل البنكي، لكنه يتطلب اشتراك بوابة دفع.',
    options: [
      { value: 'cash', label: 'كاش فقط', emoji: '💵' },
      { value: 'transfer', label: 'تحويل بنكي', emoji: '🏦' },
      { value: 'cod', label: 'دفع عند الاستلام', emoji: '📦' },
      { value: 'card', label: 'بطاقة/Apple Pay', emoji: '💳' },
    ],
  },
  {
    key: 'database_choice', title: 'أين تريد تخزين بياناتك؟', hint: 'تستطيع تغييرها لاحقاً من لوحة المالك.', type: 'cards',
    whyThis: 'قاعدة البيانات هي عقل المنصة. استضافة بات شارك = جاهز فوراً وآمن. قاعدتك الخاصة = ملكية كاملة لكن تتحمل إعدادها. بدون قاعدة = موقع عرض فقط مثل Brochure.',
    videoEmbed: 'https://www.youtube.com/embed/zr1AcZpwFwM',
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

const RESERVE_QUESTIONS: SmartQuestion[] = [
  {
    key: 'business_name', title: 'وش الاسم الي تبيه يطلع في البحث؟', type: 'text',
    placeholder: 'مثلاً: مطعم نسمة، أوميغا للعطور، PadelHub...',
    whyThis: 'هذا الاسم يصبح هويتك على الإنترنت. سيظهر في نتائج البحث، في الرابط، وفي كل مكان يذكرك العملاء فيه. اختر بعناية لأنه أول ما يراه الناس عنك.',
    tips: ['اختر اسماً قصيراً يسهل تذكره', 'تجنب الأرقام والرموز المعقدة', 'يفضل اسم لا يستخدمه أحد آخر'],
  },
  {
    key: 'handle', title: 'وش الاسم المختصر للرابط؟', type: 'text',
    placeholder: 'مثلاً: nasma-cafe',
    whyThis: 'هذا "اسم النطاق" المختصر الي يظهر في الرابط (/p/اسمك). لازم يكون بالإنجليزي صغير، بدون مسافات. هذا الرابط هو الي تشاركه مع العملاء وتضعه في حساباتك.',
    tips: ['أحرف إنجليزية صغيرة فقط', 'يمكن استخدام الشرطة - بين الكلمات', 'اجعله مطابقاً لاسمك التجاري قدر الإمكان'],
    pitfalls: ['لا تستخدم مسافات', 'لا تستخدم أحرف عربية أو رموز', 'تجنب الأسماء العامة جداً مثل shop أو store'],
  },
  {
    key: 'business_kind', title: 'وش نوع نشاطك؟', type: 'cards',
    whyThis: 'يحدد شكل الصفحة الافتتاحية والأقسام التي تظهر للزائر.',
    options: [
      { value: 'food', label: 'مطعم/مقهى', emoji: '🍽️' },
      { value: 'shop', label: 'متجر', emoji: '🛍️' },
      { value: 'service', label: 'خدمات', emoji: '🛠️' },
      { value: 'sport', label: 'رياضة/ملاعب', emoji: '🎾' },
      { value: 'edu', label: 'تعليم', emoji: '📚' },
      { value: 'other', label: 'غير ذلك', emoji: '✨' },
    ],
  },
  { key: 'idea', title: 'وصف مختصر لنشاطك', type: 'textarea',
    placeholder: 'سطر أو سطرين عن نشاطك...',
    whyThis: 'هذا الوصف يكون "Meta Description" — الجملة التي تطلع تحت اسمك في نتائج جوجل. اكتبها بإقناع وبكلمات يبحث عنها عملاؤك فعلاً.',
  },
  { key: 'city', title: 'مدينتك / منطقتك؟', type: 'text', placeholder: 'الرياض، جدة، الدمام...',
    whyThis: 'يساعد جوجل يعرض صفحتك للناس القريبين منك جغرافياً.',
  },
  { key: 'owner_email', title: 'إيميلك (للوصول لاحقاً)', type: 'text', placeholder: 'you@example.com' },
  { key: 'owner_password', title: 'كلمة سر تتحكم فيها بصفحتك', type: 'text', placeholder: 'كلمة قوية 8 أحرف فأكثر',
    whyThis: 'بهذه الكلمة فقط تقدر تعدل اسمك أو معلوماتك أو تحذف الصفحة لاحقاً. احفظها في مكان آمن.',
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

  const handleReserve = async (answers: Record<string, any>) => {
    // Normalize handle to a safe slug
    const rawHandle = String(answers.handle || answers.business_name || 'mybrand').trim();
    const safeHandle = rawHandle.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'mybrand';
    const enriched = {
      ...answers,
      handle: safeHandle,
      desired_slug: safeHandle,
      brand_vibe: answers.brand_vibe || 'modern',
      audience: answers.audience || 'b2c_young',
      pages: ['home', 'contact'],
      database_choice: 'none_yet',
      payment: 'cash',
      unique_value: answers.idea || answers.business_name || '',
    };
    setLoading(true); setMode('building');
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generate_platform', payload: { level: 1, mode: 'reserve', answers: enriched } },
      });
      if (error) throw error;
      setResult(data);
      setMode('done');
      toast.success(`تم حجز اسمك: ${safeHandle} 🎉`);
    } catch (e: any) {
      toast.error(e.message || 'تعذّر حجز الاسم'); setMode('reserve');
    } finally { setLoading(false); }
  };

  if (mode === 'choose') {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <Header level={1} title="ابني من الصفر" subtitle="اختر مسارك المناسب — كل مسار يأخذك مباشرة لما تحتاجه." />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            onClick={() => setMode('reserve')}
            icon={Bookmark}
            accent="from-emerald-500 via-teal-500 to-cyan-500"
            badge="احجز اسمك على الإنترنت"
            title="ما عندي موقع ولا منصة"
            desc="سجّل اسم نشاطك في بات شارك حتى يطلع للناس لما يبحثون عنك."
            bullets={['اسم/رابط خاص بك', 'صفحة عرض جاهزة', 'يظهر في محركات البحث', 'تقدر تطوّره لاحقاً']}
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

  if (mode === 'reserve') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Header level={1} title="احجز اسمك" subtitle="خطوات سريعة لحجز اسم نشاطك على الإنترنت — حتى لو ما عندك موقع." onBack={() => setMode('choose')} />
        <SmartQuestionEngine questions={RESERVE_QUESTIONS} onComplete={handleReserve} loading={loading} accent="from-emerald-500 to-cyan-500" ctaLabel="احجز اسمي الآن" />
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
