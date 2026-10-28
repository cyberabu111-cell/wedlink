import { paymentConfig, confirmPayment } from '@/lib/payments/server';
import { verifyCashfreeSignature } from '@/lib/payments/signature';
import { successWebhookSchema } from '@/lib/payments/validation';
import { errorResponse, HttpError, json, readLimitedBody } from '@/lib/http';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const { secret } = paymentConfig();
    const raw = await readLimitedBody(request, 1_048_576);
    if (!verifyCashfreeSignature(raw, request.headers.get('x-webhook-signature') || '', request.headers.get('x-webhook-timestamp') || '', secret))
      throw new HttpError(401, 'Invalid webhook signature.');
    let payload: unknown;
    try { payload = JSON.parse(raw.toString('utf8')); } catch { throw new HttpError(400, 'Invalid webhook payload.'); }
    if (!payload || typeof payload !== 'object' || !('type' in payload)) throw new HttpError(400, 'Missing webhook type.');
    // A failed attempt is not a failed order: the same checkout can later succeed.
    if (payload.type !== 'PAYMENT_SUCCESS_WEBHOOK') return json({ received: true });
    const parsed = successWebhookSchema.safeParse(payload);
    if (!parsed.success) throw new HttpError(400, 'Invalid successful payment payload.');
    const { order, payment } = parsed.data.data;
    await confirmPayment(order.order_id, payment.cf_payment_id, order.order_amount, payment.payment_amount, payment.payment_currency);
    return json({ received: true });
  } catch (error) { return errorResponse(error); }
}
