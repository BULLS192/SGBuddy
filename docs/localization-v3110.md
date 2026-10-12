# SGBuddy V3.11 — home-screen localization repair (stacked development)

Origin: user-supplied screenshot on Oct 12 showing Simplified Chinese navigation but English station search, contextual resident banner, shortcut descriptions, Merli guidance, weather summary, next departures and air quality category. This branch is stacked on V3.10 PR #43; **production stays V3.9** until separately authorized.

## Root cause
The initial client page had a translated core navigation but older `app-v090.js`, `app-ux-v160.js` and `app-ux-v170.js` recreated English on updates. A dictionary-coverage count was therefore not reliable evidence of actual visible language coverage.

## Changes
- `lib/i18n-home-v311.mjs`: 38 first-party home and transport screen messages × 12 locales, 456 authored candidate translations, with source-locked interpolation of time, count and persona label.
- `lib/i18n-shortcuts-v311.mjs`: 7 shortcut actions, each with 12 translated labels and descriptions, using preserved semantic `data-ux-go` destinations.
- `app-ux-v170.js`: use V3.7 five-persona localized `contextMode()` labels and descriptions, V3.11 localized buttons, Merli helper, shortcut cards, explore guidance and accessibility skip-link; re-render on language and persona events.
- `lib/i18n-weather-codes-v311.mjs`: conservative 11-name known NEA weather-description map with temperature/humidity/rain numeric placeholders left intact.
- `lib/i18n-psi-v311.mjs`: 5 familiar PSI category descriptions (only the UI label, not official numeric measurements).
- `app-i18n-home-v311.js`: exact-anchor observers for station checker, active context, weather/air quality, location privacy, local refresh time, nearby departures and collapsed conditions. Does not alter unrecognized user text, source IDs, train destination names, saved addresses, pricing, official provider messages, or unknown weather conditions.
- PWA cache revision v68 includes all new JS translation modules; bootstrap imports the localization bridge after V3.9 modules.
- `scripts/check-v3110.mjs` source/locale key/integrity checks; `scripts/browser-qa-v3110.mjs` checks 12-language desktop and mobile rendering, numeric preservation, responsive width, and user/provider source protection.

## Explicit boundaries
The prior ~75% whole-app translation figure was an **unverified estimate**. This wave meaningfully addresses the screenshot; it does not prove 95–99% of **all** screens, conditional Merli replies, fetched provider documents or editorial content. Native speaker review is pending for candidate translations, and future waves should focus on transport row details, conditional risks and unclassified data fields. Native review and real-device/PWA verification must be separately completed before claiming entire app 95–99%.

## Test
`node scripts/check-all.mjs` for all existing static checks; `node scripts/browser-qa-v3110.mjs` for dual-viewport, 12-locale home screen with local test server and Playwright.
