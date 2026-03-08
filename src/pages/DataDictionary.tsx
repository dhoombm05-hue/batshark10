import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Search, Database, Calculator, TrendingUp, 
  DollarSign, Users, FolderKanban, Info, HelpCircle,
  ChevronDown, ChevronRight, FileText, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DictionaryEntry {
  id: string;
  term: string;
  termEn: string;
  definition: string;
  formula?: string;
  example?: string;
  category: 'financial' | 'kpi' | 'project' | 'employee' | 'system';
  relatedTerms?: string[];
}

const dictionaryData: DictionaryEntry[] = [
  // Financial Terms
  {
    id: 'revenue',
    term: 'الإيرادات',
    termEn: 'Revenue',
    definition: 'إجمالي الدخل الناتج من بيع المنتجات أو تقديم الخدمات قبل خصم أي مصروفات',
    formula: 'الإيرادات = مجموع القيود الدائنة (Credit)',
    example: 'إيرادات مبيعات + إيرادات خدمات + إيرادات أخرى',
    category: 'financial',
    relatedTerms: ['صافي الربح', 'هامش الربح'],
  },
  {
    id: 'expenses',
    term: 'المصروفات',
    termEn: 'Expenses',
    definition: 'إجمالي التكاليف والنفقات المترتبة على تشغيل الأعمال',
    formula: 'المصروفات = مجموع القيود المدينة (Debit)',
    example: 'رواتب + إيجارات + مرافق + تسويق',
    category: 'financial',
    relatedTerms: ['الإيرادات', 'صافي الربح'],
  },
  {
    id: 'net-profit',
    term: 'صافي الربح',
    termEn: 'Net Profit',
    definition: 'الربح المتبقي بعد خصم جميع المصروفات من إجمالي الإيرادات',
    formula: 'صافي الربح = الإيرادات - المصروفات',
    example: 'إذا كانت الإيرادات 100,000 والمصروفات 70,000، فصافي الربح = 30,000',
    category: 'financial',
    relatedTerms: ['هامش الربح', 'ROI'],
  },
  {
    id: 'profit-margin',
    term: 'هامش الربح',
    termEn: 'Profit Margin',
    definition: 'نسبة صافي الربح إلى إجمالي الإيرادات، تقيس كفاءة تحويل الإيرادات إلى أرباح',
    formula: 'هامش الربح (%) = (صافي الربح ÷ الإيرادات) × 100',
    example: 'ربح 30,000 من إيرادات 100,000 = هامش ربح 30%',
    category: 'kpi',
    relatedTerms: ['صافي الربح', 'ROI'],
  },
  // KPIs
  {
    id: 'roi',
    term: 'العائد على الاستثمار',
    termEn: 'ROI (Return on Investment)',
    definition: 'مقياس لقياس ربحية الاستثمار مقارنة بتكلفته',
    formula: 'ROI (%) = ((العائد - التكلفة) ÷ التكلفة) × 100',
    example: 'استثمار 50,000 حقق عائد 65,000 = ROI = 30%',
    category: 'kpi',
    relatedTerms: ['صافي الربح', 'هامش الربح'],
  },
  {
    id: 'growth-rate',
    term: 'معدل النمو',
    termEn: 'Growth Rate',
    definition: 'نسبة التغير في قيمة معينة (مثل الإيرادات أو الأرباح) خلال فترة زمنية',
    formula: 'معدل النمو (%) = ((القيمة الحالية - القيمة السابقة) ÷ القيمة السابقة) × 100',
    example: 'ارتفاع الإيرادات من 80,000 إلى 100,000 = نمو 25%',
    category: 'kpi',
    relatedTerms: ['الإيرادات', 'صافي الربح'],
  },
  {
    id: 'health-score',
    term: 'مؤشر صحة الشركة',
    termEn: 'Company Health Score',
    definition: 'مؤشر شامل يقيس الوضع المالي والتشغيلي للشركة من 0 إلى 100',
    formula: 'المؤشر = (الربحية × 0.3) + (هامش الربح × 0.25) + (معدل النمو × 0.25) + (إنجاز المهام × 0.2)',
    example: 'شركة ذات ربحية عالية ونمو جيد = مؤشر 75+',
    category: 'kpi',
    relatedTerms: ['صافي الربح', 'معدل النمو'],
  },
  // Project Terms
  {
    id: 'project-status',
    term: 'حالة المشروع',
    termEn: 'Project Status',
    definition: 'تصنيف المشروع بناءً على أدائه المالي: مربح، متعادل، أو خاسر',
    example: 'مشروع بصافي ربح إيجابي = مربح',
    category: 'project',
    relatedTerms: ['صافي الربح', 'الإيرادات'],
  },
  {
    id: 'data-reliability',
    term: 'موثوقية البيانات',
    termEn: 'Data Reliability Score',
    definition: 'نسبة تقيس دقة واتساق البيانات المدخلة في النظام',
    formula: 'تنخفض النسبة عند: التعديلات المتكررة، البيانات الناقصة، التجاوز اليدوي المتكرر',
    category: 'system',
    relatedTerms: ['التجاوز اليدوي', 'سجل التدقيق'],
  },
  // Employee Terms
  {
    id: 'employee-performance',
    term: 'أداء الموظف',
    termEn: 'Employee Performance',
    definition: 'مقياس شامل لإنتاجية وكفاءة الموظف بناءً على عدة معايير',
    formula: 'الأداء = (المهام المنجزة × 0.25) + (جودة العمل × 0.25) + (الالتزام × 0.25) + (التعاون × 0.25)',
    category: 'employee',
    relatedTerms: ['مؤشر النشاط', 'التقييم الشهري'],
  },
  {
    id: 'activity-index',
    term: 'مؤشر النشاط',
    termEn: 'Activity Index',
    definition: 'مقياس لحجم ونوعية النشاط اليومي للموظف في النظام',
    example: 'يشمل: الإضافات، التعديلات، التحليلات، المشاركات',
    category: 'employee',
    relatedTerms: ['أداء الموظف', 'سجل التدقيق'],
  },
  // System Terms
  {
    id: 'manual-override',
    term: 'التجاوز اليدوي',
    termEn: 'Manual Override',
    definition: 'إمكانية تعديل القيم المحسوبة تلقائياً بقيم يدوية مخصصة',
    example: 'تجاوز الإيرادات المحسوبة بقيمة مختلفة مع ذكر السبب',
    category: 'system',
    relatedTerms: ['موثوقية البيانات', 'سجل التدقيق'],
  },
  {
    id: 'audit-log',
    term: 'سجل التدقيق',
    termEn: 'Audit Log',
    definition: 'سجل تفصيلي لجميع التغييرات التي تتم على البيانات مع معلومات المستخدم والوقت',
    example: 'يحفظ: القيمة القديمة، القيمة الجديدة، المستخدم، التاريخ، السبب',
    category: 'system',
    relatedTerms: ['التجاوز اليدوي', 'مؤشر النشاط'],
  },
];

