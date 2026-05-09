import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/contexts/AuthContext';
import logo from '@/assets/batshark-logo-main.png';

// Password -> email mapping for password-only login
const PASSWORD_MAP: Record<string, { email: string; name: string }> = {
  'messi19': { email: 'ceo@batshark.com', name: 'الرئيس' },
  'MESSIBAT10': { email: 'ceo@batshark.com', name: 'الرئيس' },
  'SAM19': { email: 'mohammed@batshark.com', name: 'محمد' },
  'VACANCY': { email: 'fahad@batshark.com', name: 'فهد' },
  'LEO30': { email: 'saad@batshark.com', name: 'سعد' },
  'USA20': { email: 'naif@batshark.com', name: 'نايف' },
};

export default function Login() {
  const { user, loading, signIn } = useAuthContext();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background-gradient)' }}>
        <motion.img src={logo} alt="BatShark" className="w-20 h-20" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    const mapped = PASSWORD_MAP[password.trim()];
    if (!mapped) {
      setError('كلمة المرور غير صحيحة');
      return;
    }

    setError('');
    setSubmitting(true);
    const { error: authError } = await signIn(mapped.email, password.trim());
    setSubmitting(false);
    if (authError) {
      setError('كلمة المرور غير صحيحة أو الحساب غير مفعّل');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--background-gradient)' }}>
      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img src={logo} alt="" className="w-[600px] h-[600px] opacity-[0.03]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-card rounded-[24px] border border-border shadow-elevated p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.img
              src={logo}
              alt="BatShark"
              className="w-20 h-20 mx-auto mb-4 drop-shadow-lg"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
            />
            <h1 className="text-3xl font-heading font-black text-foreground">BATSHARK</h1>
            <p className="text-sm text-muted-foreground mt-1">Economy Intelligence Platform</p>
          </div>

          {/* Login Form - Password Only */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="pr-10 pl-10 rounded-xl h-12 text-left"
                  dir="ltr"
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl text-base font-heading font-bold bg-gradient-to-r from-[hsl(190,80%,45%)] to-[hsl(210,80%,52%)] hover:opacity-90 transition-opacity"
            >
              {submitting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              🦈 نظام محمي — الدخول للمخولين فقط
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
