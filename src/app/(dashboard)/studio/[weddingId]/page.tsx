import { createClient } from '@/lib/supabase/server';
import { createEmptyWeddingData } from '@/lib/wedding-defaults';
import type { WeddingData } from '@/types/wedding';
import StudioEditorClient from './StudioEditorClient';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { TEMPLATE_REGISTRY } from '@/templates';

interface PageProps {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<{ template?: string; payment?: string }>;
}

const SAMPLE_STARTER_DATA: WeddingData = {
  couple: {
    brideName: 'Priya Sharma',
    groomName: 'Rahul Verma',
    brideBio: 'Architect & chai connoisseur. Passionate about heritage spaces and old books.',
    groomBio: 'Product designer & amateur photographer. Always hunting for the perfect sunset.',
    hashtag: '#RahulKiPriya',
    weddingDate: '2026-12-14',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
  },
  story: {
    title: 'From Coffee to Forever',
    content: 'We met at a rainy café in Bengaluru over a shared playlist and an argument about filter coffee. Four years, hundreds of weekend getaways, and countless shared laughs later, we are overjoyed to begin our next chapter together.',
    milestones: [
      { year: '2022', title: 'First Encounter', description: 'Met at a cozy bookstore café on a Sunday afternoon.' },
      { year: '2024', title: 'The Proposal', description: 'Underneath the starlit skies of Udaipur overlooking Lake Pichola.' },
      { year: '2026', title: 'The Wedding', description: 'Surrounded by our dearest family and lifelong friends.' },
    ],
  },
  events: [
    {
      id: 'evt-haldi',
      eventName: 'Haldi & Phoolon Ki Holi',
      date: '2026-12-13',
      startTime: '10:00',
      endTime: '13:00',
      venueName: 'The Courtyard Gardens, Taj Falaknuma',
      venueAddress: 'Engine Bowli, Fatima Nagar, Hyderabad, Telangana',
      googleMapsUrl: 'https://maps.google.com',
      dressCode: 'Bright Yellow & Floral Ethnic',
    },
    {
      id: 'evt-sangeet',
      eventName: 'Sangeet & Musical Night',
      date: '2026-12-13',
      startTime: '18:30',
      endTime: '23:30',
      venueName: 'Grand Ballroom, Taj Falaknuma Palace',
      venueAddress: 'Engine Bowli, Fatima Nagar, Hyderabad, Telangana',
      googleMapsUrl: 'https://maps.google.com',
      dressCode: 'Glamorous Indo-Western & Shimmer',
    },
    {
      id: 'evt-muhurtham',
      eventName: 'Muhurtham & Royal Pheras',
      date: '2026-12-14',
      startTime: '09:00',
      endTime: '14:00',
      venueName: 'Palace Amphitheater, Taj Falaknuma',
      venueAddress: 'Engine Bowli, Fatima Nagar, Hyderabad, Telangana',
      googleMapsUrl: 'https://maps.google.com',
      dressCode: 'Traditional Silk Sarees & Sherwanis',
    },
  ],
  gallery: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
  ],
  theme: {
    primaryColor: '#8B0000',
    secondaryColor: '#D4AF37',
    fontFamily: 'serif',
  },
  rsvpConfig: {
    enabled: true,
    deadline: '2026-11-30',
    askDietaryPreference: true,
    whatsappNumber: '+919876543210',
  },
};

export default async function StudioPage({ params, searchParams }: PageProps) {
  const { weddingId } = await params;
  const { template, payment } = await searchParams;
  let initialData: WeddingData = SAMPLE_STARTER_DATA;
  let initialTemplateId = template && template in TEMPLATE_REGISTRY ? template : 'royal-rajwada';
  let initialSlug = 'priya-weds-rahul';
  let isPaid = false;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (weddingId && weddingId !== 'new') {
    if (!z.uuid().safeParse(weddingId).success) notFound();
    if (!user) redirect(`/login?next=/studio/${weddingId}`);

    let isAdmin =
      user.app_metadata?.role === 'admin' ||
      user.user_metadata?.role === 'admin';

    let adminClient: any = null;
    try {
      const { createAdminClient } = await import('@/lib/supabase/server');
      adminClient = await createAdminClient();
      if (!isAdmin) {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.role === 'admin') isAdmin = true;
      }
    } catch {
      // fallback
    }

    const db = isAdmin && adminClient ? adminClient : supabase;

    let weddingQuery = db.from('weddings').select('*').eq('id', weddingId);
    if (!isAdmin) {
      weddingQuery = weddingQuery.eq('user_id', user.id);
    }
    const { data: wedding } = await weddingQuery.maybeSingle();

    if (!wedding) notFound();
    if (wedding) {
      initialData = (wedding.wedding_data as WeddingData) || createEmptyWeddingData();
      initialTemplateId =
        (wedding.wedding_data as any)?.selectedTemplateId ||
        wedding.template_id ||
        'royal-rajwada';
      initialSlug = wedding.slug || '';
      isPaid = wedding.is_paid || false;
    }
  }

  return (
    <StudioEditorClient
      initialData={initialData}
      initialTemplateId={initialTemplateId}
      initialSlug={initialSlug}
      weddingId={weddingId}
      isPaid={isPaid}
      returnedFromPayment={payment === 'return'}
      userEmail={user?.email || null}
    />
  );
}
