import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { verifyCashfreeSignature } from '../src/lib/payments/signature';
import { checkoutRequestSchema, publishableWeddingSchema, successWebhookSchema, toPaise } from '../src/lib/payments/validation';
import { createEmptyWeddingData } from '../src/lib/wedding-defaults';
import { safeAuthNext } from '../src/lib/auth-redirect';
import { readLimitedBody, requireSameOrigin } from '../src/lib/http';

test('webhook signature authenticates exact bytes, timestamp and secret', () => {
  const body = Buffer.from('{ "amount":1499.00,"name":"அன்பு" }');
  const timestamp = '1793140000000';
  const signature = createHmac('sha256', 'test-secret').update(timestamp).update(body).digest('base64');
  assert.ok(verifyCashfreeSignature(body, signature, timestamp, 'test-secret'));
  assert.equal(verifyCashfreeSignature(Buffer.from(JSON.stringify(JSON.parse(body.toString()))), signature, timestamp, 'test-secret'), false);
  assert.equal(verifyCashfreeSignature(body, signature, '1793140000001', 'test-secret'), false);
  assert.equal(verifyCashfreeSignature(body, signature, timestamp, 'wrong-secret'), false);
  for (const invalid of ['', 'x', signature.slice(0,-1), signature + '=']) assert.equal(verifyCashfreeSignature(body, invalid, timestamp, 'test-secret'), false);
});

test('checkout rejects client pricing, invalid phones and incomplete invitations', () => {
  const input = { weddingId: '11111111-1111-4111-8111-111111111111', customerName: 'Amina', customerPhone: '+919876543210' };
  assert.equal(checkoutRequestSchema.parse(input).customerPhone, '9876543210');
  assert.equal(checkoutRequestSchema.safeParse({ ...input, amount: 1 }).success, false);
  assert.equal(checkoutRequestSchema.safeParse({ ...input, customerPhone: '1234567890' }).success, false);
  assert.equal(publishableWeddingSchema.safeParse(createEmptyWeddingData()).success, false);
  assert.equal(toPaise(1499), 149900);
  for (const value of [0, -1, NaN, Infinity, 1.001]) assert.throws(() => toPaise(value));
  const data = { type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: 'order', order_amount: 1499, order_currency: 'INR' },
    payment: { cf_payment_id: 1234, payment_status: 'SUCCESS', payment_amount: 1499, payment_currency: 'INR' } } };
  assert.equal(successWebhookSchema.parse(data).data.payment.cf_payment_id, '1234');
  assert.equal(successWebhookSchema.safeParse({ ...data, type: 'PAYMENT_FAILED_WEBHOOK' }).success, false);
  data.data.payment.payment_currency = 'USD';
  assert.equal(successWebhookSchema.safeParse(data).success, false);
});

test('request boundary limits body size, enforces origin and prevents login open redirects', async () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = 'https://invite.example';
  try {
    requireSameOrigin(new Request('https://invite.example/api', { headers: { origin: 'https://invite.example' } }));
    assert.throws(() => requireSameOrigin(new Request('https://invite.example/api', { headers: { origin: 'https://evil.example' } })));
    assert.throws(() => requireSameOrigin(new Request('https://invite.example/api')));
  } finally { if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL; else process.env.NEXT_PUBLIC_APP_URL = previous; }
  assert.equal((await readLimitedBody(new Request('http://localhost', { method: 'POST', body: 'abc' }), 3)).toString(), 'abc');
  await assert.rejects(readLimitedBody(new Request('http://localhost', { method: 'POST', body: 'abcd' }), 3), /too large/);
  assert.equal(safeAuthNext('/studio/new'), '/studio/new');
  for (const next of ['//evil.example', 'https://evil.example', '/studio/../admin', '/studio?next=//evil', '/\\evil']) assert.equal(safeAuthNext(next), '/studio');
});

