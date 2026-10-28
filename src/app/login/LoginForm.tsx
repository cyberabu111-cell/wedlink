'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm({ next, callbackFailed }: { next: string; callbackFailed: boolean }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(callbackFailed ? 'This sign-in link expired or could not be verified. Request a new one.' : '');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const client = createClient();
      const { error } = await client.auth.signInWithOtp({ email: email.trim(), options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      } });
      if (error) { setMessage('Could not send a sign-in link. Check your email address and try again shortly.'); return; }
      setMessage('Check your email for a sign-in link. Open it in this browser to continue.');
    } catch { setMessage('Sign-in is not configured yet. You can still explore the invitation editor.'); }
    finally { setBusy(false); }
  }
  return <section className="account-card"><Link href="/" className="studio-brand">✳ everafter.</Link>
    <h1>Your celebrations, in one place.</h1><p>Sign in or create an account with a secure email link.</p>
    <form onSubmit={submit}><label htmlFor="account-email">Email address</label>
      <input id="account-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
      <button disabled={busy} className="account-primary">{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
    </form><p role="status">{message}</p><Link href="/studio/new">Explore the editor first →</Link>
  </section>;
}
