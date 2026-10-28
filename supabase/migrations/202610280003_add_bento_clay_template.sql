-- Add 'bento-clay' template to the allowed template_id values
ALTER TABLE public.weddings DROP CONSTRAINT IF EXISTS wedding_template_valid;
ALTER TABLE public.weddings ADD CONSTRAINT wedding_template_valid
  CHECK (template_id IN ('royal-rajwada', 'minimal-sage', 'boho-floral', 'nikah-emerald', 'bento-clay'));
