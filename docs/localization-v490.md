# SGBuddy V4.9 — Dynamic Food and accessibility localization

**Development branch:** `feature/sgbuddy-v4.9-dynamic-food-a11y` from V4.8 offline/events branch at `5ae9fb468377c02b69dea11373602236464f7346`. Production **V4.2.0** unchanged.

## Implementation
- 17 authored UI keys across 12 locales (204 authored entries), including dynamic numerical counts and source publisher/name placeholders.
- Localizes Food picker summary after records load, retry/unavailable messages, MICHELIN and CNA badge text, save-pick buttons, and Read/Open link actions without altering linked names or URLs.
- Adds first-party accessibility labels for account/mode/weather controls, journey/currency swap and map panels.
- Source-locked selectors only, preserving operator, business and stall names, official sources, authenticated data, currency amounts, selected neighbourhood/craving and English-original MUIS safety note.
- Integrates with V4.8 offline pack cache and 2026 holiday/event UI. New translation assets added to the PWA precache; no shipping cache or version bump.

## Verification
`scripts/check-v490.mjs` validates locale completeness, dynamic placeholders, bootstrap, offline assets. `scripts/browser-qa-v490.mjs` checks dynamic messages and accessibility across all 12 locales in 390px/1366px Chromium, with real Food state and offline pack elements. V4.8 offline download tests, V4.3 rendered text evidence and legacy tests must remain green.

**Unverified:** native speaker semantics, all personas/states, iOS Safari and Android installed PWA. No claimed whole-app translation percentage.

Do not merge out of order; V4.9 stacks after V4.8 draft PR #60.

## Ownership note
The V4.2 contextual module already translates some count/area status messages, and its previously reviewed wording may differ from the V4.9 fallback. V4.9 defers to an already-localized message instead of overwriting it; the browser test verifies non-English rendering and preserved numeric parameters in that case.
