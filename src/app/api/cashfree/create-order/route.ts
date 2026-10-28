import { checkoutRequestSchema, publishableWeddingSchema, PUBLISH_AMOUNT_INR } from '@/lib/payments/validation';
import { cashfreeClient, ownedWedding, reconcileOrder, requestOptions, storedOrderRequest } from '@/lib/payments/server';
import { createAdminClient } from '@/lib/supabase/server';
import { errorResponse, HttpError, json, readLimitedBody, requireSameOrigin } from '@/lib/http';
import type { OrderEntity } from 'cashfree-pg';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    let body: unknown;
    try { body = JSON.parse((await readLimitedBody(request)).toString('utf8')); }
    catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'Invalid checkout request.'); }
    const parsed = checkoutRequestSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, 'Enter your name and a valid Indian mobile number.');
    const { wedding, user } = await ownedWedding(parsed.data.weddingId);
    if (wedding.is_paid) return json({ paid: true, slug: wedding.slug });
    const ready = publishableWeddingSchema.safeParse(wedding.wedding_data);
    if (!ready.success) throw new HttpError(422, ready.error.issues[0].message);
    const { sdk, config } = cashfreeClient();
    const admin = await createAdminClient();
    for (let retry = 0; retry < 2; retry++) {
      const { data: reservations, error } = await admin.rpc('reserve_checkout', {
        p_wedding_id: wedding.id, p_user_id: user.id, p_amount: PUBLISH_AMOUNT_INR,
        p_environment: config.environment, p_app_url: config.appUrl,
        p_customer: { customer_id: user.id, customer_name: parsed.data.customerName,
          customer_phone: parsed.data.customerPhone, ...(user.email ? { customer_email: user.email } : {}) },
      });
      if (error || !reservations) throw new Error('Checkout reservation failed');
      const payment = reservations[0];
      if (!payment) return json({ paid: true, slug: wedding.slug });
      let order: OrderEntity;
      try {
        order = (await sdk.PGFetchOrder(payment.cf_order_id, undefined, undefined, requestOptions)).data;
      } catch (error) {
        if ((error as { response?: { status?: number } }).response?.status !== 404) throw error;
        const payload = storedOrderRequest(payment.checkout_request);
        if (Date.parse(payload.order_expiry_time || '') <= Date.now()) {
          const { error: expiredError } = await admin.from('payments').update({ status: 'FAILED' }).eq('id', payment.id).eq('status', 'PENDING');
          if (expiredError) throw new Error('Could not expire checkout');
          continue;
        }
        order = (await sdk.PGCreateOrder(payload, undefined, payment.id, requestOptions)).data;
      }
      if (await reconcileOrder(order)) return json({ paid: true, slug: wedding.slug });
      if (['EXPIRED', 'TERMINATED'].includes(order.order_status || '')) {
        const { error: expiredError } = await admin.from('payments').update({ status: 'FAILED' }).eq('id', payment.id).eq('status', 'PENDING');
        if (expiredError) throw new Error('Could not expire checkout');
        continue;
      }
      if (order.order_status !== 'ACTIVE' || !order.payment_session_id) throw new HttpError(409, 'Checkout is being updated. Please try again shortly.');
      const { error: saveError } = await admin.from('payments').update({ cf_payment_session_id: order.payment_session_id }).eq('id', payment.id);
      if (saveError) throw new Error('Could not save checkout session');
      return json({ paymentSessionId: order.payment_session_id, mode: config.environment === 'PRODUCTION' ? 'production' : 'sandbox', amount: payment.amount });
    }
    throw new HttpError(409, 'Please retry checkout.');
  } catch (error) { return errorResponse(error); }
}
