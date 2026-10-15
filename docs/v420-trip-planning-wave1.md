# SGBuddy V4.20 — Wave 1: Itinerary Quality

**Scope:** incremental development on `feature/sgbuddy-v4.20-trip-planning-quality`, based on production V4.19.0. **No production release, merge, automatic booking or editor auto-approval.**

- Trip-wide health summary: days planned, stops, repeated locations across days, same-clock conflicts and missing street addresses. Read-only calculations over the user's existing local trip schema.
- Long day routing: splits all planned stops into Google Maps walking/driving handoffs, each at most five stops with one shared end/start point; no invented ETA, distance or opening hours.
- First-party directory suggestions: same-area **text-label** matches only, excluding saved places and held event candidates. No location or travel-time inference. User explicitly chooses what to add.
- New control text localized across all 12 application locales; compact responsive layout and keyboard-visible focus.
- No new storage schema, account/cloud syncing, payments or external LLM calls.

**Test:** `node scripts/check-v420-trip-quality.mjs`, `node scripts/check-v420-trip-integration.mjs`, `node scripts/browser-qa-v420-trip.mjs` and existing V4.19 regressions.

**Release gate:** this wave retains V4.19.0/v84 on the development branch deliberately. Before a future V4.20 production release, bump service-worker shell and manifest to cache `app-trip-quality-v420.js`, `trip-quality-v420.css`, `lib/trip-insights-v420.mjs`; update version assertions and re-run full PWA/device and multilingual QA. V4.19 production remains unchanged. Physical-device and editorial sign-offs are still required.
