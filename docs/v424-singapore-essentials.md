# SGBuddy V4.24 — Singapore Essentials (production release)

V4.24 extends V4.23 without changing five primary tabs, Trip persistence, Supabase schema, or Events editorial publication.

## Included

- Transparency: standalone offline-readable `legal.html` with privacy practices, data providers, accuracy and emergency disclaimers, terms of use and feedback contact. The app exposes a localized Legal & feedback tab plus a link from the account sign-up sheet. Uses the published Omnidite contact `kevin@omnidite.com` via mailto; no feedback database or hidden submit.


- Emergency: offline-cached numbers for Police 999, SCDF 995, police emergency SMS 70999, and police information hotline. Calls/SMS are device handoffs, never auto-dialled.
- Entry: per-trip local checklist, residency and border-mode SG Arrival Card exemptions, date-derived three-day submission window, HSA/CNB/ICA/Customs links, and searchable goods guidance.
- Government: audience-filtered, reviewed, expiring notices from official HTTPS agencies, with source attribution and a stale-review warning. The seed is an editorial snapshot, NOT live alerts.
- UI: Today shortcuts, header SOS, More hub, 12-language navigation labels and clear external sources. English legal summaries link to English authoritative pages.
- Offline: release shell v89 caches the rules, presentation, and reviewed feed. No cloud storage for trip dates, no account schema change.

## Limitations and acceptance

- Government notice discovery, ongoing review, and opt-in notification automation require a separate reliable pipeline. Never describe this snapshot as continuously monitored.
- Native-speaker review in all 12 languages and actual mobile PWA tests are outstanding. Browser automation cannot certify physical devices or full accessibility.
- Editorial review required before every notice is published. No automatic scraping to public feed.
- The SG Arrival Card is not a visa; transit without immigration clearance and land-arriving residents are exempt.
- Vapes and controlled recreational drugs are prohibited. Do not label all medicines as prohibited: some need HSA approval.
- The 1777 non-emergency ambulance hotline ceases from 1 January 2027 and is not advertised as an emergency number.

## QA

Run Node rules tests with node scripts/check-v424-essentials.mjs.
Run Playwright acceptance against local HTTP server on port 8765 using node scripts/browser-qa-v424-essentials.mjs.
Keep V4.23 regression and V4.22 offline checks green before any merge.

## Next subwave

Implement source discovery only from permitted official RSS/API/newsroom sources. Deduplicate into a private review queue, require source-backed approval, record editorial review/expiry metadata, and publish after verification. Only then add opt-in critical alerts.

## Legal / privacy release check

- Operator/privacy owner should independently review the wording, retention and account deletion process, Supabase/Vercel data flows, cross-border providers, and any PDPA responsibilities before production release.
- The full notice remains in English; legal tab navigation uses the twelve shell languages. Arrange native-language review if localized policies are later introduced.
- The account creation screen links directly to Privacy and Terms before registration. The legal page and app summary are precached for offline access. Signing out does not clear local device information.
- Ensure the published Omnidite inbox remains monitored for feedback and privacy access, correction or deletion enquiries. Email links open the user's mail app; no promise of urgent response.
