import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Check, ChevronLeft, ChevronRight, Sparkles, SkipForward, ExternalLink, Loader2, RefreshCw, Lightbulb, PlayCircle, Eye, Volume2, VolumeX, BookOpen, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useArabicTTS } from '@/hooks/useB99Audio';

export type SmartQuestion = {
  key: string;
  title: string;
  hint?: string;
  type: 'cards' | 'text' | 'textarea' | 'number' | 'multi' | 'inspiration';
  options?: { value: string; label: string; emoji?: string; desc?: string; preview?: string }[];
  placeholder?: string;
  optional?: boolean;
  topicFrom?: (answers: Record<string, any>) => string;
  focus?: string;
  // NEW: deep context per question
  whyThis?: string; // "لماذا نسأل هذا" — يشرح بعمق لماذا هذا السؤال مهم
  examples?: { image: string; label: string; url?: string; tag?: string }[]; // أمثلة بصرية حقيقية
  videoEmbed?: string; // YouTube embed URL لشرح المفهوم
  liveExamplesFor?: string; // عند تغيّر الإجابة، اجلب أمثلة ديناميكية لهذه القيمة من البحث
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
    <Card className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-violet-50/30 border border-amber-200/50 shadow-[0_30px_80px_-20px_rgba(212,175,55,0.25)] p-6 md:p-10 rounded-[2rem]">
      {/* gold corner accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-300/15 to-transparent rounded-bl-[6rem] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-violet-300/15 to-transparent rounded-tr-[6rem] pointer-events-none" />

      {/* progress header */}
      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.3em] text-amber-700 font-black uppercase">Step</span>
          <span className="text-sm font-black text-slate-900">{String(step + 1).padStart(2, '0')}</span>
          <span className="text-xs text-slate-400">/ {String(questions.length).padStart(2, '0')}</span>
        </div>
        <button onClick={() => onComplete(answers)} className="text-[11px] text-slate-400 hover:text-amber-700 flex items-center gap-1 transition">
          <SkipForward className="w-3 h-3" /> اقفز للنتائج
        </button>
      </div>
      <div className="relative h-1 mb-8 bg-slate-200/60 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-l from-amber-500 via-amber-400 to-amber-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.key}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 leading-tight">{q.title}</h2>
          {q.hint && <p className="text-sm text-slate-500 mb-4 leading-relaxed">{q.hint}</p>}

          {/* Deep context: Why + Examples + Video */}
          <QuestionContext q={q} answer={value} />


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

          {q.type === 'inspiration' && (
            <InspirationPicker
              topic={q.topicFrom ? q.topicFrom(answers) : (answers.idea || answers.business_kind || '')}
              focus={q.focus || 'overall'}
              value={value}
              onChange={setVal}
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

// =================== Question Context (Why + Examples + Video) ===================
function QuestionContext({ q, answer }: { q: SmartQuestion; answer: any }) {
  const [liveItems, setLiveItems] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [openVideo, setOpenVideo] = useState(false);

  // Build a "live examples" topic from selected answer (e.g. brand_vibe=luxury → "luxury website examples")
  const liveTopic = q.liveExamplesFor && answer
    ? `${q.liveExamplesFor} ${typeof answer === 'string' ? answer : Array.isArray(answer) ? answer.join(' ') : ''}`.trim()
    : null;

  useEffect(() => {
    if (!liveTopic) { setLiveItems([]); return; }
    let alive = true;
    setLiveLoading(true);
    supabase.functions.invoke('b99-engine', {
      body: { action: 'visual_examples', payload: { topic: liveTopic, limit: 6 } },
    }).then(({ data }) => {
      if (alive) setLiveItems(data?.items || []);
    }).finally(() => { if (alive) setLiveLoading(false); });
    return () => { alive = false; };
  }, [liveTopic]);

  if (!q.whyThis && !q.examples?.length && !q.videoEmbed && !liveTopic) return null;

  return (
    <div className="mb-6 space-y-3">
      {q.whyThis && (
        <div className="p-4 rounded-2xl bg-gradient-to-l from-amber-50 to-white border border-amber-200/60">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] tracking-[0.3em] text-amber-700 font-black uppercase mb-1">لماذا نسأل هذا</div>
              <p className="text-sm text-slate-700 leading-relaxed">{q.whyThis}</p>
            </div>
          </div>
        </div>
      )}

      {q.examples && q.examples.length > 0 && (
        <div>
          <div className="text-[10px] tracking-[0.3em] text-slate-500 font-bold uppercase mb-2 flex items-center gap-1">
            <Eye className="w-3 h-3" /> أمثلة حقيقية
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {q.examples.map((ex, i) => (
              <a key={i} href={ex.url} target="_blank" rel="noreferrer"
                className="group block rounded-xl overflow-hidden border border-slate-200 hover:border-amber-400 transition bg-white">
                <div className="aspect-video bg-slate-100 overflow-hidden">
                  <img src={ex.image} alt={ex.label} loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="px-2 py-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 truncate">{ex.label}</span>
                  {ex.tag && <span className="text-[9px] text-amber-700">{ex.tag}</span>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {liveTopic && (
        <div>
          <div className="text-[10px] tracking-[0.3em] text-emerald-700 font-bold uppercase mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> أمثلة حيّة لاختيارك
          </div>
          {liveLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[1,2,3].map(i => <div key={i} className="aspect-video rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          )}
          {!liveLoading && liveItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {liveItems.map((it, i) => (
                <a key={i} href={it.url} target="_blank" rel="noreferrer"
                  className="block rounded-xl overflow-hidden border border-emerald-200 hover:border-emerald-400 transition bg-white">
                  <div className="aspect-video bg-slate-100">
                    <img src={it.image} alt={it.label} loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                      className="w-full h-full object-cover" />
                  </div>
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-800 truncate">{it.label}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {q.videoEmbed && (
        <div>
          {!openVideo ? (
            <button onClick={() => setOpenVideo(true)}
              className="w-full p-3 rounded-2xl bg-gradient-to-l from-rose-50 to-white border border-rose-200 hover:border-rose-400 transition flex items-center gap-3 text-right">
              <PlayCircle className="w-8 h-8 text-rose-500 shrink-0" />
              <div>
                <div className="text-[10px] tracking-widest text-rose-600 font-black uppercase">فيديو توضيحي</div>
                <div className="text-sm font-bold text-slate-800">شاهد شرحاً سريعاً لهذه الفكرة</div>
              </div>
            </button>
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-black">
              <iframe src={q.videoEmbed} title="explanation"
                className="absolute inset-0 w-full h-full" allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =================== Inspiration Picker ===================
function InspirationPicker({ topic, focus, value, onChange }: { topic: string; focus: string; value: any; onChange: (v: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedUrl: string | undefined = value?.url;

  const load = async () => {
    if (!topic) return;
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'inspirations', payload: { topic, focus } },
      });
      if (error) throw error;
      setItems(data?.items || []);
    } catch (e: any) {
      setError(e.message || 'تعذّر جلب المراجع');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [topic, focus]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">اختر منصة كمرجع بصري — أو تخطّى وامضِ بالتصميم الافتراضي.</p>
        <button onClick={load} disabled={loading} className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1">
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> تحديث
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-44 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((it) => {
            const sel = selectedUrl === it.url;
            return (
              <button
                key={it.url}
                onClick={() => onChange(sel ? null : { name: it.name, url: it.url, why: it.why })}
                className={cn(
                  'group text-right rounded-2xl overflow-hidden border-2 transition-all bg-white',
                  sel ? 'border-amber-500 shadow-[0_20px_60px_-15px_rgba(212,175,55,0.45)] scale-[1.01]' : 'border-slate-200 hover:border-amber-300'
                )}
              >
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  {it.screenshot && (
                    <img src={it.screenshot} alt={it.name} loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  {sel && (
                    <div className="absolute inset-0 bg-amber-500/15 flex items-end p-2">
                      <div className="px-2 py-1 rounded-md bg-amber-500 text-white text-[11px] font-black flex items-center gap-1">
                        <Check className="w-3 h-3" /> مرجعي
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {it.favicon && <img src={it.favicon} alt="" className="w-4 h-4 rounded" />}
                    <div className="font-bold text-sm text-slate-900 truncate">{it.name}</div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{it.why}</p>
                  <a href={it.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                    className="mt-1.5 text-[10px] text-amber-700 hover:text-amber-900 inline-flex items-center gap-1">
                    زيارة <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </button>
            );
          })}
          <button
            onClick={() => onChange({ name: 'بدون مرجع', url: '', why: 'تصميم أصلي' })}
            className={cn(
              'rounded-2xl border-2 border-dashed p-4 text-right transition-all',
              value?.url === '' ? 'border-amber-500 bg-amber-50' : 'border-slate-300 bg-slate-50 hover:bg-white'
            )}
          >
            <div className="text-sm font-bold text-slate-900 mb-1">لا، صمّم لي شيء أصلي</div>
            <p className="text-[11px] text-slate-600">سيبدع بات شارك تصميماً مخصصاً بدون مرجعية بصرية.</p>
          </button>
        </div>
      )}
    </div>
  );
}
