import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Table2, Save, X, FileSpreadsheet, Calculator, Pencil, Check, Settings2 } from 'lucide-react';
import Layout from '@/components/Layout';
import AskMeDialog from '@/components/AskMeDialog';
import {
  useCustomTables, useCustomTableRows, useCreateCustomTable,
  useDeleteCustomTable, useAddCustomTableRow, useUpdateCustomTableRow,
  useDeleteCustomTableRow, useUpdateCustomTableColumns,
  type CustomTableColumn, type CustomTableRow,
} from '@/hooks/useCustomTables';
import { useProjects } from '@/hooks/useProjects';
import { usePageViewTracker } from '@/hooks/useAutoTracker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TABLE_TYPES = [
  { value: 'financial', label: '💰 مالي', color: 'text-success' },
  { value: 'operational', label: '⚙️ تشغيلي', color: 'text-primary' },
  { value: 'employees', label: '👥 موظفين', color: 'text-orange' },
  { value: 'contracts', label: '📄 عقود', color: 'text-purple' },
  { value: 'general', label: '📋 عام', color: 'text-muted-foreground' },
];

const COL_TYPES: { value: CustomTableColumn['type']; label: string }[] = [
  { value: 'text', label: 'نص' },
  { value: 'number', label: 'رقم' },
  { value: 'date', label: 'تاريخ' },
  { value: 'percentage', label: 'نسبة %' },
  { value: 'formula', label: '🧮 معادلة' },
];

