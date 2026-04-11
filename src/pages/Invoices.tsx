import { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Printer, Download, Trash2, Eye, Edit,
  Package, CreditCard, Building2, Hash, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import logo from '@/assets/batshark-logo-main.png';

/* ═══════ Types ═══════ */
interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: number;
  invoice_type: string;
  project_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  invoice_date: string;
  notes: string | null;
  status: string;
  payment_method: string | null;
  total_amount: number;
  items: InvoiceItem[];
  created_by: string;
  created_at: string;
}

/* ═══════ Constants ═══════ */
const PADEL_INTERNAL_ITEMS = [
  'أرضية الملعب (العشب الصناعي)', 'الإنارة (LED)', 'الزجاج المقاوم',
  'هيكل الملعب المعدني', 'الشبكة', 'الجمارك والرسوم',
  'التوصيل والشحن', 'التركيب والتشغيل', 'الضمان والصيانة',
];
const PADEL_CUSTOMER_ITEMS = ['ملعب بادل كامل', 'رسوم الشحن والتوصيل', 'رسوم التركيب', 'ضمان سنة'];
const UMBREX_INTERNAL_ITEMS = ['سعر المنتج (المصنع)', 'الجمارك والرسوم', 'التوصيل والشحن', 'التغليف'];
const UMBREX_CUSTOMER_ITEMS = ['المنتج', 'رسوم التوصيل'];
const PAYMENT_METHODS = ['تحويل بنكي', 'نقداً', 'شيك', 'بطاقة ائتمان', 'تقسيط', 'دفعة مقدمة + أقساط'];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'bg-muted text-muted-foreground' },
  sent: { label: 'مرسلة', color: 'bg-section-forecast/20 text-section-forecast' },
  paid: { label: 'مدفوعة', color: 'bg-success/20 text-success' },
  cancelled: { label: 'ملغاة', color: 'bg-destructive/20 text-destructive' },
};

const TYPE_LABELS: Record<string, string> = {
  internal: '🏗️ بادل - داخلية',
  customer: '👤 بادل - زبون',
  umbrex_internal: '📦 أومبركس - داخلية',
  umbrex_customer: '👤 أومبركس - زبون',
};

/* ═══════ Hook ═══════ */
function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]).map(d => ({ ...d, items: d.items || [] })) as Invoice[];
    },
  });
}

