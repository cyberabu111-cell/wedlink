import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createEmptyWeddingData } from "../src/lib/wedding-defaults";

test("migration enforces tenant isolation and blocks client payment manipulation", async () => {
  const db = new PGlite();
  const owner = "11111111-1111-4111-8111-111111111111";
  const stranger = "22222222-2222-4222-8222-222222222222";
  try {
    // Minimal Supabase role/auth shim; the migration itself is used unchanged.
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
      INSERT INTO auth.users VALUES ('${owner}'), ('${stranger}');
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/202610270001_foundation.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../supabase/migrations/202610270002_add_nikah_emerald_template.sql", import.meta.url), "utf8"));
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${owner}';`);
    const inserted = await db.query<{ id: string; is_paid: boolean; user_id: string; updated_at: string }>(
      "INSERT INTO public.weddings(slug, wedding_data) VALUES ($1, $2) RETURNING *",
      ["amina-and-ali", JSON.stringify(createEmptyWeddingData())],
    );
    const wedding = inserted.rows[0];
    assert.equal(wedding.user_id, owner);
    assert.equal(wedding.is_paid, false);
    await assert.rejects(db.query("UPDATE public.weddings SET is_paid = true WHERE id = $1", [wedding.id]), /permission denied/i);
    await assert.rejects(db.query("UPDATE public.weddings SET plan_tier = 'premium' WHERE id = $1", [wedding.id]), /permission denied/i);
    await assert.rejects(db.query("UPDATE public.weddings SET user_id = $1 WHERE id = $2", [stranger, wedding.id]), /permission denied/i);
    await assert.rejects(db.query("INSERT INTO public.weddings(slug, wedding_data, is_paid) VALUES ($1, $2, true)", ["spoof-paid", JSON.stringify(createEmptyWeddingData())]), /permission denied/i);
    await assert.rejects(db.query("INSERT INTO public.weddings(slug, wedding_data) VALUES ('bad-draft', '{}')"), /wedding_json_shape/i);
    await assert.rejects(db.query("INSERT INTO public.weddings(slug, wedding_data) VALUES ('api', $1)", [JSON.stringify(createEmptyWeddingData())]), /wedding_slug_format/i);
    await db.query("UPDATE public.weddings SET slug = 'amina-weds-ali' WHERE id = $1", [wedding.id]);
    const changed = await db.query<{ updated_at: string }>("SELECT updated_at FROM public.weddings WHERE id = $1", [wedding.id]);
    assert.notEqual(changed.rows[0].updated_at, wedding.updated_at);
    await db.exec("RESET ROLE; SET ROLE service_role;");
    await assert.rejects(db.query("INSERT INTO public.payments(wedding_id,user_id,cf_order_id,amount) VALUES ($1,$2,'mismatch',999)", [wedding.id, stranger]), /payment_wedding_owner_fk/i);
    await db.query("INSERT INTO public.payments(wedding_id,user_id,cf_order_id,amount) VALUES ($1,$2,'order-test',999)", [wedding.id, owner]);
    await db.query("INSERT INTO public.rsvps(wedding_id,guest_name) VALUES ($1,'Guest')", [wedding.id]);
    await db.query("UPDATE public.weddings SET is_paid = true WHERE id = $1", [wedding.id]);
    await db.exec(`RESET ROLE; SET ROLE authenticated; SET request.jwt.claim.sub = '${owner}';`);
    assert.equal((await db.query("SELECT id FROM public.rsvps")).rows.length, 1);
    assert.equal((await db.query("SELECT id,status FROM public.payments")).rows.length, 1);
    await assert.rejects(db.query("SELECT cf_payment_session_id FROM public.payments"), /permission denied/i);
    await assert.rejects(db.query("UPDATE public.payments SET status = 'SUCCESS'"), /permission denied/i);
    await assert.rejects(db.query("INSERT INTO public.rsvps(wedding_id,guest_name) VALUES ($1,'Spoof')", [wedding.id]), /permission denied/i);
    await db.exec(`SET request.jwt.claim.sub = '${stranger}';`);
    for (const table of ["weddings", "payments", "rsvps"]) {
      assert.equal((await db.query(`SELECT id FROM public.${table}`)).rows.length, 0);
    }
    assert.equal((await db.query("UPDATE public.weddings SET slug = 'stolen-slug' WHERE id = $1 RETURNING id", [wedding.id])).rows.length, 0);
    await db.exec("RESET ROLE; SET ROLE anon;");
    await assert.rejects(db.query("SELECT id FROM public.weddings"), /permission denied/i);
  } finally {
    await db.close();
  }
});
