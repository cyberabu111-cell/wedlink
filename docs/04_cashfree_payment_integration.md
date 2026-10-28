# Module 04 — Cashfree checkout and paid publishing

Updated 2026-10-28. Local implementation complete; provider credentials and live integration testing are deferred at the user's request.

## Implemented files and flow

- `src/lib/payments/validation.ts`: one-time publication price ₹1,499 INR for any design, checkout input and publication readiness validation. `WeddingData` is unchanged. Browser amounts and unknown checkout fields are rejected.
- `src/lib/payments/server.ts`: server-only Cashfree SDK, explicitly pinned API version 2025-01-01, 15-second upstream timeouts, authenticated ownership checks and server reconciliation. The browser package loads Cashfree JS v3 only when checkout starts. SDK error analytics is disabled.
- `src/app/api/cashfree/create-order/route.ts`: POST with origin check, session verification, owned saved invitation and valid event data. Reserves a payment before contacting Cashfree. Reuses the same request/order/idempotency key after retries, including a timeout. Replaces orders only after Cashfree confirms expiration/termination or confirms that a locally expired reservation never created an order.
- `src/components/editor/PublishPayButton.tsx`: customer name/Indian phone, saved-change guard, modal checkout, cancellation handling, bounded status polling and manual verification. Browser checkout results never unlock publication. A redirect return can trigger verification without trusting its query string as proof of payment.
- `src/app/api/cashfree/status/route.ts`: owner-only server verification with Cashfree order and successful payment records; atomic ten-second upstream-check throttle. Browser requests have bounded timeouts and unmount cancellation.
- `src/app/api/cashfree/webhook/route.ts` and `src/lib/payments/signature.ts`: bounded raw request body, HMAC-SHA256 over timestamp plus exact bytes, base64 and timing-safe comparison. Parse only after signature verification. A failed payment attempt does not fail the whole order. No freshness rejection that would discard legitimate delayed provider retries; successful events are idempotent in the database.
- `supabase/migrations/20261028004832_cashfree_checkout.sql`: server-only reservation and confirmation functions, private stored checkout requests, payment-ID uniqueness and environment/amount/currency checks. A single database transaction sets payment SUCCESS and its stored wedding's `is_paid`. No reliance on webhook order tags or browser wedding IDs for fulfillment. Functions are SECURITY INVOKER with an empty search path and service-role-only execute grants. RPC transactions never hold a database lock while contacting Cashfree.
- `src/lib/http.ts`: bounded body reads, same-origin requests and non-cacheable JSON responses.
- `src/types/database.ts`: updated payment columns and RPC types. Private payment/customer/session fields have no authenticated column grants.

## Supporting authorization fixes

- Removed service-role fallback from the cookie-aware Supabase client. A separate server-only admin client has no user cookies and disables caching.
- Removed fixed development user creation and admin-based draft saves. Save actions runtime-validate inputs, verify the session and use RLS plus an explicit ownership filter. No client write can set `is_paid`, payment status, plan or owner.
- Added email-link sign-in (`/login`, `/auth/callback`), session refresh middleware, `/studio` owned-invitation list and sign-out. Login redirects accept only local studio paths.
- Existing saved editor routes require the owner; missing/foreign IDs return unavailable instead of sample data.
- Public `/{slug}` and `/invite/{slug}` select only paid invitations. Metadata uses the same gate, so unpaid drafts do not leak through social previews. Owners preview unpaid content inside the studio with its watermark.
- Published edits continue to require complete event data in the save action. Direct authenticated database writes remain subject to the baseline JSON-shape constraint and owner RLS; strict full WeddingData validation is enforced by application routes.

## Configure later, without sharing keys in chat

1. Apply all SQL migrations in filename order to a development Supabase project. If foundation and template migrations already exist, apply only the new checkout migration. Do not rerun CREATE TABLE migrations on an existing schema.
2. Populate the documented `.env.example` fields privately in `.env.local` or hosting settings: Supabase URL/publishable key, server-only service-role key, Cashfree app ID/secret, `NEXT_PUBLIC_CASHFREE_ENV=SANDBOX`, canonical `NEXT_PUBLIC_APP_URL`.
3. Configure Supabase Auth Site URL and allowed `/auth/callback` redirect URLs for localhost and the deployed domain. Configure email delivery. Email links must open in the browser that requested them for the PKCE flow.
4. Use a publicly reachable HTTPS development URL for Cashfree webhooks. Localhost alone cannot receive provider callbacks. Whitelist that domain in Cashfree and use `/api/cashfree/webhook` for payment webhook delivery. Ensure successful-payment events are enabled.
5. Restart/rebuild after environment changes. Use separate development and production Supabase projects: sandbox payments intentionally unlock invitations in development and must never be carried into production as real purchases. Match provider environment and keys. Production requires an HTTPS app URL.

The ₹1,499 default is centralized in validation.ts and used in template metadata and checkout. Change that one constant before launch if the business price differs. Existing pending orders keep their original stored amount. No subscriptions, upgrades or payment discounts are implemented.

## Verification

`npm test` passes 17 tests; `npm run typecheck` and isolated production build pass. Payment tests run actual migrations in embedded PostgreSQL and cover private permissions, reservation reuse, owner mismatch, wrong amounts/currency/environment, duplicate webhooks, payment-ID reuse and transaction rollback. HMAC tests cover exact bytes, Unicode, timestamp/secret changes and malformed signatures. HTTP helpers test payload limits, origin checks and safe login redirects.

Browser checks confirmed email sign-in layout, editor loading, four design options, watermark and save-before-publish guidance. The existing Next development cache had a missing vendor chunk; restarting with a fresh cache resolved it. A retained `.next-stale-20261028` cache is ignored and excluded from TypeScript checks.

Local HTTP checks also passed: cross-origin checkout returns 403, malformed JSON returns 400, unauthenticated checkout/status return 401, and the webhook returns a safe 503 while Cashfree credentials are absent. Responses are private/no-store. These checks did not create provider orders or send sign-in emails.

Not yet verified: actual Supabase Auth email/cookies, PostgREST RPC exposure against the deployed migration, Cashfree sandbox modal/UPI redirects, real callback delivery, external network-failure retries and mobile payment apps. No live payments or remote migrations were performed.

Immediate next step in Module 04: when credentials are configured, run a sandbox purchase from each of two separate accounts; verify the other account cannot read or pay for the first account's draft, unpaid links return 404, successful payment unlocks exactly one invite, replayed webhooks are harmless, and closing checkout never marks a draft paid. Recheck payment after intentionally delaying webhook delivery.

## Remaining product work outside Module 04

The four-module core is implemented locally, but the entire SaaS is not launch-verified. Photo/audio inputs currently use URLs rather than managed uploads. Templates offer WhatsApp RSVP; the alternative online RSVP buttons are not wired to submission/storage yet. An administrator template dashboard, refund/revocation handling, operational monitoring and deployment are separate follow-up work. Templates remain coded React components registered by a developer, not arbitrary uploaded executable components.

## Primary references

- [Cashfree hosted web checkout](https://www.cashfree.com/docs/payments/online/web/redirect)
- [Cashfree signature verification](https://www.cashfree.com/docs/payments/online/webhooks/signature-verification)
- [Cashfree webhook idempotency](https://www.cashfree.com/docs/payments/online/webhooks/webhook-indempotency)
- [Supabase SSR authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase column security](https://supabase.com/docs/guides/database/postgres/column-level-security)
