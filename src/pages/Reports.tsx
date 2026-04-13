import { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';
import { useTasks } from '@/hooks/useTasks';
import { useAuthContext } from '@/contexts/AuthContext';
import { useJournalDerivedMetrics } from '@/hooks/useJournalMetrics';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  FileText, Download, Printer, Mail,
  Building2, Users, FolderKanban, TrendingUp, DollarSign,
  FileSpreadsheet, Send, Clock, CheckCircle2, Receipt, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useReportSchedule, getWeekdayName } from '@/hooks/useReportSchedule';
import ReportScheduleDialog from '@/components/ReportScheduleDialog';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  type: 'financial' | 'projects' | 'employees' | 'executive' | 'invoices' | 'activity';
}

const reportTemplates: ReportTemplate[] = [
  { id: 'monthly-financial', name: 'التقرير المالي الشهري', description: 'ملخص الإيرادات والمصروفات من القيود المحاسبية', icon: DollarSign, type: 'financial' },
  { id: 'projects-status', name: 'حالة المشاريع', description: 'تقرير شامل عن أداء جميع المشاريع', icon: FolderKanban, type: 'projects' },
  { id: 'employee-performance', name: 'أداء الموظفين', description: 'تقييم ومتابعة أداء فريق العمل', icon: Users, type: 'employees' },
  { id: 'executive-summary', name: 'الملخص التنفيذي', description: 'نظرة شاملة للإدارة العليا', icon: Building2, type: 'executive' },
  { id: 'invoices-report', name: 'تقرير الفواتير', description: 'جميع الفواتير الصادرة والمدفوعة', icon: Receipt, type: 'invoices' },
  { id: 'activity-report', name: 'سجل النشاطات', description: 'جميع العمليات والأنشطة المسجلة', icon: Activity, type: 'activity' },
];

