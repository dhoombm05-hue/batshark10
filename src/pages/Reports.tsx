import { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';
import { useJournalMetrics } from '@/hooks/useJournalMetrics';
import { useTasks } from '@/hooks/useTasks';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  FileText, Download, Printer, Mail, Calendar, 
  Building2, Users, FolderKanban, TrendingUp, DollarSign,
  FileSpreadsheet, FilePdf, Send, Clock, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  type: 'financial' | 'projects' | 'employees' | 'executive';
}

const reportTemplates: ReportTemplate[] = [
  { id: 'monthly-financial', name: 'التقرير المالي الشهري', description: 'ملخص الإيرادات والمصروفات والأرباح', icon: DollarSign, type: 'financial' },
  { id: 'projects-status', name: 'حالة المشاريع', description: 'تقرير شامل عن أداء جميع المشاريع', icon: FolderKanban, type: 'projects' },
  { id: 'employee-performance', name: 'أداء الموظفين', description: 'تقييم ومتابعة أداء فريق العمل', icon: Users, type: 'employees' },
  { id: 'executive-summary', name: 'الملخص التنفيذي', description: 'نظرة شاملة للإدارة العليا', icon: Building2, type: 'executive' },
];

export default function Reports() {
  const { projects } = useProjects();
  const { employees } = useEmployees();
  const { metrics } = useJournalMetrics();
  const { tasks, doneTasks } = useTasks();
  const { profile } = useAuthContext();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState({
    start: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [emailTo, setEmailTo] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  const totalRevenue = projects.reduce((sum, p) => sum + (p.override_total_revenue ?? p.total_revenue), 0);
  const totalExpenses = projects.reduce((sum, p) => sum + (p.override_total_expenses ?? p.total_expenses), 0);
  const netProfit = totalRevenue - totalExpenses;

  // Generate report data based on template
  const generateReportData = (templateId: string) => {
    switch (templateId) {
      case 'monthly-financial':
        return {
          title: 'التقرير المالي الشهري',
          data: [
            ['البند', 'القيمة (ر.س)'],
            ['إجمالي الإيرادات', totalRevenue],
            ['إجمالي المصروفات', totalExpenses],
            ['صافي الربح', netProfit],
            ['هامش الربح', `${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%`],
            ['عدد المشاريع', projects.length],
          ]
        };
      case 'projects-status':
        return {
          title: 'تقرير حالة المشاريع',
          data: [
            ['المشروع', 'الإيرادات', 'المصروفات', 'الربح', 'الحالة'],
            ...projects.map(p => [
              p.name,
              p.override_total_revenue ?? p.total_revenue,
              p.override_total_expenses ?? p.total_expenses,
              (p.override_total_revenue ?? p.total_revenue) - (p.override_total_expenses ?? p.total_expenses),
              p.status === 'profitable' ? 'مربح' : p.status === 'loss' ? 'خاسر' : 'متعادل'
            ])
          ]
        };
      case 'employee-performance':
        return {
          title: 'تقرير أداء الموظفين',
          data: [
            ['الموظف', 'المنصب', 'الأداء', 'التقييم الشهري'],
            ...employees.map(e => [
              e.name,
              e.position,
              `${e.performance || 0}%`,
              e.monthly_rating || 0
            ])
          ]
        };
      case 'executive-summary':
        return {
          title: 'الملخص التنفيذي',
          data: [
            ['المؤشر', 'القيمة'],
            ['إجمالي الإيرادات', `${totalRevenue.toLocaleString()} ر.س`],
            ['صافي الربح', `${netProfit.toLocaleString()} ر.س`],
            ['عدد المشاريع', projects.length],
            ['عدد الموظفين', employees.length],
            ['المهام المكتملة', doneTasks.length],
            ['إجمالي المهام', tasks.length],
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
            <p className="text-muted-foreground text-sm">إنشاء وتصدير تقارير مخصصة</p>
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

        {/* Report Templates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg border-border/50 ${
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
                      'bg-primary/10'
                    }`}>
                      <template.icon className={`w-5 h-5 ${
                        template.type === 'financial' ? 'text-section-revenue' :
                        template.type === 'projects' ? 'text-section-forecast' :
                        template.type === 'employees' ? 'text-section-employees' :
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
                <div ref={reportRef} className="p-6 bg-white dark:bg-background rounded-lg border border-border">
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
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        {selectedReportData.data[0]?.map((header: string, i: number) => (
                          <th key={i} className="border border-border p-3 text-right font-medium text-foreground">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReportData.data.slice(1).map((row: any[], rowIndex: number) => (
                        <tr key={rowIndex} className="hover:bg-muted/30">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-border p-3 text-foreground">
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
                    <Button variant="outline" size="icon" disabled={!emailTo}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    سيتم إرسال التقرير كملف PDF
                  </p>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <h4 className="text-sm font-medium">الجدولة التلقائية</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>إرسال تلقائي: معطل</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    <Calendar className="w-4 h-4 ml-2" />
                    جدولة الإرسال
                  </Button>
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
