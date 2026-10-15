# My Trip 2.0 — V4.19 Wave 1 (development only)

This extends the existing My Trip planner; local device key `sgbuddy-my-trips-v260` and schema remain unchanged.

Added read-only day checks (count of timed stops, duplicate scheduled times, missing street addresses) and a Google Maps walking-directions handoff for the first five stops. The route uses stored stop order, with no new geolocation, price, opening-hours, accessibility or ETA claims. New day labels and caveats are provided in all 12 app locales.

Existing trip share, text download, local restore, event-to-trip, manual stops and saved trip workflows are retained.

Before a future production release: include browser QA, test on physical Safari/Android PWA, and increment the service-worker shell with release-version regression updates. This PR does not authorize a V4.19 production deployment.
