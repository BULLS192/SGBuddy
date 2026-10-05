# SGBuddy release QA checklist

Run `npm run check` before every production deploy.

## Mobile / PWA
- Launch from Safari and installed Home Screen PWA.
- Confirm logo, safe-area spacing, and bottom navigation.
- Tap Today, Transport, FREYA, Travel; verify movement and highlighted active tab.
- Switch Resident / Traveller mode and confirm only the mode changes.
- Test location: granted, denied, and Not now.
- Reopen the PWA and confirm current assets load after a release.

## Transport
- Search an MRT/LRT station and a 5-digit bus stop.
- Toggle Cards / Map and Fit all.
- Save/remove a station and bus stop.
- Pin/unpin a bus service.
- Rename and reorder a saved bus stop.
- Refresh transport and verify the button recovers from loading state.

## Profile / data
- Save Home / Work / Hotel.
- Sync profile, link device, export/import.
- Run Data Core diagnostics and Refresh all data.
- Confirm API failures show a visible error rather than an endless skeleton.

## Journey planner
- Native route: station → station.
- Native route: current location → station.
- Native direct-bus route when one exists.
- Unsupported address should explain the OneMap requirement and keep Google Maps fallback available.
