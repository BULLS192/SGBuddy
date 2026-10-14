# SGBuddy V4.14 — Events Intelligence: official identities

**Wave 1 / development only.** Production remains on V4.13.
- Root cause: some official Singapore EXPO detail pages render a generic **Events @ EXPO** headline rather than the actual event title. The old parser accepted this generic title and the nightly review queue consequently contains 10 generic EXPO entries.
- Only assign an event title using *same-page official publisher evidence*: Open Graph `og:title`, `twitter:title`, `application/ld+json` objects of Event type, non-generic `h1/h2`, or a meaningful official HTML document title. The event's `titleEvidence` field records the source.
- **Never derive a public event title from an URL slug.** When the official page lacks a specific title, return no newly discovered candidate and flag the existing stored entry for manual resolution in V4.13 triage. Do not clear last-known review records merely because a live detail page is temporarily generic.
- Date, source link, robots/HTTPS hostname checks, public-access exclusion and separate named-editor approval remain mandatory. These are still *candidates*, not published recommendations or proof of free public entry.
- Automated fixture coverage validates source metadata and rejection of generic titles, private events and stale queue leakage. No paid sources, external crawling additions, production deployment or new event publication in this wave.

## Next waves
Prioritize official data / feed integration for other venues with proven permission and host constraints; add review-console actions, robust duplicate identity and useful 'This weekend' recommendations only after human verification.
