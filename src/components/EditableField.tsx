import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X, History, RotateCcw, Lock, Unlock } from 'lucide-react';
import { useUpdateField } from '@/hooks/useProjects';
import { useFinancialEngine } from '@/hooks/useFinancialEngine';
import { logActivityImpact } from '@/hooks/useActivityImpact';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EditableFieldProps {
  table: string;
  recordId: string;
  field: string;
  value: any;
  label?: string;
  type?: 'text' | 'number';
  formatter?: (v: any) => string;
  onHistoryClick?: () => void;
  onRecalculate?: () => void;
  onAfterSave?: () => void;
  className?: string;
  valueClassName?: string;
  /** If this field has an override_* value in DB, pass true */
  isOverridden?: boolean;
  /** Project name for activity logging */
  entityName?: string;
  /** Section name for activity logging */
  section?: string;
}

const OVERRIDE_FIELDS = ['total_revenue', 'total_expenses', 'net_profit', 'growth_rate'];

export default function EditableField({
  table,
  recordId,
  field,
  value,
  label,
  type = 'text',
  formatter,
  onHistoryClick,
  onRecalculate,
  onAfterSave,
  className = '',
  valueClassName = '',
  isOverridden = false,
  entityName,
  section,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const updateField = useUpdateField();
  const { setOverride, clearOverride } = useFinancialEngine();
  const { isCEO } = useAuthContext();

  const isOverridable = table === 'projects' && OVERRIDE_FIELDS.includes(field);
  const isFinancialField = type === 'number' && ['total_revenue', 'total_expenses', 'net_profit', 'growth_rate', 'amount', 'revenue', 'expenses', 'profit'].includes(field);

  const handleSave = () => {
    const newVal = type === 'number' ? Number(editValue) : editValue;
    if (newVal === value) {
      setEditing(false);
      return;
    }
    // Auto-save directly — no mandatory reason prompt
    confirmSave();
  };

  const confirmSave = async () => {
    const newVal = type === 'number' ? Number(editValue) : editValue;

    // If this is an overridable project field, use setOverride
    if (isOverridable && type === 'number') {
      try {
        await setOverride(recordId, field, Number(editValue));
        // Log the impact
        await logActivityImpact({
          actionType: 'override',
          entityType: table,
          entityId: recordId,
          entityName,
          section,
          fieldName: field,
          oldValue: value,
          newValue: newVal,
          isManualOverride: true,
          changeReason: reason || 'تعديل يدوي',
        });
        toast.success('تم الحفظ — تعديل يدوي محمي من إعادة الاحتساب');
        setEditing(false);
        setShowReason(false);
        setReason('');
        onAfterSave?.();
      } catch {
        toast.error('فشل الحفظ');
      }
      return;
    }

    // Standard update
    updateField.mutate(
      { table, id: recordId, field, value: newVal, oldValue: value, reason },
      {
        onSuccess: async () => {
          // Log impact
          await logActivityImpact({
            actionType: 'update',
            entityType: table,
            entityId: recordId,
            entityName,
            section,
            fieldName: field,
            oldValue: value,
            newValue: newVal,
            changeReason: reason,
          });
          toast.success('تم التحديث بنجاح');
          setEditing(false);
          setShowReason(false);
          setReason('');
          onAfterSave?.();
        },
        onError: () => toast.error('فشل التحديث'),
      }
    );
  };

  const handleClearOverride = async () => {
    if (!isOverridable) return;
    try {
      await clearOverride(recordId, field);
      toast.success('تم إعادة تفعيل الحساب التلقائي');
    } catch {
      toast.error('فشلت العملية');
    }
  };

  const displayValue = formatter ? formatter(value) : String(value ?? '');

  return (
    <div className={`group relative ${className}`}>
      {label && <span className="text-xs text-muted-foreground block mb-0.5">{label}</span>}

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-2"
          >
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-background border border-primary/30 rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />

            <div className="flex gap-1">
              <button onClick={handleSave} disabled={updateField.isPending} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-success/20 text-success rounded hover:bg-success/30 transition-colors disabled:opacity-50">
                <Check className="w-3 h-3" /> حفظ
              </button>
              <button onClick={() => { setEditing(false); setShowReason(false); setReason(''); }} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors">
                <X className="w-3 h-3" /> إلغاء
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="display" className="flex items-center gap-1">
            <span className={`text-sm ${valueClassName}`}>{displayValue}</span>
            {isOverridden && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-warning/15 text-warning border border-warning/20 flex items-center gap-0.5 print:hidden">
                <Lock className="w-2 h-2" /> يدوي
              </span>
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mr-1 print:hidden">
              <button
                onClick={() => { setEditValue(String(value ?? '')); setEditing(true); }}
                className="p-0.5 rounded hover:bg-primary/10 text-primary transition-colors"
                title="تعديل"
              >
                <Pencil className="w-3 h-3" />
              </button>
              {isOverridden && (
                <button
                  onClick={handleClearOverride}
                  className="p-0.5 rounded hover:bg-success/10 text-success transition-colors"
                  title="إعادة تفعيل الحساب التلقائي"
                >
                  <Unlock className="w-3 h-3" />
                </button>
              )}
              {onHistoryClick && (
                <button
                  onClick={onHistoryClick}
                  className="p-0.5 rounded hover:bg-accent/10 text-accent transition-colors"
                  title="سجل التعديلات"
                >
                  <History className="w-3 h-3" />
                </button>
              )}
              {onRecalculate && (
                <button
                  onClick={onRecalculate}
                  className="p-0.5 rounded hover:bg-warning/10 text-warning transition-colors"
                  title="إعادة احتساب"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
