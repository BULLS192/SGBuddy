# V3.11 — Home surface first-party localization

### Reported failure
User screenshot in Simplified Chinese showed translated navigation alongside English station-check headings, resident-mode banner, current-context metrics, Merli shortcuts, departure countdown and parts of the weather card. This failure affected other locales. V3.11 is a **targeted home screen runtime repair**, not a claim of overall 95–99% completion.

### Implemented
- Added 38 source-authored UI key families × 12 locales = **456 localized message entries**, building on the already populated core UI dictionary.
- Source-locked, reactive localization for 23 explicit first-party home selectors; existing core translations for station-check name, its label and current-area label; localized `Check` action.
- Re-rendered resident shortcut titles and explanatory copy, resident-mode summary, Merli tip and prompt, nearby location privacy note, weather context metrics and NEXT UP. The live departure interval is localized with numbers preserved.
- Only the **enumerated** weather descriptor “Partly Cloudy (Day)” with its humidity and rainfall suffix is localized; other weather/service phrases require their own source review. This avoids guessing official forecast meaning. Stops, station names, service names, PSI numbers, personal addresses and unexpected provider alerts are untouched.
- All locale states are rechecked after language, persona and weather events plus scoped home widget mutations. No broad DOM machine translation.
- Bumped offline shell cache from v67 to v68 and precached the two V3.11 translation modules to avoid mismatched installed PWA versions.
- Test coverage: static 12 × 38 key and placeholder assertions; 390 px and desktop Chromium QA switch all 12 languages, force app-owned re-renders, verify translated headings, NEXT UP countdown, known weather descriptor, station inputs, Merli and shortcut messages; provider/route/address source guards.
- The source-authored inventory denominator grows from **907 to 945** units per locale (registered UI keys 405 → **443**). Counts **do not** establish whole-app localization or native-linguistic sign-off.

### Known next tasks
Personalized UX for non-resident personas, long-form food/provider text, unclassified API outputs, unsupported weather forecasts, live sensory warnings, conditional user flows and Merli replies. Native-speaking QA remains pending. Previous 75% whole-app figure was an estimate only.

### Release boundary
This PR is **staged on top of V3.10 PR #43**. Production stays V3.9 until separate approval. The visible app-version label remains v3.9.0 on the feature branch while the new V3.11 module and PWA cache v68 are tested, to avoid changing existing unrelated version-specific tests. Update the release label together with broader release readiness before promotion.
