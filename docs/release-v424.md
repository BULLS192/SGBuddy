# SGBuddy V4.24.0 — Singapore Essentials production release

## Release contents
- Audience-filtered, editorially reviewed Singapore government updates and source-discovery candidate workflow (no automatic publication of unreviewed notices).
- Singapore arrival checklist and controlled-goods guidance linked to official agencies; local per-device progress and status-specific SG Arrival Card exemptions.
- Emergency help: 999, 995, 70999, police information and mental-health support with offline contact cards.
- Legal & Feedback: standalone privacy, accuracy, terms and contact notice at /legal.html, localized navigation and pre-account registration links.
- Production client version v4.24.0; offline shell sgbuddy-shell-v90. No Supabase schema or new API credentials required.

## Release gates
- Full GitHub Actions matrix and dedicated V4.24 browser, offline, legal, locale, V4.22 and V4.23 regressions on the exact release commit.
- Confirm Vercel project sgbuddy in Omnidite team, main branch promotion and READY production deployment.
- Post-deploy smoke: /, /legal.html, /data/gov-notices-v424.json, /sw.js; application badge v4.24.0; SOS, arrival, notices, legal links; installed PWA migration to v89.
- Independent legal/privacy review and native-language copy review remain ongoing product responsibilities; the linked agencies remain authoritative.
- Rollback target: last verified V4.23.0 deployment dpl_BtSt2xcZ8mp7YqW1KKxn9WEkwAiK if a production issue is observed.

## V4.24 feedback-privacy hotfix (16 October 2026)
- Remove personal contact email and mailto actions from the in-app Legal & Feedback panel and `/legal.html`; direct users to https://omnidite.com/contact instead.
- Update localized contact action labels and automated browser/static assertions.
- Rotate offline shell to `sgbuddy-shell-v90` so previously installed apps refresh precached legal content; retain client version 4.24.0.
- The contact page is external and requires connectivity; urgent emergencies remain directed to 999/995.
