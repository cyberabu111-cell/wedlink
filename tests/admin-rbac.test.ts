import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createEmptyWeddingData } from "../src/lib/wedding-defaults";

test("admin rbac: profiles, is_admin(), template CRUD, payment bypass, and page events", async () => {
  const db = new PGlite();
  const adminId = "00000000-0000-4000-8000-000000000001";
  const coupleId = "11111111-1111-4111-8111-111111111111";
  const strangerId = "22222222-2222-4222-8222-222222222222";

  try {
    // 1. Setup Supabase Auth / Roles Mock
    await db.exec(`
      CREATE ROLE anon NOLOGIN;
      CREATE ROLE authenticated NOLOGIN;
      CREATE ROLE service_role NOLOGIN BYPASSRLS;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
        $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
      INSERT INTO auth.users VALUES ('${adminId}'), ('${coupleId}'), ('${strangerId}');
    `);

    // 2. Execute all migrations in order
    const dir = new URL("../supabase/migrations/", import.meta.url);
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      await db.exec(await readFile(new URL(file, dir), "utf8"));
    }

    // 3. Seed profiles
    await db.exec(`
      INSERT INTO public.profiles (id, email, full_name, role) VALUES
        ('${adminId}', 'admin@everafter.com', 'Super Admin', 'admin'),
        ('${coupleId}', 'couple@example.com', 'Priya & Rahul', 'user'),
        ('${strangerId}', 'stranger@example.com', 'Stranger', 'user');
    `);

    // 4. Test is_admin() function
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${adminId}';`);
    const adminCheck = await db.query<{ is_admin: boolean }>("SELECT public.is_admin()");
    assert.equal(adminCheck.rows[0].is_admin, true, "is_admin() must return true for admin");

    await db.exec(`SET request.jwt.claim.sub = '${coupleId}';`);
    const userCheck = await db.query<{ is_admin: boolean }>("SELECT public.is_admin()");
    assert.equal(userCheck.rows[0].is_admin, false, "is_admin() must return false for regular user");

    // 5. Test Template CRUD permissions
    // Public/User can view active templates
    await db.exec("SET ROLE anon;");
    const publicTemplates = await db.query("SELECT id, name, category, price_inr FROM public.templates");
    assert.ok(publicTemplates.rows.length >= 5, "Public must be able to view active templates");

    // Regular user cannot insert new templates (blocked by RLS)
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${coupleId}';`);
    await assert.rejects(
      db.query(
        "INSERT INTO public.templates (id, name, category, price_inr, thumbnail_url) VALUES ('hacked-theme', 'Hacked', 'Luxury', 0, '/thumb.jpg')"
      ),
      /violates row-level security policy|permission denied/i
    );

    // Admin CAN insert new templates
    await db.exec(`SET request.jwt.claim.sub = '${adminId}';`);
    await db.query(`
      INSERT INTO public.templates (id, name, category, price_inr, thumbnail_url)
      VALUES ('royal-kerala-gold', 'Royal Kerala Gold', 'Luxury', 1499, '/thumbs/kerala-gold.webp')
    `);
    const inserted = await db.query<{ id: string; name: string }>(
      "SELECT id, name FROM public.templates WHERE id = 'royal-kerala-gold'"
    );
    assert.equal(inserted.rows.length, 1);
    assert.equal(inserted.rows[0].name, "Royal Kerala Gold");

    // 6. Test Wedding creation, view counting & Admin payment bypass override
    await db.exec(`SET request.jwt.claim.sub = '${coupleId}';`);
    const weddingRes = await db.query<{ id: string; published_by_admin: boolean; views_count: number }>(
      "INSERT INTO public.weddings (slug, wedding_data) VALUES ($1, $2) RETURNING id, published_by_admin, views_count",
      ["priya-and-rahul", JSON.stringify(createEmptyWeddingData())]
    );
    const weddingId = weddingRes.rows[0].id;
    assert.equal(weddingRes.rows[0].published_by_admin, false);
    assert.equal(weddingRes.rows[0].views_count, 0);

    // Regular user cannot set published_by_admin or bypass payment directly
    await assert.rejects(
      db.query("UPDATE public.weddings SET is_paid = true WHERE id = $1", [weddingId]),
      /permission denied|violates row-level security/i
    );

    // Admin service client can override and bypass payment
    await db.exec("RESET ROLE; SET ROLE service_role;");
    await db.query(
      "UPDATE public.weddings SET is_paid = true, published_by_admin = true, views_count = 42 WHERE id = $1",
      [weddingId]
    );
    const adminUpdated = await db.query<{ is_paid: boolean; published_by_admin: boolean; views_count: number }>(
      "SELECT is_paid, published_by_admin, views_count FROM public.weddings WHERE id = $1",
      [weddingId]
    );
    assert.equal(adminUpdated.rows[0].is_paid, true);
    assert.equal(adminUpdated.rows[0].published_by_admin, true);
    assert.equal(adminUpdated.rows[0].views_count, 42);

    // 7. Test Analytics Page Events
    // Anonymous visitors can insert page events
    await db.exec("SET ROLE anon;");
    await db.query(
      "INSERT INTO public.page_events (wedding_id, event_type, device_type, referrer) VALUES ($1, $2, $3, $4)",
      [weddingId, "page_view", "mobile", "https://instagram.com"]
    );
    await db.query(
      "INSERT INTO public.page_events (wedding_id, event_type, device_type) VALUES ($1, $2, $3)",
      [weddingId, "map_click", "desktop"]
    );

    // Wedding owner can view their own wedding's page events
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${coupleId}';`);
    const coupleEvents = await db.query("SELECT id, event_type FROM public.page_events WHERE wedding_id = $1", [weddingId]);
    assert.equal(coupleEvents.rows.length, 2);

    // Stranger CANNOT view this wedding's page events
    await db.exec(`SET request.jwt.claim.sub = '${strangerId}';`);
    const strangerEvents = await db.query("SELECT id FROM public.page_events WHERE wedding_id = $1", [weddingId]);
    assert.equal(strangerEvents.rows.length, 0);

    // Admin CAN view all page events
    await db.exec(`SET request.jwt.claim.sub = '${adminId}';`);
    const allEvents = await db.query("SELECT id FROM public.page_events");
    assert.equal(allEvents.rows.length, 2);
  } finally {
    await db.close();
  }
});
