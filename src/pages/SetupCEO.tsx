import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from '@/assets/batshark-logo-main.png';

export default function SetupCEO() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadySetup, setAlreadySetup] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if CEO already exists
    supabase.from('user_roles').select('*').eq('role', 'ceo').then(({ data }) => {
      if (data && data.length > 0) setAlreadySetup(true);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError('يرجى تعبئة جميع الحقول');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setError('');
    setSubmitting(true);

    const { data, error: fnError } = await supabase.functions.invoke('setup-ceo', {
      body: { email, password, display_name: displayName },
    });

    setSubmitting(false);
    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || 'حدث خطأ');
    } else {
      navigate('/login');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background-gradient)' }}>
        <motion.img src={logo} alt="" className="w-16 h-16" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
      </div>
    );
  }

  if (alreadySetup) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background-gradient)' }}>
        <div className="bg-card rounded-[24px] border border-border shadow-elevated p-8 max-w-md text-center">
          <Crown className="w-12 h-12 text-[hsl(43,65%,50%)] mx-auto mb-4" />
          <h2 className="text-xl font-heading font-bold text-foreground mb-2">تم إعداد الرئيس مسبقاً</h2>
          <p className="text-muted-foreground text-sm mb-4">حساب الرئيس التنفيذي موجود بالفعل</p>
          <Button onClick={() => navigate('/login')} className="rounded-xl">تسجيل الدخول</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'var(--background-gradient)' }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img src={logo} alt="" className="w-[600px] h-[600px] opacity-[0.03]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card rounded-[24px] border border-border shadow-elevated p-8">
          <div className="text-center mb-6">
            <img src={logo} alt="BatShark" className="w-16 h-16 mx-auto mb-3" />
            <h1 className="text-2xl font-heading font-black text-foreground">إعداد حساب الرئيس</h1>
            <p className="text-sm text-muted-foreground mt-1">أنشئ حساب الرئيس التنفيذي (CEO) للمرة الأولى</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم الكامل</label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="عبدالرحمن بن بندر" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ceo@batshark.com" className="rounded-xl" dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة مرور قوية" className="rounded-xl" dir="ltr" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl font-heading font-bold bg-gradient-to-r from-[hsl(43,65%,50%)] to-[hsl(38,72%,42%)]">
              {submitting ? 'جاري الإعداد...' : '👑 إنشاء حساب الرئيس'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
