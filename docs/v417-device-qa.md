# V4.17 — Device Reliability and Real-World QA

**Development:** `feature/sgbuddy-v4.17-device-reliability` (Wave 1), based on production V4.16.0 commit `fa051761b97172cde7af06e81e009c95e32f945e`. No `main` merge or production deployment authorized in this wave.

## Implemented in Wave 1
- Opt-in **Check this device** action within Offline Essentials. It performs a local-only diagnosis (zero network calls and zero personal-trip reads). Checks verified JSON for opted-in Calendar/Essentials/Food caches, pending recovery journals, shell cache, whether this page is controlled by a service worker, and optionally reads browser quota estimate without calling `persist()`.
- Bounded cancellable `HEAD`/download `GET` requests using AbortController (12-second per-file timeout). Failed/aborted freshness checks remain **unverified**, never reported as unchanged. Failed downloads preserve the V4.15/V4.16 transaction and rollback safeguards.
- New controls/statuses translated across all 12 supported UI locales, responsive diagnostics panel, no change to paid API, private data, offline pack namespace, shell `v81`, or production badge `4.16.0`.
- Deterministic Node tests and real Chromium mobile/desktop manual-diagnostic regression tests; all preexisting CI still required.

## Human acceptance to execute on actual devices — NOT completed by this branch

| Platform | Device and browser version | Date/time SG | Pass/fail evidence (no personal content) |
|---|---|---|---|
| Physical iPhone Safari installed from Add to Home Screen | To record | To record | Pending |
| Physical Android Chrome installed PWA | To record | To record | Pending |

Use non-sensitive sample trips and test only under your own profile. Never send tokens, private contacts, location histories or PWA cache dumps.

1. Online: install/open the PWA, save a sample trip and language, opt in to each of the three public offline packs. Run **Check this device**; capture only generalized status text.
2. Airplane mode (Wi-Fi off): force-close/reopen installed PWA. Confirm shell v81 opens, saved trip/language retained, cached Events/Food/Essentials available, live Weather/Transport not falsely presented as live. Run local-only device check disconnected.
3. Online again: use **Check for content changes**; simulate poor connectivity on-device where safe. Confirm bounded failure reports unverified, manual refresh remains opt-in, and previous packs are retained after interrupted writes.
4. Deny browser storage persistence if offered, or leave unsupported. Confirm status is accurate; never require a permission grant to use basic content.
5. Remove one downloaded pack; ensure the other two remain available. Return offline and verify shell navigation and saved trip.
6. Repeat critical controls in at least Chinese, Malay and Brazilian Portuguese with human review. Note exact untranslated strings, screenshots that omit personal information, OS and PWA install versions.
7. Events editorial reviewer verifies source titles, access and dates, and confirms unapproved discovery records remain unpublished.

### Waves still pending
Wave 2: test interrupted/restarted updates across multiple browser tabs and correct defects.
Wave 3: review multilingual mobile UI/UX and editorial/official-source accuracy with traceable evidence.
Wave 4: consolidated regression gates, release candidate and real-device signoff. No V4.17 production release without separate authorization.

## Wave 2 implementation notes (development)

Per-pack operations now require a browser-managed **exclusive Web Lock**. If unavailable, all mutations fail closed and the application displays a localized warning; the read-only diagnostic remains usable. A storage-event listener refreshes public downloaded-pack status when another tab completes a download or removal. This does not automatically fetch remote content and leaves personal trip settings untouched.

A two-tab Playwright integration test holds a Calendar lock in one tab while another attempts removal; the removal must not touch the pack until release. It then simulates a transaction journal plus corrupt partial write, reloads the other tab and verifies recovery preserves the exact original bytes and personal local settings. The test includes the unsupported-Web-Locks case.

**Caution:** browser storage eviction, cross-version real installed PWA lifecycle and non-Web-Locks browsers still need physical acceptance. Atomic rollbacks cannot recover a browser-evicted journal, and the interface must never promise otherwise.

## Wave 3 implementation notes (development)

The static editorial gate verifies published event dates, HTTPS source URLs, ID uniqueness, and that pending candidate records are still marked `needs-review`. It does **not** approve any newly discovered event, verify live website availability, or supersede human source/admission/rights checks. All 12 device-control locale keys are covered by static and Chromium checks; native-speaker signoff remains outstanding.
