# SGBuddy V3.11 — Screenshot-driven home localization

## User-reported regression

A Chinese-language resident screenshot showed English **station search**, **Resident mode**, **Change mode**, **CURRENT CONTEXT / Near you**, **rail and traffic status**, **weather and humidity**, **fourth shortcut (Everyday apps)**, **Merli resident tips**, **NEXT UP / impending departure**, and **Weather, air quality & daily insights**. The failure affects all 12 languages: app-owned messages rendered *after* static dictionaries apply.

## Applied in development

- **46 home/localization keys × 12 locales = 552 authored entries**, and **10 verified forecast/PSI vocabulary items × 12 locales = 120 entries**. Native speaker review remains pending.
- Source-owner fixes in **`app-ux-v170.js`**: language-dependent rendering for all five modes, persona cards, shortcuts, account/explore mode, Merli title/intro/buttons. The state remains selected by the original user profile; translation does not reset mode. Native labels are sourced from existing V3.7 per-mode translations.
- Scoped DOM messages in **`app-i18n-home-v311.js`**: explicit first-party anchors only (station input, context, transport metric headings, Next Up, update time, weather label). Both strict source matching and a small set of numeric templates preserve numbers. Unrecognized official/provider strings and user/route data are untouched.
- Known weather labels, common 24-hour PSI condition and weather UI units are translated without replacing the actual forecast, numeric values, official place names or provider URLs.
- Installed-app asset cache incremented to v68. V3.11 build badge is `v3.11.0`. Updated stale QA assertions, not their behavioral expectations.
- Registered first-party UI dictionary **451 keys per locale**, compared with 405 previously. Authored classified inventory **953 units** per locale, compared with 907, **not** whole-app coverage.

## Verification

```bash
node scripts/check-v3110.mjs
node scripts/check-all.mjs
# Chromium in GitHub Actions:
node scripts/browser-qa-v3110.mjs
```

V3.11 Chromium tests perform a **12-locale loop at desktop and 390px mobile viewport**, assert home persona, shortcuts, station labels, Merli, transport/air/weather messages, interpolation and source protection. Existing V3.2–V3.9 tests remain active.

## Boundaries and next steps

This wave addresses the **specific screenshot and the associated shared home-rendering architecture**, not every English word across all conditional screens. General provider descriptions, every travel booking, all five persona's text semantics, complete data content and open-ended Merli responses require further real-device/runtime sweeps. **95–99% overall cannot yet be asserted** because a measured whole-app reachable denominator and native review are missing.

This is a development wave staged on PR #43; do not merge/deploy main without a release request.
