import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Megaphone, TrendingUp, TrendingDown, Plus, Shield } from 'lucide-react';
import Layout from '@/components/Layout';
import { useProjects } from '@/hooks/useProjects';
import { formatCurrency, formatPercent } from '@/data/mockData';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-1">المشاريع</h1>
          <p className="text-sm text-muted-foreground">إدارة ومتابعة أداء جميع المشاريع</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={`/projects/${project.slug}`}
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
                  <span className={project.net_profit >= 0 ? 'text-success' : 'text-destructive'}>
                    {formatCurrency(project.net_profit)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">نسبة النمو</span>
                  <span className={`flex items-center gap-1 ${project.growth_rate >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {project.growth_rate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {formatPercent(project.growth_rate)}
                  </span>
                </div>
              </div>

              {/* Data Reliability Score */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3" /> موثوقية البيانات</span>
                  <span className={project.data_reliability_score >= 80 ? 'text-success' : project.data_reliability_score >= 50 ? 'text-warning' : 'text-destructive'}>
                    {project.data_reliability_score}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      project.data_reliability_score >= 80 ? 'bg-success' : project.data_reliability_score >= 50 ? 'bg-warning' : 'bg-destructive'
                    }`}
                    style={{ width: `${project.data_reliability_score}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{project.client_count.toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>{project.campaign_count} حملة</span>
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
