# SGBuddy V4.13 — Stability baseline, regression QA and reconciliation

**Scope:** development-only. Forked from V4.12.0 production `main` commit `8d977369ef2a11041c8f413f852318e3a618b155`. This change does **not** alter the public badge, service worker, application features, publication records, production environment or Vercel deployments.

## Implemented in the V4.13 first wave

- `scripts/check-v413.mjs` protects the **12-locale release**, exact currently published curated event set, review-only source configurations, separate manual event approval gate, allowlisted downloadable JSON, persistent dedicated offline cache and service-worker source assets. Assertions make no network requests or writes.
- `scripts/browser-qa-v413.mjs` expands browser QA beyond Visitor-only sampling to **Resident, Visitor, Executive, New in SG and Student**. On **390px mobile** and **1366px desktop**, it exercises all 12 language choices, live DOM updates in Events and Offline controls, account navigation, persona persistence after reload, horizontal overflow and uncaught page errors.
- `.github/workflows/check-v413.yml` runs isolated static safety checks and two viewport QA jobs. `npm run check` includes the V4.13 static contract.
- No translation strings were copied into another competing observer. Existing V3.5/V4.11 ownership remains untouched.

## SGBuddy release and PR reconciliation (as of 13 Oct 2026)

The V4.10 integration PR #65 and V4.11 release PR #66 included both branches of development: V4.4–V4.11 localization alongside Events, venue discovery and offline packs. Release PR #68 merged into `main` and V4.12.0 is already deployed (Vercel `dpl_4FmxpfM6zvkshYD2kSiLrAUEh1Na`). Nine redundant source PRs #56–#64 have been closed with reconciliation comments, after Git compare verified each head was fully contained in `main` (0 commits behind). Branches, source commits and review history remain available; no separate merge of their obsolete version numbers should occur.

Separate diverged PRs #45, #46, #47 contain competing legacy V3.11 home translators; #11 and #18 contain earlier Discover/library experiments; #4 is the 2.5D Merlion prototype. Preserve unique ideas and review any unpublished behavior deliberately, rather than merging old heads or restoring old service-worker caches. The approved Merli avatar itself is already production code.

## QA gaps and suggested follow-on wave

1. **Real devices:** iOS Safari installed PWA and Android installed PWA: offline first load, interruption, storage quota/eviction, sign-in/restart, language switch and cache upgrade. This requires physical device verification. Chromium emulation is not a substitute.
2. **External live sources:** exercise permitted LTA/NEA/weather/rail and location allowed/denied states, with network failure injection and last-updated provenance. Unit tests should not claim to validate credentials or live API correctness.
3. **Event freshness:** ensure scheduled `events-refresh-v470.yml` actually runs and produces review-only candidates; verify publisher access, robots and licensing before editorial approval. The working feeds/venue probes previously generated 63 **unapproved** candidates in development. A local `data/events-review-queue-v470.json` count of zero does not mean discovery is complete.
4. **Multilingual:** extend the V4.3 rendered audit beyond Visitor to all personas, authenticated/conditional screens, Account recovery and error paths. Start with remaining Account, Air Quality and Food English. Record correct source exclusions, obtain native-speaker quality review, and avoid claiming a certified whole-app 95% from a sampled text-change rate.
5. **Data/version hygiene:** update stale `README.md` and `QA_CHECKLIST.md` only once reconciled with active routes and verified live integrations. `package.json` version remains historical, whereas the app's public badge is V4.12.0; do not bump dependencies or runtime simply for cosmetic consistency.

## Release criteria

On the first V4.13 release-candidate workflow, the static job exposed an incorrect historic filename; it was corrected to `scripts/check-events-v470.mjs`. The corrected commit (`1e45540c1495b32aa07a3ea99886b9f842a160c0`) passed 14/14 GitHub checks, including both new persona browser jobs. Subsequent changes must pass again. All newly introduced GitHub V4.13 CI checks must pass. Recheck all existing regressions and no unsafe event publication. Keep `main` and production untouched until a separately authorized V4.13 promotion. Preserve V4.11 Vercel rollback deployment `dpl_DMcrKam98FAus17cEJB87oW2F4Bd`.
