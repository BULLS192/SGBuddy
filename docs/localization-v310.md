# SGBuddy V3.1 — content localization baseline

Status: V3.1 development branch, not a complete multilingual library.

## Architecture

- App-owned interface labels are handled by the V2.8–V3.0 catalogues.
- `lib/i18n-content-taxonomy-v310.mjs` provides 36 original-English taxonomy values with translations for all 12 supported languages. Stored values, IDs, URLs, filtering and published record fields remain unchanged; only labels and search aliases are localized.
- `lib/i18n-facts-v310.mjs` provides source-checked, ID-addressed translations for the first thirty-eight verified facts. The source text must **exactly match** the original published fact, and the fact must remain verified. If either changes, SGBuddy deliberately falls back to the original until an updated translation is reviewed.
- Names, dates, street addresses, postal codes, provider links, prices, halal/health assertions and live data are never translated through string replacement.
- `app-device-translate-v300.js` skips curated, source-locked content so on-device translation does not translate it a second time.

## Coverage snapshot

| Segment | Existing records | Pretranslated in V3.1 for non-English locales |
| --- | ---: | ---: |
| Published verified facts | 152 | 152 |
| Core Everyday Apps summary/purpose entries | 69 | 69 |
| Singapore dish descriptions | 82 | 82 |
| Hawker-stall research notes | 93 | 93 |
| Content taxonomy display names | 36 | 36 |
| Discover curated place names | 271 | Proper names remain original by design |

These are initial counts and do not include extra app entries or operator listings merged at runtime. The exact counts are generated from source files by `node scripts/localization-report-v310.mjs --json`. CI uploads the report artifact. **Do not claim 100% coverage.**

## Next batch: content packs rather than runtime translation

1. Maintain source-locked localizations for all 152 published facts, grounded by immutable source IDs and source-text checks.
2. The 69 core app summary and purpose records are translated. Eligibility, account requirements, provider-owned content and public-service conditions require separate source-aware translation. The 93 historical stall source notes are covered; separately sourced operator/vendor notes still require review. All 82 dish descriptions now have source-locked translations; 70 originals intentionally remain generic food-culture descriptors. Distinguish factual statements from labels.
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
- 54 of the 69 core app summaries/purposes and 114 published facts still need reviewed translations. All 93 historical stall notes are translated with source-locked fallbacks. Do not advertise full content coverage.

- Extended the second batch to **93/93 research-stall notes**, from five reviewed original warnings, across all 11 non-English languages. Where applicable, Food Explorer displays these translated historical cautions instead of generic English warnings, preserving uncertainty about trading, menu and certifications.

## V3.1-C content release batch

- Source-ID-matched translations for **12 additional official-source Singapore water-history facts**, covering NEWater production, PUB processing, industrial use, and the Singapore River clean-up. The published fact count is now **38/152** in each non-English locale. Full original source, verification status, names and dates are preserved. 
- **15 high-use core Everyday Apps** have localized summaries and purpose fields in the 11 non-English languages. These include Singpass, LifeSG, HealthHub, MyICA, SGWorkPass, CPF, myENV, Parking.sg, SimplyGo, MyTransport.SG, NLB, MyActiveSG+, Healthy 365, Grab and Gojek.
- Eligibility, banking requirements, publisher store links and account conditions remain canonical English, rather than risking an unchecked translation of sensitive eligibility details. The app source pack checks both summary and purpose for changes and falls back to English if either is edited.
- Multilingual app search includes translated summary and purpose strings. Automated audit now counts stale and untranslated app descriptions.
- **114 verified facts and 54 core app summary/purpose records** remain to be localized in a later reviewed batch; travel and dining integrations are counted separately from the 69 core-app entries. Do not claim 100% coverage.

## V3.1 core-catalogue coverage gate

- All **152/152 source-verified Singapore facts** now have authored translations into all 11 non-English languages (English remains source of truth). Nine source-locked packs cover history, botany, environment, transit, civic symbols, HawkerFest and 2025 awards. New and modified facts fall back to their original published text until localized.
- All **69/69 core Everyday Apps** have authored localized **summary and purpose** fields in all 11 non-English languages. Five static ID-keyed packs preserve original publisher name, URLs, eligibility and source revisions.
- Coverage check `scripts/check-v313.mjs` fails on missing IDs, missing translations, duplicate records, changed published source, protected year changes and missing offline modules; browser test `scripts/browser-qa-v313.mjs` switches all 12 languages and verifies both ends of the directory plus original sources and responsive layout.
- **Important remaining gaps:** These counts do not mean all SGBuddy text is localized. Core app `accountNeeded` and `notes`, additional 6 travel apps plus 4 dining services, operator menus, provider descriptions, dynamic transport/weather/errors, and longer Merli replies require further treatment. Some existing guides are localized separately in V2.8. Do not state 100% product coverage until those surfaces are checked.
- The translations are authored and source-matched, but are not independently certified by native-speaking professional reviewers. Legal, eligibility and healthcare phrasing should receive native review before those critical fields are substituted.
