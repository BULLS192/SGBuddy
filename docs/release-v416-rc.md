# SGBuddy V4.16.0 release contract — Offline Freshness & Smart Updates

**Release branch:** `feature/sgbuddy-v4.16-offline-freshness`, draft PR #73.
**Current production:** V4.15.0, GitHub `c8de8b067b1c03d91469cf2501d9791ec8dfe27a`, Vercel deployment `dpl_7FWBeEivtEVZH5mJiVpVoiw5W2eR`.
**Deployment authority:** User must explicitly authorize merging/promotion separately. Draft is not deployed.

### Immutable customer-data contract
- Protect `sgbuddy-offline-packs-v480`; 3 opt-in packs and 13 public JSON files. Never rename or auto-clear.
- Keep `sgbuddy-offline-txn-v415-` journals and recovery logic intact across upgrades.
- No localStorage resets, saved trips/places/bookmarks deletion, personal account caches, external map tiles, payments or live `/api/` caching.
- Preserve 12 languages, Food, Merli, Events, Essentials and all existing functionality. The 61 unapproved Events candidates remain unpublished.

### Version and release artifacts
- Client/display: `v4.16.0`; app shell `sgbuddy-shell-v81`; preserve user-download cache `sgbuddy-offline-packs-v480`.
- Run `scripts/check-v416-freshness.mjs`, `scripts/check-v416-selective.mjs`, `scripts/check-v416-final.mjs` and V4.15 transaction/static checks.
- Run `scripts/browser-qa-v416-complete.mjs` on Chromium mobile/desktop with mock HEAD/GET, and rerun V4.15 PWA offline-restart and service-worker upgrade checks.
- Require all GitHub Actions runs on exact final V4.16 commit to pass before marking code release-ready.

### Operational acceptance and rollback
- Physical iPhone Safari installed-PWA and Android Chrome installed-PWA offline/online restart tests still required; Chromium emulation does not certify either platform.
- Editorial source and multilingual native review as documented in `QA_CHECKLIST.md`.
- If approved for release, capture final PR SHA, merge SHA and Vercel ID, smoke-test `/`, `/app-v090.js` and `/sw.js`, then check local opt-in pack retention and runtime logs.
- Roll back to V4.15.0 deployment `dpl_7FWBeEivtEVZH5mJiVpVoiw5W2eR` if production checks fail. Keep `sgbuddy-offline-packs-v480` intact.
