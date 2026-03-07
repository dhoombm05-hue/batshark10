import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Target, TrendingUp, Users, Loader2, RotateCcw, Archive, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import Layout from '@/components/Layout';
import PrintButton from '@/components/PrintButton';
import { useEmployees, useUploadEmployeeAvatar } from '@/hooks/useEmployees';
import { usePerformanceScoring } from '@/hooks/usePerformanceScoring';
import { usePerformanceCycles, useResetPerformanceCycle } from '@/hooks/usePerformanceCycles';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/data/mockData';

export default function Employees() {
  const { data: employees, isLoading } = useEmployees();
  const { data: perfScores } = usePerformanceScoring();
  const { data: cycles } = usePerformanceCycles();
  const resetCycle = useResetPerformanceCycle();
  const uploadAvatar = useUploadEmployeeAvatar();
  const [showArchive, setShowArchive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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

  const handleResetCycle = () => {
    if (!perfScores || perfScores.length === 0) return;
    if (!confirm('هل تريد أرشفة الدورة الحالية وبدء دورة جديدة من الصفر؟')) return;

    resetCycle.mutate(
      perfScores.map(ps => ({
        userId: ps.userId,
        displayName: ps.displayName,
        totalActions: ps.totalActions,
        updates: ps.updates,
        creates: ps.creates,
        deletes: ps.deletes,
        financialImpact: ps.financialImpact,
        score: ps.score,
        cycleStart: ps.cycleStart,
      }))
    );
  };

  const handleAvatarUpload = async (employeeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(employeeId);
    await uploadAvatar.mutateAsync({ employeeId, file });
    setUploadingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Layout>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
        if (uploadingId) handleAvatarUpload(uploadingId, e);
      }} />

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

      {/* Auto Performance Scoring — Current Cycle */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="mb-6 bg-card rounded-xl border border-section-employees/15 p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-heading text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-section-employees" /> تقييم أداء — الدورة الحالية
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowArchive(!showArchive)} className="text-xs">
              <Archive className="w-3.5 h-3.5 ml-1" />
              سجل الدورات ({cycles?.length || 0})
              {showArchive ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            </Button>
            <Button size="sm" onClick={handleResetCycle}
              disabled={resetCycle.isPending || !perfScores || perfScores.length === 0}
              className="bg-section-employees hover:bg-section-employees/90 text-white text-xs">
              <RotateCcw className="w-3.5 h-3.5 ml-1" />
              {resetCycle.isPending ? 'جاري...' : 'تحديث الدورة / إعادة احتساب'}
            </Button>
          </div>
        </div>

        {perfScores && perfScores.length > 0 ? (
          <div className="space-y-2">
            {perfScores.map((ps) => (
              <div key={ps.userId} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/20 border border-border">
                <span className="w-6 h-6 rounded-full bg-section-employees/15 flex items-center justify-center text-[10px] font-bold text-section-employees">
                  #{ps.rank}
                </span>
                <span className="text-xs font-medium text-foreground flex-1">{ps.displayName}</span>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span>عمليات: <b className="text-foreground">{ps.totalActions}</b></span>
                  <span>تأثير مالي: <b className="text-foreground">{ps.financialImpact > 0 ? formatCurrency(ps.financialImpact) : '0'}</b></span>
                </div>
                <div className="w-20">
                  <div className="flex justify-between text-[9px] mb-0.5">
                    <span className="text-muted-foreground">النقاط</span>
                    <span className={`font-bold ${ps.score >= 70 ? 'text-success' : ps.score >= 40 ? 'text-warning' : 'text-muted-foreground'}`}>{ps.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${ps.score >= 70 ? 'bg-success' : ps.score >= 40 ? 'bg-warning' : 'bg-muted-foreground'}`}
                      style={{ width: `${ps.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">لا توجد عمليات في الدورة الحالية — سيبدأ الاحتساب من أول نشاط جديد</p>
        )}
      </motion.div>

      {/* Archived Cycles */}
      <AnimatePresence>
        {showArchive && cycles && cycles.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="bg-card rounded-xl border border-border p-5 shadow-card">
              <h3 className="text-sm font-heading text-foreground mb-3 flex items-center gap-2">
                <Archive className="w-4 h-4 text-muted-foreground" /> سجل دورات الأداء المؤرشفة
              </h3>
              <div className="space-y-3">
                {(() => {
                  const grouped = new Map<string, typeof cycles>();
                  for (const c of cycles) {
                    const key = c.cycle_end;
                    if (!grouped.has(key)) grouped.set(key, []);
                    grouped.get(key)!.push(c);
                  }
                  return Array.from(grouped.entries()).map(([endDate, group]) => (
                    <div key={endDate} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-foreground">
                          دورة: {new Date(group[0].cycle_start).toLocaleDateString('ar-SA')} → {new Date(endDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {group.map(c => (
                          <div key={c.id} className="flex items-center gap-2 text-[11px] p-1.5 rounded bg-secondary/20">
                            <span className="text-foreground font-medium flex-1">{c.display_name}</span>
                            <span className="text-muted-foreground">عمليات: {c.total_actions}</span>
                            <span className="text-muted-foreground">تأثير: {formatCurrency(c.financial_impact)}</span>
                            <span className={`font-bold ${c.final_score >= 70 ? 'text-success' : c.final_score >= 40 ? 'text-warning' : 'text-destructive'}`}>
                              {c.final_score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {empList.map((emp, i) => (
          <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}>
            <Link to={`/employees/${emp.slug}`}
              className="block bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-elevated hover:border-section-employees/30 transition-all duration-300 group">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 shrink-0">
                  {emp.avatar_url ? (
                    <img src={emp.avatar_url} alt={emp.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-section-employees/20" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-section-employees/15 flex items-center justify-center ring-2 ring-section-employees/20">
                      <Users className="w-5 h-5 text-section-employees" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setUploadingId(emp.id);
                      fileInputRef.current?.click();
                    }}
                    className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    {uploadingId === emp.id && uploadAvatar.isPending ? (
                      <Loader2 className="w-3 h-3 text-primary-foreground animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3 text-primary-foreground" />
                    )}
                  </button>
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
