import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabasePublicEnv } from "./env";

/** For Route Handlers, Server Actions, and Server Components. */
export async function createClient(useAdminIfUnauthenticated = true) {
  const { url, publishableKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((c) => c.name.includes("auth") || c.name.includes("token") || c.name.startsWith("sb-"));
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = (!hasAuthCookie && serviceKey && useAdminIfUnauthenticated) ? serviceKey : publishableKey;

  return createServerClient<Database>(url, key, {
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
  const { url, publishableKey } = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || publishableKey;
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}
