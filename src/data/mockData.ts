export interface Project {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  growthRate: number;
  occupancyRate?: number;
  clientCount: number;
  campaignCount: number;
  status: 'profitable' | 'loss' | 'breakeven';
  monthlyData: { month: string; revenue: number; expenses: number; profit: number }[];
  expenseBreakdown: { category: string; amount: number }[];
  analysis: string[];
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  projects: string[];
  performance: number;
  kpiAchievement: number;
  profitContribution: number;
  monthlyRating: number;
  achievements: string[];
  improvements: string[];
  feedback: string;
  monthlyPerformance: { month: string; score: number }[];
}

export const projects: Project[] = [
  {
    id: 'padel',
    name: 'مشروع البادل',
    nameEn: 'Padel Project',
    description: 'ملاعب بادل رياضية مجهزة بأعلى المعايير',
    totalExpenses: 850000,
    totalRevenue: 1120000,
    netProfit: 270000,
    growthRate: 12,
    occupancyRate: 78,
    clientCount: 3420,
    campaignCount: 14,
    status: 'profitable',
    monthlyData: [
      { month: 'يناير', revenue: 85000, expenses: 72000, profit: 13000 },
      { month: 'فبراير', revenue: 78000, expenses: 68000, profit: 10000 },
      { month: 'مارس', revenue: 92000, expenses: 70000, profit: 22000 },
      { month: 'أبريل', revenue: 98000, expenses: 71000, profit: 27000 },
      { month: 'مايو', revenue: 105000, expenses: 69000, profit: 36000 },
      { month: 'يونيو', revenue: 110000, expenses: 73000, profit: 37000 },
      { month: 'يوليو', revenue: 95000, expenses: 75000, profit: 20000 },
      { month: 'أغسطس', revenue: 88000, expenses: 72000, profit: 16000 },
      { month: 'سبتمبر', revenue: 102000, expenses: 68000, profit: 34000 },
      { month: 'أكتوبر', revenue: 115000, expenses: 71000, profit: 44000 },
      { month: 'نوفمبر', revenue: 120000, expenses: 70000, profit: 50000 },
      { month: 'ديسمبر', revenue: 132000, expenses: 71000, profit: 61000 },
    ],
    expenseBreakdown: [
      { category: 'رواتب', amount: 280000 },
      { category: 'إيجار', amount: 180000 },
      { category: 'معدات', amount: 150000 },
      { category: 'إعلانات', amount: 95000 },
      { category: 'صيانة', amount: 85000 },
      { category: 'تشغيل', amount: 60000 },
    ],
    analysis: [
      'الربح ارتفع بنسبة 12% بسبب زيادة الحملات الإعلانية',
      'ارتفاع نسبة الإشغال إلى 78%',
      'تقليل المصروفات التشغيلية بنسبة 5%',
    ],
  },
  {
    id: 'screens',
    name: 'مشروع الشاشات',
    nameEn: 'Digital Screens',
    description: 'شاشات إعلانية رقمية في مواقع استراتيجية',
    totalExpenses: 620000,
    totalRevenue: 540000,
    netProfit: -80000,
    growthRate: -5,
    clientCount: 1850,
    campaignCount: 8,
    status: 'loss',
    monthlyData: [
      { month: 'يناير', revenue: 50000, expenses: 55000, profit: -5000 },
      { month: 'فبراير', revenue: 48000, expenses: 52000, profit: -4000 },
      { month: 'مارس', revenue: 45000, expenses: 54000, profit: -9000 },
      { month: 'أبريل', revenue: 42000, expenses: 50000, profit: -8000 },
      { month: 'مايو', revenue: 44000, expenses: 51000, profit: -7000 },
      { month: 'يونيو', revenue: 46000, expenses: 53000, profit: -7000 },
      { month: 'يوليو', revenue: 43000, expenses: 52000, profit: -9000 },
      { month: 'أغسطس', revenue: 41000, expenses: 50000, profit: -9000 },
      { month: 'سبتمبر', revenue: 47000, expenses: 51000, profit: -4000 },
      { month: 'أكتوبر', revenue: 45000, expenses: 50000, profit: -5000 },
      { month: 'نوفمبر', revenue: 44000, expenses: 51000, profit: -7000 },
      { month: 'ديسمبر', revenue: 45000, expenses: 51000, profit: -6000 },
    ],
    expenseBreakdown: [
      { category: 'رواتب', amount: 200000 },
      { category: 'إيجار مواقع', amount: 160000 },
      { category: 'صيانة شاشات', amount: 110000 },
      { category: 'كهرباء', amount: 80000 },
      { category: 'إعلانات', amount: 40000 },
      { category: 'تشغيل', amount: 30000 },
    ],
    analysis: [
      'الخسارة بسبب ضعف الحملات الإعلانية',
      'انخفاض العملاء بنسبة 22%',
      'ارتفاع تكاليف الصيانة بنسبة 15%',
    ],
  },
  {
    id: 'umbrex',
    name: 'مشروع Umbrex',
    nameEn: 'Umbrex',
    description: 'منصة خدمات متكاملة ومبتكرة',
    totalExpenses: 430000,
    totalRevenue: 480000,
    netProfit: 50000,
    growthRate: 8,
    clientCount: 2100,
    campaignCount: 11,
    status: 'profitable',
    monthlyData: [
      { month: 'يناير', revenue: 35000, expenses: 38000, profit: -3000 },
      { month: 'فبراير', revenue: 36000, expenses: 36000, profit: 0 },
      { month: 'مارس', revenue: 38000, expenses: 35000, profit: 3000 },
      { month: 'أبريل', revenue: 39000, expenses: 36000, profit: 3000 },
      { month: 'مايو', revenue: 40000, expenses: 35000, profit: 5000 },
      { month: 'يونيو', revenue: 41000, expenses: 36000, profit: 5000 },
      { month: 'يوليو', revenue: 39000, expenses: 35000, profit: 4000 },
      { month: 'أغسطس', revenue: 38000, expenses: 34000, profit: 4000 },
      { month: 'سبتمبر', revenue: 42000, expenses: 36000, profit: 6000 },
      { month: 'أكتوبر', revenue: 43000, expenses: 35000, profit: 8000 },
      { month: 'نوفمبر', revenue: 44000, expenses: 34000, profit: 10000 },
      { month: 'ديسمبر', revenue: 45000, expenses: 40000, profit: 5000 },
    ],
    expenseBreakdown: [
      { category: 'رواتب', amount: 160000 },
      { category: 'تطوير', amount: 100000 },
      { category: 'إعلانات', amount: 75000 },
      { category: 'استضافة', amount: 45000 },
      { category: 'تشغيل', amount: 50000 },
    ],
    analysis: [
      'نمو ثابت بمعدل 8% شهرياً',
      'تحسن في معدل التحويل بنسبة 15%',
      'المشروع وصل لنقطة التعادل في مارس',
    ],
  },
];

