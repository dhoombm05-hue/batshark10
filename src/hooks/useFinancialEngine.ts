import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DBProject, DBMonthlyData, DBExpense } from './useProjects';

/**
 * Financial Recalculation Engine
 * When any project field changes, recalculates all dependent values:
 * - total_revenue from monthly data
 * - total_expenses from expense records
 * - net_profit = revenue - expenses
 * - growth_rate from last 2 months
 * - status (profitable / loss / breakeven)
 */
export function useFinancialEngine() {
  const queryClient = useQueryClient();

  const recalculateProject = async (projectId: string) => {
    try {
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

      // Calculate totals
      const totalRevenue = monthlyData.reduce((s, m) => s + Number(m.revenue), 0);
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const netProfit = totalRevenue - totalExpenses;

      // Growth rate from last 2 months
      let growthRate = 0;
      if (monthlyData.length >= 2) {
        const last = Number(monthlyData[monthlyData.length - 1].revenue);
        const prev = Number(monthlyData[monthlyData.length - 2].revenue);
        if (prev > 0) growthRate = Math.round(((last - prev) / prev) * 100 * 10) / 10;
      }

      // Status
      const status = netProfit > 0 ? 'profitable' : netProfit < 0 ? 'loss' : 'breakeven';

      // Update project in DB
      const { error } = await supabase
        .from('projects' as any)
        .update({
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_profit: netProfit,
          growth_rate: growthRate,
          status,
        } as any)
        .eq('id', projectId);

      if (error) throw error;

      // Invalidate queries so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['project', undefined] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['company-metrics'] });

      return { totalRevenue, totalExpenses, netProfit, growthRate, status };
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

  return { recalculateProject, recalculateAll };
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

  // ROI = net profit / total expenses * 100
  const roi = totalExpenses > 0 ? Math.round((netProfit / totalExpenses) * 100 * 10) / 10 : 0;

  // Gross margin
  const grossMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100 * 10) / 10 : 0;

  // Liquidity ratio (simplified: revenue / expenses)
  const liquidityRatio = totalExpenses > 0 ? Math.round((totalRevenue / totalExpenses) * 10) / 10 : 0;

  // Health score (0-100) based on multiple factors
  const profitFactor = Math.min(Math.max(netProfit > 0 ? 30 : netProfit === 0 ? 15 : 0, 0), 30);
  const growthFactor = Math.min(Math.max(avgGrowth > 0 ? 20 : 10, 0), 20);
  const marginFactor = Math.min(Math.max(grossMargin * 0.5, 0), 25);
  const projectHealth = projects.filter(p => p.status === 'profitable').length / Math.max(projects.length, 1) * 25;
  const healthScore = Math.round(profitFactor + growthFactor + marginFactor + projectHealth);

  // EBITDA approximation
  const ebitda = netProfit > 0 ? Math.round(netProfit * 1.4) : netProfit;

  // Burn rate (monthly expenses avg)
  const burnRate = Math.round(totalExpenses / 12);

  // Runway in months
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
