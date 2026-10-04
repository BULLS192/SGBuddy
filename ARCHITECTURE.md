# Architecture

```text
Browser / iPhone PWA
        |
        v
Singapore Companion API
  |        |         |
  v        v         v
LTA      data.gov.sg  future STB TIH
  |
  +--> normalized /api/snapshot
                  |          |
                  v          v
                FREYA    Providence
```

## Design rules

1. Government/API credentials live only in server-side functions.
2. Consumer UI does not depend on FREYA or Providence availability.
3. FREYA and Providence consume normalized data rather than calling every source directly.
4. Any unavailable feed fails soft and advertises demo/fallback status rather than pretending data is live.
5. No account is required in V1. Personal settings (mode, hotel) stay in localStorage.

## Suggested Wave 2

- Add OneMap-native place search and routing.
- Add GTFS Realtime Train Trip Updates and richer station status.
- Add rain radar layer + “rain arriving” inference.
- Add saved Home/Work/Favourites and automatic commute cards.
- Add STB TIH attractions, F&B, events and itinerary content.
- Add multilingual traveller mode.
- Add Providence traffic cameras, incidents, flood alerts and crowding map layers.
- Replace deterministic advisor with FREYA tool calls to `/api/snapshot` and journey endpoints.
