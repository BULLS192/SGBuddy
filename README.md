# SGBuddy

SGBuddy is a mobile-first Singapore mobility companion and shared data layer for future FREYA and Providence integrations.

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
- FREYA-ready deterministic advisor using bus, rail, weather and disruption context.
- `/api/snapshot` for a normalized FREYA / Providence context feed.

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
- STB TIH attractions, events, hotels and F&B.
- Multilingual Traveller Mode.
- Providence map layers and FREYA tool calls.
