import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Clock, Users, User, Crown, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNewsViewers, formatViewDuration, type NewsViewRow } from '@/hooks/useNewsViews';

interface Props {
  newsId: string;
  trigger?: React.ReactNode;
}

interface DirectoryEntry {
  user_id: string;
  name: string;
  avatar: string | null;
  job_title: string | null;
  is_ceo: boolean;
}

/** Loads all known team members (profiles + role) to compute who hasn't viewed. */
function useTeamDirectory() {
  return useQuery({
    queryKey: ['team-directory'],
    queryFn: async (): Promise<DirectoryEntry[]> => {
      const [{ data: profiles }, { data: roles }, { data: employees }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, avatar_url, job_title'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('employees').select('name, avatar_url, position'),
      ]);
      const ceoSet = new Set((roles || []).filter((r: any) => r.role === 'ceo').map((r: any) => r.user_id));
      const empList = employees || [];
      return (profiles || []).map((p: any) => {
        let avatar: string | null = p.avatar_url || null;
        if (!avatar) {
          const m = empList.find((e: any) => e.avatar_url && (e.name === p.display_name || e.name?.includes(p.display_name) || p.display_name?.includes(e.name)));
          if (m) avatar = (m as any).avatar_url;
        }
        return {
          user_id: p.user_id,
          name: p.display_name || 'مستخدم',
          avatar,
          job_title: p.job_title || null,
          is_ceo: ceoSet.has(p.user_id),
        };
      });
    },
    staleTime: 60_000,
  });
}

export default function NewsViewersDialog({ newsId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const { data: views = [] } = useNewsViewers(newsId);
  const { data: team = [] } = useTeamDirectory();

  const { viewers, nonViewers, totalSeconds, avgSeconds } = useMemo(() => {
    const viewedIds = new Set(views.map(v => v.user_id));
    const dirByUser = new Map(team.map(t => [t.user_id, t]));
    const viewersList = views.map(v => ({
      ...v,
      _dir: dirByUser.get(v.user_id),
    }));
    const nonViewersList = team.filter(t => !viewedIds.has(t.user_id));
    const total = views.reduce((a, b) => a + (b.total_seconds || 0), 0);
    return {
      viewers: viewersList,
      nonViewers: nonViewersList,
      totalSeconds: total,
      avgSeconds: views.length ? Math.round(total / views.length) : 0,
    };
  }, [views, team]);

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-[11px] h-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
    >
      <Eye className="w-3.5 h-3.5" />
      <span className="font-bold">{views.length}</span>
      <span className="hidden sm:inline">مشاهد</span>
      {avgSeconds > 0 && (
        <>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <Clock className="w-3 h-3" />
          <span>{formatViewDuration(avgSeconds)}</span>
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-heading">
            <Users className="w-4 h-4 text-primary" />
            من شاهد هذا الخبر
          </DialogTitle>
        </DialogHeader>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-2.5">
            <div className="text-[10px] font-bold text-muted-foreground">شاهدوا</div>
            <div className="text-lg font-heading font-black text-primary">{viewers.length}</div>
          </div>
          <div className="rounded-xl bg-destructive/5 border border-destructive/10 p-2.5">
            <div className="text-[10px] font-bold text-muted-foreground">لم يشاهدوا</div>
            <div className="text-lg font-heading font-black text-destructive">{nonViewers.length}</div>
          </div>
          <div className="rounded-xl bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/15 p-2.5">
            <div className="text-[10px] font-bold text-muted-foreground">متوسط الوقت</div>
            <div className="text-lg font-heading font-black text-[hsl(var(--success))]">{formatViewDuration(avgSeconds)}</div>
          </div>
        </div>

        <Tabs defaultValue="viewers" className="flex-1 min-h-0 flex flex-col" dir="rtl">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="viewers" className="gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" /> المشاهدون ({viewers.length})
            </TabsTrigger>
            <TabsTrigger value="missed" className="gap-1.5 text-xs">
              <EyeOff className="w-3.5 h-3.5" /> لم يشاهدوا ({nonViewers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="viewers" className="flex-1 min-h-0 overflow-y-auto mt-3 space-y-2">
            {viewers.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">لم يشاهد هذا الخبر أحد بعد</p>
            ) : viewers.map((v: any, i) => (
              <ViewerRow
                key={v.id}
                rank={i + 1}
                name={v._dir?.name || v.user_name || 'مستخدم'}
                avatar={v._dir?.avatar || v.user_avatar}
                jobTitle={v._dir?.job_title}
                isCEO={v._dir?.is_ceo}
                seconds={v.total_seconds}
                lastViewedAt={v.last_viewed_at}
              />
            ))}
          </TabsContent>

          <TabsContent value="missed" className="flex-1 min-h-0 overflow-y-auto mt-3 space-y-2">
            {nonViewers.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">شاهد الجميع هذا الخبر 🎉</p>
            ) : nonViewers.map(p => (
              <div key={p.user_id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/20">
                <Avatar className="w-9 h-9 ring-1 ring-destructive/20">
                  <AvatarImage src={p.avatar || undefined} className="object-cover" />
                  <AvatarFallback className="bg-destructive/10 text-destructive"><User className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground truncate">{p.name}</span>
                    {p.is_ceo && <Crown className="w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />}
                  </div>
                  {p.job_title && <p className="text-[10px] text-muted-foreground truncate">{p.job_title}</p>}
                </div>
                <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive bg-destructive/5">
                  لم يشاهد
                </Badge>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ViewerRow({
  rank, name, avatar, jobTitle, isCEO, seconds, lastViewedAt,
}: {
  rank: number;
  name: string;
  avatar: string | null;
  jobTitle?: string | null;
  isCEO?: boolean;
  seconds: number;
  lastViewedAt: string;
}) {
  const isTop = rank === 1 && seconds >= 5;
  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
      isTop
        ? 'border-[hsl(var(--gold))]/30 bg-gradient-to-l from-[hsl(var(--gold))]/5 to-transparent'
        : 'border-border bg-card hover:bg-muted/30'
    }`}>
      <div className="relative">
        <Avatar className="w-9 h-9 ring-1 ring-primary/20">
          <AvatarImage src={avatar || undefined} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary"><User className="w-4 h-4" /></AvatarFallback>
        </Avatar>
        {isTop && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[hsl(var(--gold))] text-[9px] font-black flex items-center justify-center text-black shadow">
            <TrendingUp className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-foreground truncate">{name}</span>
          {isCEO && <Crown className="w-3 h-3 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {jobTitle && <span className="truncate">{jobTitle}</span>}
          {jobTitle && <span>•</span>}
          <span>آخر مشاهدة {formatDistanceToNow(new Date(lastViewedAt), { addSuffix: true, locale: ar })}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 rounded-md px-2 py-0.5">
          <Clock className="w-3 h-3" />
          {formatViewDuration(seconds)}
        </span>
        <span className="text-[9px] text-muted-foreground">#{rank}</span>
      </div>
    </div>
  );
}
