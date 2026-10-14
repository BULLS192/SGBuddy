# SGBuddy V4.17.0 — Real-World Reliability / release candidate

**Status:** Development release candidate, PR #74 (`feature/sgbuddy-v4.17-device-reliability`). **Do not merge or deploy without separate authorization.**
**Production:** V4.16.0 commit `fa051761b97172cde7af06e81e009c95e32f945e`; Vercel `dpl_Az7fv2hyxdknaUieo1HN25NmGLAk`.

## Completed automated engineering scope (Waves 1–4)
- Local-only, user-initiated Check this device audit: public JSON validity, pending journal, shell control and quota estimate. No network or user trip reads.
- AbortController-bounded, opt-in same-origin `HEAD`/public JSON `GET` requests (12 seconds each); no automatic reconnect refresh.
- Explicit browser-managed exclusive per-pack Web Locks, including cross-tab remove/download and recovery. Unsupported Web Locks fail closed, with a 12-locale warning; manual diagnostics still available.
- Storage-event UI coherence between tabs; no personal data cache reset. Browsing the Offline panel does not create an empty downloaded pack.
- New Chromium dual-tab lock contention + damaged-journal restart recovery test; 12-locale mobile/desktop device QA; static Events editorial separation, no new event approvals.
- Release `v4.17.0` badge and `sgbuddy-shell-v82`. Preserve `sgbuddy-offline-packs-v480` (3 opt-in packs / 13 public JSON files) and `sgbuddy-offline-txn-v415-` journal namespace; no database migration.
- Existing V4.13–V4.16 runtime, Food, Merli, Events, and multilingual CI regressions remain release gates.

## Limitations and mandatory human acceptance
- **Not tested on physical installed iPhone Safari or Android Chrome.** Chromium mobile emulation is not equivalent to a force-quit/restart of a real PWA.
- Native-speaker review of UI/control translations and editorial verification of event admission, dates, ticketing and publication rights remain manual.
- Static source QA proves review-queue isolation, **not** real-time source availability or up-to-date admission status.
- No guarantee against full device/browser cache eviction; no newly introduced offline maps or live /api caching.
- With no Web Locks support, offline mutations are deliberately disabled to protect user data; validate device/browser support before production approval.

## Release gates
1. Full exact-SHA GitHub Actions suite green, including `scripts/check-v417-release.mjs`, `scripts/check-v417-device.mjs`, `scripts/check-v417-editorial.mjs`, `scripts/browser-qa-v417-device.mjs`, and `scripts/browser-qa-v417-multitab.mjs`.
2. Preview `/`, `/app-v090.js`, `/sw.js`, `/app-offline-v480.js`, and V4.17 helper modules must return 200 and correct version.
3. Physical iOS and Android installed-PWA acceptance according to `docs/v417-device-qa.md`; keep open if no real devices.
4. Only after separate deployment approval, merge exact PR SHA, deploy merge SHA to Vercel production, smoke-test custom domain and log rollback ID. Rollback target V4.16.0 `dpl_Az7fv2hyxdknaUieo1HN25NmGLAk`.
