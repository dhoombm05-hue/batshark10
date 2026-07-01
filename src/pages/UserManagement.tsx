import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Shield, Trash2, Users, User, Briefcase, DollarSign, Search, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { AppRole } from '@/hooks/useAuth';

const ROLE_LABELS: Record<AppRole, string> = {
  ceo: '👑 الرئيس التنفيذي',
  coo: '⚙️ مدير العمليات',
  strategic_director: '📊 المدير الاستراتيجي',
  marketing_director: '📣 مدير التسويق',
  tech_director: '💻 مدير التقنية',
};

const ROLE_COLORS: Record<AppRole, string> = {
  ceo: 'bg-gradient-to-r from-[hsl(43,65%,50%)] to-[hsl(38,72%,42%)] text-white',
  coo: 'bg-[hsl(210,80%,52%)] text-white',
  strategic_director: 'bg-[hsl(175,60%,38%)] text-white',
  marketing_director: 'bg-[hsl(25,85%,52%)] text-white',
  tech_director: 'bg-[hsl(270,60%,55%)] text-white',
};

const DEPARTMENTS = [
  'الإدارة العامة', 'التسويق', 'التقنية', 'المالية', 'العمليات',
  'الاستراتيجية', 'خدمة العملاء', 'الموارد البشرية',
];

interface UserWithRole {
  user_id: string;
  display_name: string;
  department: string | null;
  job_title: string | null;
  role: AppRole | null;
  avatar_url: string | null;
}

interface FormState {
  email: string;
  password: string;
  display_name: string;
  role: AppRole;
  position: string;
  job_title: string;
  department: string;
  age: number;
  experience: string;
  salary: number;
  bonus: number;
  avatar_url: string;
  admin_notes: string;
}

const EMPTY_FORM: FormState = {
  email: '', password: '', display_name: '',
  role: 'coo', position: '', job_title: '',
  department: 'الإدارة العامة', age: 30, experience: '1 سنة',
  salary: 0, bonus: 0, avatar_url: '', admin_notes: '',
};

