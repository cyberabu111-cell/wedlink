'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export async function signOut() {
  const client = await createClient();
  await client.auth.signOut();
  redirect('/login');
}
