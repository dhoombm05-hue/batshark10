import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Table2, Save, X, Edit3, FileSpreadsheet } from 'lucide-react';
import Layout from '@/components/Layout';
import AskMeDialog from '@/components/AskMeDialog';
import {
  useCustomTables, useCustomTableRows, useCreateCustomTable,
  useDeleteCustomTable, useAddCustomTableRow, useUpdateCustomTableRow,
  useDeleteCustomTableRow, type CustomTableColumn, type CustomTableRow,
} from '@/hooks/useCustomTables';
import { useProjects } from '@/hooks/useProjects';
import { usePageViewTracker } from '@/hooks/useAutoTracker';

const TABLE_TYPES = [
  { value: 'financial', label: '💰 مالي', color: 'text-success' },
  { value: 'operational', label: '⚙️ تشغيلي', color: 'text-primary' },
  { value: 'employees', label: '👥 موظفين', color: 'text-orange' },
  { value: 'contracts', label: '📄 عقود', color: 'text-purple' },
  { value: 'general', label: '📋 عام', color: 'text-muted-foreground' },
];

const COL_TYPES = [
  { value: 'text', label: 'نص' },
  { value: 'number', label: 'رقم' },
  { value: 'date', label: 'تاريخ' },
];

function TableEditor({ tableId, columns }: { tableId: string; columns: CustomTableColumn[] }) {
  const { data: rows } = useCustomTableRows(tableId);
  const addRow = useAddCustomTableRow();
  const updateRow = useUpdateCustomTableRow();
  const deleteRow = useDeleteCustomTableRow();
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [cellValue, setCellValue] = useState('');

  const handleCellClick = (rowId: string, colId: string, currentValue: any) => {
    setEditingCell({ rowId, colId });
    setCellValue(String(currentValue ?? ''));
  };

  const handleCellSave = (row: CustomTableRow) => {
    if (!editingCell) return;
    const col = columns.find(c => c.id === editingCell.colId);
    const newVal = col?.type === 'number' ? Number(cellValue) || 0 : cellValue;
    const newData = { ...row.data, [editingCell.colId]: newVal };
    updateRow.mutate({ id: row.id, table_id: tableId, data: newData });
    setEditingCell(null);
  };

  const handleAddRow = () => {
    const emptyData: Record<string, any> = {};
    columns.forEach(c => { emptyData[c.id] = c.type === 'number' ? 0 : ''; });
    addRow.mutate({ table_id: tableId, data: emptyData });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30">
              <th className="p-2.5 text-center text-muted-foreground text-[10px] w-10">#</th>
              {columns.map(col => (
                <th key={col.id} className="p-2.5 text-right text-muted-foreground text-[10px] font-heading" style={{ minWidth: col.width || 120 }}>
                  {col.label}
                  <span className="text-[8px] mr-1 opacity-50">({COL_TYPES.find(t => t.value === col.type)?.label})</span>
                </th>
              ))}
              <th className="p-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows?.map((row, ri) => (
              <tr key={row.id} className="border-t border-border hover:bg-primary/5 transition-colors">
                <td className="p-2.5 text-center text-[10px] text-muted-foreground">{ri + 1}</td>
                {columns.map(col => {
                  const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                  const val = row.data[col.id];
                  return (
                    <td key={col.id} onClick={() => handleCellClick(row.id, col.id, val)}
                      className={`p-2.5 cursor-pointer transition-all ${isEditing ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}>
                      {isEditing ? (
                        <input
                          autoFocus
                          type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                          value={cellValue}
                          onChange={e => setCellValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleCellSave(row); if (e.key === 'Escape') setEditingCell(null); }}
                          onBlur={() => handleCellSave(row)}
                          className="w-full bg-transparent outline-none text-sm text-foreground"
                        />
                      ) : (
                        <span className="text-xs text-foreground">
                          {col.type === 'number' && typeof val === 'number' ? val.toLocaleString('ar-SA') : String(val ?? '')}
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
        </table>
      </div>

      <button onClick={handleAddRow} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1">
        <Plus className="w-3 h-3" /> صف جديد
      </button>
    </div>
  );
}

export default function CustomTablesPage() {
  usePageViewTracker('الجداول المخصصة');

  const { data: tables, isLoading } = useCustomTables();
  const { data: projects } = useProjects();
  const createTable = useCreateCustomTable();
  const deleteTable = useDeleteCustomTable();

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

  // Auto-select first table
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
    setNewColumns(prev => [...prev, { id: `col_${Date.now()}`, label: `عمود ${prev.length + 1}`, type: 'text' }]);
  };

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
              <p className="text-sm text-muted-foreground">إنشاء وإدارة جداول بيانات مخصصة محفوظة في قاعدة البيانات</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-heading font-bold text-sm">
            <Plus className="w-4 h-4" /> جدول جديد
          </button>
        </div>
      </div>

      {/* Create Table Dialog */}
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

      {/* Table List + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="space-y-2">
          <h3 className="text-xs font-heading text-muted-foreground mb-2">الجداول ({tables?.length || 0})</h3>
          {isLoading && <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />}
          {tables?.map(t => {
            const typeInfo = TABLE_TYPES.find(tt => tt.value === t.table_type);
            return (
              <button key={t.id} onClick={() => setActiveTableId(t.id)}
                className={`w-full text-right p-3 rounded-xl border transition-all ${activeTableId === t.id ? 'bg-primary/10 border-primary/30' : 'bg-card border-border hover:bg-muted/30'}`}>
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

        {/* Editor */}
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
              </div>
              <TableEditor tableId={activeTable.id} columns={activeTable.columns} />
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
