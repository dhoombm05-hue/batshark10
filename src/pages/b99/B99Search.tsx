import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search as SearchIcon, Sparkles, ArrowLeft, Globe, RefreshCw, ExternalLink,
  Layout as LayoutIcon, Lightbulb, Layers,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/batshark-logo-official.png';

const SUGGESTIONS = [
  'منصة حجز ملاعب بادل في الرياض',
  'متجر عطور فاخر بهوية ذهبية',
  'موقع توصيل أكل صحي للموظفين',
  'منصة دورات تعليمية بالعربية',
  'تطبيق إدارة جلسات تدريب',
];

export default function B99Search() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const [q, setQ] = useState(params.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const qp = params.get('q');
    if (qp) { setQ(qp); doSearch(qp); }
  }, [params.get('q')]);

  const doSearch = async (query: string) => {
    setLoading(true); setData(null);
    try {
      const { data: r, error } = await supabase.functions.invoke('b99-engine', {
        body: { action: 'search', payload: { query } },
      });
      if (error) throw error;
      if (r?.error) throw new Error(r.error);
      setData(r);
    } catch (e: any) { toast.error(e.message || 'تعذر البحث'); }
    finally { setLoading(false); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setParams({ q: q.trim() });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-white via-slate-50 to-amber-50/30">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">

        {/* HEADER */}
        <header className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3 mb-3">
            <img src={logo} alt="" className="w-10 h-10 object-contain" />
            <div className="text-right">
              <div className="text-[10px] tracking-[0.4em] text-amber-700 font-bold uppercase">Scientific Search</div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900">البحث العلمي الذكي</h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 max-w-xl">
            مدعوم بـ Google + الذكاء الاصطناعي — يبحث في الويب الحقيقي ويقترح لك منصات مشابهة وأفكار محتوى.
          </p>
        </header>

        {/* SEARCH BOX */}
        <form onSubmit={submit} className="relative mb-4">
          <div className="relative group">
            <SearchIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-600 transition" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن أي شيء أو اكتب فكرة منصتك..."
              className="h-16 pr-14 pl-32 text-base md:text-lg bg-white border border-slate-200 rounded-full shadow-[0_10px_40px_-15px_rgba(15,23,42,0.15)] focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:border-amber-300"
            />
            <Button
              type="submit"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-12 px-5 rounded-full bg-gradient-to-l from-amber-500 to-amber-400 hover:opacity-95 text-slate-950 font-black gap-1.5"
            >
              <Sparkles className="w-4 h-4" /> ابحث
            </Button>
          </div>
        </form>

        {/* SUGGESTIONS (idle) */}
        {!data && !loading && (
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setQ(s); setParams({ q: s }); }}
                className="text-xs px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="text-center py-16">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-amber-500" />
            <p className="text-sm text-slate-500">يبحث في الويب ويجمّع المرجعيات...</p>
          </div>
        )}

        {/* RESULTS */}
        <AnimatePresence>
          {data && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">

              {/* AI Answer */}
              {data.answer && (
                <Card className="relative overflow-hidden p-6 md:p-8 rounded-3xl border border-amber-200/60 bg-gradient-to-br from-white to-amber-50/40 shadow-[0_20px_60px_-30px_rgba(212,175,55,0.4)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-transparent rounded-bl-[5rem] pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] tracking-[0.3em] text-amber-700 font-black uppercase">AI Answer</span>
                    </div>
                    <div className="prose prose-slate prose-sm max-w-none whitespace-pre-line text-slate-800 leading-relaxed">
                      {data.answer}
                    </div>
                  </div>
                </Card>
              )}

              {/* Web Sources */}
              {data.sources?.length > 0 && (
                <section>
                  <SectionTitle icon={Globe} en="Web Sources" ar="مصادر من الويب" count={data.sources.length} />
                  <div className="space-y-2.5">
                    {data.sources.slice(0, 8).map((s: any, i: number) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="block p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md transition group">
                        <div className="text-[11px] text-emerald-700 truncate mb-1">{s.url}</div>
                        <div className="font-bold text-slate-900 group-hover:text-amber-700 transition flex items-center gap-1.5">
                          {s.title}
                          <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Inspirations: similar platforms */}
              {data.inspirations?.items?.length > 0 && (
                <section>
                  <SectionTitle icon={Layers} en="Similar Platforms" ar="منصات مشابهة للإلهام" count={data.inspirations.items.length} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.inspirations.items.map((it: any, i: number) => (
                      <Card key={i} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-lg transition">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="font-black text-slate-900">{it.name}</div>
                          {it.region && <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">{it.region}</Badge>}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{it.why}</p>
                        {it.url && (
                          <a href={it.url} target="_blank" rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-bold">
                            افتح المرجع <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Content & Layout ideas */}
              {(data.inspirations?.content_ideas?.length > 0 || data.inspirations?.layout_ideas?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.inspirations.content_ideas?.length > 0 && (
                    <Card className="p-5 rounded-2xl border border-slate-200 bg-white">
                      <SectionTitle icon={Lightbulb} en="Content Ideas" ar="أفكار محتوى" small />
                      <ul className="space-y-2 mt-2">
                        {data.inspirations.content_ideas.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> {c}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  {data.inspirations.layout_ideas?.length > 0 && (
                    <Card className="p-5 rounded-2xl border border-slate-200 bg-white">
                      <SectionTitle icon={LayoutIcon} en="Layout Ideas" ar="أفكار ترتيب الصفحات" small />
                      <ul className="space-y-2 mt-2">
                        {data.inspirations.layout_ideas.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" /> {c}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>
              )}

              {/* Internal results */}
              {(data.internal?.platforms?.length > 0 || data.internal?.ads?.length > 0) && (
                <section>
                  <SectionTitle icon={SearchIcon} en="From Your Workspace" ar="من بيانات منصتك" />
                  <div className="space-y-2">
                    {data.internal.platforms.map((p: any) => (
                      <button key={p.id} onClick={() => nav(`/p/${p.slug}`)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-300 transition text-right">
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.tagline}</div>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Empty state */}
              {!data.answer && !data.sources?.length && !data.inspirations?.items?.length && (
                <Card className="p-8 text-center text-sm text-slate-500 rounded-2xl border-slate-200">
                  لم نعثر على نتائج. جرّب صياغة مختلفة أو فكرة أوسع.
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, en, ar, count, small }: any) {
  return (
    <div className={`flex items-center justify-between mb-3 ${small ? 'mb-2' : ''}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-amber-600" />
        <span className="text-[10px] tracking-[0.3em] text-amber-700 font-black uppercase">{en}</span>
        <span className="text-sm font-black text-slate-900">— {ar}</span>
      </div>
      {count != null && <span className="text-[11px] text-slate-400">{count} نتيجة</span>}
    </div>
  );
}
