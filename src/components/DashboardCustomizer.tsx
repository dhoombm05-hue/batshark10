import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, LayoutGrid, X, RotateCcw, Check, Sparkles, 
  Grid3X3, CircleDot, List, Minimize2, Columns3, Hexagon, AlignJustify, RectangleHorizontal,
  Droplets, Paintbrush
} from 'lucide-react';

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
  { label: 'زمردي', value: 'hsl(152,60%,40%)', gradient: 'linear-gradient(135deg, hsl(152,60%,45%), hsl(152,60%,35%))' },
  { label: 'ياقوتي', value: 'hsl(0,72%,55%)', gradient: 'linear-gradient(135deg, hsl(0,72%,60%), hsl(0,72%,50%))' },
  { label: 'ملكي', value: 'hsl(210,80%,52%)', gradient: 'linear-gradient(135deg, hsl(210,80%,58%), hsl(210,80%,46%))' },
  { label: 'بنفسجي', value: 'hsl(270,60%,55%)', gradient: 'linear-gradient(135deg, hsl(270,60%,60%), hsl(270,60%,50%))' },
  { label: 'كهرماني', value: 'hsl(25,85%,50%)', gradient: 'linear-gradient(135deg, hsl(25,85%,55%), hsl(25,85%,45%))' },
  { label: 'فيروزي', value: 'hsl(175,60%,38%)', gradient: 'linear-gradient(135deg, hsl(175,60%,44%), hsl(175,60%,32%))' },
  { label: 'ذهبي', value: 'hsl(43,65%,45%)', gradient: 'linear-gradient(135deg, hsl(43,65%,52%), hsl(43,65%,38%))' },
  { label: 'مرجاني', value: 'hsl(330,70%,50%)', gradient: 'linear-gradient(135deg, hsl(330,70%,56%), hsl(330,70%,44%))' },
  { label: 'نيلي', value: 'hsl(240,60%,55%)', gradient: 'linear-gradient(135deg, hsl(240,60%,60%), hsl(240,60%,50%))' },
  { label: 'سماوي', value: 'hsl(190,80%,45%)', gradient: 'linear-gradient(135deg, hsl(190,80%,52%), hsl(190,80%,38%))' },
  { label: 'فحمي', value: 'hsl(220,15%,30%)', gradient: 'linear-gradient(135deg, hsl(220,15%,38%), hsl(220,15%,22%))' },
  { label: 'فضي', value: 'hsl(220,10%,50%)', gradient: 'linear-gradient(135deg, hsl(220,10%,58%), hsl(220,10%,42%))' },
];

interface Props {
  prefs: DashboardPrefs;
  onChange: (p: DashboardPrefs) => void;
  statKeys: string[];
  sectionKeys: string[];
  statDefaults: Record<string, string>;
  sectionDefaults: Record<string, string>;
}

