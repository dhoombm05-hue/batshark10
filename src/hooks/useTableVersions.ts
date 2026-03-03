import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TableVersion {
  id: string;
  table_id: string;
  version_number: number;
  data_snapshot: any;
  saved_by: string;
  saved_at: string;
  notes: string | null;
  profile_name?: string;
}

export function useTableVersions(tableId: string) {
  return useQuery({
    queryKey: ['table-versions', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_table_versions' as any)
        .select('*')
        .eq('table_id', tableId)
        .order('version_number', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profile names
      const userIds = [...new Set((data || []).map((v: any) => v.saved_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const nameMap = new Map((profiles || []).map(p => [p.user_id, p.display_name]));

      return (data || []).map((v: any) => ({
        ...v,
        profile_name: nameMap.get(v.saved_by) || 'مجهول',
      })) as TableVersion[];
    },
    enabled: !!tableId,
  });
}

export function useSaveTableVersion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { table_id: string; snapshot: any; notes?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('يجب تسجيل الدخول');

      // Get next version number
      const { data: latest } = await supabase
        .from('custom_table_versions' as any)
        .select('version_number')
        .eq('table_id', params.table_id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = ((latest as any)?.[0]?.version_number || 0) + 1;

      const { error } = await supabase
        .from('custom_table_versions' as any)
        .insert({
          table_id: params.table_id,
          version_number: nextVersion,
          data_snapshot: params.snapshot,
          saved_by: session.user.id,
          notes: params.notes || null,
        } as any);

      if (error) throw error;
      return nextVersion;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['table-versions', vars.table_id] });
    },
  });
}
