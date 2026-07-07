import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Award, AlertTriangle, CheckCircle, Target, TrendingUp, Star, ClipboardCheck, History, Loader2, Pencil, Users, Briefcase, Calendar, DollarSign, Save, X, Camera, Video, Download, Upload, Trash2, RotateCcw, ShieldCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '@/components/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import PrintButton from '@/components/PrintButton';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmployee, useEmployeeMonthlyPerformance, useUpdateEmployee, useUploadEmployeeAvatar } from '@/hooks/useEmployees';
import { useEmployeeEngine } from '@/hooks/useEmployeeEngine';
import EmployeeGovernanceTab from '@/components/EmployeeGovernanceTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

const InfoField = ({ label, value, icon: Icon, editing, onChange, onSave }: {
  label: string; value: string; icon: any; editing: boolean; onChange?: (v: string) => void; onSave?: () => void;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
    <div className="p-2 rounded-lg bg-section-employees/10">
      <Icon className="w-4 h-4 text-section-employees" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {editing && onChange ? (
        <input value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent border-b border-section-employees/30 text-sm text-foreground font-medium focus:outline-none" />
      ) : (
        <p className="text-sm text-foreground font-medium truncate">{value}</p>
      )}
    </div>
  </div>
);

export default function EmployeeDetail() {
  const { id } = useParams();
  const { isCEO } = useAuthContext();
  const { data: emp, isLoading: loadingEmp } = useEmployee(id || '');
  const { data: monthlyPerf } = useEmployeeMonthlyPerformance(emp?.id || '');
  const updateEmployee = useUpdateEmployee();
  const uploadAvatar = useUploadEmployeeAvatar();
  const { recalculateEmployee } = useEmployeeEngine();
  const { toast } = useToast();
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [history, setHistory] = useState<EvalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable profile fields - initialized from DB
  const [profileData, setProfileData] = useState({
    name: '', position: '', age: '', department: '', experience: '', salary: '', bonus: '', adminNotes: '',
  });

  // Sync profile data when employee loads from DB
  useEffect(() => {
    if (emp) {
      setProfileData({
        name: emp.name,
        position: emp.position,
        age: String(emp.age),
        department: emp.department,
        experience: emp.experience,
        salary: String(emp.salary),
        bonus: String(emp.bonus),
        adminNotes: emp.admin_notes || emp.feedback || '',
      });
    }
  }, [emp]);

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
      .eq('employee_id', emp.slug)
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !emp) return;
    setVideoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `employees/${emp.id}-video.${ext}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      const videoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await updateEmployee.mutateAsync({ id: emp.id, field: 'video_url', value: videoUrl, oldValue: (emp as any).video_url || null });
      toast({ title: '✅ تم رفع الفيديو بنجاح' });
    } catch {
      toast({ title: '❌ فشل رفع الفيديو', variant: 'destructive' });
    } finally {
      setVideoUploading(false);
      if (videoFileRef.current) videoFileRef.current.value = '';
    }
  };

  const handleDeleteVideo = async () => {
    if (!emp) return;
    await updateEmployee.mutateAsync({ id: emp.id, field: 'video_url', value: null, oldValue: (emp as any).video_url });
    toast({ title: '🗑️ تم حذف الفيديو' });
  };

  const handleSaveProfile = async () => {
    if (!emp) return;
    const updates: { field: string; value: any; oldValue: any }[] = [];
    
    if (profileData.name !== emp.name) updates.push({ field: 'name', value: profileData.name, oldValue: emp.name });
    if (profileData.position !== emp.position) updates.push({ field: 'position', value: profileData.position, oldValue: emp.position });
    // Compare as numbers to avoid "25" !== 25 false-positives
    if (Number(profileData.age) !== Number(emp.age)) updates.push({ field: 'age', value: Number(profileData.age), oldValue: emp.age });
    if (profileData.department !== emp.department) updates.push({ field: 'department', value: profileData.department, oldValue: emp.department });
    if (profileData.experience !== emp.experience) updates.push({ field: 'experience', value: profileData.experience, oldValue: emp.experience });
    if (Number(profileData.salary) !== Number(emp.salary)) updates.push({ field: 'salary', value: Number(profileData.salary), oldValue: emp.salary });
    if (Number(profileData.bonus) !== Number(emp.bonus)) updates.push({ field: 'bonus', value: Number(profileData.bonus), oldValue: emp.bonus });
    if (profileData.adminNotes !== (emp.admin_notes || emp.feedback || '')) updates.push({ field: 'admin_notes', value: profileData.adminNotes, oldValue: emp.admin_notes });

    if (updates.length === 0) {
      setEditingProfile(false);
      return;
    }

    setSaving(true);
    try {
      for (const u of updates) {
        await updateEmployee.mutateAsync({ id: emp.id, field: u.field, value: u.value, oldValue: u.oldValue });
      }
      toast({ title: '✅ تم الحفظ', description: 'تم حفظ بيانات الموظف في قاعدة البيانات بنجاح' });
      setEditingProfile(false);
    } catch {
      toast({ title: '❌ خطأ', description: 'فشل حفظ البيانات، حاول مرة أخرى', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!emp) return;
    setSaving(true);
    const { error } = await supabase.from('employee_evaluations').insert({
      employee_id: emp.slug,
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
        toast({ title: 'تنبيه', description: `تقييم ${evalMonth} ${evalYear} موجود بالفعل`, variant: 'destructive' });
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

  if (loadingEmp) {
    return <Layout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-section-employees" /></div></Layout>;
  }

  if (!emp) return <Layout><p className="text-foreground">الموظف غير موجود</p></Layout>;

  const chartData = monthlyPerf?.map(m => ({ month: m.month, score: m.score })) || [];

  return (
    <Layout>
      <Link to="/employees" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-section-employees transition-colors mb-4">
        <ArrowRight className="w-4 h-4" /> العودة للموظفين
      </Link>

      {/* Header with prominent avatar */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-section-employees/20 shadow-card mb-6 overflow-hidden">
        {/* Banner background */}
        <div className="h-28 bg-gradient-to-l from-[hsl(25,85%,52%/0.2)] via-[hsl(38,92%,50%/0.1)] to-[hsl(210,80%,52%/0.1)] relative" />
        
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex items-end gap-4 flex-wrap">
            {/* Large Avatar */}
            <div className="relative group">
              {emp.avatar_url ? (
                <img src={emp.avatar_url} alt={emp.name}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-card shadow-elevated" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[hsl(25,85%,52%)] to-[hsl(38,92%,50%)] flex items-center justify-center ring-4 ring-card shadow-elevated">
                  <Users className="w-10 h-10 text-white" />
                </div>
              )}
              {isCEO && (
                <button
                  onClick={() => avatarFileRef.current?.click()}
                  className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  {uploadAvatar.isPending ? (
                    <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-primary-foreground" />
                  )}
                </button>
              )}
              {isCEO && (
                <input ref={avatarFileRef} type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && emp) await uploadAvatar.mutateAsync({ employeeId: emp.id, file });
                  }} />
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-heading font-bold text-foreground">{profileData.name}</h1>
              <p className="text-sm text-section-employees font-medium">{profileData.position}</p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {(emp.projects || []).map(p => (
                  <span key={p} className="text-[10px] bg-section-employees/10 text-section-employees px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" 
                onClick={() => recalculateEmployee.mutate({ employeeId: emp.id, employeeSlug: emp.slug, employeeName: emp.name })}
                disabled={recalculateEmployee.isPending}>
                {recalculateEmployee.isPending ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <RotateCcw className="w-4 h-4 ml-1" />}
                إعادة احتساب
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowVideo(!showVideo)}>
                <Video className="w-4 h-4 ml-1" /> الفيديو
              </Button>
              <PrintButton title={`طباعة تقرير ${emp.name}`} />
              {isCEO && (
                <Button variant="outline" size="sm" onClick={() => {
                  if (editingProfile) {
                    handleSaveProfile();
                  } else {
                    setEditingProfile(true);
                  }
                }}
                  className={editingProfile ? 'border-section-employees/30 text-section-employees' : ''}>
                  {editingProfile ? <><Save className="w-4 h-4 ml-1" /> حفظ</> : <><Pencil className="w-4 h-4 ml-1" /> تعديل</>}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setShowHistory(!showHistory); setShowForm(false); }}>
                <History className="w-4 h-4 ml-1" /> السجل
              </Button>
              {isCEO && (
                <Button size="sm" className="bg-section-employees hover:bg-section-employees/90 text-white"
                  onClick={() => { setShowForm(!showForm); setShowHistory(false); }}>
                  <ClipboardCheck className="w-4 h-4 ml-1" /> تقييم جديد
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Video Section */}
      <AnimatePresence>
        {showVideo && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="bg-card rounded-xl border border-section-employees/20 p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-heading text-foreground flex items-center gap-2">
                  <Video className="w-4 h-4 text-section-employees" /> فيديو الموظف — {emp.name}
                </h3>
                {isCEO && (
                  <div className="flex gap-2">
                    <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    <Button variant="outline" size="sm" onClick={() => videoFileRef.current?.click()} disabled={videoUploading}>
                      {videoUploading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Upload className="w-4 h-4 ml-1" />}
                      رفع فيديو
                    </Button>
                    {(emp as any).video_url && (
                      <Button variant="outline" size="sm" className="text-destructive" onClick={handleDeleteVideo}>
                        <Trash2 className="w-4 h-4 ml-1" /> حذف
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {(emp as any).video_url ? (
                <div>
                  <video controls className="w-full max-h-96 rounded-lg bg-black" src={(emp as any).video_url} />
                  <div className="mt-3 flex justify-end">
                    <a href={(emp as any).video_url} download target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 ml-1" /> تحميل الفيديو
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Video className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">لا يوجد فيديو — ارفع فيديو تعريفي للموظف</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editable Profile Info - from DB */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <InfoField label="العمر" value={profileData.age} icon={Calendar} editing={editingProfile && isCEO}
          onChange={v => setProfileData(p => ({ ...p, age: v }))} />
        <InfoField label="القسم" value={profileData.department} icon={Briefcase} editing={editingProfile && isCEO}
          onChange={v => setProfileData(p => ({ ...p, department: v }))} />
        <InfoField label="سنوات الخبرة" value={profileData.experience} icon={Award} editing={editingProfile && isCEO}
          onChange={v => setProfileData(p => ({ ...p, experience: v }))} />
        <InfoField label="الراتب" value={profileData.salary} icon={DollarSign} editing={editingProfile && isCEO}
          onChange={v => setProfileData(p => ({ ...p, salary: v }))} />
      </motion.div>

      {/* CEO-only: Login credentials + password reset */}
      {isCEO && (
        <CredentialsCard emp={emp} />
      )}

      {/* Evaluation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="bg-card rounded-xl border border-section-employees/20 p-6 shadow-card">
              <h3 className="text-sm font-heading text-foreground mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-section-employees" /> تقييم أداء — {emp.name}
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
                  placeholder="ملاحظات إضافية..." />
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
                  <Button size="sm" className="bg-section-employees hover:bg-section-employees/90 text-white" onClick={handleSubmit} disabled={saving}>
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
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="bg-card rounded-xl border border-border p-5 shadow-card">
              <h3 className="text-sm font-heading text-foreground mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-section-employees" /> السجل التاريخي للتقييمات
              </h3>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-section-employees" /></div>
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

      {/* Tabs: Profile & Governance */}
      <Tabs defaultValue="profile" dir="rtl">
        <TabsList className="mb-6 bg-card border border-border">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-section-employees/15 data-[state=active]:text-section-employees">
            <Users className="w-4 h-4" /> الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="governance" className="gap-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <ShieldCheck className="w-4 h-4" /> حوكمة الأداء الشاملة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {/* Stats from DB */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: 'الأداء العام', value: `${emp.performance}%`, icon: Target, color: emp.performance >= 85 ? 'text-success' : 'text-section-employees' },
              { title: 'تحقيق الأهداف', value: `${emp.kpi_achievement}%`, icon: CheckCircle, color: 'text-primary' },
              { title: 'مساهمة في الربح', value: `${emp.profit_contribution}%`, icon: TrendingUp, color: 'text-success' },
              { title: 'التقييم الشهري', value: `${emp.monthly_rating}/10`, icon: Star, color: 'text-gold' },
            ].map((stat, i) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                className="bg-card rounded-xl border border-border p-4 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-[10px] text-muted-foreground">{stat.title}</span>
                </div>
                <p className={`text-xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance Chart from DB */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-card rounded-xl border border-border p-5 shadow-card">
              <h3 className="text-sm font-heading text-foreground mb-4">📈 الأداء الشهري</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 48%)', fontSize: 10 }} />
                  <YAxis domain={[50, 100]} tick={{ fill: 'hsl(220, 10%, 48%)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 15% 88%)', borderRadius: 12 }} />
                  <Line type="monotone" dataKey="score" name="الأداء" stroke="hsl(25, 85%, 52%)" strokeWidth={2.5} dot={{ fill: 'hsl(25, 85%, 52%)', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Feedback & Achievements from DB */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-card rounded-xl border border-border p-5 shadow-card">
              <h3 className="text-sm font-heading text-foreground mb-4">📝 تقييم النظام</h3>

              <div className={`p-4 rounded-lg mb-4 ${emp.performance >= 85 ? 'bg-success/10 border border-success/20' : emp.performance >= 70 ? 'bg-section-employees/10 border border-section-employees/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                {editingProfile && isCEO ? (
                  <textarea value={profileData.adminNotes} onChange={e => setProfileData(p => ({ ...p, adminNotes: e.target.value }))}
                    className="w-full bg-transparent text-sm text-foreground resize-none focus:outline-none" rows={3} />
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">{profileData.adminNotes}</p>
                )}
              </div>

              {(emp.achievements || []).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Award className="w-3 h-3 text-section-employees" /> الإنجازات</h4>
                  <div className="space-y-1.5">
                    {emp.achievements.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                        <CheckCircle className="w-3 h-3 text-success mt-0.5 shrink-0" /><span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(emp.improvements || []).length > 0 && (
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
        </TabsContent>

        <TabsContent value="governance">
          <EmployeeGovernanceTab employeeName={emp.name} />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}

// ============================================================
// CEO-only: Login credentials card with password reset dialog
// ============================================================
function CredentialsCard({ emp }: { emp: any }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [displayedPassword, setDisplayedPassword] = useState(emp.login_password || '');
  const [displayedEmail, setDisplayedEmail] = useState(emp.login_email || '');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setDisplayedPassword(emp.login_password || '');
    setDisplayedEmail(emp.login_email || '');
  }, [emp.login_password, emp.login_email]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('employee_id', emp.id)
        .maybeSingle();
      if (data) setUserId((data as any).user_id);
    })();
  }, [emp.id]);

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'كلمة المرور قصيرة', description: '6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    if (!userId) {
      toast({ title: 'لا يوجد حساب مرتبط بهذا الموظف', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'reset_password', user_id: userId, employee_id: emp.id, new_password: newPassword },
      });
      if (error) throw error;
      setDisplayedPassword(newPassword);
      toast({ title: '✅ تم تحديث كلمة المرور بنجاح' });
      setOpen(false);
      setNewPassword('');
    } catch (e: any) {
      toast({ title: '❌ فشل التحديث', description: e?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const generateStrong = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let out = '';
    for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(out);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
      className="mb-6 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-transparent p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <ShieldCheck className="w-5 h-5 text-amber-500" />
        <h3 className="font-heading font-black text-foreground">بيانات الدخول</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold">مرئي للرئيس فقط</span>
        <div className="mr-auto">
          <Button size="sm" variant="outline" onClick={() => setOpen(!open)}
            className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
            <Pencil className="w-3.5 h-3.5 ml-1" /> تغيير كلمة المرور
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-background/60 border border-border">
          <p className="text-[10px] text-muted-foreground mb-1">البريد الإلكتروني</p>
          <div className="flex items-center justify-between gap-2">
            <code dir="ltr" className="text-sm font-mono text-foreground truncate">{displayedEmail || '—'}</code>
            {displayedEmail && (
              <button onClick={() => { navigator.clipboard.writeText(displayedEmail); toast({ title: 'تم النسخ' }); }}
                className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/70">نسخ</button>
            )}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-background/60 border border-border">
          <p className="text-[10px] text-muted-foreground mb-1">كلمة المرور</p>
          <div className="flex items-center justify-between gap-2">
            <code dir="ltr" className="text-sm font-mono text-foreground truncate">{displayedPassword || '—'}</code>
            {displayedPassword && (
              <button onClick={() => { navigator.clipboard.writeText(displayedPassword); toast({ title: 'تم النسخ' }); }}
                className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/70">نسخ</button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 rounded-xl border-2 border-amber-500/40 bg-background/70">
          <p className="text-xs text-muted-foreground mb-2">أدخل كلمة مرور جديدة (6 أحرف على الأقل):</p>
          <div className="flex gap-2 flex-wrap">
            <input dir="ltr" type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              className="flex-1 min-w-[200px] bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono" />
            <Button size="sm" variant="outline" onClick={generateStrong}>توليد قوية</Button>
            <Button size="sm" onClick={resetPassword} disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-black">
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}
              حفظ
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setNewPassword(''); }}>إلغاء</Button>
          </div>
          {!userId && (
            <p className="text-[11px] text-destructive mt-2">⚠️ هذا الموظف غير مرتبط بحساب دخول في النظام.</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
