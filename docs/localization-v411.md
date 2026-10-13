# SGBuddy V4.11 — Food filter values, Apps copy, Account validation

Development branch stacked directly on V4.10 PR #62. Do not alter main or production (still V4.2.0). Offline/events remain derived from V4.8; separate event-coverage work must be reconciled before production.

## Changes
- **12 source-locked Food/Discover filter option labels** × 12 supported locales: Supermarket — operator locator; Local hawker; Singapore hawker; Breakfast, Dessert, Dinner, Drinks, Lunch, Main meals, Snack, Snacks and desserts and Unknown.
- **10 authored first-party strings** × 12 locales: Apps directory heading/identity and publisher-install safety notice; four account validation states; MICHELIN, CNA and NEA *link action labels* on stall cards.
- **264 new localized dictionary entries**; select values, official food stalls, ingredients/dishes, sources, addresses, user input, account credentials, route URLs and original MUIS warning are unchanged.
- Runtime updates language and dynamic rerenders via strict known-label checks, with no blanket translation, network calls or PWA caching changes.
- Offline and event modules continue to load; new locale module and bridge added to same-origin service-worker precache without touching offline pack cache or public version badge.

## Verification
- scripts/check-v411.mjs: dictionary completeness across twelve locales, bootstrap/offline and source lock.
- scripts/browser-qa-v411.mjs: Chromium mobile 390px and desktop 1366px; 12 locales; original option values, selected meal, source-owned stall name, original MUIS warning, Account validation and V4.8 offline/events preserved.
- Legacy V3.x/V4.x suites, V4.8 offline smoke and V4.3 rendered comparison run in CI.

## Remaining
Account success/recovery flows and service messages, Discover Apps dynamic content and Facts source classification, all persona combinations, source-ownership review, native-speaker and installed iOS/Android offline PWA verification. The rendered change-rate is not a complete/quality-verified translation percentage.