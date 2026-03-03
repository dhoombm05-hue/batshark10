
-- Add video_url column to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS video_url text DEFAULT NULL;
