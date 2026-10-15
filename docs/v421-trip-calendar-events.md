# V4.21 stacked development — My Trip calendar + published events

Based on V4.20.0 release candidate `f538875875b9608ba006f8090980deab4075df65`, not on live V4.19 production.

## Wave 1: Calendar export
An explicit, device-local download (.ics) of **timed itinerary stops only**. Singapore timezone is encoded in DTSTART; VEVENT contains no guessed DTEND, calendar attendees, reminders or ticket purchases. Personal notes can appear in this downloaded file; the interface warns the user.

## Wave 2: Trip-specific published Events
An explicit button loads `/data/events-v470.json` plus `/data/event-sources-v470.json`. Only scheduled, verified records from the published feed whose dates overlap the trip are shown. Organizer URL host must match its source registry. A stale snapshot is marked for reconfirmation; public ticket availability is never claimed. Adding an event uses the existing My Trip API and never automatically books it. The editorial queue is never requested.

## Safeguards
Existing device-local `sgbuddy-my-trips-v260` and all V4.20 features remain intact. No backend, paid API, cloud sync or service changes. New UI is translated for 12 locale codes.

## Acceptance & release
`node scripts/check-v421-calendar.mjs`, `node scripts/check-v421-events.mjs`, `node scripts/check-v421-integration.mjs`, and Playwright `scripts/browser-qa-v421-trip.mjs` run in CI. The stacked V4.21 branch retains **V4.20.0/v85** intentionally; before a V4.21 production release, increment version/worker, precache the new code and CSS, update historical assertions and run installed-device QA. **Do not merge or deploy without separate authorization.**

## V4.21 controlled production gate
Release candidate updated to **V4.21.0 / shell v86**. Worker precaches all four new application and library assets. Source cache `sgbuddy-offline-packs-v480` and trip local storage stay unchanged. Exact-final-SHA release QA and separate physical installed-device acceptance required; production promotion remains prohibited before verifying green CI.
