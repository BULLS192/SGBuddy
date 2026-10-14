# SGBuddy V4.13 release acceptance checklist

**Production:** V4.12.0. **Development:** PR #69 on `feature/sgbuddy-v4.13-stability-qa`.
**Do not promote based solely on green Chromium tests.** Mark physical-device results only after actual testing. Never save passwords, tokens or personal profiles to screenshots or CI artifacts.

## Automated gates (GitHub)
- [x] Five personas × 12 locale switches, on mobile/desktop Chromium.
- [x] Air Quality authored strings, NEA numeric/source preservation, stale and cached reading labels.
- [x] Weather/train/traffic outages and last-good fallback do not falsely say refreshed.
- [x] Curated Events and editorial-gated unapproved discovery candidates.
- [x] V4.8 offline pack download and cached JSON fetch in Chromium.
- [ ] **V4.13 additional disconnected restart and interruption tests:** verify the latest commit's `pwa-disconnected-restart` check passes.
- [ ] Latest **whole-PR** CI green after any final fixes; check deployed target SHA.

## Real iPhone Safari / Add to Home Screen (manual, not emulated)
- [ ] Open HTTPS production or an approved, accessible release-preview URL in Safari; record device/iOS version and test URL.
- [ ] Add SGBuddy to Home Screen; launch it from the installed icon rather than browser tab.
- [ ] In Account, download **Calendar, Essentials and Food**; verify all show complete.
- [ ] Switch to French or Chinese and Visitor mode. Save a non-sensitive sample trip/location.
- [ ] Enable airplane mode (disable Wi-Fi too); **fully close and reopen** the installed app.
- [ ] Verify app shell opens; saved persona/language and trip/location survive; all downloaded packs remain marked available.
- [ ] View cached Singapore Events/holidays and Food info; live weather/traffic show stale/unavailable status, **not live claims**.
- [ ] Switch language while offline; verify labels and no clipped horizontal scrolling.
- [ ] Re-enable internet; refresh; check live source/freshness updates, and confirm packs can be updated.
- [ ] Remove only one pack; other packs remain intact. Reopen again.
- [ ] If low-storage/eviction can be reproduced safely, confirm missing pack is clearly shown instead of claiming it is ready.

## Real Android Chrome / installed PWA (manual, not emulated)
- [ ] Repeat the iPhone sequence above on a physical Android device; record Android/Chrome version.
- [ ] Exercise allowed and denied geolocation; app remains usable without GPS.
- [ ] Compare normal and offline installed launches and recovery without duplicated saved records.

## Release-day checks (manual)
- [ ] Verify source rights and public admission for any **new** event before editorial approval.
- [ ] Verify current curated Events date range and automated feed review queue separately.
- [ ] Native-speaker review of important languages, especially Account, Merli, Food and error paths.
- [ ] Record checked PR SHA, production candidate deployment ID and rollback deployment.
- [ ] Release **only when separately authorized**, verify domain alias + production badge + critical API health, and retain V4.12 rollback.
