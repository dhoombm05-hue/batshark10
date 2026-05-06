import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Brain, Rocket, Wrench, TrendingUp, BarChart3, ArrowLeft, ArrowRight, Send, Bot, RefreshCw, Trophy, Target, Layers, DollarSign, Activity, Map, Sword, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'analyst';

const LEVELS = [
  { id: 'beginner' as Level, title: 'مبتدئ', desc: 'لا خبرة سابقة — يأخذني بخطوات بسيطة', icon: Rocket, accent: 'from-emerald-400 to-teal-500' },
  { id: 'intermediate' as Level, title: 'متوسط', desc: 'لي خبرة أو مشروع قائم بسيط', icon: Wrench, accent: 'from-amber-400 to-orange-500' },
  { id: 'advanced' as Level, title: 'متقدم', desc: 'إدارة أعمال فعلية ونماذج متقدمة', icon: TrendingUp, accent: 'from-blue-400 to-indigo-500' },
  { id: 'analyst' as Level, title: 'محلل احترافي', desc: 'أريد تحليل كمي عميق ومؤشرات', icon: BarChart3, accent: 'from-fuchsia-400 to-pink-500' },
];

export default function B99Generator() {
  const { identity }: any = useOutletContext();
  const nav = useNavigate();
  const [level, setLevel] = useState<Level | null>(null);
  const [convo, setConvo] = useState<{ q: string; a: any; observation?: string }[]>([]);
  const [currentQ, setCurrentQ] = useState<any>(null);
  const [answer, setAnswer] = useState<any>('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'pick'|'chat'|'generating'|'result'>('pick');
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [generatingMsg, setGeneratingMsg] = useState('');

  const startLevel = async (l: Level) => {
    setLevel(l); setConvo([]); setPhase('chat'); setProgress(10);
    await fetchNextQuestion(l, []);
  };

  const fetchNextQuestion = async (l: Level, current: any[]) => {
    setLoading(true);
    try {
      const answers = current.reduce((acc: any, x: any) => ({ ...acc, [x.q]: x.a }), {});
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generator_step', payload: { level: l, answers, mode: 'next_question' } },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      if (data.done) { await generateFinal(l, current); return; }
      setCurrentQ(data); setAnswer(data.input_type === 'choice' ? '' : (data.input_type === 'number' ? 0 : ''));
      setProgress(Math.min(85, data.progress_hint || (current.length * 15 + 15)));
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    if (!currentQ || answer === '' || answer === null) return;
    const newConvo = [...convo, { q: currentQ.question, a: answer, observation: currentQ.ai_observation }];
    setConvo(newConvo);
    setCurrentQ(null);
    if (level) await fetchNextQuestion(level, newConvo);
  };

  const generateFinal = async (l: Level, current: any[]) => {
    setPhase('generating'); setProgress(90);
    const msgs = ['تحليل إجاباتك بعمق...', 'بناء النموذج المالي...', 'مسح المنافسين...', 'صياغة خطة الإطلاق...', 'توليد الفكرة المخصصة...'];
    let i = 0; setGeneratingMsg(msgs[0]);
    const itv = setInterval(() => { i = (i + 1) % msgs.length; setGeneratingMsg(msgs[i]); }, 1500);
    try {
      const answers = current.reduce((acc: any, x: any) => ({ ...acc, [x.q]: x.a }), {});
      const { data, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'generator_step', payload: { level: l, answers, mode: 'final' } },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data); setPhase('result'); setProgress(100);
      toast.success('تم توليد الفكرة الاحترافية');
    } catch (e: any) { toast.error(e.message); setPhase('chat'); }
    finally { clearInterval(itv); setGeneratingMsg(''); }
  };

  const buildPlatformFromIdea = () => {
    if (!result?.generated_platform_brief) { toast.info('لا يوجد موجز منصة جاهز'); return; }
    const b = result.generated_platform_brief;
    nav('/b99/platforms', { state: { prefill: b } });
  };

  const buildCampaignFromIdea = () => {
    if (!result) return;
    nav('/b99/ads', { state: { prefill: { businessType: result.idea_name, brief: result.description } } });
  };

  const reset = () => { setLevel(null); setConvo([]); setCurrentQ(null); setResult(null); setPhase('pick'); setProgress(0); };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-widest">المولّد التفاعلي</div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" /> مولّد الأفكار السيادي
          </h1>
        </div>
        {level && <Badge className={`bg-gradient-to-l ${LEVELS.find(l=>l.id===level)?.accent} text-white border-0`}>{LEVELS.find(l=>l.id===level)?.title}</Badge>}
      </header>

      {phase !== 'pick' && (
        <div>
          <Progress value={progress} className="h-1.5 bg-white/10" />
          <div className="text-[10px] text-slate-500 mt-1">{progress}%</div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'pick' && (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LEVELS.map((l, i) => (
              <motion.button key={l.id} onClick={() => startLevel(l.id)}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                className="text-right rounded-2xl p-6 bg-white/[0.03] border border-white/10 hover:border-white/30 transition-all">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${l.accent} shadow-lg mb-3`}><l.icon className="w-6 h-6 text-white" /></div>
                <h3 className="text-xl font-black">{l.title}</h3>
                <p className="text-sm text-slate-400 mt-2">{l.desc}</p>
              </motion.button>
            ))}
          </motion.div>
        )}

        {phase === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Conversation history */}
            <div className="space-y-3">
              {convo.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                  <div className="flex justify-end"><div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 text-sm">
                    <div className="text-[10px] text-violet-300 mb-1 flex items-center gap-1"><Bot className="w-3 h-3" /> BatShark</div>{c.q}
                  </div></div>
                  <div className="flex justify-start"><div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-violet-500/15 border border-violet-500/30 text-sm">
                    <div className="text-[10px] text-emerald-300 mb-1">أنت</div>
                    {typeof c.a === 'object' ? JSON.stringify(c.a) : String(c.a)}
                  </div></div>
                  {c.observation && <div className="text-xs text-amber-300/70 italic px-3">💡 {c.observation}</div>}
                </motion.div>
              ))}
            </div>

            {/* Current question */}
            {loading && !currentQ && (
              <div className="flex items-center gap-2 text-sm text-slate-400 px-3">
                <span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-bounce" /> BatShark يصيغ السؤال التالي...
              </div>
            )}
            {currentQ && (
              <Card className="bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border-white/10 p-5">
                {currentQ.ai_observation && <div className="text-xs text-amber-300 mb-2 italic">💡 {currentQ.ai_observation}</div>}
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">السؤال {convo.length + 1}</div>
                <h3 className="text-lg font-bold mb-1">{currentQ.question}</h3>
                {currentQ.why_asking && <p className="text-xs text-slate-400 mb-4">{currentQ.why_asking}</p>}
                <div className="mt-4">
                  {currentQ.input_type === 'choice' && currentQ.choices ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {currentQ.choices.map((c: string) => (
                        <button key={c} onClick={() => setAnswer(c)}
                          className={`text-right px-4 py-3 rounded-xl border text-sm transition-all ${answer === c ? 'bg-gradient-to-br from-violet-500 to-cyan-500 border-transparent text-white' : 'bg-slate-900/40 border-white/10 hover:border-white/30'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  ) : currentQ.input_type === 'number' ? (
                    <Input type="number" value={answer || 0} onChange={(e) => setAnswer(Number(e.target.value))}
                      className="bg-slate-900/60 border-white/10 h-12 text-lg" autoFocus />
                  ) : (
                    <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={currentQ.placeholder}
                      rows={3} className="bg-slate-900/60 border-white/10" autoFocus />
                  )}
                </div>
                <div className="flex justify-between mt-5">
                  <Button variant="ghost" onClick={reset} className="text-slate-400 text-xs">إلغاء</Button>
                  <Button onClick={submitAnswer} disabled={loading || answer === '' || answer === null}
                    className="bg-gradient-to-r from-violet-500 to-cyan-500 gap-2">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> إرسال</>}
                  </Button>
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {phase === 'generating' && (
          <motion.div key="gen" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20">
            <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ rotate: { duration: 3, repeat: Infinity, ease: 'linear' }, scale: { duration: 1.5, repeat: Infinity } }}
              className="inline-block p-6 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 mb-6">
              <Brain className="w-16 h-16 text-white" />
            </motion.div>
            <h2 className="text-2xl font-black mb-2">جاري بناء فكرتك السيادية...</h2>
            <p className="text-violet-300 text-sm animate-pulse">{generatingMsg}</p>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={reset} className="text-slate-400 gap-2 text-sm"><RefreshCw className="w-4 h-4" /> فكرة جديدة</Button>
            </div>

            <Card className="bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-cyan-500/15 border-white/10 p-7 overflow-hidden relative">
              <motion.div animate={{ x: [0, 50, 0] }} transition={{ duration: 8, repeat: Infinity }}
                className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="relative">
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">توافق {result.match_score}%</Badge>
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-l from-white to-violet-200 bg-clip-text text-transparent mb-2">{result.idea_name}</h2>
                {result.positioning && <div className="text-sm text-cyan-300 mb-3">{result.positioning}</div>}
                <p className="text-slate-300 leading-relaxed">{result.description}</p>
              </div>
            </Card>

            {result.financial && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <KPI icon={DollarSign} label="رأس المال" value={`${(result.financial.capital||0).toLocaleString()} ر.س`} />
                <KPI icon={TrendingUp} label="إيراد شهري" value={`${(result.financial.monthly_revenue||0).toLocaleString()} ر.س`} />
                <KPI icon={Activity} label="نقطة التعادل" value={`${result.financial.break_even_months||0} شهر`} />
                <KPI icon={Trophy} label="ربح سنة 1" value={`${(result.financial.year1_profit||0).toLocaleString()} ر.س`} accent="text-emerald-300" />
                <KPI icon={Target} label="ROI" value={`${result.financial.roi_year1||0}%`} accent="text-amber-300" />
              </div>
            )}

            {result.swot && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SwotBox color="emerald" title="نقاط قوة" items={result.swot.strengths} />
                <SwotBox color="rose" title="نقاط ضعف" items={result.swot.weaknesses} />
                <SwotBox color="cyan" title="فرص" items={result.swot.opportunities} />
                <SwotBox color="amber" title="تهديدات" items={result.swot.threats} />
              </div>
            )}

            {result.competitors?.length > 0 && (
              <Card className="bg-white/[0.03] border-white/10 p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Sword className="w-4 h-4 text-rose-300" /> المنافسون</h3>
                <div className="space-y-2">
                  {result.competitors.map((c: any, i: number) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm">
                      <div className="font-bold">{c.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{c.note}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {result.roadmap?.length > 0 && (
              <Card className="bg-white/[0.03] border-white/10 p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Map className="w-4 h-4 text-amber-300" /> خارطة الطريق</h3>
                <div className="space-y-2">
                  {result.roadmap.map((p: any, i: number) => (
                    <div key={i} className="flex gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">{i+1}</div>
                      <div className="flex-1 text-xs">
                        <div className="font-bold text-sm">{p.phase} <span className="text-slate-500 font-normal">• {p.duration}</span></div>
                        <ul className="list-disc mr-4 mt-1 text-slate-400 space-y-0.5">
                          {p.actions?.map((a: string, j: number) => <li key={j}>{a}</li>)}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {result.first_30_days?.length > 0 && (
              <Card className="bg-emerald-500/5 border-emerald-500/20 p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-emerald-300"><Lightbulb className="w-4 h-4" /> أول 30 يوم</h3>
                <ul className="text-xs text-slate-300 space-y-1.5 list-decimal mr-5">
                  {result.first_30_days.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </Card>
            )}

            {/* Action: build platform / campaign */}
            <Card className="bg-gradient-to-br from-violet-500/15 to-cyan-500/15 border-white/10 p-6">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Rocket className="w-4 h-4 text-violet-300" /> الخطوات التالية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button onClick={buildPlatformFromIdea} className="bg-gradient-to-r from-cyan-500 to-blue-500 gap-2 h-12">
                  <Layers className="w-4 h-4" /> ولّد منصة فعلية لهذه الفكرة
                </Button>
                <Button onClick={buildCampaignFromIdea} className="bg-gradient-to-r from-rose-500 to-orange-500 gap-2 h-12">
                  <Sparkles className="w-4 h-4" /> أنشئ حملة إعلانية مخصّصة
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KPI({ icon: I, label, value, accent }: any) {
  return <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
    <I className={`w-4 h-4 mb-1.5 ${accent || 'text-violet-300'}`} />
    <div className="text-[10px] text-slate-400">{label}</div>
    <div className={`text-sm font-bold ${accent || ''}`}>{value}</div>
  </div>;
}

function SwotBox({ color, title, items }: any) {
  const cm: any = { emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', rose: 'bg-rose-500/10 border-rose-500/30 text-rose-300', cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300', amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300' };
  return <div className={`rounded-lg border p-3 ${cm[color]}`}>
    <div className="text-xs font-bold mb-2">{title}</div>
    <ul className="text-[11px] text-slate-200 space-y-1 list-disc mr-4">
      {items?.map((s: string, i: number) => <li key={i}>{s}</li>)}
    </ul>
  </div>;
}
