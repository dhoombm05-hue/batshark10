import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, BarChart3, Users, FileSpreadsheet, CheckCircle2, ShieldCheck, AlertTriangle, Globe, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SmartQuestionEngine, { SmartQuestion } from '@/components/b99/SmartQuestionEngine';
import { Header } from './B99Level1';
import logo from '@/assets/batshark-logo-official.png';

const QUESTIONS: SmartQuestion[] = [
  { key: 'business_name', title: 'اسم شركتك / بزنسك', type: 'text', placeholder: 'شركة...' },
  { key: 'owner_name', title: 'اسمك (المالك)', type: 'text', placeholder: 'محمد...' },
  { key: 'owner_email', title: 'إيميل لاستلام التقارير', type: 'text', placeholder: 'me@company.com' },
  { key: 'site_url', title: 'رابط موقع شركتك (للربط الفعلي)', hint: 'سيتحقق بات شارك من الموقع مباشرة قبل بدء الدوام.', type: 'text', placeholder: 'https://my-company.com' },
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

function LogoEmblem({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-32 h-32' : size === 'md' ? 'w-16 h-16' : 'w-10 h-10';
  return (
    <div className={`relative ${dim} rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center shadow-[0_25px_60px_-12px_rgba(212,175,55,0.45)] ring-1 ring-amber-400/30`}>
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500/15 via-transparent to-amber-300/10" />
      <img src={logo} alt="BATSHARK" className="relative w-3/4 h-3/4 object-contain drop-shadow-[0_4px_20px_rgba(212,175,55,0.5)]" />
    </div>
  );
}

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
      if (data?.verification?.ok) toast.success('تم التحقق من موقعك وتفعيل الموظف ✓');
      else toast.warning('تم التفعيل، لكن لم نقدر نتحقق من الموقع — راجع الرابط.');
    } catch (e: any) { toast.error(e.message || 'خطأ'); setStep('hire'); }
    finally { setLoading(false); }
  };

  if (step === 'intro') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Header level={3} title="وظّف بات شارك كموظف ذكي" subtitle="عندك بزنس قائم؟ خل بات شارك يدير لك المتابعة والتقارير 24/7 — يتحقق من موقعك فعلياً." />

        <Card className="bg-gradient-to-br from-slate-50 via-amber-50/30 to-white border-amber-200/60 p-8 rounded-3xl shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="mx-auto md:mx-0">
              <LogoEmblem size="lg" />
            </motion.div>
            <div>
              <div className="text-[10px] tracking-[0.4em] text-amber-700 font-black mb-1">BATSHARK · DIGITAL EMPLOYEE</div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">السيرة الذاتية لبات شارك</h3>
              <p className="text-slate-700 mb-4">موظف ذكاء اصطناعي يتحقق من موقعك بنفسه ويعمل بصمت في الخلفية:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { i: BarChart3, t: 'يحلل الإحصائيات' },
                  { i: Mail, t: 'يرسل إيميلات' },
                  { i: Users, t: 'يتابع موظفينك' },
                  { i: FileSpreadsheet, t: 'يعالج بيانات معقدة' },
                  { i: MessageSquare, t: 'يرسل تنبيهات' },
                  { i: ShieldCheck, t: 'يتحقق من موقعك دورياً' },
                ].map((item) => (
                  <li key={item.t} className="flex items-center gap-2 text-sm text-slate-700 bg-white/80 rounded-lg px-3 py-2 border border-amber-100">
                    <item.i className="w-4 h-4 text-amber-600" /> {item.t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-amber-200/60 text-center">
            <Button onClick={() => setStep('hire')} size="lg"
              className="h-14 px-8 bg-gradient-to-l from-amber-500 via-amber-400 to-amber-500 text-slate-900 font-black gap-2 shadow-xl hover:shadow-2xl">
              <ShieldCheck className="w-5 h-5" /> ابدأ التوظيف الفعلي
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'hire') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Header level={3} title="نموذج التوظيف" subtitle="حدد المهام، رابط الموقع، ومصادر البيانات." onBack={() => setStep('intro')} />
        <SmartQuestionEngine questions={QUESTIONS} onComplete={handleHire} loading={loading} accent="from-amber-500 to-amber-600" ctaLabel="وظّف بات شارك الآن" />
      </div>
    );
  }

  if (step === 'building') {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="mx-auto mb-6 w-fit">
          <LogoEmblem size="lg" />
        </motion.div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">يتحقق من موقعك...</h3>
        <p className="text-slate-600">فحص HTTP، استخراج العنوان، ربط القنوات.</p>
      </div>
    );
  }

  const v = result?.verification;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Header level={3} title="بدأ الدوام" subtitle="بات شارك جاهز ويعمل في خلفية بزنسك." />

      {/* Verification proof */}
      {v && (
        <Card className={`p-5 rounded-3xl border-2 ${v.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-300'}`}>
          <div className="flex items-start gap-3">
            {v.ok ? <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="font-black text-slate-900">
                {v.ok ? 'تم التحقق من موقعك فعلياً' : 'تعذّر التحقق من الموقع'}
              </div>
              <div className="text-xs text-slate-600 mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat label="HTTP" value={v.status || '—'} />
                <Stat label="زمن الاستجابة" value={v.response_time_ms ? `${v.response_time_ms}ms` : '—'} icon={Clock} />
                <Stat label="حجم الصفحة" value={v.bytes ? `${Math.round(v.bytes/1024)}KB` : '—'} />
                <Stat label="الرابط" value={v.final_url ? new URL(v.final_url).hostname : '—'} icon={Globe} />
              </div>
              {v.title && <div className="mt-2 text-sm text-slate-800"><span className="text-slate-500 text-xs">عنوان الموقع:</span> <span className="font-bold">{v.title}</span></div>}
              {v.description && <div className="mt-1 text-xs text-slate-600 line-clamp-2">{v.description}</div>}
              {v.final_url && (
                <a href={v.final_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-bold">
                  افتح الموقع <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {v.error && <div className="mt-1 text-xs text-amber-800">سبب: {v.error}</div>}
            </div>
            {(v.og_image || v.screenshot) && (
              <img src={v.og_image || v.screenshot} alt="" loading="lazy" className="w-24 h-16 rounded-lg object-cover border border-white shadow" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            )}
          </div>
        </Card>
      )}

      <Card className="bg-white border-slate-200 p-7 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <LogoEmblem size="md" />
          <div>
            <div className="text-xl font-black text-slate-900">موظف بات شارك مفعّل</div>
            <div className="text-sm text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> يعمل الآن
            </div>
          </div>
        </div>

        {result?.summary && <p className="text-slate-700 leading-relaxed mb-5">{result.summary}</p>}

        {result?.next_actions && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">الجدول الذكي القادم</div>
            {result.next_actions.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
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

function Stat({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div className="bg-white/80 rounded-lg px-2 py-1 border border-white">
      <div className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3 text-slate-500" />} {value}
      </div>
    </div>
  );
}
