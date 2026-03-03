import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/hooks/useActivityLog';
export interface CustomTableColumn {
  id: string; // column_key (stable key used in formulas/UI)
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

type DBColumn = {
  id: string;
  table_id: string;
  column_key: string;
  column_name: string;
  column_type: CustomTableColumn['type'];
  width: number | null;
  position: number;
};

const normalizeCellValue = (value: any) => {
  if (value === null || value === undefined) return '';
  return value;
};

const getAuthenticatedUserId = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error('يجب تسجيل الدخول قبل الحفظ');
  }

  return session.user.id;
};

export function useCustomTables() {
  return useQuery({
    queryKey: ['custom-tables'],
    queryFn: async () => {
      const { data: tables, error: tablesError } = await supabase
        .from('custom_tables' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (tablesError) throw tablesError;
      if (!tables || tables.length === 0) return [] as CustomTable[];

      const tableIds = tables.map((t: any) => t.id);
      const { data: columns, error: columnsError } = await supabase
        .from('custom_table_columns' as any)
        .select('table_id, column_key, column_name, column_type, width, position')
        .in('table_id', tableIds)
        .order('position', { ascending: true });

      if (columnsError) throw columnsError;

      const columnsByTable = new Map<string, CustomTableColumn[]>();
      (columns || []).forEach((col: any) => {
        const list = columnsByTable.get(col.table_id) || [];
        list.push({
          id: col.column_key,
          label: col.column_name || '',
          type: (col.column_type || 'text') as CustomTableColumn['type'],
          width: col.width ?? undefined,
        });
        columnsByTable.set(col.table_id, list);
      });

      return tables.map((t: any) => ({
        ...t,
        columns: columnsByTable.get(t.id) || [],
      })) as unknown as CustomTable[];
    },
  });
}

export function useCustomTableRows(tableId: string) {
  return useQuery({
    queryKey: ['custom-table-rows', tableId],
    queryFn: async () => {
      const [{ data: rows, error: rowsError }, { data: columns, error: columnsError }] = await Promise.all([
        supabase
          .from('custom_table_rows' as any)
          .select('id, table_id, row_name, created_at, updated_at, position')
          .eq('table_id', tableId)
          .order('position', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('custom_table_columns' as any)
          .select('id, table_id, column_key, column_name, column_type, width, position')
          .eq('table_id', tableId)
          .order('position', { ascending: true }),
      ]);

      if (rowsError) throw rowsError;
      if (columnsError) throw columnsError;

      const columnList = ((columns as any[]) || []) as DBColumn[];
      const columnMap = new Map(columnList.map((c) => [c.id, c.column_key]));

      if (!rows || rows.length === 0 || columnList.length === 0) {
        return (rows || []).map((r: any) => ({
          id: r.id,
          table_id: r.table_id,
          data: { _row_name: r.row_name || '' },
          created_at: r.created_at,
          updated_at: r.updated_at,
        })) as CustomTableRow[];
      }

      const { data: cells, error: cellsError } = await supabase
        .from('custom_table_cells' as any)
        .select('row_id, column_id, cell_value')
        .eq('table_id', tableId);

      if (cellsError) throw cellsError;

      const dataByRow = new Map<string, Record<string, any>>();
      (rows || []).forEach((r: any) => {
        dataByRow.set(r.id, { _row_name: r.row_name || '' });
      });

      (cells || []).forEach((cell: any) => {
        const columnKey = columnMap.get(cell.column_id);
        if (!columnKey) return;
        const rowData = dataByRow.get(cell.row_id);
        if (!rowData) return;
        rowData[columnKey] = normalizeCellValue(cell.cell_value);
      });

      return (rows || []).map((r: any) => ({
        id: r.id,
        table_id: r.table_id,
        data: dataByRow.get(r.id) || { _row_name: r.row_name || '' },
        created_at: r.created_at,
        updated_at: r.updated_at,
      })) as CustomTableRow[];
    },
    enabled: !!tableId,
  });
}

export function useCreateCustomTable() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; table_type: string; project_id?: string; columns: CustomTableColumn[] }) => {
      const userId = await getAuthenticatedUserId();

      const { data: table, error: tableError } = await supabase
        .from('custom_tables' as any)
        .insert({
          name: params.name,
          table_type: params.table_type,
          project_id: params.project_id,
          created_by: userId,
          columns: [],
        } as any)
        .select()
        .single();

      if (tableError) throw tableError;

      const createdTable = table as any;
      const columnPayload = params.columns.map((col, index) => ({
        table_id: createdTable.id,
        column_key: col.id,
        column_name: col.label,
        column_type: col.type,
        width: col.width ?? null,
        position: index,
        updated_by: userId,
      }));

      const { error: columnsError } = await supabase.from('custom_table_columns' as any).insert(columnPayload as any);
      if (columnsError) throw columnsError;

      await logActivity({
        userId,
        actionType: 'custom_table_create',
        entityType: 'custom_table',
        entityId: createdTable.id,
        details: { name: params.name, table_type: params.table_type, columns_count: params.columns.length },
      });

      return table;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-tables'] });
      toast.success('تم إنشاء الجدول وحفظه في قاعدة البيانات');
    },
    onError: (error: any) => toast.error(error?.message || 'فشل إنشاء الجدول في قاعدة البيانات'),
  });
}

