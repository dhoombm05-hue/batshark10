import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Financial Recalculation Engine — Journal-Based
 * 
 * ARCHITECTURE: All financial values are derived from journal_lines.
 * This engine syncs computed values back to the projects table
 * for backward compatibility, but the SOURCE OF TRUTH is always
 * the journal entries.
 * 
 * Override columns are still respected — if a manual override exists,
 * it takes priority over journal-computed values.
 */
export function useFinancialEngine() {
  const queryClient = useQueryClient();

  const recalculateProject = async (projectId: string) => {
    try {
      // Fetch project for override values
      const { data: projectData } = await supabase
        .from('projects' as any)
        .select('*')
        .eq('id', projectId)
        .single();
      const project = projectData as any;
      if (!project) throw new Error('Project not found');

      // Fetch all journal entries for this project
      const { data: entries } = await supabase
        .from('journal_entries' as any)
        .select('id, entry_date')
        .eq('project_id', projectId);
      const entryIds = ((entries || []) as any[]).map((e: any) => e.id);

      let computedRevenue = 0;
      let computedExpenses = 0;

      if (entryIds.length > 0) {
        // Fetch all journal lines for these entries
        const { data: lines } = await supabase
          .from('journal_lines' as any)
          .select('*')
          .in('journal_entry_id', entryIds);

        for (const line of (lines || []) as any[]) {
          const debit = Number(line.debit) || 0;
          const credit = Number(line.credit) || 0;

          if (line.account_type === 'revenue') {
            computedRevenue += (credit - debit);
          }
          if (line.account_type === 'expense') {
            computedExpenses += (debit - credit);
          }
        }
      }

      const computedProfit = computedRevenue - computedExpenses;

      // Growth rate: compare last 2 months of journal data
      let computedGrowth = 0;
      if (entryIds.length > 0) {
        const { data: lines } = await supabase
          .from('journal_lines' as any)
          .select('debit, credit, account_type, journal_entry_id')
          .in('journal_entry_id', entryIds)
          .eq('account_type', 'revenue');

        const entryDateMap = new Map<string, string>();
        for (const e of (entries || []) as any[]) {
          entryDateMap.set(e.id, e.entry_date);
        }

        const monthlyRevenue = new Map<number, number>();
        for (const line of (lines || []) as any[]) {
          const dateStr = entryDateMap.get(line.journal_entry_id);
          if (!dateStr) continue;
          const monthKey = new Date(dateStr).getMonth() + 1;
          const amount = (Number(line.credit) || 0) - (Number(line.debit) || 0);
          monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + amount);
        }

        const sortedMonths = Array.from(monthlyRevenue.entries()).sort((a, b) => a[0] - b[0]);
        if (sortedMonths.length >= 2) {
          const last = sortedMonths[sortedMonths.length - 1][1];
          const prev = sortedMonths[sortedMonths.length - 2][1];
          if (prev > 0) computedGrowth = Math.round(((last - prev) / prev) * 100 * 10) / 10;
        }
      }

      // Apply overrides
      const finalRevenue = project.override_total_revenue ?? computedRevenue;
      const finalExpenses = project.override_total_expenses ?? computedExpenses;
      const finalProfit = project.override_net_profit ?? computedProfit;
      const finalGrowth = project.override_growth_rate ?? computedGrowth;
      const status = finalProfit > 0 ? 'profitable' : finalProfit < 0 ? 'loss' : 'breakeven';

      // Sync back to projects table
      const updatePayload: Record<string, any> = { status };
      if (project.override_total_revenue == null) updatePayload.total_revenue = Math.round(computedRevenue);
      if (project.override_total_expenses == null) updatePayload.total_expenses = Math.round(computedExpenses);
      if (project.override_net_profit == null) updatePayload.net_profit = Math.round(computedProfit);
      if (project.override_growth_rate == null) updatePayload.growth_rate = computedGrowth;

      const { error } = await supabase
        .from('projects' as any)
        .update(updatePayload as any)
        .eq('id', projectId);
      if (error) throw error;

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['journal-derived-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['company-metrics'] });

      return { totalRevenue: finalRevenue, totalExpenses: finalExpenses, netProfit: finalProfit, growthRate: finalGrowth, status };
    } catch (err) {
      console.error('Recalculation failed:', err);
      throw err;
    }
  };

  const recalculateAll = async () => {
    const { data } = await supabase
      .from('projects' as any)
      .select('id');
    const projects = (data || []) as unknown as { id: string }[];

    for (const p of projects) {
      await recalculateProject(p.id);
    }

    queryClient.invalidateQueries();
    toast.success('تمت إعادة احتساب جميع البيانات من القيود المحاسبية');
  };

  const setOverride = async (projectId: string, field: string, value: number) => {
    const overrideField = `override_${field}`;
    const { error } = await supabase
      .from('projects' as any)
      .update({ [field]: value, [overrideField]: value } as any)
      .eq('id', projectId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['project'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['journal-derived-metrics'] });
  };

  const clearOverride = async (projectId: string, field: string) => {
    const overrideField = `override_${field}`;
    const { error } = await supabase
      .from('projects' as any)
      .update({ [overrideField]: null } as any)
      .eq('id', projectId);
    if (error) throw error;
    await recalculateProject(projectId);
  };

  return { recalculateProject, recalculateAll, setOverride, clearOverride };
}

