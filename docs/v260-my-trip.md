# SGBuddy V2.6 — My Trip
## Implemented
- A new **Discover → My Trip** destination and a direct link from **Travel prep**.
- Create up to eight separately named trips per device, with start date and 1–14 days each.
- Add existing Discover venues from their cards, or search the same combined directory within My Trip.
- Add user-entered activities (clearly labeled custom and unverified), add stops to the chosen day, edit optional time and note, mark visited, reorder, move to another day, or remove.
- Keep trip and day selections in a device-local, schema-validated JSON record. Limits: 30 stops per day; 280-character notes.
- Share with Web Share API or copy a readable itinerary; export a UTF-8 .txt file for another device/recipient.
- English and Simplified Chinese UI, responsive mobile layout, keyboard-focus styling and upgraded PWA cache.

## Honest boundaries
**Device-only**, not Supabase/cloud account sync. Clearing browser storage deletes the plan. This release does **not** make reservations, issue shareable cloud links, estimate time/distance between stops, confirm prices, entry points or venue operating hours, or guarantee catalogue data are current. Google Maps links are search queries (not verified entrance directions). App never saves passport/credit-card details.

## Validation
- `npm run check`: V2.6 model validation plus existing regression checks.
- `SGBuddy V2.6 My Trip Browser QA`: Chromium end-to-end create/edit/search/move/reload/localization/mobile test.
- The existing V2.5 Chromium suite runs against both V2.5 and V2.6 for regression.

## Release procedure
Keep this branch and preview separate from production until CI, interactive smoke QA and owner feedback are complete. Check first-visit location sheet, switching away from the tab, mobile horizontal scrolling, persistent draft, and light theme. Merging requires a separately approved production release.
