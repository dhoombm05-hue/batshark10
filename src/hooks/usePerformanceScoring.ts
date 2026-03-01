import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserPerformanceScore {
  userId: string;
  displayName: string;
  totalActions: number;
  updates: number;
  creates: number;
  deletes: number;
  weeklyActions: number;
  monthlyActions: number;
  financialImpact: number;
  score: number;
  rank: number;
  cycleStart: string;
}

/**
 * Auto Performance Scoring System — cycle-aware.
 * Only counts activities AFTER the last archived cycle end date.
 */
export function usePerformanceScoring() {
  return useQuery({
    queryKey: ['performance-scoring'],
    queryFn: async () => {
      // Find the last cycle end to scope current cycle
      const { data: lastCycleData } = await supabase
        .from('performance_cycles' as any)
        .select('cycle_end')
        .order('cycle_end', { ascending: false })
        .limit(1);

      const lastCycleEnd = (lastCycleData as any)?.[0]?.cycle_end || null;

      // Get activities only from current cycle
      let query = supabase
        .from('user_activity')
        .select('*')
        .order('created_at', { ascending: false });

      if (lastCycleEnd) {
        query = query.gt('created_at', lastCycleEnd);
      }

      const { data: activities } = await query;

      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name');

      if (!activities || !profiles) return [];

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const userMap = new Map<string, UserPerformanceScore>();

      for (const profile of profiles) {
        const userActivities = activities.filter((a: any) => a.user_id === profile.user_id);
        const weeklyActivities = userActivities.filter((a: any) => new Date(a.created_at) >= weekAgo);
        const monthlyActivities = userActivities.filter((a: any) => new Date(a.created_at) >= monthAgo);

        const updates = userActivities.filter((a: any) => a.action_type === 'update').length;
        const creates = userActivities.filter((a: any) => a.action_type === 'create').length;
        const deletes = userActivities.filter((a: any) => a.action_type === 'delete').length;

        let financialImpact = 0;
        for (const a of userActivities) {
          const details = a.details as any;
          if (details?.new_value && details?.old_value) {
            const newVal = Number(details.new_value);
            const oldVal = Number(details.old_value);
            if (!isNaN(newVal) && !isNaN(oldVal)) {
              financialImpact += Math.abs(newVal - oldVal);
            }
          }
        }

        // Score: starts from 0, builds up with activity
        const activityScore = Math.min(userActivities.length * 2, 30);
        const weeklyScore = Math.min(weeklyActivities.length * 5, 25);
        const monthlyScore = Math.min(monthlyActivities.length * 1.5, 20);
        const diversityScore = (updates > 0 ? 5 : 0) + (creates > 0 ? 5 : 0) + (deletes > 0 ? 5 : 0);
        const impactScore = Math.min(financialImpact > 0 ? 10 : 0, 10);

        const score = Math.min(Math.round(activityScore + weeklyScore + monthlyScore + diversityScore + impactScore), 100);

        userMap.set(profile.user_id, {
          userId: profile.user_id,
          displayName: profile.display_name,
          totalActions: userActivities.length,
          updates,
          creates,
          deletes,
          weeklyActions: weeklyActivities.length,
          monthlyActions: monthlyActivities.length,
          financialImpact,
          score,
          rank: 0,
          cycleStart: lastCycleEnd || (userActivities.length > 0 
            ? userActivities[userActivities.length - 1].created_at 
            : now.toISOString()),
        });
      }

      const sorted = Array.from(userMap.values()).sort((a, b) => b.score - a.score);
      sorted.forEach((s, i) => { s.rank = i + 1; });

      return sorted;
    },
  });
}
