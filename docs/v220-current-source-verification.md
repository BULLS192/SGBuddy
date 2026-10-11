# SGBuddy V2.2 — Current-source verification and trusted food menus

Development branch: `feature/sgbuddy-v2.2-current-verification`, stacked on V2.1 PR #17 and V2 PR #16. **Not production.**

## What has actually been verified

- **15 Sheng Siong supermarket branches**: specific names, six-digit postcodes, addresses and operator-published hours were cross-checked on 11 October 2026 against the company's own [store locator](https://corporate.shengsiong.com.sg/store-locator/). These are **operator-listed branch locations**, not live open-now proof. The app must never claim the stores are currently open or inventory is available.
- **2 Chiew Kee restaurant addresses**: operator site [Locate Us](https://www.chiewkee.com/locate-us/) explicitly lists 30 Upper Cross Street (058338; published 8am–7pm) and 32 Upper Cross Street (058339; published 8am–8pm), both with alternating Monday closures. Menu-price linkage is restricted to the 32 Upper Cross Street branch from the vendor [Our Menu](https://www.chiewkee.com/our-menu/) source. Item availability and current prices remain unverified.
- **5 Tian Tian Hainanese Chicken Rice brand menu items**: [first-party menu](https://www.tiantianchickenrice.com.sg/pages/menu) lists the chicken rice, roasted chicken, poached chicken, leafy greens and braised tofu options. The page explicitly says availability **may vary by outlet**. All prices stay null, and the menu does **not** verify that Maxwell Food Centre has all five options today. Source-linked to original `STL-0001` stall record; no assumed dietary/halal certification.
- **CHAS:** The [official locator](https://www.chas.sg/clinic-locator) is the current source for clinic participating status. The 1,192 clinic rows imported in V2.1 are historical MOH geospatial snapshots and **have not been revalidated branch by branch**. Merli/Discover provide an explicit official-check link and source-coverage warning, not a false participation badge.

## UI and data trust model

- **Retailer / operator listed:** `operator-listed` + source checked date and operator URL; no open-now signal.
- **Government directory snapshot:** `official-source-snapshot` + coverage date; no active licence claim.
- **Historical supermarket licence:** oldest records (circa 2016) receive a strong warning and are ranked below recent operator branches.
- **Curated candidate:** manually researched lead, not confirmed operating.
- The Discover source facet now supports *Operator listed*, *Government datasets*, *Historical licences* and *Curated leads*. The 15 new retailer branches are prioritized; old Sheng Siong licence rows with matching postal codes are suppressed when superseded by an operator-published branch.
- Food Explorer separates **Hawker menus** from general vendor-listed menu items, connects only first-party menu evidence to a matching named stall, and labels variable outlet stock.

## Monitoring, not automated fact promotion

- `scripts/audit-operator-v220.mjs` probes operator source pages, checks for listed postcodes and generates JSON/Markdown evidence reports. A reachable page or visible postal code **cannot** prove live opening hours, licence, inventory or clinic enrolment.
- If source fetches are blocked or content is JS-rendered, the report records **manual review needed** rather than marking a branch verified. The first stand-alone audit yielded **0/17 automated postal-code confirmations**, so this is an **audit limitation** and must not be presented as 17 verified automated checks.
- `.github/workflows/check-operators-v220.yml` runs the standalone audit on the branch and uploads an evidence artifact for review. `.github/workflows/library-freshness-v210.yml` also incorporates this evidence into its weekly review process once merged to the default branch. No source changes or stale candidate promotions are auto-deployed.
- All 2,949 earlier place records stay available, with old entries marked appropriately. The 17 additional first-party operator records and five stall-menu items are source-checked candidates and should not be described as currently trading without further confirmation.

## Manual release QA checklist

Verify on iPhone and desktop: Discover supermarket search, source filter, duplicate suppression for matching postal-code Sheng Siong records, clinic CHAS locator action, source-coverage labels, two Chiew Kee locations, Chiew Kee menu address, Tian Tian hawker menu, Merli, saved items, accessibility and installed-PWA reload. Manual browser QA beyond smoke tests is still required before production promotion.

## Release order

Merge PR #16 (V2), then PR #17 (V2.1), then this new V2.2 pull request if explicitly approved. Avoid releasing V2.2 while its dependency branches are unmerged.
