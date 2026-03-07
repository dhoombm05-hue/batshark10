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

        // Strict governance scoring — very hard to reach 100%
        // Activity volume (max 20): needs 50+ actions for full marks
        const activityScore = Math.min(userActivities.length * 0.4, 20);
        // Weekly consistency (max 15): needs 15+ actions/week
        const weeklyScore = Math.min(weeklyActivities.length * 1, 15);
        // Monthly depth (max 15): needs 50+ actions/month
        const monthlyScore = Math.min(monthlyActivities.length * 0.3, 15);
        // Diversity of work (max 15): must do ALL types + minimum thresholds
        const diversityScore = 
          (updates >= 10 ? 5 : updates >= 3 ? 2 : 0) + 
          (creates >= 5 ? 5 : creates >= 2 ? 2 : 0) + 
          (deletes >= 3 ? 5 : deletes >= 1 ? 1 : 0);
        // Financial impact (max 20): scaled by actual monetary value
        const impactScore = Math.min(
          financialImpact >= 100000 ? 20 :
          financialImpact >= 50000 ? 15 :
          financialImpact >= 10000 ? 10 :
          financialImpact >= 1000 ? 5 :
          financialImpact > 0 ? 2 : 0, 20);
        // Consistency bonus (max 15): active across multiple days
        const activeDays = new Set(userActivities.map((a: any) => new Date(a.created_at).toDateString())).size;
        const consistencyScore = Math.min(activeDays * 1, 15);

        const score = Math.min(Math.round(activityScore + weeklyScore + monthlyScore + diversityScore + impactScore + consistencyScore), 100);

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
