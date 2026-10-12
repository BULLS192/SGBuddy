# SGBuddy V3.8 — Whole-repository multilingual coverage baseline

**Branch:** `feature/sgbuddy-v3.8-whole-app-localization-audit`. This is an audit-only development change; production remains V3.7. No runtime UI or translation values are modified.

## What the measured percentages mean

The report intentionally distinguishes these three denominators:

1. **Registered UI messages:** 393 keys per locale across the V3.4–V3.7 reviewed first-party catalogues. All declared fields being populated measures dictionary completeness, **not** runtime activation or linguistic correctness.
2. **Known authored content:** the 393 keys plus selected *published, source-locked* editorial units for verified Singapore facts, app summary and purpose, dishes, hawker-stall notes, itinerary guidance/checklists and travel-app descriptions. Source-specific lookup functions verify every non-English translation against the current record and return `null` on an English fallback or changed source. This yields an auditable `percentOfClassifiedItems` **per locale**.
3. **Unclassified parts of the whole app:** all 16 committed JSON data files, active and archived app JS, API and backend JS, static HTML candidates and unsurfaced source-authored fields. They are counted and queued for manual classification, **but cannot justifiably enter the translated/untranslated denominator until ownership, actual screen reachability, and source-locking are confirmed.**

Hence `globalWholeAppCompletionPercent: null`. The earlier approximate **70%** must not be represented as measured or used as a production KPI.

## Explicit exclusions and classification

Official business/place names, postal addresses, coordinates, fares, current prices, provider URLs, external descriptions, government statements, third-party disclosures and users' original text stay in their source language unless approved and bound to an explicit context-aware rendering strategy. Values are not counted untranslated simply because they contain English. However **editorial** `notes`, `summary`, `description`, `purpose` and related fields without verified translations appear in the unclassified queue: they are **not silently excluded** from the report.

Source-specific content duplicate references are reported without inflating the verified translation numerator. Dynamic text generated from literal strings has separate buckets for **active client**, **archived client**, **API**, and **backend libraries**. A string scan can miss template literals, nested HTML, runtime API/third-party replies and conditionally mounted screens, so these remain open measurement gaps.

## Run the audit

Use Node 22, from the repository root:

```bash
node scripts/audit-app-v380.mjs
node scripts/audit-app-v380.mjs --json
node scripts/audit-app-v380.mjs --out=localization-v380.json
node scripts/check-v380.mjs
```

A dedicated GitHub Action runs the audit and uploads the full JSON report as a CI artifact. It includes locale-by-locale category percentages, selected source fallbacks, unresolved editorial fields grouped by dataset, candidate client and server messages, native-speaker review readiness, and the assumptions that prevent an app-wide figure. The manifest is checked against 12 locale codes, the 16 JSON files and the current app bootstrap.

## How to reach an actual whole-app metric

1. **Classify** all active client/API/UI strings and all editorial fields as translatable, already localized, third-party/provider-owned, deliberately source-preserved, not surfaced or unknown. Record screen and data-owner references for each.
2. **Instrument** screen navigation, toggles and conditional error states across Resident/Tourist/Business/Student and all 12 locales to verify what actually displays (including Merli).
3. **Close localization gaps** with authored keyed messages, source-field equality guards, placeholder safety and native-speaker review. Preserve original place names and provider facts.
4. **Measure** the fully classified, reachable set using a stable, versioned definition of what counts as a message/field. Publish per-language rates and human-review pass rates independently. Only then publish an app-wide completion percentage.

**Decision gate:** Native-speaker review of the V3.7 572-item worksheet and V3.6 33 domain checks is still outstanding. A filled dictionary does not imply human approval.
