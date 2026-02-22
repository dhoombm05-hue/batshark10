import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingDown, Shield, X, Lightbulb, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface SmartAlert {
  id: string;
  level: 'info' | 'warning' | 'danger' | 'critical';
  title: string;
  message: string;
  suggestion?: string;
  riskPercent?: number;
}

interface SmartAlertsProps {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  burnRate: number;
  runway: number;
  liquidityRatio: number;
  grossMargin: number;
  healthScore: number;
}

export default function SmartAlerts({ totalRevenue, totalExpenses, netProfit, burnRate, runway, liquidityRatio, grossMargin, healthScore }: SmartAlertsProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const alerts: SmartAlert[] = [];

  // Critical: expenses exceed revenue
  if (totalExpenses > totalRevenue && totalRevenue > 0) {
    const overPercent = Math.round(((totalExpenses - totalRevenue) / totalRevenue) * 100);
    alerts.push({
      id: 'expenses-exceed',
      level: 'critical',
      title: '🚨 تجاوز المصروفات للإيرادات',
      message: `المصروفات تتجاوز الإيرادات بنسبة ${overPercent}%. عجز نقدي بقيمة ${Math.abs(netProfit).toLocaleString('ar-SA')} ريال.`,
      suggestion: 'خفض المصروفات التشغيلية بنسبة 15% أو زيادة الإيرادات عبر حملات تسويقية مستهدفة.',
      riskPercent: Math.min(overPercent + 50, 100),
    });
  }

  // Danger: low runway
  if (runway > 0 && runway <= 6) {
    alerts.push({
      id: 'low-runway',
      level: 'danger',
      title: '⚠️ المدرج المالي قصير',
      message: `المدرج المالي ${runway} أشهر فقط. معدل الحرق ${burnRate.toLocaleString('ar-SA')} ريال/شهر.`,
      suggestion: 'تقليل المصروفات غير الأساسية وتأجيل التوسعات الجديدة حتى تحسن السيولة.',
      riskPercent: Math.round((1 - runway / 12) * 100),
    });
  }

  // Warning: low liquidity
  if (liquidityRatio > 0 && liquidityRatio < 1.2) {
    alerts.push({
      id: 'low-liquidity',
      level: 'warning',
      title: '⚠️ نسبة السيولة ضعيفة',
      message: `نسبة السيولة ${liquidityRatio}x أقل من الحد الآمن (1.2x).`,
      suggestion: 'تحسين دورة التحصيل وتأخير المدفوعات غير العاجلة.',
      riskPercent: Math.round((1 - liquidityRatio / 1.5) * 100),
    });
  }

  // Danger: negative profit
  if (netProfit < 0) {
    alerts.push({
      id: 'net-loss',
      level: 'danger',
      title: '📉 خسارة صافية',
      message: `صافي الخسارة ${Math.abs(netProfit).toLocaleString('ar-SA')} ريال.`,
      suggestion: 'مراجعة المشاريع الخاسرة وتقييم إمكانية إيقاف المشاريع ذات العائد السلبي.',
      riskPercent: Math.min(Math.round(Math.abs(netProfit) / (totalRevenue || 1) * 100), 100),
    });
  }

  // Warning: low margin
  if (grossMargin > 0 && grossMargin < 15) {
    alerts.push({
      id: 'low-margin',
      level: 'warning',
      title: '📊 هامش ربح منخفض',
      message: `هامش الربح الإجمالي ${grossMargin}% فقط.`,
      suggestion: 'مراجعة التسعير وتقليل التكاليف المتغيرة.',
    });
  }

  // Info: health score
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

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));
  if (visibleAlerts.length === 0) return null;

  const levelStyles = {
    info: 'bg-primary/10 border-primary/30 text-primary',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    danger: 'bg-destructive/10 border-destructive/30 text-destructive',
    critical: 'bg-destructive/20 border-destructive/50 text-destructive',
  };

  const levelIcons = {
    info: Lightbulb,
    warning: AlertTriangle,
    danger: TrendingDown,
    critical: Shield,
  };

  return (
    <div className="space-y-3 mb-6 print:break-inside-avoid">
      <AnimatePresence>
        {visibleAlerts.map((alert) => {
          const Icon = levelIcons[alert.level];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`rounded-xl border p-4 ${levelStyles[alert.level]} relative`}
            >
              <button
                onClick={() => setDismissed(d => [...d, alert.id])}
                className="absolute top-3 left-3 p-1 rounded-lg hover:bg-background/20 transition-colors print:hidden"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-start gap-3 pr-2">
                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-heading font-bold mb-1">{alert.title}</h4>
                  <p className="text-xs leading-relaxed opacity-90">{alert.message}</p>
                  {alert.suggestion && (
                    <div className="mt-2 flex items-start gap-1.5 text-[11px] opacity-80">
                      <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>💡 اقتراح: {alert.suggestion}</span>
                    </div>
                  )}
                  {alert.riskPercent !== undefined && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span>نسبة المخاطرة</span>
                        <span className="font-bold">{alert.riskPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-background/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-current" style={{ width: `${alert.riskPercent}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
