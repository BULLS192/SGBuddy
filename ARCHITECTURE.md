# SGBuddy Architecture

```text
                    Official Singapore data
                 ┌──────────┬──────────────┐
                 │ LTA      │ data.gov.sg  │
                 │ DataMall │ weather      │
                 └────┬─────┴──────┬───────┘
                      │            │
                SGBuddy serverless adapters
         ┌────────────┼────────────┼────────────┐
         │ Bus        │ Rail       │ Context    │
         │ arrivals   │ GTFS/RT    │ snapshot   │
         └────────────┴──────┬─────┴────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
          iPhone PWA       FREYA       Providence
```

## Rail pipeline

1. `GTFSScheduleTrain` returns a short-lived HTTPS link to the current GTFS Schedule zip.
2. SGBuddy downloads the zip server-side and builds station, stop, route and trip indexes.
3. `GTFSRealtimeTrainTripUpdates` returns a short-lived HTTPS link to a protobuf GTFS-Realtime feed.
4. SGBuddy decodes each `TripUpdate`, matches `StopTimeUpdate` entries to a station, and returns predicted departures.
5. The browser receives only normalized passenger data; it never receives DataMall credentials or signed source URLs.

## Design rules

1. API credentials are server-side only.
2. Demo/fallback data is always labelled and never represented as live.
3. FREYA and Providence consume SGBuddy APIs instead of separately duplicating government integrations.
4. The consumer PWA remains usable even when optional AI/operations layers are unavailable.
5. V1/V2 personal places remain on-device; server-side profiles can be added later with explicit user accounts.
