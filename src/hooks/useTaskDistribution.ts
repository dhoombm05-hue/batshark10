import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TaskDistribution {
  id: string;
  title: string;
  description: string | null;
  source_type: string;
  source_file_url: string | null;
  source_file_name: string | null;
  project_id: string | null;
  status: string;
  ai_analysis: any;
  employee_insights: any;
  total_tasks: number;
  assigned_tasks: number;
  completed_tasks: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskDistributionItem {
  id: string;
  distribution_id: string;
  title: string;
  description: string | null;
  priority: string;
  category: string | null;
  required_skills: string[];
  estimated_hours: number;
  assigned_to: string | null;
  assigned_to_name: string | null;
  assignment_reason: string | null;
  status: string;
  employee_development_notes: string | null;
  completion_score: number | null;
  feedback: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useTaskDistributions() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuthContext();

  const { data: distributions = [], isLoading } = useQuery({
    queryKey: ['task-distributions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_distributions' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TaskDistribution[];
    },
  });

  const createDistribution = useMutation({
    mutationFn: async (params: { title: string; description?: string; sourceType: string; sourceFileName?: string; sourceFileUrl?: string; projectId?: string }) => {
      const { data, error } = await supabase
        .from('task_distributions' as any)
        .insert({
          title: params.title,
          description: params.description || null,
          source_type: params.sourceType,
          source_file_name: params.sourceFileName || null,
          source_file_url: params.sourceFileUrl || null,
          project_id: params.projectId || null,
          created_by: user?.id,
          status: 'pending',
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as TaskDistribution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-distributions'] });
      toast.success('تم إنشاء جلسة التوزيع');
    },
    onError: () => toast.error('فشل إنشاء جلسة التوزيع'),
  });

  const analyzeAndDistribute = useMutation({
    mutationFn: async (params: { distributionId: string; content?: string; tasks?: any[] }) => {
      // Update status to analyzing
      await supabase.from('task_distributions' as any).update({ status: 'analyzing' } as any).eq('id', params.distributionId);

      const { data, error } = await supabase.functions.invoke('distribute-tasks', {
        body: {
          action: 'analyze',
          distributionId: params.distributionId,
          content: params.content,
          tasks: params.tasks,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-distributions'] });
      queryClient.invalidateQueries({ queryKey: ['task-distribution-items'] });
      toast.success('تم تحليل وتوزيع المهام بنجاح');
    },
    onError: (e) => toast.error(`فشل التحليل: ${e.message}`),
  });

  const approveDistribution = useMutation({
    mutationFn: async (distributionId: string) => {
      const { data, error } = await supabase.functions.invoke('distribute-tasks', {
        body: { action: 'approve', distributionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-distributions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('تم اعتماد التوزيع وإنشاء المهام');
    },
    onError: () => toast.error('فشل اعتماد التوزيع'),
  });

  const deleteDistribution = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_distributions' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-distributions'] });
      toast.success('تم حذف جلسة التوزيع');
    },
  });

  return { distributions, isLoading, createDistribution, analyzeAndDistribute, approveDistribution, deleteDistribution };
}

export function useTaskDistributionItems(distributionId?: string) {
  return useQuery({
    queryKey: ['task-distribution-items', distributionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_distribution_items' as any)
        .select('*')
        .eq('distribution_id', distributionId!)
        .order('priority', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as TaskDistributionItem[];
    },
    enabled: !!distributionId,
  });
}
