import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Trash2, Download, Table2, ArrowRight, RefreshCw, Search, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import { useDataImports } from '@/hooks/useDataImports';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  issues: CleaningIssue[];
}

interface CleaningIssue {
  type: 'missing' | 'duplicate' | 'format' | 'outlier';
  column: string;
  row?: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

function detectIssues(headers: string[], rows: Record<string, any>[]): CleaningIssue[] {
  const issues: CleaningIssue[] = [];

  headers.forEach(col => {
    // Missing values
    const missing = rows.filter((r, i) => r[col] === null || r[col] === undefined || r[col] === '').length;
    if (missing > 0) {
      issues.push({ type: 'missing', column: col, message: `${missing} قيمة ناقصة في عمود "${col}"`, severity: missing > rows.length * 0.3 ? 'high' : 'medium' });
    }

    // Duplicates
    const vals = rows.map(r => String(r[col] ?? ''));
    const unique = new Set(vals);
    const dupes = vals.length - unique.size;
    if (dupes > rows.length * 0.5 && unique.size > 1) {
      issues.push({ type: 'duplicate', column: col, message: `${dupes} قيمة مكررة في "${col}"`, severity: 'low' });
    }

    // Number format
    const numVals = vals.filter(v => v && !isNaN(Number(v.replace(/,/g, ''))));
    const nonNumVals = vals.filter(v => v && isNaN(Number(v.replace(/,/g, ''))));
    if (numVals.length > rows.length * 0.5 && nonNumVals.length > 0 && nonNumVals.length < rows.length * 0.3) {
      issues.push({ type: 'format', column: col, message: `${nonNumVals.length} قيمة بتنسيق خاطئ في عمود رقمي "${col}"`, severity: 'medium' });
    }
  });

  return issues;
}

export default function ImportCenter() {
  const { imports, isLoading, createImport, updateImport } = useDataImports();
  const { data: projects } = useProjects();
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('csv');
  const [targetProject, setTargetProject] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || ext === 'txt') {
      setFileType('csv');
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rows = results.data as Record<string, any>[];
          const issues = detectIssues(headers, rows);
          setParsedData({ headers, rows, issues });
          setPreviewOpen(true);
          toast.success(`تم قراءة ${rows.length} صف و ${headers.length} عمود`);
        },
        error: () => toast.error('فشل قراءة ملف CSV'),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      setFileType('excel');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
          const headers = json.length > 0 ? Object.keys(json[0]) : [];
          const issues = detectIssues(headers, json);
          setParsedData({ headers, rows: json, issues });
          setPreviewOpen(true);
          toast.success(`تم قراءة ${json.length} صف و ${headers.length} عمود`);
        } catch {
          toast.error('فشل قراءة ملف Excel');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('صيغة غير مدعومة. استخدم CSV أو Excel');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleImport = async () => {
    if (!parsedData) return;
    await createImport.mutateAsync({
      file_name: fileName,
      file_type: fileType,
      row_count: parsedData.rows.length,
      column_count: parsedData.headers.length,
      status: 'completed',
      project_id: targetProject || null,
      cleaning_report: { issues: parsedData.issues, total_rows: parsedData.rows.length },
      completed_at: new Date().toISOString(),
    });
    toast.success('تم استيراد البيانات بنجاح');
    setParsedData(null);
    setPreviewOpen(false);
  };

  const highIssues = parsedData?.issues.filter(i => i.severity === 'high').length || 0;
  const medIssues = parsedData?.issues.filter(i => i.severity === 'medium').length || 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-black text-foreground">📥 مركز استيراد البيانات</h1>
          <p className="text-sm text-muted-foreground">رفع وتحليل وتنظيف ملفات Excel و CSV وربطها بالنظام</p>
        </div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
            dragOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          }`}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={(e) => { if (e.target.files?.[0]) parseFile(e.target.files[0]); }} />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-lg font-heading font-bold text-foreground mb-2">اسحب الملف هنا أو انقر للرفع</p>
          <p className="text-sm text-muted-foreground">يدعم: CSV, Excel (.xlsx, .xls)</p>
          <div className="flex justify-center gap-3 mt-4">
            <Badge variant="secondary" className="gap-1"><FileSpreadsheet className="w-3 h-3" /> Excel</Badge>
            <Badge variant="secondary" className="gap-1"><Table2 className="w-3 h-3" /> CSV</Badge>
          </div>
        </motion.div>

        {/* Import History */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h2 className="text-sm font-heading font-bold text-foreground mb-4">📋 سجل الاستيراد</h2>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : imports.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">لم يتم استيراد أي ملفات بعد</p>
          ) : (
            <div className="space-y-3">
              {imports.map(imp => (
                <div key={imp.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all">
                  <FileSpreadsheet className="w-8 h-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{imp.file_name}</p>
                    <p className="text-xs text-muted-foreground">{imp.row_count} صف • {imp.column_count} عمود • {new Date(imp.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <Badge variant={imp.status === 'completed' ? 'default' : 'secondary'} className={imp.status === 'completed' ? 'bg-success/15 text-success' : ''}>
                    {imp.status === 'completed' ? 'مكتمل' : imp.status === 'pending' ? 'قيد المعالجة' : 'فشل'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                معاينة: {fileName}
              </DialogTitle>
            </DialogHeader>

            {parsedData && (
              <div className="flex-1 overflow-auto space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-center">
                    <p className="text-xl font-heading font-black text-primary">{parsedData.rows.length}</p>
                    <p className="text-[10px] text-muted-foreground">صف</p>
                  </div>
                  <div className="rounded-xl bg-success/10 p-3 text-center">
                    <p className="text-xl font-heading font-black text-success">{parsedData.headers.length}</p>
                    <p className="text-[10px] text-muted-foreground">عمود</p>
                  </div>
                  <div className="rounded-xl bg-warning/10 p-3 text-center">
                    <p className="text-xl font-heading font-black text-warning">{medIssues}</p>
                    <p className="text-[10px] text-muted-foreground">تحذيرات</p>
                  </div>
                  <div className="rounded-xl bg-destructive/10 p-3 text-center">
                    <p className="text-xl font-heading font-black text-destructive">{highIssues}</p>
                    <p className="text-[10px] text-muted-foreground">أخطاء</p>
                  </div>
                </div>

                {/* Issues */}
                {parsedData.issues.length > 0 && (
                  <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                    <h3 className="text-xs font-heading font-bold text-warning mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> تقرير تنظيف البيانات
                    </h3>
                    <div className="space-y-1.5">
                      {parsedData.issues.map((issue, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Badge variant="secondary" className={issue.severity === 'high' ? 'bg-destructive/15 text-destructive' : issue.severity === 'medium' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'}>
                            {issue.severity === 'high' ? 'خطير' : issue.severity === 'medium' ? 'تحذير' : 'ملاحظة'}
                          </Badge>
                          <span className="text-muted-foreground">{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project selector */}
                <Select value={targetProject} onValueChange={setTargetProject}>
                  <SelectTrigger><SelectValue placeholder="ربط بمشروع (اختياري)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون ربط</SelectItem>
                    {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Data Table Preview */}
                <div className="rounded-xl border border-border overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-12">#</TableHead>
                        {parsedData.headers.map(h => <TableHead key={h} className="text-xs whitespace-nowrap">{h}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.rows.slice(0, 50).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                          {parsedData.headers.map(h => (
                            <TableCell key={h} className="text-xs whitespace-nowrap max-w-[200px] truncate">
                              {row[h] !== null && row[h] !== undefined ? String(row[h]) : <span className="text-destructive/50">—</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedData.rows.length > 50 && (
                    <p className="text-center text-xs text-muted-foreground py-2">عرض أول 50 صف من {parsedData.rows.length}</p>
                  )}
                </div>

                <Button onClick={handleImport} className="w-full gap-2" disabled={createImport.isPending}>
                  <CheckCircle2 className="w-4 h-4" />
                  {createImport.isPending ? 'جاري الاستيراد...' : 'استيراد البيانات'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
