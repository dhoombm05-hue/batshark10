import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X, History, RotateCcw } from 'lucide-react';
import { useUpdateField } from '@/hooks/useProjects';
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
}

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
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const updateField = useUpdateField();

  const handleSave = () => {
    const newVal = type === 'number' ? Number(editValue) : editValue;
    if (newVal === value) {
      setEditing(false);
      return;
    }
    setShowReason(true);
  };

  const confirmSave = () => {
    const newVal = type === 'number' ? Number(editValue) : editValue;
    updateField.mutate(
      { table, id: recordId, field, value: newVal, oldValue: value, reason },
      {
        onSuccess: () => {
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

            {showReason && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                <input
                  type="text"
                  placeholder="سبب التعديل (اختياري)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={confirmSave}
                    disabled={updateField.isPending}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs bg-success/20 text-success rounded hover:bg-success/30 transition-colors"
                  >
                    <Check className="w-3 h-3" /> حفظ
                  </button>
                  <button
                    onClick={() => { setEditing(false); setShowReason(false); setReason(''); }}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors"
                  >
                    <X className="w-3 h-3" /> إلغاء
                  </button>
                </div>
              </motion.div>
            )}

            {!showReason && (
              <div className="flex gap-1">
                <button onClick={handleSave} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-success/20 text-success rounded hover:bg-success/30 transition-colors">
                  <Check className="w-3 h-3" /> تأكيد
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors">
                  <X className="w-3 h-3" /> إلغاء
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="display" className="flex items-center gap-1">
            <span className={`text-sm ${valueClassName}`}>{displayValue}</span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mr-1">
              <button
                onClick={() => { setEditValue(String(value ?? '')); setEditing(true); }}
                className="p-0.5 rounded hover:bg-primary/10 text-primary transition-colors"
                title="تعديل"
              >
                <Pencil className="w-3 h-3" />
              </button>
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
