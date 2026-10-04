# SGBuddy V1

Mobile-first installable PWA for Singapore transport, weather and travel context. It is deliberately a separate service so FREYA and Providence can consume the same normalized data without duplicating API work.

## What V1 does

- iPhone-friendly PWA: add to Home Screen, standalone display, offline shell.
- Nearby bus stops using browser location + LTA Bus Stops/Bus Arrival APIs.
- Manual 5-digit bus-stop lookup.
- Train disruption summary from LTA Train Service Alerts.
- Traffic incident summary from LTA Traffic Incidents.
- 2-hour weather adapter for data.gov.sg, with graceful demo fallback.
- Resident / Traveller mode.
- Traveller mode can save a hotel locally and open one-tap directions back.
- FREYA-ready deterministic advisor using current context.
- `/api/snapshot` normalizes rail + traffic + weather for future FREYA/Providence use.
- Explicit demo mode when LTA credentials are not configured.

## Live data setup

1. Register for an LTA DataMall Account Key.
2. Add `LTA_ACCOUNT_KEY` in Vercel Project Settings → Environment Variables for Production, Preview and Development.
3. Redeploy.
4. Optional: add `DATA_GOV_SG_API_KEY` if you want higher data.gov.sg limits.

The LTA key stays server-side in Vercel Functions; it is never sent to the browser.

## Deploy

Import this repository into Vercel, then add the environment variables above. No build command or framework is required; Vercel serves the static PWA and `/api/*.js` as Node serverless functions.

## Local development

Install the Vercel CLI and run:

```bash
vercel dev
```

Copy `.env.example` to `.env.local` and add your key for live LTA data.

## V1 limitations / next wave

- Nearby stops require the LTA key; demo mode uses a Tanah Merah example.
- Destination routing currently hands off to Google Maps. V2 should add Singapore-native journey planning.
- Weather adapter should be validated against the current data.gov.sg schema after first deployment.
- STB TIH tourism content is intentionally held for V2.
- FREYA text generation is not wired yet; V1's advisor is a deterministic context engine.
- Providence integration is read-only via `/api/snapshot` until we add map layers.
