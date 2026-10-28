BEGIN;

CREATE TABLE public.weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  template_id text NOT NULL DEFAULT 'royal-rajwada',
  plan_tier text NOT NULL DEFAULT 'basic',
  is_paid boolean NOT NULL DEFAULT false,
  wedding_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wedding_owner_pair UNIQUE (id, user_id),
  CONSTRAINT wedding_slug_format CHECK (
    char_length(slug) BETWEEN 3 AND 80 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND slug NOT IN ('api', 'studio', 'rsvps', 'login', 'signup', 'auth', 'dashboard',
      'pricing', 'templates', 'admin', 'account', 'settings', 'preview', 'invite',
      'privacy', 'terms', 'support', 'favicon', 'robots', 'sitemap')
  ),
  CONSTRAINT wedding_template_valid CHECK (template_id IN ('royal-rajwada', 'minimal-sage', 'boho-floral')),
  CONSTRAINT wedding_plan_valid CHECK (plan_tier IN ('basic', 'premium')),
  -- Coarse structural boundary; application writes must also pass weddingDataSchema.
  -- No '{}' default: a new draft must contain the complete WeddingData shape.
  CONSTRAINT wedding_json_shape CHECK (COALESCE(
    jsonb_typeof(wedding_data) = 'object'
    AND wedding_data ?& ARRAY['couple', 'story', 'events', 'gallery', 'theme', 'rsvpConfig']
    AND jsonb_typeof(wedding_data->'couple') = 'object'
    AND jsonb_typeof(wedding_data->'story') = 'object'
    AND jsonb_typeof(wedding_data->'events') = 'array'
    AND jsonb_typeof(wedding_data->'gallery') = 'array'
    AND jsonb_typeof(wedding_data->'theme') = 'object'
    AND jsonb_typeof(wedding_data->'rsvpConfig') = 'object'
    AND octet_length(wedding_data::text) <= 1048576,
    false
  ))
);

CREATE INDEX weddings_user_created_idx ON public.weddings(user_id, created_at DESC);
-- UNIQUE(slug) already provides the public lookup index.

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cf_order_id text UNIQUE NOT NULL CHECK (char_length(cf_order_id) BETWEEN 1 AND 255),
  cf_payment_session_id text,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_wedding_owner_fk FOREIGN KEY (wedding_id, user_id)
    REFERENCES public.weddings(id, user_id) ON DELETE CASCADE
);
CREATE INDEX payments_wedding_idx ON public.payments(wedding_id);
CREATE INDEX payments_user_created_idx ON public.payments(user_id, created_at DESC);

CREATE TABLE public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  guest_name text NOT NULL CHECK (char_length(btrim(guest_name)) BETWEEN 1 AND 200),
  phone_number text CHECK (phone_number IS NULL OR char_length(phone_number) <= 32),
  attending boolean NOT NULL DEFAULT true,
  guests_count integer NOT NULL DEFAULT 1 CHECK (guests_count BETWEEN 1 AND 100),
  events_attending text[] CHECK (events_attending IS NULL OR cardinality(events_attending) <= 50),
  dietary_notes text CHECK (dietary_notes IS NULL OR char_length(dietary_notes) <= 2000),
  message_for_couple text CHECK (message_for_couple IS NULL OR char_length(message_for_couple) <= 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rsvps_wedding_created_idx ON public.rsvps(wedding_id, created_at DESC);

CREATE FUNCTION public.set_wedding_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.set_wedding_updated_at() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER wedding_updated_at BEFORE UPDATE ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.set_wedding_updated_at();

ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- Supabase may grant broad privileges by default. Clear them before narrow grants.
REVOKE ALL ON public.weddings, public.payments, public.rsvps FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.weddings TO authenticated;
GRANT INSERT (slug, template_id, wedding_data) ON public.weddings TO authenticated;
GRANT UPDATE (slug, template_id, wedding_data) ON public.weddings TO authenticated;
-- No client-side delete: avoids cascading deletion of payment records.
CREATE POLICY weddings_owner_select ON public.weddings FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY weddings_owner_insert ON public.weddings FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND is_paid = false AND plan_tier = 'basic');
CREATE POLICY weddings_owner_update ON public.weddings FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Checkout session identifiers stay server-only. Clients must select explicit fields.
GRANT SELECT (id, wedding_id, user_id, cf_order_id, amount, currency, status, created_at)
  ON public.payments TO authenticated;
CREATE POLICY payments_owner_select ON public.payments FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT, DELETE ON public.rsvps TO authenticated;
CREATE POLICY rsvps_owner_select ON public.rsvps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w
    WHERE w.id = wedding_id AND w.user_id = (SELECT auth.uid())));
CREATE POLICY rsvps_owner_delete ON public.rsvps FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w
    WHERE w.id = wedding_id AND w.user_id = (SELECT auth.uid())));

-- Only trusted server code may write payments, unlock weddings, or accept RSVPs.
-- Module 04 must verify Cashfree signatures and use an atomic, idempotent transaction.
GRANT ALL ON public.weddings, public.payments, public.rsvps TO service_role;
COMMIT;
