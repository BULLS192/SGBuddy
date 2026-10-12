# SGBuddy V3.4 — Dynamic content translation
V3.4 is a development branch stacked on V3.3 (PR #35). Neither main nor production is changed.

## Delivered
- 28 additional source-locked, authored strings in the 12 existing locales: account overview, first-party PM2.5 explanation, journey result labels, and Merli help/privacy/bookings.
- Four comparison modes now render translated captions around **unaltered** provider route names, operator notes, fare numbers, units, warnings and disclaimers. Source-owned fields are HTML-escaped; API error messages are not rewritten.
- Switching language rerenders cached comparison data without a second journey API call. Saved destinations and account email remain intact.
- Weather panel translates only the application-owned explanatory suffix and the regional label; provider summaries, interpretation and risk wording stay authoritative and in their original language.
- Merli has three clickable, multilingual first-party help, privacy and booking messages, without replacing its source-checked existing replies.
- New V3.4 assets are precached in service-worker shell v63; the app badge shows V3.4.

## Coverage and limitations
V3.3 registers 272 first-party message keys per locale. V3.4 adds 28 more, bringing the **registered catalogue** to 300 keys per locale / 3,600 including English. This does **not** represent a whole-app completion percentage, and entries still require editorial and native-speaker verification. Other provider-owned weather statements, account API errors, external operator service notes, uncatalogued legacy UI, eligibility terms and open-ended Merli conversations remain outside the V3.4 scope.

## Validation
Run `node scripts/check-v340.mjs`, `node scripts/localization-inventory-v340.mjs --json` and `node scripts/check-all.mjs`. The Chromium suite `node scripts/browser-qa-v340.mjs` requires a local HTTP server on port 8765 and Playwright Chromium. It checks 12 locales, mobile/desktop widths, reactively updated journey results without refetch, safe source values, account/weather labels, Merli shortcuts and locale persistence. Native-speaker review and installed-PWA upgrade testing remain manual release gates.
