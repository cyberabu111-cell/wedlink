import "server-only";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: "admin";
}

/**
 * Server guard to verify that the currently authenticated user is a Super Admin.
 * Throws an Error if unauthenticated or not an admin.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Authentication required.");
  }

  // Query profile using admin client to guarantee bypass of any client session caching
  const adminClient = await createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Forbidden: Super Admin privileges required.");
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: "admin",
  };
}

/**
 * Helper to check whether the current user is an admin without throwing.
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
