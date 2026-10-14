# SGBuddy V4.16.0 — Offline Freshness & Smart Updates
**Status:** Complete development release candidate on draft PR #73. **Production:** V4.15.0 on `main`, commit `c8de8b067b1c03d91469cf2501d9791ec8dfe27a`.

## Wave 1 — Manual freshness evidence
A user click performs same-origin `HEAD` requests against only previously downloaded, allowlisted public JSON. Strong ETags or a comparable Last-Modified time report changed/unchanged. Weak/missing validators, backwards dates, network failures, or corrupt cached JSON remain **unverified**. This does not validate source accuracy, current event availability or food service opening status.

## Wave 2 — Selective transactional updates
**Update checked changes** is a *second explicit click*, never triggered by reconnect, app start or visibility changes. Only files reported changed or unverified are fetched using no-store GET. Previously unselected packs are never downloaded. A damaged/partial previously downloaded pack is repaired in full instead of being misleadingly marked complete. The selective update uses the unchanged V4.15 full-pack rollback journal before any selected-file write. On quota error or interrupted write, previous valid files can be restored; browser eviction of the journal cannot be guaranteed recoverable. A partial refresh does not reset a full-pack successful-download age.

## Wave 3 — User experience and source clarity
Check results distinguish *changed*, *verified unchanged*, and *unverified* by pack. **Refresh downloaded packs** remains the manual full-refresh option. Added controls are authored in all 12 supported languages. Checks compare published file metadata, not third-party source freshness. No automatic downloads. No personal trips, settings, payments, bookings, maps or live API resources are added to opt-in caches.

## Wave 4 — Release gates
Deterministic Node tests cover opt-in isolation, HEAD evidence, malformed JSON, selected-file writes, full journal recovery after simulated crash, interrupted fetch, invalid-file rejection, quota rollback and full repair. Chromium mobile and desktop verify manual change-check and one-file replacement, no added packs, no reconnect fetch, saved preferences and 12-language controls. V4.15 PWA upgrade regression is rerun with shell v81.

**Candidate version:** `v4.16.0`. **Shell:** `sgbuddy-shell-v81`. **User download cache:** `sgbuddy-offline-packs-v480` **unchanged** (3 opt-in packs / 13 JSON files). Journal namespace `sgbuddy-offline-txn-v415-` remains unchanged to support pending recovery.

### Outstanding real-device and editorial acceptance
Physical installed-PWA tests on iPhone Safari and Android Chrome, including a force-closed offline restart after update, quota pressure, persistence prompt and source/error messaging, must be performed separately. Curated events' editorial gates and the 61 unapproved candidates remain unchanged. Native-speaker reviews remain separate. No production deployment without explicit authorization and exact-head successful checks.
