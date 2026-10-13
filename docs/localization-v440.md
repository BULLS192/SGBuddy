# SGBuddy V4.4 — Prioritized First-Party Localization

**Status:** Development candidate stacked on V4.3 audit PR #55. **Production remains V4.2.0**; badge and service worker cache version stay unchanged until authorized release packaging.

## Implementation
- First implementation wave driven by V4.3 scored source-locked DOM evidence: **38 authored messages in English plus all 11 non-English locales = 456 entries**.
- **Discover:** Singapore Discover heading, category aria label, explanatory listing links.
- **Account:** 10 newly scoped visible account and data-status labels (refresh/diagnostics, feeds, titles), alongside candidate account-copy translations already owned by V3.3.
- **Saved:** saved places, apps and facts, transport favourites and departure action copy.
- **Food:** food library heading, saved-stalls filter, pagination, food stall Save/Saved and map-address action labels.
- **Today:** trip intelligence and context panel headings.
- Text replacements are restricted to known first-party labels and exact previously authored variants. No account credentials, official records, provider statements, stall names, user-input values, addresses, price/halal statements or original MUIS safety warning are altered.
- Localized content updates on language switching and narrowly scoped re-renders using MutationObserver. Input controls and buttons remain interactive.
- Browser QA covers 12 languages on 390px mobile and 1366px desktop. Existing V4.3 rendered audit repeats to show measured effect. Service worker adds both new files to precache (cache generation advances only on release).

## Caveats and next focus
Authored translation strings need native-speaker semantic checks. No certified whole-app translation percentage is claimed: many native, conditional and backend-generated messages are still outside the enumerated 38 keys. Proceed with further high-frequency Account/Food/Today messages and V4.3 pending native and PWA reviews. Keep **V3.11.1 Merli avatar hotfix**, **V3.12 Saved/journeys**, and source-protection logic intact.

## Regression ownership correction

V3.3 `SYSTEM_I18N` already exclusively owns `#accountSheetTitle`, the account introduction, password recovery and both account-note elements. V4.4 deliberately leaves those bindings to V3.3 to preserve established locale-switch translations and earlier browser QA. The new dictionary contains candidate synonyms for editorial review, but only selectors not already owned by V3.3 are allowed to run.

The ACCOUNT and DATA CORE eyebrow labels are already translated by the legacy core UI module (including case-normalized English), so V4.4 does not claim ownership or override them. This prevents duplicate translations while the remaining visible Account-view controls are covered by V4.4.
