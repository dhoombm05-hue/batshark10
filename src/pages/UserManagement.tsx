import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Shield, Trash2, Users, AlertCircle, Check, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
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

interface UserWithRole {
  user_id: string;
  display_name: string;
  department: string | null;
  job_title: string | null;
  role: AppRole | null;
}

export default function UserManagement() {
  const { isCEO } = useAuthContext();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('coo');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');

    if (profiles) {
      const mapped = profiles.map(p => ({
        user_id: p.user_id,
        display_name: p.display_name,
        department: p.department,
        job_title: p.job_title,
        role: roles?.find(r => r.user_id === p.user_id)?.role as AppRole | null ?? null,
      }));
      setUsers(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !displayName || !password) return;
    
    setCreating(true);

    // Use edge function to create user (CEO only)
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'create', email, password, display_name: displayName, role: selectedRole },
    });

    setCreating(false);

    if (error || data?.error) {
      toast({ title: 'خطأ', description: data?.error || error?.message || 'فشل إنشاء الحساب', variant: 'destructive' });
    } else {
      toast({ title: 'تم بنجاح', description: `تم إنشاء حساب ${displayName}` });
      setEmail(''); setDisplayName(''); setPassword('');
      fetchUsers();
    }
  };

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
            <h1 className="text-2xl font-heading font-black text-foreground">إدارة المستخدمين</h1>
            <p className="text-sm text-muted-foreground">إنشاء وإدارة حسابات الفريق والصلاحيات</p>
          </div>
        </div>

        {/* Create User Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[20px] border border-border p-6 shadow-card"
        >
          <h2 className="text-lg font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            إنشاء حساب جديد
          </h2>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم الكامل</label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="محمد بن تركي" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mohammed@batshark.com" className="rounded-xl" dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة مرور قوية" className="rounded-xl" dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الدور الوظيفي</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as AppRole)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'ceo').map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={creating} className="rounded-xl bg-gradient-to-r from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)]">
                {creating ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
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
          <h2 className="text-lg font-heading font-bold text-foreground mb-4">👥 أعضاء الفريق</h2>
          {loading ? (
            <p className="text-muted-foreground text-sm">جاري التحميل...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm">لا يوجد مستخدمون بعد</p>
          ) : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.user_id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-foreground text-sm">{u.display_name}</p>
                      <p className="text-xs text-muted-foreground">{u.department || 'بدون قسم'}</p>
                    </div>
                  </div>
                  {u.role && (
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