/**
 * @deprecated Use useJournalDerivedMetrics from useJournalMetrics.ts instead.
 * Kept for backward compatibility only.
 */
export function computeCompanyMetrics(projects: any[]) {
  const totalRevenue = projects.reduce((s, p) => s + Number(p.total_revenue), 0);
  const totalExpenses = projects.reduce((s, p) => s + Number(p.total_expenses), 0);
  const netProfit = totalRevenue - totalExpenses;
  const avgGrowth = projects.length > 0
    ? projects.reduce((s, p) => s + Number(p.growth_rate), 0) / projects.length
    : 0;
  const roi = totalExpenses > 0 ? Math.round((netProfit / totalExpenses) * 100 * 10) / 10 : 0;
  const grossMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100 * 10) / 10 : 0;
  const liquidityRatio = totalExpenses > 0 ? Math.round((totalRevenue / totalExpenses) * 10) / 10 : 0;
  const profitFactor = Math.min(Math.max(netProfit > 0 ? 30 : netProfit === 0 ? 15 : 0, 0), 30);
  const growthFactor = Math.min(Math.max(avgGrowth > 0 ? 20 : 10, 0), 20);
  const marginFactor = Math.min(Math.max(grossMargin * 0.5, 0), 25);
  const projectHealth = projects.filter(p => p.status === 'profitable').length / Math.max(projects.length, 1) * 25;
  const healthScore = Math.round(profitFactor + growthFactor + marginFactor + projectHealth);
  const ebitda = netProfit > 0 ? Math.round(netProfit * 1.4) : netProfit;
  const burnRate = Math.round(totalExpenses / 12);
  const runway = burnRate > 0 ? Math.round((totalRevenue - totalExpenses + totalRevenue * 0.5) / burnRate) : 0;

  return {
    totalRevenue, totalExpenses, netProfit,
    monthlyGrowth: Math.round(avgGrowth * 10) / 10,
    healthScore: Math.min(healthScore, 100),
    roi, ebitda, burnRate, runway: Math.max(runway, 0),
    liquidityRatio, grossMargin,
    operatingMargin: Math.round(grossMargin * 0.36 * 10) / 10,
    debtToEquity: 0.35,
    costEfficiencyIndex: totalRevenue > 0 ? Math.round((1 - totalExpenses / totalRevenue) * 100) / 100 + 0.5 : 0,
    performanceIndex: Math.round(healthScore * 0.85 + avgGrowth * 0.5),
  };
}
