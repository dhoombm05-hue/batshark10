import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, TrendingUp, TrendingDown, DollarSign, Plus, Trash2,
  RotateCcw, Save, BarChart3, LineChart as LineChartIcon, Download,
  Calculator, Layers, FileSpreadsheet, Settings2, Copy, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import Layout from '@/components/Layout';
import { projects, companyMetrics, formatCurrency, formatPercent } from '@/data/mockData';
import { Slider } from '@/components/ui/slider';
import logo from '@/assets/batshark-logo-new.png';

// =================== TYPES ===================
interface CellValue {
  raw: string;
  computed: number | string;
  formula?: string;
}

interface SpreadsheetRow {
  id: string;
  cells: Record<string, CellValue>;
}

interface SpreadsheetTable {
  id: string;
  name: string;
  columns: { id: string; label: string; width?: number }[];
  rows: SpreadsheetRow[];
}

interface Scenario {
  id: string;
  name: string;
  icon: string;
  adSpendChange: number;
  priceChange: number;
  occupancyChange: number;
  costReduction: number;
  newBranch: boolean;
  campaignIncrease: number;
  forecastMonths: number;
}

// =================== FINANCIAL FORMULAS ===================
const financialFormulas: Record<string, { label: string; desc: string; fn: (args: number[]) => number }> = {
  ROI: { label: 'ROI', desc: 'العائد على الاستثمار', fn: ([gain, cost]) => ((gain - cost) / cost) * 100 },
  NPV: { label: 'NPV', desc: 'صافي القيمة الحالية', fn: ([rate, ...cfs]) => cfs.reduce((s, cf, i) => s + cf / Math.pow(1 + rate / 100, i + 1), 0) },
  IRR: { label: 'IRR', desc: 'معدل العائد الداخلي', fn: (cfs) => {
    let r = 0.1;
    for (let i = 0; i < 100; i++) {
      const npv = cfs.reduce((s, cf, j) => s + cf / Math.pow(1 + r, j), 0);
      const dnpv = cfs.reduce((s, cf, j) => s - j * cf / Math.pow(1 + r, j + 1), 0);
      r -= npv / dnpv;
    }
    return r * 100;
  }},
  CAGR: { label: 'CAGR', desc: 'معدل النمو السنوي المركب', fn: ([begin, end, years]) => (Math.pow(end / begin, 1 / years) - 1) * 100 },
  FORECAST: { label: 'Forecast', desc: 'توقع النمو', fn: ([current, rate, months]) => current * Math.pow(1 + rate / 100, months / 12) },
  COST_PROJ: { label: 'Cost Projection', desc: 'إسقاط التكاليف', fn: ([base, inflation, months]) => base * Math.pow(1 + inflation / 100, months / 12) },
};

