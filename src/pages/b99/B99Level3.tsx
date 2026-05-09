import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Mail, MessageSquare, BarChart3, Users, FileSpreadsheet, CheckCircle2, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SmartQuestionEngine, { SmartQuestion } from '@/components/b99/SmartQuestionEngine';
import { Header } from './B99Level1';

const QUESTIONS: SmartQuestion[] = [
  { key: 'business_name', title: 'اسم شركتك / بزنسك', type: 'text', placeholder: 'شركة...' },
  { key: 'owner_name', title: 'اسمك (المالك)', type: 'text', placeholder: 'محمد...' },
  { key: 'owner_email', title: 'إيميل لاستلام التقارير', type: 'text', placeholder: 'me@company.com' },
  {
    key: 'tasks', title: 'وش المهام اللي تبي بات شارك يسوّيها؟', hint: 'اختر كل ما يهمك.', type: 'multi',
    options: [
      { value: 'reports', label: 'تقارير دورية', emoji: '📊' },
      { value: 'emails', label: 'إرسال إيميلات تلقائية', emoji: '📧' },
      { value: 'employees', label: 'متابعة موظفين وKPIs', emoji: '👥' },
      { value: 'data_processing', label: 'معالجة بيانات معقدة', emoji: '🧮' },
      { value: 'alerts', label: 'تنبيهات ذكية', emoji: '🔔' },
      { value: 'forecasts', label: 'تنبؤات مالية', emoji: '🔮' },
      { value: 'monitoring', label: 'مراقبة أداء الموقع', emoji: '🖥️' },
      { value: 'crm', label: 'متابعة عملاء (CRM)', emoji: '🎯' },
    ],
  },
  {
    key: 'data_sources', title: 'من وين يقرا البيانات؟', type: 'multi',
    options: [
      { value: 'sheets', label: 'Google Sheets', emoji: '📗' },
      { value: 'csv', label: 'ملفات CSV/Excel', emoji: '📁' },
      { value: 'website', label: 'موقعك (API)', emoji: '🌐' },
      { value: 'database', label: 'قاعدة بيانات خارجية', emoji: '💾' },
      { value: 'manual', label: 'إدخال يدوي', emoji: '✍️' },
    ],
  },
  {
    key: 'channels', title: 'كيف تبي يوصلك؟', type: 'multi',
    options: [
      { value: 'email', label: 'إيميل', emoji: '📧' },
      { value: 'whatsapp', label: 'واتساب', emoji: '💬' },
      { value: 'dashboard', label: 'لوحة تحكم بات شارك', emoji: '📋' },
      { value: 'webhook', label: 'Webhook لموقعك', emoji: '🔗' },
    ],
  },
  {
    key: 'schedule', title: 'كم مرة يشتغل؟', type: 'cards',
    options: [
      { value: 'realtime', label: 'فوراً عند أي حدث', emoji: '⚡' },
      { value: 'hourly', label: 'كل ساعة', emoji: '🕐' },
      { value: 'daily', label: 'يومياً', emoji: '🌅' },
      { value: 'weekly', label: 'أسبوعياً', emoji: '📅' },
    ],
  },
];

export default function B99Level3() {
  const [step, setStep] = useState<'intro' | 'hire' | 'building' | 'done'>('intro');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleHire = async (answers: Record<string, any>) => {
    setLoading(true); setStep('building');
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'hire_ai_employee', payload: { level: 3, ...answers } },
      });
      if (error) throw error;
      setResult(data);
      setStep('done');
      toast.success('تم توظيف بات شارك! بدأ الدوام 🤖');
    } catch (e: any) { toast.error(e.message || 'خطأ'); setStep('hire'); }
    finally { setLoading(false); }
  };

  if (step === 'intro') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Header level={3} title="وظّف بات شارك كموظف ذكي" subtitle="عندك بزنس قائم؟ خل بات شارك يدير لك المتابعة والتقارير 24/7." />

        <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-orange-200 p-8 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-orange-200/50 mx-auto md:mx-0">
              <Briefcase className="w-16 h-16 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">السيرة الذاتية لبات شارك</h3>
              <p className="text-slate-700 mb-4">موظف ذكاء اصطناعي يعمل بصمت في خلفية بزنسك:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { i: BarChart3, t: 'يحلل الإحصائيات' },
                  { i: Mail, t: 'يرسل إيميلات' },
                  { i: Users, t: 'يتابع موظفينك' },
                  { i: FileSpreadsheet, t: 'يعالج بيانات معقدة' },
                  { i: MessageSquare, t: 'يرسل تنبيهات' },
                  { i: Bot, t: 'يجاوب عملاءك' },
                ].map((item) => (
                  <li key={item.t} className="flex items-center gap-2 text-sm text-slate-700 bg-white/70 rounded-lg px-3 py-2">
                    <item.i className="w-4 h-4 text-orange-600" /> {item.t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-orange-200/60 text-center">
            <Button onClick={() => setStep('hire')} size="lg"
              className="h-14 px-8 bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 text-white font-bold gap-2 shadow-xl">
              <Briefcase className="w-5 h-5" /> ابدأ توظيف بات شارك
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'hire') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Header level={3} title="نموذج التوظيف" subtitle="حدد المهام، مصادر البيانات، وقنوات التواصل." onBack={() => setStep('intro')} />
        <SmartQuestionEngine questions={QUESTIONS} onComplete={handleHire} loading={loading} accent="from-amber-500 to-rose-500" ctaLabel="وظّف بات شارك الآن" />
      </div>
    );
  }

  if (step === 'building') {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-2xl">
          <Bot className="w-12 h-12 text-white" />
        </motion.div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">جاري إعداد الموظف...</h3>
        <p className="text-slate-600">ربط مصادر البيانات وتفعيل الجدولة.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Header level={3} title="بدأ الدوام 🤖" subtitle="بات شارك جاهز ويعمل في خلفية بزنسك." />
      <Card className="bg-white border-slate-200 p-7 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">موظف بات شارك مفعّل</div>
            <div className="text-sm text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> يعمل الآن
            </div>
          </div>
        </div>

        {result?.summary && (
          <p className="text-slate-700 leading-relaxed mb-5">{result.summary}</p>
        )}

        {result?.next_actions && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">الجدول الذكي القادم</div>
            {result.next_actions.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-slate-900">{a.title || a}</div>
                  {a.when && <div className="text-xs text-slate-500 mt-0.5">{a.when}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {result?.integration?.webhook_url && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Webhook للربط بموقعك</div>
            <div className="text-xs font-mono text-slate-700 p-3 rounded-lg bg-slate-50 border border-slate-200 break-all">
              {result.integration.webhook_url}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