test('actual migrations reserve idempotently and atomically verify owner, amount, currency and environment', async () => {
  const db = new PGlite();
  const owner = '11111111-1111-4111-8111-111111111111';
  const stranger = '22222222-2222-4222-8222-222222222222';
  try {
    await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
      GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
      INSERT INTO auth.users VALUES ('${owner}'),('${stranger}');`);
    const dir = new URL('../supabase/migrations/', import.meta.url);
    for (const file of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, dir), 'utf8'));
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub='${owner}';`);
    const { rows: [wedding] } = await db.query<{ id: string }>('INSERT INTO public.weddings(slug,wedding_data) VALUES ($1,$2) RETURNING id', ['our-wedding', JSON.stringify(createEmptyWeddingData())]);
    const reserveSql = 'SELECT * FROM public.reserve_checkout($1,$2,1499,$3,$4,$5)';
    const reserveArgs = [wedding.id, owner, 'SANDBOX', JSON.stringify({ customer_id: owner, customer_name: 'Amina', customer_phone: '9876543210' }), 'https://invite.example'];
    await assert.rejects(db.query(reserveSql, reserveArgs), /permission denied/i);
    await db.exec('RESET ROLE; SET ROLE service_role;');
    await assert.rejects(db.query(reserveSql, [wedding.id,stranger,...reserveArgs.slice(2)]), /Invitation not found/);
    const { rows: [payment] } = await db.query<{ id: string; cf_order_id: string; checkout_request: { order_meta: { return_url: string }; order_expiry_time: string } }>(reserveSql, reserveArgs);
    const retried = await db.query<{ id: string }>(reserveSql, reserveArgs);
    assert.equal(retried.rows[0].id, payment.id);
    assert.match(payment.checkout_request.order_meta.return_url, new RegExp(wedding.id));
    assert.ok(Date.parse(payment.checkout_request.order_expiry_time) > Date.now());
    const confirm = 'SELECT public.confirm_cashfree_payment($1,$2,$3,$4,$5,$6)';
    const args = [payment.cf_order_id, '123456', 1499, 1499, 'INR', 'SANDBOX'];
    for (const invalid of [ [payment.cf_order_id,'123456',1,1499,'INR','SANDBOX'], [payment.cf_order_id,'123456',1499,1,'INR','SANDBOX'],
      [payment.cf_order_id,'123456',1499,1499,'USD','SANDBOX'], [payment.cf_order_id,'123456',1499,1499,'INR','PRODUCTION'],
      [payment.cf_order_id,null,1499,1499,'INR','SANDBOX'] ]) {
      await assert.rejects(db.query(confirm, invalid), /mismatch/);
      assert.equal((await db.query<{ is_paid: boolean }>('SELECT is_paid FROM public.weddings WHERE id=$1', [wedding.id])).rows[0].is_paid, false);
    }
    await assert.rejects(db.query(confirm, ['unknown', ...args.slice(1)]), /Unknown payment/);
    await db.exec('RESET ROLE; SET ROLE authenticated;');
    await assert.rejects(db.query(confirm, args), /permission denied/i);
    await assert.rejects(db.query('SELECT checkout_request,cf_payment_id FROM public.payments'), /permission denied/i);
    await db.exec('RESET ROLE; SET ROLE service_role;');
    await db.query(confirm, args);
    await db.query(confirm, args); // A webhook retry is a no-op success.
    assert.equal((await db.query<{ is_paid: boolean }>('SELECT is_paid FROM public.weddings WHERE id=$1', [wedding.id])).rows[0].is_paid, true);
    assert.equal((await db.query(reserveSql, reserveArgs)).rows.length, 0);
    await assert.rejects(db.query(confirm, [payment.cf_order_id,'999999',...args.slice(2)]), /Different successful payment/);
    // A payment cannot be reused for a second invitation. Unique failure rolls back publication.
    const { rows: [second] } = await db.query<{ id: string }>('INSERT INTO public.weddings(user_id,slug,wedding_data) VALUES ($1,$2,$3) RETURNING id', [owner,'second-wedding',JSON.stringify(createEmptyWeddingData())]);
    const { rows: [secondPayment] } = await db.query<{ cf_order_id: string }>(reserveSql, [second.id,...reserveArgs.slice(1)]);
    await assert.rejects(db.query(confirm, [secondPayment.cf_order_id,...args.slice(1)]), /unique/i);
    assert.equal((await db.query<{ is_paid: boolean }>('SELECT is_paid FROM public.weddings WHERE id=$1', [second.id])).rows[0].is_paid, false);
    assert.equal((await db.query<{ status: string }>('SELECT status FROM public.payments WHERE cf_order_id=$1', [secondPayment.cf_order_id])).rows[0].status, 'PENDING');
  } finally { await db.close(); }
});
