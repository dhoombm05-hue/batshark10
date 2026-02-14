import { motion } from 'framer-motion';

interface HealthScoreProps {
  score: number;
}

export default function HealthScore({ score }: HealthScoreProps) {
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'hsl(152, 60%, 45%)' : score >= 60 ? 'hsl(43, 65%, 55%)' : 'hsl(0, 72%, 51%)';
  const label = score >= 80 ? 'ممتاز' : score >= 60 ? 'جيد' : 'يحتاج تحسين';

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-card flex flex-col items-center">
      <h3 className="text-sm text-muted-foreground mb-4 font-heading">مؤشر صحة الشركة</h3>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="58" fill="none" stroke="hsl(222, 25%, 18%)" strokeWidth="8" />
          <motion.circle
            cx="64" cy="64" r="58" fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-heading font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
    </div>
  );
}
