import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, TrendingUp, TrendingDown, DollarSign, Plus, Trash2,
  RotateCcw, Save, BarChart3, Download,
  Calculator, Layers, FileSpreadsheet, Copy, ChevronDown,
  BookOpen, Loader2, Check
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from 'recharts';
import Layout from '@/components/Layout';
import PrintButton from '@/components/PrintButton';
import { useProjects } from '@/hooks/useProjects';
import { computeCompanyMetrics } from '@/hooks/useFinancialEngine';
import {
  useJournalEntries, useAllJournalLines, useChartOfAccounts,
  useCreateJournalEntry, useDeleteJournalEntry, computeFinancialStatements,
  type DBJournalLine
} from '@/hooks/useJournalEntries';
import { formatCurrency, formatPercent } from '@/data/mockData';
import { Slider } from '@/components/ui/slider';
import logo from '@/assets/batshark-logo-new.png';
import AskMeDialog from '@/components/AskMeDialog';

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
      if (dnpv === 0) break;
      r -= npv / dnpv;
    }
    return r * 100;
  }},
  CAGR: { label: 'CAGR', desc: 'معدل النمو السنوي المركب', fn: ([begin, end, years]) => (Math.pow(end / begin, 1 / years) - 1) * 100 },
  FORECAST: { label: 'Forecast', desc: 'توقع النمو', fn: ([current, rate, months]) => current * Math.pow(1 + rate / 100, months / 12) },
};

