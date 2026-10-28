'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { checkoutRequestSchema, PUBLISH_AMOUNT_INR } from '@/lib/payments/validation';

type Props = { weddingId: string; slug: string; isPaid: boolean; dirty: boolean; returnedFromPayment: boolean; onPaid: (paid: boolean) => void };
type PaymentResponse = { paid?: boolean; error?: string; paymentSessionId?: string; mode?: 'production' | 'sandbox' };
async function post(path: string, data: unknown, signal: AbortSignal): Promise<PaymentResponse> {
  const response = await fetch(`/api/cashfree/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data), signal: AbortSignal.any([signal, AbortSignal.timeout(40_000)]) });
  const body = await response.json() as PaymentResponse;
  if (!response.ok) throw new Error(body.error || 'Could not check payment. Please try again.');
  return body;
}
export default function PublishPayButton({ weddingId, slug, isPaid, dirty, returnedFromPayment, onPaid }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const active = useRef<AbortController | null>(null);
  const check = useCallback(async (signal: AbortSignal, attempts: number) => {
    for (let index = 0; index < attempts; index++) {
      const result = await post('status', { weddingId }, signal);
      if (result.paid) { onPaid(true); setMessage('Payment verified. Your invitation is live.'); return true; }
      if (index + 1 < attempts) await new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 3000);
        if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
      });
    }
    setMessage('Payment is not confirmed yet. If you paid, check again shortly; no second payment is needed.');
    return false;
  }, [weddingId, onPaid]);
  const verify = useCallback(async () => {
    if (active.current) return;
    const controller = new AbortController(); active.current = controller; setBusy(true); setMessage('Checking payment…');
    try { await check(controller.signal, 1); }
    catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  }, [check]);
  useEffect(() => {
    if (returnedFromPayment && !isPaid && weddingId !== 'new') void verify();
    return () => { active.current?.abort(); active.current = null; };
  }, [returnedFromPayment, isPaid, weddingId, verify]);

  async function checkout(event: FormEvent) {
    event.preventDefault();
    if (active.current || dirty || weddingId === 'new') return;
    const parsed = checkoutRequestSchema.safeParse({ weddingId, customerName: name, customerPhone: phone });
    if (!parsed.success) { setMessage('Enter your name and a valid 10-digit Indian mobile number.'); return; }
    const controller = new AbortController(); active.current = controller; setBusy(true); setMessage('Preparing secure checkout…');
    try {
      const result = await post('create-order', parsed.data, controller.signal);
      if (result.paid) { onPaid(true); return; }
      if (!result.paymentSessionId || !result.mode) throw new Error('Checkout is unavailable. Please try again.');
      const { load } = await import('@cashfreepayments/cashfree-js');
      const sdk = await load({ mode: result.mode });
      if (!sdk) throw new Error('Could not load Cashfree. Check your connection and try again.');
      if (controller.signal.aborted) return;
      const outcome = await sdk.checkout({ paymentSessionId: result.paymentSessionId, redirectTarget: '_modal' });
      if (controller.signal.aborted) return;
      setMessage('Checking payment with the server…');
      const paid = await check(controller.signal, outcome.error ? 1 : 8);
      if (!paid && outcome.error) setMessage('Checkout closed or payment was unsuccessful. If you were charged, use Check payment before retrying.');
    } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Checkout could not finish. Check payment before retrying.'); }
    finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  }

  if (isPaid) return <section className="publish-panel"><strong>Your invitation is live ✨</strong><p>{dirty ? 'Save your changes to update the live invitation.' : 'Your clean link is ready to share.'}</p><Link href={`/${slug}`} target="_blank" rel="noopener noreferrer">Open invitation ↗</Link></section>;
  return <details className="publish-panel" open={returnedFromPayment || undefined}>
    <summary>Publish your invitation · ₹{PUBLISH_AMOUNT_INR.toLocaleString('en-IN')}</summary>
    <p>One payment. A clean, shareable link for this invitation, with any design.</p>
    {weddingId === 'new' ? <p>Click <strong>Save Draft</strong> above to save your invitation and unlock payment.</p> :
      <><form onSubmit={checkout}><label htmlFor="checkout-name">Your name</label>
        <input id="checkout-name" required autoComplete="name" maxLength={100} value={name} onChange={e => setName(e.target.value)} disabled={busy} />
        <label htmlFor="checkout-phone">Indian mobile number</label><input id="checkout-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="9876543210" required maxLength={13} value={phone} onChange={e => setPhone(e.target.value)} disabled={busy} />
        {dirty && <p>Save your latest changes before publishing.</p>}
        <button className="account-primary" disabled={busy || dirty}>{busy ? 'Checking payment…' : `Pay ₹${PUBLISH_AMOUNT_INR.toLocaleString('en-IN')} & publish`}</button>
      </form><button type="button" onClick={() => void verify()} disabled={busy} className="payment-check">Already paid? Check payment</button></>}
    <p role="status" aria-live="polite">{message}</p>
  </details>;
}
