# SGBuddy V4.9 — Official Venue Expansion and Offline Device QA

This branch is stacked on V4.8 (which contains V4.7, V4.6 and V4.5 multilingual work). Production and main stay unchanged.

## Official publisher discovery — review-only

- **Singapore EXPO:** check the public event directory, fetch a small bounded number of individual official detail pages, parse stated local dates and admission, and exclude invitation-only/trade-only functions from tourist recommendations.
- **Suntec City mall:** separate from Suntec Singapore Convention Centre. Collect dated event pages but do not assume admission is free.
- **313@somerset:** promotions remain classified separately as promotions until a curator confirms a public event or activity.
- Existing Suntec Convention Squarespace JSON + NEA official RSS sources continue operating with their original reviews.
- Check robots.txt, restrict hostnames and HTTPS, follow only bounded approved directory paths, constrain response size and timeouts. Do not bypass anti-bot or scrape protected/private pages.
- All discoveries land in `data/events-review-queue-v470.json` as `needs-review`; live website `data/events-v470.json` only contains previously curator-verified entries.
- Automated sources will run once daily **only when merged to main**. PR QA fetches a preview artifact so the queue can be inspected without publishing or deploying.
- Never infer attendance eligibility from a calendar date; reconfirm ticketing and site conditions.

## Offline and localization

Existing V4.8 real disconnected-browser tests remain required. V4.9 adds device-viewport and reduced-network smoke tests; **emulation is not physical Safari / iOS / Android testing**. Device QA checklist: Add to Home Screen, airplane mode, reload, downloaded packs, storage eviction, language switching, and cleanup on each device. Locale content must be verified beyond interface labels and native review is pending.

## Outstanding

Curation of additional official event sources (CapitaLand mall calendars, VivoCity and MBS directories), native-speaker review for all 12 languages, manual Safari/iOS/Android installed-device QA, publisher rights review, and safe user consent for alerts. Do not assert comprehensive automated event coverage before ingestion outputs are verified.
