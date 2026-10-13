# SGBuddy V4.3 — Rendered multilingual coverage evidence

Status: **development only** on branch `feature/sgbuddy-v4.3-rendered-coverage-audit`. Production stays on **V4.2.0**. No release/version/cache change.

## Why

The ~87% translation completion quoted after V4.2 was an **estimate**, not a measured coverage percentage. The previous 553-key inventory is an authored dictionary subset, not a denominator for every element, mode and error branch in the application. V4.3 must not report an unsupported 95%.

## Automated coverage (first pass)

- Chromium, **390 × 844 mobile and 1366 × 900 desktop**.
- All **11 non-English translations**, compared with the live English baseline (**12 total languages**).
- **18 rendered states per viewport**: Today, Transport, Saved, Account, nine Discover categories (including Travel, My Trip and Facts), four Food tabs, Merli assistant.
- Initial mode is **Visitor** with isolated synthetic browser storage; no real user/account data.
- Reads visible text nodes, form placeholders, native select options, ARIA labels and titles. Tracks deterministic DOM selector paths and locale/viewport/state evidence. Does not replace/seed the displayed text.
- Excludes numeric/unit/brand invariants; marks protected business/place identities separately; quarantines ambiguous editorial/provider content rather than assuming it is translated or untranslated.
- Flags unchanged English UI, changes from English, missing rendered slots, source-owner review and screens not observed.
- Emits `coverage.json`, `triage.csv`, `summary.md`, and representative mobile screenshots (only synthetic anonymous browser profile) as short-retention GitHub Actions artifacts.
- Static classifier unit test ensures **wholeAppTranslationPercent: null**.

## Reading the result correctly

`observedChangeRatePercent` is **changed first-party UI slots / comparable first-party UI slots** for the *sampled scenarios*. It is evidence of a text difference, **not** validated translation correctness or full app completeness. The unit of comparison is a rendered slot for a scenario/viewport, so repeated strings may be counted more than once. A string unchanged from English might legitimately be the same in another language; source review is necessary.

`sourceOwnershipReview` means that published editorial notes, official data and operator claims must be checked for ownership and safe localization; these are excluded from the observed UI change-rate denominator.

`missingAfterLocaleSwitch` signals mismatched or absent DOM slots; it is not automatically an untranslated string.

## Next steps before a whole-app figure can be certified

1. Inspect the output artifact and adjudicate high-frequency English candidates with native-language reviewers. Record exceptions and source ownership.
2. Extend the screen/state matrix to Resident, Student, Business, New in SG, login and error responses, and authenticated-only/conditional flows.
3. Validate actual translations for appropriateness, semantics and medical/payment/halal warnings (not merely different text).
4. Reproduce on Safari/iPhone and Android installed PWAs and verify persistence/offline.
5. Define a complete and independently reviewed first-party slot denominator with accepted exclusions. Only then report a whole-app percentage against 95%.

## Running locally

Install Playwright (if needed), `npx playwright install chromium`, then serve SGBuddy locally from the repository root on port 8765 and run:

```bash
node scripts/check-v430.mjs
node scripts/browser-audit-v430.mjs --out-dir=artifacts/localization-v430 --screenshots
```

Source data is not translated by the audit. No external translation service or personal accounts are accessed.

## First observed run — 13 October 2026

The development audit workflow passed, as did the existing legacy QA triggered for this PR (8/8 in total at initial successful commit).

- Non-English **observed first-party text-change rate** across 18 sampled scenarios, mobile and desktop: **32.1–35.5%**, depending on locale.
- It is **not** a whole-app translation completion rate and is **not** comparable with the earlier speculative ~87% figure. Repeated controls, locale-invariant words, unclassified editorial text, conditional states and unreviewed copy remain.
- The exact, per-locale and per-screen results, English text candidates, source exclusions and screenshots are in the `SGBuddy V4.3 Rendered Localization Audit` workflow artifact. Review its `priority.md` and `triage.csv` before specifying V4.4 translations.
- **Conclusion:** the older ~87% completion planning estimate should not be treated as established evidence. More localization work may be required than previously assumed; a verified path to 95% must be based on reviewed first-party UI inventory plus additional modes and branches.
