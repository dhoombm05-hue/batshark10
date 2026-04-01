
-- Invoices table for padel courts and Umbrex
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number SERIAL,
  invoice_type TEXT NOT NULL DEFAULT 'internal' CHECK (invoice_type IN ('internal', 'customer', 'umbrex_internal', 'umbrex_customer')),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  
  -- Common fields
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
  payment_method TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  
  -- Padel internal fields (stored as JSONB for flexibility)
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices"
  ON public.invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "CEO can manage invoices"
  ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Users can insert invoices"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
