# SGBuddy V4.1 — Directory cards, contextual states, and source-safe localization

Status: isolated stacked development wave after V4.0 PR #50. **Do not merge to production yet.** Release badge stays V3.12.0 in this draft.

## Changes
- **45 new first-party message keys × 12 locales = 540 authored entries**, covering freshness and historical caveats, CHAS/licensing links, saved actions and accessibility names, add-to-trip, official publisher warnings, fact actions, NEA closure, OneMap address states and loading/error fallbacks.
- app-v120.js renders these messages via lib/i18n-directory-v410.mjs **at render time** and on language switches. Saved states, filters, original place names and links remain intact.
- Source-operated hours, operator names, addresses/postcodes, closure dates and reasons are interpolated into localized first-party text with HTML escaping. Official source facts, technical codes, live notices and user-entered content are never machine translated.
- Directory persona labels and explanatory copy reuse the existing V3.7 contextMode() translation pack for five modes.
- Official-date display uses selected locale and Singapore time zone; raw ISO dates are unchanged.
- Offline PWA advances to sgbuddy-shell-v72 with the new locale pack precached, preserving Merli V3.11.1 and V3.12 regressions.
- Registered authored UI inventory: 478 + 45 = 523 per locale. **Not a whole-app denominator**, and does not imply native-speaker quality.

## Test commands
- node scripts/check-v410.mjs
- node scripts/check-all.mjs
- With Playwright Chromium and local HTTP server on port 8765: node scripts/browser-qa-v410.mjs

12-language mobile/desktop browser testing covers source identities, saved/unsaved ARIA labels, trip and app actions, publisher warnings, facts and no horizontal overflow.

## Remaining review gates
- Real iPhone Safari and Android installed PWA locale switching/offline refresh
- Native review of clinic/CHAS, food, permit and closure warnings
- Inventory of remaining static Discover, Food and Merli and API fallback English with source-ownership review
- Whole-app rendered-screen denominator before any verified 95–99% claim

Branch stacked on V4.0; leave main and Vercel production untouched.