// =================== SIMULATION ENGINE ===================
function simulateImpact(scenario: Scenario) {
  const baseRevenue = companyMetrics.totalRevenue;
  const baseExpenses = companyMetrics.totalExpenses;

  const adRevenueBoost = baseRevenue * (scenario.adSpendChange / 100) * 0.6;
  const priceRevenueBoost = baseRevenue * (scenario.priceChange / 100) * 0.85;
  const occupancyBoost = baseRevenue * (scenario.occupancyChange / 100) * 0.4;
  const campaignBoost = baseRevenue * (scenario.campaignIncrease / 100) * 0.35;
  const branchRevenue = scenario.newBranch ? baseRevenue * 0.3 : 0;

  const newRevenue = baseRevenue + adRevenueBoost + priceRevenueBoost + occupancyBoost + campaignBoost + branchRevenue;

  const adCostIncrease = baseExpenses * 0.05 * (scenario.adSpendChange / 100);
  const costSavings = baseExpenses * (scenario.costReduction / 100);
  const branchCost = scenario.newBranch ? baseExpenses * 0.4 : 0;
  const campaignCost = baseExpenses * 0.03 * (scenario.campaignIncrease / 100);

  const newExpenses = baseExpenses + adCostIncrease - costSavings + branchCost + campaignCost;
  const newProfit = newRevenue - newExpenses;
  const profitChange = newProfit - companyMetrics.netProfit;
  const newMargin = (newProfit / newRevenue) * 100;
  const newROI = (newProfit / newExpenses) * 100;
  const newLiquidity = companyMetrics.liquidityRatio * (newProfit > 0 ? 1 + (profitChange / baseRevenue) * 0.5 : 1 - Math.abs(profitChange / baseRevenue) * 0.3);
  const newBurnRate = newExpenses / 12;
  const riskScore = Math.max(0, Math.min(100, 50 - (profitChange / baseRevenue) * 100 + (scenario.newBranch ? 15 : 0)));

  return {
    revenue: newRevenue, expenses: newExpenses, profit: newProfit, profitChange,
    margin: newMargin, roi: newROI, liquidity: newLiquidity, burnRate: newBurnRate,
    runway: Math.max(1, newProfit > 0 ? Math.round((companyMetrics.netProfit + profitChange * 2) / newBurnRate * 12) : Math.max(1, Math.round(companyMetrics.runway * (newProfit / companyMetrics.netProfit)))),
    revenueChange: newRevenue - baseRevenue, expenseChange: newExpenses - baseExpenses,
    riskScore,
  };
}

// =================== DEFAULT DATA ===================
const defaultScenario: Scenario = {
  id: 'default', name: 'السيناريو الأساسي', icon: '📊',
  adSpendChange: 0, priceChange: 0, occupancyChange: 0,
  costReduction: 0, newBranch: false, campaignIncrease: 0, forecastMonths: 12,
};

const scenarioPresets: Partial<Scenario>[] = [
  { name: 'سيناريو التوسع', icon: '🚀', adSpendChange: 30, priceChange: 5, occupancyChange: 20, campaignIncrease: 50, newBranch: true, costReduction: 0 },
  { name: 'تخفيض المصاريف', icon: '✂️', adSpendChange: -20, priceChange: 0, occupancyChange: 0, campaignIncrease: -30, newBranch: false, costReduction: 15 },
  { name: 'استثمار جديد', icon: '💎', adSpendChange: 50, priceChange: 10, occupancyChange: 30, campaignIncrease: 80, newBranch: true, costReduction: 5 },
  { name: 'أزمة مالية', icon: '⚠️', adSpendChange: -40, priceChange: -10, occupancyChange: -25, campaignIncrease: -50, newBranch: false, costReduction: 20 },
];

const defaultTable: SpreadsheetTable = {
  id: 'main',
  name: 'الجدول الرئيسي',
  columns: [
    { id: 'label', label: 'البند', width: 180 },
    { id: 'q1', label: 'الربع 1' },
    { id: 'q2', label: 'الربع 2' },
    { id: 'q3', label: 'الربع 3' },
    { id: 'q4', label: 'الربع 4' },
    { id: 'total', label: 'الإجمالي' },
  ],
  rows: [
    { id: '1', cells: { label: { raw: 'الإيرادات', computed: 'الإيرادات' }, q1: { raw: '535000', computed: 535000 }, q2: { raw: '560000', computed: 560000 }, q3: { raw: '510000', computed: 510000 }, q4: { raw: '535000', computed: 535000 }, total: { raw: '=SUM', computed: 2140000, formula: 'SUM' } } },
    { id: '2', cells: { label: { raw: 'المصروفات', computed: 'المصروفات' }, q1: { raw: '475000', computed: 475000 }, q2: { raw: '480000', computed: 480000 }, q3: { raw: '470000', computed: 470000 }, q4: { raw: '475000', computed: 475000 }, total: { raw: '=SUM', computed: 1900000, formula: 'SUM' } } },
    { id: '3', cells: { label: { raw: 'صافي الربح', computed: 'صافي الربح' }, q1: { raw: '60000', computed: 60000 }, q2: { raw: '80000', computed: 80000 }, q3: { raw: '40000', computed: 40000 }, q4: { raw: '60000', computed: 60000 }, total: { raw: '=SUM', computed: 240000, formula: 'SUM' } } },
    { id: '4', cells: { label: { raw: 'الرواتب', computed: 'الرواتب' }, q1: { raw: '160000', computed: 160000 }, q2: { raw: '160000', computed: 160000 }, q3: { raw: '165000', computed: 165000 }, q4: { raw: '155000', computed: 155000 }, total: { raw: '=SUM', computed: 640000, formula: 'SUM' } } },
    { id: '5', cells: { label: { raw: 'الإعلانات', computed: 'الإعلانات' }, q1: { raw: '52500', computed: 52500 }, q2: { raw: '55000', computed: 55000 }, q3: { raw: '50000', computed: 50000 }, q4: { raw: '52500', computed: 52500 }, total: { raw: '=SUM', computed: 210000, formula: 'SUM' } } },
  ],
};

