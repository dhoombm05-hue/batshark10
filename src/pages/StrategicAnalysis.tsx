import { motion } from 'framer-motion';
import { Shield, TrendingUp, Droplets, ArrowUpDown, CheckCircle, XCircle, Lightbulb, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import { strategicAnalysis, formatCurrency } from '@/data/mockData';

const swotConfig = [
  { key: 'strengths' as const, label: 'نقاط القوة', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
  { key: 'weaknesses' as const, label: 'نقاط الضعف', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  { key: 'opportunities' as const, label: 'الفرص', icon: Lightbulb, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  { key: 'threats' as const, label: 'التهديدات', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
];

export default function StrategicAnalysis() {
  const { swot, roi, liquidityRatio, cashFlow } = strategicAnalysis;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">التحليل الاستراتيجي</h1>
        <p className="text-sm text-muted-foreground mb-6">تحليل شامل للوضع المالي والاستراتيجي</p>
      </motion.div>

      {/* SWOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {swotConfig.map((item, i) => (
          <motion.div key={item.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gradient-card rounded-xl border border-border p-5 shadow-card`}>
            <h3 className={`text-sm font-heading mb-3 flex items-center gap-2 ${item.color}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </h3>
            <div className="space-y-2">
              {swot[item.key].map((point, j) => (
                <div key={j} className={`flex items-start gap-2 p-2.5 rounded-lg ${item.bg} border ${item.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.color.replace('text-', 'bg-')}`} />
                  <p className="text-sm text-foreground">{point}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card text-center">
          <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-1">العائد على الاستثمار ROI</p>
          <p className="text-2xl font-heading font-bold text-primary">{roi}%</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card text-center">
          <Droplets className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-1">نسبة السيولة</p>
          <p className="text-2xl font-heading font-bold text-foreground">{liquidityRatio}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card text-center">
          <ArrowUpDown className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-1">صافي التدفق النقدي</p>
          <p className={`text-2xl font-heading font-bold ${cashFlow.net >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(cashFlow.net)}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card text-center">
          <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground mb-1">تدفق التشغيل</p>
          <p className="text-2xl font-heading font-bold text-success">{formatCurrency(cashFlow.operating)}</p>
        </motion.div>
      </div>

      {/* Cash Flow Breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
        className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
        <h3 className="text-sm font-heading text-muted-foreground mb-4">تحليل التدفق النقدي</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-success/5 border border-success/15 text-center">
            <p className="text-xs text-muted-foreground mb-1">الأنشطة التشغيلية</p>
            <p className="text-lg font-heading font-bold text-success">{formatCurrency(cashFlow.operating)}</p>
          </div>
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/15 text-center">
            <p className="text-xs text-muted-foreground mb-1">الأنشطة الاستثمارية</p>
            <p className="text-lg font-heading font-bold text-destructive">{formatCurrency(cashFlow.investing)}</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/15 text-center">
            <p className="text-xs text-muted-foreground mb-1">الأنشطة التمويلية</p>
            <p className="text-lg font-heading font-bold text-foreground">{formatCurrency(cashFlow.financing)}</p>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
