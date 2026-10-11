# SGBuddy V2.3 — Current-Source Food, Operator Menus and Neighbourhood Coverage

**Delivery:** Development branch only. Do not merge or deploy to production without separate release approval.
**Built on:** production main SHA 991209216b2f4dca88c133ae1e1bf0530af0d442.
**Reviewed:** 11 October 2026.

## Evidence tiers and permitted claims

| Evidence | Supported claim | Unsupported claim |
|---|---|---|
| Operator's official location page | That branch name/postal/address was listed when checked | Open right now, licence active today, accurate live hours |
| MICHELIN Singapore 2026 Bib Gourmand | Named hawker was recognised and cited at the published address in July 2026 | First-party stall confirmation, currently trading, current menu or prices |
| Operator's first-party menu | A dish/product was advertised on website when observed | Product available at that particular outlet today, halal status or current price |
| Historic NEA awards (2022–2025) | Stall appeared in that year's award material | Current tenancy, original unit number still active |
| CHAS/healthcare or supermarket historical source | Government snapshot recorded that place then | Current business status or current participation |

Never treat a brand-wide menu as a menu *verified at a single hawker centre*. Venue/guide source ages and original publisher links are preserved.

## Data content

- Baseline directory: **2,949** records across V2/V2.1 (including 477 historical supermarket licence records, hidden unless opted-in).
- V2.3 operator locations: **42** records, comprising 17 reused first-party operator listings from the unmerged V2.2 current-verification draft, 19 more Sheng Siong branches and six Tian Tian outlet records. The 17 were not originally in production, and are intentionally consolidated here instead of blindly merging their stacked PR.
- V2.3 total directory: **2,991**, with first-party operator listings flagged **operator-listed**, never open-now.
- Hawkers: 93 research/historical leads preserved, plus **9** geographically evidenced 2026 MICHELIN guide-listed hawker names and stalls. Food UI prioritises recent guides and suppresses legacy exact-name duplicates; no physical location is guessed from another address.
- Menus: 31 existing vendor product records plus **41** first-party Ya Kun / Original Vadai product records; **5** brand-level Tian Tian hawker menu entries shown in a dedicated tab. **77** total distinct menu entries across three groups (vendor 31 + vendor 41 + hawker-brand 5).
- Neighbourhoods: **26** text-based facets that match explicit names or road/address strings. They are not postal-boundary polygons or estimates of walking/driving proximity.

## Source registry
- [Sheng Siong Store Locator](https://corporate.shengsiong.com.sg/store-locator/)
- [Chiew Kee Locate Us](https://www.chiewkee.com/locate-us/)
- [Tian Tian Outlets](https://www.tiantianchickenrice.com.sg/pages/outlets)
- [Tian Tian Menu](https://www.tiantianchickenrice.com.sg/pages/menu)
- [MICHELIN Bib Gourmand Singapore 2026](https://guide.michelin.com/sg/en/article/michelin-guide-ceremony/singapore-bib-gourmand-2026), published 28 July 2026
- [Ya Kun First-Party Menu](https://app.yakun.com/menu.html) and [Page 2](https://app.yakun.com/menu.html?p=2)
- [The Original Vadai Menu](https://theoriginalvadai.sg/)
- [NEA Hawker Management](https://www.nea.gov.sg/our-services/hawker-management/overview)
- [SFA Current Establishment Track Records](https://www.sfa.gov.sg/tools-and-resources/track-records)
- [MUIS Halal Establishments](https://halal.muis.gov.sg/halal/establishments)

## Reliability engineering

- Discovers operator-specific source date and operator name on every operator card.
- Suppresses old supermarket licence rows when a newer operator branch shares that operator's postcode, even when the archive toggle is enabled.
- Dated MICHELIN guide results are **never** rendered as NEA government listings.
- Operators and guide leads stay separate from verified-now operations; currently **0 establishment open-now confirmations**.
- V2.3 neighbourhood filters use explicit text matches without claiming proximity.
- Quality automation generates reports/library-evidence-v230.json and .md, and reports/library-review-queue-v230.csv, with source-age and neighbourhood gaps. It does **not** automatically update listing statuses.
- Weekly GitHub source-freshness workflow adds those reports once this branch reaches main; no automatic production mutation.
- The older V2.2 report intentionally audits only 2,949 legacy records; the V2.3 evidence report covers the 42 supplemental operator records.

## QA and release checklist

- [x] Check new source data IDs, postal formats, duplicate operator-postal keys, URL provenance, no inferred halal/allergen/open-now claims.
- [x] Run inherited V1.8/V2/V2.1/V2.2 and V2.3 npm regression checks.
- [x] Generate non-destructive coverage and manual review queue.
- [ ] Manually test Chrome desktop and iPhone Safari for first-party filters, archive toggle, neighbourhood search, food tabs, source links, favourites and stable scrolling.
- [ ] Verify installed PWA shell updates and offline access to all four V2.3 JSON files.
- [ ] Independently re-check operator listings where source data is older than 90 days or a retailer publishes a changed branch.
- [ ] Obtain user approval before merging to main / production.

**Editorial next:** Expand neighbourhoods currently without adequate first-party/operator-backed coverage, improve recent individual-stall menus, validate operator branch closures and reconcile menu price changes through manual editorial review.
