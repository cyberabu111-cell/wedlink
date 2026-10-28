"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { createAdminClient } from "@/lib/supabase/server";
import { TEMPLATES } from "@/templates/registry";
import type { TemplateDbRow } from "@/types/database";

export interface TemplateFormInput {
  id: string;
  name: string;
  description?: string;
  category: "Traditional" | "Minimal" | "Modern" | "Floral" | "Luxury";
  price_inr: number;
  thumbnail_url: string;
  demo_slug?: string;
  is_active?: boolean;
}

export interface LocalTemplateSummary {
  id: string;
  name: string;
  category: "Traditional" | "Minimal" | "Modern" | "Floral" | "Luxury";
  thumbnailUrl: string;
}

export interface AdminTemplatesOverview {
  dbTemplates: TemplateDbRow[];
  localTemplates: LocalTemplateSummary[];
  unsyncedLocalKeys: string[];
}

/**
 * Fetch all database templates along with local registry status.
 */
export async function getAdminTemplates(): Promise<AdminTemplatesOverview> {
  await requireAdmin();
  const adminClient = await createAdminClient();

  const localTemplateSummaries: LocalTemplateSummary[] = TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    thumbnailUrl: t.thumbnailUrl,
  }));

  const { data: dbTemplates, error } = await adminClient
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn(`[admin-templates] Templates table query note: ${error.message}`);
    return {
      dbTemplates: [],
      localTemplates: localTemplateSummaries,
      unsyncedLocalKeys: TEMPLATES.map((t) => t.id),
    };
  }

  const existingIds = new Set((dbTemplates || []).map((t) => t.id));
  const unsyncedLocalKeys = TEMPLATES.filter((t) => !existingIds.has(t.id)).map((t) => t.id);

  return {
    dbTemplates: dbTemplates || [],
    localTemplates: localTemplateSummaries,
    unsyncedLocalKeys,
  };
}

/**
 * Create a new template entry in the database.
 */
export async function createTemplate(input: TemplateFormInput): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const cleanId = input.id.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(cleanId)) {
      return { success: false, error: "Template ID must be a lowercase slug (e.g. 'royal-kerala-gold')." };
    }
    if (!input.name.trim()) {
      return { success: false, error: "Template name is required." };
    }

    const adminClient = await createAdminClient();
    const { error } = await adminClient.from("templates").insert({
      id: cleanId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      category: input.category,
      price_inr: Number(input.price_inr) || 1499,
      thumbnail_url: input.thumbnail_url.trim() || `/thumbs/${cleanId}.webp`,
      demo_slug: input.demo_slug?.trim() || null,
      is_active: input.is_active ?? true,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/templates");
    revalidatePath("/studio");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create template" };
  }
}

/**
 * Update an existing template in the database.
 */
export async function updateTemplate(
  id: string,
  input: Partial<TemplateFormInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const adminClient = await createAdminClient();

    const updatePayload: Partial<TemplateDbRow> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.price_inr !== undefined) updatePayload.price_inr = Number(input.price_inr);
    if (input.thumbnail_url !== undefined) updatePayload.thumbnail_url = input.thumbnail_url.trim();
    if (input.demo_slug !== undefined) updatePayload.demo_slug = input.demo_slug?.trim() || null;
    if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

    const { error } = await adminClient.from("templates").update(updatePayload).eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/templates");
    revalidatePath("/studio");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update template" };
  }
}

/**
 * Toggle active/hidden status of a template.
 */
export async function toggleTemplateActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const adminClient = await createAdminClient();

    const { error } = await adminClient
      .from("templates")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/templates");
    revalidatePath("/studio");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to toggle template status" };
  }
}

/**
 * Delete a template record from the database.
 */
export async function deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const adminClient = await createAdminClient();

    const { error } = await adminClient.from("templates").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/templates");
    revalidatePath("/studio");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete template" };
  }
}

/**
 * One-click helper to automatically sync all local registry templates to the database.
 */
export async function syncLocalTemplatesToDatabase(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  try {
    await requireAdmin();
    const adminClient = await createAdminClient();

    const records = TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      price_inr: 1499,
      thumbnail_url: t.thumbnailUrl,
      is_active: true,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await adminClient.from("templates").upsert(records, { onConflict: "id" });

    if (error) {
      return { success: false, syncedCount: 0, error: error.message };
    }

    revalidatePath("/admin/templates");
    revalidatePath("/studio");
    return { success: true, syncedCount: records.length };
  } catch (err: any) {
    return { success: false, syncedCount: 0, error: err.message || "Failed to sync templates" };
  }
}
