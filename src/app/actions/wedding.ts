"use server";
import { createClient } from '@/lib/supabase/server';
import { weddingDataSchema } from '@/lib/validation/wedding';
import { publishableWeddingSchema } from '@/lib/payments/validation';
import type { WeddingData } from '@/types/wedding';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const reserved = new Set(['api','studio','rsvps','login','signup','auth','dashboard','pricing','templates','admin','account','settings','preview','invite','privacy','terms','support','favicon','robots','sitemap']);
const inputSchema = z.object({
  weddingId: z.union([z.literal('new'), z.uuid()]), slug: z.string().max(200).optional(),
  templateId: z.enum(['royal-rajwada','minimal-sage','boho-floral','nikah-emerald','bento-clay']), weddingData: weddingDataSchema,
}).strict();

export async function saveWeddingDraft(input: { weddingId: string; slug?: string; templateId: string; weddingData: WeddingData }) {
  try {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
    const { weddingId, weddingData, templateId } = parsed.data;
    let slug = (parsed.data.slug || `${weddingData.couple.brideName}-weds-${weddingData.couple.groomName}`)
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').slice(0,80).replace(/^-+|-+$/g, '');
    if (slug.length < 3) slug = `wedding-${slug || 'invite'}`;
    if (reserved.has(slug)) slug += '-celebration';
    const client = await createClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return { success: false, error: 'Sign in before saving your invitation.' };
    let previousSlug: string | undefined;
    if (weddingId !== 'new') {
      const { data: existing, error } = await client.from('weddings').select('slug,is_paid').eq('id', weddingId).eq('user_id', user.id).maybeSingle();
      if (error || !existing) return { success: false, error: 'Invitation not found in your account.' };
      previousSlug = existing.slug;
      if (existing.is_paid) {
        const ready = publishableWeddingSchema.safeParse(weddingData);
        if (!ready.success) return { success: false, error: ready.error.issues[0].message };
      }
    }
    const values = { slug, template_id: templateId, wedding_data: weddingData };
    const query = weddingId === 'new' ? client.from('weddings').insert(values)
      : client.from('weddings').update(values).eq('id', weddingId).eq('user_id', user.id);
    const { data, error } = await query.select('id,slug').single();
    if (error) return { success: false, error: error.code === '23505' ? 'That link is taken. Choose another invitation link.' : 'Could not save your invitation. Please try again.' };
    for (const value of new Set([slug, previousSlug].filter(Boolean))) {
      revalidatePath(`/${value}`); revalidatePath(`/invite/${value}`);
    }
    revalidatePath('/studio');
    return { success: true, weddingId: data.id, slug: data.slug };
  } catch { return { success: false, error: 'Saving is unavailable. Check your connection and account configuration.' }; }
}