const categoryLabels: Record<string, { label: string; icon: any; color: string }> = {
  financial: { label: 'مصطلحات مالية', icon: DollarSign, color: 'section-revenue' },
  kpi: { label: 'مؤشرات الأداء', icon: TrendingUp, color: 'section-forecast' },
  project: { label: 'المشاريع', icon: FolderKanban, color: 'section-ai' },
  employee: { label: 'الموظفين', icon: Users, color: 'section-employees' },
  system: { label: 'النظام', icon: Database, color: 'primary' },
};

export default function DataDictionary() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredEntries = dictionaryData.filter(entry => {
    const matchesSearch = 
      entry.term.includes(search) || 
      entry.termEn.toLowerCase().includes(search.toLowerCase()) ||
      entry.definition.includes(search);
    const matchesCategory = activeCategory === 'all' || entry.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, DictionaryEntry[]>);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              قاموس البيانات
            </h1>
            <p className="text-muted-foreground text-sm">شرح المصطلحات والمؤشرات والمعادلات</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مصطلح..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Layers className="w-4 h-4 ml-2" />
              الكل
            </TabsTrigger>
            {Object.entries(categoryLabels).map(([key, { label, icon: Icon, color }]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="w-4 h-4 ml-2" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-6">
            {/* Data Flow Section */}
            {activeCategory === 'all' && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    تدفق البيانات في النظام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <FileText className="w-5 h-5 text-section-invest" />
                      <span>مصدر البيانات</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Database className="w-5 h-5 text-section-ai" />
                      <span>التنظيف والتخزين</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Calculator className="w-5 h-5 text-section-forecast" />
                      <span>المعالجة والتحليل</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <TrendingUp className="w-5 h-5 text-section-revenue" />
                      <span>لوحة التحكم</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dictionary Entries */}
            <div className="space-y-4">
              {Object.entries(groupedEntries).map(([category, entries]) => (
                <div key={category}>
                  {activeCategory === 'all' && (
                    <div className="flex items-center gap-2 mb-3">
                      {categoryLabels[category] && (
                        <>
                          <categoryLabels[category].icon className={`w-5 h-5 text-${categoryLabels[category].color}`} />
                          <h3 className="font-bold text-foreground">{categoryLabels[category].label}</h3>
                          <Badge variant="outline" className="text-xs">{entries.length}</Badge>
                        </>
                      )}
                    </div>
                  )}
                  <div className="grid gap-3">
                    {entries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Card 
                          className={`border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer hover:shadow-md transition-all ${
                            expandedId === entry.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg bg-${categoryLabels[entry.category]?.color || 'primary'}/10 shrink-0`}>
                                <Info className={`w-4 h-4 text-${categoryLabels[entry.category]?.color || 'primary'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-foreground">{entry.term}</h4>
                                  <Badge variant="outline" className="text-xs">{entry.termEn}</Badge>
                                  {expandedId === entry.id ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground mr-auto" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground mr-auto" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{entry.definition}</p>
                                
                                <AnimatePresence>
                                  {expandedId === entry.id && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-4 pt-4 border-t border-border/50 space-y-3"
                                    >
                                      {entry.formula && (
                                        <div className="p-3 rounded-lg bg-muted/50">
                                          <p className="text-xs text-muted-foreground mb-1">المعادلة</p>
                                          <p className="text-sm font-mono text-foreground">{entry.formula}</p>
                                        </div>
                                      )}
                                      {entry.example && (
                                        <div className="p-3 rounded-lg bg-primary/5">
                                          <p className="text-xs text-muted-foreground mb-1">مثال</p>
                                          <p className="text-sm text-foreground">{entry.example}</p>
                                        </div>
                                      )}
                                      {entry.relatedTerms && entry.relatedTerms.length > 0 && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-2">مصطلحات ذات صلة</p>
                                          <div className="flex flex-wrap gap-2">
                                            {entry.relatedTerms.map((term) => (
                                              <Badge key={term} variant="secondary" className="text-xs">
                                                {term}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {filteredEntries.length === 0 && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <HelpCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">لا توجد نتائج</h3>
                  <p className="text-muted-foreground">جرب البحث بكلمات مختلفة</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
