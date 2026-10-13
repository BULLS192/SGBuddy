# SGBuddy V4.0 candidate — Food & Discover localization on V3.12

Status: isolated development candidate; **not in production**, UI release badge remains v3.12.0 until release approval.
Source: V4.0 draft PR #42 was 44 commits behind main and could not be safely merged unchanged. This candidate reapplies the targeted runtime changes to the V3.12 main tree; no V3.11.1 Merli hotfix, V3.12 Saved/journey module, or production dependency is removed.

## Coverage
- 16 first-party Food messages and 11 Discover messages in English plus all 11 target locales: **27 keys × 12 languages = 324 authored entries**.
- Food result counters, stall verification warnings, menu caveats, OneMap matching outcomes, Merli food-picker empty state.
- Discover counts, search placeholders, facts review statuses, no-match messages and pagination.
- Protected official source names, place addresses, station codes, provider statements, pricing and halal/dietary claims remain unchanged. Source-locked published translations remain prioritized.
- V3.12.0 stays the displayed badge while the development branch is under review. Cache advances to v71 and precaches the two new authored dictionaries.

## Tests
Run `node scripts/check-v400.mjs`, `node scripts/check-all.mjs`, and `node scripts/browser-qa-v400.mjs` (with Chromium and the local HTTP server on port 8765). GitHub Actions V3.2 browser workflow includes the new browser QA step. All earlier Merli/V3.12 checks remain enabled.

## Limitations
Native-speaker quality review is not complete. The prior classified authored-content inventory **is not** a whole-app denominator; new catalogue count is separately checked, not folded into a fabricated 95–99% metric. Open-ended Merli replies, dynamic API errors, source-authored editorial text, many conditional states and independent iPhone/Safari offline QA need follow-up.
