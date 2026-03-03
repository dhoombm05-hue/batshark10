import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomTableColumn {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'percentage' | 'formula';
  width?: number;
}

export interface CustomTable {
  id: string;
  name: string;
  table_type: string;
  project_id: string | null;
  columns: CustomTableColumn[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CustomTableRow {
  id: string;
  table_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useCustomTables() {
  return useQuery({
    queryKey: ['custom-tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_tables' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        columns: typeof t.columns === 'string' ? JSON.parse(t.columns) : t.columns,
      })) as unknown as CustomTable[];
    },
  });
}

export function useCustomTableRows(tableId: string) {
  return useQuery({
    queryKey: ['custom-table-rows', tableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_table_rows' as any)
        .select('*')
        .eq('table_id', tableId)
        .order('created_at');
      if (error) throw error;
      return (data || []) as unknown as CustomTableRow[];
    },
    enabled: !!tableId,
  });
}

export function useCreateCustomTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; table_type: string; project_id?: string; columns: CustomTableColumn[] }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('custom_tables' as any)
        .insert({ ...params, created_by: session.user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-tables'] });
      toast.success('تم إنشاء الجدول');
    },
    onError: () => toast.error('فشل إنشاء الجدول'),
  });
}

export function useUpdateCustomTableColumns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; columns: CustomTableColumn[] }) => {
      const { error } = await supabase
        .from('custom_tables' as any)
        .update({ columns: params.columns } as any)
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-tables'] });
      toast.success('تم تحديث الأعمدة');
    },
    onError: () => toast.error('فشل تحديث الأعمدة'),
  });
}

export function useDeleteCustomTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_tables' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-tables'] });
      toast.success('تم حذف الجدول');
    },
  });
}

export function useAddCustomTableRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { table_id: string; data: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('custom_table_rows' as any)
        .insert(params as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['custom-table-rows', vars.table_id] });
      toast.success('تمت إضافة الصف');
    },
    onError: () => toast.error('فشل إضافة الصف'),
  });
}

export function useUpdateCustomTableRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; table_id: string; data: Record<string, any> }) => {
      const { error } = await supabase
        .from('custom_table_rows' as any)
        .update({ data: params.data } as any)
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['custom-table-rows', vars.table_id] });
    },
    onError: () => toast.error('فشل حفظ البيانات'),
  });
}

export function useDeleteCustomTableRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; table_id: string }) => {
      const { error } = await supabase
        .from('custom_table_rows' as any)
        .delete()
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['custom-table-rows', vars.table_id] });
      toast.success('تم حذف الصف');
    },
    onError: () => toast.error('فشل حذف الصف'),
  });
}
