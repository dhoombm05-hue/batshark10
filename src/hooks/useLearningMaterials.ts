import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useLearningMaterials() {
  return useQuery({
    queryKey: ['learning-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_materials' as any)
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useAllLearningMaterials() {
  return useQuery({
    queryKey: ['all-learning-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_materials' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useAddLearningMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (material: { title: string; content: string; category: string; image_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('learning_materials' as any)
        .insert({ ...material, created_by: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning-materials'] });
      qc.invalidateQueries({ queryKey: ['all-learning-materials'] });
      toast.success('تم إضافة المادة التعليمية');
    },
    onError: () => toast.error('فشل إضافة المادة'),
  });
}

export function useUpdateLearningMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: string; category?: string; image_url?: string; is_published?: boolean }) => {
      const { error } = await supabase
        .from('learning_materials' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning-materials'] });
      qc.invalidateQueries({ queryKey: ['all-learning-materials'] });
      toast.success('تم التحديث');
    },
    onError: () => toast.error('فشل التحديث'),
  });
}

export function useDeleteLearningMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('learning_materials' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['learning-materials'] });
      qc.invalidateQueries({ queryKey: ['all-learning-materials'] });
      toast.success('تم الحذف');
    },
    onError: () => toast.error('فشل الحذف'),
  });
}
