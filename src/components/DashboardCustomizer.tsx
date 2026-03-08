import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, LayoutGrid, Circle, List, X, RotateCcw, Check, Rows3, Grid3X3, LayoutDashboard, Columns3, Hexagon, Square } from 'lucide-react';

export type LayoutMode = 'grid' | 'circles' | 'list' | 'compact' | 'masonry' | 'hexagon' | 'minimal' | 'cards-lg';

export interface ColorOverrides {
  stats: Record<string, string>;
  sections: Record<string, string>;
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

const COLOR_PALETTE = [
  { label: 'زمردي', value: 'hsl(152,60%,40%)' },
  { label: 'ياقوتي', value: 'hsl(0,72%,55%)' },
  { label: 'ملكي', value: 'hsl(210,80%,52%)' },
  { label: 'بنفسجي', value: 'hsl(270,60%,55%)' },
  { label: 'كهرماني', value: 'hsl(25,85%,50%)' },
  { label: 'فيروزي', value: 'hsl(175,60%,38%)' },
  { label: 'ذهبي', value: 'hsl(43,65%,45%)' },
  { label: 'مرجاني', value: 'hsl(330,70%,50%)' },
  { label: 'نيلي', value: 'hsl(240,60%,55%)' },
  { label: 'سماوي', value: 'hsl(190,80%,45%)' },
  { label: 'فحمي', value: 'hsl(220,15%,30%)' },
  { label: 'فضي', value: 'hsl(220,10%,50%)' },
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

  const setLayout = (l: LayoutMode) => onChange({ ...prefs, layout: l });
  const setStatColor = (key: string, color: string) =>
    onChange({ ...prefs, colors: { ...prefs.colors, stats: { ...prefs.colors.stats, [key]: color } } });
  const setSectionColor = (key: string, color: string) =>
    onChange({ ...prefs, colors: { ...prefs.colors, sections: { ...prefs.colors.sections, [key]: color } } });
  const resetAll = () => onChange(DEFAULT_PREFS);

  const layouts: { key: LayoutMode; icon: typeof LayoutGrid; label: string; desc: string }[] = [
    { key: 'grid', icon: LayoutGrid, label: 'بطاقات', desc: 'عرض شبكي مفصّل' },
    { key: 'circles', icon: Circle, label: 'دوائر', desc: 'عرض أيقوني مختصر' },
    { key: 'list', icon: List, label: 'قائمة', desc: 'عرض خطي سريع' },
  ];

  return (
    <>
      {/* Trigger */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className="p-2.5 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all text-muted-foreground hover:text-primary"
        title="تخصيص لوحة التحكم"
      >
        <SlidersHorizontal className="w-[18px] h-[18px]" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] print:hidden"
            />

            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="fixed top-0 right-0 z-[91] h-full w-[340px] sm:w-[380px] bg-card shadow-[−20px_0_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col print:hidden"
              dir="rtl"
            >
              {/* Header */}
              <div className="border-b border-border p-5 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-heading font-black text-base text-foreground">تخصيص العرض</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">اختر التشكيل والألوان على كيفك</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={resetAll}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="إعادة تعيين"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex shrink-0 border-b border-border bg-muted/30">
                {[
                  { key: 'layout' as const, label: 'التشكيل' },
                  { key: 'stat-colors' as const, label: 'الإحصائيات' },
                  { key: 'section-colors' as const, label: 'الأقسام' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex-1 py-3 text-xs font-heading font-bold transition-all relative ${
                      tab === t.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t.label}
                    {tab === t.key && (
                      <motion.div
                        layoutId="customizer-tab"
                        className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence mode="wait">
                  {tab === 'layout' && (
                    <motion.div
                      key="layout"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-3"
                    >
                      {layouts.map(l => (
                        <button
                          key={l.key}
                          onClick={() => setLayout(l.key)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-right ${
                            prefs.layout === l.key
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30 bg-transparent'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl transition-colors ${
                            prefs.layout === l.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            <l.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-heading font-bold ${prefs.layout === l.key ? 'text-foreground' : 'text-muted-foreground'}`}>{l.label}</p>
                            <p className="text-[10px] text-muted-foreground">{l.desc}</p>
                          </div>
                          {prefs.layout === l.key && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-1 rounded-full bg-primary">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {tab === 'stat-colors' && (
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-5"
                    >
                      {statKeys.map(key => {
                        const current = prefs.colors.stats[key] || statDefaults[key];
                        return (
                          <div key={key} className="space-y-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ background: current }} />
                              <span className="text-sm font-heading font-bold text-foreground">{key}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {COLOR_PALETTE.map(c => (
                                <button
                                  key={c.value}
                                  onClick={() => setStatColor(key, c.value)}
                                  className={`w-8 h-8 rounded-xl border-2 transition-all duration-150 hover:scale-110 ${
                                    current === c.value ? 'border-foreground shadow-md scale-105' : 'border-transparent hover:border-foreground/20'
                                  }`}
                                  style={{ background: c.value }}
                                  title={c.label}
                                >
                                  {current === c.value && (
                                    <Check className="w-3.5 h-3.5 mx-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {tab === 'section-colors' && (
                    <motion.div
                      key="sections"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-5"
                    >
                      {sectionKeys.map(key => {
                        const current = prefs.colors.sections[key] || sectionDefaults[key];
                        return (
                          <div key={key} className="space-y-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ background: current }} />
                              <span className="text-sm font-heading font-bold text-foreground">{key}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {COLOR_PALETTE.map(c => (
                                <button
                                  key={c.value}
                                  onClick={() => setSectionColor(key, c.value)}
                                  className={`w-8 h-8 rounded-xl border-2 transition-all duration-150 hover:scale-110 ${
                                    current === c.value ? 'border-foreground shadow-md scale-105' : 'border-transparent hover:border-foreground/20'
                                  }`}
                                  style={{ background: c.value }}
                                  title={c.label}
                                >
                                  {current === c.value && (
                                    <Check className="w-3.5 h-3.5 mx-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