/* ═══════ Auto-link: Journal + News + Performance on finalize ═══════ */
async function finalizeInvoice(invoice: Invoice, projectName: string | null, userName: string) {
  const isCustomer = invoice.invoice_type === 'customer' || invoice.invoice_type === 'umbrex_customer';
  const isInternal = invoice.invoice_type === 'internal' || invoice.invoice_type === 'umbrex_internal';

  // 1. Create journal entry
  const description = isCustomer
    ? `فاتورة بيع #${invoice.invoice_number} — ${invoice.customer_name || 'عميل'}`
    : `فاتورة شراء #${invoice.invoice_number} — ${invoice.customer_name || 'مورد'}`;

  const { data: entry, error: entryErr } = await supabase
    .from('journal_entries' as any)
    .insert({
      description,
      project_id: invoice.project_id,
      entry_date: invoice.invoice_date,
      created_by: userName,
      is_balanced: true,
      notes: `تم الإنشاء تلقائياً من الفاتورة #${invoice.invoice_number}`,
    } as any)
    .select('id')
    .single();
  if (entryErr) throw entryErr;
  const entryId = (entry as any).id;

  // 2. Create journal lines
  const lines: any[] = [];
  if (isCustomer) {
    // Revenue: credit revenue, debit cash
    lines.push({
      journal_entry_id: entryId,
      account_name: 'النقدية / البنك',
      account_type: 'asset',
      debit: invoice.total_amount,
      credit: 0,
    });
    lines.push({
      journal_entry_id: entryId,
      account_name: `إيراد مبيعات — فاتورة #${invoice.invoice_number}`,
      account_type: 'revenue',
      debit: 0,
      credit: invoice.total_amount,
    });
  } else if (isInternal) {
    // Expense: debit expense, credit cash
    for (const item of invoice.items) {
      if (item.total > 0) {
        lines.push({
          journal_entry_id: entryId,
          account_name: item.name,
          account_type: 'expense',
          debit: item.total,
          credit: 0,
        });
      }
    }
    lines.push({
      journal_entry_id: entryId,
      account_name: 'النقدية / البنك',
      account_type: 'asset',
      debit: 0,
      credit: invoice.total_amount,
    });
  }

  if (lines.length > 0) {
    const { error: linesErr } = await supabase
      .from('journal_lines' as any)
      .insert(lines as any);
    if (linesErr) throw linesErr;
  }

  // 3. Post news
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const newsTitle = isCustomer
      ? `💰 تم إتمام بيع — فاتورة #${invoice.invoice_number}`
      : `📦 تم تسجيل مشتريات — فاتورة #${invoice.invoice_number}`;
    const newsContent = isCustomer
      ? `تم إتمام عملية بيع بقيمة **${invoice.total_amount.toLocaleString()} ر.س** للعميل **${invoice.customer_name || 'غير محدد'}**${projectName ? ` في مشروع **${projectName}**` : ''}. تم تسجيل القيد المحاسبي تلقائياً.`
      : `تم تسجيل فاتورة شراء بقيمة **${invoice.total_amount.toLocaleString()} ر.س** من **${invoice.customer_name || 'مورد'}**${projectName ? ` لمشروع **${projectName}**` : ''}. تم تسجيل المصروفات تلقائياً.`;

    await supabase.from('news' as any).insert({
      title: newsTitle,
      content: newsContent,
      author_id: session.user.id,
      author_name: userName,
      content_type: 'text',
      project_id: invoice.project_id,
    } as any);
  }

  // 4. Log activity for performance tracking
  if (session) {
    await supabase.from('user_activity' as any).insert({
      user_id: session.user.id,
      action_type: 'invoice_finalized',
      entity_type: 'invoice',
      entity_id: invoice.id,
      details: {
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        invoice_type: invoice.invoice_type,
        customer_name: invoice.customer_name,
      },
    } as any).then(() => {}).catch(() => {});
  }
}

