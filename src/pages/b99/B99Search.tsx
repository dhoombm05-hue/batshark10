import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, Sparkles, ArrowLeft, Lightbulb, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function B99Search() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const [q, setQ] = useState(params.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => { if (params.get('q')) doSearch(params.get('q')!); }, [params.get('q')]);

  const doSearch = async (query: string) => {
    setLoading(true); setData(null);
    try {
      const { data: r, error } = await supabase.functions.invoke('b99-engine', { body: { action: 'search', payload: { query } } });
      if (error) throw error;
      if (r.error) throw new Error(r.error);
      setData(r);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!q.trim()) return; setParams({ q: q.trim() }); };

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs text-slate-400 uppercase tracking-widest">محرك البحث الذكي</div>
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2"><SearchIcon className="w-6 h-6 text-amber-400" /> ابحث في كل المنصة</h1>
      </header>

      <form onSubmit={submit}>
        <div className="relative">
          <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسأل أو ابحث عن أي شيء..."
            className="bg-slate-900/60 border-white/10 pr-12 h-14 text-lg rounded-2xl" autoFocus />
        </div>
      </form>

      {loading && (
        <div className="text-center py-12 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-violet-400" />
          البحث يجمع نتائج ذكية...
        </div>
      )}

      <AnimatePresence>
        {data && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {data.direct_answer && (
              <Card className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-white/10 p-5">
                <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-amber-300" /><div className="text-xs text-amber-300 font-bold">إجابة مباشرة</div></div>
                <p className="text-sm leading-relaxed">{data.direct_answer}</p>
              </Card>
            )}

            {data.results?.length > 0 && (
              <div className="space-y-3">
                {data.results.map((r: any, i: number) => (
                  <Card key={i} className="bg-white/[0.03] border-white/10 p-4 hover:border-white/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="border-white/20 text-slate-300 text-[10px]">{r.category}</Badge>
                          {r.relevance && <span className="text-[10px] text-emerald-300">توافق {Math.round(r.relevance)}%</span>}
                        </div>
                        <h3 className="font-bold text-base">{r.title}</h3>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{r.snippet}</p>
                      </div>
                      {r.action_route && (
                        <Button onClick={() => nav(r.action_route)} size="sm" variant="ghost" className="text-violet-300 hover:text-white shrink-0 gap-1">
                          فتح <ArrowLeft className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {data.related_questions?.length > 0 && (
              <Card className="bg-white/[0.03] border-white/10 p-5">
                <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2"><Lightbulb className="w-3.5 h-3.5 text-amber-300" /> أسئلة ذات صلة</h3>
                <div className="flex flex-wrap gap-2">
                  {data.related_questions.map((rq: string, i: number) => (
                    <button key={i} onClick={() => { setQ(rq); setParams({ q: rq }); }}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/30 text-slate-300">
                      {rq}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
