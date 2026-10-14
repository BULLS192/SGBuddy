# SGBuddy V4.14 — Events Intelligence, Wave 1

**Development branch only.** Production remains V4.13.0 until a separately approved release.

## Official venue title-quality gate

V4.13's live-review snapshot contained 61 unapproved candidates, including 10 Singapore EXPO records named generically "Events @ EXPO". The V4.9 parser had trusted the first H1 without rejecting that generic category header. V4.14 corrects the *future source ingestion* parser, prioritizing event-specific H1/H2, official page OG/Twitter title, Event JSON-LD and document title. Any remaining URL-slug fallback is explicitly flagged `titleReviewRequired`, classified as `unverified-url-title` and held for human review. A URL slug is **not evidence** of an official title.

The existing checked-in queue is left untouched; no invented titles, retroactive approvals or public updates are permitted. The next scheduled (or approved manual) source refresh can replace matching candidates by stable IDs. Browser-origin source metadata, original URLs, access and ticketing still require editorial verification. All records remain `needs-review`.

Test: `node scripts/check-events-v414.mjs`. Existing `node scripts/check-event-venues-v490.mjs` and `npm run check` also remain gates. This work introduces no new scraping domains, paid API calls, PWA cache changes, profile data or production deployment.

## Next wave

Review source-specific candidate accuracy with original event detail pages, enforce de-duplication by official URL, distinguish event vs retailer promotion, and build a curated "This weekend" experience from **approved** records only. Keep 12-language content and offline freshness representation.

## V4.14 Wave 2 — conservative duplicate holds and approved weekend picks

- `lib/events-identity-v414.mjs` implements official URL normalization that ignores marketing parameters but retains meaningful event query parameters. Generic organizer landing URLs are **not** event-unique. Separate identity signals include exact ID, specific official URL, or non-generic matching title + venue root + overlapping Singapore-local dates.
- Both publisher review queues and publication compiler detect likely duplicates. A review match is flagged `potential-review-duplicate`; a published match remains `potential-already-published`; **nothing is auto-approved or silently merged**. Review summary reports duplicate counts and matching IDs. Previously published records remain unchanged.
- `lib/events-weekend-v414.mjs` selects a small, diverse, persona-aware set **only from published dated records** that have current verification; unapproved candidates and stale entries cannot surface. `app-events-v470.js` adds three official-link picks to the homepage Events shortcut with existing translated category labels and the source-freshness disclaimer. No reservation or live availability claims.
- New static `scripts/check-events-v414-wave2.mjs` and mobile/desktop `scripts/browser-qa-events-v414.mjs` exercise duplicate edge cases, queue isolation, locale switching, offline/discover compatibility and source URLs. These checks do not certify real browser platforms or native-speaker quality.

## V4.14 Wave 3 — admission evidence, review-ready worklist and signed-approval safeguard

Discovery is **not** publication. The current queue still holds 61 unapproved candidates. Venue-page ingestion now records `admissionEvidence`, `access` and `publicAccessEvidence` only when its official source explicitly says "Open to Public (Free)" or "Open to Public (Ticketed Admission)". Other venue calendars, including Suntec listings which state dates but omit public admission, stay unverified. Never infer admission from a title like "Bazaar", promotion or a linked calendar date.

`lib/events-editor-v414.mjs` and read-only `scripts/event-editor-worklist-v414.mjs` create a prioritized, linked editorial checklist (weekend, next fortnight, generic headings, duplicates, promotions, expired). They require evidence for admission, public eligibility, first-party title and rights; even a complete collector record is **never auto-approved**. GitHub Actions and daily snapshot reports can show these review lanes without any data publication.

`lib/events-approval-guard-v414.mjs` adds explicit `titleVerified` and `publicAccessVerified` signatures, a 14-day review freshness limit, publisher-host matching, no provisional/generic headings, no unspecified admission and no duplicates with previously published or currently approved events. The existing `sourceVerified`, `publicAdmissionVerified`, `publicListingRightsVerified` and editor identification checks remain mandatory. The manifest still has no approvals; `--publish` remains a human-operated, reviewed action.

No new curated listings are claimed in this wave: a verified date on the venue listing is not sufficient proof of admission or publication rights. Existing public events, source registry and the queue are unmodified. V4.13.0 production stays untouched.

## V4.14 Wave 4 — category and broad area filters, My Trip integration

The user-facing Events panel now offers **region** filtering based solely on the official source registry's broad `area` field (central, east, west, north, south, islandwide). This is *not* a geolocation, radius, or exact distance. Unknown area sources are excluded if users choose a specific region; the full list remains available with All areas. A separate activity category selector complements Weekend, Upcoming, Free, Markets and Family. All new controls use first-party translations across the twelve supported UI locales.

Each **published** event has an explicit **Add to My Trip** action. Existing trips receive the event on a day that intersects its official event date range. If no day overlaps, the app creates a separate single-day trip starting on the next valid event day; it never silently inserts an event on an unrelated date. Duplicate/full days and the 8-trip ceiling return errors. Changes remain device-local, and storage failures roll back additions. Trip stops show a direct official source link and retain no promise of ticket availability, bookings or confirmed access.

New `lib/events-explore-v414.mjs`, `lib/events-explore-i18n-v414.mjs`, and Wave 4 static/browser QA prove area/category scope, time-window alignment, duplicate prevention, all 12 locale labels, link origin and offline-safe device storage. Only reviewed `data/events-v470.json` is visible: the 61 review candidates are **not** published. No new ticketing, payment, map-distance or paid-source integrations.

## V4.14.0 release candidate closure

Wave 1 (official event-title provenance), Wave 2 (duplicate safeguards and curated weekend picks), Wave 3 (read-only editorial worklists, evidence and manual approval gates), and Wave 4 (12-locale area/category filters and event-date-aware My Trip) are now implemented in one release branch.

The release-candidate version badge and bootstrap are **V4.14.0** and the service-worker shell is rotated to **sgbuddy-shell-v79**. User-downloaded content remains in independent `sgbuddy-offline-packs-v480`. This is a **staged branch only**, not a production deployment. Verify `node scripts/check-release-v414.mjs`, full CI at the exact release head, and real installed-PWA iOS/Android smoke tests before production promotion. A real V4.14 deployment is still a separate authorized step.

The 61 unapproved discovery candidates and the 11 published curated events remain unchanged; no provider-specific event admission or copyright rights are inferred. Do not claim that the 95%+ whole-app multilingual coverage target, native-speaker review, or real-device acceptance is certified by automated Chromium testing.
