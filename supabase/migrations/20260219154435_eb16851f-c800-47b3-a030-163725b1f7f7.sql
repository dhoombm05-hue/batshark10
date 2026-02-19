
-- ===== نظام القيود المحاسبية المزدوجة (Double-Entry Accounting) =====

-- جدول القيود المحاسبية الرئيسي
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_number SERIAL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL DEFAULT 'admin',
  notes TEXT,
  is_balanced BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- بنود القيد (مدين / دائن)
CREATE TABLE public.journal_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'expense', -- revenue, expense, asset, liability, equity
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول
CREATE POLICY "Allow all on journal_entries" ON public.journal_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on journal_lines" ON public.journal_lines FOR ALL USING (true) WITH CHECK (true);

-- تحديث updated_at تلقائياً
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- جدول حسابات دليل الحسابات
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL, -- revenue, expense, asset, liability, equity
  parent_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on chart_of_accounts" ON public.chart_of_accounts FOR ALL USING (true) WITH CHECK (true);

-- إدراج حسابات أساسية
INSERT INTO public.chart_of_accounts (code, name, account_type) VALUES
  ('1000', 'النقدية', 'asset'),
  ('1100', 'الذمم المدينة', 'asset'),
  ('1200', 'المخزون', 'asset'),
  ('2000', 'الذمم الدائنة', 'liability'),
  ('2100', 'القروض', 'liability'),
  ('3000', 'رأس المال', 'equity'),
  ('3100', 'الأرباح المبقاة', 'equity'),
  ('4000', 'إيرادات المبيعات', 'revenue'),
  ('4100', 'إيرادات الخدمات', 'revenue'),
  ('4200', 'إيرادات الإعلانات', 'revenue'),
  ('5000', 'الرواتب والأجور', 'expense'),
  ('5100', 'الإيجارات', 'expense'),
  ('5200', 'المصاريف الإعلانية', 'expense'),
  ('5300', 'المصاريف التشغيلية', 'expense'),
  ('5400', 'مصاريف الصيانة', 'expense'),
  ('5500', 'مصاريف النقل', 'expense');
