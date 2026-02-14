import { motion } from 'framer-motion';
import { TrendingUp, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { forecasts, formatCurrency } from '@/data/mockData';

const periods = [
  { label: 'بعد شهر', data: forecasts.oneMonth, icon: Clock },
  { label: 'بعد 3 أشهر', data: forecasts.threeMonths, icon: TrendingUp },
  { label: 'بعد سنة', data: forecasts.oneYear, icon: BarChart3 },
];

export default function Forecasts() {
  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">التوقعات المالية</h1>
        <p className="text-sm text-muted-foreground mb-6">تحليل شبه اكتواري مبني على البيانات الفعلية</p>
      </motion.div>

      {/* Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {periods.map((period, i) => (
          <motion.div key={period.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gradient-card rounded-xl border border-border p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <period.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground">{period.label}</h3>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الإيرادات المتوقعة</span>
                <span className="text-foreground font-bold">{formatCurrency(period.data.revenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المصروفات المتوقعة</span>
                <span className="text-foreground">{formatCurrency(period.data.expenses)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">الربح المتوقع</span>
                <span className={`font-bold ${period.data.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(period.data.profit)}
                </span>
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">مستوى الثقة</span>
                <span className="text-primary">{period.data.confidence}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${period.data.confidence}%` }}
                  transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Insights & Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> رؤى التوقعات
          </h3>
          <div className="space-y-3">
            {forecasts.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> المخاطر المحتملة
          </h3>
          <div className="space-y-3">
            {forecasts.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="w-3.5 h-3.5 text-warning mt-1 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{risk}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
