# SGBuddy — V2.6 Food Discovery Wave (2.6.1)

**Branch:** `feature/sgbuddy-v26-food-discovery` — based on the latest production `main` at `55f2789e056ecf81df8b80e3ad9dd21457e3a601`.

**Compatibility:** Production already has **V2.6 multi-day itinerary planning**. The food release uses patch **2.6.1**, extending—not rebuilding or replacing—the trip feature.

## Scope implemented

### Expanded hawker-stall discovery
- 46 **additional** 2026 guide-backed hawker-centre stall leads in `data/food-leads-v261.json`, after filtering 10 names already represented in the 93 legacy and 9 original 2026 guide records.
- The new records are sourced to [CNA's contemporaneous full MICHELIN Bib Gourmand 2026 list](https://cnalifestyle.channelnewsasia.com/dining/michelin-bib-gourmand-2026-singapore-586676) dated 28 July 2026, with the [MICHELIN selection source](https://guide.michelin.com/sg/en/article/michelin-guide-ceremony/singapore-bib-gourmand-2026) separately referenced.
- They preserve **hawker-centre name and broad area only**; do not assume stall number, address, postal, coordinates or live tenancy from a guide name. Displayed as '2026 guide selection (centre named; stall unit unknown)' rather than official verified address.
- Existing Food Explorer merges the new records while suppressing duplicate stall names. The 2026 filter includes both primary guide listings and secondary editorial selections.
- No invented current stall menus, opening hours, prices, halal or vegetarian certifications.

### Merli: What should I eat?
- New **Merli Makan Guide** inside Discover → Eat.
- Select a broad **neighbourhood/area** and optional **craving** (noodles, rice, soup, snack) or 'Surprise me'. The picker randomly chooses among 2026 guide-listed records matching the chosen filters; avoids repeating the immediately prior choice when alternatives exist.
- Each suggestion has centre/area, dated guide provenance, a search-map handoff, the original publisher, and Save Pick (browser-local). Saved picks are visible in the same interface.
- Dish-matching uses name/guide-described food keywords, **not** a promise that the exact dish is available today. No distance/time, budget or dietary eligibility inferred from absent evidence.
- Bilingual heading/action labels as a first step; no claim that legacy records are fully translated.

### Restaurants, reviews, deals, delivery, rescue
- Added new apps/services in `data/dining-services-v261.json`:
  - **Burpple** (community reviews and optional paid Burpple Beyond; matching iOS/Android publisher-linked downloads)
  - **Chope** (restaurant booking handoff; not confirmed availability or booking)
  - **treatsure** (hotel buffet surplus and grocery food rescue; confirmed official iOS/Android app listings)
  - **Jiak Simi? Food Wheel** (existing independent browser game; web service, not separate native download)
- Updated descriptions and category/purpose/links for existing **Grab**, **foodpanda**, **Eatigo**, **Fave** without creating duplicate apps. **GrabFood, Grab Dine Out, Burpple Beyond are features of their parent apps or paid membership**, not additional app installs.
- Food Guide's 'Reviews, deals & delivery' view offers five clear journeys: reviews, food wheel, tables/deals, delivery, food rescue. These link to official external providers.
- SGBuddy **does not import reviews, display third-party ratings or unlicensed photos, check real-time reservations, submit bookings, promise up-to-50% discounts, waive fees, order delivery or collect payments**.
- **SMU FoodAI / Zespri Meal Decoder is research-only**. The public campaign ran 7 September–4 October 2026; no permanent consumer access or integration is asserted.

### QA, traceability, PWA
- `scripts/check-food-v261.mjs` validates content provenance, missing live operation, no invented unit/menu/halal/price, approved app links and provider handoffs.
- `scripts/food-review-v261.mjs` creates JSON/Markdown coverage and an editorial CSV for missing unit/current verification; no automatic publication.
- Weekly freshness workflow reports V2.6 gaps, and **does not merge or deploy edited directory data**.
- Added `app-food-tools-v261.js`, `food-tools-v261.css` and related data to PWA shell v55.
- Bumped client version to **2.6.1** and retained the V2.6 trip planner.
- Existing `npm run check` runs V1–V2.6 trip and this Food Wave, including version-safe regression assertions.

## Release checks

- [x] Publisher references & consumer-safe availability disclaimers
- [x] 46 net-new editorial candidates (not claimed operating)
- [x] Merli food picker and saved-on-device shortlist
- [x] Existing Food Explorer and Everyday Apps enhanced without replacement
- [x] Source-review queue and GitHub Actions integration
- [ ] Latest full automated QA must complete green
- [ ] iPhone Safari / Chrome visual QA: Discover → Eat, picker area filters, 2026 entries, Save Pick, reviews/deals, provider links, dark/light appearance and installed-PWA update
- [ ] Vercel preview READY from latest commit and smoke-tested
- [ ] User production-release approval — do **not** merge or deploy production by default

## Follow-up content acquisition

**300+ verified hawker stalls and 250+ outlet menus remain goals, not achieved metrics.** Next expansion should obtain current stall-level addresses/licence or vendor verification, new menus with exact outlet relationships, and current concession participation. Review queue flags the 46 newly acquired guide leads requiring exact units.

Do not increase record totals by cloning entries or inventing dish prices; prefer evidence-backed coverage of missing residential towns and actual service options.
