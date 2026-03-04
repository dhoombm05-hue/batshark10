import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DBJournalEntry {
  id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  project_id: string | null;
  created_by: string;
  notes: string | null;
  is_balanced: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBJournalLine {
  id: string;
  journal_entry_id: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  notes: string | null;
  created_at: string;
}

export interface DBAccount {
  id: string;
  code: string;
  name: string;
  account_type: string;
  parent_code: string | null;
  is_active: boolean;
  created_at: string;
}

export function useJournalEntries() {
  return useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries' as any)
        .select('*')
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return data as unknown as DBJournalEntry[];
    },
  });
}

export function useJournalLines(entryId: string) {
  return useQuery({
    queryKey: ['journal-lines', entryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_lines' as any)
        .select('*')
        .eq('journal_entry_id', entryId);
      if (error) throw error;
      return data as unknown as DBJournalLine[];
    },
    enabled: !!entryId,
  });
}

export function useAllJournalLines() {
  return useQuery({
    queryKey: ['all-journal-lines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_lines' as any)
        .select('*');
      if (error) throw error;
      return data as unknown as DBJournalLine[];
    },
  });
}

export function useChartOfAccounts() {
  return useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts' as any)
        .select('*')
        .eq('is_active', true)
        .order('code');
      if (error) throw error;
      return data as unknown as DBAccount[];
    },
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entry,
      lines,
    }: {
      entry: { description: string; entry_date: string; project_id?: string; notes?: string; created_by?: string };
      lines: { account_name: string; account_type: string; debit: number; credit: number; notes?: string }[];
    }) => {
      // Validate balance
      const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

      // Insert entry
      const { data: entryData, error: entryError } = await supabase
        .from('journal_entries' as any)
        .insert({
          description: entry.description,
          entry_date: entry.entry_date,
          project_id: entry.project_id || null,
          notes: entry.notes || null,
          created_by: entry.created_by || 'admin',
          is_balanced: isBalanced,
        } as any)
        .select()
        .single();
      if (entryError) throw entryError;

      const insertedEntry = entryData as unknown as DBJournalEntry;

      // Insert lines
      const linesToInsert = lines.map(l => ({
        journal_entry_id: insertedEntry.id,
        account_name: l.account_name,
        account_type: l.account_type,
        debit: l.debit,
        credit: l.credit,
        notes: l.notes || null,
      }));

      const { error: linesError } = await supabase
        .from('journal_lines' as any)
        .insert(linesToInsert as any);
      if (linesError) throw linesError;

      // Audit log
      await supabase.from('audit_logs' as any).insert({
        table_name: 'journal_entries',
        record_id: insertedEntry.id,
        field_name: '_created',
        old_value: null,
        new_value: entry.description,
        changed_by: entry.created_by || 'admin',
      } as any);

      return insertedEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['all-journal-lines'] });
      queryClient.invalidateQueries({ queryKey: ['journal-derived-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      toast.success('تم حفظ القيد المحاسبي — تم تحديث جميع البيانات المالية');
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('journal_entries' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['all-journal-lines'] });
      queryClient.invalidateQueries({ queryKey: ['journal-derived-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('تم حذف القيد — تم تحديث البيانات المالية');
    },
  });
}

/**
 * Compute financial statements from journal lines
 */
export function computeFinancialStatements(lines: DBJournalLine[]) {
  const byType: Record<string, { debit: number; credit: number }> = {};
  const byAccount: Record<string, { debit: number; credit: number; type: string }> = {};

  for (const l of lines) {
    if (!byType[l.account_type]) byType[l.account_type] = { debit: 0, credit: 0 };
    byType[l.account_type].debit += Number(l.debit);
    byType[l.account_type].credit += Number(l.credit);

    if (!byAccount[l.account_name]) byAccount[l.account_name] = { debit: 0, credit: 0, type: l.account_type };
    byAccount[l.account_name].debit += Number(l.debit);
    byAccount[l.account_name].credit += Number(l.credit);
  }

  // Income Statement
  const totalRevenue = (byType['revenue']?.credit || 0) - (byType['revenue']?.debit || 0);
  const totalExpenses = (byType['expense']?.debit || 0) - (byType['expense']?.credit || 0);
  const netIncome = totalRevenue - totalExpenses;

  // Balance Sheet
  const totalAssets = (byType['asset']?.debit || 0) - (byType['asset']?.credit || 0);
  const totalLiabilities = (byType['liability']?.credit || 0) - (byType['liability']?.debit || 0);
  const totalEquity = (byType['equity']?.credit || 0) - (byType['equity']?.debit || 0);

  return {
    incomeStatement: { totalRevenue, totalExpenses, netIncome },
    balanceSheet: { totalAssets, totalLiabilities, totalEquity },
    byAccount: Object.entries(byAccount).map(([name, vals]) => ({
      name,
      type: vals.type,
      balance: vals.type === 'asset' || vals.type === 'expense'
        ? vals.debit - vals.credit
        : vals.credit - vals.debit,
    })),
  };
}
