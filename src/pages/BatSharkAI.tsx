import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Loader2, Sparkles, Trash2, Volume2, VolumeX, Mic, MicOff, ShieldCheck, ClipboardCheck, AlertTriangle, CheckCircle2, XCircle, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCreateJournalEntry } from '@/hooks/useJournalEntries';
import logo from '@/assets/batshark-logo-new.png';

type Msg = { role: 'user' | 'assistant'; content: string };

interface AIAction {
  type: string;
  data: any;
  confirmed?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batshark-ai`;

const SUGGESTIONS = [
  'وش وضع الإيرادات؟',
  'ما هو أفضل مشروع حالياً؟',
  'سوي لي قيد مصروف تسويق 5000',
  'حلل أداء الموظفين',
  'قارن بين المشاريع',
  'ما هي المخاطر الرئيسية؟',
  'أعطني ملخص مالي شامل',
  'سوي قيد إيراد مبيعات 10000',
];

function stripMarkdown(md: string): string {
  return md.replace(/#{1,6}\s/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/- /g, '، ').replace(/\n+/g, '. ').replace(/[|]/g, '،').trim();
}

// Parse action blocks from AI response
function parseActions(text: string): { cleanText: string; actions: AIAction[] } {
  const actions: AIAction[] = [];
  const regex = /\[BATSHARK_ACTION\]\s*([\s\S]*?)\s*\[\/BATSHARK_ACTION\]/g;
  let match;
  let cleanText = text;

  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      actions.push(parsed);
    } catch (e) {
      console.error('Failed to parse action:', e);
    }
    cleanText = cleanText.replace(match[0], '');
  }

  return { cleanText: cleanText.trim(), actions };
}

// Action confirmation card
function ActionCard({ action, onConfirm, onReject, isExecuting }: {
  action: AIAction;
  onConfirm: () => void;
  onReject: () => void;
  isExecuting: boolean;
}) {
  if (action.type === 'create_journal_entry') {
    const { data } = action;
    const totalDebit = (data.lines || []).reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
    const totalCredit = (data.lines || []).reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
    const isLargeAmount = totalDebit > 50000;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[hsl(220,20%,14%)] border-2 border-primary/30 rounded-xl p-4 my-3 space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">🤖 أمر تنفيذي: إنشاء قيد محاسبي</p>
            <p className="text-[10px] text-muted-foreground">يحتاج موافقتك للتنفيذ</p>
          </div>
        </div>

        {isLargeAmount && (
          <div className="flex items-center gap-2 bg-[hsl(25,85%,52%/0.1)] border border-[hsl(25,85%,52%/0.3)] rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-[hsl(25,85%,52%)]" />
            <span className="text-xs text-[hsl(25,85%,58%)]">⚠️ مبلغ كبير — تأكد من صحة الأرقام</span>
          </div>
        )}

        <div className="bg-[hsl(220,18%,18%)] rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">الوصف:</span>
            <span className="text-foreground font-medium">{data.description}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">التاريخ:</span>
            <span className="text-foreground">{data.entry_date}</span>
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <p className="text-[10px] text-muted-foreground mb-1.5">بنود القيد:</p>
            {(data.lines || []).map((line: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                <span className="text-foreground">{line.account_name} ({line.account_type})</span>
                <div className="flex gap-4">
                  {line.debit > 0 && <span className="text-[hsl(0,72%,55%)]">مدين: {Number(line.debit).toLocaleString()}</span>}
                  {line.credit > 0 && <span className="text-[hsl(152,60%,45%)]">دائن: {Number(line.credit).toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-bold pt-1">
            <span>الإجمالي:</span>
            <div className="flex gap-4">
              <span className={isBalanced ? 'text-[hsl(152,60%,45%)]' : 'text-[hsl(0,72%,55%)]'}>
                مدين: {totalDebit.toLocaleString()} | دائن: {totalCredit.toLocaleString()}
                {isBalanced ? ' ✅' : ' ❌ غير متوازن'}
              </span>
            </div>
          </div>
        </div>

        {action.confirmed === undefined && (
          <div className="flex gap-2">
            <Button
              onClick={onConfirm}
              disabled={isExecuting || !isBalanced}
              className="flex-1 gap-2"
              size="sm"
            >
              {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isExecuting ? 'جاري التنفيذ...' : '✅ نفّذ القيد'}
            </Button>
            <Button onClick={onReject} variant="outline" size="sm" className="gap-2">
              <XCircle className="w-4 h-4" /> إلغاء
            </Button>
          </div>
        )}

        {action.confirmed === true && (
          <div className="flex items-center gap-2 bg-[hsl(152,60%,40%/0.1)] border border-[hsl(152,60%,40%/0.3)] rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-[hsl(152,60%,45%)]" />
            <span className="text-xs text-[hsl(152,60%,50%)]">✅ تم التنفيذ بنجاح</span>
          </div>
        )}

        {action.confirmed === false && (
          <div className="flex items-center gap-2 bg-[hsl(0,72%,55%/0.1)] border border-[hsl(0,72%,55%/0.3)] rounded-lg px-3 py-2">
            <XCircle className="w-4 h-4 text-[hsl(0,72%,55%)]" />
            <span className="text-xs text-[hsl(0,72%,60%)]">❌ تم الإلغاء</span>
          </div>
        )}
      </motion.div>
    );
  }
  return null;
}

export default function BatSharkAI() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pendingActions, setPendingActions] = useState<Map<number, AIAction[]>>(new Map());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoVoice, setAutoVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const { profile } = useAuthContext();
  const createJournalEntry = useCreateJournalEntry();
  const userName = profile?.display_name || 'المستخدم';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingActions]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      toast({ title: 'المتصفح لا يدعم القراءة الصوتية', variant: 'destructive' });
      return;
    }
    window.speechSynthesis.cancel();
    const clean = stripMarkdown(text);
    const chunks = clean.match(/.{1,200}[.،!؟]?\s*/g) || [clean];
    let idx = 0;
    const speakNext = () => {
      if (idx >= chunks.length) { setIsSpeaking(false); return; }
      const utterance = new SpeechSynthesisUtterance(chunks[idx]);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arVoice) utterance.voice = arVoice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { idx++; speakNext(); };
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };
    speakNext();
  }, [toast]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'المتصفح لا يدعم التحدث', variant: 'destructive' });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, toast]);

  const handleConfirmAction = useCallback(async (msgIndex: number, actionIndex: number) => {
    const actions = pendingActions.get(msgIndex);
    if (!actions || !actions[actionIndex]) return;

    const action = actions[actionIndex];
    setIsExecuting(true);

    try {
      if (action.type === 'create_journal_entry') {
        await createJournalEntry.mutateAsync({
          entry: {
            description: action.data.description,
            entry_date: action.data.entry_date || new Date().toISOString().split('T')[0],
            project_id: action.data.project_id,
            notes: 'تم الإنشاء بواسطة BatShark AI',
            created_by: profile?.display_name || 'AI',
          },
          lines: action.data.lines,
        });
        toast({ title: '✅ تم تنفيذ القيد بنجاح!' });
      }

      // Mark as confirmed
      setPendingActions(prev => {
        const next = new Map(prev);
        const acts = [...(next.get(msgIndex) || [])];
        acts[actionIndex] = { ...acts[actionIndex], confirmed: true };
        next.set(msgIndex, acts);
        return next;
      });
    } catch (e) {
      console.error(e);
      toast({ title: '❌ فشل التنفيذ', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setIsExecuting(false);
    }
  }, [pendingActions, createJournalEntry, profile, toast]);

  const handleRejectAction = useCallback((msgIndex: number, actionIndex: number) => {
    setPendingActions(prev => {
      const next = new Map(prev);
      const acts = [...(next.get(msgIndex) || [])];
      acts[actionIndex] = { ...acts[actionIndex], confirmed: false };
      next.set(msgIndex, acts);
      return next;
    });
  }, []);

  const send = useCallback(async (text: string, mode?: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    if (mode === 'review') setIsReviewing(true);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, userName, mode }),
      });

      if (resp.status === 429) {
        toast({ title: 'تم تجاوز حد الطلبات', description: 'حاول مرة أخرى لاحقاً', variant: 'destructive' });
        setIsLoading(false); setIsReviewing(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: 'رصيد غير كافٍ', description: 'يرجى إضافة رصيد من الإعدادات', variant: 'destructive' });
        setIsLoading(false); setIsReviewing(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error('Failed to start stream');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch { /* ignore */ }
        }
      }

      // Parse actions from the complete response
      if (assistantSoFar) {
        const { cleanText, actions } = parseActions(assistantSoFar);
        if (actions.length > 0) {
          // Update the message to clean text (without action blocks)
          setMessages(prev => {
            const newMsgs = [...prev];
            const lastIdx = newMsgs.length - 1;
            if (newMsgs[lastIdx]?.role === 'assistant') {
              newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: cleanText };
            }
            return newMsgs;
          });
          // Store actions for the message index
          const msgIdx = messages.length + 1; // +1 for user msg, this is the assistant msg index
          setPendingActions(prev => new Map(prev).set(msgIdx, actions));
        }
      }

      if (autoVoice && assistantSoFar) {
        const { cleanText } = parseActions(assistantSoFar);
        speak(cleanText);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsReviewing(false);
    }
  }, [isLoading, messages, userName, autoVoice, speak, toast]);

  const handleReview = useCallback(() => {
    send('قم بمراجعة شاملة لجميع البيانات المالية والقيود المحاسبية وأداء المشاريع والموظفين. اكتشف أي أخطاء أو مخاطر وقدم توصيات.', 'review');
  }, [send]);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="BatShark AI" className="w-10 h-10 rounded-xl" />
            <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, hsl(190 80% 50% / 0.15), hsl(210 80% 58% / 0.15))' }}>
              <Brain className="w-6 h-6 text-section-ai" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold" style={{ background: 'var(--gradient-ai)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BatShark AI</h1>
              <p className="text-sm text-muted-foreground">المستشار التنفيذي — منفذ الأوامر — مرحباً {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Review button */}
            <Button
              onClick={handleReview}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              🧠 مراجعة شاملة
            </Button>
            {isSpeaking && (
              <button onClick={stopSpeaking} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20">
                <VolumeX className="w-3.5 h-3.5" /> إيقاف الصوت
              </button>
            )}
            <div className="flex items-center gap-2 bg-secondary/30 border border-border rounded-lg px-3 py-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">رد صوتي</span>
              <Switch checked={autoVoice} onCheckedChange={setAutoVoice} />
            </div>
          </div>
        </div>

        {/* AI capabilities bar */}
        <div className="mt-3 flex flex-wrap gap-2">
          {['📊 تحليل مالي', '📝 إنشاء قيود', '⚠️ كشف مخاطر', '💡 توصيات', '🧠 مراجعة شاملة'].map(cap => (
            <span key={cap} className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
              {cap}
            </span>
          ))}
        </div>
      </motion.div>

      <div className="bg-gradient-card rounded-2xl border border-border shadow-card flex flex-col relative overflow-hidden" style={{ height: 'calc(100vh - 260px)' }}>
        <img src={logo} alt="" className="absolute bottom-4 left-4 w-16 h-16 opacity-[0.04] pointer-events-none" />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                <Sparkles className="w-14 h-14 text-primary/40 mb-4" />
              </motion.div>
              <h3 className="text-lg font-heading text-foreground mb-2">مرحباً {userName} 👋</h3>
              <p className="text-sm text-muted-foreground mb-2 max-w-md">
                أنا مستشارك التنفيذي الاقتصادي. أحلل بياناتك وأنفذ أوامرك مباشرة.
              </p>
              <p className="text-xs text-primary/70 mb-6 max-w-md">
                💡 جرب: "سوي لي قيد مصروف تسويق 5000" أو "راجع بياناتي"
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-2 rounded-lg border border-border bg-secondary/30 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary/15 text-foreground'
                    : 'bg-secondary/50 text-foreground border border-border'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div>
                      <div className="prose prose-sm prose-invert max-w-none text-sm [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:text-foreground [&_strong]:text-primary [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          {isSpeaking ? 'إيقاف' : 'استمع'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </motion.div>

              {/* Action cards for this message */}
              {msg.role === 'assistant' && pendingActions.get(i)?.map((action, ai) => (
                <ActionCard
                  key={ai}
                  action={action}
                  onConfirm={() => handleConfirmAction(i, ai)}
                  onReject={() => handleRejectAction(i, ai)}
                  isExecuting={isExecuting}
                />
              ))}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <motion.div
                  className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center"
                  animate={{ boxShadow: ['0 0 0px hsl(190 80% 50% / 0)', '0 0 16px hsl(190 80% 50% / 0.35)', '0 0 0px hsl(190 80% 50% / 0)'] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Brain className="w-4 h-4 text-primary" />
                  </motion.div>
                </motion.div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {isReviewing ? '🧠 BatShark يراجع كل البيانات...' : '🤖 BatShark ينفذ...'}
                  </span>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                        animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.12 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setMessages([]); setPendingActions(new Map()); stopSpeaking(); }}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <button
              onClick={toggleListening}
              className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-destructive/20 text-destructive animate-pulse'
                  : 'bg-secondary/30 text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="أعطني أمر... مثال: سوي قيد مصروف رواتب 15000"
              disabled={isLoading}
              className="flex-1 bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <Button
              onClick={() => send(input)}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
