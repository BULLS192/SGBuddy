# V3.10 — Food-action localization wave

This wave replaces the last legacy English/Simplified-Chinese-only branch in the Merli food-discovery action bar. It uses the already-authored and populated 12-locale keys `foodToolsTitle`, `foodPicker`, `foodServices`, `foodPickButton`, `foodMyPicks` from `lib/i18n-extended-v300.mjs`. Updates respond to `sgbuddy:language` and keep the original provider/business copy unchanged.

**Scope:** Five fixed controls. This is not a claim that all food-provider metadata, dining-service cautions, long-form Merli replies or every conditional response is translated. Those surfaces still need authoring, source-ownership classification and speaker review.

**Testing:** `node scripts/check-v3100.mjs` validates that the 12 locale packs contain the expected labels and the runtime no longer uses the two-language condition. Full `check-all` runs unchanged checks plus V3.10.

**Release policy:** A development PR only; production remains V3.9. No new whole-app percentage is asserted. The earlier ~75% was an unverified planning estimate and must not be presented as audited completion. The target of 95–99% requires a measured denominator of rendered first-party content and native review.
