import { useState } from 'react';
import { Pencil, Trash2, History, Check, X } from 'lucide-react';
import { useUpdateField, useDeleteRecord, type DBExpense } from '@/hooks/useProjects';
import { useFinancialEngine } from '@/hooks/useFinancialEngine';
import { useAuthContext } from '@/contexts/AuthContext';
import AuditLogDialog from './AuditLogDialog';
import { toast } from 'sonner';
import { formatCurrency } from '@/data/mockData';

interface ExpenseRowProps {
  expense: DBExpense;
}

export default function ExpenseRow({ expense }: ExpenseRowProps) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(String(expense.amount));
  const [reason, setReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const updateField = useUpdateField();
  const deleteRecord = useDeleteRecord();
  const { recalculateProject } = useFinancialEngine();
  const { isCEO } = useAuthContext();

  const handleSave = () => {
    const updates: Promise<void>[] = [];
    if (category !== expense.category) {
      updates.push(
        new Promise((res, rej) =>
          updateField.mutate(
            { table: 'project_expenses', id: expense.id, field: 'category', value: category, oldValue: expense.category, reason },
            { onSuccess: () => res(), onError: rej }
          )
        )
      );
    }
    if (Number(amount) !== expense.amount) {
      updates.push(
        new Promise((res, rej) =>
          updateField.mutate(
            { table: 'project_expenses', id: expense.id, field: 'amount', value: Number(amount), oldValue: expense.amount, reason },
            { onSuccess: () => res(), onError: rej }
          )
        )
      );
    }
    Promise.all(updates).then(async () => {
      toast.success('تم تحديث المصروف');
      setEditing(false);
      setReason('');
      await recalculateProject(expense.project_id);
    });
  };

  const handleDelete = () => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    deleteRecord.mutate(
      { table: 'project_expenses', id: expense.id },
      { onSuccess: async () => {
        toast.success('تم حذف المصروف');
        await recalculateProject(expense.project_id);
      }}
    );
  };

  return (
    <>
      <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 group transition-colors">
        {editing ? (
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 bg-background border border-primary/30 rounded px-2 py-1 text-sm text-foreground"
                placeholder="التصنيف"
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32 bg-background border border-primary/30 rounded px-2 py-1 text-sm text-foreground"
                placeholder="المبلغ"
              />
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="سبب التعديل (اختياري)"
              className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground"
            />
            <div className="flex gap-1">
              <button onClick={handleSave} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-success/20 text-success rounded hover:bg-success/30">
                <Check className="w-3 h-3" /> حفظ
              </button>
              <button onClick={() => { setEditing(false); setCategory(expense.category); setAmount(String(expense.amount)); }} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded hover:bg-destructive/30">
                <X className="w-3 h-3" /> إلغاء
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="text-sm text-foreground">{expense.category}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{formatCurrency(expense.amount)}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-primary/10 text-primary" title="تعديل">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => setShowHistory(true)} className="p-1 rounded hover:bg-accent/10 text-accent" title="السجل">
                  <History className="w-3 h-3" />
                </button>
                <button onClick={handleDelete} className="p-1 rounded hover:bg-destructive/10 text-destructive" title="حذف">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AuditLogDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        tableName="project_expenses"
        recordId={expense.id}
        title={expense.category}
      />
    </>
  );
}
