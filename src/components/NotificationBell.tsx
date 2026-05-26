import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, TrendingDown, Shield, Lightbulb, DollarSign, ChevronDown } from 'lucide-react';

interface SmartAlert {
  id: string;
  level: 'info' | 'warning' | 'danger' | 'critical';
  title: string;
  message: string;
  suggestion?: string;
  riskPercent?: number;
}

interface NotificationBellProps {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  burnRate: number;
  runway: number;
  liquidityRatio: number;
  grossMargin: number;
  healthScore: number;
}

const levelConfig = {
  info: { icon: Lightbulb, bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', dot: 'bg-primary' },
  warning: { icon: AlertTriangle, bg: 'bg-warning/10', border: 'border-warning/20', text: 'text-warning', dot: 'bg-warning' },
  danger: { icon: TrendingDown, bg: 'bg-destructive/10', border: 'border-destructive/20', text: 'text-destructive', dot: 'bg-destructive' },
  critical: { icon: Shield, bg: 'bg-destructive/15', border: 'border-destructive/30', text: 'text-destructive', dot: 'bg-destructive' },
};

function generateAlerts(props: NotificationBellProps): SmartAlert[] {
  const { totalRevenue, totalExpenses, netProfit, burnRate, runway, liquidityRatio, grossMargin, healthScore } = props;
  const alerts: SmartAlert[] = [];

  if (totalExpenses > totalRevenue && totalRevenue > 0) {
    const overPercent = Math.round(((totalExpenses - totalRevenue) / totalRevenue) * 100);
    alerts.push({
      id: 'expenses-exceed',
      level: 'critical',
      title: '🚨 تجاوز المصروفات للإيرادات',
      message: `المصروفات تتجاوز الإيرادات بنسبة ${overPercent}%. عجز نقدي بقيمة ${Math.abs(netProfit).toLocaleString('ar-SA')} ريال.`,
      suggestion: 'خفض المصروفات التشغيلية أو زيادة الإيرادات.',
      riskPercent: Math.min(overPercent + 50, 100),
    });
  }

  if (runway > 0 && runway <= 6) {
    alerts.push({
      id: 'low-runway',
      level: 'danger',
      title: '⚠️ المدرج المالي قصير',
      message: `المدرج المالي ${runway} أشهر. معدل الحرق ${burnRate.toLocaleString('ar-SA')} ريال/شهر.`,
      suggestion: 'تقليل المصروفات غير الأساسية.',
      riskPercent: Math.round((1 - runway / 12) * 100),
    });
  }

  if (liquidityRatio > 0 && liquidityRatio < 1.2) {
    alerts.push({
      id: 'low-liquidity',
      level: 'warning',
      title: '⚠️ نسبة السيولة ضعيفة',
      message: `نسبة السيولة ${liquidityRatio}x أقل من الحد الآمن (1.2x).`,
      suggestion: 'تحسين دورة التحصيل.',
      riskPercent: Math.round((1 - liquidityRatio / 1.5) * 100),
    });
  }

  if (netProfit < 0) {
    alerts.push({
      id: 'net-loss',
      level: 'danger',
      title: '📉 خسارة صافية',
      message: `صافي الخسارة ${Math.abs(netProfit).toLocaleString('ar-SA')} ريال.`,
      suggestion: 'مراجعة المشاريع الخاسرة.',
      riskPercent: Math.min(Math.round(Math.abs(netProfit) / (totalRevenue || 1) * 100), 100),
    });
  }

  if (grossMargin > 0 && grossMargin < 15) {
    alerts.push({
      id: 'low-margin',
      level: 'warning',
      title: '📊 هامش ربح منخفض',
      message: `هامش الربح الإجمالي ${grossMargin}% فقط.`,
      suggestion: 'مراجعة التسعير وتقليل التكاليف.',
    });
  }

  if (healthScore < 50) {
    alerts.push({
      id: 'low-health',
      level: 'danger',
      title: '🏥 مؤشر صحة الشركة منخفض',
      message: `مؤشر الصحة المالية ${healthScore}/100.`,
      suggestion: 'خطة طوارئ مالية شاملة مطلوبة.',
      riskPercent: 100 - healthScore,
    });
  }

  return alerts;
}

// Play a subtle notification chime using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (higher, slight delay)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.12);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.12, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);

    setTimeout(() => ctx.close(), 600);
  } catch {}
}

