# SGBuddy UX Waves 4–6 — Implementation and Review

**Branch:** `feature/sgbuddy-ux-waves-4-6` stacked on `feature/sgbuddy-ux-waves-1-3`. Do not merge into `main` before PR #12 and review of this wave.

## UX 4: Mode-context experiences

The single canonical source of mode preference remains `SGBUDDY_CORE.state.mode` with the original persona switch sheet and persisted profile preferences. No new authentication or database schema is introduced.

- Resident — neighbourhood food, everyday services, local transport and saved routes.
- Visitor (shown as Tourist) — sightseeing, food, hotel routing, currency.
- Executive (shown as Business) — punctuality, practical destinations, FX.
- Student — food, libraries/nearby places, campus transport and saved spots.
- New in SG — introductory context retained as an optional fifth experience.

Mode changes update **Home heading, quick actions, Explore context and placeholders, Move guidance, Profile summary and Merli suggestions** through the existing `sgbuddy:persona` event. Existing profile and walking/currency preferences are not overwritten.

**Known limit:** the legacy Supabase nearby-place index maps Student to the New in SG backend persona. The UX addition reorders the retrieved rows for Student-relevant venue types when the public renderer is called, but it does **not** claim a fully dedicated Student database ranking. Dedicated backend support remains a later schema/migration task.

## UX 5: Merli

- Reuses the approved original 2D Merlion WebP and the unchanged V1.4 source-aware advisor.
- Shows three relevant actions by default, with an accessible expandable list of all existing actions.
- One optional, dismissible contextual Home hint; dismissal applies to the current session only.
- Weather/PSI context uses a recent NEA source timestamp and rejects offline/stale/unknown PSI. Merli does not invent an air-quality reading or guarantee any opening hours.
- No language-model connection, extra paid service or new 3D dependency.

## UX 6: Accessibility & quality

- Keyboard navigation across all Discover tabs including Near me.
- Dynamic skip-to-content target follows the active destination.
- Accessible loading/error/empty-state status announcements without reading the entire directory aloud.
- `aria-busy` updates for place and departure containers; journey feedback remains a status region.
- Consistent minimum touch targets, focus outlines, light/dark styles, mobile safe areas and reduced-motion handling.
- PWA cache advances to `sgbuddy-shell-v42` and precaches both UI modules/styles.

## Validation required before merging

1. Run `npm run check` and confirm GitHub workflow success.
2. iPhone Safari and installed PWA: all five nav items; mode switch without returning to wrong tab; Merli launcher clearance; Escape and keyboard focus; light/dark and safe areas.
3. Desktop narrow (approximately 390px), tablet (768px) and wide (1440px): check overflow, two-column Today layout, place details and sheet interactions.
4. Each audience mode: verify Home four action shortcuts, Explore rankings, Move guidance and Merli prompts; Student nearby database ranking limitation above.
5. Discover: Eat/Do/Shop/Apps/Facts/Near me; search, favourites and facts verified/pending labels; keyboard arrow/home/end navigation.
6. Merli: compact prompts, full actions, saved-facts source attribution, weather with fresh/stale/null PSI, session dismiss.
7. Data and fallback: location denied, LTA unavailable, stale/cached NEA, browser offline/online, route comparison, currency, sign-in/out, account sync, saved addresses.
8. Visual QA: keyboard focus trap should occur only in modal dialogs, not Merli's modeless panel; no layout jump on mode change; no incorrect LIVE state for cached data.

Production stays on the existing V1.4 `main` while both stacked UX PRs are drafts.
