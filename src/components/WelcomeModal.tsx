import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import logo from '@/assets/batshark-logo-main.png';

/**
 * One-time welcome greeting after signup. Uses localStorage keyed by user_id
 * so each employee sees it once on first login only.
 */
export default function WelcomeModal() {
  const { user, profile } = useAuthContext();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    const key = `welcomed:${user.id}`;
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [user, profile]);

  const dismiss = () => {
    if (user) localStorage.setItem(`welcomed:${user.id}`, '1');
    setOpen(false);
  };

  const firstName = (profile?.display_name || '').trim().split(/\s+/)[0] || 'مرحباً';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-[hsl(220,25%,10%)] via-[hsl(220,22%,14%)] to-[hsl(220,25%,10%)] p-8 shadow-2xl overflow-hidden"
          >
            <button onClick={dismiss} className="absolute top-3 left-3 p-2 rounded-full hover:bg-white/10 text-white/60">
              <X className="w-4 h-4" />
            </button>
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

            <div className="relative text-center space-y-4">
              <motion.img
                src={logo} alt="BatShark" className="w-20 h-20 mx-auto drop-shadow-2xl"
                animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold tracking-widest">BATSHARK ECONOMY</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-3xl font-heading font-black text-white">
                أهلاً بك، {firstName} 👋
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                يسعدنا انضمامك إلى نظام BatShark. تم إعداد حسابك بالكامل — لوحتك، مهامك، وتقييماتك جاهزة.
                <br />
                <span className="text-amber-400 font-bold">ابدأ رحلتك الآن 🚀</span>
              </p>
              <button
                onClick={dismiss}
                className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold hover:opacity-90 transition-opacity"
              >
                لنبدأ
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
