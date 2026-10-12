# SGBuddy V3.9 — Active UI and Editorial Text Triage

**Branch:** `feature/sgbuddy-v3.9-runtime-fallback-classification`, based on V3.8 PR #40. **Development-only; do not deploy or merge into production without separate authorization.**

## Outcomes

- **12 source-locked first-party UI message keys × 12 locales = 144 populated authored strings**, including Simplified and Traditional Chinese, Malay, Indonesian, Japanese, Korean, Thai, Vietnamese, French, Spanish and Brazilian Portuguese. Candidate translations have **not** been endorsed by native speakers.
- Corrects known English fallbacks for food-picker loading/no-match/results, OneMap lookup progress/failure, Discover directory load errors, and Places search placeholder/explainer. Fixed data-provider names and dynamic numbers are preserved.
- UI writes are confined to explicit selectors in `app-i18n-fallback-v390.js`. Replacement needs an exact authored source message or another known locale variant. Numbered food-picker notices only match known template shapes; unknown source/provider text is left intact.
- The 12 new keys join the prior 393-item authored message catalogue: **405 registered UI keys per locale**. V3.8-classified source/content inventory grows from 895 to **907 units** per locale. A 100% filled authored dictionary is **not** proof of whole-app localization.

## Individually traceable source triage

`scripts/classify-localization-v390.mjs` reads the full V3.8 inventory and assigns **machine-triage** categories to each active client, API/backend and editorial field candidate. It retains:
- Client JS: exact file, line, literal, source kind, classification decision, explanation and `unreviewed` status.
- Source editorial text: dataset, record ID, field path, 220-character excerpt, occurrences, classification decision and `unreviewed` status.
- API/backend: separate evidence and `backend_source_and_visibility_review`, without rewriting government or operator information.

Recorded categories include `v390_exact_source_localized`, `registered_source_review_runtime`, `authored_ui_requires_translation_review`, `developer_metadata`, `markup_needs_child_node_review`, `safety_or_error_authorship_review`, `source_backed_mixed`, `authored_safety_or_policy_review` and `authored_editorial_requires_review`. A category is **not** fluent-speaker approval or proof a message appears on every screen.

## Verification and commands

```bash
node scripts/check-v390.mjs
node scripts/classify-localization-v390.mjs
node scripts/classify-localization-v390.mjs --out=localization-v390.json
node scripts/audit-app-v380.mjs
node scripts/check-all.mjs
```

Mobile and desktop Chromium QA covers 12 languages, exact source guards, variable counts, selection persistence already covered by earlier waves, and preservation of unknown provider/user text. Both the full static regression suite and existing V3.2–V3.7 multilingual browser checks must pass.

The V3.8 GitHub Actions audit exports the JSON classification as a separate artifact; the browser QA workflow covers V3.9.

## Limitations / next gate

`wholeAppTranslationPercent` remains `null`. The runtime scan excludes some conditional template literals, personalized Merli replies and provider-controlled API payloads; triaged fields may be duplicates or not reachable. Source-owned descriptions and personal text should never be blanket-translated. V3.9 does **not** claim that all previously identified 109 active JS or 340 editorial text findings are human-reviewed or translated. The prior 572 proposed native-speaker decisions and 33 area checkpoints are still pending.

Next wave: address the high-priority `authored_ui_requires_translation_review` and `authored_editorial_requires_review` groups in verified screen context, record source IDs/permissions and seek fluent review. Do not report a whole-app percentage until the reachable denominator is established.
