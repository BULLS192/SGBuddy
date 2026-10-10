# SGBuddy

SGBuddy is a mobile-first Singapore Travel + Living Intelligence companion and shared Singapore data layer for the future Omnidite Travel Intelligence Core and related experiences.

## Wave 2

- Installable iPhone PWA with offline application shell.
- Nearby bus stops and live LTA Bus Arrival predictions.
- **Nearby MRT/LRT stations and next-train predictions** using LTA GTFS Schedule + GTFS-Realtime Train Trip Updates.
- Search rail stations by public code or station name (`EW4`, `Tanah Merah`).
- Rail disruption summary from LTA Train Service Alerts.
- Traffic incident summary and 2-hour weather adapter.
- Save Home, Work and Hotel on-device.
- Public-transport journey handoff to Google Maps.
- Resident / Traveller modes and one-tap route back to a saved hotel.
- **Merli**, SGBuddy's lightweight Merlion assistant, using curated recommendations and real bus, rail, weather and disruption context.
- `/api/snapshot` for normalized Providence and external-assistant integrations, independent of Merli's interface.

## Live data setup

SGBuddy intentionally displays labelled demo data until LTA credentials are configured.

1. Register for an LTA DataMall Account Key.
2. In Vercel, add `LTA_ACCOUNT_KEY` to Production, Preview and Development.
3. Redeploy (or push a commit).
4. Optional: add `DATA_GOV_SG_API_KEY` for data.gov.sg if required for higher limits.

The LTA key remains server-side. It is sent only to DataMall index endpoints and is never exposed to the browser or forwarded to the signed dataset download URL.

## Rail architecture

`/api/rail` uses two official LTA datasets:

- `GTFSScheduleTrain` — GTFS Schedule zip containing stations, routes and trips.
- `GTFSRealtimeTrainTripUpdates` — GTFS-Realtime protobuf containing predicted per-stop arrivals/departures.

The static schedule index is cached in warm serverless instances for six hours. Realtime trip updates are cached briefly to reduce duplicate calls. The response is normalized into passenger-facing station, line, destination, platform (when supplied) and minutes-to-train fields.

Examples:

- `/api/rail?station=EW4`
- `/api/rail?station=Tanah%20Merah`
- `/api/rail?lat=1.327&lon=103.946`

## Local development

```bash
npm install
vercel dev
```

Copy `.env.example` to `.env.local` and add an LTA key for live data.

## Next wave

- Singapore-native A→B routing rather than external handoff.
- Station crowd density and crowd forecast.
- Richer rail alerts from GTFS-Realtime service alerts.
- Rain-now / rain-arriving intelligence.
- Curated/official attraction and experience sources. STB TIH is not used because the service was discontinued.
- Multilingual Traveller Mode.
- Providence map layers and external-assistant integrations.


## v0.9.0-dev review wave

The isolated development branch adds expanded NEA/data.gov.sg weather and air-quality context, ECB reference FX, MAS-listed money changer discovery, a top-20 Singapore places surface, and the scalable Today / Move / Places / Money / Account information architecture.

This branch is intentionally non-production. See docs/v090-travel-living-wave.md before applying its staged Supabase migration or approving a release.


## V1.2 Discover & Content Intelligence (isolated development branch)

V1.2 was released to production through PR #8 on 2026-10-10.

- Air Quality: extends the existing NEA/data.gov.sg 24-hour PSI and one-hour PM2.5 integration with **regional readings**, a last-updated timestamp, stale/partial status, and an NEA source link. The UI must never describe stale/cached readings as live.
- Discover: a dedicated Discover tab with Eat, Things to do, Shop, Useful apps and Did you know; searchable directory, audience relevance ranking and on-device saved items.
- Initial catalog: `data/discover-v120.json` contains **79 deduplicated venues** covering 80 original category listings, **27 app candidates** and **29 source-reviewed historical facts**. Place details and third-party listings are **curated preview records**, not verified opening hours/prices/availability; iOS/Android buttons open *store searches*, not claimed exact product listings.
- Personas: **Student** is a fifth dedicated mode alongside Resident, Visitor, Executive and New in SG. Student rankings exist in Discover. The legacy Supabase Place Index only accepts four modes, so its nearby-place query temporarily maps Student to New in SG ranking, without changing the Student selection in the app.
- Profile sync compatibility: guest profile stores Student; cross-device account profile stores it in `preferences.mode` while `active_mode` retains a compatible legacy value pending a DB migration. This migration should be reviewed separately before changing production.
- Offline/PWA: static Discover assets are included in the service-worker shell cache. Saved items are local-device only until a dedicated favourites-sync contract is approved.

### Data governance

Master editorial Google Sheet: https://docs.google.com/spreadsheets/d/10H9VHt9fzsaNyEPARFECmQR5ZEH-310UinxHNpg-Cmo/edit

New facts must be **one unique atomic verifiable claim per record** with an exact authoritative citation. The 10,000-fact number is the verified acquisition target, not a completed content count. Source-matched candidates must not be promoted until individually reviewed. Third-party app links, venue existence and operating information must be refreshed before production.

### Release gates

1. Run `npm run check` (includes `scripts/check-discover.mjs`).
2. Test all five modes on desktop and mobile. Switching modes must not jump back to the top, and student must not reset to Resident after refresh, guest sync or account sync.
3. Verify accurate region/PSI/PM2.5 values and fresh/stale/failure handling using actual API responses, including bad/missing tokens.
4. Verify all five Discover tabs, saved filter, keyboard controls, external map/store links, source citations and offline caching.
5. Verify profile security and existing transport, maps, routes, Money and account workflows remain functional.
6. Only then approve preview promotion to `main`.

Note: `vercel.json` currently has `git.deploymentEnabled=false`, so a branch push alone does **not** guarantee an automatic Vercel preview deployment.


## V1.3 — Merli companion (development branch)

- **Identity:** Merli is the only assistant inside SGBuddy. The old FREYA floating button and duplicate advisor panel have been retired; the separate FREYA product outside SGBuddy is unaffected.
- **Avatar:** Reuses the exact approved `assets/merlion-companion.webp` blob from [the earlier companion PR #4](https://github.com/BULLS192/SGBuddy/pull/4). The temporary emoji is no longer used for Merli's launcher or header.
- **Experience:** One **Ask Merli** button and a responsive panel, with subtle 2D idle/listening/speaking/success/warning animations and reduced-motion support. No new 3D dependencies.
- **Intelligence:** The existing deterministic bus, rail, route-planning and rain advisor remains accessible via Merli alongside Discover shortcuts, air-quality navigation and Singapore trivia.
- **Accessibility:** Escape-to-close, focus return, accessible controls and live announcement of responses.
- **PWA:** The existing Merlion image is precached for offline display.
- **Release:** Changes are reviewed in [PR #9](https://github.com/BULLS192/SGBuddy/pull/9) from `feature/sgbuddy-v1.3-facts-merlion`. Production stays at V1.2 until V1.3 is approved and merged.
