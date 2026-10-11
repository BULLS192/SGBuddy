# SGBuddy V3.1 — content localization baseline

Status: V3.1 development branch, not a complete multilingual library.

## Architecture

- App-owned interface labels are handled by the V2.8–V3.0 catalogues.
- `lib/i18n-content-taxonomy-v310.mjs` provides 36 original-English taxonomy values with translations for all 12 supported languages. Stored values, IDs, URLs, filtering and published record fields remain unchanged; only labels and search aliases are localized.
- `lib/i18n-facts-v310.mjs` provides source-checked, ID-addressed translations for the first twenty-six verified facts. The source text must **exactly match** the original published fact, and the fact must remain verified. If either changes, SGBuddy deliberately falls back to the original until an updated translation is reviewed.
- Names, dates, street addresses, postal codes, provider links, prices, halal/health assertions and live data are never translated through string replacement.
- `app-device-translate-v300.js` skips curated, source-locked content so on-device translation does not translate it a second time.

## Coverage snapshot

| Segment | Existing records | Pretranslated in V3.1 for non-English locales |
| --- | ---: | ---: |
| Published verified facts | 152 | 26 |
| Core Everyday Apps summary/purpose entries | 69 | 0 |
| Singapore dish descriptions | 82 | 82 |
| Hawker-stall research notes | 93 | 0 |
| Content taxonomy display names | 36 | 36 |
| Discover curated place names | 271 | Proper names remain original by design |

These are initial counts and do not include extra app entries or operator listings merged at runtime. The exact counts are generated from source files by `node scripts/localization-report-v310.mjs --json`. CI uploads the report artifact. **Do not claim 100% coverage.**

## Next batch: content packs rather than runtime translation

1. Expand reviewed fact templates/records from 26 to all 152 published facts, grounded by immutable source IDs and source-text checks.
2. Create reviewable record/field translations for 69 core app summaries and purposes and remaining source-owned stall notes. All 82 dish descriptions now have source-locked translations; 70 originals intentionally remain generic food-culture descriptors. Distinguish factual statements from labels.
3. Attach a source revision, locale, translation state (`reviewed`, `pending`, `stale`) and original text for each translated record.
4. Ensure multilingual search indexes include translated text without altering canonical search terms.
5. Build QA enforcing required locale coverage for newly approved translations; do not block display of already-verified original English data in unsupported locales.
6. Continue the Merli V3.2 multilingual conversation phase only after the content pipeline is reliable.

## Check and test

```bash
npm run check
node scripts/localization-report-v310.mjs --json
node scripts/browser-qa-v310.mjs
node scripts/browser-qa-v311.mjs
```

No database or paid translation API is needed for this reviewable static-pack approach. Future batch generation can be done offline with human review before commit.

## V3.1-B follow-up (in this same draft PR)

- Added 16 reviewed nature and park facts in all 11 non-English languages; total translated verified facts: **26/152**. Each translation is tied to an unchanged published English statement, ID and verified status.
- Added reviewed descriptions for **82/82 Singapore dish records** using 13 distinct, exact-match original phrases. The 70 original generic `Singapore food-culture exploration term` descriptions are faithfully localized as generic descriptions, **not** rewritten into unsupported ingredient, recipe or dietary claims.
- Integrated translated dish descriptions into Food Explorer's cards and multilingual search. Original dish names, operator links, prices and dietary flags remain unchanged.
- Updated source freshness audits and 12-language Chromium tests, including local-language phrase search.
- Core app summaries (69 entries), stall research notes (93 entries) and remaining 126 published facts are still untranslated. Do not advertise full content coverage.
