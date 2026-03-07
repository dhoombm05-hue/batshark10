import { useState } from 'react';
import { Pencil, Check, X, Lock, Unlock } from 'lucide-react';
import { useUpdateField } from '@/hooks/useProjects';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ManualOverrideFieldProps {
  label: string;
  computedValue: number | string;
  table: string;
  recordId: string;
  field: string;
  currentDbValue: any;
  formatter?: (v: any) => string;
  valueClassName?: string;
  isManuallyOverridden?: boolean;
}

/**
 * A field that shows a computed value by default but allows manual override.
 * When overridden, shows a "manually modified" marker and saves to DB.
 * Can be toggled back to auto-calculation.
 */
export default function ManualOverrideField({
  label,
  computedValue,
  table,
  recordId,
  field,
  currentDbValue,
  formatter,
  valueClassName = '',
  isManuallyOverridden = false,
}: ManualOverrideFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [reason, setReason] = useState('');
  const updateField = useUpdateField();
  const { isCEO } = useAuthContext();

  const displayValue = formatter ? formatter(currentDbValue ?? computedValue) : String(currentDbValue ?? computedValue);

  const handleEdit = () => {
    setEditValue(String(currentDbValue ?? computedValue ?? ''));
    setEditing(true);
  };

  const handleSave = () => {
    const newVal = Number(editValue);
    if (isNaN(newVal)) {
      toast.error('القيمة يجب أن تكون رقم');
      return;
    }
    updateField.mutate(
      { table, id: recordId, field, value: newVal, oldValue: currentDbValue, reason: reason || 'تعديل يدوي' },
      {
        onSuccess: () => {
          toast.success('تم الحفظ — تعديل يدوي');
          setEditing(false);
          setReason('');
        },
        onError: () => toast.error('فشل الحفظ'),
      }
    );
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        {isManuallyOverridden && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/20 flex items-center gap-0.5">
            <Lock className="w-2.5 h-2.5" /> يدوي
          </span>
        )}
      </div>
      {editing ? (
        <div className="space-y-1.5">
          <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
            className="w-full bg-background border border-primary/30 rounded px-2 py-1 text-sm text-foreground" autoFocus />
          <input type="text" value={reason} onChange={e => setReason(e.target.value)}
            placeholder="سبب التعديل اليدوي..."
            className="w-full bg-background border border-border rounded px-2 py-1 text-[10px] text-foreground" />
          <div className="flex gap-1">
            <button onClick={handleSave} disabled={updateField.isPending}
              className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] bg-success/20 text-success rounded">
              <Check className="w-3 h-3" /> حفظ
            </button>
            <button onClick={() => setEditing(false)}
              className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] bg-destructive/20 text-destructive rounded">
              <X className="w-3 h-3" /> إلغاء
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <span className={`text-sm font-heading font-bold ${valueClassName}`}>{displayValue}</span>
          <button onClick={handleEdit}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-primary/10 text-primary transition-all print:hidden"
            title="تعديل يدوي">
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
