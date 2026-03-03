import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCurrentUserName, logActivity } from './useActivityLog';

export interface DBEmployee {
  id: string;
  slug: string;
  name: string;
  position: string;
  age: number;
  department: string;
  experience: string;
  salary: number;
  bonus: number;
  performance: number;
  kpi_achievement: number;
  profit_contribution: number;
  monthly_rating: number;
  achievements: string[];
  improvements: string[];
  feedback: string | null;
  projects: string[];
  admin_notes: string | null;
  video_url: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBEmployeeMonthlyPerformance {
  id: string;
  employee_id: string;
  month: string;
  month_order: number;
  score: number;
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees' as any)
        .select('*')
        .order('slug');
      if (error) throw error;
      return data as unknown as DBEmployee[];
    },
  });
}

export function useEmployee(slug: string) {
  return useQuery({
    queryKey: ['employee', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees' as any)
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data as unknown as DBEmployee;
    },
    enabled: !!slug,
  });
}

export function useEmployeeMonthlyPerformance(employeeId: string) {
  return useQuery({
    queryKey: ['employee-monthly-performance', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_monthly_performance' as any)
        .select('*')
        .eq('employee_id', employeeId)
        .order('month_order');
      if (error) throw error;
      return data as unknown as DBEmployeeMonthlyPerformance[];
    },
    enabled: !!employeeId,
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, field, value, oldValue, reason }: {
      id: string;
      field: string;
      value: any;
      oldValue?: any;
      reason?: string;
    }) => {
      const { error: updateError } = await supabase
        .from('employees' as any)
        .update({ [field]: value } as any)
        .eq('id', id);
      if (updateError) throw updateError;

      const { data: { session } } = await supabase.auth.getSession();
      const changedBy = await getCurrentUserName();

      const { error: auditError } = await supabase
        .from('audit_logs' as any)
        .insert({
          table_name: 'employees',
          record_id: id,
          field_name: field,
          old_value: String(oldValue ?? ''),
          new_value: String(value ?? ''),
          change_reason: reason || null,
          changed_by: changedBy,
        } as any);
      if (auditError) console.error('Audit log error:', auditError);

      if (session?.user) {
        await logActivity({
          userId: session.user.id,
          actionType: 'update',
          entityType: 'employees',
          entityId: id,
          details: { field, old_value: oldValue, new_value: value, reason: reason || null },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
    },
    onError: () => toast.error('فشل حفظ بيانات الموظف في قاعدة البيانات'),
  });
}

export function useUploadEmployeeAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, file }: { employeeId: string; file: File }) => {
      const ext = file.name.split('.').pop();
      const path = `employees/${employeeId}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('employees' as any)
        .update({ avatar_url: avatarUrl } as any)
        .eq('id', employeeId);
      if (updateError) throw updateError;

      return avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      toast.success('تم تحديث الصورة');
    },
    onError: () => toast.error('فشل رفع الصورة'),
  });
}