export function useUpdateCustomTableColumns() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; columns: CustomTableColumn[] }) => {
      const userId = await getAuthenticatedUserId();

      const { data: existingColumns, error: existingError } = await supabase
        .from('custom_table_columns' as any)
        .select('column_key')
        .eq('table_id', params.id);

      if (existingError) throw existingError;

      const nextKeys = new Set(params.columns.map((c) => c.id));
      const removedKeys = (existingColumns || [])
        .map((c: any) => c.column_key as string)
        .filter((key) => !nextKeys.has(key));

      const upsertPayload = params.columns.map((col, index) => ({
        table_id: params.id,
        column_key: col.id,
        column_name: col.label,
        column_type: col.type,
        width: col.width ?? null,
        position: index,
        updated_by: userId,
      }));

      const { error: upsertError } = await supabase
        .from('custom_table_columns' as any)
        .upsert(upsertPayload as any, { onConflict: 'table_id,column_key' });

      if (upsertError) throw upsertError;

      if (removedKeys.length > 0) {
        const { error: deleteColumnsError } = await supabase
          .from('custom_table_columns' as any)
          .delete()
          .eq('table_id', params.id)
          .in('column_key', removedKeys);

        if (deleteColumnsError) throw deleteColumnsError;
      }

      // Backward compatibility for legacy reads
      const { error: syncLegacyError } = await supabase
        .from('custom_tables' as any)
        .update({ columns: params.columns } as any)
        .eq('id', params.id);

      if (syncLegacyError) throw syncLegacyError;

      await logActivity({
        userId,
        actionType: 'custom_table_columns_update',
        entityType: 'custom_table',
        entityId: params.id,
        details: { columns_count: params.columns.length },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['custom-tables'] });
      qc.invalidateQueries({ queryKey: ['custom-table-rows', vars.id] });
      toast.success('تم حفظ الأعمدة في قاعدة البيانات');
    },
    onError: (error: any) => toast.error(error?.message || 'فشل تحديث الأعمدة'),
  });
}

export function useDeleteCustomTable() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getAuthenticatedUserId();
      const { error } = await supabase.from('custom_tables' as any).delete().eq('id', id);
      if (error) throw error;

      await logActivity({
        userId,
        actionType: 'custom_table_delete',
        entityType: 'custom_table',
        entityId: id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-tables'] });
      toast.success('تم حذف الجدول نهائياً');
    },
    onError: (error: any) => toast.error(error?.message || 'فشل حذف الجدول'),
  });
}

