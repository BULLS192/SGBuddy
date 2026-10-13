# SGBuddy V4.11.0 — Consolidated Production Release

Release baseline: `1fa954be475fdba3ebeb06dcb4546a01ba39b035` (V4.2.0).

This release consolidates *both* concurrent development tracks, preserving full Git ancestry:
- V4.3–V4.5 rendered localization audits, Account/Saved/Food/Discover controls and Merli Makan.
- V4.6 Singapore MOM holiday calendar and official event-source registry.
- V4.7 curated event discovery and date filters with original organizer links.
- V4.8 opt-in offline PWA packs (calendar, places and food), offline data fetching, safe cache refresh/delete.
- V4.9 events source crawling (Singapore EXPO, Suntec Convention and mall promotions), review-only queue, 11 curated official-source dated events and human/editor signoff gate; candidate items never automatically published.
- Parallel V4.9–V4.11 language runtime, Discover categories, Food lists, Account validation, accessibility and additional 12-language translated UI.
- The event mobile QA and same-named multilingual V4.9 QA are both retained under distinct files.

**Deployment:** Production commit deliberately bumps the app's public version to `4.11.0` and PWA shell cache to `sgbuddy-shell-v76`. Old version-specific test assertions were aligned to V4.11.0 without removing any tests. The project deliberately uses `vercel.json` Git automatic deployments disabled, so production requires an explicit deployment from the *merged main commit*, followed by verification of deployment commit, status, assigned domains, home and static data responses.

**Known limits:** The 63 newly discovered event candidates from temporary CI preview remain outside production pending publisher rights/admission and editorial approval. Offline includes curated static packs; not live weather, transit, maps or reservation inventory. iOS Safari/Android installed-device testing and native-speaker proofreading still require manual sign-off. The multilingual rendered observation (~75–77% different-from-English label changes) is not a whole-app translation percentage.

**Rollback:** Previous production deployment `dpl_GiETUdmcwkXj82B9e8LjbtLCf5yc` at `1fa954be475fdba3ebeb06dcb4546a01ba39b035` was verified READY before release. Preserve it as the rollback target.
