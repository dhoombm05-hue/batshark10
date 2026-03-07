import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserPerformanceScore {
  userId: string;
  displayName: string;
  totalActions: number;
  completedActions: number;
  updates: number;
  creates: number;
  deletes: number;
  newsCount: number;
  weeklyActions: number;
  monthlyActions: number;
  financialImpact: number;
  score: number;
  rank: number;
  cycleStart: string;
}

/**
 * Governance-based Performance Scoring System — cycle-aware.
 * 
 * Scoring Philosophy:
 * - Only COMPLETED meaningful operations count (not simple page views or partial edits)
 * - A "completed operation" = create followed by meaningful updates on the same entity,
 *   or a substantial update with real value changes
 * - News publishing and engagement count as productive work
 * - Raw delete-then-create cycles are penalized (detected as non-productive churn)
 * - 100% is nearly impossible — requires exceptional sustained excellence
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
      let activityQuery = supabase
        .from('user_activity')
        .select('*')
        .order('created_at', { ascending: false });

      if (lastCycleEnd) {
        activityQuery = activityQuery.gt('created_at', lastCycleEnd);
      }

      const { data: activities } = await activityQuery;

      // Get news authored in this cycle
      let newsQuery = supabase
        .from('news')
        .select('id, author_id, created_at, content, title, media_url, comments_count, likes_count');

      if (lastCycleEnd) {
        newsQuery = newsQuery.gt('created_at', lastCycleEnd);
      }

      const { data: newsItems } = await newsQuery;

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

        // --- Categorize actions ---
        const updates = userActivities.filter((a: any) => a.action_type === 'update');
        const creates = userActivities.filter((a: any) => a.action_type === 'create');
        const deletes = userActivities.filter((a: any) => a.action_type === 'delete');

        // --- Detect COMPLETED operations (not just raw counts) ---
        // A completed operation: entity was created AND then updated (shows follow-through)
        const createdEntities = new Set(creates.map((a: any) => `${a.entity_type}:${a.entity_id}`));
        const updatedEntities = new Set(updates.map((a: any) => `${a.entity_type}:${a.entity_id}`));
        const deletedEntities = new Set(deletes.map((a: any) => `${a.entity_type}:${a.entity_id}`));

        // Completed = created AND updated (real follow-through work)
        let completedOps = 0;
        for (const entity of createdEntities) {
          if (updatedEntities.has(entity)) completedOps++;
        }

        // Substantial updates = updates with actual value changes (not just opening/closing)
        let substantialUpdates = 0;
        for (const a of updates) {
          const details = a.details as any;
          if (details?.new_value && details?.old_value && details.new_value !== details.old_value) {
            substantialUpdates++;
          }
        }

        // Detect churn: create then immediately delete same entity = not productive
        let churnCount = 0;
        for (const entity of createdEntities) {
          if (deletedEntities.has(entity) && !updatedEntities.has(entity)) {
            churnCount++;
          }
        }

        // --- News contributions ---
        const userNews = (newsItems || []).filter((n: any) => n.author_id === profile.user_id);
        // Quality news = has content (not empty), title, and ideally media or engagement
        const qualityNews = userNews.filter((n: any) => 
          n.title && n.title.trim().length > 3 && 
          n.content && n.content.trim().length > 10
        );
        const newsWithMedia = qualityNews.filter((n: any) => n.media_url);
        const newsWithEngagement = qualityNews.filter((n: any) => 
          (n.comments_count || 0) > 0 || (n.likes_count || 0) > 0
        );

        // --- Financial Impact ---
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

        // ============================================
        // GOVERNANCE SCORING — 100 points max
        // ============================================

        // 1. Completed Operations Quality (max 25)
        //    Only counts REAL completed work, penalizes churn
        const netCompleted = Math.max(completedOps - churnCount, 0);
        const completedScore = Math.min(
          netCompleted >= 20 ? 25 :
          netCompleted >= 10 ? 18 :
          netCompleted >= 5 ? 12 :
          netCompleted >= 2 ? 6 :
          netCompleted >= 1 ? 3 : 0, 25);

        // 2. Substantial Updates Quality (max 15)
        //    Must be real value changes, not trivial edits
        const updateQualityScore = Math.min(
          substantialUpdates >= 30 ? 15 :
          substantialUpdates >= 15 ? 10 :
          substantialUpdates >= 5 ? 6 :
          substantialUpdates >= 2 ? 3 : 0, 15);

        // 3. News & Communication (max 15)
        //    Publishing quality news with content, media, engagement
        const newsScore = Math.min(
          (qualityNews.length >= 5 ? 6 : qualityNews.length >= 2 ? 3 : qualityNews.length >= 1 ? 1 : 0) +
          (newsWithMedia.length >= 3 ? 5 : newsWithMedia.length >= 1 ? 2 : 0) +
          (newsWithEngagement.length >= 3 ? 4 : newsWithEngagement.length >= 1 ? 2 : 0), 15);

        // 4. Financial Impact (max 20)
        const impactScore = Math.min(
          financialImpact >= 100000 ? 20 :
          financialImpact >= 50000 ? 15 :
          financialImpact >= 10000 ? 10 :
          financialImpact >= 1000 ? 5 :
          financialImpact > 0 ? 2 : 0, 20);

        // 5. Consistency & Dedication (max 15)
        //    Active across multiple days shows commitment
        const activeDays = new Set(userActivities.map((a: any) => new Date(a.created_at).toDateString())).size;
        const consistencyScore = Math.min(
          activeDays >= 20 ? 15 :
          activeDays >= 10 ? 10 :
          activeDays >= 5 ? 6 :
          activeDays >= 2 ? 3 : 0, 15);

        // 6. Work Diversity (max 10)
        //    Must work across different entity types (projects, employees, tables, news, etc.)
        const entityTypes = new Set(userActivities.map((a: any) => a.entity_type).filter(Boolean));
        const diversityScore = Math.min(
          entityTypes.size >= 5 ? 10 :
          entityTypes.size >= 3 ? 6 :
          entityTypes.size >= 2 ? 3 : 0, 10);

        // === TOTAL ===
        const rawScore = completedScore + updateQualityScore + newsScore + impactScore + consistencyScore + diversityScore;
        
        // Churn penalty: each churn operation reduces 2 points
        const churnPenalty = Math.min(churnCount * 2, 15);
        
        const score = Math.max(0, Math.min(Math.round(rawScore - churnPenalty), 100));

        const totalMeaningfulActions = netCompleted + substantialUpdates + qualityNews.length;

        userMap.set(profile.user_id, {
          userId: profile.user_id,
          displayName: profile.display_name,
          totalActions: userActivities.length,
          completedActions: totalMeaningfulActions,
          updates: updates.length,
          creates: creates.length,
          deletes: deletes.length,
          newsCount: qualityNews.length,
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