export const employees: Employee[] = [
  {
    id: '1',
    name: 'عبدالرحمن بن بندر بن محبوب',
    position: 'الرئيس التنفيذي (CEO)',
    projects: ['مشروع البادل', 'مشروع الشاشات', 'مشروع Umbrex'],
    performance: 95,
    kpiAchievement: 92,
    profitContribution: 45,
    monthlyRating: 9.5,
    achievements: ['قيادة نمو الإيرادات 18%', 'توسع في 3 مشاريع جديدة', 'تحقيق أهداف الربع الأول'],
    improvements: [],
    feedback: 'أداء قيادي متميز وإدارة استراتيجية فعالة',
    monthlyPerformance: [
      { month: 'يناير', score: 90 }, { month: 'فبراير', score: 88 }, { month: 'مارس', score: 92 },
      { month: 'أبريل', score: 91 }, { month: 'مايو', score: 94 }, { month: 'يونيو', score: 93 },
      { month: 'يوليو', score: 95 }, { month: 'أغسطس', score: 92 }, { month: 'سبتمبر', score: 96 },
      { month: 'أكتوبر', score: 95 }, { month: 'نوفمبر', score: 97 }, { month: 'ديسمبر', score: 95 },
    ],
  },
  {
    id: '2',
    name: 'محمد بن تركي الداود',
    position: 'مدير العمليات (COO)',
    projects: ['مشروع البادل'],
    performance: 91,
    kpiAchievement: 88,
    profitContribution: 28,
    monthlyRating: 9.1,
    achievements: ['رفع أرباح مشروع البادل بنسبة 18%', 'تحسين نسبة الإشغال', 'تقليل وقت الصيانة 30%'],
    improvements: ['تحسين التواصل مع فريق التسويق'],
    feedback: 'يستحق جائزة أفضل أداء هذا الشهر بسبب رفع أرباح مشروع البادل بنسبة 18%',
    monthlyPerformance: [
      { month: 'يناير', score: 82 }, { month: 'فبراير', score: 85 }, { month: 'مارس', score: 87 },
      { month: 'أبريل', score: 88 }, { month: 'مايو', score: 90 }, { month: 'يونيو', score: 89 },
      { month: 'يوليو', score: 91 }, { month: 'أغسطس', score: 88 }, { month: 'سبتمبر', score: 92 },
      { month: 'أكتوبر', score: 90 }, { month: 'نوفمبر', score: 93 }, { month: 'ديسمبر', score: 91 },
    ],
  },
  {
    id: '3',
    name: 'فهد سلطان المحبوب',
    position: 'المدير الاستراتيجي',
    projects: ['مشروع الشاشات', 'مشروع Umbrex'],
    performance: 74,
    kpiAchievement: 68,
    profitContribution: 12,
    monthlyRating: 7.2,
    achievements: ['تحسين نظام التقارير المالية'],
    improvements: ['إدارة المصروفات - تجاوز الميزانية 12%', 'تحسين دقة التوقعات المالية'],
    feedback: 'يحتاج تركيز في إدارة المصروفات بسبب تجاوز الميزانية 12%',
    monthlyPerformance: [
      { month: 'يناير', score: 78 }, { month: 'فبراير', score: 75 }, { month: 'مارس', score: 72 },
      { month: 'أبريل', score: 70 }, { month: 'مايو', score: 68 }, { month: 'يونيو', score: 72 },
      { month: 'يوليو', score: 74 }, { month: 'أغسطس', score: 71 }, { month: 'سبتمبر', score: 75 },
      { month: 'أكتوبر', score: 73 }, { month: 'نوفمبر', score: 76 }, { month: 'ديسمبر', score: 74 },
    ],
  },
  {
    id: '4',
    name: 'نايف بن محمد المطيري',
    position: 'مدير التقنية والتسويق الرقمي',
    projects: ['مشروع البادل', 'مشروع Umbrex'],
    performance: 86,
    kpiAchievement: 82,
    profitContribution: 20,
    monthlyRating: 8.4,
    achievements: ['زيادة العملاء الجدد 25%', 'تحسين معدل التحويل 15%'],
    improvements: ['تطوير استراتيجية المحتوى الرقمي'],
    feedback: 'أداء تسويقي جيد مع مساحة للتحسين في المحتوى',
    monthlyPerformance: [
      { month: 'يناير', score: 80 }, { month: 'فبراير', score: 82 }, { month: 'مارس', score: 84 },
      { month: 'أبريل', score: 83 }, { month: 'مايو', score: 85 }, { month: 'يونيو', score: 86 },
      { month: 'يوليو', score: 84 }, { month: 'أغسطس', score: 85 }, { month: 'سبتمبر', score: 87 },
      { month: 'أكتوبر', score: 86 }, { month: 'نوفمبر', score: 88 }, { month: 'ديسمبر', score: 86 },
    ],
  },
  {
    id: '5',
    name: 'سعد سلطان المحبوب',
    position: 'مدير الأعمال التسويقية',
    projects: ['مشروع الشاشات'],
    performance: 80,
    kpiAchievement: 76,
    profitContribution: 15,
    monthlyRating: 7.8,
    achievements: ['فتح 3 شراكات جديدة', 'تقديم عروض لـ 5 عملاء كبار'],
    improvements: ['تسريع إغلاق الصفقات', 'تحسين متابعة العملاء المحتملين'],
    feedback: 'يحتاج تطوير في سرعة إغلاق الصفقات مع إمكانيات واعدة',
    monthlyPerformance: [
      { month: 'يناير', score: 75 }, { month: 'فبراير', score: 77 }, { month: 'مارس', score: 78 },
      { month: 'أبريل', score: 76 }, { month: 'مايو', score: 79 }, { month: 'يونيو', score: 80 },
      { month: 'يوليو', score: 78 }, { month: 'أغسطس', score: 81 }, { month: 'سبتمبر', score: 80 },
      { month: 'أكتوبر', score: 82 }, { month: 'نوفمبر', score: 81 }, { month: 'ديسمبر', score: 80 },
    ],
  },
];

