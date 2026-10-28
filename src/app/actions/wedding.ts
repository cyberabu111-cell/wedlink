"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { weddingDataSchema } from "@/lib/validation/wedding";
import type { WeddingData } from "@/types/wedding";
import { revalidatePath } from "next/cache";

const RESERVED_SLUGS = new Set([
  'api', 'studio', 'rsvps', 'login', 'signup', 'auth', 'dashboard',
  'pricing', 'templates', 'admin', 'account', 'settings', 'preview', 'invite',
  'privacy', 'terms', 'support', 'favicon', 'robots', 'sitemap'
]);

function sanitizeSlug(raw: string): string {
  const cleaned = raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (cleaned.length < 3) return `wedding-${cleaned || 'invite'}`;
  return cleaned.slice(0, 80);
}

export async function saveWeddingDraft({
  weddingId,
  slug: rawSlug,
  templateId,
  weddingData,
}: {
  weddingId: string;
  slug?: string;
  templateId: string;
  weddingData: WeddingData;
}) {
  try {
    // 1. Validate payload against WeddingData schema
    const validation = weddingDataSchema.safeParse(weddingData);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return { success: false, error: `Invalid data format: ${errorMsg}` };
    }

    // 2. Format and validate slug
    let slug = sanitizeSlug(rawSlug || `${weddingData.couple.brideName}-weds-${weddingData.couple.groomName}`);
    if (slug.length < 3) slug = `wedding-${Date.now().toString(36)}`;
    if (RESERVED_SLUGS.has(slug)) slug = `${slug}-celebration`;

    const validTemplate = ['royal-rajwada', 'minimal-sage', 'boho-floral', 'nikah-emerald'].includes(templateId)
      ? (templateId as 'royal-rajwada' | 'minimal-sage' | 'boho-floral' | 'nikah-emerald')
      : 'royal-rajwada';

    const supabase = await createClient();
    const admin = await createAdminClient();

    // 3. Resolve user
    const { data: { user } } = await supabase.auth.getUser();
    let userId = user?.id;

    if (!userId) {
      // For development studio without active auth session, resolve or create a dev user
      const devEmail = 'dev-studio@weddingsaas.local';
      const { data: usersData } = await admin.auth.admin.listUsers();
      const existingDev = usersData?.users?.find((u) => u.email === devEmail);

      if (existingDev) {
        userId = existingDev.id;
      } else {
        const { data: newDev, error: createDevErr } = await admin.auth.admin.createUser({
          email: devEmail,
          password: 'dev-studio-password-123!',
          email_confirm: true,
        });
        if (createDevErr || !newDev.user) {
          return { success: false, error: createDevErr?.message || 'Failed to initialize dev user' };
        }
        userId = newDev.user.id;
      }
    }

    // 4. Update or Insert
    if (weddingId && weddingId !== 'new') {
      const { data, error } = await admin
        .from('weddings')
        .update({
          slug,
          template_id: validTemplate,
          wedding_data: validation.data,
        })
        .eq('id', weddingId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      revalidatePath(`/invite/${slug}`);
      revalidatePath(`/${slug}`);
      revalidatePath(`/studio/${weddingId}`);

      return { success: true, weddingId: data.id, slug: data.slug };
    } else {
      // Check if slug is already taken
      const { data: existingSlug } = await admin
        .from('weddings')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existingSlug) {
        slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const { data, error } = await admin
        .from('weddings')
        .insert({
          user_id: userId,
          slug,
          template_id: validTemplate,
          wedding_data: validation.data,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      revalidatePath(`/invite/${slug}`);
      revalidatePath(`/${slug}`);

      return { success: true, weddingId: data.id, slug: data.slug };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return { success: false, error: message };
  }
}
