# SGBuddy V4.18.0 — Better Singapore Events & Discovery

**Status:** feature/sgbuddy-v4.18-events-quality, unreleased RC. Base V4.17.0 production `712126ed382bbfa824bc1bb74c8faf9ebb949c78`.

## Development waves
1. **Discovery:** Singapore-local *Today*, *Next 7 days*, and *Next 30 days* windows. Preserve Weekend, Upcoming, Free, Markets and Family, plus regional and category filters. Search title, venue, summary and published source names. No new geolocation or booking availability claims.
2. **Editorial intelligence:** Read-only `node scripts/event-source-health-v418.mjs --markdown` and `--json` views list approved publication coverage, publication snapshot, queued candidates, missing source evidence, stale published records and official source coverage. `--check` fails if any candidate leaked into publication or source registry is invalid. Daily review reports show this information without automatic approval.
3. **UX + localization:** 12-language time window and search labels, responsive input, published-result counts, snapshot as-of date and strong distinction between a dated official-source record and confirmed current ticket availability. Unapproved/discovery-only records remain hidden. No automatic publisher scraping from the client.
4. **Release candidate:** V4.18.0 runtime, shell v83, preserved `sgbuddy-offline-packs-v480` (all 3 downloaded packs and 13 JSON files) and V4.15 recovery journals; automated browser QA and full historical regressions. No secrets, new paid API, database migration or production release.

## Human editorial and platform signoff still required
- Events are from dated official/curated snapshots. Existing candidate queue still needs a human who checks specific official detail pages, event titles, dates, public entry, ticket/registration policies and republishing rights. **No review-queue candidate is promoted by code or by the scheduled job.**
- This feature does not claim real-time Singapore event or ticket availability, nor that all 35 source registry URLs represent functioning integrations.
- Native-speaker language accuracy and actual physical iOS/Android installed-PWA offline force-quit/restore, Web Lock support and storage pressure are not certified by Chromium browser tests.
- Production remains V4.17.0 until a distinct production release authorization and smoke tests; V4.17 deployment `dpl_JDeUC5PhVtEk1DSSqksFgUWMbuhx` is rollback target.

## Release gates
`node scripts/check-v418-discovery.mjs`, `node scripts/event-source-health-v418.mjs --check`, `node scripts/browser-qa-v418-events.mjs` served on localhost, `npm run check`, preexisting offline/translation/Events CI, full GitHub Actions on the exact final SHA and Vercel preview QA.
