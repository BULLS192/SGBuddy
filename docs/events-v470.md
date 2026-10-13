# SGBuddy V4.7 — What's On Singapore, Events Registry

**Status: development**. This work is stacked on V4.6, which is stacked on the V4.5 multilingual branch; no production promotion or V4.2 badge change.

## Delivered
- Eight actual dated activities verified **13 October 2026** directly from official Suntec Singapore and Singapore EXPO venue listings, showing dates, venue, access classification and original source.
- Singapore-local weekday/weekend logic (includes multi-day overlap), mode-aware ordering, free/market/family filters, expired/cancelled filtering, stable de-duplication and saved items on device.
- Discover and Home cards, an official-source disclaimer, and source-freshness flag after 14 days; no fabricated live ticket or admission claims.
- 20 control labels translated for 12 app locales. Source-owned event titles, venue names and provider URLs are preserved; English authored summaries are deliberately not displayed in other locales until translation is reviewed.
- Offline PWA cache for public snapshot, source registry and modules.
- Deterministic static data QA and real browser/mobile interaction QA.
- Daily **post-merge** GitHub Actions housekeeping (minimal budget): retire expired entries and commit **only when changed**. **This does not discover or verify new events automatically.** It is intentionally scoped to avoid unreliable scraping; vetted RSS/ICS feeds and authorised provider integrations are next.

## Verified official source pages
- https://www.singaporeexpo.com.sg/events-at-expo/art-riot-2026-villains-and-neer-do-wells/
- https://www.singaporeexpo.com.sg/events-at-expo/zak-salaam-india-expo-oct-2026/
- https://www.singaporeexpo.com.sg/events-at-expo/the-car-expo/
- https://www.singaporeexpo.com.sg/events-at-expo/the-makers-ground-at-expo/
- https://www.suntecsingapore.com/visit-events/hallyu-con
- https://www.suntecsingapore.com/visit-events/fomo-weekend-market-2
- https://www.suntecsingapore.com/visit-events/makers-quest-sg-2
- https://www.suntecsingapore.com/visit-events (Hatcheed)
Events must be reconfirmed before travelling. Promotion-only activities and private conferences intentionally excluded.

## Outstanding, not advertised as complete
- **Source discovery and verification pipeline**: publisher feed permissions, RSS/ICS API adapters, stale/changed event review queue, deduplication across providers and cancellation propagation.
- Individual-day opening hours and verified prices; source images/rights; personalised Merli suggestions and itinerary linking.
- All venue/source candidates remain labelled candidate, not live-integrated.
- Browser QA across all locales, accessibility, Safari iOS/Android installed PWA, manual copy reviews.

## Initial feed-discovery integration
Suntec's publicly linked iCalendar export convention is connected as a **probe/review-only candidate** (the collection-level endpoint is not yet confirmed). The feed parser rejects explicitly private/cancelled entries and places other dated entries into `data/events-review-queue-v470.json` marked `needs-review`. No candidate is published until public access and event details are verified on the individual official listing. A nightly workflow will probe this only after the project reaches the default branch; feed failures cannot create invented events or turn a failed network check into a verified source. The daily job avoids commits when neither the published snapshot nor review queue changed.
