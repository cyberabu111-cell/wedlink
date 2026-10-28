import LoginForm from './LoginForm';
import { safeAuthNext } from '@/lib/auth-redirect';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return <main className="account-page"><LoginForm next={safeAuthNext(params.next)} callbackFailed={Boolean(params.error)} /></main>;
}
