# SGBuddy V4.17.0 release-candidate acceptance

**Development PR:** #74 on `feature/sgbuddy-v4.17-device-reliability`. **Production remains V4.16.0** on `main`, deployment `dpl_Az7fv2hyxdknaUieo1HN25NmGLAk`. No V4.17 merge/deploy authorized.

## Automated release gates (verify exact final V4.17 SHA)
- [ ] All GitHub Actions jobs, existing persona/locale/Events regressions and the V4.17 release contract pass.
- [ ] Chromium dual-tab write/delete contention is serialized by exclusive Web Locks.
- [ ] Full-pack rollback journal restores valid JSON after partial write and restart.
- [ ] No-Web-Locks browsers receive 12-language warning and mutating controls are disabled rather than risking concurrent writes.
- [ ] Device health check has zero network calls, no personal data access, does not create opt-in caches.
- [ ] AbortController cancels failed/slow public JSON transfers; 3 opt-in packs/13 JSON files preserved.
- [ ] Published Events reviewed statically for source/date/ID validity and queue isolation. No automatic queue approvals.
- [ ] V4.17 runtime badge, `sgbuddy-shell-v82` and unchanged `sgbuddy-offline-packs-v480` confirmed in preview.

## Not eligible for an automated PASS (record physical evidence)
- [ ] Actual iPhone Safari installed-PWA offline force-close/restart, storage pressure and saved trip/language retention.
- [ ] Actual Android Chrome installed-PWA same sequence, plus Web Locks compatibility and safe fallback.
- [ ] Human translator spot-review in 12 locales, with emphasis on mobile and offline errors.
- [ ] Human editorial verification of current published events, public admission and official source freshness.

## Promotion only on separately authorized release
- [ ] Verify exact release PR head and merge `main`.
- [ ] Deploy exact merge SHA to Omnidite Vercel production, verify alias/domain, version 4.17.0, shell v82 and live API behavior.
- [ ] Confirm unchanged opt-in packs and journal; monitor logs, retain V4.16 deployment `dpl_Az7fv2hyxdknaUieo1HN25NmGLAk` for rollback.

Full contract: `docs/release-v417-rc.md`; on-device test script: `docs/v417-device-qa.md`.

---

# V4.17 real-world device reliability — development Wave 1

**Production currently:** V4.16.0 at `fa051761b97172cde7af06e81e009c95e32f945e`, Vercel `dpl_Az7fv2hyxdknaUieo1HN25NmGLAk`. **V4.17 is development-only.**

- [ ] New static tests and Chromium mobile/desktop tests pass on exact PR commit.
- [ ] 12-locale device health check accessible and responsive; no diagnostic fetch/personal-trip reads.
- [ ] HEAD/GET cancellation on poor networks; no unintended downloads; existing rollback protection.
- [ ] Physical iPhone installed-PWA acceptance (model, Safari/iOS version, offline force-quit/reopen, low storage).
- [ ] Physical Android installed-PWA acceptance (model, Chrome/Android version, offline force-quit/reopen, low storage).
- [ ] Translation native-speaker spot checks and events editorial/publication gating review.
- [ ] Release candidate only after all relevant acceptance. No merge/deploy without separate authorization.

Full device runbook: `docs/v417-device-qa.md`.

---

# SGBuddy V4.16.0 offline update release acceptance

**Production baseline:** V4.15.0. **Development:** PR #73. No V4.16 production deployment permitted until separately authorized.

## Automated gates (verify exact final SHA)
- [ ] Node freshness/validator checks, 12-language coverage, safe opt-in and no API probes.
- [ ] Selective update: only changed/unverified files GET; unchanged stay byte-for-byte intact.
- [ ] Recover from crash mid-update, quota rollback and malformed downloaded JSON; no personal data changed.
- [ ] Chromium mobile/desktop: check-only, second user click to update, reconnect without automatic downloads, no layout overflow.
- [ ] Service-worker shell v81, preserved `sgbuddy-offline-packs-v480` and journal across update, real Chromium offline restart.
- [ ] All GitHub Actions jobs green for exact final commit; PR remains mergeable.

## Physical PWA acceptance — not certified by emulation
- [ ] iPhone Safari Add to Home Screen and Android Chrome PWA: install, download Calendar/Essentials/Food, disconnect, force-close/reopen.
- [ ] Retain saved trip, language, and preferences; check changed/unknown statuses and selective refresh on reconnect only after clicking.
- [ ] Retry under poor storage, browser denied persistence, corrupted downloaded cache, app restart and update; record physical device/version.
- [ ] Native-speaker review of new 12-language controls and recovery messages.
- [ ] Editorial staff verify current approved published event listings and continued protection of unapproved candidates.

## Production promotion (only after separate approval)
- [ ] Record merge SHA, production deployment ID and 15-minute smoke/rollback plan.
- [ ] Verify live version 4.16, shell v81, custom domain, runtime errors and unchanged opt-in public cache.
- [ ] Retain V4.15 deployment `dpl_7FWBeEivtEVZH5mJiVpVoiw5W2eR` as rollback target.