/* ═══════ Invoice Form (Create & Edit) ═══════ */
function InvoiceFormDialog({ 
  editInvoice, 
  onSaved 
}: { 
  editInvoice?: Invoice | null; 
  onSaved: () => void;
}) {
  const { profile } = useAuthContext();
  const { data: projects = [] } = useProjects();
  const [open, setOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState(editInvoice?.invoice_type || 'internal');
  const [customerName, setCustomerName] = useState(editInvoice?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(editInvoice?.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState(editInvoice?.customer_email || '');
  const [projectId, setProjectId] = useState(editInvoice?.project_id || '');
  const [paymentMethod, setPaymentMethod] = useState(editInvoice?.payment_method || '');
  const [notes, setNotes] = useState(editInvoice?.notes || '');
  const [items, setItems] = useState<InvoiceItem[]>(editInvoice?.items || []);
  const [saving, setSaving] = useState(false);

  const isEdit = !!editInvoice;

  const getDefaultItems = (type: string): InvoiceItem[] => {
    const list = type === 'internal' ? PADEL_INTERNAL_ITEMS
      : type === 'customer' ? PADEL_CUSTOMER_ITEMS
      : type === 'umbrex_internal' ? UMBREX_INTERNAL_ITEMS
      : UMBREX_CUSTOMER_ITEMS;
    return list.map(name => ({ name, quantity: 1, unitPrice: 0, total: 0 }));
  };

  const handleTypeChange = (type: string) => {
    setInvoiceType(type);
    if (!isEdit) setItems(getDefaultItems(type));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      updated.total = updated.quantity * updated.unitPrice;
      return updated;
    }));
  };

  const addItem = () => setItems(prev => [...prev, { name: '', quantity: 1, unitPrice: 0, total: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const totalAmount = items.reduce((s, i) => s + i.total, 0);

  const handleOpen = () => {
    if (editInvoice) {
      setInvoiceType(editInvoice.invoice_type);
      setCustomerName(editInvoice.customer_name || '');
      setCustomerPhone(editInvoice.customer_phone || '');
      setCustomerEmail(editInvoice.customer_email || '');
      setProjectId(editInvoice.project_id || '');
      setPaymentMethod(editInvoice.payment_method || '');
      setNotes(editInvoice.notes || '');
      setItems(editInvoice.items || []);
    } else {
      setItems(getDefaultItems('internal'));
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const payload: any = {
        invoice_type: invoiceType,
        project_id: projectId || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        payment_method: paymentMethod || null,
        notes: notes || null,
        total_amount: totalAmount,
        items: items as any,
      };

      if (isEdit) {
        const { error } = await supabase.from('invoices' as any).update(payload).eq('id', editInvoice.id);
        if (error) throw error;
        toast.success('تم تحديث الفاتورة بنجاح');
      } else {
        payload.created_by = session.user.id;
        const { error } = await supabase.from('invoices' as any).insert(payload);
        if (error) throw error;
        toast.success('تم إنشاء الفاتورة بنجاح');
      }

      setOpen(false);
      onSaved();
    } catch (err: any) {
      toast.error('فشل في حفظ الفاتورة: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {isEdit ? (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpen}>
          <Edit className="w-3.5 h-3.5" />
        </Button>
      ) : (
        <Button className="gap-2" onClick={handleOpen}>
          <Plus className="w-4 h-4" /> فاتورة جديدة
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              {isEdit ? `تعديل فاتورة #${editInvoice.invoice_number}` : 'إنشاء فاتورة جديدة'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Type Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleTypeChange(key)}
                  className={`p-3 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                    invoiceType === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>اسم العميل / المورد</Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="الاسم" />
              </div>
              <div>
                <Label>الهاتف</Label>
                <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="05xxxxxxxx" />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="email@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>المشروع المرتبط</Label>
                <Select value={projectId || 'none'} onValueChange={v => setProjectId(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="اختر مشروع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مشروع</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>طريقة الدفع</Label>
                <Select value={paymentMethod || 'none'} onValueChange={v => setPaymentMethod(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="اختر طريقة الدفع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">غير محدد</SelectItem>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-bold">بنود الفاتورة</Label>
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
                  <Plus className="w-3 h-3" /> إضافة بند
                </Button>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right w-[40%]">البند</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">سعر الوحدة</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} className="h-8 text-xs" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="h-8 text-xs w-20" min={1} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} className="h-8 text-xs w-28" min={0} />
                        </TableCell>
                        <TableCell className="font-bold text-xs">{item.total.toLocaleString()} ر.س</TableCell>
                        <TableCell>
                          <button onClick={() => removeItem(i)} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end mt-3 px-4">
                <div className="text-lg font-black text-primary">
                  المجموع: {totalAmount.toLocaleString()} ر.س
                </div>
              </div>
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." rows={2} />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving || items.length === 0}>
              {saving ? 'جاري الحفظ...' : isEdit ? 'تحديث الفاتورة' : 'حفظ الفاتورة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ═══════ Invoice Preview ═══════ */
function InvoicePreview({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: projects = [] } = useProjects();
  const project = projects.find(p => p.id === invoice.project_id);
  const isInternal = invoice.invoice_type === 'internal' || invoice.invoice_type === 'umbrex_internal';

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>فاتورة #${invoice.invoice_number}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; direction: rtl; color: #1a1a1a; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0891b2; padding-bottom: 20px; margin-bottom: 25px; }
              .logo { width: 80px; height: 80px; object-fit: contain; }
              .company-info { text-align: left; font-size: 11px; color: #666; }
              .company-info h2 { color: #0891b2; font-size: 18px; margin-bottom: 4px; }
              .invoice-title { text-align: center; font-size: 22px; font-weight: bold; color: #0891b2; margin: 15px 0; }
              .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 13px; }
              .meta-box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .meta-box strong { display: block; margin-bottom: 4px; color: #0891b2; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #0891b2; color: white; padding: 10px 12px; text-align: right; font-size: 13px; }
              td { border: 1px solid #e2e8f0; padding: 10px 12px; font-size: 13px; }
              tr:nth-child(even) { background: #f8fafc; }
              .total-row { background: #0891b2 !important; color: white; font-weight: bold; font-size: 15px; }
              .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; font-size: 11px; color: #999; text-align: center; }
              @media print { body { padding: 15px; } }
            </style>
          </head>
          <body>${printRef.current.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportExcel = () => {
    const rows = invoice.items.map((item: InvoiceItem) => ({
      'البند': item.name, 'الكمية': item.quantity, 'سعر الوحدة': item.unitPrice, 'الإجمالي': item.total,
    }));
    rows.push({ 'البند': 'المجموع الكلي', 'الكمية': '' as any, 'سعر الوحدة': '' as any, 'الإجمالي': invoice.total_amount });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'فاتورة');
    XLSX.writeFile(wb, `فاتورة_${invoice.invoice_number}.xlsx`);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              فاتورة #{invoice.invoice_number}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                <Printer className="w-4 h-4" /> طباعة
              </Button>
              <Button variant="outline" size="sm" onClick={exportExcel} className="gap-1">
                <Download className="w-4 h-4" /> Excel
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="mt-4 p-6 bg-white rounded-xl border">
          <div className="flex items-center justify-between border-b-[3px] border-primary pb-5 mb-5">
            <div className="flex items-center gap-3">
              <img src={logo} alt="BatShark" className="w-16 h-16 object-contain" />
              <div>
                <h2 className="text-xl font-black text-primary">BATSHARK</h2>
                <p className="text-[11px] text-muted-foreground">Economy Intelligence Platform</p>
              </div>
            </div>
            <div className="text-left text-xs text-muted-foreground space-y-0.5">
              <p className="font-bold text-sm text-foreground">فاتورة {isInternal ? 'داخلية' : 'عميل'}</p>
              <p>رقم: #{invoice.invoice_number}</p>
              <p>التاريخ: {format(new Date(invoice.invoice_date), 'd MMMM yyyy', { locale: ar })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
            {invoice.customer_name && (
              <div className="bg-muted/30 p-3 rounded-lg border">
                <strong className="text-primary text-xs block mb-1">{isInternal ? 'المورد' : 'العميل'}</strong>
                <p className="font-bold">{invoice.customer_name}</p>
                {invoice.customer_phone && <p className="text-muted-foreground text-xs">{invoice.customer_phone}</p>}
                {invoice.customer_email && <p className="text-muted-foreground text-xs">{invoice.customer_email}</p>}
              </div>
            )}
            <div className="bg-muted/30 p-3 rounded-lg border">
              <strong className="text-primary text-xs block mb-1">تفاصيل</strong>
              {project && <p className="text-xs">المشروع: {project.name}</p>}
              {invoice.payment_method && <p className="text-xs">الدفع: {invoice.payment_method}</p>}
              <p className="text-xs">الحالة: {STATUS_MAP[invoice.status]?.label}</p>
            </div>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="p-2.5 text-right rounded-tr-lg">#</th>
                <th className="p-2.5 text-right">البند</th>
                <th className="p-2.5 text-right">الكمية</th>
                <th className="p-2.5 text-right">سعر الوحدة</th>
                <th className="p-2.5 text-right rounded-tl-lg">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: InvoiceItem, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-muted/20' : ''}>
                  <td className="p-2.5 border-b border-border/50">{i + 1}</td>
                  <td className="p-2.5 border-b border-border/50 font-medium">{item.name}</td>
                  <td className="p-2.5 border-b border-border/50">{item.quantity}</td>
                  <td className="p-2.5 border-b border-border/50">{item.unitPrice.toLocaleString()} ر.س</td>
                  <td className="p-2.5 border-b border-border/50 font-bold">{item.total.toLocaleString()} ر.س</td>
                </tr>
              ))}
              <tr className="bg-primary text-primary-foreground font-bold text-base">
                <td colSpan={4} className="p-3 text-right rounded-br-lg">المجموع الكلي</td>
                <td className="p-3 rounded-bl-lg">{invoice.total_amount.toLocaleString()} ر.س</td>
              </tr>
            </tbody>
          </table>

          {invoice.notes && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs">
              <strong>ملاحظات:</strong> {invoice.notes}
            </div>
          )}

          <div className="mt-6 pt-3 border-t text-center text-[10px] text-muted-foreground">
            BatShark © {new Date().getFullYear()} — Economy Intelligence Platform — فاتورة إلكترونية
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════ Main Page ═══════ */
export default function Invoices() {
  const queryClient = useQueryClient();
  const { profile } = useAuthContext();
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: projects = [] } = useProjects();
  const [activeTab, setActiveTab] = useState('all');
  const [preview, setPreview] = useState<Invoice | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم حذف الفاتورة');
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (invoice: Invoice) => {
      // Update status to paid
      const { error } = await supabase.from('invoices' as any)
        .update({ status: 'paid' } as any)
        .eq('id', invoice.id);
      if (error) throw error;

      // Run auto-linking
      const project = projects.find(p => p.id === invoice.project_id);
      const userName = profile?.display_name || 'النظام';
      await finalizeInvoice(
        { ...invoice, status: 'paid' },
        project?.name || null,
        userName
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-derived-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast.success('✅ تم إنهاء الفاتورة وتسجيل القيد المحاسبي والخبر تلقائياً');
    },
    onError: (err: any) => {
      toast.error('فشل في إنهاء الفاتورة: ' + err.message);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('invoices' as any).update({ status } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم تحديث الحالة');
    },
  });

  const filtered = activeTab === 'all' ? invoices : invoices.filter(inv => inv.invoice_type === activeTab);

  const stats = {
    total: invoices.length,
    totalAmount: invoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.total_amount, 0),
    paid: invoices.filter(i => i.status === 'paid').length,
    draft: invoices.filter(i => i.status === 'draft').length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <FileText className="w-7 h-7 text-primary" />
              الفواتير
            </h1>
            <p className="text-muted-foreground text-sm">إدارة فواتير البادل والأومبركس</p>
          </div>
          <InvoiceFormDialog onSaved={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الفواتير', value: stats.total, icon: Hash, color: 'text-primary' },
            { label: 'المبلغ الإجمالي', value: `${stats.totalAmount.toLocaleString()} ر.س`, icon: CreditCard, color: 'text-section-revenue' },
            { label: 'مدفوعة', value: stats.paid, icon: Building2, color: 'text-success' },
            { label: 'مسودة', value: stats.draft, icon: FileText, color: 'text-muted-foreground' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50 bg-card/80">
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className={`w-8 h-8 ${s.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-black text-foreground">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="internal">بادل داخلية</TabsTrigger>
            <TabsTrigger value="customer">بادل زبون</TabsTrigger>
            <TabsTrigger value="umbrex_internal">أومبركس داخلية</TabsTrigger>
            <TabsTrigger value="umbrex_customer">أومبركس زبون</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Invoices List */}
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لا توجد فواتير بعد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">العميل/المورد</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الدفع</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => setPreview(inv)}>
                        <TableCell className="font-mono text-xs">#{inv.invoice_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {TYPE_LABELS[inv.invoice_type] || inv.invoice_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{inv.customer_name || '—'}</TableCell>
                        <TableCell className="text-xs">{format(new Date(inv.invoice_date), 'd MMM yyyy', { locale: ar })}</TableCell>
                        <TableCell className="font-bold">{inv.total_amount.toLocaleString()} ر.س</TableCell>
                        <TableCell>
                          <Select
                            value={inv.status}
                            onValueChange={(v) => updateStatus.mutate({ id: inv.id, status: v })}
                          >
                            <SelectTrigger className="h-7 text-[10px] w-24" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">مسودة</SelectItem>
                              <SelectItem value="sent">مرسلة</SelectItem>
                              <SelectItem value="paid">مدفوعة</SelectItem>
                              <SelectItem value="cancelled">ملغاة</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{inv.payment_method || '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreview(inv)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <InvoiceFormDialog
                              editInvoice={inv}
                              onSaved={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
                            />
                            {inv.status !== 'paid' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-success hover:text-success/80"
                                title="إنهاء وتسجيل تلقائي"
                                onClick={() => finalizeMutation.mutate(inv)}
                                disabled={finalizeMutation.isPending}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deleteMutation.mutate(inv.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {preview && <InvoicePreview invoice={preview} onClose={() => setPreview(null)} />}
      </div>
    </Layout>
  );
}