// Hook for invoices data in reports
function useInvoicesForReports() {
  return useQuery({
    queryKey: ['invoices-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

// Hook for activity log
function useActivityForReports() {
  return useQuery({
    queryKey: ['activity-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_impact_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });
}

export default function Reports() {
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const { tasks, doneTasks } = useTasks();
  const { profile } = useAuthContext();
  const { settings: scheduleSettings, sendReportNow } = useReportSchedule();
  const { data: journalData } = useJournalDerivedMetrics();
  const { data: invoices = [] } = useInvoicesForReports();
  const { data: activities = [] } = useActivityForReports();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState({
    start: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [emailTo, setEmailTo] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  // Use journal-derived metrics as the SINGLE SOURCE OF TRUTH
  const totalRevenue = journalData?.companyMetrics?.totalRevenue || 0;
  const totalExpenses = journalData?.companyMetrics?.totalExpenses || 0;
  const netProfit = journalData?.companyMetrics?.netProfit || 0;
  const grossMargin = journalData?.companyMetrics?.grossMargin || 0;
  const roi = journalData?.companyMetrics?.roi || 0;
  const healthScore = journalData?.companyMetrics?.healthScore || 0;
  const monthlyGrowth = journalData?.companyMetrics?.monthlyGrowth || 0;
  const burnRate = journalData?.companyMetrics?.burnRate || 0;
  const runway = journalData?.companyMetrics?.runway || 0;

  // Invoices stats
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
  const totalInvoiceRevenue = paidInvoices
    .filter((i: any) => i.invoice_type === 'customer' || i.invoice_type === 'umbrex_customer')
    .reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
  const totalInvoiceExpenses = paidInvoices
    .filter((i: any) => i.invoice_type === 'internal' || i.invoice_type === 'umbrex_internal')
    .reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);

  // Generate report data based on template
  const generateReportData = (templateId: string) => {
    switch (templateId) {
      case 'monthly-financial':
        return {
          title: 'التقرير المالي الشهري (من القيود المحاسبية)',
          data: [
            ['البند', 'القيمة (ر.س)'],
            ['إجمالي الإيرادات (قيود)', totalRevenue.toLocaleString()],
            ['إجمالي المصروفات (قيود)', totalExpenses.toLocaleString()],
            ['صافي الربح', netProfit.toLocaleString()],
            ['هامش الربح', `${grossMargin}%`],
            ['العائد على الاستثمار (ROI)', `${roi}%`],
            ['النمو الشهري', `${monthlyGrowth}%`],
            ['معدل الحرق الشهري', burnRate.toLocaleString()],
            ['المدى الزمني المتوقع (أشهر)', runway],
            ['مؤشر الصحة المالية', `${healthScore}/100`],
            ['عدد المشاريع', projects.length],
            ['الفواتير المدفوعة', paidInvoices.length],
            ['إيرادات الفواتير', totalInvoiceRevenue.toLocaleString()],
            ['مصروفات الفواتير', totalInvoiceExpenses.toLocaleString()],
            ...(journalData?.expenseBreakdown?.length ? [
              ['', ''],
              ['--- توزيع المصروفات ---', ''],
              ...journalData.expenseBreakdown.map(e => [e.category, e.amount.toLocaleString()]),
            ] : []),
          ]
        };
      case 'projects-status': {
        const projectMetrics = journalData?.companyMetrics?.projectMetrics;
        return {
          title: 'تقرير حالة المشاريع',
          data: [
            ['المشروع', 'الإيرادات (قيود)', 'المصروفات (قيود)', 'الربح', 'النمو', 'الحالة'],
            ...projects.map(p => {
              const pm = projectMetrics?.get(p.id);
              return [
                p.name,
                pm ? pm.totalRevenue.toLocaleString() : '0',
                pm ? pm.totalExpenses.toLocaleString() : '0',
                pm ? pm.netProfit.toLocaleString() : '0',
                pm ? `${pm.growthRate}%` : '0%',
                pm?.status === 'profitable' ? 'مربح' : pm?.status === 'loss' ? 'خاسر' : 'متعادل',
              ];
            })
          ]
        };
      }
      case 'employee-performance':
        return {
          title: 'تقرير أداء الموظفين',
          data: [
            ['الموظف', 'المنصب', 'الأداء', 'التقييم الشهري', 'المساهمة في الربح'],
            ...employees.map(e => [
              e.name,
              e.position,
              `${e.performance || 0}%`,
              e.monthly_rating || 0,
              `${e.profit_contribution || 0}%`,
            ])
          ]
        };
      case 'executive-summary':
        return {
          title: 'الملخص التنفيذي',
          data: [
            ['المؤشر', 'القيمة'],
            ['إجمالي الإيرادات (قيود)', `${totalRevenue.toLocaleString()} ر.س`],
            ['إجمالي المصروفات (قيود)', `${totalExpenses.toLocaleString()} ر.س`],
            ['صافي الربح', `${netProfit.toLocaleString()} ر.س`],
            ['هامش الربح', `${grossMargin}%`],
            ['ROI', `${roi}%`],
            ['مؤشر الصحة', `${healthScore}/100`],
            ['النمو الشهري', `${monthlyGrowth}%`],
            ['عدد المشاريع', projects.length],
            ['عدد الموظفين', employees.length],
            ['المهام المكتملة', `${doneTasks.length} / ${tasks.length}`],
            ['الفواتير المدفوعة', paidInvoices.length],
            ['إجمالي الفواتير', invoices.length],
          ]
        };
      case 'invoices-report':
        return {
          title: 'تقرير الفواتير',
          data: [
            ['رقم الفاتورة', 'النوع', 'العميل/المورد', 'المبلغ (ر.س)', 'الحالة', 'التاريخ'],
            ...invoices.map((inv: any) => {
              const typeMap: Record<string, string> = {
                internal: 'بادل-داخلية', customer: 'بادل-زبون',
                umbrex_internal: 'أومبركس-داخلية', umbrex_customer: 'أومبركس-زبون',
              };
              const statusMap: Record<string, string> = {
                draft: 'مسودة', sent: 'مرسلة', paid: 'مدفوعة', cancelled: 'ملغاة',
              };
              return [
                `#${inv.invoice_number}`,
                typeMap[inv.invoice_type] || inv.invoice_type,
                inv.customer_name || '-',
                Number(inv.total_amount).toLocaleString(),
                statusMap[inv.status] || inv.status,
                inv.invoice_date ? format(new Date(inv.invoice_date), 'yyyy/MM/dd') : '-',
              ];
            }),
            ['', '', '', '', '', ''],
            ['الإجمالي المدفوع (مبيعات)', '', '', totalInvoiceRevenue.toLocaleString(), '', ''],
            ['الإجمالي المدفوع (مشتريات)', '', '', totalInvoiceExpenses.toLocaleString(), '', ''],
          ]
        };
      case 'activity-report':
        return {
          title: 'سجل النشاطات',
          data: [
            ['المستخدم', 'العملية', 'القسم', 'الكيان', 'الأثر المالي', 'التاريخ'],
            ...activities.slice(0, 50).map((a: any) => {
              const actionMap: Record<string, string> = {
                page_view: 'عرض صفحة', update: 'تعديل', create: 'إنشاء',
                delete: 'حذف', invoice_finalized: 'إنهاء فاتورة',
              };
              return [
                a.user_name || '-',
                actionMap[a.action_type] || a.action_type,
                a.section || a.entity_type || '-',
                a.entity_name || a.entity_id?.slice(0, 8) || '-',
                a.impact_on_net_profit ? `${Number(a.impact_on_net_profit).toLocaleString()} ر.س` : '-',
                a.created_at ? format(new Date(a.created_at), 'MM/dd HH:mm') : '-',
              ];
            }),
          ]
        };
      default:
        return { title: '', data: [] };
    }
  };

  // Export to Excel
  const exportToExcel = (templateId: string) => {
    const reportData = generateReportData(templateId);
    const ws = XLSX.utils.aoa_to_sheet(reportData.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير');
    XLSX.writeFile(wb, `${reportData.title}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Print report
  const handlePrint = () => {
    if (reportRef.current) {
      const printContent = reportRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl">
            <head>
              <title>تقرير BatShark</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: rtl; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
                th { background: #f5f5f5; }
                h1 { color: #333; }
                .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; }
                @media print { body { padding: 20px; } }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const selectedReportData = selectedTemplate ? generateReportData(selectedTemplate) : null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">التقارير الاحترافية</h1>
            <p className="text-muted-foreground text-sm">جميع البيانات مستخرجة من القيود المحاسبية والفواتير والنشاطات</p>
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={reportPeriod.start}
              onChange={(e) => setReportPeriod(p => ({ ...p, start: e.target.value }))}
              className="w-36"
            />
            <span className="self-center text-muted-foreground">إلى</span>
            <Input
              type="date"
              value={reportPeriod.end}
              onChange={(e) => setReportPeriod(p => ({ ...p, end: e.target.value }))}
              className="w-36"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">الإيرادات (قيود)</p>
              <p className="text-lg font-bold text-section-revenue">{totalRevenue.toLocaleString()} <span className="text-xs">ر.س</span></p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">المصروفات (قيود)</p>
              <p className="text-lg font-bold text-destructive">{totalExpenses.toLocaleString()} <span className="text-xs">ر.س</span></p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">صافي الربح</p>
              <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{netProfit.toLocaleString()} <span className="text-xs">ر.س</span></p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">الفواتير المنجزة</p>
              <p className="text-lg font-bold text-primary">{paidInvoices.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Templates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTemplates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg border-border/50 relative ${
                  selectedTemplate === template.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-card/80 backdrop-blur-sm'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      template.type === 'financial' ? 'bg-section-revenue/10' :
                      template.type === 'projects' ? 'bg-section-forecast/10' :
                      template.type === 'employees' ? 'bg-section-employees/10' :
                      template.type === 'invoices' ? 'bg-accent/10' :
                      template.type === 'activity' ? 'bg-section-growth/10' :
                      'bg-primary/10'
                    }`}>
                      <template.icon className={`w-5 h-5 ${
                        template.type === 'financial' ? 'text-section-revenue' :
                        template.type === 'projects' ? 'text-section-forecast' :
                        template.type === 'employees' ? 'text-section-employees' :
                        template.type === 'invoices' ? 'text-accent' :
                        template.type === 'activity' ? 'text-section-growth' :
                        'text-primary'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground text-sm">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    </div>
                  </div>
                  {selectedTemplate === template.id && (
                    <CheckCircle2 className="w-5 h-5 text-primary absolute top-2 left-2" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Report Preview & Actions */}
        {selectedTemplate && selectedReportData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview */}
            <Card className="lg:col-span-2 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  معاينة التقرير
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="w-4 h-4 ml-2" />
                    طباعة
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportToExcel(selectedTemplate)}>
                    <FileSpreadsheet className="w-4 h-4 ml-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div ref={reportRef} className="p-6 bg-white dark:bg-background rounded-lg border border-border overflow-x-auto">
                  {/* Report Header */}
                  <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedReportData.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        الفترة: {format(new Date(reportPeriod.start), 'd MMMM yyyy', { locale: ar })} - {format(new Date(reportPeriod.end), 'd MMMM yyyy', { locale: ar })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-primary text-lg">BATSHARK</p>
                      <p className="text-xs text-muted-foreground">Economy Intelligence</p>
                    </div>
                  </div>

                  {/* Report Table */}
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        {selectedReportData.data[0]?.map((header: string, i: number) => (
                          <th key={i} className="border border-border p-2.5 text-right font-medium text-foreground">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReportData.data.slice(1).map((row: any[], rowIndex: number) => (
                        <tr key={rowIndex} className="hover:bg-muted/30">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-border p-2.5 text-foreground">
                              {typeof cell === 'number' ? cell.toLocaleString() : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Report Footer */}
                  <div className="mt-6 pt-4 border-t border-border text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>تم الإنشاء بواسطة: {profile?.display_name}</span>
                      <span>{format(new Date(), 'd MMMM yyyy - HH:mm', { locale: ar })}</span>
                    </div>
                    <p className="text-xs mt-2 opacity-60">* جميع الأرقام المالية مستخرجة من القيود المحاسبية (دفتر اليومية)</p>
                    {additionalNotes && (
                      <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                        <p className="font-medium mb-1">ملاحظات:</p>
                        <p>{additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Sidebar */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">خيارات التقرير</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">ملاحظات إضافية</label>
                  <Textarea
                    placeholder="أضف ملاحظات للتقرير..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <label className="text-sm font-medium mb-2 block">إرسال بالبريد الإلكتروني</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="example@company.com"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      disabled={!emailTo}
                      onClick={() => {
                        if (selectedTemplate && selectedReportData) {
                          sendReportNow(selectedTemplate, selectedReportData, reportPeriod, emailTo);
                        }
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    سيتم إرسال التقرير مباشرة إلى البريد المحدد
                  </p>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">الجدولة التلقائية</h4>
                    {scheduleSettings.enabled && scheduleSettings.recipient_emails.length > 0 ? (
                      <Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">مفعّل</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">معطّل</Badge>
                    )}
                  </div>
                  {scheduleSettings.enabled && scheduleSettings.recipient_emails.length > 0 ? (
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>كل {scheduleSettings.weekdays.map(d => getWeekdayName(d)).join('، ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>الساعة {scheduleSettings.send_hour.toString().padStart(2, '0')}:00</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{scheduleSettings.recipient_emails.length} بريد</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">اضبط الجدول لإرسال التقارير تلقائياً</p>
                  )}
                  <ReportScheduleDialog />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={() => exportToExcel(selectedTemplate)}>
                    <Download className="w-4 h-4 ml-2" />
                    تحميل التقرير
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedTemplate && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">اختر نموذج تقرير</h3>
              <p className="text-muted-foreground">حدد نوع التقرير الذي تريد إنشاءه من القائمة أعلاه</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
