import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Megaphone, TrendingUp, TrendingDown } from 'lucide-react';
import Layout from '@/components/Layout';
import { projects, formatCurrency, formatPercent } from '@/data/mockData';

export default function Projects() {
  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">المشاريع</h1>
        <p className="text-sm text-muted-foreground mb-6">إدارة ومتابعة أداء جميع المشاريع</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={`/projects/${project.id}`}
              className="block bg-gradient-card rounded-xl border border-border p-6 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">صافي الربح</span>
                  <span className={project.netProfit >= 0 ? 'text-success' : 'text-destructive'}>
                    {formatCurrency(project.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">نسبة النمو</span>
                  <span className={`flex items-center gap-1 ${project.growthRate >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {project.growthRate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {formatPercent(project.growthRate)}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{project.clientCount.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>{project.campaignCount} حملة</span>
                </div>
              </div>

              <div className="mt-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  project.status === 'profitable' ? 'bg-success/15 text-success' :
                  project.status === 'loss' ? 'bg-destructive/15 text-destructive' :
                  'bg-warning/15 text-warning'
                }`}>
                  {project.status === 'profitable' ? 'مربح' : project.status === 'loss' ? 'خسارة' : 'تعادل'}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
