import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Employee Auto-Calculation Engine
 * 
 * Computes employee metrics from REAL data sources:
 * - Performance = weighted avg from evaluations + activity scoring
 * - KPI Achievement = tasks completed / tasks assigned ratio
 * - Profit Contribution = financial impact from activity_impact_log
 * - Monthly Rating = latest evaluation overall_score
 * - Bonus = calculated from performance tiers
 */

interface EmployeeComputedMetrics {
  performance: number;
  kpi_achievement: number;
  profit_contribution: number;
  monthly_rating: number;
  bonus: number;
}

async function computeEmployeeMetrics(employeeId: string, employeeSlug: string, employeeName: string): Promise<EmployeeComputedMetrics> {
  // 1. Fetch evaluations for this employee
  const { data: evaluations } = await supabase
    .from('employee_evaluations')
    .select('*')
    .eq('employee_id', employeeSlug)
    .order('created_at', { ascending: false });

  // 2. Fetch tasks assigned to this employee (by name match)
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('status, assigned_to_name');

  const assignedTasks = (allTasks || []).filter((t: any) => 
    t.assigned_to_name && (
      t.assigned_to_name === employeeName ||
      employeeName.includes(t.assigned_to_name) ||
      t.assigned_to_name.includes(employeeName)
    )
  );

  // 3. Fetch activity impact for financial contribution
  const { data: activityImpact } = await supabase
    .from('activity_impact_log')
    .select('impact_on_net_profit, numeric_difference, action_type')
    .or(`entity_name.eq.${employeeName},user_name.eq.${employeeName}`);

  // 4. Fetch performance scoring data (user_activity)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name');
  
  const matchedProfile = (profiles || []).find((p: any) => 
    p.display_name === employeeName ||
    employeeName.includes(p.display_name) ||
    p.display_name.includes(employeeName)
  );

  let activityScore = 0;
  if (matchedProfile) {
    const { data: activities } = await supabase
      .from('user_activity')
      .select('action_type, entity_type, created_at')
      .eq('user_id', matchedProfile.user_id);

    const acts = activities || [];
    const creates = acts.filter((a: any) => a.action_type === 'create').length;
    const updates = acts.filter((a: any) => a.action_type === 'update').length;
    const activeDays = new Set(acts.map((a: any) => new Date(a.created_at).toDateString())).size;
    const entityTypes = new Set(acts.map((a: any) => a.entity_type).filter(Boolean)).size;

    // Activity-based score component (0-40)
    activityScore = Math.min(40,
      Math.min(creates * 2, 10) +
      Math.min(updates, 15) +
      Math.min(activeDays * 1.5, 10) +
      Math.min(entityTypes * 2, 5)
    );
  }

  // Also factor in quiz scores
  let quizScore = 0;
  if (matchedProfile) {
    const { data: attempts } = await supabase
      .from('quiz_attempts' as any)
      .select('score, status')
      .eq('user_id', matchedProfile.user_id)
      .eq('status', 'submitted');
    
    const submittedAttempts = (attempts || []) as any[];
    if (submittedAttempts.length > 0) {
      const avgScore = submittedAttempts.reduce((s: number, a: any) => s + (Number(a.score) || 0), 0) / submittedAttempts.length;
      // Quiz contributes up to 10 points bonus
      quizScore = Math.min(10, Math.round(avgScore / 10));
    }

  // ============================================
  // COMPUTE PERFORMANCE (0-100)
  // ============================================
  let evalScore = 0;
  const evals = (evaluations || []) as any[];
  
  if (evals.length > 0) {
    // Use latest 3 evaluations weighted (latest = highest weight)
    const latest = evals.slice(0, 3);
    const weights = [0.5, 0.3, 0.2];
    let totalWeight = 0;
    let weightedSum = 0;
    
    latest.forEach((ev: any, i: number) => {
      const w = weights[i] || 0.1;
      // overall_score is 0-10, convert to 0-60 range
      weightedSum += (ev.overall_score / 10) * 60 * w;
      totalWeight += w;
    });
    
    evalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  // Performance = evaluation component (60%) + activity component (40%)
  const performance = Math.round(Math.min(100, evalScore + activityScore + quizScore));

  // ============================================
  // COMPUTE KPI ACHIEVEMENT (0-100)
  // ============================================
  let kpiAchievement = 0;
  if (assignedTasks.length > 0) {
    const completed = assignedTasks.filter((t: any) => t.status === 'done').length;
    kpiAchievement = Math.round((completed / assignedTasks.length) * 100);
  } else if (evals.length > 0) {
    // Fallback: use goal_achievement from evaluations
    const latestEval = evals[0] as any;
    kpiAchievement = Math.round((latestEval.goal_achievement / 10) * 100);
  }

  // ============================================
  // COMPUTE PROFIT CONTRIBUTION (0-100)
  // ============================================
  const impacts = (activityImpact || []) as any[];
  let totalImpact = 0;
  for (const imp of impacts) {
    totalImpact += Math.abs(Number(imp.impact_on_net_profit) || 0) + Math.abs(Number(imp.numeric_difference) || 0);
  }
  
  // Scale: 0 = 0%, 100K+ = 100%
  const profitContribution = Math.min(100, Math.round((totalImpact / 100000) * 100));

  // ============================================
  // COMPUTE MONTHLY RATING (0-10)
  // ============================================
  let monthlyRating = 5; // default
  if (evals.length > 0) {
    monthlyRating = Number((evals[0] as any).overall_score) || 5;
  } else if (performance > 0) {
    monthlyRating = Math.round(performance / 10 * 10) / 10;
  }

  // ============================================
  // COMPUTE BONUS
  // ============================================
  const { data: empData } = await supabase
    .from('employees')
    .select('salary')
    .eq('id', employeeId)
    .single();
  
  const salary = Number((empData as any)?.salary) || 0;
  let bonusPercent = 0;
  if (performance >= 90) bonusPercent = 0.2;       // 20% bonus
  else if (performance >= 80) bonusPercent = 0.15;  // 15%
  else if (performance >= 70) bonusPercent = 0.1;   // 10%
  else if (performance >= 60) bonusPercent = 0.05;  // 5%
  
  const bonus = Math.round(salary * bonusPercent);

  return {
    performance,
    kpi_achievement: kpiAchievement,
    profit_contribution: profitContribution,
    monthly_rating: monthlyRating,
    bonus,
  };
}

export function useEmployeeEngine() {
  const queryClient = useQueryClient();

  const recalculateEmployee = useMutation({
    mutationFn: async ({ employeeId, employeeSlug, employeeName }: {
      employeeId: string;
      employeeSlug: string;
      employeeName: string;
    }) => {
      const metrics = await computeEmployeeMetrics(employeeId, employeeSlug, employeeName);
      
      const { error } = await supabase
        .from('employees' as any)
        .update(metrics as any)
        .eq('id', employeeId);

      if (error) throw error;
      return metrics;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
    },
  });

  const recalculateAll = useMutation({
    mutationFn: async () => {
      const { data: employees } = await supabase
        .from('employees' as any)
        .select('id, slug, name');

      const emps = (employees || []) as any[];
      const results: Record<string, EmployeeComputedMetrics> = {};

      for (const emp of emps) {
        const metrics = await computeEmployeeMetrics(emp.id, emp.slug, emp.name);
        
        const { error } = await supabase
          .from('employees' as any)
          .update(metrics as any)
          .eq('id', emp.id);

        if (error) console.error(`Failed to update ${emp.name}:`, error);
        results[emp.name] = metrics;
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      const count = Object.keys(results).length;
      toast.success(`تم إعادة احتساب بيانات ${count} موظف/ة تلقائياً من التقييمات والمهام والنشاط`);
    },
    onError: () => {
      toast.error('فشل في إعادة احتساب بيانات الموظفين');
    },
  });

  return { recalculateEmployee, recalculateAll };
}
