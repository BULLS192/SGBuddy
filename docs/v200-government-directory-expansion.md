# SGBuddy V2 — Singapore Official Source Directory Expansion

## Purpose

Grow SGBuddy's actual searchable Singapore location library using public-government geospatial records instead of manually inventing food, park and essentials venues. Keep all original 271 curated places, 57 stall entries, 82 dish/drink types, 27 apps and 130 source-checked historical facts.

**Development branch:** `feature/sgbuddy-v2-library-at-scale`. Production is not changed by this branch.

## Five source pipelines

| Agency | Official dataset | Category |
| --- | --- | --- |
| NEA | [Hawker Centres (GEOJSON)](https://data.gov.sg/datasets/d_4a086da0a5553be1d89383cd90d07ecd/view) | Eat |
| NParks | [NParks Parks and Nature Reserves](https://data.gov.sg/datasets/d_77d7ec97be83d44f61b85454f844382f/view) | Things to do |
| NLB | [Libraries](https://data.gov.sg/datasets/d_27b8dae65d9ca1539e14d09578b17cbf/view) | Essentials |
| People's Association | [Community Club / PAssion WaVe Outlet](https://data.gov.sg/datasets/d_9de02d3fb33d96da1855f4fbef549a0f/view) | Essentials |
| Sport Singapore | [SportSG Sport Facilities (GEOJSON)](https://data.gov.sg/datasets/d_9b87bab59d036a60fad2a91530e10773/view) | Essentials |

Data coverage varies (mostly 2024–2025). Download date is NOT current status. An agency directory record does not establish that a venue is open today, that a park is accessible at the mapped polygon midpoint, or that a listed sports facility can currently be booked.

## Source contract

The publication is generated into `data/official-places-v200.json`, separate from `data/discover-v120.json`. Each new entry has:
- Stable `SGO-...` ID derived from agency, name and source record.
- Government agency, dataset ID, record ID and exact dataset URL.
- Safe source name, coordinate and coordinate-kind label (`point` vs `indicative-polygon-centroid`).
- Available source address/postcode only; missing values remain null.
- Explicit `status:'official-source-snapshot'` and `operatingStatus:'unverified'`.
- Category and broad persona eligibility; not a claim that every entry is recommended or open.

The importer rejects non-Singapore coordinates and non-geocoded records, deduplicates per source and against existing named curated venues. Some older NLB rows may label the containing mall/building rather than a library itself; the UI says `Public libraries` and should not be interpreted as proof a branch is still at that address.

## Automated update and QA

- `scripts/build-official-library.mjs`: reads public GEOJSON via data.gov.sg's poll-download API, respects HTTP 429 with backoff and writes a deterministic source-snapshot file. No tokens or paid service required. Requires internet access for a new refresh.
- `.github/workflows/library-build-v200.yml`: imports and commits snapshots on the **development branch only**, rebasing against intervening edits. Do not enable unrestricted source commits on production without a separate review gate.
- `scripts/check-library-v200.mjs`: rejects reduced coverage, missing citation/source metadata, duplicate IDs, false current-open assertions and coordinates outside Singapore.
- `.github/workflows/check-library-v200.yml`: invokes `npm run check` with all legacy SGBuddy/UX regressions.

## UI and search

**Discover** has Eat, Things to do, Shop, **Essentials**, Apps and Did you know; Near me remains from the earlier UX waves. Search spans names, street/address, postal code and category. Filters separate official catalogued from curated candidate records. The rendering is paginated in batches of 24 to avoid hundreds of cards on mobile. Card labels explicitly distinguish the source level, and official dataset links appear on each imported entry.

**Merli** routes library, community-club, pool, gym and sports-centre queries into Essentials.

## Deferred verification work

1. Confirm government source coverage and label administrative park parcels carefully (many NParks names use PK/PG abbreviations and some polygon points aren't entrances).
2. Use the existing server-side OneMap verification flow on appropriate known venue names and verify postal address/real access point. Do not expose server tokens.
3. Validate current operations and closures from agencies/operators before claiming an establishment is open, pricing, accessible or bookable.
4. Split large NParks parklands and individual park facilities into more useful geographic/sports-specific subcategories when separately sourced.
5. Continue human editorial checking of facts and verify individual food stalls independently.

**Release:** Preview first; wait for explicit promotion approval before touching `main`.