/* ═══════════════════════════ PREMIUM LAYOUT PREVIEW ═══════════════════════════ */
function LayoutPreview({ type, active }: { type: LayoutMode; active: boolean }) {
  const primary = active ? 'hsl(210,80%,52%)' : 'hsl(220,15%,65%)';
  const secondary = active ? 'hsl(210,80%,72%)' : 'hsl(220,12%,78%)';
  const bg = active ? 'hsl(210,80%,96%)' : 'hsl(220,15%,94%)';
  const accent = active ? 'hsl(152,60%,45%)' : 'hsl(220,10%,70%)';

  const containerClass = `w-full aspect-[4/3] rounded-xl overflow-hidden relative transition-all duration-300 ${
    active ? 'shadow-lg' : 'shadow-sm'
  }`;

  switch (type) {
    case 'grid':
      return (
        <div className={containerClass} style={{ background: bg }}>
          <div className="absolute inset-2 grid grid-cols-2 gap-1.5">
            {[0,1,2,3].map(i => (
              <div key={i} className="rounded-lg flex flex-col items-center justify-center gap-1 p-1.5 transition-all"
                style={{ background: `linear-gradient(145deg, white, ${bg})`, boxShadow: `0 2px 8px -2px ${primary}20` }}>
                <div className="w-4 h-4 rounded-md" style={{ background: i === 0 ? accent : primary, opacity: 0.8 }} />
                <div className="w-8 h-1 rounded-full" style={{ background: primary, opacity: 0.3 }} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'circles':
      return (
        <div className={containerClass} style={{ background: bg }}>
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            {[0,1,2].map(i => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  style={{ 
                    background: `radial-gradient(circle at 30% 30%, white, ${i === 1 ? accent : secondary})`,
                    boxShadow: `0 3px 10px -2px ${primary}25`
                  }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: primary, opacity: 0.6 }} />
                </div>
                <div className="w-5 h-0.5 rounded-full" style={{ background: primary, opacity: 0.25 }} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'list':
      return (
        <div className={containerClass} style={{ background: bg }}>
          <div className="absolute inset-2 flex flex-col gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="flex-1 rounded-lg flex items-center gap-2 px-2 transition-all"
                style={{ background: 'white', boxShadow: `0 1px 4px -1px ${primary}15` }}>
                <div className="w-4 h-4 rounded-md" style={{ background: i === 0 ? accent : secondary }} />
                <div className="flex-1">
                  <div className="w-12 h-1 rounded-full mb-0.5" style={{ background: primary, opacity: 0.4 }} />
                  <div className="w-8 h-0.5 rounded-full" style={{ background: primary, opacity: 0.2 }} />
                </div>
                <div className="w-1 h-1 rounded-full" style={{ background: primary, opacity: 0.3 }} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'compact':
      return (
        <div className={containerClass} style={{ background: bg }}>
          <div className="absolute inset-1.5 grid grid-cols-4 gap-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-md flex items-center justify-center transition-all"
                style={{ background: 'white', boxShadow: `0 1px 3px -1px ${primary}12` }}>
                <div className="w-3 h-3 rounded-md" style={{ background: i === 2 ? accent : secondary, opacity: 0.7 }} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'masonry':
      return (
        <div className={containerClass} style={{ background: bg }}>
          <div className="absolute inset-1.5 flex gap-1">
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex-[1.5] rounded-lg" style={{ background: 'white', boxShadow: `0 2px 6px -2px ${primary}15` }} />
              <div className="flex-1 rounded-lg" style={{ background: accent, opacity: 0.15 }} />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex-1 rounded-lg" style={{ background: secondary, opacity: 0.25 }} />
              <div className="flex-[1.3] rounded-lg" style={{ background: 'white', boxShadow: `0 2px 6px -2px ${primary}15` }} />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex-[1.2] rounded-lg" style={{ background: 'white', boxShadow: `0 2px 6px -2px ${primary}15` }} />
              <div className="flex-1 rounded-lg" style={{ background: primary, opacity: 0.12 }} />
            </div>
          </div>
        </div>
      );

    case 'hexagon':
      return (
        <div className={containerClass} style={{ background: bg }}>
          <svg viewBox="0 0 60 45" className="w-full h-full">
            {[[15, 15], [30, 15], [45, 15], [22.5, 30], [37.5, 30]].map(([cx, cy], i) => (
              <polygon key={i}
                points={`${cx},${cy - 8} ${cx + 8},${cy - 4} ${cx + 8},${cy + 4} ${cx},${cy + 8} ${cx - 8},${cy + 4} ${cx - 8},${cy - 4}`}
                fill={i === 1 ? accent : 'white'}
                stroke={primary}
                strokeWidth="0.5"
                opacity={i === 1 ? 0.3 : 1}
                style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.08))' }}
              />
            ))}
          </svg>
        </div>
      );

    case 'minimal':
      return (
        <div className={containerClass} style={{ background: bg }}>
          <div className="absolute inset-2 rounded-lg p-2 flex flex-col gap-1.5" style={{ background: 'white' }}>
            {[0,1,2,3].map(i => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: i === 1 ? accent : primary }} />
                <div className="flex-1 h-1 rounded-full" style={{ background: primary, opacity: 0.2 }} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'cards-lg':
      return (
        <div className={containerClass} style={{ background: bg }}>
          <div className="absolute inset-1.5 flex flex-col gap-1.5">
            {[0,1].map(i => (
              <div key={i} className="flex-1 rounded-lg flex items-center gap-2 px-2.5 transition-all"
                style={{ background: 'white', boxShadow: `0 2px 8px -2px ${primary}12` }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: i === 0 ? `${accent}20` : `${secondary}30` }}>
                  <div className="w-3 h-3 rounded-md" style={{ background: i === 0 ? accent : primary, opacity: 0.6 }} />
                </div>
                <div className="flex-1">
                  <div className="w-14 h-1.5 rounded-full mb-1" style={{ background: primary, opacity: 0.35 }} />
                  <div className="w-10 h-1 rounded-full" style={{ background: primary, opacity: 0.15 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

/* ═══════════════════════════ PREMIUM COLOR PICKER ═══════════════════════════ */
function ColorRow({ label, current, palette, onSelect, icon }: {
  label: string;
  current: string;
  palette: typeof COLOR_PALETTE;
  onSelect: (c: string) => void;
  icon?: any;
}) {
  const Icon = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-background p-4 relative overflow-hidden"
    >
      {/* Subtle background accent */}
      <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-[0.06]" style={{ background: current }} />
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300"
          style={{ background: `linear-gradient(145deg, ${current}, ${current}dd)`, boxShadow: `0 4px 12px -3px ${current}40` }}>
          {Icon ? <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2} /> : <Droplets className="w-3.5 h-3.5 text-white" strokeWidth={2} />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-heading font-black text-foreground block truncate">{label}</span>
          <span className="text-[9px] text-muted-foreground/60">اختر اللون المناسب</span>
        </div>
      </div>
      
      <div className="grid grid-cols-6 gap-2 relative z-10">
        {palette.map(c => {
          const isActive = current === c.value;
          return (
            <motion.button
              key={c.value}
              onClick={() => onSelect(c.value)}
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 0.92 }}
              className="aspect-square rounded-xl transition-all duration-200 relative group"
              style={{
                background: c.gradient,
                boxShadow: isActive 
                  ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${c.value}, 0 8px 16px -4px ${c.value}50`
                  : `0 3px 8px -2px ${c.value}30`,
              }}
              title={c.label}
            >
              {/* Inner highlight */}
              <div className="absolute inset-0.5 rounded-[10px] bg-gradient-to-br from-white/30 to-transparent opacity-60" />
              
              {isActive && (
                <motion.div 
                  initial={{ scale: 0, rotate: -90 }} 
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                    <Check className="w-3 h-3 text-foreground" strokeWidth={2.5} />
                  </div>
                </motion.div>
              )}
              
              {/* Hover label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[8px] font-bold text-muted-foreground whitespace-nowrap">{c.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════ MAIN COMPONENT ═══════════════════════════ */
export default function DashboardCustomizer({ prefs, onChange, statKeys, sectionKeys, statDefaults, sectionDefaults }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'layout' | 'stat-colors' | 'section-colors'>('layout');

  const setLayout = (l: LayoutMode) => onChange({ ...prefs, layout: l });
  const setStatColor = (key: string, color: string) =>
    onChange({ ...prefs, colors: { ...prefs.colors, stats: { ...prefs.colors.stats, [key]: color } } });
  const setSectionColor = (key: string, color: string) =>
    onChange({ ...prefs, colors: { ...prefs.colors, sections: { ...prefs.colors.sections, [key]: color } } });
  const resetAll = () => onChange(DEFAULT_PREFS);

  const layouts: { key: LayoutMode; label: string; desc: string; icon: any }[] = [
    { key: 'grid', label: 'بطاقات شبكية', desc: 'عرض منظم ومتوازن', icon: Grid3X3 },
    { key: 'circles', label: 'دوائر أنيقة', desc: 'تصميم عصري مميز', icon: CircleDot },
    { key: 'list', label: 'قائمة خطية', desc: 'وصول سريع وفعال', icon: List },
    { key: 'compact', label: 'عرض مضغوط', desc: 'أقصى استفادة من المساحة', icon: Minimize2 },
    { key: 'masonry', label: 'أعمدة متدرجة', desc: 'تخطيط ديناميكي حر', icon: Columns3 },
    { key: 'hexagon', label: 'خلية نحل', desc: 'تصميم هندسي فريد', icon: Hexagon },
    { key: 'minimal', label: 'نص بسيط', desc: 'بساطة وأناقة', icon: AlignJustify },
    { key: 'cards-lg', label: 'بطاقات كبيرة', desc: 'تفاصيل واضحة ومفصلة', icon: RectangleHorizontal },
  ];

  const tabs = [
    { key: 'layout' as const, label: 'التشكيل', icon: LayoutGrid, desc: 'اختر نمط العرض' },
    { key: 'stat-colors' as const, label: 'الإحصائيات', icon: Sparkles, desc: 'ألوان البطاقات' },
    { key: 'section-colors' as const, label: 'الأقسام', icon: Palette, desc: 'ألوان الأقسام' },
  ];

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2.5 rounded-xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all text-muted-foreground hover:text-primary"
        title="تخصيص لوحة التحكم"
      >
        <Palette className="w-[18px] h-[18px]" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-md print:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="fixed top-0 right-0 z-[91] h-full w-[360px] sm:w-[420px] overflow-hidden flex flex-col print:hidden"
              style={{ 
                background: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)',
                boxShadow: '-8px 0 40px -12px rgba(0,0,0,0.25)'
              }}
              dir="rtl"
            >
              {/* ═══════ HEADER ═══════ */}
              <div className="px-6 pt-6 pb-5 shrink-0 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <motion.div 
                      whileHover={{ rotate: 15 }}
                      className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg"
                      style={{ boxShadow: '0 8px 24px -6px hsl(var(--primary) / 0.4)' }}
                    >
                      <Paintbrush className="w-5 h-5 text-primary-foreground" />
                    </motion.div>
                    <div>
                      <h2 className="font-heading font-black text-[16px] text-foreground tracking-wide">مركز التخصيص</h2>
                      <p className="text-[10px] text-muted-foreground/60">صمم واجهتك بأسلوبك</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileHover={{ scale: 1.08, rotate: -180 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ duration: 0.3 }}
                      onClick={resetAll}
                      className="p-2.5 rounded-xl hover:bg-destructive/8 text-muted-foreground hover:text-destructive transition-all"
                      title="إعادة تعيين"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setOpen(false)}
                      className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-all"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* ═══════ TABS ═══════ */}
              <div className="px-6 py-4 shrink-0">
                <div className="flex gap-2 p-1.5 rounded-2xl bg-muted/30 border border-border/30">
                  {tabs.map(t => {
                    const active = tab === t.key;
                    return (
                      <motion.button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        whileHover={{ y: active ? 0 : -1 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-center transition-all duration-300 ${
                          active
                            ? 'bg-card text-foreground shadow-md'
                            : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                        }`}
                        style={active ? { boxShadow: '0 4px 16px -4px hsl(var(--primary) / 0.15)' } : {}}
                      >
                        <t.icon className={`w-4 h-4 transition-all ${active ? 'text-primary' : ''}`} />
                        <span className="text-[11px] font-heading font-black">{t.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* ═══════ CONTENT ═══════ */}
              <div className="flex-1 overflow-y-auto px-6 pb-8">
                <AnimatePresence mode="wait">
                  {/* LAYOUT TAB */}
                  {tab === 'layout' && (
                    <motion.div
                      key="layout"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="space-y-3"
                    >
                      <p className="text-[11px] text-muted-foreground/60 font-bold mb-4">اختر نمط عرض الأقسام المفضل لديك</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {layouts.map((l, i) => {
                          const active = prefs.layout === l.key;
                          return (
                            <motion.button
                              key={l.key}
                              onClick={() => setLayout(l.key)}
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              whileHover={{ y: -4, scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              className={`relative flex flex-col p-4 rounded-2xl transition-all duration-300 text-right overflow-hidden ${
                                active
                                  ? 'bg-primary/6 ring-2 ring-primary shadow-lg'
                                  : 'bg-card ring-1 ring-border/40 hover:ring-primary/30 hover:shadow-md'
                              }`}
                              style={active ? { boxShadow: '0 8px 32px -8px hsl(var(--primary) / 0.25)' } : {}}
                            >
                              {/* Active badge */}
                              {active && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -45 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md"
                                >
                                  <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
                                </motion.div>
                              )}
                              
                              {/* Preview */}
                              <div className="mb-3">
                                <LayoutPreview type={l.key} active={active} />
                              </div>
                              
                              {/* Info */}
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                  active ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground'
                                }`}>
                                  <l.icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                                </div>
                                <p className={`text-[12px] font-heading font-black leading-tight ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {l.label}
                                </p>
                              </div>
                              <p className="text-[9px] text-muted-foreground/60 leading-relaxed pr-8">{l.desc}</p>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STAT COLORS TAB */}
                  {tab === 'stat-colors' && (
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="space-y-4"
                    >
                      <p className="text-[11px] text-muted-foreground/60 font-bold mb-4">خصص ألوان بطاقات الإحصائيات الرئيسية</p>
                      
                      {statKeys.map((key, i) => (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <ColorRow
                            label={key}
                            current={prefs.colors.stats[key] || statDefaults[key]}
                            palette={COLOR_PALETTE}
                            onSelect={(c) => setStatColor(key, c)}
                            icon={Sparkles}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* SECTION COLORS TAB */}
                  {tab === 'section-colors' && (
                    <motion.div
                      key="sections"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="space-y-4"
                    >
                      <p className="text-[11px] text-muted-foreground/60 font-bold mb-4">خصص ألوان أقسام لوحة التحكم</p>
                      
                      {sectionKeys.map((key, i) => (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <ColorRow
                            label={key}
                            current={prefs.colors.sections[key] || sectionDefaults[key]}
                            palette={COLOR_PALETTE}
                            onSelect={(c) => setSectionColor(key, c)}
                            icon={Palette}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ═══════ FOOTER ═══════ */}
              <div className="px-6 py-4 shrink-0 border-t border-border/30 bg-card/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] text-muted-foreground/60 font-bold">يتم الحفظ تلقائياً</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setOpen(false)}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-heading font-black shadow-md transition-all"
                    style={{ boxShadow: '0 4px 16px -4px hsl(var(--primary) / 0.4)' }}
                  >
                    تم
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
