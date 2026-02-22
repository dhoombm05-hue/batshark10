import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Target, TrendingUp, Plus, Users, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import PrintButton from '@/components/PrintButton';
import { useEmployees } from '@/hooks/useEmployees';
import { usePerformanceScoring } from '@/hooks/usePerformanceScoring';
import { Button } from '@/components/ui/button';

export default function Employees() {
  const { data: employees, isLoading } = useEmployees();
  const { data: perfScores } = usePerformanceScoring();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-section-employees" />
        </div>
      </Layout>
    );
  }

  const empList = employees || [];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-section-employees/15">
              <Users className="w-6 h-6 text-section-employees" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">الموظفين</h1>
              <p className="text-sm text-muted-foreground">إدارة الأداء وتقييم فريق العمل</p>
            </div>
          </div>
          <div className="flex gap-2">
            <PrintButton title="طباعة تقرير الموظفين" />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'عدد الموظفين', value: empList.length, color: 'text-section-employees' },
          { label: 'متوسط الأداء', value: empList.length > 0 ? `${Math.round(empList.reduce((s, e) => s + e.performance, 0) / empList.length)}%` : '0%', color: 'text-success' },
          { label: 'أعلى أداء', value: empList.length > 0 ? empList.reduce((best, e) => e.performance > best.performance ? e : best).name.split(' ')[0] : '-', color: 'text-primary' },
          { label: 'المشاريع المسندة', value: new Set(empList.flatMap(e => e.projects || [])).size, color: 'text-gold' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-section-employees/15 p-4 shadow-card">
            <p className="text-[10px] text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-lg font-heading font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Auto Performance Scoring */}
      {perfScores && perfScores.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-6 bg-card rounded-xl border border-section-employees/15 p-5 shadow-card">
          <h3 className="text-sm font-heading text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-section-employees" /> تقييم أداء تلقائي (من سجل النشاط)
          </h3>
          <div className="space-y-2">
            {perfScores.map((ps) => (
              <div key={ps.userId} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/20 border border-border">
                <span className="w-6 h-6 rounded-full bg-section-employees/15 flex items-center justify-center text-[10px] font-bold text-section-employees">
                  #{ps.rank}
                </span>
                <span className="text-xs font-medium text-foreground flex-1">{ps.displayName}</span>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span>أسبوعي: <b className="text-foreground">{ps.weeklyActions}</b></span>
                  <span>شهري: <b className="text-foreground">{ps.monthlyActions}</b></span>
                  <span>إجمالي: <b className="text-foreground">{ps.totalActions}</b></span>
                </div>
                <div className="w-16">
                  <div className="flex justify-between text-[9px] mb-0.5">
                    <span className="text-muted-foreground">النقاط</span>
                    <span className={`font-bold ${ps.score >= 70 ? 'text-success' : ps.score >= 40 ? 'text-warning' : 'text-destructive'}`}>{ps.score}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${ps.score >= 70 ? 'bg-success' : ps.score >= 40 ? 'bg-warning' : 'bg-destructive'}`}
                      style={{ width: `${ps.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {empList.map((emp, i) => (
          <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}>
            <Link to={`/employees/${emp.slug}`}
              className="block bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-elevated hover:border-section-employees/30 transition-all duration-300 group">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-section-employees/15 flex items-center justify-center shrink-0 ring-2 ring-section-employees/20">
                  <span className="text-section-employees font-heading font-bold text-sm">{emp.name.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-bold text-sm text-foreground group-hover:text-section-employees transition-colors truncate">{emp.name}</h3>
                  <p className="text-xs text-muted-foreground">{emp.position}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-section-employees transition-colors shrink-0" />
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {(emp.projects || []).map(p => (
                  <span key={p} className="text-[9px] bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">{p}</span>
                ))}
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">الأداء العام</span>
                  <span className={`font-bold ${emp.performance >= 85 ? 'text-success' : emp.performance >= 70 ? 'text-section-employees' : 'text-destructive'}`}>
                    {emp.performance}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${emp.performance >= 85 ? 'bg-success' : emp.performance >= 70 ? 'bg-section-employees' : 'bg-destructive'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${emp.performance}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08 + 0.3 }}
                  />
                </div>
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold" />{emp.monthly_rating}</span>
                <span className="flex items-center gap-1"><Target className="w-3 h-3 text-section-employees" />{emp.kpi_achievement}%</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-success" />{emp.profit_contribution}%</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