---

# SGBuddy release acceptance checklists

## V4.15.0 Offline 2.0 release candidate — PR #72
**Live environment:** V4.14.0 at `9b047785a7855b54154c29c77ed1b81f33ecf0e0`. **Candidate branch:** `feature/sgbuddy-v4.15-offline-resilience`. Do not merge or deploy without separate authorization.

### Automated release gates — verify on the exact final commit
- [ ] Full Node static, transaction, quota and damaged/incomplete-cache tests pass.
- [ ] Playwright Chromium mobile and desktop: pack download, cache repair, manual-only reconnect, 12 locale controls, persisted permissions.
- [ ] Real service-worker upgrade simulation: v79 shell to v80; all previously downloaded packs survive.
- [ ] Offline service-worker fetch for Events, Food, Essentials; corrupted downloaded JSON uses valid shell fallback.
- [ ] Private account data, /api/ routes, maps, bookings and payments are never cached in user download packs.
- [ ] PR #72 mergeable and every GitHub Actions job green on final SHA.

### Real installed-PWA acceptance — not certified by Chromium
- [ ] Physical iPhone Safari Add to Home Screen: install, download three packs, offline force-close/relaunch, save My Trip/place and language/preferences, reconnect notification without auto-refresh, selective manual update and removal, screen layout.
- [ ] Physical Android Chrome installed PWA: repeat equivalent flows; test storage persistence denial/grant if browser supports it.
- [ ] Simulate low available storage and interrupted update safely; record browser/OS version, result and rollback integrity.
- [ ] Native-speaker spot-check new control and recovery messages across priority languages.
- [ ] Editorial team confirms published events are approved and current; pending candidates remain unpublished.
- [ ] Record production deployment/rollback SHA, alias, smoke test outcomes once production promotion is separately approved.

### Release contract
See `docs/release-v415-rc.md`. The candidate may be code-complete and CI-green while the real-device acceptance boxes remain unchecked.

---

# Archived V4.13 release acceptance checklist (historical)

**Production:** V4.12.0. **Development:** PR #69 on `feature/sgbuddy-v4.13-stability-qa`.
**Do not promote based solely on green Chromium tests.** Mark physical-device results only after actual testing. Never save passwords, tokens or personal profiles to screenshots or CI artifacts.

## Automated gates (GitHub)
- [x] Five personas × 12 locale switches, on mobile/desktop Chromium.
- [x] Air Quality authored strings, NEA numeric/source preservation, stale and cached reading labels.
- [x] Weather/train/traffic outages and last-good fallback do not falsely say refreshed.
- [x] Curated Events and editorial-gated unapproved discovery candidates.
- [x] V4.8 offline pack download and cached JSON fetch in Chromium.
- [ ] **V4.13 additional disconnected restart and interruption tests:** verify the latest commit's `pwa-disconnected-restart` check passes.
- [ ] Latest **whole-PR** CI green after any final fixes; check deployed target SHA.

## Real iPhone Safari / Add to Home Screen (manual, not emulated)
- [ ] Open HTTPS production or an approved, accessible release-preview URL in Safari; record device/iOS version and test URL.
- [ ] Add SGBuddy to Home Screen; launch it from the installed icon rather than browser tab.
- [ ] In Account, download **Calendar, Essentials and Food**; verify all show complete.
- [ ] Switch to French or Chinese and Visitor mode. Save a non-sensitive sample trip/location.
- [ ] Enable airplane mode (disable Wi-Fi too); **fully close and reopen** the installed app.
- [ ] Verify app shell opens; saved persona/language and trip/location survive; all downloaded packs remain marked available.
- [ ] View cached Singapore Events/holidays and Food info; live weather/traffic show stale/unavailable status, **not live claims**.
- [ ] Switch language while offline; verify labels and no clipped horizontal scrolling.
- [ ] Re-enable internet; refresh; check live source/freshness updates, and confirm packs can be updated.
- [ ] Remove only one pack; other packs remain intact. Reopen again.
- [ ] If low-storage/eviction can be reproduced safely, confirm missing pack is clearly shown instead of claiming it is ready.

## Real Android Chrome / installed PWA (manual, not emulated)
- [ ] Repeat the iPhone sequence above on a physical Android device; record Android/Chrome version.
- [ ] Exercise allowed and denied geolocation; app remains usable without GPS.
- [ ] Compare normal and offline installed launches and recovery without duplicated saved records.

## Release-day checks (manual)
- [ ] Verify source rights and public admission for any **new** event before editorial approval.
- [ ] Verify current curated Events date range and automated feed review queue separately.
- [ ] Native-speaker review of important languages, especially Account, Merli, Food and error paths.
- [ ] Record checked PR SHA, production candidate deployment ID and rollback deployment.
- [ ] Release **only when separately authorized**, verify domain alias + production badge + critical API health, and retain V4.12 rollback.