export function useAddCustomTableRow() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { table_id: string; data: Record<string, any> }) => {
      const userId = await getAuthenticatedUserId();

      const { data: columns, error: columnsError } = await supabase
        .from('custom_table_columns' as any)
        .select('id, column_key, column_type')
        .eq('table_id', params.table_id)
        .order('position', { ascending: true });

      if (columnsError) throw columnsError;

      const { data: insertedRow, error: rowError } = await supabase
        .from('custom_table_rows' as any)
        .insert({
          table_id: params.table_id,
          row_name: String(params.data._row_name || ''),
          updated_by: userId,
        } as any)
        .select('id, table_id, row_name, created_at, updated_at')
        .single();

      if (rowError) throw rowError;

      const createdRow = insertedRow as any;
      const cellPayload = ((columns as any[]) || []).map((column: any) => {
        const inputValue = params.data[column.column_key];
        const fallback = column.column_type === 'number' || column.column_type === 'percentage' ? 0 : '';
        return {
          table_id: params.table_id,
          row_id: createdRow.id,
          column_id: column.id,
          cell_value: inputValue ?? fallback,
          updated_by: userId,
        };
      });

      if (cellPayload.length > 0) {
        const { error: cellError } = await supabase.from('custom_table_cells' as any).insert(cellPayload as any);
        if (cellError) throw cellError;
      }

      await logActivity({
        userId,
        actionType: 'custom_table_row_add',
        entityType: 'custom_table_row',
        entityId: createdRow.id,
        details: { table_id: params.table_id },
      });

      return insertedRow;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['custom-table-rows', vars.table_id] });
      qc.invalidateQueries({ queryKey: ['custom-tables'] });
      toast.success('تمت إضافة الصف وحفظه');
    },
    onError: (error: any) => toast.error(error?.message || 'فشل إضافة الصف'),
  });
}

export function useUpdateCustomTableRow() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; table_id: string; data: Record<string, any> }) => {
      const userId = await getAuthenticatedUserId();

      const { data: columns, error: columnsError } = await supabase
        .from('custom_table_columns' as any)
        .select('id, column_key')
        .eq('table_id', params.table_id);

      if (columnsError) throw columnsError;

      const rowName = params.data._row_name;
      if (typeof rowName === 'string') {
        const { error: rowError } = await supabase
          .from('custom_table_rows' as any)
          .update({ row_name: rowName, updated_by: userId } as any)
          .eq('id', params.id);

        if (rowError) throw rowError;
      }

      const upsertCells = (columns || [])
        .filter((column: any) => Object.prototype.hasOwnProperty.call(params.data, column.column_key))
        .map((column: any) => ({
          table_id: params.table_id,
          row_id: params.id,
          column_id: column.id,
          cell_value: params.data[column.column_key],
          updated_by: userId,
        }));

      if (upsertCells.length > 0) {
        const { error: cellsError } = await supabase
          .from('custom_table_cells' as any)
          .upsert(upsertCells as any, { onConflict: 'row_id,column_id' });

        if (cellsError) throw cellsError;
      }
      await logActivity({
        userId,
        actionType: 'custom_table_row_update',
        entityType: 'custom_table_row',
        entityId: params.id,
        details: { table_id: params.table_id },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['custom-table-rows', vars.table_id] });
      qc.invalidateQueries({ queryKey: ['custom-tables'] });
      toast.success('تم حفظ التعديل في قاعدة البيانات');
    },
    onError: (error: any) => toast.error(error?.message || 'فشل حفظ التعديل'),
  });
}

export function useDeleteCustomTableRow() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; table_id: string }) => {
      const userId = await getAuthenticatedUserId();
      const { error } = await supabase.from('custom_table_rows' as any).delete().eq('id', params.id);
      if (error) throw error;

      await logActivity({
        userId,
        actionType: 'custom_table_row_delete',
        entityType: 'custom_table_row',
        entityId: params.id,
        details: { table_id: params.table_id },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['custom-table-rows', vars.table_id] });
      qc.invalidateQueries({ queryKey: ['custom-tables'] });
      toast.success('تم حذف الصف');
    },
    onError: (error: any) => toast.error(error?.message || 'فشل حذف الصف'),
  });
}
