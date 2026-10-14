# V4.15 Offline 2.0 — Wave 1 (development only)

Production is V4.14.0. This branch improves CacheStorage integrity and recovery; no production deployment is included.

- Read and JSON-parse **actual cached bodies** before marking a pack ready. Missing/damaged items are shown for repair.
- Preflight every first-party JSON resource before writing. Save previous responses and restore successfully overwritten files if a CacheStorage write fails (including quota failure). A sudden device crash can still interrupt writes; on next launch integrity inspection detects incomplete packs and prompts repair.
- Show `navigator.storage.estimate()` usage and a warning above 85%, where supported. This is a broad browser storage estimate, *not* the exact size of SGBuddy.
- Distinguish recently downloaded vs unknown/older-than-14-day content, without claiming events or live services are currently valid.
- Retain all 3 opted-in packs, their `sgbuddy-offline-packs-v480` cache, and 12 locales. Add only first-party helper modules to the existing V4.14 PWA shell. Do not rotate the public version until an authorized V4.15 release.

Automated static/browser checks exercise corrupted JSON, recovery, update rollback, quota and multilingual status. Physical iOS/Android PWA testing remains separate.