// =================== SIMULATION ENGINE ===================
function simulateImpact(scenario: Scenario, baseRevenue: number, baseExpenses: number, baseProfit: number, baseLiquidity: number, baseRunway: number) {
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
  const profitChange = newProfit - baseProfit;
  const newMargin = newRevenue > 0 ? (newProfit / newRevenue) * 100 : 0;
  const newROI = newExpenses > 0 ? (newProfit / newExpenses) * 100 : 0;
  const newLiquidity = baseLiquidity * (newProfit > 0 ? 1 + (profitChange / (baseRevenue || 1)) * 0.5 : 1 - Math.abs(profitChange / (baseRevenue || 1)) * 0.3);
  const newBurnRate = newExpenses / 12;
  const riskScore = Math.max(0, Math.min(100, 50 - (profitChange / (baseRevenue || 1)) * 100 + (scenario.newBranch ? 15 : 0)));

  return {
    revenue: newRevenue, expenses: newExpenses, profit: newProfit, profitChange,
    margin: newMargin, roi: newROI, liquidity: newLiquidity, burnRate: newBurnRate,
    runway: Math.max(1, newBurnRate > 0 ? Math.round(Math.max(newProfit, 0) / newBurnRate * 6) : baseRunway),
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
function SpreadsheetView({ tables, setTables, metrics }: { tables: SpreadsheetTable[]; setTables: React.Dispatch<React.SetStateAction<SpreadsheetTable[]>>; metrics: any }) {
  const [activeTable, setActiveTable] = useState(0);
  const [editingCell, setEditingCell] = useState<{ row: string; col: string } | null>(null);
  const [formulaBar, setFormulaBar] = useState('');

  const table = tables[activeTable];

  const handleCellClick = (rowId: string, colId: string) => {
    const cell = table.rows.find(r => r.id === rowId)?.cells[colId];
    setEditingCell({ row: rowId, col: colId });
    setFormulaBar(cell?.raw || '');
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
      <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2 border border-border">
        <Calculator className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground font-heading min-w-[60px]">
          {editingCell ? `${editingCell.col}:${editingCell.row}` : 'fx'}
        </span>
        <input
          value={formulaBar}
          onChange={e => setFormulaBar(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCellCommit()}
          onBlur={handleCellCommit}
          placeholder="أدخل قيمة أو معادلة"
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tables.map((t, i) => (
          <button key={t.id} onClick={() => setActiveTable(i)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              i === activeTable ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
            }`}>{t.name}</button>
        ))}
        <button onClick={addTable} className="text-xs px-2 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:text-primary"><Plus className="w-3 h-3" /></button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/30">
              <th className="p-2 text-center text-muted-foreground text-[10px] w-8">#</th>
              {table.columns.map(col => (
                <th key={col.id} className="p-2 text-right text-muted-foreground text-[10px] font-heading" style={{ minWidth: col.width || 100 }}>{col.label}</th>
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
                    <td key={col.id} onClick={() => handleCellClick(row.id, col.id)}
                      className={`p-2 cursor-pointer transition-all ${isEditing ? 'bg-primary/10 ring-1 ring-primary/30' : ''} ${cell?.formula ? 'text-primary' : 'text-foreground'}`}>
                      {isEditing ? (
                        <input autoFocus value={formulaBar} onChange={e => setFormulaBar(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleCellCommit()} onBlur={handleCellCommit}
                          className="w-full bg-transparent outline-none text-sm" />
                      ) : (
                        <span className="text-xs">
                          {typeof cell?.computed === 'number' ? new Intl.NumberFormat('ar-SA').format(cell.computed) : cell?.computed || ''}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="p-1">
                  <button onClick={() => deleteRow(row.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3 h-3" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={addRow} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1">
          <Plus className="w-3 h-3" /> صف جديد
        </button>
        <button onClick={addColumn} className="text-xs px-3 py-1.5 rounded-lg bg-accent/30 text-accent-foreground border border-border hover:bg-accent/50 transition-all flex items-center gap-1">
          <Plus className="w-3 h-3" /> عمود جديد
        </button>
      </div>

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

// =================== JOURNAL ENTRIES COMPONENT ===================
function JournalEntriesView() {
  const { data: entries, isLoading } = useJournalEntries();
  const { data: allLines } = useAllJournalLines();
  const { data: accounts } = useChartOfAccounts();
  const createEntry = useCreateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const { data: dbProjects } = useProjects();

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<{ account_name: string; account_type: string; debit: string; credit: string }[]>([
    { account_name: '', account_type: 'expense', debit: '0', credit: '0' },
    { account_name: '', account_type: 'revenue', debit: '0', credit: '0' },
  ]);

  const statements = useMemo(() => {
    if (!allLines) return null;
    return computeFinancialStatements(allLines);
  }, [allLines]);

  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const addLine = () => setLines(p => [...p, { account_name: '', account_type: 'expense', debit: '0', credit: '0' }]);
  const removeLine = (i: number) => setLines(p => p.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!description.trim()) return;
    if (!isBalanced) return;

    await createEntry.mutateAsync({
      entry: { description, entry_date: entryDate, project_id: projectId || undefined, notes: notes || undefined },
      lines: lines.map(l => ({
        account_name: l.account_name,
        account_type: l.account_type,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
      })),
    });

    setShowForm(false);
    setDescription('');
    setNotes('');
    setLines([
      { account_name: '', account_type: 'expense', debit: '0', credit: '0' },
      { account_name: '', account_type: 'revenue', debit: '0', credit: '0' },
    ]);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Financial Statements Summary */}
      {statements && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-glass rounded-xl p-4 shadow-glass border border-success/20">
            <p className="text-[10px] text-muted-foreground mb-1">📊 قائمة الدخل</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">الإيرادات</span><span className="text-success font-bold">{formatCurrency(statements.incomeStatement.totalRevenue)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">المصروفات</span><span className="text-destructive font-bold">{formatCurrency(statements.incomeStatement.totalExpenses)}</span></div>
              <div className="border-t border-border pt-1 flex justify-between text-xs"><span className="font-heading font-bold">صافي الدخل</span><span className={`font-bold ${statements.incomeStatement.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(statements.incomeStatement.netIncome)}</span></div>
            </div>
          </div>
          <div className="bg-glass rounded-xl p-4 shadow-glass border border-primary/20">
            <p className="text-[10px] text-muted-foreground mb-1">📋 الميزانية العمومية</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">الأصول</span><span className="text-primary font-bold">{formatCurrency(statements.balanceSheet.totalAssets)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">الالتزامات</span><span className="text-warning font-bold">{formatCurrency(statements.balanceSheet.totalLiabilities)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">حقوق الملكية</span><span className="text-foreground font-bold">{formatCurrency(statements.balanceSheet.totalEquity)}</span></div>
            </div>
          </div>
          <div className="bg-glass rounded-xl p-4 shadow-glass border border-border">
            <p className="text-[10px] text-muted-foreground mb-1">📒 دفتر الأستاذ</p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {statements.byAccount.filter(a => a.balance !== 0).map(a => (
                <div key={a.name} className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground truncate">{a.name}</span>
                  <span className={`font-bold ${a.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>{formatCurrency(a.balance)}</span>
                </div>
              ))}
              {statements.byAccount.filter(a => a.balance !== 0).length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center">لا توجد قيود بعد</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> دفتر اليومية — القيود المحاسبية
        </h3>
        <button onClick={() => setShowForm(!showForm)}
          className="text-xs px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20 transition-all flex items-center gap-1">
          <Plus className="w-3 h-3" /> قيد جديد
        </button>
      </div>

      {/* New Entry Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-card rounded-xl border border-primary/20 p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">الوصف *</label>
                  <input value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="وصف القيد..." />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">التاريخ</label>
                  <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)}
                    className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">المشروع</label>
                  <select value={projectId} onChange={e => setProjectId(e.target.value)}
                    className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                    <option value="">بدون مشروع</option>
                    {dbProjects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Lines */}
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground">بنود القيد (مدين / دائن)</p>
                {lines.map((line, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={line.account_name} onChange={e => {
                      const acc = accounts?.find(a => a.name === e.target.value);
                      setLines(p => p.map((l, idx) => idx === i ? { ...l, account_name: e.target.value, account_type: acc?.account_type || l.account_type } : l));
                    }} className="flex-1 bg-secondary/30 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground">
                      <option value="">اختر الحساب</option>
                      {accounts?.map(a => <option key={a.id} value={a.name}>{a.code} - {a.name}</option>)}
                    </select>
                    <input type="number" value={line.debit} onChange={e => setLines(p => p.map((l, idx) => idx === i ? { ...l, debit: e.target.value } : l))}
                      className="w-24 bg-secondary/30 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground" placeholder="مدين" />
                    <input type="number" value={line.credit} onChange={e => setLines(p => p.map((l, idx) => idx === i ? { ...l, credit: e.target.value } : l))}
                      className="w-24 bg-secondary/30 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground" placeholder="دائن" />
                    {lines.length > 2 && (
                      <button onClick={() => removeLine(i)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                ))}
                <button onClick={addLine} className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"><Plus className="w-3 h-3" /> بند إضافي</button>
              </div>

              {/* Balance check */}
              <div className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2">
                <div className="flex gap-4 text-xs">
                  <span>مجموع المدين: <b className="text-primary">{formatCurrency(totalDebit)}</b></span>
                  <span>مجموع الدائن: <b className="text-primary">{formatCurrency(totalCredit)}</b></span>
                </div>
                <span className={`text-xs font-bold flex items-center gap-1 ${isBalanced ? 'text-success' : 'text-destructive'}`}>
                  {isBalanced ? <><Check className="w-3 h-3" /> متوازن</> : 'غير متوازن ⚠️'}
                </span>
              </div>

              <div className="flex gap-2">
                <button onClick={handleSubmit} disabled={!isBalanced || !description.trim() || createEntry.isPending}
                  className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1">
                  {createEntry.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} حفظ القيد
                </button>
                <button onClick={() => setShowForm(false)} className="text-xs px-4 py-2 rounded-lg bg-secondary/50 text-muted-foreground">إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries List */}
      <div className="space-y-2">
        {entries?.map(entry => (
          <JournalEntryRow key={entry.id} entry={entry} onDelete={() => {
            if (confirm('هل أنت متأكد من حذف هذا القيد؟')) deleteEntry.mutate(entry.id);
          }} />
        ))}
        {(!entries || entries.length === 0) && (
          <p className="text-center text-sm text-muted-foreground py-8">لا توجد قيود محاسبية بعد. أضف أول قيد!</p>
        )}
      </div>
    </div>
  );
}

function JournalEntryRow({ entry, onDelete }: { entry: any; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { data: lines } = useAllJournalLines();
  const entryLines = lines?.filter((l: DBJournalLine) => l.journal_entry_id === entry.id) || [];

  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:shadow-card transition-all">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">#{entry.entry_number}</span>
          <div>
            <p className="text-sm text-foreground font-medium">{entry.description}</p>
            <p className="text-[10px] text-muted-foreground">{entry.entry_date} · {entry.created_by}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${entry.is_balanced ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {entry.is_balanced ? 'متوازن ✓' : 'غير متوازن'}
          </span>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
      {expanded && entryLines.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <table className="w-full text-xs">
            <thead><tr className="text-muted-foreground"><th className="text-right py-1">الحساب</th><th className="text-right py-1">النوع</th><th className="text-right py-1">مدين</th><th className="text-right py-1">دائن</th></tr></thead>
            <tbody>
              {entryLines.map((l: DBJournalLine) => (
                <tr key={l.id} className="border-t border-border/50">
                  <td className="py-1 text-foreground">{l.account_name}</td>
                  <td className="py-1 text-muted-foreground">{l.account_type}</td>
                  <td className="py-1 text-primary font-bold">{Number(l.debit) > 0 ? formatCurrency(Number(l.debit)) : '-'}</td>
                  <td className="py-1 text-success font-bold">{Number(l.credit) > 0 ? formatCurrency(Number(l.credit)) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =================== MAIN PAGE ===================
export default function FinancialLab() {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'spreadsheet' | 'journal'>('scenarios');
  const [scenarios, setScenarios] = useState<Scenario[]>([{ ...defaultScenario }]);
  const [activeScenario, setActiveScenario] = useState(0);

  // DB data
  const { data: dbProjects, isLoading } = useProjects();
  const metrics = dbProjects ? computeCompanyMetrics(dbProjects) : null;
  const m = metrics || { totalRevenue: 0, totalExpenses: 0, netProfit: 0, liquidityRatio: 0, runway: 0, grossMargin: 0, roi: 0, burnRate: 0 };

  // Build spreadsheet from real data
  const defaultTable: SpreadsheetTable = useMemo(() => ({
    id: 'main',
    name: 'الجدول الرئيسي',
    columns: [
      { id: 'label', label: 'البند', width: 180 },
      ...( dbProjects?.map(p => ({ id: p.id, label: p.name })) || [] ),
      { id: 'total', label: 'الإجمالي' },
    ],
    rows: [
      {
        id: 'revenue',
        cells: {
          label: { raw: 'الإيرادات', computed: 'الإيرادات' },
          ...(dbProjects?.reduce((acc, p) => ({ ...acc, [p.id]: { raw: String(p.total_revenue), computed: Number(p.total_revenue) } }), {}) || {}),
          total: { raw: '=SUM', computed: m.totalRevenue, formula: 'SUM' },
        },
      },
      {
        id: 'expenses',
        cells: {
          label: { raw: 'المصروفات', computed: 'المصروفات' },
          ...(dbProjects?.reduce((acc, p) => ({ ...acc, [p.id]: { raw: String(p.total_expenses), computed: Number(p.total_expenses) } }), {}) || {}),
          total: { raw: '=SUM', computed: m.totalExpenses, formula: 'SUM' },
        },
      },
      {
        id: 'profit',
        cells: {
          label: { raw: 'صافي الربح', computed: 'صافي الربح' },
          ...(dbProjects?.reduce((acc, p) => ({ ...acc, [p.id]: { raw: String(p.net_profit), computed: Number(p.net_profit) } }), {}) || {}),
          total: { raw: '=SUM', computed: m.netProfit, formula: 'SUM' },
        },
      },
    ],
  }), [dbProjects, m]);

  const [tables, setTables] = useState<SpreadsheetTable[]>([]);
  // Init tables from DB data
  useMemo(() => {
    if (dbProjects && tables.length === 0) {
      setTables([defaultTable]);
    }
  }, [dbProjects]);

  const scenario = scenarios[activeScenario];
  const impact = useMemo(() => simulateImpact(scenario, m.totalRevenue, m.totalExpenses, m.netProfit, m.liquidityRatio, m.runway), [scenario, m]);

  const updateScenario = (updates: Partial<Scenario>) => {
    setScenarios(prev => prev.map((s, i) => i === activeScenario ? { ...s, ...updates } : s));
  };

  const addScenarioFromPreset = (preset: Partial<Scenario>) => {
    const newScenario: Scenario = { ...defaultScenario, ...preset, id: String(Date.now()), forecastMonths: 12 };
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenario(scenarios.length);
  };

  const [showPresets, setShowPresets] = useState(false);

  const comparisonData = [
    { name: 'الإيرادات', الحالي: m.totalRevenue, المحاكاة: impact.revenue },
    { name: 'المصروفات', الحالي: m.totalExpenses, المحاكاة: impact.expenses },
    { name: 'الربح', الحالي: m.netProfit, المحاكاة: impact.profit },
  ];

  const monthlyProjection = Array.from({ length: scenario.forecastMonths }, (_, i) => {
    const month = i + 1;
    const factor = m.netProfit !== 0 ? 1 + (impact.profitChange / m.netProfit) * (month / 12) * 0.8 : 1;
    return {
      month: `شهر ${month}`,
      الحالي: Math.round(m.netProfit / 12),
      المحاكاة: Math.round((m.netProfit / 12) * factor),
    };
  });

  const tabs = [
    { id: 'scenarios' as const, label: '🔬 محرك السيناريوهات', icon: Layers },
    { id: 'spreadsheet' as const, label: '📊 نظام الجداول', icon: FileSpreadsheet },
    { id: 'journal' as const, label: '📒 القيود المحاسبية', icon: BookOpen },
  ];

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="BatShark" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-2xl font-heading font-bold text-gradient-blue">BatShark Financial Lab</h1>
              <p className="text-sm text-muted-foreground">مختبر النمذجة المالية — بيانات حية من قاعدة البيانات</p>
            </div>
          </div>
          <PrintButton title="طباعة المختبر المالي" />
        </div>

        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-heading transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-glass'
                  : 'bg-secondary/30 text-muted-foreground border border-border hover:text-foreground'
              }`}>
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
                  <button onClick={() => setActiveScenario(i)}
                    className={`text-xs px-3 py-1.5 rounded-r-lg border transition-all ${
                      i === activeScenario ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary/30 border-border text-muted-foreground hover:text-foreground'
                    }`}>{s.icon} {s.name}</button>
                  {scenarios.length > 1 && (
                    <button onClick={() => { setScenarios(p => p.filter((_, idx) => idx !== i)); setActiveScenario(Math.max(0, activeScenario - 1)); }}
                      className="text-xs px-1.5 py-1.5 rounded-l-lg border border-r-0 border-border text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
              ))}
              <div className="relative">
                <button onClick={() => setShowPresets(!showPresets)} className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-primary/30 text-primary hover:bg-primary/10 transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" /> سيناريو جديد <ChevronDown className="w-3 h-3" />
                </button>
                {showPresets && (
                  <div className="absolute top-full mt-1 right-0 z-50 bg-card border border-border rounded-xl shadow-elevated p-2 min-w-[200px]">
                    {scenarioPresets.map((p, i) => (
                      <button key={i} onClick={() => { addScenarioFromPreset(p); setShowPresets(false); }}
                        className="w-full text-right text-xs px-3 py-2 rounded-lg hover:bg-primary/10 text-foreground transition-all">{p.icon} {p.name}</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => { const copy = { ...scenario, id: String(Date.now()), name: `${scenario.name} (نسخة)` }; setScenarios(p => [...p, copy]); setActiveScenario(scenarios.length); }}
                className="text-xs px-2 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary transition-all"><Copy className="w-3 h-3" /></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-glass rounded-xl p-5 shadow-glass space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-heading text-foreground">⚙️ متغيرات السيناريو</h3>
                  <button onClick={() => { setScenarios([{ ...defaultScenario }]); setActiveScenario(0); }}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><RotateCcw className="w-3 h-3" /> إعادة ضبط</button>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">اسم السيناريو</span>
                  <input value={scenario.name} onChange={e => updateScenario({ name: e.target.value })}
                    className="w-full bg-secondary/30 rounded-lg px-3 py-1.5 text-xs text-foreground border border-border outline-none focus:border-primary/30" />
                </div>
                <SliderControl label="📣 ميزانية الإعلانات" value={scenario.adSpendChange} onChange={v => updateScenario({ adSpendChange: v })} min={-50} max={100} step={5} unit="%" color="hsl(200, 80%, 55%)" />
                <SliderControl label="💰 تغيير الأسعار" value={scenario.priceChange} onChange={v => updateScenario({ priceChange: v })} min={-20} max={30} step={1} unit="%" color="hsl(152, 60%, 45%)" />
                <SliderControl label="🏟 نسبة الإشغال" value={scenario.occupancyChange} onChange={v => updateScenario({ occupancyChange: v })} min={-30} max={50} step={5} unit="%" color="hsl(175, 60%, 45%)" />
                <SliderControl label="✂️ تخفيض التكاليف" value={scenario.costReduction} onChange={v => updateScenario({ costReduction: v })} min={0} max={30} step={1} unit="%" color="hsl(38, 92%, 50%)" />
                <SliderControl label="📈 زيادة الحملات" value={scenario.campaignIncrease} onChange={v => updateScenario({ campaignIncrease: v })} min={0} max={100} step={5} unit="%" color="hsl(280, 60%, 55%)" />
                <SliderControl label="📅 مدى التوقع (أشهر)" value={scenario.forecastMonths} onChange={v => updateScenario({ forecastMonths: v })} min={3} max={60} step={3} unit=" شهر" color="hsl(200, 80%, 55%)" />
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">🏢 فتح فرع جديد</span>
                  <button onClick={() => updateScenario({ newBranch: !scenario.newBranch })}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${scenario.newBranch ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-secondary/30 border-border text-muted-foreground'}`}>
                    {scenario.newBranch ? 'مفعّل ✓' : 'غير مفعّل'}
                  </button>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">⚡ مستوى المخاطرة</span>
                    <span className={`text-xs font-bold ${impact.riskScore > 60 ? 'text-destructive' : impact.riskScore > 30 ? 'text-warning' : 'text-success'}`}>{impact.riskScore.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${impact.riskScore > 60 ? 'bg-destructive' : impact.riskScore > 30 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${impact.riskScore}%` }} />
                  </div>
                </div>
              </motion.div>

              {/* Results */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-sm font-heading text-muted-foreground mb-3">📊 نتائج المحاكاة (بيانات حية)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <ImpactCard label="الإيرادات المتوقعة" current={m.totalRevenue} simulated={impact.revenue} unit="ريال" />
                    <ImpactCard label="المصروفات المتوقعة" current={m.totalExpenses} simulated={impact.expenses} unit="ريال" inverse />
                    <ImpactCard label="صافي الربح" current={m.netProfit} simulated={impact.profit} unit="ريال" />
                    <ImpactCard label="هامش الربح" current={m.grossMargin} simulated={impact.margin} unit="%" />
                    <ImpactCard label="ROI" current={m.roi} simulated={impact.roi} unit="%" />
                    <ImpactCard label="نسبة السيولة" current={m.liquidityRatio} simulated={impact.liquidity} unit="x" />
                    <ImpactCard label="معدل الحرق/شهر" current={m.burnRate} simulated={impact.burnRate} unit="ريال" inverse />
                    <ImpactCard label="المدرج (أشهر)" current={m.runway} simulated={impact.runway} unit=" شهر" />
                  </div>
                </motion.div>

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

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-glass rounded-xl p-5 shadow-glass">
                  <h3 className="text-sm font-heading text-muted-foreground mb-3">🎯 ملخص أثر القرار</h3>
                  <div className="space-y-2 text-sm text-foreground">
                    {impact.profitChange > 0 ? (
                      <p className="text-success">✅ هذا السيناريو يزيد الربح بمقدار {formatCurrency(impact.profitChange)}</p>
                    ) : impact.profitChange < 0 ? (
                      <p className="text-destructive">⚠️ هذا السيناريو يقلل الربح بمقدار {formatCurrency(Math.abs(impact.profitChange))}</p>
                    ) : (
                      <p className="text-muted-foreground">↔️ لا تغيير — عدّل المتغيرات لرؤية التأثير</p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'spreadsheet' ? (
          <motion.div key="spreadsheet" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-glass rounded-xl p-5 shadow-glass">
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-heading text-foreground">BatShark Financial Lab — بيانات حية</h3>
              </div>
              <SpreadsheetView tables={tables} setTables={setTables} metrics={m} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="journal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <JournalEntriesView />
          </motion.div>
        )}
      </AnimatePresence>
      <AskMeDialog pageKey="lab" />
    </Layout>
  );
}
