import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingDown, Shield, X } from 'lucide-react';
import { useState } from 'react';

interface RiskAlert {
  id: string;
  level: 'warning' | 'danger' | 'critical';
  title: string;
  message: string;
}

interface RiskAlertBannerProps {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  burnRate: number;
  runway: number;
  liquidityRatio: number;
}

export default function RiskAlertBanner({ totalRevenue, totalExpenses, netProfit, burnRate, runway, liquidityRatio }: RiskAlertBannerProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const alerts: RiskAlert[] = [];

  // Critical: expenses exceed revenue
  if (totalExpenses > totalRevenue && totalRevenue > 0) {
    const overPercent = Math.round(((totalExpenses - totalRevenue) / totalRevenue) * 100);
    alerts.push({
      id: 'expenses-exceed',
      level: 'critical',
      title: '🚨 تجاوز المصروفات للإيرادات',
      message: `المصروفات تتجاوز الإيرادات بنسبة ${overPercent}%. هذا يعني عجز نقدي بقيمة ${Math.abs(netProfit).toLocaleString('ar-SA')} ريال.`,
    });
  }

  // Danger: low runway
  if (runway > 0 && runway <= 6) {
    alerts.push({
      id: 'low-runway',
      level: 'danger',
      title: '⚠️ سيولة منخفضة',
      message: `المدرج المالي المتبقي ${runway} أشهر فقط. معدل الحرق الشهري ${burnRate.toLocaleString('ar-SA')} ريال. يُنصح بتقليل المصروفات أو زيادة الإيرادات.`,
    });
  }

  // Warning: low liquidity ratio
  if (liquidityRatio > 0 && liquidityRatio < 1.2) {
    alerts.push({
      id: 'low-liquidity',
      level: 'warning',
      title: '⚠️ نسبة السيولة ضعيفة',
      message: `نسبة السيولة ${liquidityRatio}x وهي أقل من الحد الآمن (1.2x). قد تواجه صعوبة في تغطية الالتزامات.`,
    });
  }

  // Warning: negative profit
  if (netProfit < 0) {
    alerts.push({
      id: 'net-loss',
      level: 'danger',
      title: '📉 خسارة صافية',
      message: `صافي الخسارة الحالية ${Math.abs(netProfit).toLocaleString('ar-SA')} ريال. يجب مراجعة المصروفات وتحسين الإيرادات.`,
    });
  }

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));

  if (visibleAlerts.length === 0) return null;

  const levelStyles = {
    warning: 'bg-warning/10 border-warning/30 text-warning',
    danger: 'bg-destructive/10 border-destructive/30 text-destructive',
    critical: 'bg-destructive/20 border-destructive/50 text-destructive',
  };

  const levelIcons = {
    warning: AlertTriangle,
    danger: TrendingDown,
    critical: Shield,
  };

  return (
    <div className="space-y-3 mb-6">
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
                className="absolute top-3 left-3 p-1 rounded-lg hover:bg-background/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-start gap-3 pr-2">
                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-heading font-bold mb-1">{alert.title}</h4>
                  <p className="text-xs leading-relaxed opacity-90">{alert.message}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
