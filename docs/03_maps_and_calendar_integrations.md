# Module 03: Maps and calendar integrations

## Implementation

The existing WeddingData and VenueEvent contracts remain unchanged.

- src/components/editor/VenueLocationPicker.tsx: Google Places search, activated on demand. Uses the current PlaceAutocompleteElement with gmp-select and fetchFields rather than the blueprint's legacy Autocomplete wrapper.
- src/lib/google-maps.ts: shared configuration and on-demand Places loading through Google's official @googlemaps/js-api-loader.
- src/utils/maps.ts: universal directions links, Maps Embed URLs and clearing old place IDs/coordinates when the address is edited.
- src/components/shared/GoogleMapCard.tsx: accessible, lazy map iframe and key-free directions link.
- src/components/shared/AddToCalendarButton.tsx: expandable Google Calendar and Apple/Outlook download controls.
- src/utils/calendar.ts: explicit IST scheduling, UTC timestamps, overnight handling and RFC 5545 ICS output.
- The original three templates now render the shared controls for each event. Studio selections update all six venue fields atomically.
- tests/integrations.test.ts covers calendar boundaries, invalid drafts, UTF-8 folding and escaping, map URLs, stale locations and rendering every registered template. The separately added Nikah Emerald template also passes the shared event-control render checks.

## Configure Google Cloud

1. Select your Google Cloud project, attach billing, and enable Maps JavaScript API, Places API (New), and Maps Embed API.
2. Create a browser API key with website/referrer restrictions for your development and production origins, for example http://localhost:3000/* and https://your-domain.example/*.
3. Restrict the key to those three APIs. The key is intentionally browser-visible; configure restrictions and usage limits in Google Cloud.
4. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key to .env.local. Do not paste the key into chat or commit .env.local.
5. Restart npm run dev. For production, rebuild after setting the environment variable.
6. Open Studio > Events > Search Google Maps. Select a result, inspect the populated fields, save the draft, then check the map and directions in the invitation.

The key is not configured in the reviewed local environment. Without it, manual entry and directions/calendar links remain available, and no broken map iframe is rendered. Live Places selection, Google Cloud permissions/billing and embedded-map loading require verification after configuration.

## Calendar decisions

- All event times use Asia/Kolkata (UTC+05:30), consistent with Module 01's initial India scope. Google Calendar and ICS share the same UTC instants.
- An end time earlier than its start means the next day. Equal times, missing fields and invalid dates disable calendar generation. No arbitrary default time is silently substituted.
- This contract supports events shorter than 24 hours. Multi-day events or per-event timezones require a reviewed contract change.
- ICS includes VERSION, PRODID, CALSCALE, stable wedding/event UID, DTSTAMP, DTSTART, DTEND, SUMMARY, LOCATION and DESCRIPTION. Uses CRLF, escaped TEXT and UTF-8-aware folding at 75 octets.
- Downloads use Blob URLs that are revoked after the browser has begun consuming the file.
- Calendar links open Google's event form; guests confirm saving there. ICS import behavior varies by device/calendar app. No guest OAuth integration or account access is required by this application.
- Exported events are snapshots, not calendar subscriptions. Editing an invitation does not automatically update guests' calendars.
- Date-only labels in templates use UTC formatting to preserve the written date for guests in other timezones.

## Verification

- 13 automated tests pass, including existing database/contract tests.
- TypeScript and isolated production build pass.
- Browser verified: Events tab, missing-key/manual-entry fallback, directions links and expandable calendar choices.
- Pending external checks: real Places selection, map loading with a restricted key, and ICS import on Apple Calendar/Outlook.
- Production builds can use NEXT_BUILD_DIR=.next-verify to avoid overwriting a running development server's output. Standard builds still use .next.

## Next step

Configure the restricted Maps key and perform the live map/calendar import checks above. Module 04 (Cashfree) remains unimplemented; use its blueprint for the next module.

Existing Module 02 production authorization concerns remain tracked in 02_ui_progress.md and must be resolved before launch. Passing these integration tests does not certify the entire SaaS for production.

## References

- https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
- https://developers.google.com/maps/documentation/javascript/load-maps-js-api
- https://developers.google.com/maps/documentation/embed/embedding-map
- https://developers.google.com/maps/documentation/urls/get-started
- https://www.rfc-editor.org/rfc/rfc5545
