import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTaskDistributions } from '@/hooks/useTaskDistribution';
import { useProjects } from '@/hooks/useProjects';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Plus, Brain, CheckCircle2, Clock, AlertTriangle, Trash2, Eye, Zap, FolderKanban } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'في الانتظار', color: 'bg-muted text-muted-foreground', icon: Clock },
  analyzing: { label: 'جاري التحليل', color: 'bg-section-ai/20 text-section-ai', icon: Brain },
  reviewed: { label: 'تم التحليل', color: 'bg-section-forecast/20 text-section-forecast', icon: Eye },
  distributed: { label: 'تم التوزيع', color: 'bg-section-revenue/20 text-section-revenue', icon: CheckCircle2 },
  completed: { label: 'مكتمل', color: 'bg-primary/20 text-primary', icon: CheckCircle2 },
};

export default function TaskDistribution() {
  const navigate = useNavigate();
  const { distributions, isLoading, createDistribution, analyzeAndDistribute, deleteDistribution } = useTaskDistributions();
  const { data: projects = [] } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<string>('manual');
  const [projectId, setProjectId] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [manualTasks, setManualTasks] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      const text = await file.text();
      Papa.parse(text, {
        complete: (result) => {
          setFileContent(JSON.stringify(result.data, null, 2));
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const allData: any[] = [];
      wb.SheetNames.forEach(name => {
        const sheet = XLSX.utils.sheet_to_json(wb.Sheets[name]);
        allData.push({ sheet: name, data: sheet });
      });
      setFileContent(JSON.stringify(allData, null, 2));
    } else if (ext === 'txt' || ext === 'md') {
      setFileContent(await file.text());
    } else {
      setFileContent(await file.text());
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const dist = await createDistribution.mutateAsync({
        title,
        description,
        sourceType,
        sourceFileName: fileName || undefined,
        projectId: projectId || undefined,
      });

      // Auto-analyze
      const content = sourceType === 'file' ? fileContent : sourceType === 'manual' ? manualTasks : undefined;
      if (content || manualTasks) {
        await analyzeAndDistribute.mutateAsync({
          distributionId: dist.id,
          content: sourceType === 'file' ? fileContent : undefined,
          tasks: sourceType === 'manual' ? manualTasks.split('\n').filter(Boolean).map(t => ({ title: t.trim() })) : undefined,
        });
      }

      setShowCreate(false);
      setTitle('');
      setDescription('');
      setFileContent('');
      setFileName('');
      setManualTasks('');
      navigate(`/task-distribution/${dist.id}`);
    } catch { /* handled by mutation */ }
    setCreating(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-section-ai/15">
                <Zap className="w-6 h-6 text-section-ai" />
              </div>
              نظام توزيع المهام الذكي
            </h1>
            <p className="text-muted-foreground text-sm mt-1">تحليل ذكي وتوزيع المهام بناءً على أداء الموظفين ومهاراتهم</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> جلسة توزيع جديدة
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الجلسات', value: distributions.length, icon: FolderKanban, color: 'text-section-finance' },
            { label: 'قيد التحليل', value: distributions.filter(d => d.status === 'analyzing').length, icon: Brain, color: 'text-section-ai' },
            { label: 'تم التوزيع', value: distributions.filter(d => d.status === 'distributed').length, icon: CheckCircle2, color: 'text-section-revenue' },
            { label: 'إجمالي المهام', value: distributions.reduce((s, d) => s + d.total_tasks, 0), icon: FileText, color: 'text-section-forecast' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/80 backdrop-blur-sm border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Form */}
        {showCreate && (
          <Card className="bg-card/90 backdrop-blur-sm border-section-ai/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-section-ai" />
                جلسة توزيع جديدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="عنوان الجلسة (مثل: مهام مشروع البادل Q3)" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="وصف إضافي (اختياري)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger><SelectValue placeholder="مصدر المهام" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">📄 رفع ملف</SelectItem>
                    <SelectItem value="manual">✍️ إدخال يدوي</SelectItem>
                    <SelectItem value="project">📁 من مشروع</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue placeholder="ربط بمشروع (اختياري)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مشروع</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {sourceType === 'file' && (
                <div className="border-2 border-dashed border-section-ai/30 rounded-xl p-6 text-center space-y-3">
                  <Upload className="w-10 h-10 mx-auto text-section-ai/50" />
                  <p className="text-sm text-muted-foreground">ارفع ملف Excel, CSV, PDF, أو نص</p>
                  <input type="file" accept=".xlsx,.xls,.csv,.txt,.md,.pdf" onChange={handleFileUpload} className="text-sm" />
                  {fileName && <Badge variant="secondary">{fileName}</Badge>}
                </div>
              )}

              {sourceType === 'manual' && (
                <Textarea
                  placeholder="اكتب كل مهمة في سطر جديد:&#10;مراجعة حسابات الشهر&#10;تحديث الموقع الإلكتروني&#10;إعداد تقرير الربع الثالث"
                  value={manualTasks}
                  onChange={e => setManualTasks(e.target.value)}
                  rows={6}
                />
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
                <Button onClick={handleCreate} disabled={creating || !title.trim()} className="gap-2">
                  {creating ? (
                    <>
                      <Brain className="w-4 h-4 animate-pulse" /> جاري التحليل الذكي...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> تحليل وتوزيع
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distributions List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="bg-card/80"><CardContent className="p-8 text-center text-muted-foreground">جاري التحميل...</CardContent></Card>
          ) : distributions.length === 0 ? (
            <Card className="bg-card/80"><CardContent className="p-8 text-center text-muted-foreground">لا توجد جلسات توزيع بعد. أنشئ جلسة جديدة للبدء!</CardContent></Card>
          ) : (
            distributions.map(dist => {
              const sc = statusConfig[dist.status] || statusConfig.pending;
              const StatusIcon = sc.icon;
              return (
                <Card key={dist.id} className="bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors cursor-pointer border-border" onClick={() => navigate(`/task-distribution/${dist.id}`)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${sc.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-foreground truncate">{dist.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{dist.source_type === 'file' ? '📄 ملف' : dist.source_type === 'manual' ? '✍️ يدوي' : '📁 مشروع'}</span>
                        <span>•</span>
                        <span>{dist.total_tasks} مهمة</span>
                        <span>•</span>
                        <span>{format(new Date(dist.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                      </div>
                    </div>
                    <Badge className={sc.color}>{sc.label}</Badge>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteDistribution.mutate(dist.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
