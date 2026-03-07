import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, TrendingDown, FileEdit, Plus, Trash2, DollarSign, Calendar, AlertTriangle, CheckCircle, Clock, ChevronUp, ChevronDown, Newspaper, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { UserPerformanceScore } from '@/hooks/usePerformanceScoring';

interface Props {
  score: UserPerformanceScore;
  previousScore?: number;
}

const SEGMENTS = [
  { key: 'completedActions', label: 'عمليات مكتملة', icon: CheckCheck, color: 'hsl(160, 70%, 40%)' },
  { key: 'updates', label: 'تحديثات', icon: FileEdit, color: 'hsl(210, 80%, 52%)' },
  { key: 'creates', label: 'إنشاءات', icon: Plus, color: 'hsl(142, 71%, 45%)' },
  { key: 'deletes', label: 'حذف', icon: Trash2, color: 'hsl(0, 84%, 60%)' },
  { key: 'newsCount', label: 'أخبار منشورة', icon: Newspaper, color: 'hsl(270, 60%, 55%)' },
  { key: 'financialImpact', label: 'تأثير مالي', icon: DollarSign, color: 'hsl(38, 92%, 50%)' },
] as const;

function getScoreColor(score: number) {
  if (score >= 70) return 'hsl(142, 71%, 45%)';
  if (score >= 40) return 'hsl(38, 92%, 50%)';
  return 'hsl(0, 84%, 60%)';
}

function getScoreLabel(score: number) {
  if (score >= 85) return 'ممتاز';
  if (score >= 70) return 'جيد جداً';
  if (score >= 50) return 'جيد';
  if (score >= 30) return 'مقبول';
  return 'ضعيف';
}

function CircleChart({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-heading font-bold" style={{ color }}>{score}%</span>
        <span className="text-[10px] text-muted-foreground">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

function SegmentBar({ value, max, color, label, icon: Icon }: {
  value: number; max: number; color: string; label: string; icon: any;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="w-3.5 h-3.5" style={{ color }} /> {label}
        </span>
        <span className="font-bold text-foreground">{value}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function PerformanceAlertBanner({ score, previousScore, name }: { score: number; previousScore?: number; name: string }) {
  if (previousScore === undefined || score >= previousScore) return null;
  const drop = previousScore - score;
  if (drop < 5) return null;

  const suggestions = [];
  if (score < 30) {
    suggestions.push('زيادة النشاط في تحديث البيانات المالية');
    suggestions.push('المساهمة في إنشاء محتوى جديد في المشاريع');
    suggestions.push('تفعيل التأثير المالي من خلال تعديلات ذات قيمة');
  } else if (score < 50) {
    suggestions.push('رفع معدل النشاط الأسبوعي');
    suggestions.push('تنويع العمليات (تحديث، إنشاء، حذف)');
  } else {
    suggestions.push('الحفاظ على وتيرة النشاط الحالية');
    suggestions.push('التركيز على العمليات ذات التأثير المالي');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-destructive/20 shrink-0">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-destructive mb-1">
            ⚠️ تنبيه تراجع الأداء — {name}
          </h4>
          <p className="text-xs text-destructive/80 mb-2">
            انخفض الأداء بمقدار <b>{drop}%</b> (من {previousScore}% إلى {score}%). يجب اتخاذ إجراءات لتحسين الأداء.
          </p>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-foreground">📋 اقتراحات للتحسين:</p>
            {suggestions.map((s, i) => (
              <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-success shrink-0" /> {s}
              </p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PerformanceCircleDialog({ score, previousScore }: Props) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const color = getScoreColor(score.score);
  const totalMax = Math.max(score.updates, score.creates, score.deletes, 1);
  const hasDrop = previousScore !== undefined && score.score < previousScore;
  const cycleDate = score.cycleStart ? formatDistanceToNow(new Date(score.cycleStart), { addSuffix: true, locale: ar }) : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="relative group focus:outline-none" title="عرض تفاصيل الأداء">
          <svg width={44} height={44} className="-rotate-90">
            <circle cx={22} cy={22} r={17} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
            <circle cx={22} cy={22} r={17} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 17}
              strokeDashoffset={2 * Math.PI * 17 - (score.score / 100) * 2 * Math.PI * 17}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>
            {score.score}%
          </span>
          {hasDrop && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive rounded-full flex items-center justify-center animate-pulse">
              <TrendingDown className="w-2 h-2 text-white" />
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-primary" />
            تقرير أداء — {score.displayName}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable content with scroll buttons */}
        <div className="relative flex-1 min-h-0">
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 h-7 w-7 rounded-full shadow-md opacity-80 hover:opacity-100"
            onClick={() => scrollRef.current?.scrollBy({ top: -150, behavior: 'smooth' })}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>

          <div ref={scrollRef} className="overflow-y-auto max-h-[65vh] px-1 py-6 space-y-4 scroll-smooth">
            {/* Alert */}
            {hasDrop && previousScore !== undefined && (
              <PerformanceAlertBanner score={score.score} previousScore={previousScore} name={score.displayName} />
            )}

            {/* Circle */}
            <div className="flex justify-center py-4">
              <CircleChart score={score.score} size={160} />
            </div>

            {/* Cycle Info */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>بداية الدورة: {cycleDate}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>الترتيب: <b className="text-foreground">#{score.rank}</b></span>
            </div>

            {/* Segments */}
            <div className="space-y-3 bg-secondary/20 rounded-xl p-4 border border-border">
              <h4 className="text-xs font-bold text-foreground mb-2">📊 تفصيل العمليات</h4>
              {SEGMENTS.map(seg => {
                const val = seg.key === 'financialImpact'
                  ? (score.financialImpact > 0 ? Math.min(Math.round(score.financialImpact / 1000), 100) : 0)
                  : (score as any)[seg.key] ?? 0;
                const max = seg.key === 'financialImpact' ? 100 : totalMax;
                return (
                  <SegmentBar key={seg.key} value={seg.key === 'financialImpact' ? score.financialImpact : val}
                    max={max} color={seg.color} label={seg.label} icon={seg.icon} />
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'إجمالي العمليات', value: score.totalActions, icon: Activity },
                { label: 'هذا الأسبوع', value: score.weeklyActions, icon: Calendar },
                { label: 'هذا الشهر', value: score.monthlyActions, icon: TrendingUp },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
                  <s.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-heading font-bold text-foreground">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Trend indicator */}
            {previousScore !== undefined && (
              <div className={`flex items-center justify-center gap-2 text-xs font-medium rounded-lg p-2 ${
                score.score >= previousScore
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {score.score >= previousScore
                  ? <><TrendingUp className="w-4 h-4" /> أداء مستقر أو متحسن</>
                  : <><TrendingDown className="w-4 h-4" /> تراجع بمقدار {previousScore - score.score}% عن الدورة السابقة</>
                }
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 h-7 w-7 rounded-full shadow-md opacity-80 hover:opacity-100"
            onClick={() => scrollRef.current?.scrollBy({ top: 150, behavior: 'smooth' })}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
