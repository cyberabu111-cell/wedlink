import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeAuthNext } from '@/lib/auth-redirect';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    const client = await createClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const targetOrigin = !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : url.origin;
      return NextResponse.redirect(new URL(safeAuthNext(url.searchParams.get('next')), targetOrigin));
    }
  }
  return NextResponse.redirect(new URL('/login?error=callback', url.origin));
}
