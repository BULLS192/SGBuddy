# SGBuddy V4.22 — Dedicated UX/UI refinement (review-only preview)

**Baseline**: V4.21.0 production at `6932297fd3051307ffef5439ad3bca75d06a1c4a`.
**Branch**: `feature/sgbuddy-v4.22-ux-refinement`.
**Scope**: No feature expansion, schema changes, API integrations, production edits, bookings, event publication changes or paid resources.

## Wave 1: Navigation / home clarity
Primary nav becomes **Today · Discover · Move · My Trip · More**. My Trip routes to the *existing* Discover My Trip tab, not a duplicate planner. More contains the existing **Saved**, **Money** and account functionality. The visitor home shortcut separates **Plan a journey** (transport) from **Plan an itinerary** (multi-day). Discover still has every category, with My Trip promoted earlier.

## Wave 2: My Trip visual hierarchy
Adds a localized, read-only itinerary overview (trip dates, planned days, stop count and **device-only** data warning), makes the existing stop list look like a timeline, and moves the existing calendar/Events tools after the day plan. Print, exports, trip share/import, event handoff, notes, routes, time changes and location search remain wired to their original handlers. No auto-booking.

## Wave 3: Design consistency / responsive controls
New scoped stylesheet harmonizes cards, contrast, focus states and >=44px critical touch targets, adds narrow screen treatment, and respects reduced motion. New strings use all 12 supported locales. App remains labelled **V4.21.0**, with a visible `UX Preview · V4.22` badge, until a separately authorized release freeze.

## Acceptance gates
- Automated GitHub static checks and Playwright 390px / 1366px browser journeys.
- Existing V4.21 API/trip/offline/event regression workflows must remain green.
- Preview from exact tested branch SHA, with no changed production aliases.
- **Manual**: actual iPhone Safari + Android PWA install/offline reload; 12-language native-speaker controls; color contrast/accessibility audit; signed-off layout and app usability.
- If accepted, perform dedicated V4.22.0 build/version/shell-v87 upgrade and controlled production release **only after explicit user authorization**.

These changes are a development preview, not a production release. No existing local trip data is migrated or deleted.

### Final automated accessibility and offline QA
- Multiple width/device class targets: 320, 375, 390, 768 and 1366 CSS pixels in both light/dark modes.
- 12-locale exact nav and Saved utility labels, 44px minimum touch height, basic computed theme contrast, focus/token styles, semantic accessible region headings, retained print/calendar actions and no duplicated trip overviews.
- Service-worker v86 pre-cache verifies new UX JS, CSS and 12-locale dictionary; simulated offline restart retains My Trip, More navigation, saved itinerary and downloaded pack.
- These are automated **partial accessibility checks**, not complete WCAG certification, native-speaker evaluation, human visual sign-off or installed physical-device tests.
