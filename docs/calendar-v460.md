# SGBuddy V4.6 — Singapore Public Holidays & Event Source Foundation

**Branch:** `feature/sgbuddy-v4.6-holidays-events-foundation`, stacked on the **V4.5** working branch.
**Status:** Development only. Existing `main` / production and the V4.2.0 badge remain unchanged.

## Shipped in this branch
- Official **2026–2027** MOM public-holiday snapshot, including observed holidays (26 records, dates stored in SG local timezone convention).
- Pure reusable holiday date utilities, upcoming list, next Friday/Monday long weekend detection; strict Singapore-local current date.
- Discover "What's On Singapore" section, plus Today dashboard shortcut. Holiday source attribution goes to official data.gov.sg dataset.
- **34 candidate official calendar endpoints** covering malls, EXPO, Suntec convention centre, MBS expo, galleries, attractions, NParks, community and public events.
- Candidate sources link to their own site, and **are not represented as verified event listings, live availability or an ingesting feed**.
- 18 SGBuddy-authored interface strings translated across **12 supported locales**. Holiday names, venue names and publisher URLs preserve official forms; native review remains pending.
- Added static holiday/source datasets and module assets to existing PWA precache without changing the production version badge or established V4.5 cache revision.

## Official datasets
- [MOM 2026](https://data.gov.sg/datasets/d_149b61ad0a22f61c09dc80f2df5bbec8/view)
- [MOM 2027](https://data.gov.sg/datasets/d_0ba69fc6d56717ff0bf8083c6af3bb84/view)
- [Consolidated holidays](https://data.gov.sg/datasets/d_8ef23381f9417e4d4254ee8b4dcdb176/view)

Dataset snapshot date **13 October 2026**; official consolidated dataset last updated **3 July 2026**.

## Verification
- `node scripts/check-v460.mjs`: schema, observed dates, next long weekend, unique sources, HTTPS links, 12 locales, PWA assets and boot integration.
- `node scripts/browser-qa-v460.mjs`: Chromium at mobile/desktop, source filters, language switching, attribution and overflow. Requires Playwright and a localhost HTTP server.
- Existing V4.5 and legacy checks should remain green.

## V4.7 / V4.8 remaining
- Verify each candidate URL, identify permitted APIs/RSS/ICS exports; build provenance-based ingestion, de-duplication, status transitions, cancellation and expiration.
- Do **not** scrape publishers without checking their conditions of use and robots controls. Do not infer an event is currently on solely because a venue has a calendar.
- Add "This weekend" only when individual dated events are ingested with official sources.
- Add periodic ingestion/sync diagnostics and notification monitoring, without deploying expensive frequent workflows prematurely.
- V4.8: downloaded offline essentials packs, cache freshness/capacity management, manual iOS/Android installed PWA testing, and handling for maps/tiles license restrictions.
- Preserve stacked multilingual fixes and native-speaker review without falsely claiming whole-app coverage.

### Localization inventory integration
V3.8's existing 16-file authored editorial denominator now explicitly excludes the two new **source-owned factual calendar datasets**; they are recorded in a separate `sourceOwnedCalendarSnapshots` field rather than silently inflating or shrinking translation completion. UI copy is accounted for in V4.6's 12-language dictionary; native proofreading is still required.
