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
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In fields
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up fields
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [message, setMessage] = useState(
    callbackFailed ? 'Authentication link or session could not be verified. Please sign in.' : ''
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
      setMessage('Google sign-in is not configured yet. You can sign in using your credentials.');
      setGoogleBusy(false);
    }
  }

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const client = createClient();
      const resolvedEmail = resolveEmail(signInIdentifier);

      let { data, error } = await client.auth.signInWithPassword({
        email: resolvedEmail,
        password: signInPassword,
      });

      // Secondary fallback for admin aliases
      if (error && (signInIdentifier.trim() === 'admin' || signInIdentifier.trim() === 'admin@124')) {
        const fallback = await client.auth.signInWithPassword({
          email: 'admin@124.com',
          password: signInPassword,
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

  async function handleSignUp(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const cleanEmail = signUpEmail.trim();
    if (!cleanEmail || !signUpPassword) {
      setMessage('Email and password are required.');
      setBusy(false);
      return;
    }

    if (signUpPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setBusy(false);
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setMessage('Passwords do not match.');
      setBusy(false);
      return;
    }

    try {
      const client = createClient();
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password: signUpPassword,
        options: {
          data: {
            full_name: signUpFullName.trim() || undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setMessage(error.message || 'Could not create account. Please try again.');
        return;
      }

      // If Supabase immediately returns a session (auto-confirm enabled):
      if (data?.session) {
        const target = safeAuthNext(next) || '/studio/new';
        window.location.href = target;
        return;
      }

      // If email confirmation is required:
      if (data?.user && !data.user.confirmed_at) {
        setMessage('Account created! Check your email to confirm your account, then sign in.');
        setMode('signin');
        setSignInIdentifier(cleanEmail);
        return;
      }

      setMessage('Account created successfully! Please sign in.');
      setMode('signin');
      setSignInIdentifier(cleanEmail);
    } catch (err: any) {
      setMessage(err?.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-card">
      <Link href="/" className="studio-brand">✳ everafter.</Link>
      <h1>{mode === 'signin' ? 'Welcome back.' : 'Create an account.'}</h1>
      <p>
        {mode === 'signin'
          ? 'Sign in to edit and manage your wedding invitations.'
          : 'Sign up to design, customize, and publish your wedding invitations.'}
      </p>

      {/* Google OAuth Button */}
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
        <span>or with credentials</span>
      </div>

      {/* Mode Switcher Tabs: Sign In / Sign Up */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => { setMode('signin'); setMessage(''); }}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            border: mode === 'signin' ? '1px solid #523d50' : '1px solid #e7dfe4',
            background: mode === 'signin' ? '#523d50' : '#ffffff',
            color: mode === 'signin' ? '#ffffff' : '#523d50',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setMessage(''); }}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            border: mode === 'signup' ? '1px solid #523d50' : '1px solid #e7dfe4',
            background: mode === 'signup' ? '#523d50' : '#ffffff',
            color: mode === 'signup' ? '#ffffff' : '#523d50',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Sign Up
        </button>
      </div>

      {/* SIGN IN FORM */}
      {mode === 'signin' ? (
        <form onSubmit={handleSignIn}>
          <label htmlFor="signin-identifier">Username or Email</label>
          <input
            id="signin-identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="admin@124 or you@example.com"
            value={signInIdentifier}
            onChange={(e) => setSignInIdentifier(e.target.value)}
          />

          <label htmlFor="signin-password">Password</label>
          <input
            id="signin-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={signInPassword}
            onChange={(e) => setSignInPassword(e.target.value)}
          />

          <button disabled={busy || googleBusy} className="account-primary">
            {busy ? 'Signing in…' : 'Sign In'}
          </button>

          <p style={{ fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => { setMode('signup'); setMessage(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#523d50',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Sign up
            </button>
          </p>
        </form>
      ) : (
        /* SIGN UP FORM */
        <form onSubmit={handleSignUp}>
          <label htmlFor="signup-name">Full Name (optional)</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Priya Sharma"
            value={signUpFullName}
            onChange={(e) => setSignUpFullName(e.target.value)}
          />

          <label htmlFor="signup-email">Email address</label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={signUpEmail}
            onChange={(e) => setSignUpEmail(e.target.value)}
          />

          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Minimum 6 characters"
            value={signUpPassword}
            onChange={(e) => setSignUpPassword(e.target.value)}
          />

          <label htmlFor="signup-confirm-password">Confirm Password</label>
          <input
            id="signup-confirm-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={signUpConfirmPassword}
            onChange={(e) => setSignUpConfirmPassword(e.target.value)}
          />

          <button disabled={busy || googleBusy} className="account-primary">
            {busy ? 'Creating account…' : 'Create Account'}
          </button>

          <p style={{ fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { setMode('signin'); setMessage(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#523d50',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Sign in
            </button>
          </p>
        </form>
      )}

      {message && (
        <p
          role="status"
          style={{
            marginTop: '12px',
            fontSize: '13px',
            color:
              message.includes('failed') ||
              message.includes('Invalid') ||
              message.includes('not match') ||
              message.includes('required') ||
              message.includes('Could not')
                ? '#b91c1c'
                : '#047857',
          }}
        >
          {message}
        </p>
      )}

      <div style={{ textAlign: 'center', marginTop: '14px' }}>
        <Link href="/studio/new" style={{ fontSize: '13px' }}>
          Explore the invitation editor first →
        </Link>
      </div>
    </section>
  );
}
