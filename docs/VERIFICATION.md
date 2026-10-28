# Module 01 verification

Historical baseline below. As of 2026-10-28, the suite has 17 passing tests, including Module 03 maps/calendar and Module 04 payments. TypeScript and the isolated production build pass. See `04_cashfree_payment_integration.md` for current browser verification and deferred live checks. No remote database or real payment has been changed.

- TypeScript: `npm run typecheck` passed.
- Production build: `NEXT_TELEMETRY_DISABLED=1 npm run build` passed (Next.js 15.5.28).
- Tests: `npm test` passed, four tests, zero failures.
- Supplied TypeScript interface: byte-for-byte match with the uploaded TypeScript block.
- Database: actual migration executed successfully in PGlite with a minimal Supabase auth and role shim.
- Permissions: tested owner access, cross-tenant isolation, anonymous denial, blocked paid-state/plan/owner writes, hidden checkout session values, forbidden payment writes, and server-role access.
- Validation: tested blank drafts, independent defaults, impossible dates, unsafe URLs, unknown fields, duplicate event IDs and partial coordinates.

Not verified: live Supabase Auth/PostgREST/Storage, real browser rendering, remote hosting or production deployment. No live database was modified. No credentials are bundled. The server client is a utility for writable-cookie contexts; complete sign-in/session lifecycle will be implemented before protected editor routes.
