# SGBuddy V1.8 — OneMap & Food Library Expansion

**Branch:** `feature/sgbuddy-v1.8-onemap-food-library`. This is a preview/review branch; production remains unchanged until an explicit promotion.

## Library counts and trust levels (10 October 2026)

- **271 named venue candidates** in `data/discover-v120.json` (267 inherited plus 4 centres mentioned in an official NEA 2025 stall-awards notice).
- **57 hawker-stall entries** in `data/food-stalls-v180.json`: **48 research candidates** and **9 documented by NEA's 2025 awards announcement** with historic stall number and award type. An award in 2025 is **not evidence a stall is currently trading**.
- **82 Singapore dish and beverage types** in `data/singapore-dishes-v180.json`. This is a food-culture guide, not live menu inventory.
- **130 AI-assisted official-source-checked facts** in `data/facts-published.json`. A separate 8 claims remain pending in the editorial review file.
- **4 known NEA closure schedules** in `data/nea-closures-v180.json` checked against the NEA published table as of 2026-10-10. They should be refreshed frequently; a future date range does not guarantee the venue will reopen precisely on time.

## OneMap address workflow

Existing server-side OneMap credentials (`ONEMAP_TOKEN` for Preview/Production) are reused. No new secret is added to the client.

1. In Discover, select Eat / Things to do / Shop and click **Check OneMap address** on an entry. A request to `GET /api/journey?action=discover-address&id=SGP-0001` looks up the server-controlled venue name, not a user-defined search query.
2. The server calls the existing `lib/onemap.js` Search API adapter. `lib/discover-geo.js` requires conservative name overlap and valid Singapore coordinates; ambiguous street/name matches are discarded.
3. Responses distinguish `address-matched`, `ambiguous`, `not-found`, `not-configured` and `provider-unavailable`. Only `address-matched` exposes exact postal address and navigation. This **does not** certify that an establishment exists or is trading there today.
4. To audit the entire directory with an explicit authorized service token, use `node scripts/verify-directory.mjs --limit=271 --delay=1200` from a Node 22 environment where OneMap credentials are configured. This writes resumable `data/place-address-audit.json` with per-record provenance, but does not silently overwrite the catalog. Batch run is **not completed** by adding the script.
5. Review/approve any static address import before treating the snapshot as trusted. Periodically recheck addresses and closures; OneMap does not supply stall tenancy, menus or current hours.

## NEA canonical hawker-centre import (non-destructive)

Run `node scripts/sync-nea-hawkers.mjs` to request the published NEA Hawker Centres GEOJSON from data.gov.sg. The script checks the download host, parses source location and postal fields, and writes a separate review snapshot `data/nea-hawkers-import.json`. It does not silently add venues to production or claim the older dataset coverage is current.

NEA dataset: https://data.gov.sg/datasets/d_4a086da0a5553be1d89383cd90d07ecd/view

Published closure schedules: https://www.nea.gov.sg/our-services/hawker-management/overview

2025 award list: https://www.nea.gov.sg/media/news/news/index/singapore-hawkers--celebration-and-awards-2025-honours-heritage-and-inspires-the-next-generation-of-culinary-excellence

## Dining browse and safety

On Discover → Eat, **Hawker stalls** and **Singapore dishes** filters allow browsing by area, cuisine, meal period, dish, free text and saved stalls. Every stall remains labelled unverified for current operations and prices. Halal certification is never inferred from cuisine or stall name. For verification, users can use MUIS's official search at https://halal.muis.gov.sg/halal/establishments. Vegan/vegetarian availability and allergens are equally not established without source evidence.

For each stall, the centre is linked to a real catalog ID; check the centre's OneMap address before navigating. Google Maps search is a search, not an independently verified location.

## Quality gates

- `npm run check`: JS syntax, prior UX 1–6, PWA cache, baseline discover, Merli, food-dataset foreign keys, badge integrity, no fabricated prices/halal flags, conservative OneMap matcher mock cases.
- Test real OneMap responses with a valid server-only preview token, including a known venue, a name-collision and a provider error. These are *not* replaced by mock tests.
- Manually verify iPhone/web layout, saved-stall persistence, keyboard filters, Discover category switching, and the two source-aware navigation flows.
- Check NEA published closures and recent operator status independently before broad-scale venue promotions.
- Publish to production only after explicit user approval.
