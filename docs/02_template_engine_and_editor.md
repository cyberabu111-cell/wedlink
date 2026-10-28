# Module 02 — Template engine and editor

Current reference, updated 2026-10-28. Earlier visual changes are recorded in `02_ui_progress.md`.

All template props use the Module 01 `WeddingData` contract in `src/types/wedding.ts`. `src/templates/index.ts` registers Royal Rajwada, Minimal Sage, Boho Floral and Nikah Emerald. Adding a coded template requires a component implementing TemplateProps, registry/metadata entries, matching template validation/type changes and an additive database constraint migration. There is no admin upload/dashboard flow yet.

`src/app/(dashboard)/studio/[weddingId]/StudioEditorClient.tsx` provides six structured sections, live template selection, mobile Edit/Preview switching and a desktop split preview. Module 03 adds venue selection/maps and per-event calendar actions. Module 04 adds saved-state-aware publishing and verified payment state. Images/audio are URL inputs; managed storage uploads are not implemented.

`/studio/new` is an accessible sample preview. Saving requires sign-in. `/studio/{id}` requires its verified owner, `/studio` lists the current account's invitations, and `/login` uses Supabase email links. Drafts remain private; public `/{slug}` and the legacy `/invite/{slug}` alias render paid invitations only. Both page metadata and rendering use the same paid lookup, including WhatsApp/OpenGraph image/title/description.

The earlier development user and service-role fallback described in the historical UI progress file have been removed. No account credentials are bundled. The Module 04 document describes current authorization and setup.

Immediate next verification: sign in with two test accounts against configured Supabase and verify create/save/reopen, ownership isolation, and paid public rendering. For UI upgrades, verify the full editor at 320px, 390px, 768px and desktop widths, including native date/time fields and keyboard access.
