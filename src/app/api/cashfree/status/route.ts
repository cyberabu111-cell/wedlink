import { cashfreeClient, ownedWedding, reconcileOrder, requestOptions } from '@/lib/payments/server';
import { createAdminClient } from '@/lib/supabase/server';
import { errorResponse, HttpError, json, readLimitedBody, requireSameOrigin } from '@/lib/http';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    let body: { weddingId?: unknown };
    try { body = JSON.parse((await readLimitedBody(request)).toString('utf8')); }
    catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'Invalid request.'); }
    const { wedding, user } = await ownedWedding(body?.weddingId);
    if (wedding.is_paid) return json({ paid: true, slug: wedding.slug });
    const { sdk, config } = cashfreeClient();
    const admin = await createAdminClient();
    const { data: pending, error } = await admin.from('payments').select('id,cf_order_id').eq('wedding_id', wedding.id)
      .eq('user_id', user.id).eq('cf_environment', config.environment).eq('status', 'PENDING').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error('Payment status lookup failed');
    if (pending) {
      // Claim an upstream check atomically. Repeated browser polls do not flood Cashfree.
      const { data: claimed, error: claimError } = await admin.from('payments').update({ last_checked_at: new Date().toISOString() })
        .eq('id', pending.id).lt('last_checked_at', new Date(Date.now() - 10_000).toISOString()).select('id').maybeSingle();
      if (claimError) throw new Error('Payment status claim failed');
      if (claimed) {
        try {
          const { data: order } = await sdk.PGFetchOrder(pending.cf_order_id, undefined, undefined, requestOptions);
          if (await reconcileOrder(order)) return json({ paid: true, slug: wedding.slug });
        } catch (error) { if ((error as { response?: { status?: number } }).response?.status !== 404) throw error; }
      }
    }
    return json({ paid: false });
  } catch (error) { return errorResponse(error); }
}
