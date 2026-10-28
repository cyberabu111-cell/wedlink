# Everafter — Wedding Invitation SaaS

Next.js App Router + TypeScript + Supabase, with structured invitation data, four coded React designs, a mobile-first editor, Google Maps/calendar helpers and Cashfree checkout. This repository implements Modules 01–04 locally. Credentials, remote migration and live integration acceptance remain deferred.

## Run locally

Use Node.js 22 or later. From this directory:

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. `/studio/new` previews sample data without keys. `/login` signs in with an email link when Supabase is configured; `/studio` lists your saved invitations. Saving requires an account. Public `/{slug}` links require verified payment.

## Configure when ready

Copy `.env.example` to `.env.local` without overwriting an existing configuration. Fill values privately; do not commit or paste secret keys. Apply `supabase/migrations/*.sql` in filename order to a fresh development database; on an existing project apply only migrations not already applied. Configure Supabase email delivery and allowed `/auth/callback` URLs.

The Google browser key is optional for manual venue entry and directions/calendar links. Cashfree checkout needs server credentials, the service-role database key, a canonical app URL and an allowed HTTPS domain reachable by its webhook service. Use separate Supabase projects and Cashfree environments for development and production. Sandbox purchases unlock development invitations and must not be migrated as real purchases.

Detailed setup and tests are in the module documents:

1. [Architecture and database](docs/01_architecture_and_database.md)
2. [Template engine and editor](docs/02_template_engine_and_editor.md)
3. [Maps and calendar](docs/03_maps_and_calendar_integrations.md)
4. [Cashfree integration and authorization](docs/04_cashfree_payment_integration.md)

## Verify

```powershell
npm run typecheck
npm test
# Separate build output avoids replacing the running development server's cache.
$env:NEXT_BUILD_DIR='.next-verify'
npm run build
Remove-Item Env:NEXT_BUILD_DIR
```

17 tests cover data validation, tenant permissions, all template renders, map/calendar behavior, signature verification and actual payment SQL transactions in embedded PostgreSQL. TypeScript and production build pass. Provider/browser end-to-end purchases still need configured test accounts and sandbox keys. No live database was modified and no real payment was made.

## Current boundaries

- One-time publication is ₹1,499 INR per invitation, independent of design. The server owns the price. A browser callback never marks payment complete.
- Templates are coded components in `src/templates`; there is no arbitrary HTML/code upload or admin template dashboard.
- Photo/audio fields currently accept URLs. Managed uploads are not implemented.
- WhatsApp RSVP links work; the alternative online RSVP buttons are not connected to the RSVP table yet.
- Refund/revocation operations, monitoring and production deployment remain follow-up work.

Deploy as a server-rendered Next.js application, not a static export. Keep secrets server-only and verify the complete sandbox flow in Module 04 before accepting real payments.
