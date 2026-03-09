import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BusinessFeasibility {
  id: string;
  title: string;
  business_type: string | null;
  answers: any;
  ai_analysis: any;
  risk_score: number;
  feasibility_score: number;
  recommendation: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useBusinessFeasibilities() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const { data: feasibilities = [], isLoading } = useQuery({
    queryKey: ['business-feasibilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_feasibility' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BusinessFeasibility[];
    },
  });

  const createFeasibility = useMutation({
    mutationFn: async (params: { title: string; businessType: string; answers: any }) => {
      const { data, error } = await supabase
        .from('business_feasibility' as any)
        .insert({
          title: params.title,
          business_type: params.businessType,
          answers: params.answers,
          created_by: user?.id,
          status: 'analyzing',
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BusinessFeasibility;
    },
  });

  const analyzeBusiness = useMutation({
    mutationFn: async (params: { feasibilityId: string; answers: any }) => {
      const { data, error } = await supabase.functions.invoke('analyze-business', {
        body: { feasibilityId: params.feasibilityId, answers: params.answers },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-feasibilities'] });
      toast.success('تم تحليل جدوى البزنس بنجاح');
    },
    onError: (e) => toast.error(`فشل التحليل: ${e.message}`),
  });

  const deleteFeasibility = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('business_feasibility' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-feasibilities'] });
      toast.success('تم حذف التحليل');
    },
  });

  return { feasibilities, isLoading, createFeasibility, analyzeBusiness, deleteFeasibility };
}
