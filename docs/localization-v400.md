# SGBuddy V4.0 — Runtime localization: Food and Discover

Status: development branch `feature/sgbuddy-v4.0-food-discover-l10n`; do not deploy or merge to production without separate review.

## Shipped to the development branch

- 16 food status and safety messages across all 12 locales: result counts, listings that are not confirmed open, MICHELIN/CNA/NEA research attribution, unverified pricing/certification, first-party vendor/brand menu cautions, OneMap match/ambiguous/missing statuses and Merli saved-food empty state.
- 11 Discover messages across all 12 locales: app/place counts, 10,000-fact editorial-review target, source-reviewed fact labels, zero results, paging and per-tab search placeholders.
- 27 first-party keys × 12 locales = **324 populated authored values** (English + 11 target locales). No automatic claims of native fluency.
- Direct context-aware rendering in `app-food-v180.js`, `app-food-tools-v261.js` and `app-v120.js`. Explicit placeholders preserve numeric quantities, NEA award year, official addresses and brand/centre names. Provider content, prices, certification and freeform user input retain source authenticity.
- Reuses `extendedUi().foodGuideOnly` and `extendedUi().foodEmpty` to avoid duplicate and inconsistent content.
- Version V4.0.0, offline service worker `sgbuddy-shell-v68`.

## Measurement: do not inflate the percentage

Known, source-locked, authored inventory now **934 units per locale**, including **432 registered UI message keys**. That denominator is **not the entire application**. No complete estimate over all reachable UI, provider data, conditional flows, personalized Merli replies, or source-authored long-form editorial text is established. `globalWholeAppCompletionPercent` intentionally stays `null`.

V3.9 still had 109 active-JS literal candidates, 340 editorial-looking data fields and 22 server/backend messages queued for review; the counts represent overlaps and heuristics, **not** confirmed missing translations. V4.0 reduces confirmed user-visible food and Discover fallbacks but does not assert those queues are fully triaged or resolved.

## Verification

```bash
node scripts/check-v400.mjs
node scripts/check-all.mjs
node scripts/audit-app-v380.mjs
node scripts/classify-localization-v390.mjs
# With Chromium and Playwright on local http.server 8765:
node scripts/browser-qa-v400.mjs
```

Browser checks cover mobile and desktop, 12 languages, all four food tabs, dynamic counts, vendor disclaimer, Discover filter/search events, no-match responses, facts and horizontal overflow. Preserve the previously passing V3.2–V3.9 regression checks, source protections and service worker cache consistency.

## To reach a defensible 95–99% quality gate

1. Define a **reachable first-party content denominator**: screens, dialog states, form validation, dynamic provider statuses, Merli responses, cross-link panels and source-owned vs authored text.
2. Prioritize remaining high-visibility messages (food discovery provider cards, official place/source cautions, journey and weather status templates) with reviewed source signatures and stable keys.
3. Make translated curated Singapore descriptions searchable while preserving original official names, location data, vendor policies and eligibility conditions.
4. Run one end-to-end mobile and desktop matrix across 12 languages and five personas. Record screenshot state, untranslated app-owned strings, truncation and accessibility.
5. Complete native-speaker review for priority languages and legally/safety sensitive warnings. Use separate metrics for **catalogue population**, **browser-visible localization**, **content field coverage**, and **native quality pass rate**.

Never claim an overall 95% or 99% until the denominator and language-review evidence support it.
