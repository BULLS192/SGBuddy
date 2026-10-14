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
