import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getTemplateComponent, isRegisteredTemplate } from '@/templates/registry';
import { createAdminClient } from '@/lib/supabase/server';
import { weddingDataSchema } from '@/lib/validation/wedding';

export const dynamic = 'force-dynamic';
interface PageProps { params: Promise<{ slug: string }> }
const publishedWedding = cache(async (slug: string) => {
  if (!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(slug)) return null;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = await createAdminClient();
  const { data, error } = await admin.from('weddings').select('id,slug,template_id,wedding_data')
    .eq('slug', slug).eq('is_paid', true).maybeSingle();
  if (error) throw new Error('Unable to load invitation');
  if (!data || !weddingDataSchema.safeParse(data.wedding_data).success) return null;
  return data;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const wedding = await publishedWedding((await params).slug);
  if (!wedding) return { title: 'Invitation unavailable', robots: { index: false, follow: false } };
  const { couple } = wedding.wedding_data;
  const title = `${couple.brideName} & ${couple.groomName}'s Wedding Invitation`;
  const description = `Join us in celebrating our wedding on ${couple.weddingDate}. View our events and venue details.`;
  const images = couple.coverPhotoUrl ? [couple.coverPhotoUrl] : [];
  return { title, description, openGraph: { title, description, images, type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images } };
}

export default async function PublicInvitationPage({ params }: PageProps) {
  const wedding = await publishedWedding((await params).slug);
  if (!wedding) notFound();
  if (!isRegisteredTemplate(wedding.template_id)) notFound();
  const Template = getTemplateComponent(wedding.template_id);
  return <Template data={wedding.wedding_data} weddingId={wedding.id} isPaid isPreview={false} />;
}
