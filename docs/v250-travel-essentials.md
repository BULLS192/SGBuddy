# SGBuddy V2.5 — Travel Essentials and language foundation

**Branch:** feature/sgbuddy-v2.5-travel-essentials  
**Scope:** travel preparation, English / Simplified Chinese foundation, expanded everyday apps.  
**Release:** development PR, preview QA before any production merge.

## Included
- Discover: Travel prep tab with payment, messaging and eSIM advice using official publisher links.
- 3 mobile apps: WhatsApp, WeChat, Alipay. 3 visitor connectivity web services: Singtel, StarHub, M1.
- Existing V2.4 directory of 69 listings is preserved; the travel additions are merged at runtime.
- Top-bar language picker for EN and Simplified Chinese; key navigation, new travel guidance, and app-guide controls.
- Pre-arrival checklist with device-local saved progress, and Home shortcut into Travel Prep.
- PWA shell bumped to v52; new regression script scripts/check-v250.mjs.

## Limitations and safety
- This is the first bilingual release, not a full translation of the large place/food/health directories; legacy descriptions can remain English.
- Wallet account eligibility and merchant acceptance vary. Alipay, Alipay+, Weixin Pay, PayNow, SGQR and NETS are not interchangeable.
- Data-only eSIMs may not provide local calls or SMS; confirm phone compatibility, carrier lock, ID registration and current provider plan terms.
- The checklist stores only checked step identifiers, never identity documents, card numbers or payment details.
- No live booking availability, purchase or reservation confirmation is claimed. The existing planner is a point-to-point route tool, not a multi-day itinerary.

## Release QA
1. Open Discover > Travel prep; exercise all three advice categories and official links.
2. Toggle English / 简体中文; reload and verify language persistence and scroll stability.
3. Check/uncheck arrival steps; reload and verify device-local persistence.
4. Open Everyday apps and search six new listings; test mode filters and web-only labels.
5. Open Home shortcut, browse Discover, change user modes, check Merli, food, saved and routes.
6. Verify 375px mobile, desktop, dark/light theme, keyboard focus and PWA refresh.
7. Run npm run check. This includes scripts/check-v250.mjs.

## Future waves
- My Trip: day-by-day saved itineraries with realistic transport and dining.
- Sharing: read-only copies, share links, printable/offline exports.
- Booking connections: official external links first, then confirmed partner integrations; opening links must not be shown as booked.

## Primary sources
- https://www.whatsapp.com/download/mobile
- https://www.wechat.com/
- https://render.alipay.com/p/s/download
- https://www.alipayplus.com/sg/
- https://www.singtel.com/personal/products-services/mobile/prepaid-plans/hi-tourist
- https://www.starhub.com/personal/mobile/tourist-sim.html
- https://ibuyprepaid.m1.com.sg/
