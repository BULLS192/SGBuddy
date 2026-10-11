# SGBuddy V3.1 — content localization baseline

Status: V3.1 development branch, not a complete multilingual library.

## Architecture

- App-owned interface labels are handled by the V2.8–V3.0 catalogues.
- `lib/i18n-content-taxonomy-v310.mjs` provides 36 original-English taxonomy values with translations for all 12 supported languages. Stored values, IDs, URLs, filtering and published record fields remain unchanged; only labels and search aliases are localized.
- `lib/i18n-facts-v310.mjs` provides source-checked, ID-addressed translations for the first ten verified facts. The source text must **exactly match** the original published fact, and the fact must remain verified. If either changes, SGBuddy deliberately falls back to the original until an updated translation is reviewed.
- Names, dates, street addresses, postal codes, provider links, prices, halal/health assertions and live data are never translated through string replacement.
- `app-device-translate-v300.js` skips curated, source-locked content so on-device translation does not translate it a second time.

## Coverage snapshot

| Segment | Existing records | Pretranslated in V3.1 for non-English locales |
| --- | ---: | ---: |
| Published verified facts | 152 | 10 |
| Core Everyday Apps summary/purpose entries | 69 | 0 |
| Singapore dish descriptions | 82 | 0 |
| Hawker-stall research notes | 93 | 0 |
| Content taxonomy display names | 36 | 36 |
| Discover curated place names | 271 | Proper names remain original by design |

These are initial counts and do not include extra app entries or operator listings merged at runtime. The exact counts are generated from source files by `node scripts/localization-report-v310.mjs --json`. CI uploads the report artifact. **Do not claim 100% coverage.**

## Next batch: content packs rather than runtime translation

1. Expand fact templates/records to all 152 published facts, grounded by immutable source IDs and source-text checks.
2. Create reviewable record/field translations for the 69 app summaries and purposes, 82 dishes, and the remaining source-owned notes. Distinguish factual statements from labels.
3. Attach a source revision, locale, translation state (`reviewed`, `pending`, `stale`) and original text for each translated record.
4. Ensure multilingual search indexes include translated text without altering canonical search terms.
5. Build QA enforcing required locale coverage for newly approved translations; do not block display of already-verified original English data in unsupported locales.
6. Continue the Merli V3.2 multilingual conversation phase only after the content pipeline is reliable.

## Check and test

```bash
npm run check
node scripts/localization-report-v310.mjs --json
node scripts/browser-qa-v310.mjs
```

No database or paid translation API is needed for this reviewable static-pack approach. Future batch generation can be done offline with human review before commit.
