import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useProjects } from '@/hooks/useProjects';
import { useJournalMetrics } from '@/hooks/useJournalMetrics';
import { 
  AlertTriangle, AlertCircle, Bell, TrendingDown, TrendingUp,
  DollarSign, Wallet, Shield, Zap, Settings, Calculator,
  ArrowRight, CheckCircle2, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  value: number;
  threshold: number;
  icon: any;
  action?: string;
}

interface WhatIfScenario {
  name: string;
  expenseChange: number;
  revenueChange: number;
}

export default function SmartAlerts() {
  const { projects } = useProjects();
  const { metrics } = useJournalMetrics();
  
  // Alert thresholds (configurable)
  const [thresholds, setThresholds] = useState({
    minCash: 50000,
    maxExpenseRatio: 80,
    minProfitMargin: 10,
    maxDebtRatio: 60,
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    inApp: true,
    critical: true,
    warning: true,
  });

  // What-If Analysis state
  const [whatIfExpense, setWhatIfExpense] = useState(0);
  const [whatIfRevenue, setWhatIfRevenue] = useState(0);

  // Calculate current metrics
  const totalRevenue = projects.reduce((sum, p) => sum + (p.override_total_revenue ?? p.total_revenue), 0);
  const totalExpenses = projects.reduce((sum, p) => sum + (p.override_total_expenses ?? p.total_expenses), 0);
  const netProfit = totalRevenue - totalExpenses;
  const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const estimatedCash = netProfit * 0.3; // Simplified cash estimation

  // Generate alerts based on thresholds
  const alerts = useMemo<Alert[]>(() => {
    const alertList: Alert[] = [];

    // Cash alert
    if (estimatedCash < thresholds.minCash) {
      alertList.push({
        id: 'cash-low',
        type: 'critical',
        title: 'تحذير السيولة',
        message: `السيولة المتاحة (${estimatedCash.toLocaleString()} ر.س) أقل من الحد الأدنى المطلوب`,
        value: estimatedCash,
        threshold: thresholds.minCash,
        icon: Wallet,
        action: 'مراجعة التدفقات النقدية',
      });
    }

    // Expense ratio alert
    if (expenseRatio > thresholds.maxExpenseRatio) {
      alertList.push({
        id: 'expense-high',
        type: 'critical',
        title: 'ارتفاع المصروفات',
        message: `نسبة المصروفات (${expenseRatio.toFixed(1)}%) تتجاوز الحد الأقصى المسموح`,
        value: expenseRatio,
        threshold: thresholds.maxExpenseRatio,
        icon: TrendingUp,
        action: 'خفض المصروفات التشغيلية',
      });
    }

    // Profit margin alert
    if (profitMargin < thresholds.minProfitMargin) {
      alertList.push({
        id: 'margin-low',
        type: 'warning',
        title: 'انخفاض هامش الربح',
        message: `هامش الربح (${profitMargin.toFixed(1)}%) أقل من المستهدف`,
        value: profitMargin,
        threshold: thresholds.minProfitMargin,
        icon: TrendingDown,
        action: 'زيادة الإيرادات أو تقليل التكاليف',
      });
    }

    // Loss alert
    if (netProfit < 0) {
      alertList.push({
        id: 'loss',
        type: 'critical',
        title: 'خسارة صافية',
        message: `الشركة تحقق خسارة صافية بقيمة ${Math.abs(netProfit).toLocaleString()} ر.س`,
        value: netProfit,
        threshold: 0,
        icon: XCircle,
        action: 'تحليل مصادر الخسارة',
      });
    }

    // Projects at risk
    const projectsAtRisk = projects.filter(p => p.status === 'loss');
    if (projectsAtRisk.length > 0) {
      alertList.push({
        id: 'projects-risk',
        type: 'warning',
        title: 'مشاريع خاسرة',
        message: `يوجد ${projectsAtRisk.length} مشروع/مشاريع تحقق خسائر`,
        value: projectsAtRisk.length,
        threshold: 0,
        icon: AlertTriangle,
        action: 'مراجعة أداء المشاريع',
      });
    }

    return alertList;
  }, [projects, thresholds, estimatedCash, expenseRatio, profitMargin, netProfit]);

  // What-If Analysis calculations
  const whatIfResults = useMemo(() => {
    const newExpenses = totalExpenses * (1 + whatIfExpense / 100);
    const newRevenue = totalRevenue * (1 + whatIfRevenue / 100);
    const newProfit = newRevenue - newExpenses;
    const newMargin = newRevenue > 0 ? (newProfit / newRevenue) * 100 : 0;
    const profitChange = newProfit - netProfit;
    const marginChange = newMargin - profitMargin;

    return {
      newExpenses,
      newRevenue,
      newProfit,
      newMargin,
      profitChange,
      marginChange,
      isPositive: newProfit > netProfit,
    };
  }, [whatIfExpense, whatIfRevenue, totalExpenses, totalRevenue, netProfit, profitMargin]);

  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">التنبيهات الذكية</h1>
            <p className="text-muted-foreground text-sm">مراقبة وتحليل المخاطر المالية</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={criticalAlerts.length > 0 ? 'destructive' : 'default'} className="px-3 py-1">
              <AlertCircle className="w-4 h-4 ml-1" />
              {criticalAlerts.length} تنبيه حرج
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="w-4 h-4 ml-2" />
              الإعدادات
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">إعدادات التنبيهات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">حدود التنبيه</h4>
                      <div>
                        <label className="text-sm text-muted-foreground">الحد الأدنى للسيولة (ر.س)</label>
                        <Input
                          type="number"
                          value={thresholds.minCash}
                          onChange={(e) => setThresholds(t => ({ ...t, minCash: Number(e.target.value) }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">الحد الأقصى لنسبة المصروفات (%)</label>
                        <Input
                          type="number"
                          value={thresholds.maxExpenseRatio}
                          onChange={(e) => setThresholds(t => ({ ...t, maxExpenseRatio: Number(e.target.value) }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">الحد الأدنى لهامش الربح (%)</label>
                        <Input
                          type="number"
                          value={thresholds.minProfitMargin}
                          onChange={(e) => setThresholds(t => ({ ...t, minProfitMargin: Number(e.target.value) }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">طرق الإشعار</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">إشعارات البريد الإلكتروني</span>
                        <Switch
                          checked={notifications.email}
                          onCheckedChange={(checked) => setNotifications(n => ({ ...n, email: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">إشعارات داخل التطبيق</span>
                        <Switch
                          checked={notifications.inApp}
                          onCheckedChange={(checked) => setNotifications(n => ({ ...n, inApp: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">التنبيهات الحرجة فقط</span>
                        <Switch
                          checked={notifications.critical}
                          onCheckedChange={(checked) => setNotifications(n => ({ ...n, critical: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {alerts.length === 0 ? (
            <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto text-section-revenue mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">لا توجد تنبيهات</h3>
                <p className="text-muted-foreground">جميع المؤشرات المالية ضمن الحدود الآمنة</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`border-l-4 ${
                  alert.type === 'critical' 
                    ? 'border-l-destructive bg-destructive/5' 
                    : alert.type === 'warning'
                    ? 'border-l-yellow-500 bg-yellow-500/5'
                    : 'border-l-blue-500 bg-blue-500/5'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        alert.type === 'critical' ? 'bg-destructive/10' : 
                        alert.type === 'warning' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                      }`}>
                        <alert.icon className={`w-5 h-5 ${
                          alert.type === 'critical' ? 'text-destructive' : 
                          alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground">{alert.title}</h3>
                          <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                            {alert.type === 'critical' ? 'حرج' : alert.type === 'warning' ? 'تحذير' : 'معلومات'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                        {alert.action && (
                          <Button variant="outline" size="sm" className="text-xs">
                            <ArrowRight className="w-3 h-3 ml-1" />
                            {alert.action}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* What-If Analysis */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              تحليل السيناريوهات (What-If)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>تغيير المصروفات</span>
                    <span className={whatIfExpense > 0 ? 'text-destructive' : whatIfExpense < 0 ? 'text-section-revenue' : ''}>
                      {whatIfExpense > 0 ? '+' : ''}{whatIfExpense}%
                    </span>
                  </div>
                  <Slider
                    value={[whatIfExpense]}
                    onValueChange={([v]) => setWhatIfExpense(v)}
                    min={-50}
                    max={50}
                    step={5}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>تغيير الإيرادات</span>
                    <span className={whatIfRevenue > 0 ? 'text-section-revenue' : whatIfRevenue < 0 ? 'text-destructive' : ''}>
                      {whatIfRevenue > 0 ? '+' : ''}{whatIfRevenue}%
                    </span>
                  </div>
                  <Slider
                    value={[whatIfRevenue]}
                    onValueChange={([v]) => setWhatIfRevenue(v)}
                    min={-50}
                    max={50}
                    step={5}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { setWhatIfExpense(0); setWhatIfRevenue(0); }}
                  >
                    إعادة تعيين
                  </Button>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                <h4 className="font-medium text-sm mb-3">النتائج المتوقعة</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">الإيرادات الجديدة</p>
                    <p className="text-lg font-bold">{whatIfResults.newRevenue.toLocaleString()} ر.س</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المصروفات الجديدة</p>
                    <p className="text-lg font-bold">{whatIfResults.newExpenses.toLocaleString()} ر.س</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">صافي الربح الجديد</p>
                    <p className={`text-lg font-bold ${whatIfResults.newProfit >= 0 ? 'text-section-revenue' : 'text-destructive'}`}>
                      {whatIfResults.newProfit.toLocaleString()} ر.س
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">التغير في الربح</p>
                    <p className={`text-lg font-bold flex items-center gap-1 ${whatIfResults.isPositive ? 'text-section-revenue' : 'text-destructive'}`}>
                      {whatIfResults.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {whatIfResults.profitChange > 0 ? '+' : ''}{whatIfResults.profitChange.toLocaleString()} ر.س
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">هامش الربح الجديد</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${whatIfResults.newMargin >= 0 ? 'bg-section-revenue' : 'bg-destructive'}`}
                        style={{ width: `${Math.max(0, Math.min(100, whatIfResults.newMargin))}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{whatIfResults.newMargin.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