export const companyMetrics = {
  totalExpenses: projects.reduce((s, p) => s + p.totalExpenses, 0),
  totalRevenue: projects.reduce((s, p) => s + p.totalRevenue, 0),
  netProfit: projects.reduce((s, p) => s + p.netProfit, 0),
  monthlyGrowth: 6.2,
  healthScore: 72,
  // Advanced Financial Indicators
  roi: 12.5,
  ebitda: 380000,
  burnRate: 158000,
  runway: 14, // months
  liquidityRatio: 1.8,
  costEfficiencyIndex: 0.87,
  performanceIndex: 82,
  grossMargin: 31.2,
  operatingMargin: 11.2,
  debtToEquity: 0.35,
};

export const forecasts = {
  oneMonth: { revenue: 228000, expenses: 195000, profit: 33000, confidence: 85 },
  threeMonths: { revenue: 710000, expenses: 590000, profit: 120000, confidence: 75 },
  oneYear: { revenue: 2950000, expenses: 2400000, profit: 550000, confidence: 60 },
  insights: [
    'بناءً على معدل النمو الحالي 8% شهرياً، يتوقع تحقيق فائض قدره 240,000 ريال خلال 6 أشهر.',
    'مشروع البادل يظهر نمواً مستداماً ومتوقع زيادة الأرباح 15% الربع القادم.',
    'في حال استمرار انخفاض أداء مشروع الشاشات، يتوقع خسارة إضافية 120,000 ريال خلال 6 أشهر.',
    'مشروع Umbrex وصل لنقطة التعادل ويتجه للربحية المستدامة.',
  ],
  risks: [
    'تراجع مشروع الشاشات يشكل خطراً على السيولة الإجمالية',
    'الاعتماد الكبير على مشروع البادل كمصدر ربح رئيسي',
    'تقلبات السوق قد تؤثر على معدل النمو المتوقع',
  ],
};

export const strategicAnalysis = {
  swot: {
    strengths: ['تنوع المشاريع', 'فريق عمل متمرس', 'نمو ثابت في مشروع البادل', 'قاعدة عملاء متنامية'],
    weaknesses: ['خسائر مشروع الشاشات', 'اعتماد كبير على مشروع واحد', 'ضعف التسويق الرقمي'],
    opportunities: ['التوسع في مدن جديدة', 'شراكات استراتيجية', 'تطوير تطبيقات رقمية', 'دعم رؤية 2030'],
    threats: ['منافسة متزايدة', 'تقلبات اقتصادية', 'تغير سلوك المستهلك', 'ارتفاع تكاليف التشغيل'],
  },
  roi: 12.5,
  liquidityRatio: 1.8,
  cashFlow: {
    operating: 320000,
    investing: -180000,
    financing: -50000,
    net: 90000,
  },
};

export const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat('ar-SA').format(Math.abs(amount));
  return amount < 0 ? `-${formatted} ريال` : `${formatted} ريال`;
};

export const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value}%`;
