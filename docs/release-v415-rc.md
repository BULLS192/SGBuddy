# SGBuddy V4.15.0 Offline 2.0 — release contract

**Status:** Release candidate on PR #72; **not** production. Production remains V4.14.0 at `9b047785a7855b54154c29c77ed1b81f33ecf0e0`. Promotion requires an explicit separate user authorization.

## Version and scope

- App badge/client version: `v4.15.0`.
- Service-worker shell: `sgbuddy-shell-v80`; obsolete `sgbuddy-shell-v*` may be removed on activation.
- **Protected user download cache:** `sgbuddy-offline-packs-v480`. Never rename or delete it during upgrade.
- Three manual opt-in public content packs: Calendar/Events (3 JSON), Essentials (5 JSON), Food (5 JSON); **13 files total**.
- Per-pack crash recovery journals: `sgbuddy-offline-txn-v415-<id>`, protected independently of shell cleanup.
- Saved itineraries, saved places, accounts, settings and any third-party/live API responses are **not** part of downloaded public-content packs.

## Release-blocking automated evidence

1. `scripts/check-v415.mjs`: valid, malformed and damaged JSON, freshness, storage quota warnings and localized strings.
2. `scripts/check-v415-transaction.mjs`: preflight; interrupted update and quota rollback; completed-update cleanup; simulated crash after partial public writes; malformed journal preservation; interrupted initial download; pack isolation.
3. `scripts/check-v415-final.mjs`: exact version, cache keys, 12 supported locales, public download allowlist, recovery locking and no automatic refresh.
4. `scripts/browser-qa-v415.mjs` + `scripts/browser-qa-v415-complete.mjs`: Chromium mobile and desktop, manual refresh of existing packs only, damaged-cache repair, simulated crash/restart, offline/online status, optional storage-persistence request and translated controls.
5. `scripts/browser-qa-v415-worker-upgrade.mjs`: real Chromium service worker (not blocked), old shell retired without evicting all 13 pre-downloaded public assets, disconnected restart, JSON fallback, private-route exclusion and synthetic saved data retention.
6. Full existing GitHub Actions suite must succeed on the **exact head commit** before release readiness can be claimed. A mergeable PR is necessary but not sufficient for release.

## Manual physical-device acceptance (outstanding until performed)

On physical iPhone Safari installed to Home Screen and physical Android Chrome PWA: download all packs; disconnect; close/relaunch; verify saved trip, preferences and languages persist; check Events, Food, Essentials; reconnect without auto-download; manually refresh only opted-in packs; test optional persistence permissions; verify selective removal and low-storage warning. Record devices and versions. Test that live weather, maps, bookings and payments are not misrepresented as live offline. See `QA_CHECKLIST.md`.

## Editorial and rollback

The 61 unapproved Events candidates are not made public by Offline 2.0; do not change approval gates. Before a separately authorized merge/deploy, verify final SHA, CI, editorial approval and plan an immediate rollback to the confirmed V4.14 deployment `dpl_2V7GMXZNtEHTcJ9GPFdyNnKxBwZj`. Rollback must **not** clear `sgbuddy-offline-packs-v480`. Browser storage eviction cannot be fully prevented or reversed, even if persistence was granted.
