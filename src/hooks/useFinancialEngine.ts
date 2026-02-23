import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DBProject, DBMonthlyData, DBExpense } from './useProjects';

/**
 * Financial Recalculation Engine
 * CRITICAL: Respects override columns. If a field has an override_* value,
 * the recalculation will NOT overwrite it.
 */
export function useFinancialEngine() {
  const queryClient = useQueryClient();

  const recalculateProject = async (projectId: string) => {
    try {
      // Fetch the project first to check overrides
      const { data: projectData } = await supabase
        .from('projects' as any)
        .select('*')
        .eq('id', projectId)
        .single();
      const project = projectData as unknown as DBProject & {
        override_total_revenue: number | null;
        override_total_expenses: number | null;
        override_net_profit: number | null;
        override_growth_rate: number | null;
      };

      if (!project) throw new Error('Project not found');

      // Fetch monthly data
      const { data: monthly } = await supabase
        .from('project_monthly_data' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('month_order');
      const monthlyData = (monthly || []) as unknown as DBMonthlyData[];

      // Fetch expenses
      const { data: expData } = await supabase
        .from('project_expenses' as any)
        .select('*')
        .eq('project_id', projectId);
      const expenses = (expData || []) as unknown as DBExpense[];

      // Calculate totals (computed values)
      const computedRevenue = monthlyData.reduce((s, m) => s + Number(m.revenue), 0);
      const computedExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const computedProfit = computedRevenue - computedExpenses;

      // Growth rate from last 2 months
      let computedGrowth = 0;
      if (monthlyData.length >= 2) {
        const last = Number(monthlyData[monthlyData.length - 1].revenue);
        const prev = Number(monthlyData[monthlyData.length - 2].revenue);
        if (prev > 0) computedGrowth = Math.round(((last - prev) / prev) * 100 * 10) / 10;
      }

      // Use override if exists, otherwise use computed
      const finalRevenue = project.override_total_revenue ?? computedRevenue;
      const finalExpenses = project.override_total_expenses ?? computedExpenses;
      const finalProfit = project.override_net_profit ?? computedProfit;
      const finalGrowth = project.override_growth_rate ?? computedGrowth;

      // Status based on final values
      const status = finalProfit > 0 ? 'profitable' : finalProfit < 0 ? 'loss' : 'breakeven';

      // Only update non-overridden fields
      const updatePayload: Record<string, any> = { status };
      if (project.override_total_revenue == null) updatePayload.total_revenue = computedRevenue;
      if (project.override_total_expenses == null) updatePayload.total_expenses = computedExpenses;
      if (project.override_net_profit == null) updatePayload.net_profit = computedProfit;
      if (project.override_growth_rate == null) updatePayload.growth_rate = computedGrowth;

      const { error } = await supabase
        .from('projects' as any)
        .update(updatePayload as any)
        .eq('id', projectId);

      if (error) throw error;

      // Invalidate queries so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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
    toast.success('تمت إعادة احتساب جميع البيانات المالية');
  };

  /**
   * Set a manual override for a project field.
   * This saves the value in override_* column AND the main column.
   */
  const setOverride = async (projectId: string, field: string, value: number) => {
    const overrideField = `override_${field}`;
    const { error } = await supabase
      .from('projects' as any)
      .update({ [field]: value, [overrideField]: value } as any)
      .eq('id', projectId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['project'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  /**
   * Clear a manual override — restore auto-calculation for that field.
   */
  const clearOverride = async (projectId: string, field: string) => {
    const overrideField = `override_${field}`;
    const { error } = await supabase
      .from('projects' as any)
      .update({ [overrideField]: null } as any)
      .eq('id', projectId);
    if (error) throw error;
    // Recalculate to restore computed value
    await recalculateProject(projectId);
  };

  return { recalculateProject, recalculateAll, setOverride, clearOverride };
}

/**
 * Compute company-level aggregated metrics from all projects
 */
export function computeCompanyMetrics(projects: DBProject[]) {
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
    totalRevenue,
    totalExpenses,
    netProfit,
    monthlyGrowth: Math.round(avgGrowth * 10) / 10,
    healthScore: Math.min(healthScore, 100),
    roi,
    ebitda,
    burnRate,
    runway: Math.max(runway, 0),
    liquidityRatio,
    grossMargin,
    operatingMargin: Math.round(grossMargin * 0.36 * 10) / 10,
    debtToEquity: 0.35,
    costEfficiencyIndex: totalRevenue > 0 ? Math.round((1 - totalExpenses / totalRevenue) * 100) / 100 + 0.5 : 0,
    performanceIndex: Math.round(healthScore * 0.85 + avgGrowth * 0.5),
  };
}
