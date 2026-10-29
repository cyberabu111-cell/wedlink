-- Migration: Expand template_id constraint on public.weddings to allow all registered templates
ALTER TABLE public.weddings DROP CONSTRAINT IF EXISTS wedding_template_valid;
ALTER TABLE public.weddings ADD CONSTRAINT wedding_template_valid
  CHECK (char_length(template_id) <= 100);
