"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { createAdminClient } from "@/lib/supabase/server";

export interface AdminWeddingItem {
  id: string;
  userId: string;
  userEmail: string;
  slug: string;
  templateId: string;
  planTier: "basic" | "premium";
  isPaid: boolean;
  publishedByAdmin: boolean;
  viewsCount: number;
  brideName: string;
  groomName: string;
  weddingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWeddingsOverview {
  weddings: AdminWeddingItem[];
  totalCount: number;
  liveCount: number;
  adminBypassCount: number;
  totalViews: number;
}

/**
 * Fetch all weddings across all users for Super Admin management.
 */
export async function getAdminWeddings(): Promise<AdminWeddingsOverview> {
  await requireAdmin();
  const adminClient = await createAdminClient();

  // 1. Fetch all weddings
  const { data: weddings, error: weddingsError } = await adminClient
    .from("weddings")
    .select("id, user_id, slug, template_id, plan_tier, is_paid, published_by_admin, views_count, wedding_data, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (weddingsError) {
    console.error("[admin-weddings] Failed to query weddings:", weddingsError.message);
    throw new Error(`Failed to load weddings: ${weddingsError.message}`);
  }

  // 2. Fetch all user emails from Supabase Auth admin API
  let userMap: Record<string, string> = {};
  try {
    const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersData?.users) {
      usersData.users.forEach((u) => {
        if (u.id && u.email) userMap[u.id] = u.email;
      });
    }
  } catch (err: any) {
    console.warn("[admin-weddings] Could not map user emails:", err?.message);
  }

  const items: AdminWeddingItem[] = (weddings || []).map((w: any) => {
    const couple = w.wedding_data?.couple || {};
    return {
      id: w.id,
      userId: w.user_id,
      userEmail: userMap[w.user_id] || "User " + w.user_id.slice(0, 8),
      slug: w.slug,
      templateId: w.wedding_data?.selectedTemplateId || w.template_id,
      planTier: w.plan_tier || "basic",
      isPaid: Boolean(w.is_paid),
      publishedByAdmin: Boolean(w.published_by_admin),
      viewsCount: Number(w.views_count) || 0,
      brideName: couple.brideName || "Bride",
      groomName: couple.groomName || "Groom",
      weddingDate: couple.weddingDate || "",
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    };
  });

  const totalCount = items.length;
  const liveCount = items.filter((i) => i.isPaid).length;
  const adminBypassCount = items.filter((i) => i.publishedByAdmin).length;
  const totalViews = items.reduce((sum, i) => sum + i.viewsCount, 0);

  return {
    weddings: items,
    totalCount,
    liveCount,
    adminBypassCount,
    totalViews,
  };
}

/**
 * Super Admin Free Bypass: Toggle payment and public publish state without Cashfree payment.
 */
export async function adminTogglePublishWedding(
  weddingId: string,
  shouldPublish: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const adminClient = await createAdminClient();

    // 1. Fetch current wedding to get slug
    const { data: wedding, error: fetchErr } = await adminClient
      .from("weddings")
      .select("id, slug")
      .eq("id", weddingId)
      .maybeSingle();

    if (fetchErr || !wedding) {
      return { success: false, error: "Wedding invitation not found." };
    }

    // 2. Update publish and bypass flags
    const { error: updateErr } = await adminClient
      .from("weddings")
      .update({
        is_paid: shouldPublish,
        published_by_admin: shouldPublish,
        updated_at: new Date().toISOString(),
      })
      .eq("id", weddingId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 3. Revalidate affected paths
    revalidatePath("/admin/weddings");
    revalidatePath("/admin/analytics");
    revalidatePath("/studio");
    revalidatePath(`/${wedding.slug}`);
    revalidatePath(`/invite/${wedding.slug}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update publish state" };
  }
}

/**
 * Super Admin Delete Wedding: Permanently delete a wedding invitation.
 */
export async function adminDeleteWedding(
  weddingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const adminClient = await createAdminClient();

    const { error } = await adminClient.from("weddings").delete().eq("id", weddingId);
    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/weddings");
    revalidatePath("/admin/analytics");
    revalidatePath("/studio");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete wedding" };
  }
}
