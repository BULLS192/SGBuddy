# SGBuddy V4.5 — Merli Makan & Discover labels

**Status:** Development PR stacked on V4.4 (#56) and V4.3 (#55). Production **V4.2.0** untouched; no change to release badge or PWA cache revision.

## Implementation
- Add **15 first-party message keys × 12 locales = 180 authored dictionary entries**, including 11 translated language packs. Native-speaker quality review remains pending.
- Merli Makan: guide eyebrow, intro, two picker filter captions, tools region and navigation accessible names, initial guide caveat and dining-service introduction.
- Discover: search input and 4 filter accessible names, listings explanation accessible name, cautionary text.
- Translates via tightly scoped selectors and exact known first-party text matching; does **not** translate/placehold user input, area option values, selected food/area, food names or stall identities, URLs, operator text, fees, dates, live availability, source claims or the original MUIS warning.
- On language changes and Discover re-render, update both visible and ARIA labels without resetting the picker. Original English source for authored caution text is retained as non-visible review metadata (`data-source-english`).
- Existing V3/V4 authored dictionary labels for category controls, picker buttons and options continue to own those fields; do not rewrite them.
- Offline PWA precache includes new translation code; cache stays `sgbuddy-shell-v75` until a later production packaging release.

## Verification
- `node scripts/check-v450.mjs` — 15 keys, all 12 languages, strict selectors, source protection and regression integration.
- `node scripts/browser-qa-v450.mjs` — 390px mobile + 1366px desktop, every locale, saved food area/craving, preserved official stall identities and MUIS original; reselect Discover tab and verify ARIA remains translated.
- Full `check-all` suite, legacy multilingual CI, and V4.3 rendered-screen evidence audit run in GitHub Actions.

## Outstanding
Additional unreviewed first-party Food picker/provider UI, errors/statuses and dynamic content; all persona combinations, Safari/iOS and Android installed PWA/manual native-speaker verification. **No certified whole-app percentage.**
