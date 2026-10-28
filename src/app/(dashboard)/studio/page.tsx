import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export default async function StudioIndexPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect('/login');
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login');
  const { data: weddings, error } = await client.from('weddings').select('id,slug,is_paid,wedding_data')
    .eq('user_id', user.id).order('created_at', { ascending: false });
  return <main className="account-page"><section className="account-card account-wide">
    <Link href="/" className="studio-brand">✳ everafter.</Link><h1>Your invitations</h1>
    <div className="account-actions"><Link className="account-primary" href="/studio/new">Create an invitation</Link><form action={signOut}><button>Sign out</button></form></div>
    {error ? <p role="alert">Could not load your invitations. Please refresh to try again.</p> : !weddings?.length ? <p>Your first celebration starts here.</p> :
      <ul className="invitation-list">{weddings.map(wedding => <li key={wedding.id}>
        <div><strong>{wedding.wedding_data.couple.brideName} &amp; {wedding.wedding_data.couple.groomName}</strong><p>{wedding.is_paid ? 'Published' : 'Draft · only you can see it'}</p></div>
        <Link href={`/studio/${wedding.id}`}>Edit →</Link>{wedding.is_paid && <Link href={`/${wedding.slug}`}>View invitation ↗</Link>}
      </li>)}</ul>}
  </section></main>;
}
