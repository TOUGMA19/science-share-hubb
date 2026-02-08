-- Add is_principal_author column to references table
ALTER TABLE public.references
ADD COLUMN is_principal_author boolean DEFAULT false;