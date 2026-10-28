import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabasePublicEnv } from "./env";

/** For Route Handlers, Server Actions, and Server Components. */
export async function createClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Silently ignore in read-only Server Component context
          }
        }
      },
    },
  });
}

/** Explicit service-role client for public invitation queries and administrative actions. */
export async function createAdminClient() {
  const { url } = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Server database credentials are not configured.");
  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
