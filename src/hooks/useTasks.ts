import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_by: string;
  created_by_name: string;
  project_id: string | null;
  due_date: string | null;
  category: string;
  source_type: string | null;
  source_id: string | null;
  source_label: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useTasks(projectId?: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuthContext();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      let query = supabase.from('tasks' as any).select('*').order('sort_order').order('created_at', { ascending: false });
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Task[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { error } = await supabase.from('tasks' as any).insert({
        ...task,
        created_by: user?.id,
        created_by_name: profile?.display_name || '',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('تم إنشاء المهمة');
    },
    onError: () => toast.error('فشل إنشاء المهمة'),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { error } = await supabase.from('tasks' as any).update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => toast.error('فشل تحديث المهمة'),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('تم حذف المهمة');
    },
    onError: () => toast.error('فشل حذف المهمة'),
  });

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return { tasks, todoTasks, inProgressTasks, doneTasks, isLoading, createTask, updateTask, deleteTask };
}