// =================== SUB-COMPONENTS ===================
const SliderControl = ({ label, value, onChange, min, max, step, unit, color }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string; color: string;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-heading font-bold" style={{ color }}>
        {value > 0 ? '+' : ''}{value}{unit}
      </span>
    </div>
    <Slider value={[value]} onValueChange={v => onChange(v[0])} min={min} max={max} step={step} className="w-full" />
  </div>
);

const ImpactCard = ({ label, current, simulated, unit, inverse }: {
  label: string; current: number; simulated: number; unit?: string; inverse?: boolean;
}) => {
  const diff = simulated - current;
  const isPositive = inverse ? diff < 0 : diff > 0;
  return (
    <div className="bg-glass rounded-xl p-4 shadow-glass">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-heading font-bold text-foreground">
        {unit === 'ريال' ? formatCurrency(simulated) : `${simulated.toFixed(1)}${unit || ''}`}
      </p>
      {diff !== 0 && (
        <p className={`text-[10px] mt-1 flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {diff > 0 ? '+' : ''}{unit === 'ريال' ? formatCurrency(diff) : `${diff.toFixed(1)}${unit || ''}`}
        </p>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-elevated">
      <p className="text-sm font-heading text-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span style={{ color: p.color }}>●</span> {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

// =================== SPREADSHEET COMPONENT ===================
function SpreadsheetView({ tables, setTables }: { tables: SpreadsheetTable[]; setTables: React.Dispatch<React.SetStateAction<SpreadsheetTable[]>> }) {
  const [activeTable, setActiveTable] = useState(0);
  const [editingCell, setEditingCell] = useState<{ row: string; col: string } | null>(null);
  const [formulaBar, setFormulaBar] = useState('');

  const table = tables[activeTable];

  const handleCellClick = (rowId: string, colId: string) => {
    const cell = table.rows.find(r => r.id === rowId)?.cells[colId];
    setEditingCell({ row: rowId, col: colId });
    setFormulaBar(cell?.raw || '');
  };

  const handleCellChange = (value: string) => {
    setFormulaBar(value);
  };

  const handleCellCommit = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    setTables(prev => prev.map((t, i) => {
      if (i !== activeTable) return t;
      return {
        ...t,
        rows: t.rows.map(r => {
          if (r.id !== row) return r;
          const num = parseFloat(formulaBar);
          return {
            ...r,
            cells: {
              ...r.cells,
              [col]: {
                raw: formulaBar,
                computed: isNaN(num) ? formulaBar : num,
                formula: formulaBar.startsWith('=') ? formulaBar.slice(1) : undefined,
              },
            },
          };
        }),
      };
    }));
    setEditingCell(null);
  };

  const addRow = () => {
    setTables(prev => prev.map((t, i) => {
      if (i !== activeTable) return t;
      const newRow: SpreadsheetRow = {
        id: String(Date.now()),
        cells: Object.fromEntries(t.columns.map(c => [c.id, { raw: '', computed: '' }])),
      };
      return { ...t, rows: [...t.rows, newRow] };
    }));
  };

  const addColumn = () => {
    const colId = `col_${Date.now()}`;
    setTables(prev => prev.map((t, i) => {
      if (i !== activeTable) return t;
      return {
        ...t,
        columns: [...t.columns, { id: colId, label: `عمود ${t.columns.length + 1}` }],
        rows: t.rows.map(r => ({ ...r, cells: { ...r.cells, [colId]: { raw: '', computed: '' } } })),
      };
    }));
  };

  const deleteRow = (rowId: string) => {
    setTables(prev => prev.map((t, i) => {
      if (i !== activeTable) return t;
      return { ...t, rows: t.rows.filter(r => r.id !== rowId) };
    }));
  };

  const addTable = () => {
    setTables(prev => [...prev, {
      id: String(Date.now()),
      name: `جدول ${prev.length + 1}`,
      columns: [{ id: 'label', label: 'البند', width: 180 }, { id: 'value', label: 'القيمة' }],
      rows: [{ id: '1', cells: { label: { raw: '', computed: '' }, value: { raw: '', computed: '' } } }],
    }]);
    setActiveTable(tables.length);
  };

  return (
    <div className="space-y-4">
      {/* Formula Bar */}
      <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2 border border-border">
        <Calculator className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground font-heading min-w-[60px]">
          {editingCell ? `${editingCell.col}:${editingCell.row}` : 'fx'}
        </span>
        <input
          value={formulaBar}
          onChange={e => handleCellChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCellCommit()}
          onBlur={handleCellCommit}
          placeholder="أدخل قيمة أو معادلة (= للمعادلات)"
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Table Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tables.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActiveTable(i)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              i === activeTable
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.name}
          </button>
        ))}
        <button onClick={addTable} className="text-xs px-2 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Spreadsheet Grid */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/30">
              <th className="p-2 text-center text-muted-foreground text-[10px] w-8">#</th>
              {table.columns.map(col => (
                <th key={col.id} className="p-2 text-right text-muted-foreground text-[10px] font-heading" style={{ minWidth: col.width || 100 }}>
                  {col.label}
                </th>
              ))}
              <th className="p-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={row.id} className="border-t border-border hover:bg-primary/5 transition-colors">
                <td className="p-2 text-center text-[10px] text-muted-foreground">{ri + 1}</td>
                {table.columns.map(col => {
                  const cell = row.cells[col.id];
                  const isEditing = editingCell?.row === row.id && editingCell?.col === col.id;
                  return (
                    <td
                      key={col.id}
                      onClick={() => handleCellClick(row.id, col.id)}
                      className={`p-2 cursor-pointer transition-all ${
                        isEditing ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                      } ${cell?.formula ? 'text-primary' : 'text-foreground'}`}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={formulaBar}
                          onChange={e => handleCellChange(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleCellCommit()}
                          onBlur={handleCellCommit}
                          className="w-full bg-transparent outline-none text-sm"
                        />
                      ) : (
                        <span className="text-xs">
                          {typeof cell?.computed === 'number' ? new Intl.NumberFormat('ar-SA').format(cell.computed) : cell?.computed || ''}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="p-1">
                  <button onClick={() => deleteRow(row.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={addRow} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1">
          <Plus className="w-3 h-3" /> صف جديد
        </button>
        <button onClick={addColumn} className="text-xs px-3 py-1.5 rounded-lg bg-accent/30 text-accent-foreground border border-border hover:bg-accent/50 transition-all flex items-center gap-1">
          <Plus className="w-3 h-3" /> عمود جديد
        </button>
      </div>

      {/* Formula Reference */}
      <div className="bg-secondary/20 rounded-xl p-4 border border-border">
        <h4 className="text-xs font-heading text-muted-foreground mb-2">📐 الدوال المالية المتاحة</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(financialFormulas).map(([key, f]) => (
            <div key={key} className="text-[10px] bg-card/50 rounded-lg px-2 py-1.5 border border-border">
              <span className="text-primary font-mono font-bold">{f.label}</span>
              <span className="text-muted-foreground mr-1">— {f.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =================== MAIN PAGE ===================
export default function FinancialLab() {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'spreadsheet'>('scenarios');
  const [scenarios, setScenarios] = useState<Scenario[]>([{ ...defaultScenario }]);
  const [activeScenario, setActiveScenario] = useState(0);
  const [tables, setTables] = useState<SpreadsheetTable[]>([defaultTable]);
  const [showPresets, setShowPresets] = useState(false);

  const scenario = scenarios[activeScenario];
  const impact = useMemo(() => simulateImpact(scenario), [scenario]);

  const updateScenario = (updates: Partial<Scenario>) => {
    setScenarios(prev => prev.map((s, i) => i === activeScenario ? { ...s, ...updates } : s));
  };

  const addScenarioFromPreset = (preset: Partial<Scenario>) => {
    const newScenario: Scenario = { ...defaultScenario, ...preset, id: String(Date.now()), forecastMonths: 12 };
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenario(scenarios.length);
    setShowPresets(false);
  };

  const duplicateScenario = () => {
    const copy = { ...scenario, id: String(Date.now()), name: `${scenario.name} (نسخة)` };
    setScenarios(prev => [...prev, copy]);
    setActiveScenario(scenarios.length);
  };

  const deleteScenario = (idx: number) => {
    if (scenarios.length <= 1) return;
    setScenarios(prev => prev.filter((_, i) => i !== idx));
    setActiveScenario(Math.max(0, activeScenario - 1));
  };

  const comparisonData = [
    { name: 'الإيرادات', الحالي: companyMetrics.totalRevenue, المحاكاة: impact.revenue },
    { name: 'المصروفات', الحالي: companyMetrics.totalExpenses, المحاكاة: impact.expenses },
    { name: 'الربح', الحالي: companyMetrics.netProfit, المحاكاة: impact.profit },
  ];

  const monthlyProjection = Array.from({ length: scenario.forecastMonths }, (_, i) => {
    const month = i + 1;
    const factor = 1 + (impact.profitChange / companyMetrics.netProfit) * (month / 12) * 0.8;
    return {
      month: `شهر ${month}`,
      الحالي: Math.round(companyMetrics.netProfit / 12),
      المحاكاة: Math.round((companyMetrics.netProfit / 12) * factor),
    };
  });

  const reset = () => {
    setScenarios([{ ...defaultScenario }]);
    setActiveScenario(0);
  };

  const tabs = [
    { id: 'scenarios' as const, label: '🔬 محرك السيناريوهات', icon: Layers },
    { id: 'spreadsheet' as const, label: '📊 نظام الجداول', icon: FileSpreadsheet },
  ];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <img src={logo} alt="BatShark" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className="text-2xl font-heading font-bold text-gradient-blue">BatShark Financial Lab</h1>
            <p className="text-sm text-muted-foreground">مختبر النمذجة المالية — جداول · سيناريوهات · دوال مالية · توقعات</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-heading transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-glass'
                  : 'bg-secondary/30 text-muted-foreground border border-border hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'scenarios' ? (
          <motion.div key="scenarios" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* Scenario Tabs */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {scenarios.map((s, i) => (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => setActiveScenario(i)}
                    className={`text-xs px-3 py-1.5 rounded-r-lg border transition-all ${
                      i === activeScenario
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.icon} {s.name}
                  </button>
                  {scenarios.length > 1 && (
                    <button onClick={() => deleteScenario(i)} className="text-xs px-1.5 py-1.5 rounded-l-lg border border-r-0 border-border text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <div className="relative">
                <button onClick={() => setShowPresets(!showPresets)} className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-primary/30 text-primary hover:bg-primary/10 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" /> سيناريو جديد
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showPresets && (
                  <div className="absolute top-full mt-1 right-0 z-50 bg-card border border-border rounded-xl shadow-elevated p-2 min-w-[200px]">
                    {scenarioPresets.map((p, i) => (
                      <button key={i} onClick={() => addScenarioFromPreset(p)} className="w-full text-right text-xs px-3 py-2 rounded-lg hover:bg-primary/10 text-foreground transition-all">
                        {p.icon} {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={duplicateScenario} className="text-xs px-2 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary transition-all">
                <Copy className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls Panel */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-glass rounded-xl p-5 shadow-glass space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-heading text-foreground">⚙️ متغيرات السيناريو</h3>
                  <button onClick={reset} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    <RotateCcw className="w-3 h-3" /> إعادة ضبط
                  </button>
                </div>

                {/* Scenario Name */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">اسم السيناريو</span>
                  <input
                    value={scenario.name}
                    onChange={e => updateScenario({ name: e.target.value })}
                    className="w-full bg-secondary/30 rounded-lg px-3 py-1.5 text-xs text-foreground border border-border outline-none focus:border-primary/30"
                  />
                </div>

                <SliderControl label="📣 ميزانية الإعلانات" value={scenario.adSpendChange} onChange={v => updateScenario({ adSpendChange: v })} min={-50} max={100} step={5} unit="%" color="hsl(200, 80%, 55%)" />
                <SliderControl label="💰 تغيير الأسعار" value={scenario.priceChange} onChange={v => updateScenario({ priceChange: v })} min={-20} max={30} step={1} unit="%" color="hsl(152, 60%, 45%)" />
                <SliderControl label="🏟 نسبة الإشغال" value={scenario.occupancyChange} onChange={v => updateScenario({ occupancyChange: v })} min={-30} max={50} step={5} unit="%" color="hsl(175, 60%, 45%)" />
                <SliderControl label="✂️ تخفيض التكاليف" value={scenario.costReduction} onChange={v => updateScenario({ costReduction: v })} min={0} max={30} step={1} unit="%" color="hsl(38, 92%, 50%)" />
                <SliderControl label="📈 زيادة الحملات" value={scenario.campaignIncrease} onChange={v => updateScenario({ campaignIncrease: v })} min={0} max={100} step={5} unit="%" color="hsl(280, 60%, 55%)" />

                {/* Forecast Range */}
                <SliderControl label="📅 مدى التوقع (أشهر)" value={scenario.forecastMonths} onChange={v => updateScenario({ forecastMonths: v })} min={3} max={60} step={3} unit=" شهر" color="hsl(200, 80%, 55%)" />

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">🏢 فتح فرع جديد</span>
                  <button
                    onClick={() => updateScenario({ newBranch: !scenario.newBranch })}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      scenario.newBranch
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'bg-secondary/30 border-border text-muted-foreground'
                    }`}
                  >
                    {scenario.newBranch ? 'مفعّل ✓' : 'غير مفعّل'}
                  </button>
                </div>

                {/* Risk Score */}
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">⚡ مستوى المخاطرة</span>
                    <span className={`text-xs font-bold ${impact.riskScore > 60 ? 'text-destructive' : impact.riskScore > 30 ? 'text-warning' : 'text-success'}`}>
                      {impact.riskScore.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${impact.riskScore > 60 ? 'bg-destructive' : impact.riskScore > 30 ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${impact.riskScore}%` }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Results */}
              <div className="lg:col-span-2 space-y-6">
                {/* Impact Cards */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <h3 className="text-sm font-heading text-muted-foreground mb-3">📊 نتائج المحاكاة</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <ImpactCard label="الإيرادات المتوقعة" current={companyMetrics.totalRevenue} simulated={impact.revenue} unit="ريال" />
                    <ImpactCard label="المصروفات المتوقعة" current={companyMetrics.totalExpenses} simulated={impact.expenses} unit="ريال" inverse />
                    <ImpactCard label="صافي الربح" current={companyMetrics.netProfit} simulated={impact.profit} unit="ريال" />
                    <ImpactCard label="هامش الربح" current={companyMetrics.grossMargin} simulated={impact.margin} unit="%" />
                    <ImpactCard label="ROI" current={companyMetrics.roi} simulated={impact.roi} unit="%" />
                    <ImpactCard label="نسبة السيولة" current={companyMetrics.liquidityRatio} simulated={impact.liquidity} unit="x" />
                    <ImpactCard label="معدل الحرق/شهر" current={companyMetrics.burnRate} simulated={impact.burnRate} unit="ريال" inverse />
                    <ImpactCard label="المدرج (أشهر)" current={companyMetrics.runway} simulated={impact.runway} unit=" شهر" />
                  </div>
                </motion.div>

                {/* Comparison Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-glass rounded-xl p-5 shadow-glass">
                  <h3 className="text-sm font-heading text-muted-foreground mb-4">مقارنة: الوضع الحالي vs المحاكاة</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 18%)" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="الحالي" fill="hsl(215, 30%, 30%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="المحاكاة" fill="hsl(200, 80%, 55%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Monthly Projection */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-glass rounded-xl p-5 shadow-glass">
                  <h3 className="text-sm font-heading text-muted-foreground mb-4">📈 توقع الربح ({scenario.forecastMonths} شهر)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={monthlyProjection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 18%)" />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'hsl(210, 15%, 55%)', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="الحالي" stroke="hsl(215, 30%, 45%)" fill="hsl(215, 30%, 45% / 0.1)" strokeWidth={2} strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="المحاكاة" stroke="hsl(200, 80%, 55%)" fill="hsl(200, 80%, 55% / 0.1)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Summary */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-glass rounded-xl p-5 shadow-glass watermark-logo">
                  <h3 className="text-sm font-heading text-muted-foreground mb-3">🎯 ملخص أثر القرار</h3>
                  <div className="space-y-2 text-sm text-foreground relative z-10">
                    {impact.profitChange > 0 ? (
                      <p className="text-success">✅ هذا السيناريو يزيد الربح بمقدار {formatCurrency(impact.profitChange)} ({((impact.profitChange / companyMetrics.netProfit) * 100).toFixed(1)}%)</p>
                    ) : impact.profitChange < 0 ? (
                      <p className="text-destructive">⚠️ هذا السيناريو يقلل الربح بمقدار {formatCurrency(Math.abs(impact.profitChange))} ({((Math.abs(impact.profitChange) / companyMetrics.netProfit) * 100).toFixed(1)}%)</p>
                    ) : (
                      <p className="text-muted-foreground">↔️ لا تغيير — عدّل المتغيرات لرؤية التأثير</p>
                    )}
                    {impact.revenueChange !== 0 && (
                      <p className="text-muted-foreground text-xs">
                        الإيرادات {impact.revenueChange > 0 ? 'ترتفع' : 'تنخفض'} {formatCurrency(Math.abs(impact.revenueChange))} | المصروفات {impact.expenseChange > 0 ? 'ترتفع' : 'تنخفض'} {formatCurrency(Math.abs(impact.expenseChange))}
                      </p>
                    )}
                    {/* Extended forecast impacts */}
                    {scenario.forecastMonths >= 24 && impact.profitChange !== 0 && (
                      <div className="mt-3 pt-3 border-t border-border space-y-1">
                        <p className="text-xs text-muted-foreground">
                          📅 بعد 6 أشهر: {formatCurrency(impact.profitChange * 0.5)} | بعد سنة: {formatCurrency(impact.profitChange)} | بعد سنتين: {formatCurrency(impact.profitChange * 2.2)}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="spreadsheet" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-glass rounded-xl p-5 shadow-glass watermark-logo">
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-heading text-foreground">BatShark Financial Lab — نظام الجداول</h3>
              </div>
              <div className="relative z-10">
                <SpreadsheetView tables={tables} setTables={setTables} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
