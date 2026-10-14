# V4.15 Offline 2.0 — Waves 1–4 release candidate (development only)

Production is V4.14.0. This branch improves CacheStorage integrity and recovery; no production deployment is included.

- Read and JSON-parse **actual cached bodies** before marking a pack ready. Missing/damaged items are shown for repair.
- Preflight every first-party JSON resource before writing. Save previous responses and restore successfully overwritten files if a CacheStorage write fails (including quota failure). A sudden device crash can still interrupt writes; on next launch integrity inspection detects incomplete packs and prompts repair.
- Show `navigator.storage.estimate()` usage and a warning above 85%, where supported. This is a broad browser storage estimate, *not* the exact size of SGBuddy.
- Distinguish recently downloaded vs unknown/older-than-14-day content, without claiming events or live services are currently valid.
- Retain all 3 opted-in packs, their `sgbuddy-offline-packs-v480` cache, and 12 locales. The isolated V4.15 release candidate displays `v4.15.0` and uses shell `sgbuddy-shell-v80`; these are development-branch changes and do not modify V4.14 production.

Automated static/browser checks exercise corrupted JSON, recovery, update rollback, quota and multilingual status. Physical iOS/Android PWA testing remains separate.

## Wave 2: crash recovery and stronger cached JSON fallback

A first-party, per-pack transaction journal is stored in `sgbuddy-offline-txn-v415-<pack>`. Every downloaded file is validated before any overwrite, and previous valid copies are staged first. The journal manifest marks the beginning of a recoverable commit. A browser crash during writes is repaired on the next app launch by restoring the prior cache and retaining its old successful-download timestamp. An interrupted initial pack is returned to its prior empty state. Malformed journals are **not** silently discarded after commit: recovery failure remains visible until the user resolves it. A browser storage eviction can still destroy the journal and cannot be reversed.

The service worker now validates downloaded offline JSON before returning it as a disconnected fallback. If corrupt, the shell's published snapshot is used where available; otherwise the request fails clearly. Neither live `/api/` data nor third-party maps are intercepted.

## Wave 3: opt-in reconnect and storage safety

The Offline panel shows `ready / total` packs and a translated offline-readiness explanation. A **Refresh downloaded packs** action runs only after a user click; connecting to Wi-Fi is a notification, never an automatic download. It refreshes only previously opted-in packs, one at a time, with transaction recovery. Per-pack timestamps change only on successful updates. A separate optional **Keep offline data on this device** action invokes `navigator.storage.persist()` only after a user click and reports the browser's decision accurately; not all browsers expose this capability, and no persistence guarantee is claimed.

Web Locks serialize writes to one pack where the browser supports them; other browsers retain per-tab busy guards. Downloads and updates are disabled when disconnected. Saved trips, bookmarks and authentication data are never cleared by the manager.

## Wave 4: regression, readiness and release candidate

New Node tests exercise crash journals, quota rollback, missing/corrupt JSON, stale/unknown timestamps, and all 12 UI locales. New mobile/desktop Chromium tests exercise manual reconnect, download-only opted packs, optional persistence, corrupted-cache fallback, offline restart and recovered data. A release contract checks that all opt-in public packs and user data caches remain isolated from the shell. These tests are not equivalent to real iOS Safari or Android installed-PWA QA.

No release is automatically deployed: the V4.15 branch stays isolated until full green CI and a separately authorized production promotion.

### Final concurrency and installed-PWA verification

Boot-time transaction recovery and user-initiated removal acquire the same per-pack Web Lock as downloads where supported, preventing another tab from rolling back a still-active transaction. The V4.15 worker-upgrade Chromium test seeds a V4.14 shell cache and all opt-in downloaded packs, installs the new V4.15 worker, checks old-shell cleanup without deleting user downloads, performs an offline restart, rejects `/api/` caching and verifies damaged downloaded JSON falls back to the validated shell asset. The separate real-device checklist is mandatory before final mobile acceptance.
