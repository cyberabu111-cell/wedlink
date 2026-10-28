# Module 01: Architecture and database implementation

## Scope and status

Standard Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL/Auth, React Hook Form, Zod and Framer Motion dependencies. Node.js 22 LTS is the project baseline. Hosting is external to ChatGPT Sites. No credentials or live deployment are included.

Module 01 implements types, draft validation, initial database migration and a minimal development landing page. Module 02–04 application features are intentionally not implemented.

## Decisions and corrections

- Preserve `WeddingData` and `VenueEvent` exactly as uploaded. No new interface fields.
- Future public invitation route: `/[slug]`, following the original request; `/invite/[slug]` in the uploaded folder diagram is superseded. Reserve application route names in slug validation.
- Keep template IDs from the blueprint: `royal-rajwada`, `minimal-sage`, `boho-floral`. No template components or registry are built yet.
- Preserve the proposed basic/premium plan identifiers. Prices in the original blueprint are proposed business settings; server-side pricing and payment verification belong to Module 04.
- `wedding_data` has no empty-object SQL default. Use `createEmptyWeddingData()` and validate it before every write.
- Blank drafts may contain empty strings for unfinished fields. Publish-time completeness validation belongs to Module 02 and must not be confused with draft validation.
- SQL enforces the six top-level JSON section types and a one MiB payload ceiling. Zod enforces nested values and rejects unknown keys. Runtime validation remains necessary on writes AND reads, because database types do not validate JSON at runtime.
- Use RLS for row ownership, plus column grants to prevent owners from changing payment status, owner IDs, plan tiers or audit timestamps. RLS alone does not protect these columns.
- Owner wedding creation uses `auth.uid()` by default; client inserts send only `slug`, `template_id` and `wedding_data`.
- Owners can read their own payment summaries, but not checkout session identifiers. Select explicit columns for payments; `.select('*')` will fail by design.
- Payment ownership uses a composite foreign key to prevent a payment row being linked to a different user's wedding.
- Public database reads and direct guest RSVP writes are disabled in this foundation. The paid invitation projection/route in Module 02 and the validated RSVP endpoint must supply the appropriate public interface later. Never grant anonymous access to all wedding columns.
- Owner wedding deletion is disabled because the blueprint cascades payment deletion. Admin/account deletion still cascades as specified. Decide financial retention requirements before production account-deletion flows.
- `is_paid` is the only current publication entitlement flag. It does not provide a separate publish/unpublish workflow; add a reviewed migration if that product requirement changes.
- `updated_at` is maintained by a database trigger, not a client timestamp.
- `events_attending` remains an array of event names as specified. Renaming events after responses may make historical responses ambiguous; decide whether to migrate to IDs before implementing RSVP editing.
- The supplied event model contains no timezone or end-date field. Module 03 should explicitly use Asia/Kolkata for the initial Kerala scope and define overnight-event behaviour. Supporting international per-event zones requires an approved contract revision.
- Media remain URLs in the shared contract. Storage buckets, upload limits, ownership policies, signed URLs and publication behaviour are not yet implemented. Do not enable an unrestricted public bucket as an interim shortcut.
- Server client utility is for Route Handlers/Server Actions. Auth UI, callback handling, protected routes and session-refresh middleware are not yet implemented.

## Folder structure

```text
wedding-saas/
  src/
    app/{layout.tsx,page.tsx,globals.css}
    types/{wedding.ts,database.ts}
    lib/
      wedding-defaults.ts
      validation/wedding.ts
      supabase/{env.ts,client.ts,server.ts}
  supabase/migrations/202610270001_foundation.sql
  tests/{database.test.ts,wedding.test.ts}
  docs/{01_original_blueprint.md,01_architecture_and_database.md}
  .env.example
  package.json
  package-lock.json
  README.md
```

Module 02 will introduce the protected dashboard/editor, template registry, public `[slug]` route and metadata. Modules 03 and 04 will introduce integrations. Do not implement future modules without the user's request.

## Authoritative TypeScript contract

```typescript
export interface VenueEvent {
  id: string;
  eventName: string;          // e.g., "Haldi Ceremony", "Sangeet", "Muhurtham"
  date: string;               // ISO Date "2026-12-14"
  startTime: string;          // "10:00" (24h format for Calendar calculation)
  endTime: string;            // "14:00"
  venueName: string;          // e.g., "Taj Falaknuma Palace"
  venueAddress: string;       // Full address populated via Google Places
  googlePlaceId?: string;     // Place ID for accurate Maps Embed
  lat?: number;               // Latitude for Maps pin
  lng?: number;               // Longitude for Maps pin
  googleMapsUrl: string;      // Direct navigation link for guests
  dressCode?: string;         // e.g., "Traditional Yellow"
}

export interface WeddingData {
  couple: {
    brideName: string;
    groomName: string;
    brideBio?: string;
    groomBio?: string;
    hashtag?: string;         // e.g., "#RahulKiPriya"
    weddingDate: string;      // Primary countdown date
    coverPhotoUrl: string;
  };
  story: {
    title: string;
    content: string;
    milestones?: Array<{ year: string; title: string; description: string }>;
  };
  events: VenueEvent[];
  gallery: string[];          // Array of compressed WebP image URLs
  theme: {
    primaryColor: string;     // Hex code e.g., "#8B0000"
    secondaryColor: string;   // Hex code e.g., "#D4AF37"
    fontFamily: 'serif' | 'sans' | 'playfair';
    backgroundMusicUrl?: string;
  };
  rsvpConfig: {
    enabled: boolean;
    deadline?: string;
    askDietaryPreference: boolean;
    whatsappNumber?: string;  // Optional: also send RSVP via WhatsApp
  };
}
```

