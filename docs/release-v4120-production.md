# SGBuddy V4.12.0 — Production Release

**Last confirmed production baseline:** V4.11.0, commit `4a219bcc44263ffaeec87df742ad8676a27725cf`; verified READY Vercel deployment `dpl_DMcrKam98FAus17cEJB87oW2F4Bd`.

**Release source:** draft [V4.12 development PR #67](https://github.com/BULLS192/SGBuddy/pull/67), tested at `6be74cc22cb8e2f0bf8e8f173706c29b9a07abea`: 27/27 GitHub Actions successful. Production release built as a descendant on `release/sgbuddy-v4.12.0-production`; not merging additional unrelated concurrent branches.

**Change:** 27 additional authored UI keys translated into 12 locales (Home, weather-loading, location state/permissions, trip-risk and environmental labels). Source locking preserves Singapore / operator names, PSI/PM2.5 units and values, live feed results and user content. Translation-ownership conflicts with V3.5 and V4.11 were removed and full CI completed on the feature branch.

**Measured audit before/after:** V4.11 observed changed-from-English rate was approximately 77.7–79.5% across supported non-English locales. V4.12 measured approximately 78.4–80.2% (+0.7 percentage points per locale). This is **not** a certified whole-app translation coverage or native-speaker accuracy score.

**Release packaging:** Set public badge and JS runtime version to **4.12.0**; PWA shell `sgbuddy-shell-v76` → `sgbuddy-shell-v77`. Align historical version-specific tests to the new public version but do not remove tests. Run the full CI on this exact release candidate and verify the merge commit before explicitly invoking production deployment; automatic Git deployment is disabled.

**Safety:** 11 manually curated event listings; new discovery candidates remain unapproved, not published. Offline data packs remain opt-in; live weather, transport and external maps do not work offline. No database migration or credentials changed. Leave production as V4.11 until deployment is READY.

**Rollback target:** `dpl_DMcrKam98FAus17cEJB87oW2F4Bd` (V4.11.0), verified READY. Confirm domain aliases `sgbuddy.omnidite.com` and `sgbuddy.vercel.app` resolve to the exact V4.12 deployment.

**Still outstanding:** physical iOS Safari/Android installed-PWA checks, native-speaker proofreading and remaining English UI such as Air Quality panels.
