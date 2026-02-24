import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Filter, User, Calendar, Tag, TrendingUp, TrendingDown, Eye, Pencil, Lock } from 'lucide-react';
import { useActivityImpactLogs, type ActivityImpactEntry } from '@/hooks/useActivityImpact';
import { formatCurrency } from '@/data/mockData';

interface ActivityFeedProps {
  /** Filter to specific project/entity */
  entityId?: string;
  /** Filter to specific section */
  section?: string;
  /** Max items to show initially */
  maxItems?: number;
}

const ACTION_LABELS: Record<string, { label: string; icon: typeof Pencil; color: string }> = {
  page_view: { label: 'فتح الصفحة', icon: Eye, color: 'text-primary' },
  update: { label: 'تعديل', icon: Pencil, color: 'text-warning' },
  override: { label: 'تعديل يدوي', icon: Lock, color: 'text-orange' },
  create: { label: 'إضافة', icon: TrendingUp, color: 'text-success' },
  delete: { label: 'حذف', icon: TrendingDown, color: 'text-destructive' },
};

const FIELD_LABELS: Record<string, string> = {
  total_revenue: 'الإيرادات',
  net_profit: 'صافي الربح',
  total_expenses: 'المصروفات',
  growth_rate: 'نسبة النمو',
  client_count: 'العملاء',
  campaign_count: 'الحملات',
  occupancy_rate: 'نسبة الإشغال',
  data_reliability_score: 'مؤشر الموثوقية',
  amount: 'المبلغ',
  category: 'التصنيف',
  name: 'الاسم',
  description: 'الوصف',
  content: 'المحتوى',
};

function getImpactClass(level: string) {
  if (level === 'critical') return 'bg-destructive/15 text-destructive border-destructive/25';
  if (level === 'high') return 'bg-orange/15 text-orange border-orange/25';
  if (level === 'medium') return 'bg-warning/15 text-warning border-warning/25';
  return 'bg-muted/30 text-muted-foreground border-border';
}

