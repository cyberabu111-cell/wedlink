-- Add nikah-emerald to wedding_template_valid check constraint
ALTER TABLE public.weddings DROP CONSTRAINT IF EXISTS wedding_template_valid;
ALTER TABLE public.weddings ADD CONSTRAINT wedding_template_valid
  CHECK (template_id IN ('royal-rajwada', 'minimal-sage', 'boho-floral', 'nikah-emerald'));
