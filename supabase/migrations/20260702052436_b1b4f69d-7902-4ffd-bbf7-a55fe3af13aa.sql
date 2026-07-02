
DO $$ BEGIN
  CREATE TYPE public.contract_type AS ENUM ('partnership', 'service', 'sponsorship', 'employment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.contract_status AS ENUM ('draft','sent','awaiting_documents','awaiting_signature','signed','active','expired','terminated','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.contract_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contract_templates TO authenticated;
GRANT ALL ON public.contract_templates TO service_role;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_read_all" ON public.contract_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_ceo_manage" ON public.contract_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  type public.contract_type NOT NULL,
  title TEXT NOT NULL,
  status public.contract_status NOT NULL DEFAULT 'draft',
  party_name TEXT NOT NULL,
  party_email TEXT,
  party_phone TEXT,
  party_national_id TEXT,
  party_nationality TEXT,
  party_address TEXT,
  party_dob DATE,
  company_name TEXT,
  commercial_registration TEXT,
  tax_number TEXT,
  company_address TEXT,
  company_website TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  contract_value NUMERIC(14,2),
  equity_percentage NUMERIC(5,2),
  revenue_share_percentage NUMERIC(5,2),
  monthly_salary NUMERIC(14,2),
  monthly_bonus NUMERIC(14,2),
  payment_terms TEXT,
  start_date DATE,
  end_date DATE,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  notice_period_days INT DEFAULT 30,
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  requested_info JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature_method TEXT NOT NULL DEFAULT 'both',
  ceo_signature_data TEXT,
  ceo_signed_at TIMESTAMPTZ,
  party_signature_data TEXT,
  party_signed_at TIMESTAMPTZ,
  documents_submitted_at TIMESTAMPTZ,
  generated_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  credentials_sent_at TIMESTAMPTZ,
  credentials_pdf_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_ceo_all" ON public.contracts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "contracts_party_read" ON public.contracts FOR SELECT TO authenticated
  USING (generated_user_id = auth.uid());
CREATE POLICY "contracts_staff_read" ON public.contracts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'coo') OR public.has_role(auth.uid(),'strategic_director'));

CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON public.contracts(type);
CREATE INDEX IF NOT EXISTS idx_contracts_party_user ON public.contracts(generated_user_id);