function getImpactLabel(level: string) {
  if (level === 'critical') return 'عالي جداً';
  if (level === 'high') return 'عالي';
  if (level === 'medium') return 'متوسط';
  return 'منخفض';
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

export default function ActivityFeed({ entityId, section, maxItems = 50 }: ActivityFeedProps) {
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterDay, setFilterDay] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: logs, isLoading } = useActivityImpactLogs({
    entityType: entityId ? undefined : undefined,
    section,
  });

  // Filter logs for this entity if provided
  const filteredLogs = useMemo(() => {
    let result = logs || [];
    if (entityId) result = result.filter(l => l.entity_id === entityId);
    if (filterUser) result = result.filter(l => l.user_name.includes(filterUser));
    if (filterType) result = result.filter(l => l.action_type === filterType);
    if (filterDay) {
      result = result.filter(l => {
        const logDate = new Date(l.created_at).toISOString().split('T')[0];
        return logDate === filterDay;
      });
    }
    return result.slice(0, maxItems);
  }, [logs, entityId, filterUser, filterType, filterDay, maxItems]);

  // Unique users for filter
  const uniqueUsers = useMemo(() => {
    const names = new Set((logs || []).map(l => l.user_name));
    return [...names];
  }, [logs]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const views = filteredLogs.filter(l => l.action_type === 'page_view').length;
    const edits = filteredLogs.filter(l => ['update', 'override'].includes(l.action_type)).length;
    const totalImpact = filteredLogs.reduce((s, l) => s + l.numeric_difference, 0);
    const highImpact = filteredLogs.filter(l => l.risk_level === 'high' || l.risk_level === 'critical').length;
    return { total, views, edits, totalImpact, highImpact };
  }, [filteredLogs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-[20px] border border-border p-5 shadow-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          📈 سجل نشاط الإحصائيات
        </h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-colors ${showFilters ? 'bg-primary/15 text-primary' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
        >
          <Filter className="w-3 h-3" /> فلترة
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'إجمالي', value: stats.total, color: 'text-primary' },
          { label: 'مشاهدات', value: stats.views, color: 'text-muted-foreground' },
          { label: 'تعديلات', value: stats.edits, color: 'text-warning' },
          { label: 'عالي التأثير', value: stats.highImpact, color: 'text-destructive' },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded-xl bg-secondary/30">
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
            <p className={`text-sm font-heading font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 bg-muted/20 rounded-xl border border-border">
              <div>
                <label className="text-[9px] text-muted-foreground mb-1 block flex items-center gap-1"><User className="w-2.5 h-2.5" /> الموظف</label>
                <select
                  value={filterUser}
                  onChange={e => setFilterUser(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground"
                >
                  <option value="">الكل</option>
                  {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground mb-1 block flex items-center gap-1"><Tag className="w-2.5 h-2.5" /> نوع العملية</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground"
                >
                  <option value="">الكل</option>
                  <option value="page_view">مشاهدة</option>
                  <option value="update">تعديل</option>
                  <option value="override">تعديل يدوي</option>
                  <option value="create">إضافة</option>
                  <option value="delete">حذف</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground mb-1 block flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> التاريخ</label>
                <input
                  type="date"
                  value={filterDay}
                  onChange={e => setFilterDay(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterUser(''); setFilterType(''); setFilterDay(''); }}
                  className="w-full px-2 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors"
                >
                  مسح الفلاتر
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">لا يوجد نشاط مسجل بعد</p>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
          {filteredLogs.map((log, i) => {
            const action = ACTION_LABELS[log.action_type] || ACTION_LABELS.update;
            const ActionIcon = action.icon;
            const fieldLabel = log.field_name ? (FIELD_LABELS[log.field_name] || log.field_name) : '';

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors group"
              >
                {/* Icon */}
                <div className={`p-1.5 rounded-lg bg-secondary/50 ${action.color} shrink-0 mt-0.5`}>
                  <ActionIcon className="w-3 h-3" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">{log.user_name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${action.color} bg-secondary/40`}>
                      {action.label}
                    </span>
                    {log.is_manual_override && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-warning/15 text-warning border border-warning/20 flex items-center gap-0.5">
                        <Lock className="w-2 h-2" /> يدوي
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {log.action_type === 'page_view' ? (
                    <p className="text-[11px] text-muted-foreground">
                      فتح صفحة إحصائيات {log.entity_name || log.section || ''}
                    </p>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">
                      {fieldLabel && <span>عدّل <span className="text-foreground font-medium">{fieldLabel}</span></span>}
                      {log.old_value && log.new_value && (
                        <span className="mx-1">
                          من <span className="text-destructive/80">{isNaN(Number(log.old_value)) ? log.old_value : formatCurrency(Number(log.old_value))}</span>
                          {' '}إلى <span className="text-success">{isNaN(Number(log.new_value)) ? log.new_value : formatCurrency(Number(log.new_value))}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Impact */}
                  {log.numeric_difference !== 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getImpactClass(log.risk_level)}`}>
                        تأثير {getImpactLabel(log.risk_level)}
                      </span>
                      <span className={`text-[10px] font-bold ${log.numeric_difference > 0 ? 'text-success' : 'text-destructive'}`}>
                        {log.numeric_difference > 0 ? '+' : ''}{formatCurrency(log.numeric_difference)}
                      </span>
                    </div>
                  )}

                  {log.change_reason && (
                    <p className="text-[9px] text-muted-foreground mt-0.5 italic">السبب: {log.change_reason}</p>
                  )}
                </div>

                {/* Time */}
                <div className="text-left shrink-0">
                  <p className="text-[9px] text-muted-foreground">{formatTime(log.created_at)}</p>
                  <p className="text-[8px] text-muted-foreground/60">{formatDate(log.created_at)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
