# SGBuddy V3.5 — Screen-by-screen localization & measurement

**Development-only stacked branch.** The V3.5 branch starts from V3.4 PR #36 (which itself depends on V3.3 PR #35). Do not merge or promote production automatically.

## What is translated in this wave

A **source-locked set of 23 additional first-party texts** covers eight audited UI zones: Home (trip status and conditions), Move (empty route status), Discover (back to hotel), Saved (device pairing), Money (near-me and FX empty state), Account (sync diagnostics and sign-out), onboarding (persona/location/install prompts), and Merli (welcome and More/Less controls).

All 12 supported locales are populated. All translations are manually authored, with **no blanket DOM translation**. Unknown text from live route services, weather sources, registered providers, financial rates, user input, personal identifiers and official statements remains unchanged. Dynamic statuses are updated only when they match the known first-party English source text or a previously translated version of the same key.

This patch also updates the offline shell to `sgbuddy-shell-v64`.

## Auditing methodology — avoid a misleading global number

The previous ten first-party dictionaries contain **300 populated message keys per locale**. V3.5 introduces 23, for **323 declared authored keys per locale**, across 11 catalogues, 3,876 entries including English.

`scripts/coverage-audit-v350.mjs` measures the **23 explicitly reviewed text slots**, grouped by eight functional UI zones, with fixed editorial weights (1=secondary, 2=primary). The resulting `reviewedScreenPopulationPercent` measures whether a message exists for the locale **in that reviewed sample only**. It does NOT measure semantic accuracy, native-speaker approval, entire screen completeness or application-wide multilingual coverage. English is baseline and cannot be counted as translated.

The report includes:
- Per-screen slot counts, editorial weight, per-locale authored message population, unchanged-English review candidates.
- A conservative queue of visible English-literal DOM controls from the HTML source not matched by V3.5 or earlier mapped selectors.
- Earlier V3.4 JavaScript literal review examples (a heuristic, not a validated count of missing translations).
- Explicit source-owned data exclusions and `wholeApplicationCoveragePercent: null`, because long-form, user-specific, source-supplied and conditional screens are not enumerated in a complete global denominator.

The audit is actionable, not a false claim that the whole application is 100% translated. Next passes should cover conditional account states, all source-reviewed library records, contextual modal variants, Merli free-form replies and native-speaker editorial QA before a whole-app percentage is claimed.

## Developer commands

```sh
node scripts/check-v350.mjs
node scripts/coverage-audit-v350.mjs --json
node scripts/coverage-audit-v350.mjs --out=screen-audit.json
node scripts/check-all.mjs
# With Playwright Chromium and a local server at 127.0.0.1:8765:
node scripts/browser-qa-v350.mjs
```

The V3.5 browser suite checks all 12 locales in mobile and desktop Chromium, original provider/user text protection, localized first-party UI slots, More/Less Merli state and persisted language. Existing V3.2–V3.4 browser suites remain enabled.

## Manual review gates

Native-speaker editorial checks are especially important for medical, immigration, banking and high-stakes descriptions. Also perform manual PWA offline-update testing and visual review of longer translated copy before release.
