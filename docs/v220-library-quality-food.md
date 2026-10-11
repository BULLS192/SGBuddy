# SGBuddy V2.2 — Library Quality and Food Evidence

Development branch: feature/sgbuddy-v2.2-library-quality-food. Stacked on PR #17 (V2.1), which itself depends on PR #16 (V2). Not production.

## Delivered
- A Library Quality panel in Discover that distinguishes source coverage age (within one year, one to two years, over two years, undated/curated) from proof of current business operation.
- Evidence labels on individual place cards. A government catalogue entry is not a verified open business.
- The 477 historic supermarket-licence entries are excluded from search by default. Users must deliberately enable Include historical supermarket licences.
- Link-outs to current CHAS clinic lookup and SFA licensed-food-establishment track records.
- Source-age filter that works alongside category, neighbourhood, mode, saved records, and search.
- Hawker research expanded from 65 to 93 leads, adding 28 dated NEA award mentions from 2022 and 2023. All remain unverified for present trading.
- Hawker award-year filter (2022–2025 and editorial), with source links and no guessed OneMap centre IDs.
- Preserved 82 food-and-drink guide entries, 31 first-party product listings, and existing Singapore facts.
- New automated quality JSON and Markdown report, with a prioritized CSV verification queue and a CI workflow. This does not write into production.

## Crucial source limitations
- NEA awards show historical recognition, not current tenancy, operating hours, menu or halal certification.
- CHAS records from 2024 do not confirm current CHAS participation.
- HSA registrations from a previous snapshot do not prove current licensing or opening.
- The historic supermarket licence dataset is circa 2016, not a current directory.
- OneMap address matching does not prove an establishment currently operates.
- Vendor product pages are observed snapshots, not current in-stock menus or guaranteed prices.
- No entries have yet been independently verified for currently operating status. The dashboard deliberately shows zero until sufficient dated, establishment-specific evidence is available.

## Workflow
Run npm run check; this invokes V2.2 and inherited regressions plus the non-destructive quality report.
The QA workflow attaches reports/library-quality-v220.json, reports/library-quality-v220.md and reports/library-verification-queue-v220.csv.
The existing Monday 11 AM Singapore-time source-freshness workflow will attach the same quality reports once it reaches the default branch.

## Remaining acceptance checks
1. GitHub Actions checks must pass.
2. Check desktop/mobile Discover and food UI for search, saved entries, filters, source links, mode switching and no page jump.
3. Confirm historic supermarket licences do not appear by default.
4. Confirm no unverified business is labelled open, and no inferred halal/prices/hours appear.
5. Check PWA install, cache update and offline catalogue access.
6. Review and merge PR #16, then #17, then V2.2; deploy only after explicit approval.

## Next data improvement
Use the prioritized queue to replace historical clinic and supermarket rows with verifiably current operator/source records when an appropriate provider supplies them. Expand food menus from dated first-party sources and validate historic hawker tenants with the current SFA register. Do not automatically promote source refreshes.
