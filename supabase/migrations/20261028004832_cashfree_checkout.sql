BEGIN;
ALTER TABLE public.payments
  ADD COLUMN cf_payment_id text UNIQUE,
  ADD COLUMN cf_environment text NOT NULL DEFAULT 'SANDBOX' CHECK (cf_environment IN ('SANDBOX','PRODUCTION')),
  ADD COLUMN checkout_request jsonb,
  ADD COLUMN last_checked_at timestamptz NOT NULL DEFAULT 'epoch';
CREATE INDEX payments_pending_checkout_idx ON public.payments(wedding_id, cf_environment, created_at DESC)
  WHERE status = 'PENDING';

-- Serialize reservations per invitation. A retry uses the same order and idempotency key.
CREATE FUNCTION public.reserve_checkout(p_wedding_id uuid, p_user_id uuid, p_amount numeric,
  p_environment text, p_customer jsonb, p_app_url text)
RETURNS SETOF public.payments LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE w public.weddings; payment public.payments; order_id text;
BEGIN
  SELECT * INTO w FROM public.weddings WHERE id=p_wedding_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF w.is_paid THEN RETURN; END IF;
  SELECT * INTO payment FROM public.payments WHERE wedding_id=w.id AND status='PENDING'
    AND cf_environment=p_environment AND checkout_request IS NOT NULL ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN RETURN NEXT payment; RETURN; END IF;
  order_id := 'wed_' || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.payments(wedding_id,user_id,cf_order_id,amount,cf_environment,checkout_request)
  VALUES(w.id,w.user_id,order_id,p_amount,p_environment,jsonb_build_object(
    'order_id',order_id,'order_amount',p_amount,'order_currency','INR',
    'customer_details',p_customer,
    'order_expiry_time',to_char((now()+interval '1 hour') AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'order_meta',jsonb_build_object('return_url',p_app_url || '/studio/' || w.id || '?payment=return',
      'notify_url',p_app_url || '/api/cashfree/webhook')))
  RETURNING * INTO payment;
  RETURN NEXT payment;
END; $$;

-- Both the webhook and authenticated reconciliation call this one atomic operation.
CREATE FUNCTION public.confirm_cashfree_payment(p_order_id text, p_payment_id text,
  p_order_amount numeric, p_payment_amount numeric, p_currency text, p_environment text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE payment public.payments;
BEGIN
  SELECT * INTO payment FROM public.payments WHERE cf_order_id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown payment order'; END IF;
  IF p_order_amount IS DISTINCT FROM payment.amount OR p_payment_amount IS DISTINCT FROM payment.amount
    OR p_currency IS DISTINCT FROM payment.currency OR p_environment IS DISTINCT FROM payment.cf_environment
    OR p_payment_id IS NULL OR p_payment_id !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'Payment verification mismatch';
  END IF;
  IF payment.status='SUCCESS' THEN
    IF payment.cf_payment_id IS DISTINCT FROM p_payment_id THEN RAISE EXCEPTION 'Different successful payment'; END IF;
    RETURN true;
  END IF;
  UPDATE public.payments SET status='SUCCESS', cf_payment_id=p_payment_id WHERE id=payment.id;
  UPDATE public.weddings SET is_paid=true WHERE id=payment.wedding_id AND user_id=payment.user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation missing'; END IF;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_checkout(uuid,uuid,numeric,text,jsonb,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.confirm_cashfree_payment(text,text,numeric,numeric,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_checkout(uuid,uuid,numeric,text,jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_cashfree_payment(text,text,numeric,numeric,text,text) TO service_role;
COMMIT;
