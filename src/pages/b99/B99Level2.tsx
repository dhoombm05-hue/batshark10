import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plug, Shield, BarChart3, Bot, Megaphone, Lightbulb, TrendingUp, Lock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SmartQuestionEngine, { SmartQuestion } from '@/components/b99/SmartQuestionEngine';
import { Header, IntegrationBox } from './B99Level1';

const FEATURES = [
  { id: 'seo', icon: TrendingUp, t: 'تعزيز المحتوى وSEO', d: 'إعادة كتابة + كلمات مفتاحية' },
  { id: 'analytics', icon: BarChart3, t: 'لوحة إحصائيات حية', d: 'زوار، تحويلات، أحداث' },
  { id: 'ai_assistant', icon: Bot, t: 'مساعد ذكاء اصطناعي', d: 'دردشة ذكية داخل موقعك' },
  { id: 'ads', icon: Megaphone, t: 'مولّد إعلانات', d: 'فيديوهات وسكربتات' },
  { id: 'suggestions', icon: Lightbulb, t: 'اقتراحات نمو دورية', d: 'أفكار أسبوعية' },
  { id: 'analyst', icon: BarChart3, t: 'محلل متقدم', d: 'CAC, LTV, Churn' },
];

const QUESTIONS: SmartQuestion[] = [
  { key: 'business_name', title: 'اسم البزنس / الموقع', type: 'text', placeholder: 'مطعمي / متجري...' },
  { key: 'site_url', title: 'رابط موقعك الحالي', hint: 'حتى نتأكد من توافق الربط.', type: 'text', placeholder: 'https://...' },
  {
    key: 'backend_type', title: 'نوع الباكند الحالي', type: 'cards',
    options: [
      { value: 'wordpress', label: 'WordPress', emoji: '📝' },
      { value: 'shopify', label: 'Shopify', emoji: '🛒' },
      { value: 'custom', label: 'مخصص (Node/PHP)', emoji: '⚙️' },
      { value: 'none', label: 'لا أعرف', emoji: '🤷' },
    ],
  },
  { key: 'admin_email', title: 'بريد المالك للوصول', hint: 'لإرسال بيانات الربط والتقارير.', type: 'text', placeholder: 'me@my-site.com' },
  { key: 'admin_password', title: 'كلمة مرور لوحة موقعك (اختياري)', hint: 'لن نخزنها — تُستخدم مرة واحدة لاختبار الربط فقط.', type: 'text', placeholder: '••••••••', optional: true },
];

export default function B99Level2() {
  const [step, setStep] = useState<'features' | 'questions' | 'building' | 'done'>('features');
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const toggle = (id: string) => setFeatures((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id]);

  const handleSubmit = async (answers: Record<string, any>) => {
    setLoading(true); setStep('building');
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generate_integration', payload: { level: 2, features, answers } },
      });
      if (error) throw error;
      setResult(data);
      setStep('done');
      toast.success('تم تجهيز ربط موقعك بكامل المميزات!');
    } catch (e: any) { toast.error(e.message || 'خطأ'); setStep('questions'); }
    finally { setLoading(false); }
  };

  if (step === 'features') {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <Header level={2} title="عزّز موقعك القائم" subtitle="اختر المميزات اللي تبي تضيفها لموقعك، ثم سنجهز كود الربط." />

        <Card className="bg-white border-slate-200 p-6 rounded-3xl shadow-lg">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-cyan-600" />
            <div className="font-bold text-slate-900">اختر باقتك</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((f) => {
              const sel = features.includes(f.id);
              return (
                <button key={f.id} onClick={() => toggle(f.id)}
                  className={`text-right p-4 rounded-2xl border-2 transition-all ${
                    sel ? 'border-transparent bg-gradient-to-br from-cyan-500 to-indigo-500 text-white shadow-lg' : 'border-slate-200 bg-white hover:border-cyan-300'
                  }`}>
                  <div className="flex items-start gap-3">
                    <f.icon className={`w-6 h-6 shrink-0 ${sel ? 'text-white' : 'text-cyan-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold ${sel ? 'text-white' : 'text-slate-900'}`}>{f.t}</div>
                      <div className={`text-xs mt-1 ${sel ? 'text-white/90' : 'text-slate-500'}`}>{f.d}</div>
                    </div>
                    {sel && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
            <div className="text-sm text-slate-600">
              <span className="font-bold text-cyan-700">{features.length}</span> مميزات مختارة
            </div>
            <Button onClick={() => setStep('questions')} disabled={features.length === 0}
              className="bg-gradient-to-l from-cyan-500 to-indigo-500 text-white font-bold gap-2 h-12 px-6">
              <Plug className="w-4 h-4" /> اربط موقعي الآن
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'questions') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Header level={2} title="بيانات الربط" subtitle="معلومات سريعة لتجهيز كود الربط بموقعك." onBack={() => setStep('features')} />
        <Card className="bg-cyan-50 border-cyan-200 p-4 rounded-2xl flex items-center gap-3">
          <Lock className="w-5 h-5 text-cyan-700 shrink-0" />
          <p className="text-xs text-cyan-900">جميع البيانات الحساسة (مثل كلمات المرور) لا تُخزّن — تُستخدم مرة واحدة فقط للتحقق من الربط.</p>
        </Card>
        <SmartQuestionEngine questions={QUESTIONS} onComplete={handleSubmit} loading={loading} accent="from-cyan-500 to-indigo-500" ctaLabel="جهّز كود الربط" />
      </div>
    );
  }

  if (step === 'building') {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-cyan-200 border-t-cyan-600" />
        <h3 className="text-2xl font-black text-slate-900 mb-2">جاري تجهيز الربط...</h3>
        <p className="text-slate-600">إنشاء API Key، Webhook، وSnippet مخصص لموقعك.</p>
      </div>
    );
  }

  const v = result?.verification;
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Header level={2} title="جاهز للربط" subtitle="انسخ الأكواد التالية إلى موقعك." />

      {v && (
        <Card className={`p-5 rounded-3xl border-2 ${v.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-300'}`}>
          <div className="flex items-start gap-3">
            <CheckCircle2 className={`w-6 h-6 shrink-0 ${v.ok ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div className="flex-1">
              <div className="font-black text-slate-900">{v.ok ? `تم التحقق من ${v.title || 'موقعك'}` : 'تعذّر الوصول للموقع'}</div>
              <div className="text-xs text-slate-600 mt-1">HTTP {v.status || '—'} • {v.response_time_ms || '—'}ms • {v.bytes ? `${Math.round(v.bytes/1024)}KB` : ''}</div>
              {v.error && <div className="text-xs text-amber-800 mt-1">{v.error}</div>}
            </div>
          </div>
        </Card>
      )}

      <Card className="bg-white border-slate-200 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          <div className="text-lg font-black text-slate-900">تم تفعيل {features.length} مميزات</div>
        </div>
        {result?.integration && <IntegrationBox integration={result.integration} />}
        {result?.steps && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3">خطوات التفعيل</div>
            <ol className="space-y-2">
              {result.steps.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 font-bold text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}
      </Card>
    </div>
  );
}
