# SGBuddy V4.8 — Offline packs, V4.5+ reconciliation & event discovery

Development branch: feature/sgbuddy-v4.8-offline-and-event-ingestion. Stacked on V4.7 -> V4.6 -> V4.5. Main and production untouched. The V4.2.0 visible badge remains unchanged.

## Offline packs
Three opt-in packs: Calendar/events; essentials/places; food. Browser CacheStorage, complete-batch downloads, explicit update/remove, download date, network/offline indicators and 12 locale labels. The service worker serves first-party shell/cache when offline, does not intercept third-party maps or real-time API responses, and retains a dedicated downloaded pack cache on upgrades. Map tiles omitted pending licensing. Saved places/itineraries remain in existing browser local storage.

## Source discovery
Suntec JSON collection endpoint has been live-probed successfully; it returned 99 upcoming venue records and 51 review candidates on 13 October 2026. The source provides discovery candidates only (individual admission/public suitability and publication rights not yet verified). The original Suntec iCal collection URL returned HTML and has been retired. NEA openly documents an upcoming events RSS feed. Neither automatically publishes events. Parser requires explicit event date, official same-host link, public access review and leaves entries in a review-only queue. Scheduled GitHub Actions flow on default branch checks feeds and retires expired approved entries only on changed data, without committing on unmodified days.

## Multilingual reconciliation
All 12 language packs stacked from V4.5 are preserved, including V4.6 holiday and V4.7 event UI. V4.8 adds 24 localized offline control labels across 12 locales and translated event categories and short summaries for the eight curated records across the same 12 locales. Official event names, venue names, addresses and original links remain untranslated. Prior native-speaker review and any dynamic untranslated content are not certified complete.

## Limitations
Offline live rail/bus, weather, mapping, ticket inventory and booking are unavailable. Full Safari/iOS and Android installed-PWA, storage quota/eviction checks and native speaker proofing remain. Publisher access/permission review is required before any new feed candidate can be made public. No full-app translation percentage is claimed.

QA: node scripts/check-v480.mjs; node scripts/check-event-feeds-v480.mjs; node scripts/browser-qa-v480.mjs under static HTTP/Chromium.

### Successful discovery proof
The V4.8 Suntec Squarespace JSON adapter decoded 99 upcoming records and generated 51 dated, official-domain-linked candidates. The NEA official RSS endpoint was reachable but returned zero items. The 51 Suntec records remain review-only and are not claimed as publicly bookable/attendable. Publishing requires checks of eligibility, start/end dates, source stability, venue, admission and permissions.
