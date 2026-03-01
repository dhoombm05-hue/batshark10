import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PerformanceCycle {
  id: string;
  user_id: string;
  display_name: string;
  cycle_start: string;
  cycle_end: string;
  total_actions: number;
  updates_count: number;
  creates_count: number;
  deletes_count: number;
  financial_impact: number;
  final_score: number;
  notes: string | null;
  created_at: string;
}

export function usePerformanceCycles() {
  return useQuery({
    queryKey: ['performance-cycles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_cycles' as any)
        .select('*')
        .order('cycle_end', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PerformanceCycle[];
    },
  });
}

/**
 * Archive current cycle scores and reset activity counters.
 * Does NOT delete user_activity — just records a snapshot and marks cycle boundary.
 */
export function useResetPerformanceCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scores: {
      userId: string;
      displayName: string;
      totalActions: number;
      updates: number;
      creates: number;
      deletes: number;
      financialImpact: number;
      score: number;
      cycleStart: string;
    }[]) => {
      // Find the earliest activity as cycle start, or use last cycle end
      const { data: lastCycle } = await supabase
        .from('performance_cycles' as any)
        .select('cycle_end')
        .order('cycle_end', { ascending: false })
        .limit(1);

      const lastEnd = (lastCycle as any)?.[0]?.cycle_end;
      const now = new Date().toISOString();

      const inserts = scores.map(s => ({
        user_id: s.userId,
        display_name: s.displayName,
        cycle_start: s.cycleStart || lastEnd || now,
        cycle_end: now,
        total_actions: s.totalActions,
        updates_count: s.updates,
        creates_count: s.creates,
        deletes_count: s.deletes,
        financial_impact: s.financialImpact,
        final_score: s.score,
      }));

      if (inserts.length > 0) {
        const { error } = await supabase
          .from('performance_cycles' as any)
          .insert(inserts as any);
        if (error) throw error;
      }

      return inserts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['performance-cycles'] });
      queryClient.invalidateQueries({ queryKey: ['performance-scoring'] });
      toast.success(`تم أرشفة دورة الأداء (${count} موظف) وبدء دورة جديدة`);
    },
    onError: () => {
      toast.error('فشل في أرشفة دورة الأداء');
    },
  });
}
