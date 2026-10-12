# SGBuddy V3.6 — Classified HTML strings, reactive states, reviewer gates

Development-only work stacked on V3.5 PR #37. Do not merge to `main` or promote production without the owner's explicit instruction.

## Scope and inventory

All **33 previously unclassified first-party HTML text candidates** from `scripts/coverage-audit-v350.mjs` have been explicitly assigned a defensible category. The 33 were **review candidates, not a proven count of untranslated strings**.

| Category | Count | Policy |
| --- | ---: | --- |
| New localized first-party controls | 14 | 19 reviewed message states across 12 locales |
| Already localized by active app runtime | 5 | Leave the existing translation owner in place |
| Provider-owned information | 3 | Preserve forecasts and public-health source content |
| Proper names / provider brands | 2 | Preserve Singapore and Google Maps as authored |
| Dynamic first-party composition for later audit | 9 | Require context-aware, safe refactor; no blanket DOM replacement |
| **Total** | **33** | All classified, **not** all translated |

The new source-locked UI module handles time-of-day greetings, guest-only Account button, initial unset-location state, verified live/demo badges, unit labels without changing measurement units, Change mode, Back to hotel, Discover Cards/Map/Fit, Sign in/Create account, and location consent actions. Labels update when the user changes language and when the app changes the source state. Unknown text is left untouched, as is an account user's sign-in name.

The catalog increases from **322 to 341 registered authored keys per locale** across **12 localized packs**. It contains **4,092 populated entries including English**, but does **not** establish total application translation coverage.

## Reproducible checks

Run:
```sh
node scripts/check-v360.mjs
node scripts/localization-review-v360.mjs --json
node scripts/check-all.mjs
# With Playwright Chromium installed and the website served at 127.0.0.1:8765
node scripts/browser-qa-v360.mjs
```

`scripts/localization-review-v360.mjs` fails if any of the 33 original candidates is unclassified, registered keys are empty, language dictionaries are incomplete, unit symbol tokens are altered, or provider strings are accidentally bound. Its JSON output includes the protected groups and **nine further runtime composition cases** that still need dedicated translation treatment.

The Chromium suite checks every locale on phone and desktop with language reactivity for all 19 message states, no overflow, persisted language, and protection of personal account names and provider data. Legacy V3.2–V3.5 tests remain active.

## Human editorial review: explicitly outstanding

`docs/native-review-v360.csv` is an editorial handoff for review by fluent speakers. The 11 non-English locales each require three passes: navigation/onboarding, transport/weather/health safety, and money/account/privacy. These are **all pending** and no AI translation can honestly be counted as approved by a native speaker. The CSV includes reviewer, date and notes columns for sign-off.

Beyond the 33 HTML candidates, **nine context-built first-party strings remain** (persona cards, travel mode descriptions, route titles and diagnostic states). Third-party or official descriptions, open-ended answers, provider warnings, and legacy JS review candidates must be evaluated separately with source provenance. Do not derive an application-wide completion percent by dividing catalog keys by an unverified source count.

## Release safeguards

Service worker `sgbuddy-shell-v65`, client badge `v3.6.0`, static and Chromium QA. Manual installed/offline PWA cache-upgrade testing and on-device/native-speaker QA remain release gates. Prior waves V3.3, V3.4 and V3.5 are unmerged, so merge order must be deliberate and explicitly approved.
