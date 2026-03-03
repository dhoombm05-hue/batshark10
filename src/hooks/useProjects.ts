import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserName, logActivity } from './useActivityLog';

export interface DBProject {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  description: string | null;
  total_expenses: number;
  total_revenue: number;
  net_profit: number;
  growth_rate: number;
  occupancy_rate: number | null;
  client_count: number;
  campaign_count: number;
  status: string;
  data_reliability_score: number;
  created_at: string;
  updated_at: string;
}

export interface DBMonthlyData {
  id: string;
  project_id: string;
  month: string;
  month_order: number;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface DBExpense {
  id: string;
  project_id: string;
  category: string;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBAuditLog {
  id: string;
  table_name: string;
  record_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  changed_by: string;
  created_at: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects' as any)
        .select('*')
        .order('name');
      if (error) throw error;
      return data as unknown as DBProject[];
    },
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects' as any)
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data as unknown as DBProject;
    },
    enabled: !!slug,
  });
}

export function useProjectMonthlyData(projectId: string) {
  return useQuery({
    queryKey: ['project-monthly', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_monthly_data' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('month_order');
      if (error) throw error;
      return data as unknown as DBMonthlyData[];
    },
    enabled: !!projectId,
  });
}

export function useProjectExpenses(projectId: string) {
  return useQuery({
    queryKey: ['project-expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_expenses' as any)
        .select('*')
        .eq('project_id', projectId);
      if (error) throw error;
      return data as unknown as DBExpense[];
    },
    enabled: !!projectId,
  });
}

export function useProjectAnalysis(projectId: string) {
  return useQuery({
    queryKey: ['project-analysis', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_analysis' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      if (error) throw error;
      return data as unknown as { id: string; content: string; sort_order: number }[];
    },
    enabled: !!projectId,
  });
}

export function useAuditLogs(tableName: string, recordId: string) {
  return useQuery({
    queryKey: ['audit-logs', tableName, recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs' as any)
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as DBAuditLog[];
    },
    enabled: !!recordId,
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      table,
      id,
      field,
      value,
      oldValue,
      reason,
    }: {
      table: string;
      id: string;
      field: string;
      value: any;
      oldValue: any;
      reason?: string;
    }) => {
      // Update the record in DB — exactly as the user entered, no modification
      const { error: updateError } = await supabase
        .from(table as any)
        .update({ [field]: value } as any)
        .eq('id', id);
      if (updateError) throw updateError;

      // Get current user for audit trail
      const { data: { session } } = await supabase.auth.getSession();
      const changedBy = await getCurrentUserName();

      // Log the audit with real user name
      const { error: auditError } = await supabase
        .from('audit_logs' as any)
        .insert({
          table_name: table,
          record_id: id,
          field_name: field,
          old_value: String(oldValue ?? ''),
          new_value: String(value ?? ''),
          change_reason: reason || null,
          changed_by: changedBy,
        } as any);
      if (auditError) console.error('Audit log error:', auditError);

      // Log to user_activity for performance tracking
      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          actionType: 'update',
          entityType: table,
          entityId: id,
          details: { field, old_value: oldValue, new_value: value, reason: reason || null },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      console.error('Update failed:', error);
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ table, id }: { table: string; id: string }) => {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id);
      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      const changedBy = await getCurrentUserName();

      // Log deletion with real user name
      await supabase
        .from('audit_logs' as any)
        .insert({
          table_name: table,
          record_id: id,
          field_name: '_deleted',
          old_value: 'existed',
          new_value: 'deleted',
          changed_by: changedBy,
        } as any);

      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          actionType: 'delete',
          entityType: table,
          entityId: id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useAddRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ table, data }: { table: string; data: any }) => {
      const { data: inserted, error } = await supabase
        .from(table as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      const changedBy = await getCurrentUserName();

      // Log addition with real user name
      await supabase
        .from('audit_logs' as any)
        .insert({
          table_name: table,
          record_id: (inserted as any)?.id ?? '',
          field_name: '_created',
          old_value: null,
          new_value: JSON.stringify(data),
          changed_by: changedBy,
        } as any);

      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          actionType: 'create',
          entityType: table,
          entityId: (inserted as any)?.id ?? '',
          details: data,
        });
      }

      return inserted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
