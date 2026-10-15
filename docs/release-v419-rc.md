# SGBuddy V4.19.0 — Events Expansion + My Trip 2.0 Release Candidate

**Branch:** `feature/sgbuddy-v4.19-rc`. **Production:** V4.18.0 (`0318ca8dd4f832b0ab0fac9cf93d4048fd80d460`), unchanged until separate approval.

## Scope
- **Events quality:** combine existing six source-checked Esplanade performance candidates with three official-source events from Gardens by the Bay and Sentosa. Evidence recorded in `data/events-evidence-v419.json`; all remain in a separate **review-only** queue. No approved publication, live ticket availability or general rights assumption. Existing publication safeguards retained. Sources broaden beyond EXPO and Suntec.
- **My Trip 2.0:** existing planner, same `sgbuddy-my-trips-v260` local key and schema. Read-only day checks, time overlap and address warnings, walking/driving Google Maps directions for first five stops only; safe date/name/day-count editing (cannot remove occupied days), optional grouping of **untimed** stops by area label. Existing share/import/export, events and custom stop support retained.
- **Localization:** 12-locale labels and caveats for additional controls; fluent native-speaker assessment is still pending.
- **Offline:** service worker v84 preserves 3 opt-in packs (13 JSON files), v4.15 crash journals and local settings; no new caching of personal trips or remote access.

## Automated acceptance
Run `node scripts/check-v419-release.mjs`, `node scripts/check-v419-event-evidence.mjs`, `node scripts/check-v419-trip-wave2.mjs`, `node scripts/check-all.mjs` and Chromium CI workflows. Record exact final commit and green check status; Vercel preview must correspond to same SHA.

## Human acceptance remaining
1. Physical iOS Safari/Android Chrome installed PWA install, offline force-quit/restore and storage pressure, with local trip preservation.
2. Native-speaker review of all 12 new trip and events controls.
3. Named editor to recheck nine official event detail pages, public admission and rights, date/venue and cancellation. Do not publish any candidate without separately approved manifest.
4. Review release preview and rollback plan. **Do not merge/deploy to production without separate authorization.**
