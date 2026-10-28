# Module 02 UI refresh

Historical snapshot. Current auth, publication and integration status is documented in `02_template_engine_and_editor.md` and `04_cashfree_payment_integration.md`; the development-only authorization caveat below was resolved in Module 04.

Updated 2026-10-27.

## Implemented

- Replaced the development status homepage with an invitation-focused landing page, illustrated invitation artwork, three design cards and a short creation guide.
- Introduced an ivory/plum visual system and responsive typography. Homepage artwork uses CSS and text, without extra image requests or client JavaScript.
- Mobile studio uses a persistent Edit invitation / Live preview switch. Form state is retained while switching.
- Six editor sections remain visible in a compact grid. Each section includes a descriptive heading.
- Form fields use 16px text, comfortable touch targets and associated labels. Date/time inputs use native controls.
- Gallery URLs are entered inline with validation; removal controls are visible on touch devices.
- Desktop retains the editor/preview split with a viewport-height preview instead of a fixed 780px frame.
- All three templates use container breakpoints so mobile previews respond to their actual available width.
- Template cards select the intended design via the studio query parameter.
- Unsaved invitations no longer show a link to a public page that does not exist. Saved links use the canonical /[slug] route.
- Added visible keyboard focus, reduced-motion styles and safe-area spacing.

## Verification and remaining work

The six existing tests pass. Browser visual testing could not be completed because the browser could not connect to the local preview server. Verify the landing page, editor tabs, live preview, gallery and template switching at 320px, 390px, 768px and desktop widths.

WeddingData and database schema are unchanged. Maps/calendar and payment implementations remain deferred.

This UI work does not resolve the existing development-only authentication behavior: the server client can fall back to a service-role key, and the save action uses an admin client without checking ownership before an update. Production tenant authorization and paid-only public access still require a separate hardening pass.

Immediate next step within Module 02: review the refreshed UI in a local browser and verify the mobile interactions before Module 03.
