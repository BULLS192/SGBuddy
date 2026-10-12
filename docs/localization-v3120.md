# V3.12 — Generated Saved, journey, and itinerary UI translation

Development branch from released V3.11: b76b46dd3f0e2f570cfac8632e6392661381b81a.

25 new locale-owned messages in all 12 supported locales cover Saved result-card fallbacks, open-details actions, saved/recent trip suggestions, native journey result summaries, map actions, and itinerary entry placeholders. Translation is applied by **the rendering owner**, not a broad MutationObserver. User trip names, note content, place names, addresses, official route descriptions, real-time status and source-provider text are preserved. Unknown messages deliberately retain their original values.

## Verification

- `node scripts/check-v3120.mjs` — complete per-language keys, field interpolation and wiring.
- `node scripts/check-all.mjs` — existing complete static regression suite plus new assertions.
- Existing V3.11 browser tests remain active; `node scripts/browser-qa-v3120.mjs` checks generated screens in 12 languages at mobile/desktop widths. Native review remains pending.

## Remaining audit gaps

This wave does **not** localize every externally supplied route step, rich Merli free-form answer, provider warning, account error, or editorial record. Native-speaker review and a rendered-screen whole-app denominator remain outstanding; the earlier ~80–85% figure is only a planning estimate. **No new whole-app completion percentage is certified**.

Release: development PR only; do not merge `main` or alter production until authorized.
