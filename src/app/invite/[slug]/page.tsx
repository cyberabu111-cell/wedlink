import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TEMPLATE_REGISTRY } from '@/templates';
import { createClient } from '@/utils/supabase/server';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 1. Dynamic WhatsApp / Social OG Preview Tags
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: wedding } = await supabase
    .from('weddings')
    .select('wedding_data')
    .eq('slug', slug)
    .single();

  if (!wedding?.wedding_data) {
    return { title: 'Wedding Invitation' };
  }

  const { couple } = wedding.wedding_data;
  const bride = couple.brideName || 'Bride';
  const groom = couple.groomName || 'Groom';
  const title = `${bride} & ${groom}'s Wedding Invitation`;
  const dateText = couple.weddingDate ? ` on ${couple.weddingDate}` : '';
  const description = `Join us in celebrating our wedding${dateText}. Tap to view events, location maps, and RSVP!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: couple.coverPhotoUrl ? [{ url: couple.coverPhotoUrl, width: 1200, height: 630 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: couple.coverPhotoUrl ? [couple.coverPhotoUrl] : [],
    },
  };
}

// 2. Main Invitation Renderer
export default async function PublicInvitationPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!wedding) notFound();

  const SelectedTemplate = TEMPLATE_REGISTRY[wedding.template_id] || TEMPLATE_REGISTRY['royal-rajwada'];

  return (
    <div className={`relative min-h-screen ${!wedding.is_paid ? 'pt-10' : ''}`}>
      {/* Watermark Banner if the user hasn't paid via Cashfree yet */}
      {!wedding.is_paid && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center py-2 px-4 font-semibold text-xs md:text-sm shadow-md">
          DRAFT PREVIEW — Complete payment in your dashboard to remove this watermark &amp; activate RSVPs.
        </div>
      )}

      <SelectedTemplate
        data={wedding.wedding_data}
        weddingId={wedding.id}
        isPaid={wedding.is_paid}
      />
    </div>
  );
}
