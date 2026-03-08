import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, LayoutGrid, Circle, List, X, RotateCcw } from 'lucide-react';

export type LayoutMode = 'grid' | 'circles' | 'list';

export interface ColorOverrides {
  stats: Record<string, string>;   // key = stat title → hsl color
  sections: Record<string, string>; // key = section label → hsl color
}

const PREFS_KEY = 'batshark-dash-prefs';

export interface DashboardPrefs {
  layout: LayoutMode;
  colors: ColorOverrides;
}

const DEFAULT_PREFS: DashboardPrefs = {
  layout: 'grid',
  colors: { stats: {}, sections: {} },
};

export function loadPrefs(): DashboardPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

export function savePrefs(p: DashboardPrefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
}

/* ─── Preset color palette ─── */
const COLOR_PALETTE = [
  { label: 'أخضر', value: 'hsl(152,60%,40%)' },
  { label: 'أحمر', value: 'hsl(0,72%,55%)' },
  { label: 'أزرق', value: 'hsl(210,80%,52%)' },
  { label: 'بنفسجي', value: 'hsl(270,60%,55%)' },
  { label: 'برتقالي', value: 'hsl(25,85%,50%)' },
  { label: 'تيل', value: 'hsl(175,60%,38%)' },
  { label: 'ذهبي', value: 'hsl(43,65%,45%)' },
  { label: 'وردي', value: 'hsl(330,70%,50%)' },
  { label: 'نيلي', value: 'hsl(240,60%,55%)' },
  { label: 'سماوي', value: 'hsl(190,80%,45%)' },
  { label: 'رمادي', value: 'hsl(220,10%,50%)' },
  { label: 'أسود', value: 'hsl(0,0%,15%)' },
];

interface Props {
  prefs: DashboardPrefs;
  onChange: (p: DashboardPrefs) => void;
  statKeys: string[];
  sectionKeys: string[];
  statDefaults: Record<string, string>;
  sectionDefaults: Record<string, string>;
}

export default function DashboardCustomizer({ prefs, onChange, statKeys, sectionKeys, statDefaults, sectionDefaults }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'layout' | 'stat-colors' | 'section-colors'>('layout');

  const setLayout = (l: LayoutMode) => {
    const next = { ...prefs, layout: l };
    onChange(next);
  };

  const setStatColor = (key: string, color: string) => {
    const next = { ...prefs, colors: { ...prefs.colors, stats: { ...prefs.colors.stats, [key]: color } } };
    onChange(next);
  };

  const setSectionColor = (key: string, color: string) => {
    const next = { ...prefs, colors: { ...prefs.colors, sections: { ...prefs.colors.sections, [key]: color } } };
    onChange(next);
  };

  const resetAll = () => {
    onChange(DEFAULT_PREFS);
  };

  const layouts: { key: LayoutMode; icon: typeof LayoutGrid; label: string }[] = [
    { key: 'grid', icon: LayoutGrid, label: 'مربعات' },
    { key: 'circles', icon: Circle, label: 'دوائر' },
    { key: 'list', icon: List, label: 'قائمة' },
  ];

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-xl bg-card border border-border hover:shadow-card transition-all text-muted-foreground hover:text-primary"
        title="تخصيص لوحة التحكم"
      >
        <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
      </motion.button>

      {/* Slide-in Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm print:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 z-[91] h-full w-[320px] sm:w-[360px] bg-card border-l border-border shadow-elevated overflow-y-auto print:hidden"
              dir="rtl"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-bold text-sm text-foreground">تخصيص لوحة التحكم</h2>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={resetAll} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="إعادة تعيين">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                {[
                  { key: 'layout' as const, label: 'التشكيل' },
                  { key: 'stat-colors' as const, label: 'ألوان الإحصائيات' },
                  { key: 'section-colors' as const, label: 'ألوان الأقسام' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex-1 py-2.5 text-[11px] font-heading font-bold transition-all ${
                      tab === t.key
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Layout Tab */}
                {tab === 'layout' && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">اختر شكل عرض الأقسام:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {layouts.map(l => (
                        <motion.button
                          key={l.key}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setLayout(l.key)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                            prefs.layout === l.key
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border bg-secondary/30 hover:border-primary/40'
                          }`}
                        >
                          <l.icon className={`w-6 h-6 ${prefs.layout === l.key ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`text-[11px] font-heading font-bold ${prefs.layout === l.key ? 'text-primary' : 'text-muted-foreground'}`}>
                            {l.label}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stat Colors Tab */}
                {tab === 'stat-colors' && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">اضغط على أي لون لتغيير لون البطاقة:</p>
                    {statKeys.map(key => {
                      const current = prefs.colors.stats[key] || statDefaults[key] || COLOR_PALETTE[0].value;
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-border shadow-sm" style={{ background: current }} />
                            <span className="text-xs font-heading font-bold text-foreground">{key}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {COLOR_PALETTE.map(c => (
                              <motion.button
                                key={c.value}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setStatColor(key, c.value)}
                                className={`w-7 h-7 rounded-full border-2 transition-all ${
                                  current === c.value ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:border-foreground/30'
                                }`}
                                style={{ background: c.value }}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Section Colors Tab */}
                {tab === 'section-colors' && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">اختر لون كل قسم على كيفك:</p>
                    {sectionKeys.map(key => {
                      const current = prefs.colors.sections[key] || sectionDefaults[key] || COLOR_PALETTE[0].value;
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-border shadow-sm" style={{ background: current }} />
                            <span className="text-xs font-heading font-bold text-foreground">{key}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {COLOR_PALETTE.map(c => (
                              <motion.button
                                key={c.value}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSectionColor(key, c.value)}
                                className={`w-7 h-7 rounded-full border-2 transition-all ${
                                  current === c.value ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:border-foreground/30'
                                }`}
                                style={{ background: c.value }}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
