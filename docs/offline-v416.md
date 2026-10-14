# V4.16 Offline Freshness — Wave 1 development
This branch starts from deployed V4.15.0 merge `c8de8b067b1c03d91469cf2501d9791ec8dfe27a`. No production version bump or deployment is authorized for V4.16.

A user-controlled **Check for content changes** button probes only files already in `sgbuddy-offline-packs-v480`. It makes same-origin allowlisted HEAD requests (no response-body downloads), comparing strong ETags or reliable Last-Modified headers. Weak/missing validators, network failures and ambiguous dates are **unverified**, never treated as current. Results are per pack and aggregated, shown in all 12 app languages. Nothing is refreshed, opted in, persisted, or cached by the check.

The existing V4.15 **Refresh downloaded packs** action is still the only way to update saved content and retains durable rollback. Events, Food, Essentials, saved trips, API routes, maps and other private data remain isolated.

Next waves can add safe changed-file updates with pack-level recovery, provenance, Playwright browser coverage and real-device acceptance. This first commit does **not** claim V4.16 completion.
