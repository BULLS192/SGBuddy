# SGBuddy V3.11 — Homepage runtime localization, screenshot remediation

The supplied Simplified Chinese screenshot still shows English on first-party home areas: station search, resident-mode summary, shortcuts, current context, next-departure card, and Merli guidance. These fields were not consistently covered by older dictionaries, and many are dynamically re-rendered.

V3.11 introduces 32 first-party home message keys across all twelve supported locales (384 populated translation slots), reuses the existing 12-language transport dictionary for station fields, and the existing resident persona translations. It watches explicitly scoped UI anchors and reapplies localized copy on language/persona/weather changes and DOM re-rendering. Only reviewed source strings or known prior translations are eligible. It does not change train service identifiers, temperatures, official weather feed descriptions, place names, geographic locations, provider links, fares, user text, or live source content.

**Important:** This is a development batch, not proof of 95–99% whole-app translation. All first-party conditional strings and other modes' dynamic shortcuts still need screen-by-screen coverage and a native-speaker review. The earlier 75% is a rough planning estimate.

Before production: full CI and actual 12-language browser review of the user's screenshot screens, responsive layouts and locale-switch persistence. The release version shown by V3.9 remains unchanged on the development branch until coordinated release.