export default function NotificationBell(props: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('bs_dismissed_alerts') || '[]'); } catch { return []; }
  });
  const [seen, setSeen] = useState(false);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const allAlerts = generateAlerts(props);
  const visibleAlerts = allAlerts.filter(a => !dismissed.includes(a.id));
  const count = visibleAlerts.length;
  const badgeCount = seen ? 0 : count;

  // Play sound once when there are alerts
  useEffect(() => {
    if (count > 0 && !hasPlayedSound) {
      const timer = setTimeout(() => {
        playNotificationSound();
        setHasPlayedSound(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [count, hasPlayedSound]);

  // Save dismissed to localStorage
  useEffect(() => {
    localStorage.setItem('bs_dismissed_alerts', JSON.stringify(dismissed));
  }, [dismissed]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleDismiss = useCallback((id: string) => {
    setDismissed(d => [...d, id]);
  }, []);

  const handleDismissAll = useCallback(() => {
    setDismissed(d => [...d, ...visibleAlerts.map(a => a.id)]);
    setOpen(false);
  }, [visibleAlerts]);

  const highestLevel = visibleAlerts.reduce<'info' | 'warning' | 'danger' | 'critical'>((max, a) => {
    const order = { info: 0, warning: 1, danger: 2, critical: 3 };
    return order[a.level] > order[max] ? a.level : max;
  }, 'info');

  const bellColor = count === 0 ? 'text-muted-foreground' :
    highestLevel === 'critical' || highestLevel === 'danger' ? 'text-destructive' :
    highestLevel === 'warning' ? 'text-warning' : 'text-primary';

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            // Mark as seen and auto-dismiss everything currently visible so the
            // bell becomes clear the moment the user actually looks at it.
            setSeen(true);
            if (visibleAlerts.length > 0) {
              setDismissed(d => [...d, ...visibleAlerts.map(a => a.id)]);
            }
          }
        }}
        className={`relative p-2.5 rounded-xl bg-card border border-border/50 hover:border-border transition-all ${bellColor}`}
        title="التنبيهات"
      >
        <Bell className="w-[18px] h-[18px]" />
        <AnimatePresence>
          {badgeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-black shadow-lg"
            >
              {badgeCount}
            </motion.span>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {badgeCount > 0 && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-destructive/30"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-[340px] sm:w-[380px] max-h-[420px] bg-card rounded-2xl border border-border shadow-2xl z-[60] overflow-hidden"
            style={{ boxShadow: '0 20px 60px -12px hsl(0 0% 0% / 0.25)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-foreground/70" />
                <span className="text-xs font-heading font-black text-foreground">التنبيهات الذكية</span>
                {count > 0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">
                    {count} تنبيه
                  </span>
                )}
              </div>
              {count > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors font-bold"
                >
                  مسح الكل
                </button>
              )}
            </div>

            {/* Alerts list */}
            <div className="overflow-y-auto max-h-[350px] p-2.5 space-y-2">
              {visibleAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
                  <Bell className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-xs font-bold">لا توجد تنبيهات</p>
                  <p className="text-[10px] mt-1">الوضع المالي مستقر ✅</p>
                </div>
              ) : (
                visibleAlerts.map((alert, i) => {
                  const config = levelConfig[alert.level];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-xl border p-3 ${config.bg} ${config.border} relative group`}
                    >
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="absolute top-2 left-2 p-1 rounded-lg hover:bg-background/40 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon className={`w-3.5 h-3.5 ${config.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[11px] font-heading font-bold ${config.text} mb-0.5`}>{alert.title}</h4>
                          <p className="text-[10px] text-foreground/70 leading-relaxed">{alert.message}</p>
                          {alert.suggestion && (
                            <p className="text-[9px] text-muted-foreground mt-1 flex items-start gap-1">
                              <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                              {alert.suggestion}
                            </p>
                          )}
                          {alert.riskPercent !== undefined && (
                            <div className="mt-1.5">
                              <div className="w-full h-1 bg-background/40 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${config.dot}`} style={{ width: `${alert.riskPercent}%` }} />
                              </div>
                              <span className="text-[8px] text-muted-foreground mt-0.5 block text-left">خطورة {alert.riskPercent}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
