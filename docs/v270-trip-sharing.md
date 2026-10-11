# SGBuddy V2.7 — Trip Sharing and Exchange

## Implemented
- Share an itinerary snapshot link via a Base64URL-encoded UTF-8 JSON payload in the #sgtrip= URL fragment. No public trip database or login required. Link generation discards query params and old auth/profile hash data.
- A recipient previews the trip title, start date, day count and stops, then explicitly imports as a new editable copy or discards. Opening a link does not autosave.
- Different devices can exchange copies. After editing, a recipient can generate a new link and send changes back. This is not real-time co-editing or automatic sync.
- Portable .json download/import for large trips or backup (60 KB input ceiling), with validated formats, dates, day/stop count, and strings. Existing .txt export retained.
- English and Simplified Chinese, accessible mobile controls, versioned PWA shell.

## Honest privacy and scope
Snapshot links are NOT encrypted, not revocable, and do not automatically update. Anyone holding the link can read the itinerary and any notes. Avoid inserting private information. Fragments normally are not transmitted in HTTP requests but can be exposed in browser history, screenshots, client-side code, and forwarded links. Maximum link payload 7,500 characters; large plans must use .json export. No cloud storage, sign-in sharing, live collaboration, invitations, or booking confirmation.

## QA
- npm run check includes Unicode roundtrip, independent copy, corruption and bounds checks, .json handling, link safety and PWA coverage.
- Chromium in two isolated browser contexts verifies generation, cross-device preview/import, no autosave, editing/resending, dismiss, file import, locale, 375px viewport.
- V2.5 and V2.6 browser regressions preserved.
- Keep V2.7 on development branch until preview and CI pass. Production remains V2.6 absent explicit deployment request.

## Later
True simultaneous editing, authenticated online sync, revocable share links, version reconciliation and invitation permissions require a backend and verified row-level security.