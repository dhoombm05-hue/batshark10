import { useAuditLogs } from '@/hooks/useProjects';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, ArrowLeft } from 'lucide-react';

interface AuditLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  recordId: string;
  title?: string;
}

const fieldLabels: Record<string, string> = {
  amount: 'المبلغ',
  category: 'التصنيف',
  revenue: 'الإيرادات',
  expenses: 'المصروفات',
  profit: 'الربح',
  total_expenses: 'إجمالي المصروفات',
  total_revenue: 'إجمالي الإيرادات',
  net_profit: 'صافي الربح',
  growth_rate: 'نسبة النمو',
  occupancy_rate: 'نسبة الإشغال',
  client_count: 'عدد العملاء',
  campaign_count: 'عدد الحملات',
  name: 'الاسم',
  description: 'الوصف',
  content: 'المحتوى',
  notes: 'ملاحظات',
  source: 'المصدر',
  _deleted: 'حذف السجل',
};

export default function AuditLogDialog({ open, onOpenChange, tableName, recordId, title }: AuditLogDialogProps) {
  const { data: logs, isLoading } = useAuditLogs(tableName, recordId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-heading">
            <History className="w-5 h-5 text-primary" />
            سجل التعديلات {title && `- ${title}`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</div>
          ) : !logs?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">لا توجد تعديلات مسجلة</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-muted/30 rounded-lg p-3 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-primary">
                      {fieldLabels[log.field_name] || log.field_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('ar-SA')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-destructive/80 line-through">{log.old_value || '-'}</span>
                    <ArrowLeft className="w-3 h-3 text-muted-foreground" />
                    <span className="text-success font-medium">{log.new_value || '-'}</span>
                  </div>
                  {log.change_reason && (
                    <p className="text-[10px] text-muted-foreground mt-1">السبب: {log.change_reason}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">بواسطة: {log.changed_by}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
