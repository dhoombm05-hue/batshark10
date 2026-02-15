import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import logo from '@/assets/batshark-logo-main.png';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background-gradient)' }}>
        <motion.img src={logo} alt="BatShark" className="w-16 h-16" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
