# SGBuddy V4.2 — Runtime conditional, Food & Merli localization
Status: **development only** on top of released production V4.1.0 (commit 0c1c01c). Main and Vercel production remain unchanged.

## Scope
- 30 additional authored first-party messages in all 12 supported languages (**360 catalogue entries**).
- Discover static filters: historical supermarket listings; government, local, and business source types; all neighbourhoods and place types. Values and active filters are preserved during locale switching.
- Food: stall source attribution, historical NEA award year, current-price disclaimer, published date, hawker/vendor menu actions, OneMap loading and unavailable states, failed library fetch. Source-owned names, dishes, addresses, prices, award dates, and licensing claims stay unmodified.
- Merli Makan picker: results count, source caveats, map-search action and empty-filter state; the selected recommendation and message update after language switching without losing the selection.
- Merli facts: verified/review-pending status, dynamic result count, original-source link and empty results. Previously authored fact translations remain source-locked.
- PWA cache v74 and pre-cache of /lib/i18n-contextual-v420.mjs.
- Authored inventory baseline increases from 523 to 553 per locale, **not a verified whole-app completion percentage**. No native-speaker quality certification.

## Verification
- node scripts/check-v420.mjs — 30 keys × 12 languages, placeholder parity, source protection, runtime wiring, PWA and audit.
- node scripts/check-all.mjs — all older static and business/source safety checks, including Merli V3.11.1 and V4.0/V4.1.
- node scripts/browser-qa-v420.mjs — mobile/desktop Chromium across all 12 languages; static controls, Food menu source details, Merli facts, original names and overflow.
- Full CI workflow includes the browser QA and earlier V4.0/V4.1 browser tests.

## Outstanding before any V4.2 production release
- Human native-speaker review for safety-critical warnings, medical/CHAS and dietary wording.
- iPhone Safari and Android installed PWA/offline manual verification.
- Additional first-party static/provider-intro copy and backend-generated error strings; preserve source-origin content.
- Screenshot-based whole-app translation denominator. Target 95–99% cannot be claimed until audited.
