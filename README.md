# Wedding SaaS · Module 01

Standard Next.js 15 App Router + TypeScript, prepared for deployment outside ChatGPT Sites.
This package implements the foundation only. No live Supabase database has been modified and no hosting deployment has been created.

## Run locally

Use Node.js 22 LTS and npm. Extract this archive and open the `wedding-saas` folder in VS Code.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The development landing page works without API keys. It is not a completed customer-facing SaaS.

## Connect Supabase

1. Create or select a Supabase **development** project. This migration is intended for a fresh database, not for tables already created from the original blueprint.
2. Open `supabase/migrations/202610270001_foundation.sql`, copy its complete contents into the Supabase SQL Editor and run it once. It runs in a transaction; existing conflicting tables cause it to fail rather than be overwritten.
3. Copy `.env.example` to `.env.local`. Add the project URL and publishable key from your Supabase project. Do not commit `.env.local`.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` empty for now. No Module 01 page requires it. Later payment/RSVP server routes will need server-only credentials. Never put this key into a browser variable or share it in chat.
5. Restart the development server after changing environment variables.

There is no sign-in flow in this module. The browser client and the server client are connection utilities only. `src/lib/supabase/server.ts` is for Server Actions and Route Handlers, where cookies can be written. Before adding protected Server Component pages, implement session refresh with Next.js 15 `middleware.ts`, an appropriate read-only server-client wrapper and no-store handling for authenticated responses. Always verify the user server-side.

## Files

| Path | Purpose |
| --- | --- |
| `src/types/wedding.ts` | Exact interfaces copied from the supplied blueprint |
| `src/types/database.ts` | Database row types and restricted owner write types |
| `src/lib/validation/wedding.ts` | Zod draft validation with compile-time interface compatibility checks |
| `src/lib/wedding-defaults.ts` | Fresh, fully shaped blank invitation JSON |
| `src/lib/supabase/` | Environment validation and typed client utilities |
| `supabase/migrations/202610270001_foundation.sql` | Tables, constraints, indexes, grants, RLS and timestamp trigger |
| `tests/` | Validation and PostgreSQL permission tests |
| `docs/01_architecture_and_database.md` | Current Module 01 implementation reference and decisions |
| `docs/01_original_blueprint.md` | Unmodified uploaded specification |
| `src/app/` | Runnable development page and shared styles |

## Verify

```bash
npm run typecheck
npm test
npm run build
```

The database test executes the actual migration in PGlite (embedded PostgreSQL) with a minimal Supabase auth/role shim. It tests tenant isolation, protected payment fields, owner write permissions, private checkout-session fields and constraints. This is not a live Supabase integration test. Supabase Auth cookies, REST access, Storage, browser rendering and deployment still require verification in the target environment.

## Deployment preparation

This is a standard Next.js project. On a Next.js host such as Vercel, import the repository, choose the `wedding-saas` directory as the project root if it is nested, use the Next.js framework preset and `npm run build`, and set the public Supabase environment variables before building. A Node.js host can run `npm run build` followed by `npm start`.

Do not use static export for the complete SaaS: future dynamic invitations, secure server APIs and webhook handlers require server execution. Keep this foundation deployment private while modules are being built. Real publishing, payments and public invitation links are not implemented yet.

## Next step within Module 01

Apply the migration to the development Supabase project, configure the two public environment values and confirm the tables and RLS policies in that project. Then verify access with two real authenticated test accounts before moving to Module 02.

## References consulted

- Next.js installation: https://nextjs.org/docs/app/getting-started/installation
- Supabase column privileges: https://supabase.com/docs/guides/database/postgres/column-level-security
- Supabase SSR clients: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase auth caching: https://supabase.com/docs/guides/auth/server-side/advanced-guide
