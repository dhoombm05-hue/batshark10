import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Award, AlertTriangle, CheckCircle, Target, TrendingUp, Star, ClipboardCheck, History, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { employees } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

interface EvalRecord {
  id: string;
  evaluation_month: string;
  evaluation_year: number;
  budget_compliance: number;
  goal_achievement: number;
  projects_completed: number;
  expense_exceeded: boolean;
  teamwork: number;
  initiative: number;
  communication: number;
  overall_score: number;
  admin_rating: number;
  notes: string | null;
  created_at: string;
}

const RatingSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold ${value >= 7 ? 'text-success' : value >= 5 ? 'text-warning' : 'text-destructive'}`}>{value}/10</span>
    </div>
    <Slider value={[value]} onValueChange={v => onChange(v[0])} min={1} max={10} step={1} />
  </div>
);

export default function EmployeeDetail() {
  const { id } = useParams();
  const emp = employees.find(e => e.id === id);
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<EvalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [evalMonth, setEvalMonth] = useState(MONTHS[new Date().getMonth()]);
  const [evalYear, setEvalYear] = useState(new Date().getFullYear());
  const [budgetCompliance, setBudgetCompliance] = useState(7);
  const [goalAchievement, setGoalAchievement] = useState(7);
  const [projectsCompleted, setProjectsCompleted] = useState(1);
  const [expenseExceeded, setExpenseExceeded] = useState(false);
  const [teamwork, setTeamwork] = useState(7);
  const [initiative, setInitiative] = useState(7);
  const [communication, setCommunication] = useState(7);
  const [adminRating, setAdminRating] = useState(7);
  const [notes, setNotes] = useState('');

  const overallScore = parseFloat(((budgetCompliance + goalAchievement + teamwork + initiative + communication + adminRating) / 6).toFixed(1));

  const fetchHistory = async () => {
    if (!emp) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('employee_evaluations')
      .select('*')
      .eq('employee_id', emp.id)
      .order('evaluation_year', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast({ title: 'خطأ', description: 'فشل في جلب السجل', variant: 'destructive' });
    } else {
      setHistory((data || []) as unknown as EvalRecord[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (emp) fetchHistory();
  }, [emp?.id]);

  const handleSubmit = async () => {
    if (!emp) return;
    setSaving(true);
    const { error } = await supabase.from('employee_evaluations').insert({
      employee_id: emp.id,
      employee_name: emp.name,
      evaluation_month: evalMonth,
      evaluation_year: evalYear,
      budget_compliance: budgetCompliance,
      goal_achievement: goalAchievement,
      projects_completed: projectsCompleted,
      expense_exceeded: expenseExceeded,
      teamwork,
      initiative,
      communication,
      overall_score: overallScore,
      admin_rating: adminRating,
      notes: notes || null,
    } as any);

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'تنبيه', description: `تقييم ${evalMonth} ${evalYear} موجود بالفعل لهذا الموظف`, variant: 'destructive' });
      } else {
        console.error(error);
        toast({ title: 'خطأ', description: 'فشل في حفظ التقييم', variant: 'destructive' });
      }
    } else {
      toast({ title: '✅ تم الحفظ', description: `تم حفظ تقييم ${emp.name} لشهر ${evalMonth} ${evalYear}` });
      setShowForm(false);
      fetchHistory();
    }
    setSaving(false);
  };

  if (!emp) return <Layout><p className="text-foreground">الموظف غير موجود</p></Layout>;

  return (
    <Layout>
      <Link to="/employees" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowRight className="w-4 h-4" /> العودة للموظفين
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
            <span className="text-primary font-heading font-bold text-2xl">{emp.name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground">{emp.name}</h1>
            <p className="text-sm text-muted-foreground">{emp.position}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {emp.projects.map(p => (
                <span key={p} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">{p}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowHistory(!showHistory); setShowForm(false); }}>
            <History className="w-4 h-4 ml-1" /> السجل التاريخي
          </Button>
          <Button size="sm" onClick={() => { setShowForm(!showForm); setShowHistory(false); }}>
            <ClipboardCheck className="w-4 h-4 ml-1" /> تقييم جديد
          </Button>
        </div>
      </motion.div>

      {/* Evaluation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-gradient-card rounded-xl border border-primary/20 p-6 shadow-card">
              <h3 className="text-sm font-heading text-foreground mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" /> تقييم أداء الموظف — {emp.name}
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">الشهر</label>
                  <select value={evalMonth} onChange={e => setEvalMonth(e.target.value)}
                    className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">السنة</label>
                  <select value={evalYear} onChange={e => setEvalYear(Number(e.target.value))}
                    className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-5">
                <RatingSlider label="📋 الالتزام بالميزانية" value={budgetCompliance} onChange={setBudgetCompliance} />
                <RatingSlider label="🎯 تحقيق الأهداف" value={goalAchievement} onChange={setGoalAchievement} />
                <RatingSlider label="🤝 العمل الجماعي" value={teamwork} onChange={setTeamwork} />
                <RatingSlider label="💡 المبادرة" value={initiative} onChange={setInitiative} />
                <RatingSlider label="📢 التواصل" value={communication} onChange={setCommunication} />
                <RatingSlider label="⭐ التقييم الإداري" value={adminRating} onChange={setAdminRating} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">عدد المشاريع المنفذة</label>
                  <input type="number" min={0} max={20} value={projectsCompleted} onChange={e => setProjectsCompleted(Number(e.target.value))}
                    className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">هل تجاوز المصروف؟</label>
                  <button onClick={() => setExpenseExceeded(!expenseExceeded)}
                    className={`w-full rounded-lg px-3 py-2 text-sm border transition-all ${expenseExceeded ? 'bg-destructive/15 border-destructive/30 text-destructive' : 'bg-success/15 border-success/30 text-success'}`}>
                    {expenseExceeded ? 'نعم — تجاوز' : 'لا — ملتزم'}
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs text-muted-foreground mb-1 block">ملاحظات</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none"
                  placeholder="ملاحظات إضافية عن أداء الموظف..." />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">المعدل العام: </span>
                  <span className={`font-heading font-bold text-lg ${overallScore >= 7 ? 'text-success' : overallScore >= 5 ? 'text-warning' : 'text-destructive'}`}>
                    {overallScore}/10
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>إلغاء</Button>
                  <Button size="sm" onClick={handleSubmit} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
                    حفظ التقييم
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
              <h3 className="text-sm font-heading text-foreground mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> السجل التاريخي للتقييمات
              </h3>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد تقييمات سابقة</p>
              ) : (
                <div className="space-y-3">
                  {history.map((ev) => (
                    <div key={ev.id} className="bg-secondary/20 rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-heading text-foreground">{ev.evaluation_month} {ev.evaluation_year}</span>
                        <span className={`text-sm font-bold ${ev.overall_score >= 7 ? 'text-success' : ev.overall_score >= 5 ? 'text-warning' : 'text-destructive'}`}>
                          {ev.overall_score}/10
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center mb-2">
                        {[
                          { label: 'الميزانية', val: ev.budget_compliance },
                          { label: 'الأهداف', val: ev.goal_achievement },
                          { label: 'الفريق', val: ev.teamwork },
                          { label: 'المبادرة', val: ev.initiative },
                          { label: 'التواصل', val: ev.communication },
                          { label: 'إداري', val: ev.admin_rating },
                        ].map(item => (
                          <div key={item.label}>
                            <p className="text-[10px] text-muted-foreground">{item.label}</p>
                            <p className={`text-xs font-bold ${item.val >= 7 ? 'text-success' : item.val >= 5 ? 'text-warning' : 'text-destructive'}`}>{item.val}/10</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-4 text-[11px] text-muted-foreground">
                        <span>مشاريع: {ev.projects_completed}</span>
                        <span>تجاوز المصروف: {ev.expense_exceeded ? '⚠️ نعم' : '✅ لا'}</span>
                      </div>
                      {ev.notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{ev.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="الأداء العام" value={`${emp.performance}%`} icon={Target} delay={0}
          change={emp.performance >= 85 ? 'ممتاز' : emp.performance >= 70 ? 'جيد' : 'يحتاج تحسين'}
          changeType={emp.performance >= 85 ? 'positive' : emp.performance >= 70 ? 'neutral' : 'negative'} />
        <StatCard title="تحقيق الأهداف" value={`${emp.kpiAchievement}%`} icon={CheckCircle} delay={0.1} />
        <StatCard title="مساهمة في الربح" value={`${emp.profitContribution}%`} icon={TrendingUp} delay={0.2} />
        <StatCard title="التقييم الشهري" value={`${emp.monthlyRating}/10`} icon={Star} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4">الأداء الشهري</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={emp.monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,25%,18%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 10 }} />
              <YAxis domain={[50, 100]} tick={{ fill: 'hsl(215,15%,55%)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(222,40%,12%)', border: '1px solid hsl(222,25%,18%)', borderRadius: 8 }}
                labelStyle={{ color: 'hsl(210,20%,92%)' }} />
              <Line type="monotone" dataKey="score" name="الأداء" stroke="hsl(43,65%,55%)" strokeWidth={2} dot={{ fill: 'hsl(43,65%,55%)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Feedback */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-heading text-muted-foreground mb-4">تقييم النظام</h3>
          <div className={`p-4 rounded-lg mb-4 ${emp.performance >= 85 ? 'bg-success/10 border border-success/20' : emp.performance >= 70 ? 'bg-primary/10 border border-primary/20' : 'bg-destructive/10 border border-destructive/20'}`}>
            <p className="text-sm text-foreground leading-relaxed">{emp.feedback}</p>
          </div>

          {emp.achievements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Award className="w-3 h-3 text-primary" /> الإنجازات</h4>
              <div className="space-y-1.5">
                {emp.achievements.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <CheckCircle className="w-3 h-3 text-success mt-0.5 shrink-0" /><span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {emp.improvements.length > 0 && (
            <div>
              <h4 className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-warning" /> نقاط تحتاج تحسين</h4>
              <div className="space-y-1.5">
                {emp.improvements.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <AlertTriangle className="w-3 h-3 text-warning mt-0.5 shrink-0" /><span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
