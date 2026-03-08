import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, LayoutGrid, Circle, List, X, RotateCcw, Check, Rows3, 
  Grid3X3, Columns3, Hexagon, Square, Sparkles, ChevronLeft
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

/* ─── Layout mini-preview SVGs ─── */
function LayoutPreview({ type, active }: { type: LayoutMode; active: boolean }) {
  const stroke = active ? 'hsl(210,80%,52%)' : 'hsl(220,15%,70%)';
  const fill = active ? 'hsl(210,80%,52%)' : 'hsl(220,12%,85%)';
  const bg = active ? 'hsl(210,80%,97%)' : 'hsl(220,15%,96%)';

  const svgProps = { width: 48, height: 36, viewBox: '0 0 48 36', fill: 'none' };

  switch (type) {
    case 'grid':
      return (
        <svg {...svgProps}>
          <rect x="1" y="1" width="20" height="15" rx="3" fill={bg} stroke={stroke} strokeWidth="1.2" />
          <rect x="27" y="1" width="20" height="15" rx="3" fill={bg} stroke={stroke} strokeWidth="1.2" />
          <rect x="1" y="20" width="20" height="15" rx="3" fill={bg} stroke={stroke} strokeWidth="1.2" />
          <rect x="27" y="20" width="20" height="15" rx="3" fill={bg} stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case 'circles':
      return (
        <svg {...svgProps}>
          <circle cx="10" cy="12" r="7" fill={bg} stroke={stroke} strokeWidth="1.2" />
          <circle cx="24" cy="12" r="7" fill={bg} stroke={stroke} strokeWidth="1.2" />
          <circle cx="38" cy="12" r="7" fill={bg} stroke={stroke} strokeWidth="1.2" />
          <rect x="5" y="24" width="10" height="2" rx="1" fill={fill} opacity="0.4" />
          <rect x="19" y="24" width="10" height="2" rx="1" fill={fill} opacity="0.4" />
          <rect x="33" y="24" width="10" height="2" rx="1" fill={fill} opacity="0.4" />
        </svg>
      );
    case 'list':
      return (
        <svg {...svgProps}>
          {[4, 14, 24].map(y => (
            <g key={y}>
              <rect x="2" y={y} width="44" height="7" rx="2.5" fill={bg} stroke={stroke} strokeWidth="0.8" />
              <circle cx="8" cy={y + 3.5} r="2" fill={fill} opacity="0.5" />
              <rect x="13" y={y + 1.5} width="18" height="2" rx="1" fill={fill} opacity="0.35" />
            </g>
          ))}
        </svg>
      );
    case 'compact':
      return (
        <svg {...svgProps}>
          {[3, 15, 27].map(x => [4, 18].map(y => (
            <g key={`${x}-${y}`}>
              <rect x={x} y={y} width="10" height="10" rx="3" fill={bg} stroke={stroke} strokeWidth="0.8" />
              <circle cx={x + 5} cy={y + 5} r="2.5" fill={fill} opacity="0.4" />
            </g>
          )))}
        </svg>
      );
    case 'masonry':
      return (
        <svg {...svgProps}>
          <rect x="1" y="1" width="14" height="20" rx="3" fill={bg} stroke={stroke} strokeWidth="1" />
          <rect x="17" y="1" width="14" height="12" rx="3" fill={bg} stroke={stroke} strokeWidth="1" />
          <rect x="33" y="1" width="14" height="16" rx="3" fill={bg} stroke={stroke} strokeWidth="1" />
          <rect x="1" y="24" width="14" height="11" rx="3" fill={bg} stroke={stroke} strokeWidth="1" />
          <rect x="17" y="16" width="14" height="19" rx="3" fill={bg} stroke={stroke} strokeWidth="1" />
          <rect x="33" y="20" width="14" height="15" rx="3" fill={bg} stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg {...svgProps}>
          {[[12, 10], [24, 10], [36, 10], [18, 24], [30, 24]].map(([cx, cy], i) => (
            <polygon key={i} points={`${cx},${cy! - 7} ${cx! + 7},${cy! - 3.5} ${cx! + 7},${cy! + 3.5} ${cx},${cy! + 7} ${cx! - 7},${cy! + 3.5} ${cx! - 7},${cy! - 3.5}`}
              fill={bg} stroke={stroke} strokeWidth="1" />
          ))}
        </svg>
      );
    case 'minimal':
      return (
        <svg {...svgProps}>
          {[6, 14, 22, 30].map(y => (
            <g key={y}>
              <circle cx="5" cy={y} r="1.5" fill={fill} />
              <rect x="10" y={y - 1.5} width="20" height="2.5" rx="1" fill={fill} opacity="0.3" />
              <line x1="2" y1={y + 4} x2="46" y2={y + 4} stroke={stroke} strokeWidth="0.3" opacity="0.4" />
            </g>
          ))}
        </svg>
      );
    case 'cards-lg':
      return (
        <svg {...svgProps}>
          <rect x="1" y="1" width="46" height="14" rx="3" fill={bg} stroke={stroke} strokeWidth="1" />
          <rect x="1" y="19" width="46" height="14" rx="3" fill={bg} stroke={stroke} strokeWidth="1" />
          <circle cx="9" cy="8" r="3" fill={fill} opacity="0.4" />
          <rect x="15" y="5" width="22" height="2.5" rx="1" fill={fill} opacity="0.3" />
          <circle cx="9" cy="26" r="3" fill={fill} opacity="0.4" />
          <rect x="15" y="23" width="22" height="2.5" rx="1" fill={fill} opacity="0.3" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Color picker row ─── */
function ColorRow({ label, current, palette, onSelect }: {
  label: string; current: string; palette: typeof COLOR_PALETTE; onSelect: (c: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-background/50 p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-5 h-5 rounded-lg shadow-sm shrink-0 border border-white/20" style={{ background: current }} />
        <span className="text-[13px] font-heading font-bold text-foreground flex-1">{label}</span>
      </div>
      <div className="flex flex-wrap gap-[6px]">
        {palette.map(c => {
          const isActive = current === c.value;
          return (
            <motion.button
              key={c.value}
              onClick={() => onSelect(c.value)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              className="w-7 h-7 rounded-lg transition-all duration-150 relative"
              style={{
                background: c.value,
                boxShadow: isActive ? `0 0 0 2px hsl(var(--background)), 0 0 0 3.5px ${c.value}` : 'none',
              }}
              title={c.label}
            >
              {isActive && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
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

  const layouts: { key: LayoutMode; label: string; desc: string }[] = [
    { key: 'grid', label: 'بطاقات شبكية', desc: 'عرض شبكي منظم مع تفاصيل' },
    { key: 'circles', label: 'أيقونات دائرية', desc: 'عرض دائري أنيق' },
    { key: 'list', label: 'قائمة خطية', desc: 'عرض خطي سريع الوصول' },
    { key: 'compact', label: 'عرض مضغوط', desc: 'أيقونات صغيرة متراصة' },
    { key: 'masonry', label: 'أعمدة متدرجة', desc: 'تخطيط ديناميكي حر' },
    { key: 'hexagon', label: 'خلية نحل', desc: 'عرض سداسي مميز' },
    { key: 'minimal', label: 'نص بسيط', desc: 'أبسط عرض بلا إطارات' },
    { key: 'cards-lg', label: 'بطاقات عريضة', desc: 'بطاقات كبيرة مفصّلة' },
  ];

  const tabs = [
    { key: 'layout' as const, label: 'التشكيل', icon: LayoutGrid },
    { key: 'stat-colors' as const, label: 'الإحصائيات', icon: Sparkles },
    { key: 'section-colors' as const, label: 'الأقسام', icon: Palette },
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
              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm print:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="fixed top-0 right-0 z-[91] h-full w-[340px] sm:w-[400px] overflow-hidden flex flex-col print:hidden border-l border-border/30"
              style={{ background: 'hsl(var(--card))' }}
              dir="rtl"
            >
              {/* ─── Header ─── */}
              <div className="px-5 pt-5 pb-4 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Palette className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-[15px] text-foreground">تخصيص العرض</h2>
                      <p className="text-[10px] text-muted-foreground">اختر التشكيل والألوان</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetAll}
                      className="p-2 rounded-xl hover:bg-destructive/8 text-muted-foreground hover:text-destructive transition-colors"
                      title="إعادة تعيين"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setOpen(false)}
                      className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* ─── Tabs ─── */}
              <div className="flex shrink-0 mx-5 mb-4 p-1 rounded-xl bg-muted/50 border border-border/40">
                {tabs.map(t => {
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-heading font-bold transition-all duration-200 ${
                        active
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* ─── Content ─── */}
              <div className="flex-1 overflow-y-auto px-5 pb-6">
                <AnimatePresence mode="wait">
                  {/* LAYOUT TAB */}
                  {tab === 'layout' && (
                    <motion.div
                      key="layout"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="grid grid-cols-2 gap-2.5"
                    >
                      {layouts.map(l => {
                        const active = prefs.layout === l.key;
                        return (
                          <motion.button
                            key={l.key}
                            onClick={() => setLayout(l.key)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 text-center ${
                              active
                                ? 'bg-primary/6 ring-[1.5px] ring-primary shadow-sm'
                                : 'bg-background/60 ring-1 ring-border/50 hover:ring-primary/30'
                            }`}
                          >
                            {active && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </motion.div>
                            )}
                            <div className="mb-1">
                              <LayoutPreview type={l.key} active={active} />
                            </div>
                            <p className={`text-[12px] font-heading font-bold leading-tight ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {l.label}
                            </p>
                            <p className="text-[9px] text-muted-foreground leading-tight">{l.desc}</p>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* STAT COLORS TAB */}
                  {tab === 'stat-colors' && (
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-3"
                    >
                      {statKeys.map(key => (
                        <ColorRow
                          key={key}
                          label={key}
                          current={prefs.colors.stats[key] || statDefaults[key]}
                          palette={COLOR_PALETTE}
                          onSelect={(c) => setStatColor(key, c)}
                        />
                      ))}
                    </motion.div>
                  )}

                  {/* SECTION COLORS TAB */}
                  {tab === 'section-colors' && (
                    <motion.div
                      key="sections"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-3"
                    >
                      {sectionKeys.map(key => (
                        <ColorRow
                          key={key}
                          label={key}
                          current={prefs.colors.sections[key] || sectionDefaults[key]}
                          palette={COLOR_PALETTE}
                          onSelect={(c) => setSectionColor(key, c)}
                        />
                      ))}
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
