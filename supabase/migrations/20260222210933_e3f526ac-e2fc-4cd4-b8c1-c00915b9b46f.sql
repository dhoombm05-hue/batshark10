
-- Add business_name and section columns to documents table for hierarchical organization
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS business_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS section text DEFAULT NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_documents_business ON public.documents(business_name);
CREATE INDEX IF NOT EXISTS idx_documents_section ON public.documents(section);
