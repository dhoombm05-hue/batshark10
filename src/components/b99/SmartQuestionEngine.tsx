import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Check, ChevronLeft, ChevronRight, Sparkles, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SmartQuestion = {
  key: string;
  title: string;
  hint?: string;
  type: 'cards' | 'text' | 'textarea' | 'number' | 'multi';
  options?: { value: string; label: string; emoji?: string; desc?: string }[];
  placeholder?: string;
  optional?: boolean;
};

interface Props {
  questions: SmartQuestion[];
  onComplete: (answers: Record<string, any>) => void;
  loading?: boolean;
  accent?: string; // tailwind gradient class e.g. "from-violet-500 to-cyan-500"
  ctaLabel?: string;
}

export default function SmartQuestionEngine({
  questions,
  onComplete,
  loading,
  accent = 'from-violet-500 to-cyan-500',
  ctaLabel = 'ابني الآن',
}: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const q = questions[step];
  const progress = ((step + 1) / questions.length) * 100;
  const value = answers[q?.key];

  const canNext = useMemo(() => {
    if (!q) return false;
    if (q.optional) return true;
    if (q.type === 'multi') return Array.isArray(value) && value.length > 0;
    return value !== undefined && value !== '' && value !== null;
  }, [q, value]);

  const setVal = (v: any) => setAnswers((a) => ({ ...a, [q.key]: v }));

  const next = () => {
    if (step < questions.length - 1) setStep(step + 1);
    else onComplete(answers);
  };
  const prev = () => step > 0 && setStep(step - 1);

  if (!q) return null;

  return (
    <Card className="bg-white/90 backdrop-blur-xl border-slate-200 shadow-2xl shadow-violet-500/10 p-6 md:p-8 rounded-3xl">
      {/* progress */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          سؤال {step + 1} من {questions.length}
        </div>
        <button onClick={() => onComplete(answers)} className="text-xs text-slate-400 hover:text-violet-600 flex items-center gap-1">
          <SkipForward className="w-3 h-3" /> اقفز للنتائج
        </button>
      </div>
      <Progress value={progress} className="h-1.5 mb-8" />

      <AnimatePresence mode="wait">
        <motion.div
          key={q.key}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{q.title}</h2>
          {q.hint && <p className="text-sm text-slate-500 mb-6">{q.hint}</p>}

          {q.type === 'cards' && q.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((o) => {
                const sel = value === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => { setVal(o.value); setTimeout(next, 200); }}
                    className={cn(
                      'group text-right p-4 rounded-2xl border-2 transition-all',
                      sel
                        ? `border-transparent bg-gradient-to-br ${accent} text-white shadow-xl scale-[1.02]`
                        : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {o.emoji && <div className="text-2xl shrink-0">{o.emoji}</div>}
                      <div className="flex-1 min-w-0">
                        <div className={cn('font-bold text-base', sel ? 'text-white' : 'text-slate-900')}>{o.label}</div>
                        {o.desc && <div className={cn('text-xs mt-1 leading-relaxed', sel ? 'text-white/90' : 'text-slate-500')}>{o.desc}</div>}
                      </div>
                      {sel && <Check className="w-5 h-5 text-white shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'multi' && q.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((o) => {
                const arr: string[] = Array.isArray(value) ? value : [];
                const sel = arr.includes(o.value);
                return (
                  <button
                    key={o.value}
                    onClick={() => setVal(sel ? arr.filter((v) => v !== o.value) : [...arr, o.value])}
                    className={cn(
                      'text-right p-4 rounded-2xl border-2 transition-all',
                      sel ? `border-transparent bg-gradient-to-br ${accent} text-white shadow-lg` : 'border-slate-200 bg-white hover:border-violet-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {o.emoji && <span className="text-xl">{o.emoji}</span>}
                      <span className={cn('font-bold text-sm flex-1', sel ? 'text-white' : 'text-slate-900')}>{o.label}</span>
                      <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center', sel ? 'bg-white border-white' : 'border-slate-300')}>
                        {sel && <Check className="w-3.5 h-3.5 text-violet-600" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'text' && (
            <Input
              autoFocus
              value={value || ''}
              onChange={(e) => setVal(e.target.value)}
              placeholder={q.placeholder}
              className="h-14 text-lg bg-white border-2 border-slate-200 focus:border-violet-400 rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && canNext && next()}
            />
          )}

          {q.type === 'number' && (
            <Input
              autoFocus
              type="number"
              value={value ?? ''}
              onChange={(e) => setVal(e.target.value ? Number(e.target.value) : '')}
              placeholder={q.placeholder}
              className="h-14 text-lg bg-white border-2 border-slate-200 focus:border-violet-400 rounded-xl"
            />
          )}

          {q.type === 'textarea' && (
            <Textarea
              autoFocus
              value={value || ''}
              onChange={(e) => setVal(e.target.value)}
              placeholder={q.placeholder}
              rows={5}
              className="text-base bg-white border-2 border-slate-200 focus:border-violet-400 rounded-xl"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 mt-8">
        <Button variant="ghost" onClick={prev} disabled={step === 0} className="text-slate-600 gap-1">
          <ChevronRight className="w-4 h-4" /> السابق
        </Button>
        <Button
          onClick={next}
          disabled={!canNext || loading}
          className={cn('gap-1 h-12 px-6 rounded-xl text-white font-bold shadow-lg bg-gradient-to-l', accent)}
        >
          {step === questions.length - 1 ? (loading ? 'جاري البناء...' : ctaLabel) : 'التالي'}
          {step < questions.length - 1 && <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* live mini-summary */}
      {Object.keys(answers).length >= 2 && step >= 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 rounded-2xl bg-gradient-to-l from-violet-50 to-cyan-50 border border-violet-100">
          <div className="text-[10px] uppercase tracking-widest text-violet-600 font-bold mb-2">ملخص حيّ</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(answers).slice(0, 6).map(([k, v]) => (
              <span key={k} className="text-xs px-2.5 py-1 rounded-full bg-white border border-violet-200 text-slate-700">
                {Array.isArray(v) ? v.join('، ') : String(v).slice(0, 30)}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </Card>
  );
}
