'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { checkoutRequestSchema, PUBLISH_AMOUNT_INR } from '@/lib/payments/validation';
import { publishWeddingFree } from '@/app/actions/wedding';

type Props = {
  weddingId: string;
  slug: string;
  isPaid: boolean;
  dirty: boolean;
  returnedFromPayment: boolean;
  onPaid: (paid: boolean) => void;
};

type PaymentResponse = {
  paid?: boolean;
  error?: string;
  paymentSessionId?: string;
  mode?: 'production' | 'sandbox';
};

async function post(path: string, data: unknown, signal: AbortSignal): Promise<PaymentResponse> {
  const response = await fetch(`/api/cashfree/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.any([signal, AbortSignal.timeout(40_000)]),
  });
  const body = (await response.json()) as PaymentResponse;
  if (!response.ok) throw new Error(body.error || 'Could not check payment. Please try again.');
  return body;
}

export default function PublishPayButton({
  weddingId,
  slug,
  isPaid,
  dirty,
  returnedFromPayment,
  onPaid,
}: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [freeBusy, setFreeBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const active = useRef<AbortController | null>(null);

  const check = useCallback(
    async (signal: AbortSignal, attempts: number) => {
      for (let index = 0; index < attempts; index++) {
        const result = await post('status', { weddingId }, signal);
        if (result.paid) {
          onPaid(true);
          setMessage('Payment verified. Your invitation is live.');
          return true;
        }
        if (index + 1 < attempts) {
          await new Promise<void>((resolve, reject) => {
            const abort = () => {
              clearTimeout(timer);
              reject(new DOMException('Aborted', 'AbortError'));
            };
            const timer = setTimeout(() => {
              signal.removeEventListener('abort', abort);
              resolve();
            }, 3000);
            if (signal.aborted) abort();
            else signal.addEventListener('abort', abort, { once: true });
          });
        }
      }
      setMessage('Payment is not confirmed yet. If you paid, check again shortly; no second payment is needed.');
      return false;
    },
    [weddingId, onPaid]
  );

  const verify = useCallback(async () => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessage('Checking payment…');
    try {
      await check(controller.signal, 1);
    } catch (error) {
      if (!controller.signal.aborted) {
        setMessage(error instanceof Error ? error.message : 'Please try again.');
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }, [check]);

  useEffect(() => {
    if (returnedFromPayment && !isPaid && weddingId !== 'new') void verify();
    return () => {
      active.current?.abort();
      active.current = null;
    };
  }, [returnedFromPayment, isPaid, weddingId, verify]);

  async function handleFreePublish() {
    if (weddingId === 'new') return;
    setFreeBusy(true);
    setMessage('');
    try {
      const res = await publishWeddingFree(weddingId);
      if (res.success) {
        onPaid(true);
        setMessage('Your invitation website is now live for free ✨');
      } else {
        setMessage(res.error || 'Could not publish for free. Please try saving draft first.');
      }
    } catch (err: any) {
      setMessage(err?.message || 'Error publishing invitation for free.');
    } finally {
      setFreeBusy(false);
    }
  }

  async function checkout(event: FormEvent) {
    event.preventDefault();
    if (active.current || dirty || weddingId === 'new') return;
    const parsed = checkoutRequestSchema.safeParse({ weddingId, customerName: name, customerPhone: phone });
    if (!parsed.success) {
      setMessage('Enter your name and a valid 10-digit Indian mobile number.');
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessage('Preparing secure checkout…');
    try {
      const result = await post('create-order', parsed.data, controller.signal);
      if (result.paid) {
        onPaid(true);
        return;
      }
      if (!result.paymentSessionId || !result.mode) {
        throw new Error('Checkout is unavailable. Please try again.');
      }
      const { load } = await import('@cashfreepayments/cashfree-js');
      const sdk = await load({ mode: result.mode });
      if (!sdk) throw new Error('Could not load Cashfree. Check your connection and try again.');
      if (controller.signal.aborted) return;
      const outcome = await sdk.checkout({ paymentSessionId: result.paymentSessionId, redirectTarget: '_modal' });
      if (controller.signal.aborted) return;
      setMessage('Checking payment with the server…');
      const paid = await check(controller.signal, outcome.error ? 1 : 8);
      if (!paid && outcome.error) {
        setMessage('Checkout closed or payment was unsuccessful. If you were charged, use Check payment before retrying.');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setMessage(error instanceof Error ? error.message : 'Checkout could not finish. Check payment before retrying.');
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }

  function handleCopy() {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/${slug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  if (isPaid) {
    return (
      <section className="publish-panel" style={{ border: '2px solid #86efac', background: '#f0fdf4' }}>
        <strong style={{ color: '#15803d', fontSize: '16px' }}>Your invitation is live ✨</strong>
        <p style={{ margin: '6px 0 12px', fontSize: '13px', color: '#166534' }}>
          {dirty ? 'Save your changes above to update the live website.' : 'Your public link is ready to share with guests.'}
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="account-primary"
            style={{ textDecoration: 'none', background: '#16a34a' }}
          >
            Open live website ↗
          </Link>
          <button
            type="button"
            onClick={handleCopy}
            className="payment-check"
            style={{ minHeight: '44px', cursor: 'pointer' }}
          >
            {copied ? '✓ Link copied!' : 'Copy share link'}
          </button>
        </div>
        {message && <p role="status" style={{ marginTop: '8px', color: '#15803d', fontSize: '12px' }}>{message}</p>}
      </section>
    );
  }

  return (
    <details className="publish-panel" open={returnedFromPayment || undefined}>
      <summary>Publish your invitation · Free / Paid</summary>
      <p>Make your wedding invitation website live and accessible at a public link.</p>

      {weddingId === 'new' ? (
        <p style={{ padding: '8px', background: '#fef3c7', borderRadius: '8px', color: '#92400e', fontSize: '13px' }}>
          💡 Click <strong>Save Draft</strong> above first to save your invitation and unlock publishing.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '14px', marginTop: '12px' }}>
          {/* PRIMARY OPTION: FREE PUBLISH (NO PAYMENT REQUIRED) */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              display: 'grid',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>✨ Free Publish</strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Launch your wedding website instantly without payment.
                </p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#dcfce7',
                  color: '#166534',
                }}
              >
                100% Free
              </span>
            </div>

            <button
              type="button"
              disabled={busy || freeBusy || dirty}
              onClick={handleFreePublish}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#16a34a',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: busy || freeBusy || dirty ? 'not-allowed' : 'pointer',
                opacity: busy || freeBusy || dirty ? 0.6 : 1,
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
              }}
            >
              {freeBusy ? 'Publishing…' : 'Publish for Free (Instant Launch)'}
            </button>
            {dirty && (
              <p style={{ fontSize: '12px', color: '#b45309', margin: 0 }}>
                Save your latest changes above before publishing.
              </p>
            )}
          </div>

          {/* SECONDARY OPTION: OPTIONAL CASHFREE GATEWAY */}
          <details style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
              Optional: Pay via Cashfree Gateway (₹{PUBLISH_AMOUNT_INR.toLocaleString('en-IN')})
            </summary>
            <form onSubmit={checkout} style={{ marginTop: '12px' }}>
              <label htmlFor="checkout-name">Your name</label>
              <input
                id="checkout-name"
                required
                autoComplete="name"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
              />
              <label htmlFor="checkout-phone">Indian mobile number</label>
              <input
                id="checkout-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="9876543210"
                required
                maxLength={13}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={busy}
              />
              <button
                className="account-primary"
                style={{ marginTop: '10px' }}
                disabled={busy || dirty}
              >
                {busy ? 'Checking payment…' : `Pay ₹${PUBLISH_AMOUNT_INR.toLocaleString('en-IN')} & publish`}
              </button>
            </form>
            <button
              type="button"
              onClick={() => void verify()}
              disabled={busy}
              className="payment-check"
              style={{ marginTop: '8px' }}
            >
              Already paid? Check payment
            </button>
          </details>
        </div>
      )}

      {message && (
        <p role="status" aria-live="polite" style={{ marginTop: '10px', fontSize: '13px', color: message.includes('live') || message.includes('verified') ? '#15803d' : '#b91c1c' }}>
          {message}
        </p>
      )}
    </details>
  );
}