export default function UserManagement() {
  const { isCEO } = useAuthContext();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const fetchUsers = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
    ]);
    if (profiles) {
      setUsers(profiles.map(p => ({
        user_id: p.user_id,
        display_name: p.display_name,
        department: p.department,
        job_title: p.job_title,
        avatar_url: p.avatar_url,
        role: roles?.find(r => r.user_id === p.user_id)?.role as AppRole | null ?? null,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.display_name || !form.password) {
      toast({ title: 'حقول ناقصة', description: 'الاسم والبريد وكلمة المرور مطلوبة', variant: 'destructive' });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: 'كلمة مرور ضعيفة', description: '٦ أحرف على الأقل', variant: 'destructive' });
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'create', ...form },
    });
    setCreating(false);
    if (error || data?.error) {
      toast({ title: 'خطأ', description: data?.error || error?.message || 'فشل الإنشاء', variant: 'destructive' });
    } else {
      toast({ title: '✅ تم إنشاء الموظف بالكامل', description: `${form.display_name} — حساب + ملف موظف + صلاحيات + سجل أداء` });
      setForm(EMPTY_FORM);
      fetchUsers();
    }
  };

  const handleDelete = async (user_id: string, name: string) => {
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'delete', user_id },
    });
    if (error || data?.error) {
      toast({ title: 'خطأ', description: data?.error || error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم الحذف', description: `تم حذف ${name}` });
      fetchUsers();
    }
  };

  const handleRoleChange = async (user_id: string, role: AppRole) => {
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'update_role', user_id, role },
    });
    if (error || data?.error) {
      toast({ title: 'خطأ', description: data?.error || error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم تحديث الدور' });
      fetchUsers();
    }
  };

  const filtered = users.filter(u =>
    !search || u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase()));

  if (!isCEO) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-heading font-bold text-foreground">غير مصرح</h2>
            <p className="text-muted-foreground mt-2">هذه الصفحة متاحة للرئيس التنفيذي فقط</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[hsl(43,65%,50%)] to-[hsl(38,72%,42%)] text-white shadow-gold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-black text-foreground">إدارة الموظفين والمستخدمين</h1>
            <p className="text-sm text-muted-foreground">إنشاء حساب متكامل: تسجيل دخول + ملف موظف + صلاحيات + سجل أداء تلقائياً</p>
          </div>
        </div>

        {/* Create Employee Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[20px] border border-border shadow-card overflow-hidden"
        >
          <div className="p-5 border-b border-border bg-gradient-to-l from-primary/5 to-transparent">
            <h2 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              تسجيل موظف جديد — احترافي
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              سيتم إنشاء: حساب دخول موثق + بروفايل شخصي + سجل موظف في نظام الموارد البشرية + دور صلاحية + سجل أداء ابتدائي
            </p>
          </div>

          <form onSubmit={handleCreate} className="p-6 space-y-6">
            {/* Section: Identity */}
            <section>
              <h3 className="text-xs font-heading font-bold text-primary mb-3 flex items-center gap-2 uppercase tracking-wide">
                <User className="w-4 h-4" /> الهوية والدخول
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="الاسم الكامل *">
                  <Input value={form.display_name} onChange={e => set('display_name', e.target.value)} placeholder="محمد بن تركي" className="rounded-xl" />
                </Field>
                <Field label="البريد الإلكتروني *">
                  <Input type="email" dir="ltr" value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@batshark.com" className="rounded-xl" />
                </Field>
                <Field label="كلمة المرور *">
                  <Input type="password" dir="ltr" value={form.password} onChange={e => set('password', e.target.value)} placeholder="6 أحرف على الأقل" className="rounded-xl" />
                </Field>
                <Field label="رابط الصورة (اختياري)">
                  <Input dir="ltr" value={form.avatar_url} onChange={e => set('avatar_url', e.target.value)} placeholder="https://..." className="rounded-xl" />
                </Field>
              </div>
            </section>

            {/* Section: Role */}
            <section>
              <h3 className="text-xs font-heading font-bold text-primary mb-3 flex items-center gap-2 uppercase tracking-wide">
                <Shield className="w-4 h-4" /> الدور والصلاحية
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'ceo').map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('role', val as AppRole)}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      form.role === val
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/50'
                    }`}
                  >{label}</button>
                ))}
              </div>
            </section>

            {/* Section: Job */}
            <section>
              <h3 className="text-xs font-heading font-bold text-primary mb-3 flex items-center gap-2 uppercase tracking-wide">
                <Briefcase className="w-4 h-4" /> البيانات الوظيفية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="المسمى الوظيفي">
                  <Input value={form.position} onChange={e => set('position', e.target.value)} placeholder="مدير تسويق" className="rounded-xl" />
                </Field>
                <Field label="اللقب الوظيفي">
                  <Input value={form.job_title} onChange={e => set('job_title', e.target.value)} placeholder="Director" className="rounded-xl" />
                </Field>
                <Field label="القسم">
                  <select
                    value={form.department}
                    onChange={e => set('department', e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="العمر">
                  <Input type="number" min={18} max={80} value={form.age} onChange={e => set('age', +e.target.value)} className="rounded-xl" />
                </Field>
                <Field label="الخبرة">
                  <Input value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="5 سنوات" className="rounded-xl" />
                </Field>
              </div>
            </section>

            {/* Section: Compensation */}
            <section>
              <h3 className="text-xs font-heading font-bold text-primary mb-3 flex items-center gap-2 uppercase tracking-wide">
                <DollarSign className="w-4 h-4" /> الراتب والمكافآت
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="الراتب الأساسي (ر.س)">
                  <Input type="number" min={0} value={form.salary} onChange={e => set('salary', +e.target.value)} className="rounded-xl" />
                </Field>
                <Field label="المكافأة الشهرية (ر.س)">
                  <Input type="number" min={0} value={form.bonus} onChange={e => set('bonus', +e.target.value)} className="rounded-xl" />
                </Field>
              </div>
            </section>

            {/* Section: Notes */}
            <section>
              <Field label="ملاحظات إدارية (اختياري)">
                <Textarea value={form.admin_notes} onChange={e => set('admin_notes', e.target.value)} rows={3} placeholder="أي ملاحظات خاصة عن الموظف..." className="rounded-xl" />
              </Field>
            </section>

            <div className="flex gap-3 pt-2 border-t border-border">
              <Button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-gradient-to-r from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)] gap-2"
              >
                <Save className="w-4 h-4" />
                {creating ? 'جاري الإنشاء الكامل...' : 'إنشاء الموظف'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setForm(EMPTY_FORM)} className="rounded-xl">
                إعادة تعيين
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Users List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-[20px] border border-border p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-lg font-heading font-bold text-foreground">👥 الفريق ({users.length})</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="rounded-xl pr-9 w-64" />
            </div>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-sm">جاري التحميل...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا يوجد نتائج</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(u => (
                <div key={u.user_id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.display_name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-foreground text-sm truncate">{u.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.job_title || u.department || 'موظف'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.role !== 'ceo' && (
                      <select
                        value={u.role || 'coo'}
                        onChange={e => handleRoleChange(u.user_id, e.target.value as AppRole)}
                        className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                      >
                        {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'ceo').map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    )}
                    {u.role && (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    )}
                    {u.role !== 'ceo' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف {u.display_name}؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم حذف الحساب وملف الموظف بشكل نهائي. لا يمكن التراجع.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(u.user_id, u.display_name)}
                              className="bg-destructive text-destructive-foreground"
                            >حذف نهائي</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
