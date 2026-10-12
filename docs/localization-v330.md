# SGBuddy V3.3 — Core application UI and system localization

## Scope

This wave follows the released V3.2 branch and adds **30 authored, source-locked interface phrases in 12 locales** (English plus 11 translations).

Translated groups:

- Account and device sync: account sheet title/intro, email confirmation warning, local copy warning, password-recovery controls, sync action, account overview and legacy device-link cautions.
- Dynamic first-party cloud profile notices: cloud sync state, pending/local fallback and invalid-profile-link warnings when those exact English messages appear in scoped UI slots.
- Travel comparison: panel title, method comparison headline, estimated-routing explanation, destination placeholder, empty/loading state, detailed route action, and sort controls.

Translation is only applied when the current UI text matches a registered first-party English source phrase or the same element still carries the last reviewed translated phrase. **Other text must not be changed**, particularly user-entered destinations, email addresses, official provider messages, estimated fares, live travel measurements, immigration/eligibility terms, or addresses.

The new app module `app-i18n-system-v330.js` is loaded after the existing app UI modules. A scoped mutation observer re-applies translated text when legacy account/compare components reconstruct their own UI; it does not traverse arbitrary user content or external provider responses. `sw.js` uses cache `sgbuddy-shell-v62` and precaches both the V3.3 module and catalogue.

## Coverage reports

- `node scripts/localization-report-v310.mjs --json` measures known source-locked content categories, including verified facts, core-app summaries, food descriptions and historical stall notes.
- `node scripts/localization-inventory-v330.mjs --json` reports exact, **per-locale completeness of nine declared first-party message packs**, together with counts of entries unchanged from English (a review queue, not automatic proof of missing translation) and candidate English-only app literals.
- `node scripts/localization-inventory-v330.mjs --out=artifacts/coverage.json` emits a machine-readable report. Create the destination directory before running it.

**Neither report measures overall app translation percentage.** Uncatalogued UI fragments, error payloads, dynamic third-party content, server responses, long-form Merli output and native-speaker accuracy have not been assigned a defensible denominator. Do not promote a manually estimated 65%, 80% or 100% as a measured production-wide figure. The V3.3 report is the baseline for systematic completion.

## QA

```bash
node scripts/check-v330.mjs
node scripts/localization-inventory-v330.mjs --json
node scripts/check-all.mjs
node scripts/browser-qa-v330.mjs
```

The browser test uses mobile and desktop Chromium viewports and a local HTTP server on port 8765; it checks all 12 locales, account and comparison UI, the localized unlinked-profile label without changing real IDs, source-locked device sync, original vendor errors, unaltered entered destinations, viewport overflow and locale persistence after reload. The compare prompt no longer incorrectly promises only three modes when four may be returned. CI runs the test in the existing V3.2/V3.3 browser workflow.

## Beyond this wave

This release does **not** translate every data-driven line of the comparison output, every account error, all source-owned service eligibility fields, long-form open-ended Merli replies, or untranslated historical operator/vendor records. Their English original remains authoritative.

Next translation wave should tackle other remaining first-party weather, transport and account runtime messages, while keeping provider warnings verbatim unless source-checked. After that, complete native-speaker review for legal, eligibility, healthcare and financial texts.
