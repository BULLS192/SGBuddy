# SGBuddy V4.10 — Discover taxonomy, Account diagnostics, Food filters

**Development candidate, stacked on V4.9 PR #61.** Production/main are untouched; the V4.8 offline/events stack remains intact.

## Changes
- 15 audited first-party place-type choices in Discover, translated to all 11 non-English locales (12 languages total); preserves the original `option.value` (source classification keys) for filtering, saved state, analytics and shared links.
- 15 explicit Account/Food authored labels across 12 languages, including developer endpoint heading, system health context, password reset caption, Food search and filter aria labels, historical-award filter caption.
- 30 total authored source strings × 12 locales = 360 localized dictionary entries. The category filter content is a classification label, not an official business name: original venue titles, neighbourhoods, stall names, provider content and original MUIS warning remain untouched.
- Dynamic language changes and lazy Discover listing loading update translated text without changing current filter selection, user input, options values or API endpoint paths.
- No generic DOM traversal or machine translation. All selectors, potential values and permitted copies are explicitly enumerated.
- Preserves offline/event scripts and `sgbuddy-offline-packs-v480`; adds locale pack and runtime to PWA shell precache without changing `sgbuddy-shell-v75` or live version.

## QA
`scripts/check-v4100.mjs` checks 12 dictionary packs, stable machine keys, runtime boot and offline source safety.
`scripts/browser-qa-v4100.mjs` checks 12 locales on 390px/1366px and preserved options, Food warning, offline/events panel and zero browser errors.
GitHub Actions also runs legacy V3.x/V4.x QA and V4.3 rendered-screen evidence audit.
Manual native-speaker/Safari/device/account-sign-in QA remains outstanding; observed text-change rate must **not** be described as certified whole-app completion.

## Release
Merge only in sequence after PR #61; PR is draft until the coordinated production promotion.
