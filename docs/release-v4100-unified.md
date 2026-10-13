# SGBuddy V4.10 — Unified Release Candidate

**Scope**: V4.5 multilingual fixes + V4.6 official holidays + V4.7 event registry + V4.8 opt-in offline PWA packs + V4.9 verified event / venue discovery and editorial curation + separate V4.9–V4.10 runtime, Discover category, Food and Account accessibility localization.

**Branch**: `release/sgbuddy-v4.10-unified-rc`.
**Merge policy**: Release-candidate branch only; `main`, production DNS and public version badge remain unchanged until explicitly approved.
**Merge lineage**: Event / offline feature branch `e597adacd30a1082272e613b845fa03958b7f652` and separate language work `f83cf3ba0b5900d9591af22d1123ed8058e754d5` are BOTH parents of the merge; no cherry-picked missing ancestry.
**Conflict resolution**: Both branches independently introduced `scripts/browser-qa-v490.mjs`. The event device emulation is now `scripts/browser-qa-events-v490.mjs`; dynamic Food V4.9 locale QA keeps `scripts/browser-qa-v490.mjs`. Both workflow references were corrected. All new V4.10 localisation assets and boot imports are preserved.

## Release blockers and follow-through
1. CI on this exact unified commit: run *both* source pipelines and the full release gate; do not extrapolate green statuses from separate branches.
2. Verify product UI on real installed iOS Safari and Android browsers including airplane mode and storage permissions/eviction. Automated Chromium emulation is informative but not a replacement.
3. Preserve source-derived event titles, business names, dates and original URL. Entire-app 95–99% translation is NOT verified; native-language signoff and dynamic screen samples remain to be reviewed.
4. Published event snapshot contains 11 manually curated, dated official-source listings; the 63 additional 13 October candidates were only an ephemeral CI review artifact and must not be represented as live events. New sources require editorial source permissions and attendance checks.
5. Validate final release version string and release notes **at promotion time**: source files still intentionally show `v4.2.0` for the live branch while release remains staged.
6. Confirm GitHub Actions and hosting deployment quotas before scheduling new production deployment; scheduled event refresh runs only after approval on default branch.

## Verification
`node scripts/check-unified-rc.mjs` guards retention of all workstreams and both QA test suites. The RC Action runs V4.9 Food, V4.10 Discover categories, V4.9 event-device tests and V4.8 offline disconnected-browser tests with static consistency checks. Legacy checks remain enabled.
