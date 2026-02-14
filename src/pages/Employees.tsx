import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Target, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import { employees } from '@/data/mockData';

export default function Employees() {
  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">الموظفين</h1>
        <p className="text-sm text-muted-foreground mb-6">إدارة الأداء وتقييم فريق العمل</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {employees.map((emp, i) => (
          <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}>
            <Link to={`/employees/${emp.id}`}
              className="block bg-gradient-card rounded-xl border border-border p-5 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300 group">
              
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-primary font-heading font-bold text-sm">{emp.name.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{emp.name}</h3>
                  <p className="text-xs text-muted-foreground">{emp.position}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mr-auto shrink-0" />
              </div>

              {/* Performance bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">الأداء العام</span>
                  <span className={`font-bold ${emp.performance >= 85 ? 'text-success' : emp.performance >= 70 ? 'text-primary' : 'text-destructive'}`}>
                    {emp.performance}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${emp.performance >= 85 ? 'bg-success' : emp.performance >= 70 ? 'bg-gradient-gold' : 'bg-destructive'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${emp.performance}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08 + 0.3 }}
                  />
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary" />{emp.monthlyRating}</span>
                <span className="flex items-center gap-1"><Target className="w-3 h-3" />{emp.kpiAchievement}%</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{emp.profitContribution}%</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
