"use server";
import { createClient } from '@/lib/supabase/server';
import { weddingDataSchema } from '@/lib/validation/wedding';
import { publishableWeddingSchema } from '@/lib/payments/validation';
import type { WeddingData } from '@/types/wedding';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const reserved = new Set([
  'api', 'studio', 'rsvps', 'login', 'signup', 'auth', 'dashboard',
  'pricing', 'templates', 'admin', 'account', 'settings', 'preview',
  'invite', 'privacy', 'terms', 'support', 'favicon', 'robots', 'sitemap'
]);

const inputSchema = z.object({
  weddingId: z.union([z.literal('new'), z.uuid()]),
  slug: z.string().max(200).optional(),
  templateId: z.string().min(1),
  weddingData: weddingDataSchema,
}).strict();

export async function saveWeddingDraft(input: {
  weddingId: string;
  slug?: string;
  templateId: string;
  weddingData: WeddingData;
}) {
  try {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
    const { weddingId, weddingData, templateId } = parsed.data;

    let slug = (parsed.data.slug || `${weddingData.couple.brideName}-weds-${weddingData.couple.groomName}`)
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').slice(0, 80).replace(/^-+|-+$/g, '');
    if (slug.length < 3) slug = `wedding-${slug || 'invite'}`;
    if (reserved.has(slug)) slug += '-celebration';

    const client = await createClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return { success: false, error: 'Sign in before saving your invitation.' };

    const { createAdminClient } = await import('@/lib/supabase/server');
    let adminClient: any = null;
    try {
      adminClient = await createAdminClient();
    } catch {
      // ignore if service key is unavailable in some local test environments
    }

    // Check if user is an admin
    let isAdmin =
      user.app_metadata?.role === 'admin' ||
      user.user_metadata?.role === 'admin';

    if (!isAdmin && adminClient) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.role === 'admin') isAdmin = true;
    }

    const db = isAdmin && adminClient ? adminClient : client;

    let previousSlug: string | undefined;
    let existingOwnerId = user.id;

    if (weddingId !== 'new') {
      let existingQuery = db.from('weddings').select('slug,is_paid,user_id').eq('id', weddingId);
      if (!isAdmin) {
        existingQuery = existingQuery.eq('user_id', user.id);
      }
      const { data: existing, error: existingErr } = await existingQuery.maybeSingle();
      if (existingErr || !existing) return { success: false, error: 'Invitation not found in your account.' };
      previousSlug = existing.slug;
      existingOwnerId = existing.user_id;
    }

    // Embed the exact selectedTemplateId inside weddingData for 100% template fidelity
    const enrichedWeddingData = {
      ...weddingData,
      selectedTemplateId: templateId,
    };

    // Primary save values
    const primaryValues: any = {
      user_id: existingOwnerId,
      slug,
      template_id: templateId,
      wedding_data: enrichedWeddingData,
      updated_at: new Date().toISOString(),
    };

    let query = weddingId === 'new'
      ? db.from('weddings').insert(primaryValues)
      : (isAdmin && adminClient)
      ? db.from('weddings').update(primaryValues).eq('id', weddingId)
      : db.from('weddings').update(primaryValues).eq('id', weddingId).eq('user_id', user.id);

    let { data, error } = await query.select('id,slug').single();

    // If PostgreSQL throws a CHECK constraint violation on template_id (23514),
    // gracefully fall back to 'royal-rajwada' for the column while keeping selectedTemplateId inside wedding_data!
    if (error && error.code === '23514' && error.message?.includes('wedding_template_valid')) {
      console.warn(`[saveWeddingDraft] Database has legacy template constraint. Saving with fallback column and enriched wedding_data.`);
      const fallbackValues = {
        ...primaryValues,
        template_id: 'royal-rajwada',
      };
      const retryQuery = weddingId === 'new'
        ? db.from('weddings').insert(fallbackValues)
        : (isAdmin && adminClient)
        ? db.from('weddings').update(fallbackValues).eq('id', weddingId)
        : db.from('weddings').update(fallbackValues).eq('id', weddingId).eq('user_id', user.id);

      const retryRes = await retryQuery.select('id,slug').single();
      data = retryRes.data;
      error = retryRes.error;
    }

    if (error) {
      console.error('[saveWeddingDraft] Supabase error:', error);
      return {
        success: false,
        error: error.code === '23505'
          ? 'That link is taken. Choose another invitation link.'
          : (error.message || 'Could not save your invitation. Please try again.')
      };
    }

    for (const value of new Set([slug, previousSlug].filter(Boolean))) {
      revalidatePath(`/${value}`);
      revalidatePath(`/invite/${value}`);
    }
    revalidatePath('/studio');
    if (data?.id) revalidatePath(`/studio/${data.id}`);
    revalidatePath('/admin/weddings');

    return { success: true, weddingId: data.id, slug: data.slug };
  } catch (err: any) {
    console.error('[saveWeddingDraft] Unexpected error:', err);
    return { success: false, error: err?.message || 'Saving is unavailable. Check your connection.' };
  }
}

/**
 * Free Publish: Publish a wedding invitation website immediately without requiring Cashfree payment.
 */
export async function publishWeddingFree(
  weddingId: string
): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    const client = await createClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Please sign in to publish your invitation.' };
    }

    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminClient = await createAdminClient();

    const { data: existing, error: fetchError } = await adminClient
      .from('weddings')
      .select('id, user_id, slug, is_paid, wedding_data')
      .eq('id', weddingId)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: 'Invitation not found.' };
    }

    const isAdmin =
      user.app_metadata?.role === 'admin' ||
      user.user_metadata?.role === 'admin';

    // Must be the owner of the invitation or a super admin
    if (existing.user_id !== user.id && !isAdmin) {
      return { success: false, error: 'You do not have permission to publish this invitation.' };
    }

    const { error: updateError } = await adminClient
      .from('weddings')
      .update({
        is_paid: true,
        published_by_admin: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', weddingId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/${existing.slug}`);
    revalidatePath(`/invite/${existing.slug}`);
    revalidatePath('/studio');
    revalidatePath(`/studio/${existing.id}`);
    revalidatePath('/admin/weddings');

    return { success: true, slug: existing.slug };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Could not publish invitation.' };
  }
}
