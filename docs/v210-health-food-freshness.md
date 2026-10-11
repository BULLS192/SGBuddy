# SGBuddy V2.1 — Healthcare, Neighbourhood Essentials, Menus, Facts and Source Freshness

**Development branch:** `feature/sgbuddy-v2.1-services-food-freshness`, stacked on `feature/sgbuddy-v2-library-at-scale` (PR #16). Neither branch is production.

## Added real-source content

- **1,192 CHAS clinic records** — MOH dataset, source coverage June 2024. These are historical directory entries and **do not verify current CHAS participation or licensing**. Use https://www.chas.sg/clinic-locator for live confirmations.
- **249 registered retail-pharmacy records** — HSA source coverage September 2025; verify current registration and services directly with HSA/provider.
- **8 polyclinic source records** — MOH vaccination-era dataset, January 2024 coverage; **not** current vaccination, service or opening-hour guidance.
- **24 Social Service Office records** — MSF source; some row dates are older than the latest dataset update.
- **477 supermarket-licence addresses from an old NEA licence register** — **historical circa 2016, not current businesses or verified operating supermarkets**. Store source and address, keep `lat`/`lon` null and guide users to check the current SFA directory.
- Thus the development environment has **2,949 location records**: 271 curated + 728 V2 government source listings + 1,950 V2.1 services and historic supermarket records. This number represents searchable records, not independently confirmed current establishments.

Data sources:
- MOH CHAS: https://data.gov.sg/datasets/d_548c33ea2d99e29ec63a7cc9edcccedc/view
- HSA pharmacies: https://data.gov.sg/datasets/d_bb92615f43de22933e4479558b1f6c36/view
- MOH polyclinics: https://data.gov.sg/datasets/d_b22489c7dc4065b6e7e45f177fdb33be/view
- MSF Social Service Offices: https://data.gov.sg/datasets/d_22cfe2aed0bf20a679ab59bcaf0f8248/view
- NEA historical supermarket-licence table: https://data.gov.sg/datasets/d_11edd0117280c5776651d7891114c88c/view

SFA KML supermarket feed returned 404 and is **not published as a successful source**; the historical NEA table is the transparent fallback. No raw latitude/longitude was fabricated from the licence postcode.

## Food and Singapore facts

- **65 hawker stall leads** (48 earlier research candidates, nine sourced from NEA 2025 awards, and eight additional unique 2024 award records); source-backed NEA awards confirm historical recognition, not current tenants or menus.
- **31 vendor-first-party menu/product listings** from Chiew Kee (10 items, historical published prices) and Old Chang Kee (21 items, prices not published), each with vendor URL and observed date. These are NOT asserted as menus for the 65 hawker stalls. Availability, ingredients, allergens and halal status are unknown.
- **152 source-checked Singapore facts**, including 22 new 2025 NEA Hawker Awards and practical-services facts. Eight editorial candidates still pending.
- **82 Singapore food/drink vocabulary entries** and 27 useful app references remain unchanged.

## Refresh and editorial safety

- `scripts/build-services-v210.mjs`: imports source-labelled MOH/HSA/MSF geospatial directories and records source coverage dates.
- `scripts/build-supermarkets-v210.mjs`: separately imports and labels the old NEA licensed-supermarkets table. Never invents coordinates or current business status.
- `scripts/library-freshness-v210.mjs`: produces Markdown and JSON reports covering counts, original source age, failed providers, changes in record IDs, warning thresholds and vendor-menu price snapshots.
- `.github/workflows/library-freshness-v210.yml`: **weekly Monday at 11:00 SGT** after this workflow reaches GitHub's default `main` branch (GitHub scheduled workflows only execute from default branch). It performs non-destructive source imports, writes a GitHub Actions Step Summary, and uploads a downloadable review artifact retained for 30 days. It **does not commit refreshed listings or deploy automatically**. Users must verify significant additions, closures and source changes before promotion.
- **Verified first run on development branch:** GitHub Actions https://github.com/BULLS192/SGBuddy/actions/runs/38104416024 produced a source-freshness artifact and warned about old coverage.
- If a data.gov.sg feed returns 429, importer backs off; if it returns 404 or fails, record the error; do not silently substitute made-up entries.
- `npm run check` includes existing UI, Merli and OneMap tests plus V2.1 source integrity, menu evidence and source freshness workflow assertions.

## UX changes
- Discover adds **Healthcare**, keeps **Essentials**, and merges the 1,950 additional source directory records from `data/services-v210.json`. Users can search by clinic/brand/postcode and filter by source and place category.
- Official directory entries disclose original coverage dates and keep current operating status unverified. CHAS clinic cards link to the official locator; historical supermarket entries link to the current SFA track-record lookup.
- Food Explorer has a separate **Vendor-listed menus** view instead of confusing verified vendor products with unverified hawker stall dishes; prices are only shown as historical vendor-published snapshots.
- Merli directs medical-facility lookups to Healthcare and supermarkets to Essentials. Merli is **not** a licensed health professional or clinical triage service.

## Before production
Manual iPhone/desktop visual QA, test healthcare cards, supermarket/postcode search, source links, menu filters and installed PWA offline caching. For current healthcare decisions users must use providers' official information. Merge dependent PRs in order after explicit review; do not auto-promote V2.1.
