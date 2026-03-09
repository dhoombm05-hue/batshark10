import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessFeasibilities, type BusinessFeasibilityRecord } from '@/hooks/useBusinessFeasibility';
import { Building2, Brain, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Trash2, Plus, Loader2, Shield, DollarSign, Users, Clock, BarChart3, Target, MapPin, Briefcase, Scale, Lightbulb, Rocket, ArrowLeft, ArrowRight, Sparkles, Globe, Landmark, Wrench, CalendarClock, TrendingDown, Handshake } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

interface QuestionDef {
  id: string;
  label: string;
  description?: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: { value: string; label: string; icon?: string }[];
  required?: boolean;
}

interface QuestionGroup {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  questions: QuestionDef[];
}

const QUESTION_GROUPS: QuestionGroup[] = [
  {
    title: 'معلومات البزنس الأساسية',
    subtitle: 'حدد هوية المشروع ونوعه والفكرة الأساسية',
    icon: Building2,
    color: 'text-section-finance',
    questions: [
      { id: 'name', label: 'اسم البزنس / المشروع المقترح', description: 'الاسم التجاري أو اسم العلامة التجارية المقترحة', type: 'text', placeholder: 'مثال: مطعم "أومامي" للمأكولات اليابانية', required: true },
      { id: 'type', label: 'القطاع / تصنيف النشاط التجاري', description: 'حدد المجال الرئيسي الذي ينتمي إليه البزنس', type: 'select', options: [
        { value: 'food_beverage', label: '🍽️ مطاعم وكافيهات ومأكولات' },
        { value: 'ecommerce', label: '🛒 تجارة إلكترونية وتجزئة' },
        { value: 'tech_services', label: '💻 خدمات تقنية وبرمجيات' },
        { value: 'real_estate', label: '🏗️ عقارات وتطوير عمراني' },
        { value: 'manufacturing', label: '🏭 تصنيع وإنتاج' },
        { value: 'consulting', label: '📋 استشارات وخدمات مهنية' },
        { value: 'education', label: '🎓 تعليم وتدريب وتطوير' },
        { value: 'health_beauty', label: '💆 صحة وجمال وعناية شخصية' },
        { value: 'tourism', label: '✈️ سياحة وسفر وضيافة' },
        { value: 'logistics', label: '🚚 لوجستيات ونقل وشحن' },
        { value: 'agriculture', label: '🌾 زراعة وإنتاج غذائي' },
        { value: 'entertainment', label: '🎯 ترفيه وفعاليات ورياضة' },
        { value: 'fintech', label: '🏦 خدمات مالية وتقنية مالية' },
        { value: 'media', label: '📱 إعلام ومحتوى رقمي' },
        { value: 'other', label: '📌 قطاع آخر' },
      ] },
      { id: 'description', label: 'وصف تفصيلي للفكرة', description: 'اشرح الفكرة بالتفصيل: ماذا تقدم؟ كيف تعمل؟ ما القيمة المضافة؟', type: 'textarea', placeholder: 'مثال: مطعم متخصص في المأكولات اليابانية الأصيلة مع تجربة تفاعلية حيث يراقب العميل تحضير طعامه أمامه. نستهدف شريحة الشباب والعائلات في المنطقة الشرقية...' },
      { id: 'unique_value', label: 'القيمة الفريدة (Value Proposition)', description: 'ما الذي يجعل هذا البزنس مختلفاً ولماذا سيختاره العميل؟', type: 'textarea', placeholder: 'مثال: نقدم تجربة طعام تفاعلية فريدة + مكونات مستوردة حصرياً + أسعار تنافسية مقارنة بالمنافسين...' },
    ],
  },
  {
    title: 'تحليل السوق والجمهور',
    subtitle: 'حدد السوق المستهدف والعملاء المحتملين ومستوى المنافسة',
    icon: Globe,
    color: 'text-section-forecast',
    questions: [
      { id: 'target_market', label: 'النطاق الجغرافي للسوق', description: 'حدد المدى الجغرافي لعملياتك', type: 'select', options: [
        { value: 'local_city', label: '📍 محلي - مدينة واحدة' },
        { value: 'local_multi', label: '🏙️ محلي - عدة مدن' },
        { value: 'national', label: '🇸🇦 وطني - جميع أنحاء المملكة' },
        { value: 'gcc', label: '🌍 إقليمي - دول الخليج' },
        { value: 'mena', label: '🌐 الشرق الأوسط وشمال أفريقيا' },
        { value: 'international', label: '🌏 دولي - أسواق عالمية' },
      ] },
      { id: 'target_audience', label: 'الشريحة المستهدفة بالتفصيل', description: 'صف العميل المثالي: العمر، الدخل، الاهتمامات، السلوك الشرائي', type: 'textarea', placeholder: 'مثال: شباب وشابات (18-35 سنة)، دخل متوسط-مرتفع، يهتمون بتجارب الطعام الجديدة، نشطين على السوشيال ميديا...' },
      { id: 'market_size', label: 'حجم السوق المتوقع', description: 'تقديرك لحجم السوق الإجمالي', type: 'select', options: [
        { value: 'niche', label: '🎯 سوق متخصص (Niche) - أقل من 10,000 عميل محتمل' },
        { value: 'small', label: '📊 سوق صغير - 10,000 إلى 100,000 عميل' },
        { value: 'medium', label: '📈 سوق متوسط - 100,000 إلى 1 مليون عميل' },
        { value: 'large', label: '🚀 سوق كبير - أكثر من 1 مليون عميل' },
        { value: 'unknown', label: '❓ لست متأكداً بعد' },
      ] },
      { id: 'competition_level', label: 'مستوى المنافسة في السوق', description: 'قيّم حدة المنافسة الحالية', type: 'select', options: [
        { value: 'blue_ocean', label: '🌊 سوق جديد تماماً (Blue Ocean) - لا منافسة تقريباً' },
        { value: 'low', label: '✅ منافسة منخفضة - عدد محدود من المنافسين' },
        { value: 'moderate', label: '⚖️ منافسة متوسطة - منافسون موجودون لكن فرص متاحة' },
        { value: 'high', label: '🔥 منافسة عالية - سوق تنافسي بشدة' },
        { value: 'saturated', label: '⛔ سوق مشبع - صعب الدخول والتميز' },
      ] },
      { id: 'competitive_advantage', label: 'الميزة التنافسية الأساسية', description: 'ما الذي يمنحك أفضلية على المنافسين؟', type: 'textarea', placeholder: 'مثال: خبرة 10 سنوات في المجال، تقنية حصرية، علاقات قوية مع الموردين، سعر أقل بـ 30%...' },
    ],
  },
  {
    title: 'الهيكل المالي والاستثماري',
    subtitle: 'حدد التكاليف والميزانية والإيرادات المتوقعة',
    icon: DollarSign,
    color: 'text-section-revenue',
    questions: [
      { id: 'startup_budget', label: 'رأس المال المبدئي المطلوب', description: 'إجمالي المبلغ اللازم لبدء التشغيل (تأسيس + تجهيز + رأس مال عامل)', type: 'select', options: [
        { value: 'micro', label: '💰 أقل من 50,000 ريال - مشروع متناهي الصغر' },
        { value: 'small', label: '💵 50,000 - 200,000 ريال - مشروع صغير' },
        { value: 'medium_small', label: '💳 200,000 - 500,000 ريال - مشروع متوسط صغير' },
        { value: 'medium', label: '🏦 500,000 - 1,000,000 ريال - مشروع متوسط' },
        { value: 'medium_large', label: '📊 1 - 5 مليون ريال - مشروع متوسط كبير' },
        { value: 'large', label: '🏢 5 - 20 مليون ريال - مشروع كبير' },
        { value: 'enterprise', label: '🏙️ أكثر من 20 مليون ريال - مشروع ضخم' },
      ] },
      { id: 'funding_source', label: 'مصدر التمويل', description: 'كيف ستموّل المشروع؟', type: 'select', options: [
        { value: 'self', label: '👤 تمويل ذاتي بالكامل' },
        { value: 'family', label: '👨‍👩‍👦 تمويل عائلي' },
        { value: 'partner', label: '🤝 شراكة / مستثمر' },
        { value: 'bank', label: '🏦 تمويل بنكي / قرض' },
        { value: 'gov_support', label: '🏛️ دعم حكومي (منشآت/بنك التنمية)' },
        { value: 'vc', label: '🚀 رأس مال مغامر (VC)' },
        { value: 'mixed', label: '🔀 مصادر متعددة' },
      ] },
      { id: 'monthly_expenses', label: 'المصاريف التشغيلية الشهرية المتوقعة', description: 'شامل الرواتب والإيجار والمواد والتسويق وغيرها', type: 'select', options: [
        { value: 'under_10k', label: '📉 أقل من 10,000 ريال شهرياً' },
        { value: '10k_30k', label: '📊 10,000 - 30,000 ريال شهرياً' },
        { value: '30k_100k', label: '📈 30,000 - 100,000 ريال شهرياً' },
        { value: '100k_300k', label: '💹 100,000 - 300,000 ريال شهرياً' },
        { value: '300k_1m', label: '🔝 300,000 - 1 مليون ريال شهرياً' },
        { value: 'over_1m', label: '🏦 أكثر من 1 مليون ريال شهرياً' },
      ] },
      { id: 'expected_revenue', label: 'الإيرادات الشهرية المتوقعة (بعد التشغيل الكامل)', description: 'تقديرك للإيرادات بعد اكتمال التشغيل واستقرار السوق', type: 'select', options: [
        { value: 'under_20k', label: '📉 أقل من 20,000 ريال شهرياً' },
        { value: '20k_50k', label: '📊 20,000 - 50,000 ريال شهرياً' },
        { value: '50k_200k', label: '📈 50,000 - 200,000 ريال شهرياً' },
        { value: '200k_500k', label: '💹 200,000 - 500,000 ريال شهرياً' },
        { value: '500k_2m', label: '🔝 500,000 - 2 مليون ريال شهرياً' },
        { value: 'over_2m', label: '🏦 أكثر من 2 مليون ريال شهرياً' },
      ] },
      { id: 'revenue_model', label: 'نموذج الإيرادات والتسعير', description: 'كيف سيحقق البزنس الدخل؟', type: 'select', options: [
        { value: 'direct_sales', label: '🛍️ بيع مباشر (منتجات / خدمات)' },
        { value: 'subscription', label: '🔄 اشتراكات شهرية / سنوية (SaaS)' },
        { value: 'commission', label: '💱 عمولات ورسوم وساطة' },
        { value: 'freemium', label: '🆓 فريميوم (مجاني + مدفوع)' },
        { value: 'licensing', label: '📜 ترخيص أو امتياز تجاري' },
        { value: 'advertising', label: '📢 إعلانات ورعايات' },
        { value: 'marketplace', label: '🏪 منصة سوق إلكتروني (Marketplace)' },
        { value: 'hybrid', label: '🔀 نموذج هجين متعدد المصادر' },
      ] },
      { id: 'profit_target', label: 'هامش الربح المستهدف', description: 'ما نسبة الربح الصافي التي تستهدفها؟', type: 'select', options: [
        { value: 'under_10', label: '📉 أقل من 10% - هامش منخفض (حجم عالي)' },
        { value: '10_20', label: '📊 10% - 20% - هامش متوسط' },
        { value: '20_35', label: '📈 20% - 35% - هامش جيد' },
        { value: '35_50', label: '💹 35% - 50% - هامش مرتفع' },
        { value: 'over_50', label: '🔝 أكثر من 50% - هامش ممتاز' },
      ] },
    ],
  },
  {
    title: 'الموقع والبنية التحتية',
    subtitle: 'حدد متطلبات الموقع والتجهيزات والتقنية',
    icon: MapPin,
    color: 'text-section-employees',
    questions: [
      { id: 'has_rent', label: 'نموذج العمل والموقع', description: 'هل يحتاج البزنس لموقع فعلي؟', type: 'select', options: [
        { value: 'online_only', label: '🌐 أونلاين فقط - بدون موقع فعلي' },
        { value: 'home_based', label: '🏠 من المنزل / مكتب منزلي' },
        { value: 'single_location', label: '🏪 موقع واحد (محل / مكتب / مصنع)' },
        { value: 'multi_location', label: '🏬 مواقع متعددة' },
        { value: 'hybrid', label: '🔀 أونلاين + موقع فعلي' },
        { value: 'mobile', label: '🚐 متنقل (عربة / فعاليات)' },
      ] },
      { id: 'rent_cost', label: 'تكلفة الإيجار / الموقع الشهرية', description: 'التكلفة الشهرية للموقع شاملة الخدمات', type: 'select', options: [
        { value: 'none', label: '🚫 لا يوجد إيجار' },
        { value: 'under_5k', label: '💰 أقل من 5,000 ريال شهرياً' },
        { value: '5k_15k', label: '💵 5,000 - 15,000 ريال شهرياً' },
        { value: '15k_50k', label: '💳 15,000 - 50,000 ريال شهرياً' },
        { value: '50k_150k', label: '🏦 50,000 - 150,000 ريال شهرياً' },
        { value: 'over_150k', label: '🏢 أكثر من 150,000 ريال شهرياً' },
      ] },
      { id: 'technology_required', label: 'المتطلبات التقنية والرقمية', description: 'ما مستوى التقنية المطلوبة لتشغيل البزنس؟', type: 'select', options: [
        { value: 'minimal', label: '📝 لا يحتاج تقنية تذكر' },
        { value: 'basic_web', label: '🌐 موقع إلكتروني + حسابات سوشيال' },
        { value: 'app', label: '📱 تطبيق جوال' },
        { value: 'platform', label: '💻 منصة رقمية متكاملة' },
        { value: 'custom_software', label: '⚙️ أنظمة وبرمجيات مخصصة' },
        { value: 'advanced_tech', label: '🤖 تقنيات متقدمة (AI / IoT / Blockchain)' },
      ] },
      { id: 'equipment_needed', label: 'التجهيزات والمعدات المطلوبة', description: 'صف المعدات والتجهيزات الأساسية', type: 'textarea', placeholder: 'مثال: معدات مطبخ صناعي، أجهزة POS، ديكور داخلي، سيارات توصيل...' },
    ],
  },
  {
    title: 'الموارد البشرية والفريق',
    subtitle: 'حدد حجم الفريق المطلوب والكفاءات اللازمة',
    icon: Users,
    color: 'text-section-strategic',
    questions: [
      { id: 'employees_needed', label: 'عدد الموظفين المطلوبين للتشغيل', description: 'العدد المتوقع خلال السنة الأولى', type: 'select', options: [
        { value: 'solo', label: '👤 مشروع فردي - بدون موظفين' },
        { value: 'micro', label: '👥 1-3 موظفين - فريق صغير جداً' },
        { value: 'small', label: '👨‍👩‍👦‍👦 4-10 موظفين - فريق صغير' },
        { value: 'medium', label: '🏢 11-25 موظف - فريق متوسط' },
        { value: 'large', label: '🏬 26-50 موظف - فريق كبير' },
        { value: 'enterprise', label: '🏙️ أكثر من 50 موظف - مؤسسة' },
      ] },
      { id: 'key_roles', label: 'الأدوار والمناصب الرئيسية المطلوبة', description: 'ما المناصب الأساسية التي تحتاجها؟', type: 'textarea', placeholder: 'مثال: مدير تشغيل، شيف رئيسي، مسؤول تسويق رقمي، محاسب، خدمة عملاء...' },
      { id: 'salary_range', label: 'إجمالي الرواتب الشهرية المتوقعة', type: 'select', options: [
        { value: 'none', label: '🚫 لا يوجد رواتب (فردي)' },
        { value: 'under_15k', label: '💰 أقل من 15,000 ريال شهرياً' },
        { value: '15k_50k', label: '💵 15,000 - 50,000 ريال شهرياً' },
        { value: '50k_150k', label: '💳 50,000 - 150,000 ريال شهرياً' },
        { value: '150k_500k', label: '🏦 150,000 - 500,000 ريال شهرياً' },
        { value: 'over_500k', label: '🏢 أكثر من 500,000 ريال شهرياً' },
      ] },
    ],
  },
  {
    title: 'الجوانب التنظيمية والقانونية',
    subtitle: 'حدد المتطلبات القانونية والتنظيمية والتراخيص',
    icon: Landmark,
    color: 'text-section-invest',
    questions: [
      { id: 'licenses_needed', label: 'التراخيص والمتطلبات القانونية', description: 'ما نوع التراخيص المطلوبة للنشاط؟', type: 'select', options: [
        { value: 'basic', label: '📋 سجل تجاري فقط' },
        { value: 'industry_license', label: '🏭 ترخيص صناعي / تجاري متخصص' },
        { value: 'franchise', label: '📜 ترخيص امتياز (فرانشايز)' },
        { value: 'health_safety', label: '🏥 تراخيص صحية وسلامة غذائية' },
        { value: 'gov_complex', label: '🏛️ تراخيص حكومية معقدة (بيئة / طاقة / أمن)' },
        { value: 'international', label: '🌍 تراخيص تصدير / استيراد دولية' },
        { value: 'unsure', label: '❓ غير متأكد - أحتاج استشارة' },
      ] },
      { id: 'legal_structure', label: 'الشكل القانوني للمنشأة', type: 'select', options: [
        { value: 'individual', label: '👤 مؤسسة فردية' },
        { value: 'llc', label: '🏢 شركة ذات مسؤولية محدودة (LLC)' },
        { value: 'partnership', label: '🤝 شركة تضامنية' },
        { value: 'joint_stock', label: '📊 شركة مساهمة' },
        { value: 'undecided', label: '❓ لم أقرر بعد' },
      ] },
    ],
  },
  {
    title: 'استراتيجية النمو والمخاطر',
    subtitle: 'حدد خطة النمو والتوسع والمخاطر المحتملة واستراتيجية الخروج',
    icon: Rocket,
    color: 'text-section-ai',
    questions: [
      { id: 'timeline_to_launch', label: 'الجدول الزمني للإطلاق', description: 'المدة المتوقعة من بداية التأسيس حتى أول يوم تشغيل', type: 'select', options: [
        { value: 'under_1m', label: '⚡ أقل من شهر - إطلاق سريع' },
        { value: '1_3m', label: '🗓️ 1-3 أشهر' },
        { value: '3_6m', label: '📅 3-6 أشهر' },
        { value: '6_12m', label: '📆 6-12 شهر' },
        { value: 'over_12m', label: '🗓️ أكثر من سنة' },
      ] },
      { id: 'scalability', label: 'قابلية التوسع والنمو', description: 'ما مدى سهولة تكبير البزنس مستقبلاً؟', type: 'select', options: [
        { value: 'hard', label: '🔒 صعب التوسع - مرتبط بجهد شخصي' },
        { value: 'moderate_cost', label: '💰 ممكن التوسع بتكاليف عالية' },
        { value: 'moderate', label: '⚖️ قابل للتوسع بشكل معقول' },
        { value: 'easy', label: '📈 سهل التوسع - نموذج قابل للتكرار' },
        { value: 'highly_scalable', label: '🚀 قابل للتوسع بشكل كبير (رقمي/منصة)' },
      ] },
      { id: 'seasonality', label: 'الموسمية وثبات الطلب', description: 'هل الطلب ثابت طوال السنة أم موسمي؟', type: 'select', options: [
        { value: 'year_round', label: '📊 طلب ثابت طوال السنة' },
        { value: 'seasonal_peak', label: '📈 ثابت مع ذروة موسمية' },
        { value: 'multi_season', label: '🔄 موسمي - عدة مواسم نشطة' },
        { value: 'single_season', label: '📅 موسم واحد رئيسي فقط' },
        { value: 'volatile', label: '📉 متقلب وغير متوقع' },
      ] },
      { id: 'partnerships', label: 'الشراكات والعلاقات المطلوبة', description: 'هل تحتاج شراكات استراتيجية أو علاقات مع موردين؟', type: 'textarea', placeholder: 'مثال: موردين للمواد الخام من اليابان، شراكة مع تطبيقات التوصيل، تعاون مع مؤثرين...' },
      { id: 'risks_known', label: 'المخاطر والتحديات المتوقعة', description: 'ما أبرز المخاطر التي تراها في هذا البزنس؟', type: 'textarea', placeholder: 'مثال: تذبذب أسعار المواد الخام، صعوبة استقطاب كفاءات متخصصة، تغيرات تنظيمية...' },
      { id: 'why_now', label: 'لماذا هذا التوقيت مناسب؟', description: 'ما العوامل التي تجعل الآن الوقت المثالي للبدء؟', type: 'textarea', placeholder: 'مثال: رؤية 2030 تدعم القطاع، نمو الطلب بنسبة 40% سنوياً، انسحاب منافس رئيسي...' },
      { id: 'exit_strategy', label: 'استراتيجية الخروج / المستقبل البعيد', description: 'ما خطتك طويلة الأمد لهذا البزنس؟', type: 'select', options: [
        { value: 'long_term', label: '🏢 بزنس مستمر طويل الأمد (عائلي/شخصي)' },
        { value: 'sell', label: '💰 بيع البزنس بعد نموه' },
        { value: 'franchise', label: '🏬 تحويله لنموذج فرانشايز' },
        { value: 'ipo', label: '📊 طرح عام (IPO)' },
        { value: 'merge', label: '🤝 دمج مع شركة أكبر' },
        { value: 'undecided', label: '🤔 لم أحدد بعد' },
      ] },
      { id: 'additional_notes', label: 'معلومات إضافية مهمة', description: 'أي تفاصيل أخرى تود أن يأخذها الذكاء الاصطناعي بعين الاعتبار', type: 'textarea', placeholder: 'أضف أي معلومات تعتقد أنها مهمة لتحليل أدق...' },
    ],
  },
];

const recommendationConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  strongly_recommended: { label: '✅ موصى به بشدة', color: 'bg-section-revenue/20 text-section-revenue', icon: CheckCircle2 },
  recommended: { label: '👍 موصى به', color: 'bg-section-forecast/20 text-section-forecast', icon: TrendingUp },
  cautious: { label: '⚠️ يحتاج حذر ودراسة', color: 'bg-section-invest/20 text-section-invest', icon: AlertTriangle },
  not_recommended: { label: '❌ غير موصى به حالياً', color: 'bg-destructive/20 text-destructive', icon: XCircle },
};

export default function BusinessFeasibility() {
  const { feasibilities, isLoading, createFeasibility, analyzeBusiness, deleteFeasibility } = useBusinessFeasibilities();
  const [showForm, setShowForm] = useState(false);
  const [showResult, setShowResult] = useState<BusinessFeasibilityRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = QUESTION_GROUPS.length;
  const currentGroup = QUESTION_GROUPS[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const GroupIcon = currentGroup?.icon;

  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;
  const totalQuestions = QUESTION_GROUPS.reduce((sum, g) => sum + g.questions.length, 0);

  const handleSubmit = async () => {
    const name = answers.name || 'بزنس جديد';
    setAnalyzing(true);
    try {
      const record = await createFeasibility.mutateAsync({
        title: name,
        businessType: answers.type || '',
        answers,
      });
      const result = await analyzeBusiness.mutateAsync({
        feasibilityId: record.id,
        answers,
      });
      setShowForm(false);
      setAnswers({});
      setCurrentStep(0);
      setShowResult({ ...record, ai_analysis: result.data, status: 'analyzed', feasibility_score: result.data?.feasibility_score || 0, risk_score: result.data?.risk_score || 0, recommendation: result.data?.recommendation || 'cautious' });
    } catch { /* handled */ }
    setAnalyzing(false);
  };

  const renderField = (q: QuestionDef) => {
    if (q.type === 'select' && q.options) {
      return (
        <Select value={answers[q.id] || ''} onValueChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}>
          <SelectTrigger className="h-auto min-h-[2.5rem] py-2">
            <SelectValue placeholder="اختر الإجابة المناسبة..." />
          </SelectTrigger>
          <SelectContent>
            {q.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="py-2.5">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (q.type === 'textarea') {
      return <Textarea placeholder={q.placeholder} value={answers[q.id] || ''} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} rows={3} className="resize-none" />;
    }
    return <Input placeholder={q.placeholder} value={answers[q.id] || ''} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} />;
  };

  const renderAnalysis = (analysis: any) => {
    if (!analysis) return null;
    const rec = recommendationConfig[analysis.recommendation] || recommendationConfig.cautious;
    const RecIcon = rec.icon;

    return (
      <div className="space-y-6">
        {/* Header Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/80 border-section-revenue/30">
            <CardContent className="p-5 text-center space-y-2">
              <Target className="w-10 h-10 mx-auto text-section-revenue" />
              <p className="text-4xl font-bold text-foreground">{analysis.feasibility_score}<span className="text-lg text-muted-foreground">%</span></p>
              <p className="text-sm font-medium text-muted-foreground">درجة الجدوى الاقتصادية</p>
              <Progress value={analysis.feasibility_score} className="mt-2" />
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-section-invest/30">
            <CardContent className="p-5 text-center space-y-2">
              <Shield className="w-10 h-10 mx-auto text-section-invest" />
              <p className="text-4xl font-bold text-foreground">{analysis.risk_score}<span className="text-lg text-muted-foreground">%</span></p>
              <p className="text-sm font-medium text-muted-foreground">مستوى المخاطر</p>
              <Progress value={analysis.risk_score} className="mt-2" />
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-section-ai/30">
            <CardContent className="p-5 text-center space-y-2">
              <RecIcon className="w-10 h-10 mx-auto" />
              <Badge className={`text-base px-4 py-1.5 ${rec.color}`}>{rec.label}</Badge>
              <p className="text-sm font-medium text-muted-foreground">التوصية النهائية</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="bg-card/80 border-section-ai/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-section-ai" /> الملخص التنفيذي</CardTitle></CardHeader>
          <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis.summary}</p></CardContent>
        </Card>

        {analysis.recommendation_text && (
          <Card className="bg-card/80 border-section-forecast/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-section-forecast" /> التوصية التفصيلية</CardTitle></CardHeader>
            <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis.recommendation_text}</p></CardContent>
          </Card>
        )}

        {analysis.key_metrics?.length > 0 && (
          <Card className="bg-card/80 border-section-finance/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-section-finance" /> المؤشرات الرئيسية</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {analysis.key_metrics.map((m: any, i: number) => (
                  <div key={i} className={`p-3 rounded-xl border ${m.status === 'positive' ? 'border-section-revenue/30 bg-section-revenue/5' : m.status === 'negative' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30'}`}>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-bold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.strengths?.length > 0 && (
          <Card className="bg-card/80 border-section-revenue/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-section-revenue" /> نقاط القوة والفرص</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-foreground p-2 rounded-lg bg-section-revenue/5"><CheckCircle2 className="w-4 h-4 text-section-revenue mt-1 shrink-0" /><span>{s}</span></li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysis.risks?.length > 0 && (
          <Card className="bg-card/80 border-section-invest/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-section-invest" /> تحليل المخاطر وخطط التخفيف</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.risks.map((r: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={r.severity === 'critical' ? 'text-destructive border-destructive' : r.severity === 'high' ? 'text-section-invest border-section-invest' : 'text-muted-foreground'}>
                        {r.severity === 'critical' ? '🔴 حرج' : r.severity === 'high' ? '🟠 عالي' : r.severity === 'medium' ? '🟡 متوسط' : '🟢 منخفض'}
                      </Badge>
                      <span className="font-semibold text-foreground">{r.risk}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pr-2">💡 <span className="font-medium">خطة التخفيف:</span> {r.mitigation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.financial_analysis && (
          <Card className="bg-card/80 border-section-finance/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-section-finance" /> التحليل المالي التفصيلي</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'تكلفة التأسيس المقدرة', value: analysis.financial_analysis.estimated_startup_cost, icon: '🏗️' },
                  { label: 'المصاريف الشهرية', value: analysis.financial_analysis.estimated_monthly_expenses, icon: '📉' },
                  { label: 'الإيرادات الشهرية المتوقعة', value: analysis.financial_analysis.estimated_monthly_revenue, icon: '📈' },
                  { label: 'العائد على الاستثمار (ROI)', value: analysis.financial_analysis.estimated_roi_months ? `${analysis.financial_analysis.estimated_roi_months} شهر` : '-', icon: '🔄' },
                  { label: 'نقطة التعادل (Break Even)', value: analysis.financial_analysis.break_even_months ? `${analysis.financial_analysis.break_even_months} شهر` : '-', icon: '⚖️' },
                  { label: 'هامش الربح المتوقع', value: analysis.financial_analysis.profit_margin_estimate, icon: '💹' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground">{item.icon} {item.label}</p>
                    <p className="text-lg font-bold text-foreground mt-1">{item.value || '-'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.company_fit && (
          <Card className="bg-card/80 border-section-strategic/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-section-strategic" /> مدى التوافق مع الشركة</CardTitle></CardHeader>
            <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis.company_fit}</p></CardContent>
          </Card>
        )}

        {analysis.suitable_employees?.length > 0 && (
          <Card className="bg-card/80 border-section-employees/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-section-employees" /> الموظفين المرشحين للإدارة</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.suitable_employees.map((e: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 flex items-start gap-3">
                    <Users className="w-5 h-5 text-section-employees mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">{e.name} {e.role_suggestion && <Badge variant="outline" className="mr-2">{e.role_suggestion}</Badge>}</p>
                      <p className="text-sm text-muted-foreground mt-1">{e.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.timeline?.length > 0 && (
          <Card className="bg-card/80 border-section-forecast/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-section-forecast" /> خطة التنفيذ المقترحة</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.timeline.map((phase: any, i: number) => (
                  <div key={i} className="relative pr-8 border-r-2 border-section-forecast/30">
                    <div className="absolute -right-[9px] top-1 w-4 h-4 rounded-full bg-section-forecast ring-4 ring-card" />
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-section-forecast/15 text-section-forecast">{`المرحلة ${i + 1}`}</Badge>
                        <span className="font-bold text-foreground">{phase.phase}</span>
                        <Badge variant="outline">{phase.duration}</Badge>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1 pr-2">
                        {phase.tasks.map((t: string, j: number) => <li key={j} className="flex items-start gap-2"><span className="text-section-forecast mt-0.5">›</span> {t}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (showResult) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
                <div className="p-2 rounded-xl bg-section-ai/15"><Sparkles className="w-6 h-6 text-section-ai" /></div>
                تقرير تحليل الجدوى: {showResult.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">تم التحليل بواسطة الذكاء الاصطناعي بناءً على {answeredCount || totalQuestions} معيار</p>
            </div>
            <Button variant="outline" onClick={() => setShowResult(null)} className="gap-2"><ArrowRight className="w-4 h-4" /> العودة للقائمة</Button>
          </div>
          {renderAnalysis(showResult.ai_analysis)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-section-invest/15">
                <Building2 className="w-6 h-6 text-section-invest" />
              </div>
              محلل جدوى الأعمال الذكي
            </h1>
            <p className="text-muted-foreground text-sm mt-1">تحليل شامل ومتعدد الأبعاد بالذكاء الاصطناعي لتقييم أي فرصة استثمارية قبل اتخاذ القرار</p>
          </div>
          <Button onClick={() => { setShowForm(true); setCurrentStep(0); setAnswers({}); }} className="gap-2 bg-section-invest hover:bg-section-invest/90">
            <Plus className="w-4 h-4" /> تحليل فرصة جديدة
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي التحليلات', value: feasibilities.length, icon: BarChart3, color: 'text-section-finance' },
            { label: 'فرص موصى بها', value: feasibilities.filter(f => f.recommendation === 'recommended' || f.recommendation === 'strongly_recommended').length, icon: CheckCircle2, color: 'text-section-revenue' },
            { label: 'تحتاج دراسة أعمق', value: feasibilities.filter(f => f.recommendation === 'cautious').length, icon: Scale, color: 'text-section-invest' },
            { label: 'غير مجدية', value: feasibilities.filter(f => f.recommendation === 'not_recommended').length, icon: TrendingDown, color: 'text-destructive' },
          ].map(stat => (
            <Card key={stat.label} className="bg-card/80 backdrop-blur-sm border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Form */}
        {showForm && currentGroup && (
          <Card className="bg-card/90 backdrop-blur-sm border-section-invest/30">
            <CardHeader className="space-y-3">
              {/* Step indicators */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                {QUESTION_GROUPS.map((g, i) => {
                  const StepIcon = g.icon;
                  return (
                    <button key={i} onClick={() => setCurrentStep(i)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${i === currentStep ? 'bg-section-invest/20 text-section-invest ring-1 ring-section-invest/30' : i < currentStep ? 'bg-section-revenue/10 text-section-revenue' : 'bg-muted text-muted-foreground'}`}>
                      <StepIcon className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">{g.title}</span>
                      <span className="md:hidden">{i + 1}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-muted`}>
                    <GroupIcon className={`w-5 h-5 ${currentGroup.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{currentGroup.title}</CardTitle>
                    <CardDescription>{currentGroup.subtitle}</CardDescription>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">الإكمال</p>
                  <p className="text-lg font-bold text-foreground">{answeredCount}/{totalQuestions}</p>
                </div>
              </div>
              <Progress value={progress} className="mt-1" />
            </CardHeader>
            <CardContent className="space-y-6">
              {currentGroup.questions.map(q => (
                <div key={q.id} className="space-y-2 p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-foreground">{q.label}</label>
                    {q.required && <Badge variant="outline" className="text-[10px] px-1.5 py-0">مطلوب</Badge>}
                    {answers[q.id]?.trim() && <CheckCircle2 className="w-4 h-4 text-section-revenue" />}
                  </div>
                  {q.description && <p className="text-xs text-muted-foreground -mt-1">{q.description}</p>}
                  {renderField(q)}
                </div>
              ))}

              <div className="flex gap-3 justify-between pt-4 border-t border-border">
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} className="gap-2">
                      <ArrowRight className="w-4 h-4" /> السابق
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => { setShowForm(false); setAnswers({}); setCurrentStep(0); }}>إلغاء</Button>
                </div>
                {currentStep < totalSteps - 1 ? (
                  <Button onClick={() => setCurrentStep(s => s + 1)} className="gap-2 bg-section-invest hover:bg-section-invest/90">
                    التالي <ArrowLeft className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={analyzing || !answers.name?.trim()} className="gap-2 bg-section-ai hover:bg-section-ai/90">
                    {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحليل المتقدم...</> : <><Brain className="w-4 h-4" /> تحليل شامل بالذكاء الاصطناعي</>}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="bg-card/80"><CardContent className="p-12 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />جاري تحميل التحليلات...</CardContent></Card>
          ) : feasibilities.length === 0 && !showForm ? (
            <Card className="bg-card/80 border-dashed border-2 border-section-invest/20">
              <CardContent className="p-12 text-center space-y-4">
                <Building2 className="w-16 h-16 mx-auto text-section-invest/30" />
                <div>
                  <h3 className="text-lg font-bold text-foreground">لا توجد تحليلات بعد</h3>
                  <p className="text-sm text-muted-foreground mt-1">ابدأ بتحليل أول فرصة استثمارية واحصل على تقرير شامل من الذكاء الاصطناعي</p>
                </div>
                <Button onClick={() => { setShowForm(true); setCurrentStep(0); setAnswers({}); }} className="gap-2 bg-section-invest hover:bg-section-invest/90">
                  <Plus className="w-4 h-4" /> تحليل فرصة جديدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            feasibilities.map(f => {
              const rec = recommendationConfig[f.recommendation || 'cautious'] || recommendationConfig.cautious;
              const RecIcon = rec.icon;
              return (
                <Card key={f.id} className="bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-all cursor-pointer border-border hover:shadow-md" onClick={() => setShowResult(f)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${rec.color}`}><RecIcon className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-foreground truncate">{f.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{f.business_type || 'عام'}</span>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> جدوى: <strong className="text-foreground">{f.feasibility_score}%</strong></span>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> مخاطر: <strong className="text-foreground">{f.risk_score}%</strong></span>
                        <span className="text-border">|</span>
                        <span>{format(new Date(f.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                      </div>
                    </div>
                    <Badge className={`${rec.color} hidden sm:inline-flex`}>{rec.label}</Badge>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteFeasibility.mutate(f.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