## Applied-by-user migration

The SQL below is the same migration included under `supabase/migrations`. Apply once to a fresh development Supabase project. It has been designed for standard Supabase roles; see the README for validation limits.

```sql
BEGIN;

CREATE TABLE public.weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  template_id text NOT NULL DEFAULT 'royal-rajwada',
  plan_tier text NOT NULL DEFAULT 'basic',
  is_paid boolean NOT NULL DEFAULT false,
  wedding_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wedding_owner_pair UNIQUE (id, user_id),
  CONSTRAINT wedding_slug_format CHECK (
    char_length(slug) BETWEEN 3 AND 80 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND slug NOT IN ('api', 'studio', 'rsvps', 'login', 'signup', 'auth', 'dashboard',
      'pricing', 'templates', 'admin', 'account', 'settings', 'preview', 'invite',
      'privacy', 'terms', 'support', 'favicon', 'robots', 'sitemap')
  ),
  CONSTRAINT wedding_template_valid CHECK (template_id IN ('royal-rajwada', 'minimal-sage', 'boho-floral')),
  CONSTRAINT wedding_plan_valid CHECK (plan_tier IN ('basic', 'premium')),
  -- Coarse structural boundary; application writes must also pass weddingDataSchema.
  -- No '{}' default: a new draft must contain the complete WeddingData shape.
  CONSTRAINT wedding_json_shape CHECK (COALESCE(
    jsonb_typeof(wedding_data) = 'object'
    AND wedding_data ?& ARRAY['couple', 'story', 'events', 'gallery', 'theme', 'rsvpConfig']
    AND jsonb_typeof(wedding_data->'couple') = 'object'
    AND jsonb_typeof(wedding_data->'story') = 'object'
    AND jsonb_typeof(wedding_data->'events') = 'array'
    AND jsonb_typeof(wedding_data->'gallery') = 'array'
    AND jsonb_typeof(wedding_data->'theme') = 'object'
    AND jsonb_typeof(wedding_data->'rsvpConfig') = 'object'
    AND octet_length(wedding_data::text) <= 1048576,
    false
  ))
);

CREATE INDEX weddings_user_created_idx ON public.weddings(user_id, created_at DESC);
-- UNIQUE(slug) already provides the public lookup index.

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cf_order_id text UNIQUE NOT NULL CHECK (char_length(cf_order_id) BETWEEN 1 AND 255),
  cf_payment_session_id text,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_wedding_owner_fk FOREIGN KEY (wedding_id, user_id)
    REFERENCES public.weddings(id, user_id) ON DELETE CASCADE
);
CREATE INDEX payments_wedding_idx ON public.payments(wedding_id);
CREATE INDEX payments_user_created_idx ON public.payments(user_id, created_at DESC);

CREATE TABLE public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  guest_name text NOT NULL CHECK (char_length(btrim(guest_name)) BETWEEN 1 AND 200),
  phone_number text CHECK (phone_number IS NULL OR char_length(phone_number) <= 32),
  attending boolean NOT NULL DEFAULT true,
  guests_count integer NOT NULL DEFAULT 1 CHECK (guests_count BETWEEN 1 AND 100),
  events_attending text[] CHECK (events_attending IS NULL OR cardinality(events_attending) <= 50),
  dietary_notes text CHECK (dietary_notes IS NULL OR char_length(dietary_notes) <= 2000),
  message_for_couple text CHECK (message_for_couple IS NULL OR char_length(message_for_couple) <= 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rsvps_wedding_created_idx ON public.rsvps(wedding_id, created_at DESC);

CREATE FUNCTION public.set_wedding_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.set_wedding_updated_at() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER wedding_updated_at BEFORE UPDATE ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.set_wedding_updated_at();

ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- Supabase may grant broad privileges by default. Clear them before narrow grants.
REVOKE ALL ON public.weddings, public.payments, public.rsvps FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.weddings TO authenticated;
GRANT INSERT (slug, template_id, wedding_data) ON public.weddings TO authenticated;
GRANT UPDATE (slug, template_id, wedding_data) ON public.weddings TO authenticated;
-- No client-side delete: avoids cascading deletion of payment records.
CREATE POLICY weddings_owner_select ON public.weddings FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY weddings_owner_insert ON public.weddings FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND is_paid = false AND plan_tier = 'basic');
CREATE POLICY weddings_owner_update ON public.weddings FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- Checkout session identifiers stay server-only. Clients must select explicit fields.
GRANT SELECT (id, wedding_id, user_id, cf_order_id, amount, currency, status, created_at)
  ON public.payments TO authenticated;
CREATE POLICY payments_owner_select ON public.payments FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT, DELETE ON public.rsvps TO authenticated;
CREATE POLICY rsvps_owner_select ON public.rsvps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w
    WHERE w.id = wedding_id AND w.user_id = (SELECT auth.uid())));
CREATE POLICY rsvps_owner_delete ON public.rsvps FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weddings w
    WHERE w.id = wedding_id AND w.user_id = (SELECT auth.uid())));

-- Only trusted server code may write payments, unlock weddings, or accept RSVPs.
-- Module 04 must verify Cashfree signatures and use an atomic, idempotent transaction.
GRANT ALL ON public.weddings, public.payments, public.rsvps TO service_role;
COMMIT;
```

## Immediate next step

Apply the migration and configure the Supabase development project. Confirm live RLS behaviour with two authenticated test accounts. Module 01 is not live-connected until these checks succeed.
