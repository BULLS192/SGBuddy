# SGBuddy V4.14 — Events Intelligence, Wave 1

**Development branch only.** Production remains V4.13.0 until a separately approved release.

## Official venue title-quality gate

V4.13's live-review snapshot contained 61 unapproved candidates, including 10 Singapore EXPO records named generically "Events @ EXPO". The V4.9 parser had trusted the first H1 without rejecting that generic category header. V4.14 corrects the *future source ingestion* parser, prioritizing event-specific H1/H2, official page OG/Twitter title, Event JSON-LD and document title. Any remaining URL-slug fallback is explicitly flagged `titleReviewRequired`, classified as `unverified-url-title` and held for human review. A URL slug is **not evidence** of an official title.

The existing checked-in queue is left untouched; no invented titles, retroactive approvals or public updates are permitted. The next scheduled (or approved manual) source refresh can replace matching candidates by stable IDs. Browser-origin source metadata, original URLs, access and ticketing still require editorial verification. All records remain `needs-review`.

Test: `node scripts/check-events-v414.mjs`. Existing `node scripts/check-event-venues-v490.mjs` and `npm run check` also remain gates. This work introduces no new scraping domains, paid API calls, PWA cache changes, profile data or production deployment.

## Next wave

Review source-specific candidate accuracy with original event detail pages, enforce de-duplication by official URL, distinguish event vs retailer promotion, and build a curated "This weekend" experience from **approved** records only. Keep 12-language content and offline freshness representation.
