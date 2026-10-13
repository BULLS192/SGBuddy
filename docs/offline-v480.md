# SGBuddy V4.8 — Offline packs, V4.5+ reconciliation & event discovery

Development branch: feature/sgbuddy-v4.8-offline-and-event-ingestion. Stacked on V4.7 -> V4.6 -> V4.5. Main and production untouched. The V4.2.0 visible badge remains unchanged.

## Offline packs
Three opt-in packs: Calendar/events; essentials/places; food. Browser CacheStorage, complete-batch downloads, explicit update/remove, download date, network/offline indicators and 12 locale labels. The service worker serves first-party shell/cache when offline, does not intercept third-party maps or real-time API responses, and retains a dedicated downloaded pack cache on upgrades. Map tiles omitted pending licensing. Saved places/itineraries remain in existing browser local storage.

## Source discovery
Suntec JSON collection format is experimental; the original Suntec iCal collection URL returned HTML and has been retired. NEA openly documents an upcoming events RSS feed. Neither automatically publishes events. Parser requires explicit event date, official same-host link, public access review and leaves entries in a review-only queue. Scheduled GitHub Actions flow on default branch checks feeds and retires expired approved entries only on changed data, without committing on unmodified days.

## Multilingual reconciliation
All 12 language packs stacked from V4.5 are preserved, including V4.6 holiday and V4.7 event UI. V4.8 adds 24 localized offline control labels across 12 locales. Official event names, venue names, addresses and original links remain untranslated. Prior native-speaker review and any dynamic untranslated content are not certified complete.

## Limitations
Offline live rail/bus, weather, mapping, ticket inventory and booking are unavailable. Full Safari/iOS and Android installed-PWA, storage quota/eviction checks and native speaker proofing remain. Publisher access/permission review is required before any new feed candidate can be made public. No full-app translation percentage is claimed.

QA: node scripts/check-v480.mjs; node scripts/check-event-feeds-v480.mjs; node scripts/browser-qa-v480.mjs under static HTTP/Chromium.
