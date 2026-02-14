import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Award, AlertTriangle, CheckCircle, Target, TrendingUp, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { employees } from '@/data/mockData';

export default function EmployeeDetail() {
  const { id } = useParams();
  const emp = employees.find(e => e.id === id);
  if (!emp) return <Layout><p className="text-foreground">الموظف غير موجود</p></Layout>;

  return (
    <Layout>
      <Link to="/employees" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowRight className="w-4 h-4" /> العودة للموظفين
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
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
      </motion.div>

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
                    <CheckCircle className="w-3 h-3 text-success mt-0.5 shrink-0" />
                    <span>{a}</span>
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
                    <AlertTriangle className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                    <span>{a}</span>
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