CREATE TABLE IF NOT EXISTS public.contract_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.contract_attachments TO authenticated;
GRANT ALL ON public.contract_attachments TO service_role;
ALTER TABLE public.contract_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_ceo_all" ON public.contract_attachments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "attachments_party_read" ON public.contract_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.generated_user_id = auth.uid()));
CREATE POLICY "attachments_party_upload" ON public.contract_attachments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.generated_user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.contract_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.contract_activity TO authenticated;
GRANT ALL ON public.contract_activity TO service_role;
ALTER TABLE public.contract_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_read_related" ON public.contract_activity FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'ceo') OR
  EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.generated_user_id = auth.uid())
);
CREATE POLICY "activity_insert_auth" ON public.contract_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS trg_contracts_updated ON public.contracts;
CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contract_templates_updated ON public.contract_templates;
CREATE TRIGGER trg_contract_templates_updated BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.contract_templates (type, name, description, default_clauses, required_documents, required_fields) VALUES
('partnership','قالب شراكة تجارية احترافي','عقد شراكة بحصص وأرباح ومجلس إدارة',
'[
 {"title":"موضوع الشراكة","body":"يتفق الطرفان على تأسيس شراكة تجارية بغرض ممارسة النشاط الموضح في هذا العقد."},
 {"title":"رأس المال وتوزيع الحصص","body":"يتم توزيع الحصص بين الطرفين وفق النسب المتفق عليها."},
 {"title":"توزيع الأرباح والخسائر","body":"يتم توزيع صافي الأرباح والخسائر بحسب نسبة كل شريك من رأس المال."},
 {"title":"مجلس الإدارة والقرارات","body":"القرارات الجوهرية بالإجماع، والتشغيلية بالأغلبية البسيطة."},
 {"title":"السرية وعدم المنافسة","body":"يلتزم كل طرف بالحفاظ على أسرار الشراكة وعدم منافستها خلال مدة العقد وسنتين بعد انتهائه."},
 {"title":"إنهاء العقد وفض النزاعات","body":"إشعار مسبق 60 يوماً، وحل النزاعات عبر التحكيم في المملكة العربية السعودية."}
]'::jsonb,
'["صورة الهوية الوطنية","صورة السجل التجاري","الشهادة الضريبية","رقم الآيبان البنكي"]'::jsonb,
'["party_name","party_national_id","company_name","commercial_registration","tax_number","party_address","equity_percentage"]'::jsonb),
('service','قالب تعاقد خدمة/مورّد','تقديم خدمة أو توريد بمبلغ ومدة محددة',
'[
 {"title":"نطاق الخدمة","body":"يقوم المتعاقد بتقديم الخدمات الموضحة تفصيلاً وفق أعلى معايير الجودة."},
 {"title":"المقابل المالي","body":"يتم الدفع وفق الجدولة المتفق عليها بعد اعتماد الأعمال."},
 {"title":"مدة التنفيذ","body":"الالتزام بإنجاز الأعمال خلال المدة المحددة، وغرامة يومية على التأخير غير المبرر."},
 {"title":"الملكية الفكرية","body":"جميع المخرجات ملك حصري للشركة."},
 {"title":"السرية","body":"عدم إفشاء أي معلومات مكتسبة بموجب هذا العقد."},
 {"title":"إنهاء العقد","body":"إنهاء بإشعار كتابي مسبق مدته 30 يوماً."}
]'::jsonb,
'["صورة الهوية أو السجل التجاري","الشهادة الضريبية","رقم الآيبان"]'::jsonb,
'["party_name","company_name","commercial_registration","contract_value","start_date","end_date"]'::jsonb),
('sponsorship','قالب عقد رعاية / إعلان','رعاية حدث أو حملة إعلانية',
'[
 {"title":"موضوع الرعاية","body":"رعاية النشاط/الحدث الموضح مع الحقوق التسويقية."},
 {"title":"الحقوق والمزايا","body":"ظهور الشعار والمنتجات في القنوات المتفق عليها."},
 {"title":"القيمة المالية","body":"سداد قيمة الرعاية وفق جدولة الدفع."},
 {"title":"الاستخدام الإعلامي","body":"يحق للطرفين استخدام الحملة بعد التنسيق."},
 {"title":"الإخلال والإنهاء","body":"استرداد المدفوعات في حال الإخلال."}
]'::jsonb,
'["صورة السجل التجاري","الشعار عالي الدقة","الشهادة الضريبية"]'::jsonb,
'["party_name","company_name","contract_value","start_date","end_date"]'::jsonb),
('employment','قالب عقد عمل موظف','توظيف رسمي براتب ومزايا',
'[
 {"title":"طبيعة العمل","body":"العمل بالمسمى الوظيفي المحدد وأداء المهام بأمانة."},
 {"title":"الراتب والمزايا","body":"راتب شهري بالإضافة للمكافآت والبدلات."},
 {"title":"ساعات العمل والإجازات","body":"8 ساعات يومياً، 5 أيام أسبوعياً، إجازة سنوية 21 يوماً."},
 {"title":"فترة التجربة","body":"90 يوماً يحق خلالها إنهاء العقد دون تعويض."},
 {"title":"السرية وعدم المنافسة","body":"سرية بيانات الشركة وعدم العمل لدى منافس مباشر لمدة سنة."},
 {"title":"إنهاء العقد","body":"وفق أحكام نظام العمل في المملكة العربية السعودية."}
]'::jsonb,
'["صورة الهوية الوطنية","السيرة الذاتية","المؤهلات العلمية","رقم الآيبان","صورة شخصية"]'::jsonb,
'["party_name","party_national_id","party_phone","party_address","monthly_salary","start_date"]'::jsonb)
ON CONFLICT DO NOTHING;
