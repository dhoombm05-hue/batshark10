import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, Loader2, Sparkles, Trash2, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import logo from '@/assets/batshark-logo-new.png';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/batshark-ai`;

const SUGGESTIONS = [
  'وش وضع الإيرادات؟',
  'ما هو أفضل مشروع حالياً؟',
  'كيف نحسن ربحية الشركة؟',
  'حلل أداء الموظفين',
  'قارن بين المشاريع',
  'ما هي المخاطر الرئيسية؟',
  'أعطني ملخص مالي شامل',
  'اقترح خطة لتقليل المصاريف',
];

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/- /g, '، ')
    .replace(/\n+/g, '. ')
    .replace(/[|]/g, '،')
    .trim();
}

export default function BatSharkAI() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoVoice, setAutoVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const { profile } = useAuthContext();
  const userName = profile?.display_name || 'المستخدم';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      toast({ title: 'المتصفح لا يدعم القراءة الصوتية', variant: 'destructive' });
      return;
    }
    window.speechSynthesis.cancel();
    const clean = stripMarkdown(text);
    // Split into chunks for better quality
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

  // Speech-to-text
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

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, userName }),
      });

      if (resp.status === 429) {
        toast({ title: 'تم تجاوز حد الطلبات', description: 'حاول مرة أخرى لاحقاً', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: 'رصيد غير كافٍ', description: 'يرجى إضافة رصيد من الإعدادات', variant: 'destructive' });
        setIsLoading(false);
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

      if (autoVoice && assistantSoFar) {
        speak(assistantSoFar);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, userName, autoVoice, speak, toast]);

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
              <p className="text-sm text-muted-foreground">المستشار التنفيذي الاقتصادي — مرحباً {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSpeaking && (
              <button onClick={stopSpeaking} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20">
                <VolumeX className="w-3.5 h-3.5" /> إيقاف الصوت
              </button>
            )}
            <div className="flex items-center gap-2 bg-secondary/30 border border-border rounded-lg px-3 py-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">رد صوتي تلقائي</span>
              <Switch checked={autoVoice} onCheckedChange={setAutoVoice} />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="bg-gradient-card rounded-2xl border border-border shadow-card flex flex-col relative overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        <img src={logo} alt="" className="absolute bottom-4 left-4 w-16 h-16 opacity-[0.04] pointer-events-none" />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Sparkles className="w-14 h-14 text-primary/40 mb-4" />
              </motion.div>
              <h3 className="text-lg font-heading text-foreground mb-2">مرحباً {userName} 👋</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                أنا مستشارك التنفيذي الاقتصادي. أحلل بياناتك الفعلية وأعطيك توصيات عملية مبنية على الأرقام الحقيقية.
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
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
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
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">BatShark يفكر...</span>
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
                onClick={() => { setMessages([]); stopSpeaking(); }}
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
              placeholder="اسأل عن مشاريعك، أرباحك، موظفيك..."
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
