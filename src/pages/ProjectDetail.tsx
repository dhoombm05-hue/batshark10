import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, DollarSign, TrendingUp, Users, Megaphone, Activity, Plus, History, RotateCcw, Settings, Shield, Building2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import Layout from '@/components/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import StatCard from '@/components/StatCard';
import EditableField from '@/components/EditableField';
import AskMeDialog from '@/components/AskMeDialog';
import ExpenseRow from '@/components/ExpenseRow';
import AuditLogDialog from '@/components/AuditLogDialog';
import PrintButton from '@/components/PrintButton';
import ProjectManagement from '@/components/ProjectManagement';
import ActivityFeed from '@/components/ActivityFeed';
import { usePageViewTracker } from '@/hooks/useAutoTracker';
import { useProject, useProjectMonthlyData, useProjectExpenses, useProjectAnalysis, useAddRecord, useDeleteRecord, useUpdateField } from '@/hooks/useProjects';
import { useFinancialEngine } from '@/hooks/useFinancialEngine';
import { useProjectJournalMetrics } from '@/hooks/useJournalMetrics';
import { formatCurrency, formatPercent } from '@/data/mockData';
import { toast } from 'sonner';

const COLORS = ['hsl(43,65%,55%)', 'hsl(222,30%,35%)', 'hsl(152,60%,45%)', 'hsl(0,72%,51%)', 'hsl(200,70%,50%)', 'hsl(280,60%,55%)'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-elevated">
      <p className="text-sm font-heading text-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span style={{ color: p.color }}>●</span> {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function ProjectDetail() {
  const { id } = useParams();
  const { isCEO } = useAuthContext();
  const { data: project, isLoading: loadingProject } = useProject(id || '');
  const { data: monthlyData } = useProjectMonthlyData(project?.id || '');
  const { data: expenses } = useProjectExpenses(project?.id || '');
  const { data: analysis } = useProjectAnalysis(project?.id || '');
  const addRecord = useAddRecord();
  const deleteRecord = useDeleteRecord();
  const updateField = useUpdateField();
  const { recalculateProject } = useFinancialEngine();
  const { data: journalMetrics } = useProjectJournalMetrics(project?.id || '');

  // Journal-derived values (single source of truth)
  const jRevenue = journalMetrics?.totalRevenue ?? Number(project?.total_revenue || 0);
  const jExpenses = journalMetrics?.totalExpenses ?? Number(project?.total_expenses || 0);
  const jProfit = journalMetrics?.netProfit ?? Number(project?.net_profit || 0);
  const jGrowth = journalMetrics?.growthRate ?? Number(project?.growth_rate || 0);
  const jMonthlyData = journalMetrics?.monthlyData;
  const jExpenseBreakdown = journalMetrics?.expenseBreakdown;

  // Auto-track page view
  usePageViewTracker(project?.name, project?.id, project?.name);

  const [showProjectHistory, setShowProjectHistory] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [newExpCategory, setNewExpCategory] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');

  if (loadingProject) {
    return <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div></Layout>;
  }
  if (!project) return <Layout><p className="text-foreground">المشروع غير موجود</p></Layout>;

  const handleAddExpense = () => {
    if (!newExpCategory || !newExpAmount) return;
    addRecord.mutate(
      { table: 'project_expenses', data: { project_id: project.id, category: newExpCategory, amount: Number(newExpAmount) } },
      {
        onSuccess: async () => {
          toast.success('تمت إضافة المصروف');
          setAddingExpense(false);
          setNewExpCategory('');
          setNewExpAmount('');
          // Auto-recalculate
          await recalculateProject(project.id);
          toast.success('تمت إعادة الاحتساب تلقائياً');
        },
      }
    );
  };

  const handleRecalculate = async () => {
    try {
      await recalculateProject(project.id);
      toast.success('تمت إعادة الاحتساب');
    } catch {
      toast.error('فشلت إعادة الاحتساب');
    }
  };

  // Break-even calculation
  let cumulative = 0;
  const breakEvenMonth = monthlyData?.find(m => {
    cumulative += Number(m.profit);
    return cumulative > 0;
  });

  return (
    <Layout>
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowRight className="w-4 h-4" /> العودة للمشاريع
      </Link>

      {/* Header with edit controls */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between">
        <div>
          <EditableField table="projects" recordId={project.id} field="name" value={project.name} valueClassName="text-2xl font-heading font-bold text-foreground" onHistoryClick={() => setShowProjectHistory(true)} />
          <EditableField table="projects" recordId={project.id} field="description" value={project.description} valueClassName="text-sm text-muted-foreground" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <PrintButton title={`طباعة ${project.name}`} />
          <button onClick={() => setShowProjectHistory(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors">
            <History className="w-3.5 h-3.5" /> سجل التعديلات
          </button>
          <button onClick={handleRecalculate} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> إعادة احتساب
          </button>
          {isCEO && (
            <button onClick={() => setShowManagement(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors">
              <Building2 className="w-3.5 h-3.5" /> إدارة البزنس
            </button>
          )}
        </div>
      </motion.div>

      {/* Data Reliability Score */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-gradient-card rounded-xl border border-border p-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-foreground flex items-center gap-2 font-heading"><Shield className="w-4 h-4 text-primary" /> مؤشر موثوقية البيانات</span>
          <EditableField table="projects" recordId={project.id} field="data_reliability_score" value={project.data_reliability_score} type="number" formatter={(v) => `${v}%`} valueClassName={`font-bold ${project.data_reliability_score >= 80 ? 'text-success' : project.data_reliability_score >= 50 ? 'text-warning' : 'text-destructive'}`} />
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${project.data_reliability_score >= 80 ? 'bg-success' : project.data_reliability_score >= 50 ? 'bg-warning' : 'bg-destructive'}`}
            initial={{ width: 0 }}
            animate={{ width: `${project.data_reliability_score}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </motion.div>

      {/* Stats — Journal-derived (Single Source of Truth) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-card rounded-xl border border-border p-4 shadow-card">
          <span className="text-xs text-muted-foreground">إجمالي الإيرادات <span className="text-[9px] text-primary">(من القيود)</span></span>
          <p className="text-lg font-bold text-foreground">{formatCurrency(jRevenue)}</p>
        </div>
        <div className="bg-gradient-card rounded-xl border border-border p-4 shadow-card">
          <span className="text-xs text-muted-foreground">صافي الربح <span className="text-[9px] text-primary">(من القيود)</span></span>
          <p className={`text-lg font-bold ${jProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(jProfit)}</p>
        </div>
        <div className="bg-gradient-card rounded-xl border border-border p-4 shadow-card">
          <span className="text-xs text-muted-foreground">العملاء</span>
          <EditableField table="projects" recordId={project.id} field="client_count" value={project.client_count} type="number" formatter={(v) => Number(v).toLocaleString('ar-SA')} valueClassName="text-lg font-bold text-foreground" onAfterSave={() => recalculateProject(project.id)} entityName={project.name} section={project.name} />
        </div>
        <div className="bg-gradient-card rounded-xl border border-border p-4 shadow-card">
          <span className="text-xs text-muted-foreground">نسبة النمو <span className="text-[9px] text-primary">(من القيود)</span></span>
          <p className={`text-lg font-bold ${jGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>{formatPercent(jGrowth)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Chart with settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading text-muted-foreground">الإيرادات مقابل المصروفات</h3>
            <div className="flex gap-1">
              {isCEO && (
                <button className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="تعديل طريقة الحساب">
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
              <button className="p-1 rounded hover:bg-warning/10 text-muted-foreground hover:text-warning transition-colors" title="إعادة توليد">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={jMonthlyData && jMonthlyData.length > 0 ? jMonthlyData : (monthlyData || [])}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,25%,18%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="الإيرادات" fill="hsl(43,65%,55%)" radius={[3,3,0,0]} />
              <Bar dataKey="expenses" name="المصروفات" fill="hsl(222,30%,30%)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Expense Breakdown - Fully Editable */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading text-muted-foreground">توزيع المصروفات</h3>
            <button
              onClick={() => setAddingExpense(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3 h-3" /> إضافة
            </button>
          </div>

          {addingExpense && (
            <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-border space-y-2">
              <div className="flex gap-2">
                <input value={newExpCategory} onChange={(e) => setNewExpCategory(e.target.value)} placeholder="التصنيف" className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-foreground" />
                <input type="number" value={newExpAmount} onChange={(e) => setNewExpAmount(e.target.value)} placeholder="المبلغ" className="w-32 bg-background border border-border rounded px-2 py-1 text-sm text-foreground" />
              </div>
              <div className="flex gap-1">
                <button onClick={handleAddExpense} className="px-2 py-0.5 text-xs bg-success/20 text-success rounded hover:bg-success/30">إضافة</button>
                <button onClick={() => setAddingExpense(false)} className="px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded hover:bg-destructive/30">إلغاء</button>
              </div>
            </div>
          )}

          <div className="space-y-1 mb-4">
            {expenses?.map((exp) => (
              <ExpenseRow key={exp.id} expense={exp} />
            ))}
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={expenses || []} dataKey="amount" nameKey="category"
                cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: 'hsl(215,15%,55%)' }}
              >
                {expenses?.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Profit Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="bg-gradient-card rounded-xl border border-border p-5 shadow-card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-heading text-muted-foreground">اتجاه الأرباح الشهرية</h3>
          <div className="flex gap-1">
              {isCEO && (
                <button className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="تعديل مصدر البيانات">
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            <button className="p-1 rounded hover:bg-warning/10 text-muted-foreground hover:text-warning transition-colors" title="إعادة توليد">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={jMonthlyData && jMonthlyData.length > 0 ? jMonthlyData : (monthlyData || [])}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={jProfit >= 0 ? 'hsl(152,60%,45%)' : 'hsl(0,72%,51%)'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={jProfit >= 0 ? 'hsl(152,60%,45%)' : 'hsl(0,72%,51%)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,25%,18%)" />
            <XAxis dataKey="month" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="profit" name="الربح"
              stroke={jProfit >= 0 ? 'hsl(152,60%,45%)' : 'hsl(0,72%,51%)'}
              fill="url(#profitGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Analysis & Break-even */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> تحليل الأداء
          </h3>
          <div className="space-y-3">
            {analysis?.map((item) => (
              <div key={item.id} className="flex items-start gap-2 group">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <EditableField table="project_analysis" recordId={item.id} field="content" value={item.content} valueClassName="text-sm text-foreground" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4">نقطة التعادل</h3>
          {breakEvenMonth ? (
            <div className="text-center py-6">
              <p className="text-3xl font-heading font-bold text-primary mb-2">{breakEvenMonth.month}</p>
              <p className="text-sm text-muted-foreground">تم الوصول لنقطة التعادل</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-destructive">لم يتم الوصول لنقطة التعادل بعد</p>
            </div>
          )}
          {project.occupancy_rate && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">نسبة الإشغال</span>
                <EditableField table="projects" recordId={project.id} field="occupancy_rate" value={project.occupancy_rate} type="number" formatter={(v) => `${v}%`} valueClassName="text-primary font-bold" />
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${project.occupancy_rate}%` }}
                  transition={{ duration: 1, delay: 1 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Live Activity Feed */}
      <div className="mb-8">
        <ActivityFeed entityId={project.id} section={project.name} />
      </div>

      <AuditLogDialog
        open={showProjectHistory}
        onOpenChange={setShowProjectHistory}
        tableName="projects"
        recordId={project.id}
        title={project.name}
      />
      <AskMeDialog pageKey="project" />
    </Layout>
  );
}