function evaluateFormula(formula: string, rowData: Record<string, any>, allRows: CustomTableRow[], columns: CustomTableColumn[]): number {
  if (!formula || !formula.startsWith('=')) return 0;
  const expr = formula.slice(1).trim();

  const sumMatch = expr.match(/^SUM\((\w+)\)$/i);
  if (sumMatch) {
    const colId = sumMatch[1];
    return allRows.reduce((sum, r) => sum + (Number(r.data[colId]) || 0), 0);
  }

  const avgMatch = expr.match(/^AVG\((\w+)\)$/i);
  if (avgMatch) {
    const colId = avgMatch[1];
    const total = allRows.reduce((sum, r) => sum + (Number(r.data[colId]) || 0), 0);
    return allRows.length > 0 ? total / allRows.length : 0;
  }

  try {
    let evalExpr = expr;
    columns.forEach(col => {
      const regex = new RegExp(`\\b${col.id}\\b`, 'g');
      evalExpr = evalExpr.replace(regex, String(Number(rowData[col.id]) || 0));
    });
    const result = Function(`"use strict"; return (${evalExpr})`)();
    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

function TableEditor({ tableId, columns, onColumnsUpdate }: { 
  tableId: string; 
  columns: CustomTableColumn[];
  onColumnsUpdate: (cols: CustomTableColumn[]) => void;
}) {
  const { data: rows } = useCustomTableRows(tableId);
  const addRow = useAddCustomTableRow();
  const updateRow = useUpdateCustomTableRow();
  const deleteRow = useDeleteCustomTableRow();
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [colLabel, setColLabel] = useState('');
  const [editingColType, setEditingColType] = useState<string | null>(null);
  const [editingRowName, setEditingRowName] = useState<string | null>(null);
  const [rowNameValue, setRowNameValue] = useState('');

  const handleCellClick = (rowId: string, colId: string, currentValue: any) => {
    const col = columns.find(c => c.id === colId);
    if (col?.type === 'formula') return;
    setEditingCell({ rowId, colId });
    setCellValue(String(currentValue ?? ''));
  };

  const handleCellSave = (row: CustomTableRow) => {
    if (!editingCell) return;
    const col = columns.find(c => c.id === editingCell.colId);
    let newVal: any = cellValue;
    if (col?.type === 'number' || col?.type === 'percentage') {
      newVal = Number(cellValue) || 0;
    }
    if (newVal === row.data[editingCell.colId]) {
      setEditingCell(null);
      return;
    }
    const newData = { ...row.data, [editingCell.colId]: newVal };
    updateRow.mutate(
      { id: row.id, table_id: tableId, data: newData },
      {
        onSuccess: () => setEditingCell(null),
        onError: () => setEditingCell(null),
      }
    );
  };

  const handleAddRow = () => {
    const emptyData: Record<string, any> = { _row_name: `صف ${(rows?.length || 0) + 1}` };
    columns.forEach(c => { 
      if (c.type === 'number' || c.type === 'percentage') emptyData[c.id] = 0;
      else if (c.type === 'formula') emptyData[c.id] = '';
      else emptyData[c.id] = ''; 
    });
    addRow.mutate({ table_id: tableId, data: emptyData });
  };

  const handleRowNameSave = (row: CustomTableRow) => {
    if (!editingRowName) return;
    if (rowNameValue === (row.data._row_name || '')) {
      setEditingRowName(null);
      return;
    }
    const newData = { ...row.data, _row_name: rowNameValue };
    updateRow.mutate(
      { id: row.id, table_id: tableId, data: newData },
      {
        onSuccess: () => setEditingRowName(null),
        onError: () => setEditingRowName(null),
      }
    );
  };

  const handleColRename = (colId: string) => {
    if (!colLabel.trim()) {
      setEditingColId(null);
      return;
    }
    const updated = columns.map(c => c.id === colId ? { ...c, label: colLabel } : c);
    onColumnsUpdate(updated);
    setEditingColId(null);
  };

  const handleColTypeChange = (colId: string, newType: CustomTableColumn['type']) => {
    const updated = columns.map(c => c.id === colId ? { ...c, type: newType } : c);
    onColumnsUpdate(updated);
    setEditingColType(null);
  };

  const handleDeleteColumn = (colId: string) => {
    if (columns.length <= 1) return;
    const updated = columns.filter(c => c.id !== colId);
    onColumnsUpdate(updated);
  };

  const handleAddColumn = () => {
    const newCol: CustomTableColumn = {
      id: `col_${Date.now()}`,
      label: '',
      type: 'text',
    };
    onColumnsUpdate([...columns, newCol]);
  };

  const columnSums: Record<string, number> = {};
  columns.forEach(col => {
    if (col.type === 'number' || col.type === 'percentage') {
      columnSums[col.id] = (rows || []).reduce((sum, r) => sum + (Number(r.data[col.id]) || 0), 0);
    }
  });

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30">
              <th className="p-2.5 text-center text-muted-foreground text-[10px] w-10">#</th>
              {columns.map(col => (
                <th key={col.id} className="p-2.5 text-right text-muted-foreground text-[10px] font-heading group" style={{ minWidth: col.width || 120 }}>
                  {editingColId === col.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={colLabel}
                        onChange={e => setColLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleColRename(col.id); if (e.key === 'Escape') setEditingColId(null); }}
                        onBlur={() => handleColRename(col.id)}
                        className="bg-transparent border-b border-primary text-foreground text-[10px] outline-none w-full"
                      />
                      <button onClick={() => handleColRename(col.id)}><Check className="w-3 h-3 text-success" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className={col.label ? '' : 'italic text-muted-foreground/50'}>{col.label || 'بدون اسم'}</span>
                      {editingColType === col.id ? (
                        <select
                          autoFocus
                          value={col.type}
                          onChange={e => handleColTypeChange(col.id, e.target.value as CustomTableColumn['type'])}
                          onBlur={() => setEditingColType(null)}
                          className="bg-muted border border-border rounded px-1 py-0.5 text-[8px] text-foreground"
                        >
                          {COL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      ) : (
                        <button onClick={() => setEditingColType(col.id)} className="text-[8px] opacity-50 hover:opacity-100 transition-opacity">
                          ({COL_TYPES.find(t => t.value === col.type)?.label})
                        </button>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        <button onClick={() => { setEditingColId(col.id); setColLabel(col.label); }}>
                          <Pencil className="w-2.5 h-2.5 text-muted-foreground hover:text-primary" />
                        </button>
                        {columns.length > 1 && (
                          <button onClick={() => handleDeleteColumn(col.id)}>
                            <Trash2 className="w-2.5 h-2.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </th>
              ))}
              <th className="p-2 w-16">
                <button onClick={handleAddColumn} className="text-[8px] text-primary hover:text-primary/80 flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> عمود
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((row, ri) => (
              <tr key={row.id} className="border-t border-border hover:bg-primary/5 transition-colors">
                <td className="p-2.5 text-center text-[10px] text-muted-foreground min-w-[60px]">
                  {editingRowName === row.id ? (
                    <input
                      autoFocus
                      value={rowNameValue}
                      onChange={e => setRowNameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRowNameSave(row); if (e.key === 'Escape') setEditingRowName(null); }}
                      onBlur={() => handleRowNameSave(row)}
                      className="w-full bg-transparent border-b border-primary text-foreground text-[10px] outline-none text-center"
                    />
                  ) : (
                    <span
                      onClick={() => { setEditingRowName(row.id); setRowNameValue(String(row.data._row_name || (ri + 1))); }}
                      className="cursor-pointer hover:text-primary transition-colors"
                      title="اضغط لإعادة التسمية"
                    >
                      {row.data._row_name || ri + 1}
                    </span>
                  )}
                </td>
                {columns.map(col => {
                  const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                  const isFormula = col.type === 'formula';
                  const rawVal = row.data[col.id];
                  const displayVal = isFormula && typeof rawVal === 'string' && rawVal.startsWith('=')
                    ? evaluateFormula(rawVal, row.data, rows || [], columns)
                    : rawVal;

                  return (
                    <td key={col.id} onClick={() => handleCellClick(row.id, col.id, rawVal)}
                      className={`p-2.5 cursor-pointer transition-all ${isEditing ? 'bg-primary/10 ring-1 ring-primary/30' : ''} ${isFormula ? 'bg-accent/5' : ''}`}>
                      {isEditing ? (
                        <input
                          autoFocus
                          type={col.type === 'number' || col.type === 'percentage' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                          value={cellValue}
                          onChange={e => setCellValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleCellSave(row); if (e.key === 'Escape') setEditingCell(null); }}
                          onBlur={() => handleCellSave(row)}
                          className="w-full bg-transparent outline-none text-sm text-foreground"
                        />
                      ) : (
                        <span className={`text-xs ${isFormula ? 'text-primary font-mono font-bold' : 'text-foreground'}`}>
                          {(col.type === 'number' || col.type === 'percentage' || isFormula) && typeof displayVal === 'number'
                            ? displayVal.toLocaleString('ar-SA')
                            : String(displayVal ?? '')}
                          {col.type === 'percentage' && displayVal ? '%' : ''}
                          {isFormula && <Calculator className="w-2.5 h-2.5 inline mr-1 opacity-50" />}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="p-1">
                  <button onClick={() => deleteRow.mutate({ id: row.id, table_id: tableId })} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={columns.length + 2} className="p-6 text-center text-muted-foreground text-xs">لا توجد بيانات — اضغط "صف جديد"</td></tr>
            )}
          </tbody>
          {rows && rows.length > 0 && Object.keys(columnSums).length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-primary/20 bg-primary/5">
                <td className="p-2.5 text-center text-[10px] font-bold text-primary">Σ</td>
                {columns.map(col => (
                  <td key={col.id} className="p-2.5 text-right">
                    {(col.type === 'number' || col.type === 'percentage') ? (
                      <span className="text-xs font-bold text-primary font-mono">
                        {columnSums[col.id]?.toLocaleString('ar-SA')}
                        {col.type === 'percentage' ? '%' : ''}
                      </span>
                    ) : null}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleAddRow} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1">
          <Plus className="w-3 h-3" /> صف جديد
        </button>
        <span className="text-[10px] text-muted-foreground">💡 للمعادلات: اكتب =col_1+col_2 أو =SUM(col_1) في خلية "معادلة"</span>
      </div>
    </div>
  );
}

export default function CustomTablesPage() {
  usePageViewTracker('الجداول المخصصة');

  const { data: tables, isLoading } = useCustomTables();
  const { data: projects } = useProjects();
  const createTable = useCreateCustomTable();
  const deleteTable = useDeleteCustomTable();
  const updateColumns = useUpdateCustomTableColumns();

  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('general');
  const [newProjectId, setNewProjectId] = useState('');
  const [newColumns, setNewColumns] = useState<CustomTableColumn[]>([
    { id: 'col_1', label: 'البند', type: 'text' },
    { id: 'col_2', label: 'القيمة', type: 'number' },
  ]);

  const activeTable = tables?.find(t => t.id === activeTableId);

  if (!activeTableId && tables && tables.length > 0) {
    setActiveTableId(tables[0].id);
  }

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createTable.mutateAsync({
      name: newName,
      table_type: newType,
      project_id: newProjectId || undefined,
      columns: newColumns,
    });
    setShowCreate(false);
    setNewName('');
    setNewColumns([
      { id: 'col_1', label: 'البند', type: 'text' },
      { id: 'col_2', label: 'القيمة', type: 'number' },
    ]);
  };

  const addNewColumn = () => {
    setNewColumns(prev => [...prev, { id: `col_${Date.now()}`, label: '', type: 'text' }]);
  };

  const handleColumnsUpdate = useCallback((tableId: string, newCols: CustomTableColumn[]) => {
    updateColumns.mutate({ id: tableId, columns: newCols });
  }, [updateColumns]);

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">📊 نظام الجداول المخصصة</h1>
              <p className="text-sm text-muted-foreground">جداول ذكية مع معادلات تلقائية — أقوى من Excel</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-heading font-bold text-sm">
            <Plus className="w-4 h-4" /> جدول جديد
          </button>
        </div>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-foreground">إنشاء جدول جديد</h3>
            <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">اسم الجدول</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: عقود البادل"
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">النوع</label>
              <select value={newType} onChange={e => setNewType(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                {TABLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ربط بمشروع (اختياري)</label>
              <select value={newProjectId} onChange={e => setNewProjectId(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="">بدون ربط</option>
                {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-2">الأعمدة</label>
            <div className="space-y-2">
              {newColumns.map((col, i) => (
                <div key={col.id} className="flex gap-2 items-center">
                  <input value={col.label} onChange={e => setNewColumns(prev => prev.map((c, j) => j === i ? { ...c, label: e.target.value } : c))}
                    className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground" placeholder="اسم العمود" />
                  <select value={col.type} onChange={e => setNewColumns(prev => prev.map((c, j) => j === i ? { ...c, type: e.target.value as any } : c))}
                    className="bg-muted/30 border border-border rounded-lg px-2 py-1.5 text-sm text-foreground">
                    {COL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {newColumns.length > 1 && (
                    <button onClick={() => setNewColumns(prev => prev.filter((_, j) => j !== i))} className="text-destructive p-1"><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
              ))}
              <button onClick={addNewColumn} className="text-xs px-3 py-1 rounded-lg border border-dashed border-border text-muted-foreground hover:text-primary flex items-center gap-1">
                <Plus className="w-3 h-3" /> عمود جديد
              </button>
            </div>
          </div>

          <button onClick={handleCreate} disabled={!newName.trim() || createTable.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success text-white font-heading font-bold text-sm disabled:opacity-50">
            <Save className="w-4 h-4" /> إنشاء الجدول
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <h3 className="text-xs font-heading text-muted-foreground mb-2">الجداول ({tables?.length || 0})</h3>
          {isLoading && <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />}
          {tables?.map(t => {
            const typeInfo = TABLE_TYPES.find(tt => tt.value === t.table_type);
            return (
              <button key={t.id} onClick={() => setActiveTableId(t.id)}
                className={`w-full text-right p-3 rounded-xl border transition-all group ${activeTableId === t.id ? 'bg-primary/10 border-primary/30' : 'bg-card border-border hover:bg-muted/30'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] ${typeInfo?.color}`}>{typeInfo?.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteTable.mutate(t.id); }}
                    className="opacity-0 group-hover:opacity-100 text-destructive p-0.5"><Trash2 className="w-3 h-3" /></button>
                </div>
                <p className="text-sm font-heading font-bold text-foreground mt-1">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.columns.length} أعمدة</p>
              </button>
            );
          })}
          {tables && tables.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Table2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">لا توجد جداول</p>
              <p className="text-[10px]">اضغط "جدول جديد" للبدء</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {activeTable ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-card rounded-xl border border-border p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-foreground">{activeTable.name}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {TABLE_TYPES.find(t => t.value === activeTable.table_type)?.label} • {activeTable.columns.length} أعمدة
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-2 py-1">
                  <Calculator className="w-3 h-3" /> معادلات مدعومة
                </div>
              </div>
              <TableEditor 
                tableId={activeTable.id} 
                columns={activeTable.columns} 
                onColumnsUpdate={(cols) => handleColumnsUpdate(activeTable.id, cols)}
              />
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-card rounded-xl border border-border">
              <div className="text-center text-muted-foreground">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">اختر جدولاً أو أنشئ جدولاً جديداً</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AskMeDialog pageKey="tables" />
    </Layout>
  );
}
