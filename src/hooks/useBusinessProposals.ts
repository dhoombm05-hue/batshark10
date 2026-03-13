import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BusinessProposal {
  id: string;
  title: string;
  business_type: string | null;
  sector: string | null;
  location: string | null;
  description: string | null;
  ai_research: any;
  ai_analysis: any;
  market_data: any;
  financial_plan: any;
  action_plan: any;
  competitors: any;
  licenses: any;
  risk_assessment: any;
  excel_data: any;
  feasibility_score: number;
  risk_score: number;
  recommendation: string | null;
  status: string;
  ceo_decision: string | null;
  ceo_notes: string | null;
  decided_at: string | null;
  auto_generated: boolean;
  generation_cycle: number;
  next_generation_at: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useBusinessProposals() {
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['business-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_proposals' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BusinessProposal[];
    },
  });

  const generateProposal = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: { mode: 'manual' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-proposals'] });
      toast.success('تم توليد اقتراح بزنس جديد بنجاح! 🚀');
    },
    onError: (e) => toast.error(`فشل التوليد: ${e.message}`),
  });

  const acceptProposal = useMutation({
    mutationFn: async (params: { proposalId: string; ceoNotes?: string }) => {
      const { data, error } = await supabase.functions.invoke('accept-proposal', {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['business-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(data?.message || 'تم قبول الاقتراح وإنشاء المشروع! ✅');
    },
    onError: (e) => toast.error(`فشل القبول: ${e.message}`),
  });

  const rejectProposal = useMutation({
    mutationFn: async (params: { proposalId: string; reason?: string }) => {
      const { error } = await supabase
        .from('business_proposals' as any)
        .update({
          status: 'rejected',
          ceo_decision: 'rejected',
          ceo_notes: params.reason || null,
          decided_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', params.proposalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-proposals'] });
      toast.success('تم رفض الاقتراح ❌');
    },
  });

  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('business_proposals' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-proposals'] });
      toast.success('تم حذف الاقتراح');
    },
  });

  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const acceptedProposals = proposals.filter(p => p.status === 'accepted');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');

  return {
    proposals, pendingProposals, acceptedProposals, rejectedProposals,
    isLoading, generateProposal, acceptProposal, rejectProposal, deleteProposal,
  };
}
