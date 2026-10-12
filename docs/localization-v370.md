# SGBuddy V3.7 — Context-aware localisation and JavaScript audit

**Branch:** `feature/sgbuddy-v3.7-context-l10n-audit` stacked on V3.6 PR #38, following V3.5 #37, V3.4 #36 and V3.3 #35. **Do not merge to main or deploy production without explicit authorization.**

## Nine remaining dynamic cases: implemented

V3.6 left nine first-party UI targets for deeper source-aware localization:
`#modeText`, `#personaFocusTitle`, `#personaFocusCopy`, `#journeyMapTitle`, `#personaPanelLabel`, `#personaPanelTitle`, `#personaPanelCopy`, `#placesPersonaHint`, `#dataCoreStatus`.

V3.7 adds the related first-party Places heading (`#placesSection h2`). Five personas × nine owned strings, plus seven global message templates/states, are authored in all 12 languages: **52 new keys per locale**. The registered catalogue becomes **393 populated first-party keys per language**, **4,716 entries including English**, across 14 packs. This is **not** a whole-application translation percentage.

The runtime only replaces known strings from exact first-party English and registered localized values. Route titles after `Recommended · ` are preserved verbatim, as are addresses, provider warnings, prices, account identifiers and user input. Places ranking summaries interpolate a numeric result count and localized, enumerated persona copy; they never translate arbitrary provider content or trigger network requests. Translations update on language changes, persona changes and re-rendered content.

The nine targets are covered by 12-language Chromium mobile/desktop QA. The V3.2–V3.6 regressions still run.

## JavaScript literal review

`scripts/inspect-js-localization-v370.mjs` scans first-party `app*.js` files for output literals through `toast`, `accountMessage`, `textContent`, `innerHTML`, `placeholder` and `withBusy`. It records file/line, literal, heuristic domain and whether an exact authored source string is registered. An unmatched literal is an **investigation queue entry, not evidence of missing translation**. The scan is intentionally partial: templates, provider data, dynamic backend responses and many component-generated strings are not exhaustively enumerated.

```sh
node scripts/inspect-js-localization-v370.mjs --json
node scripts/inspect-js-localization-v370.mjs --out=js-localization-review.json
node scripts/check-v370.mjs
node scripts/check-all.mjs
```

## Native-speaker review handoff

`scripts/export-native-review-v370.mjs --out=v370-human-review.csv` creates **572 review rows** (52 messages × 11 non-English locales), each with exact source English, candidate translation, locale, message key, risk tag, status, reviewer, review date and notes. Every entry is **pending**; no human editor has approved these strings. The earlier `docs/native-review-v360.csv` 33 checkboxes likewise remain pending.

Native-speaker reviewers should check context, UI fit, cultural nuance, ambiguity, transport and air quality accuracy, screen reader accessibility, finance terminology and placeholder preservation. The automated QA checks populated strings and placeholder consistency, not native language quality. A high-trust release needs human approval and real-device/PWA cache upgrade testing.

## Known scope gaps

Additional English JS literals outside the nine resolved dynamic targets, conditional/free-form Merli messages, source-backed food/guides, native-speaker quality and all third-party translations remain separate follow-up work. `wholeApplicationTranslationPercent` deliberately remains `null` because there is no verified exhaustive denominator. A claim of 100% applies only to the registered authored dictionary slots.
