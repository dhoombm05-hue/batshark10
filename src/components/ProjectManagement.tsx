import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Trash2, AlertTriangle, HandCoins, Shield, Loader2,
  CheckCircle2, XCircle, DollarSign, PieChart, History,
  Building2, Percent, FileText, ArrowRight
} from 'lucide-react';

interface ProjectManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    slug: string;
    ownership_percentage?: number;
    total_revenue?: number;
    net_profit?: number;
  };
}

interface OwnershipRecord {
  id: string;
  action_type: string;
  percentage_sold: number;
  remaining_ownership: number;
  buyer_name: string | null;
  sale_amount: number;
  notes: string | null;
  executed_by: string;
  created_at: string;
}

export default function ProjectManagement({ open, onOpenChange, project }: ProjectManagementProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('sell');
  const [deleting, setDeleting] = useState(false);
  const [selling, setSelling] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [sellPercentage, setSellPercentage] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [history, setHistory] = useState<OwnershipRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const ownership = project.ownership_percentage ?? 100;

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('project_ownership' as any)
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });
    setHistory((data || []) as unknown as OwnershipRecord[]);
    setLoadingHistory(false);
  };

  const handleSellShare = async () => {
    const pct = Number(sellPercentage);
    if (!pct || pct <= 0 || pct > ownership) {
      toast.error(`النسبة يجب أن تكون بين 1 و ${ownership}%`);
      return;
    }
    if (!buyerName.trim()) { toast.error('أدخل اسم المشتري'); return; }

    setSelling(true);
    try {
      const newOwnership = ownership - pct;

      // Record the sale
      await supabase.from('project_ownership' as any).insert({
        project_id: project.id,
        action_type: 'sale',
        percentage_sold: pct,
        remaining_ownership: newOwnership,
        buyer_name: buyerName.trim(),
        sale_amount: Number(saleAmount) || 0,
        notes: saleNotes.trim() || null,
        executed_by: 'CEO',
      } as any);

      // Update project ownership
      await supabase.from('projects' as any).update({
        ownership_percentage: newOwnership,
        updated_at: new Date().toISOString(),
      } as any).eq('id', project.id);

      // Log audit
      await supabase.from('audit_logs' as any).insert({
        table_name: 'projects',
        record_id: project.id,
        field_name: 'ownership_percentage',
        old_value: String(ownership),
        new_value: String(newOwnership),
        change_reason: `بيع ${pct}% لـ ${buyerName} بمبلغ ${Number(saleAmount).toLocaleString()} ريال`,
        changed_by: 'CEO',
      } as any);

      queryClient.invalidateQueries();
      toast.success(`تم بيع ${pct}% من ${project.name} لـ ${buyerName} بنجاح ✅`);
      setSellPercentage('');
      setBuyerName('');
      setSaleAmount('');
      setSaleNotes('');
      loadHistory();
    } catch (e: any) {
      toast.error('فشل تسجيل البيع: ' + e.message);
    }
    setSelling(false);
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmText !== project.name) {
      toast.error('اكتب اسم المشروع بالضبط للتأكيد');
      return;
    }

    setDeleting(true);
    try {
      // Step 1: Delete all related data in order
      setDeleteStep(1);
      // Delete chat messages in project rooms
      const { data: rooms } = await supabase.from('chat_rooms' as any).select('id').eq('project_id', project.id);
      if (rooms?.length) {
        const roomIds = rooms.map((r: any) => r.id);
        await supabase.from('chat_messages' as any).delete().in('room_id', roomIds);
        await supabase.from('chat_room_members' as any).delete().in('room_id', roomIds);
        await supabase.from('chat_room_settings' as any).delete().in('room_id', roomIds);
        await supabase.from('chat_rooms' as any).delete().eq('project_id', project.id);
      }

      setDeleteStep(2);
      // Delete journal lines then entries
      const { data: entries } = await supabase.from('journal_entries' as any).select('id').eq('project_id', project.id);
      if (entries?.length) {
        const entryIds = entries.map((e: any) => e.id);
        await supabase.from('journal_lines' as any).delete().in('journal_entry_id', entryIds);
        await supabase.from('journal_entries' as any).delete().eq('project_id', project.id);
      }

      setDeleteStep(3);
      // Delete custom tables
      const { data: tables } = await supabase.from('custom_tables' as any).select('id').eq('project_id', project.id);
      if (tables?.length) {
        const tableIds = tables.map((t: any) => t.id);
        await supabase.from('custom_table_cells' as any).delete().in('table_id', tableIds);
        await supabase.from('custom_table_rows' as any).delete().in('table_id', tableIds);
        await supabase.from('custom_table_columns' as any).delete().in('table_id', tableIds);
        await supabase.from('custom_table_versions' as any).delete().in('table_id', tableIds);
        await supabase.from('custom_tables' as any).delete().eq('project_id', project.id);
      }

      setDeleteStep(4);
      // Delete financial data
      await supabase.from('project_expenses' as any).delete().eq('project_id', project.id);
      await supabase.from('project_revenues' as any).delete().eq('project_id', project.id);
      await supabase.from('project_monthly_data' as any).delete().eq('project_id', project.id);
      await supabase.from('project_analysis' as any).delete().eq('project_id', project.id);

      setDeleteStep(5);
      // Delete news, documents, tasks
      await supabase.from('news' as any).delete().eq('project_id', project.id);
      await supabase.from('documents' as any).delete().eq('business_name', project.name);
      await supabase.from('tasks' as any).delete().eq('project_id', project.id);
      await supabase.from('data_imports' as any).delete().eq('project_id', project.id);

      setDeleteStep(6);
      // Delete task distributions
      const { data: dists } = await supabase.from('task_distributions' as any).select('id').eq('project_id', project.id);
      if (dists?.length) {
        const distIds = dists.map((d: any) => d.id);
        await supabase.from('task_distribution_items' as any).delete().in('distribution_id', distIds);
        await supabase.from('task_distributions' as any).delete().eq('project_id', project.id);
      }

      // Delete business proposals
      await supabase.from('business_proposals' as any).delete().eq('project_id', project.id);

      // Delete ownership records
      await supabase.from('project_ownership' as any).delete().eq('project_id', project.id);

      setDeleteStep(7);
      // Finally delete the project itself
      await supabase.from('projects' as any).delete().eq('id', project.id);

      queryClient.invalidateQueries();
      toast.success(`تم حذف "${project.name}" وجميع بياناته نهائياً 🗑️`);
      onOpenChange(false);
      navigate('/projects');
    } catch (e: any) {
      toast.error('فشل الحذف: ' + e.message);
    }
    setDeleting(false);
    setDeleteStep(0);
  };

  const deleteSteps = [
    'تجهيز الحذف...',
    'حذف غرف الدردشة والرسائل...',
    'حذف القيود المحاسبية...',
    'حذف الجداول المخصصة...',
    'حذف البيانات المالية...',
    'حذف الأخبار والملفات والمهام...',
    'حذف توزيعات المهام والمقترحات...',
    'حذف المشروع نهائياً...',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="w-5 h-5 text-primary" />
            إدارة البزنس — {project.name}
          </DialogTitle>
          <DialogDescription>بيع حصص أو حذف البزنس نهائياً</DialogDescription>
        </DialogHeader>

        {/* Current Ownership Display */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" /> نسبة الملكية الحالية
            </span>
            <span className="text-2xl font-bold text-primary">{ownership}%</span>
          </div>
          <Progress value={ownership} className="h-3" />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0%</span>
            <span>{ownership < 100 ? `${100 - ownership}% مباع` : 'ملكية كاملة'}</span>
            <span>100%</span>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v === 'history') loadHistory(); }}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="sell" className="gap-1"><HandCoins className="w-3.5 h-3.5" /> بيع حصة</TabsTrigger>
            <TabsTrigger value="delete" className="gap-1"><Trash2 className="w-3.5 h-3.5" /> حذف البزنس</TabsTrigger>
            <TabsTrigger value="history" className="gap-1"><History className="w-3.5 h-3.5" /> سجل العمليات</TabsTrigger>
          </TabsList>

          {/* SELL TAB */}
          <TabsContent value="sell" className="space-y-4 mt-4">
            <Card className="bg-card/80">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">نسبة البيع (%)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={sellPercentage}
                        onChange={(e) => setSellPercentage(e.target.value)}
                        placeholder={`الحد الأقصى ${ownership}%`}
                        min={1}
                        max={ownership}
                        className="pr-8"
                      />
                      <Percent className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">مبلغ البيع (ريال)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={saleAmount}
                        onChange={(e) => setSaleAmount(e.target.value)}
                        placeholder="0"
                        className="pr-8"
                      />
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">اسم المشتري</label>
                  <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="اسم الشخص أو الجهة" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">ملاحظات (اختياري)</label>
                  <Textarea value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} placeholder="تفاصيل إضافية عن الصفقة..." rows={2} />
                </div>

                {sellPercentage && Number(sellPercentage) > 0 && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/30 rounded-lg p-3 border border-border space-y-1">
                    <p className="text-sm text-foreground font-medium">معاينة الصفقة:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>الملكية قبل البيع:</span><span className="font-medium text-foreground">{ownership}%</span>
                      <span>النسبة المباعة:</span><span className="font-medium text-warning">{sellPercentage}%</span>
                      <span>الملكية بعد البيع:</span><span className="font-medium text-primary">{Math.max(0, ownership - Number(sellPercentage))}%</span>
                      {saleAmount && <><span>مبلغ البيع:</span><span className="font-medium text-success">{Number(saleAmount).toLocaleString()} ريال</span></>}
                    </div>
                  </motion.div>
                )}

                <Button onClick={handleSellShare} disabled={selling} className="w-full gap-2">
                  {selling ? <Loader2 className="w-4 h-4 animate-spin" /> : <HandCoins className="w-4 h-4" />}
                  تأكيد بيع الحصة
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DELETE TAB */}
          <TabsContent value="delete" className="space-y-4 mt-4">
            <Card className="bg-destructive/5 border-destructive/30">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-destructive">تحذير: عملية لا يمكن التراجع عنها!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      سيتم حذف المشروع "{project.name}" وجميع بياناته بشكل نهائي:
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-0.5 list-disc list-inside">
                      <li>جميع القيود المحاسبية والبيانات المالية</li>
                      <li>غرف الدردشة والرسائل المرتبطة</li>
                      <li>الجداول المخصصة وبياناتها</li>
                      <li>الأخبار والملفات والمهام</li>
                      <li>المقترحات وتوزيعات المهام</li>
                      <li>سجلات الملكية والبيع</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-destructive mb-1 block font-medium">
                    اكتب اسم المشروع "<span className="font-bold">{project.name}</span>" للتأكيد:
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={project.name}
                    className="border-destructive/30 focus:border-destructive"
                  />
                </div>

                {deleting && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    <Progress value={(deleteStep / 7) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground animate-pulse">{deleteSteps[deleteStep] || 'جاري الحذف...'}</p>
                  </motion.div>
                )}

                <Button
                  variant="destructive"
                  onClick={handleDeleteProject}
                  disabled={deleting || deleteConfirmText !== project.name}
                  className="w-full gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'جاري الحذف...' : 'حذف البزنس نهائياً'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-3 mt-4">
            {loadingHistory ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : history.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد عمليات بيع أو حذف سابقة</p>
              </div>
            ) : (
              history.map((h) => (
                <Card key={h.id} className="bg-card/80">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={h.action_type === 'sale' ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}>
                        {h.action_type === 'sale' ? '💰 بيع حصة' : '🗑️ حذف'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {h.buyer_name && <><span className="text-muted-foreground">المشتري:</span><span className="text-foreground">{h.buyer_name}</span></>}
                      <span className="text-muted-foreground">النسبة المباعة:</span><span className="text-warning font-medium">{h.percentage_sold}%</span>
                      <span className="text-muted-foreground">الملكية المتبقية:</span><span className="text-primary font-medium">{h.remaining_ownership}%</span>
                      {h.sale_amount > 0 && <><span className="text-muted-foreground">المبلغ:</span><span className="text-success">{h.sale_amount.toLocaleString()} ريال</span></>}
                    </div>
                    {h.notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{h.notes}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
