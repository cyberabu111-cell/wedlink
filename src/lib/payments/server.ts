import 'server-only';
import { Cashfree, CFEnvironment, type CreateOrderRequest, type OrderEntity } from 'cashfree-pg';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { HttpError } from '@/lib/http';
import { toPaise } from './validation';
import { z } from 'zod';

export function paymentConfig() {
  const id = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  const environment = process.env.NEXT_PUBLIC_CASHFREE_ENV || 'SANDBOX';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (!id || !secret || !appUrl || !['SANDBOX', 'PRODUCTION'].includes(environment))
    throw new HttpError(503, 'Checkout is not configured yet. Your draft is safe.');
  const url = new URL(appUrl);
  if (environment === 'PRODUCTION' && url.protocol !== 'https:') throw new HttpError(503, 'Checkout requires an HTTPS site URL.');
  return { id, secret, environment: environment as 'SANDBOX' | 'PRODUCTION', appUrl: url.origin };
}

export function cashfreeClient() {
  const config = paymentConfig();
  // Disable SDK error analytics: payment/customer details must not be sent to telemetry.
  const sdk = new Cashfree(config.environment === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    config.id, config.secret, undefined, undefined, undefined, false);
  sdk.XApiVersion = '2025-01-01';
  return { sdk, config };
}
export const requestOptions = { timeout: 15_000 };

export async function ownedWedding(weddingId: unknown) {
  if (!z.uuid().safeParse(weddingId).success) throw new HttpError(400, 'Invalid invitation.');
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw new HttpError(401, 'Sign in to publish your invitation.');
  const { data: wedding, error } = await client.from('weddings').select('*').eq('id', weddingId as string).eq('user_id', user.id).maybeSingle();
  if (error) throw new HttpError(503, 'Could not load your invitation.');
  if (!wedding) throw new HttpError(404, 'Invitation not found.');
  return { wedding, user };
}

export async function confirmPayment(orderId: string, paymentId: string, orderAmount: number, paymentAmount: number, currency: string) {
  toPaise(orderAmount); toPaise(paymentAmount);
  const admin = await createAdminClient();
  const { error } = await admin.rpc('confirm_cashfree_payment', {
    p_order_id: orderId, p_payment_id: paymentId, p_order_amount: orderAmount,
    p_payment_amount: paymentAmount, p_currency: currency, p_environment: paymentConfig().environment,
  });
  if (error) throw new Error('Payment confirmation failed');
}

export async function reconcileOrder(order: OrderEntity) {
  if (order.order_status !== 'PAID' || !order.order_id) return false;
  const { sdk } = cashfreeClient();
  const { data: attempts } = await sdk.PGOrderFetchPayments(order.order_id, undefined, undefined, requestOptions);
  const success = attempts.find((attempt) => attempt.payment_status === 'SUCCESS');
  if (!success?.cf_payment_id || success.payment_currency !== order.order_currency ||
    typeof order.order_amount !== 'number' || typeof success.payment_amount !== 'number') throw new Error('Incomplete payment confirmation');
  await confirmPayment(order.order_id, String(success.cf_payment_id), order.order_amount, success.payment_amount, order.order_currency!);
  return true;
}

export function storedOrderRequest(value: Record<string, unknown> | null): CreateOrderRequest {
  if (!value) throw new Error('Missing checkout reservation');
  return value as unknown as CreateOrderRequest;
}
