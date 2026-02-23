import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserName } from './useActivityLog';

export interface ActivityImpactEntry {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  section: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  numeric_difference: number;
  is_manual_override: boolean;
  change_reason: string | null;
  impact_on_net_profit: number;
  impact_on_liquidity: number;
  impact_on_growth: number;
  risk_level: string;
  created_at: string;
}

export interface EmployeeActivityProfile {
  userId: string;
  userName: string;
  totalActions: number;
  updates: number;
  creates: number;
  deletes: number;
  overrides: number;
  weeklyActions: number;
  monthlyActions: number;
  // Activity map
  topSection: string;
  topEntityType: string;
  focusArea: 'financial' | 'files' | 'mixed';
  // Impact analysis
  totalFinancialImpact: number;
  profitImpact: number; // positive = raised profits, negative = lowered
  riskScore: number; // 0-100
  highImpactActions: number;
  // Quality index
  qualityScore: number; // 0-100
  alertsTriggered: number;
  correctionsCount: number;
}

/**
 * Log an activity with deep impact analysis
 */
export async function logActivityImpact(params: {
  actionType: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  section?: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  isManualOverride?: boolean;
  changeReason?: string;
  impactOnNetProfit?: number;
  impactOnLiquidity?: number;
  impactOnGrowth?: number;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userName = await getCurrentUserName();
    const oldNum = Number(params.oldValue);
    const newNum = Number(params.newValue);
    const numericDiff = (!isNaN(oldNum) && !isNaN(newNum)) ? newNum - oldNum : 0;

    // Calculate risk level
    let riskLevel = 'low';
    const absDiff = Math.abs(numericDiff);
    if (absDiff > 100000) riskLevel = 'critical';
    else if (absDiff > 50000) riskLevel = 'high';
    else if (absDiff > 10000) riskLevel = 'medium';

    await supabase.from('activity_impact_log' as any).insert({
      user_id: session.user.id,
      user_name: userName,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      entity_name: params.entityName ?? null,
      section: params.section ?? null,
      field_name: params.fieldName ?? null,
      old_value: params.oldValue != null ? String(params.oldValue) : null,
      new_value: params.newValue != null ? String(params.newValue) : null,
      numeric_difference: numericDiff,
      is_manual_override: params.isManualOverride ?? false,
      change_reason: params.changeReason ?? null,
      impact_on_net_profit: params.impactOnNetProfit ?? numericDiff,
      impact_on_liquidity: params.impactOnLiquidity ?? 0,
      impact_on_growth: params.impactOnGrowth ?? 0,
      risk_level: riskLevel,
    } as any);
  } catch {
    // Silent — never block main operations
  }
}

/**
 * Fetch all activity impact logs (CEO sees all, others see own)
 */
export function useActivityImpactLogs(filters?: { userId?: string; entityType?: string; section?: string }) {
  return useQuery({
    queryKey: ['activity-impact-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('activity_impact_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters?.userId) query = query.eq('user_id', filters.userId);
      if (filters?.entityType) query = query.eq('entity_type', filters.entityType);
      if (filters?.section) query = query.eq('section', filters.section);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ActivityImpactEntry[];
    },
  });
}

/**
 * Build an advanced employee activity profile from impact logs
 */
export function useEmployeeActivityProfile(userId?: string) {
  return useQuery({
    queryKey: ['employee-activity-profile', userId],
    queryFn: async () => {
      const query = userId
        ? supabase.from('activity_impact_log' as any).select('*').eq('user_id', userId).order('created_at', { ascending: false })
        : supabase.from('activity_impact_log' as any).select('*').order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      const logs = (data || []) as unknown as ActivityImpactEntry[];

      // Group by user
      const userMap = new Map<string, ActivityImpactEntry[]>();
      for (const log of logs) {
        const arr = userMap.get(log.user_id) || [];
        arr.push(log);
        userMap.set(log.user_id, arr);
      }

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const profiles: EmployeeActivityProfile[] = [];

      for (const [uid, userLogs] of userMap) {
        const userName = userLogs[0]?.user_name || 'مجهول';
        const weeklyLogs = userLogs.filter(l => new Date(l.created_at) >= weekAgo);
        const monthlyLogs = userLogs.filter(l => new Date(l.created_at) >= monthAgo);

        // Counts
        const updates = userLogs.filter(l => l.action_type === 'update' || l.action_type === 'override').length;
        const creates = userLogs.filter(l => l.action_type === 'create').length;
        const deletes = userLogs.filter(l => l.action_type === 'delete').length;
        const overrides = userLogs.filter(l => l.is_manual_override).length;

        // Activity map
        const sectionCounts = new Map<string, number>();
        const entityCounts = new Map<string, number>();
        let financialCount = 0;
        let fileCount = 0;
        for (const l of userLogs) {
          if (l.section) sectionCounts.set(l.section, (sectionCounts.get(l.section) || 0) + 1);
          entityCounts.set(l.entity_type, (entityCounts.get(l.entity_type) || 0) + 1);
          if (['projects', 'project_expenses', 'project_revenues', 'journal_entries'].includes(l.entity_type)) financialCount++;
          if (l.entity_type === 'documents') fileCount++;
        }
        const topSection = [...sectionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'غير محدد';
        const topEntityType = [...entityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'غير محدد';
        const focusArea = fileCount > financialCount ? 'files' : financialCount > 0 ? 'financial' : 'mixed';

        // Impact analysis
        const totalFinancialImpact = userLogs.reduce((s, l) => s + Math.abs(l.numeric_difference), 0);
        const profitImpact = userLogs.reduce((s, l) => s + l.impact_on_net_profit, 0);
        const highImpactActions = userLogs.filter(l => l.risk_level === 'high' || l.risk_level === 'critical').length;
        const riskScore = Math.min(Math.round((highImpactActions / Math.max(userLogs.length, 1)) * 100), 100);

        // Quality index
        const alertsTriggered = userLogs.filter(l => l.risk_level === 'critical').length;
        const correctionsCount = userLogs.filter(l => l.change_reason?.includes('تصحيح')).length;
        const qualityBase = 80;
        const qualityPenalty = alertsTriggered * 5;
        const qualityBonus = correctionsCount * 3;
        const qualityScore = Math.min(Math.max(qualityBase - qualityPenalty + qualityBonus, 0), 100);

        profiles.push({
          userId: uid,
          userName,
          totalActions: userLogs.length,
          updates,
          creates,
          deletes,
          overrides,
          weeklyActions: weeklyLogs.length,
          monthlyActions: monthlyLogs.length,
          topSection,
          topEntityType,
          focusArea,
          totalFinancialImpact,
          profitImpact,
          riskScore,
          highImpactActions,
          qualityScore,
          alertsTriggered,
          correctionsCount,
        });
      }

      return profiles.sort((a, b) => b.totalActions - a.totalActions);
    },
    enabled: userId !== '',
  });
}
