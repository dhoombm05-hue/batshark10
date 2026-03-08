import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DataImport {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string | null;
  row_count: number;
  column_count: number;
  status: string;
  target_table: string | null;
  project_id: string | null;
  import_config: any;
  error_log: any[];
  cleaning_report: any;
  imported_by: string;
  imported_by_name: string;
  created_at: string;
  completed_at: string | null;
}

export function useDataImports() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuthContext();

  const { data: imports = [], isLoading } = useQuery({
    queryKey: ['data-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_imports' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DataImport[];
    },
  });

  const createImport = useMutation({
    mutationFn: async (imp: Partial<DataImport>) => {
      const { data, error } = await supabase.from('data_imports' as any).insert({
        ...imp,
        imported_by: user?.id,
        imported_by_name: profile?.display_name || '',
      } as any).select().single();
      if (error) throw error;
      return data as unknown as DataImport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-imports'] });
    },
    onError: () => toast.error('فشل تسجيل عملية الاستيراد'),
  });

  const updateImport = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DataImport> & { id: string }) => {
      const { error } = await supabase.from('data_imports' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-imports'] });
    },
  });

  return { imports, isLoading, createImport, updateImport };
}
