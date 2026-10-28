'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { safeAuthNext } from '@/lib/auth-redirect';

export default function LoginForm({
  next,
  callbackFailed,
}: {
  next: string;
  callbackFailed: boolean;
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [message, setMessage] = useState(
    callbackFailed ? 'This sign-in link expired or could not be verified. Request a new one.' : ''
  );

  function resolveEmail(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed === 'admin' || trimmed === 'admin@124') {
      return 'admin@wedlink.com';
    }
    if (trimmed.includes('@') && !trimmed.includes('.')) {
      return `${trimmed}.com`;
    }
    if (!trimmed.includes('@')) {
      return `${trimmed}@wedlink.com`;
    }
    return trimmed;
  }

  async function signInWithGoogle() {
    setGoogleBusy(true);
    setMessage('');
    try {
      const client = createClient();
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        setMessage('Could not connect with Google. Please try again or use email sign-in.');
        setGoogleBusy(false);
      }
    } catch {
      setMessage('Google sign-in is not configured yet. You can sign in using your email.');
      setGoogleBusy(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const client = createClient();
      const resolvedEmail = resolveEmail(identifier);

      let { data, error } = await client.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      // Secondary fallback for admin aliases
      if (error && (identifier.trim() === 'admin' || identifier.trim() === 'admin@124')) {
        const fallback = await client.auth.signInWithPassword({
          email: 'admin@124.com',
          password,
        });
        if (!fallback.error) {
          data = fallback.data;
          error = null;
        }
      }

      if (error) {
        setMessage(error.message || 'Invalid username or password.');
        return;
      }

      if (data?.user) {
        const isAdmin =
          data.user.app_metadata?.role === 'admin' ||
          data.user.user_metadata?.role === 'admin';

        const destination =
          next && next !== '/studio'
            ? safeAuthNext(next)
            : isAdmin
            ? '/admin/templates'
            : '/studio';

        window.location.href = destination;
      }
    } catch (err: any) {
      setMessage(err?.message || 'Sign-in failed. Please verify credentials.');
    } finally {
      setBusy(false);
    }
  }

  async function handleOtpSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const client = createClient();
      const resolvedEmail = resolveEmail(identifier);
      const { error } = await client.auth.signInWithOtp({
        email: resolvedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setMessage('Could not send a sign-in link. Check your email address and try again shortly.');
        return;
      }
      setMessage('Check your email for a sign-in link. Open it in this browser to continue.');
    } catch {
      setMessage('Sign-in is not configured yet. You can still explore the invitation editor.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-card">
      <Link href="/" className="studio-brand">✳ everafter.</Link>
      <h1>Your celebrations, in one place.</h1>
      <p>Sign in or create an account to manage your wedding invitations.</p>

      {/* Google Sign In Button */}
      <button
        type="button"
        disabled={busy || googleBusy}
        onClick={signInWithGoogle}
        className="account-google-btn"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>{googleBusy ? 'Connecting to Google…' : 'Continue with Google'}</span>
      </button>

      <div className="account-divider">
        <span>or sign in with credentials</span>
      </div>

      {/* Sign-in Method Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => { setAuthMode('password'); setMessage(''); }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            border: authMode === 'password' ? '1px solid #523d50' : '1px solid #e7dfe4',
            background: authMode === 'password' ? '#523d50' : '#ffffff',
            color: authMode === 'password' ? '#ffffff' : '#523d50',
            cursor: 'pointer',
          }}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => { setAuthMode('otp'); setMessage(''); }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            border: authMode === 'otp' ? '1px solid #523d50' : '1px solid #e7dfe4',
            background: authMode === 'otp' ? '#523d50' : '#ffffff',
            color: authMode === 'otp' ? '#ffffff' : '#523d50',
            cursor: 'pointer',
          }}
        >
          Magic Link
        </button>
      </div>

      {authMode === 'password' ? (
        <form onSubmit={handlePasswordSubmit}>
          <label htmlFor="account-identifier">Username or Email</label>
          <input
            id="account-identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="admin@wedlink.com or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <label htmlFor="account-password">Password</label>
          <input
            id="account-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button disabled={busy || googleBusy} className="account-primary">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit}>
          <label htmlFor="account-email">Email address</label>
          <input
            id="account-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <button disabled={busy || googleBusy} className="account-primary">
            {busy ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>
      )}

      {message && <p role="status" style={{ marginTop: '10px', color: message.includes('failed') || message.includes('Invalid') || message.includes('expired') ? '#b91c1c' : '#047857' }}>{message}</p>}
      <Link href="/studio/new" style={{ marginTop: '14px', display: 'inline-block' }}>Explore the editor first →</Link>
    </section>
  );
}
