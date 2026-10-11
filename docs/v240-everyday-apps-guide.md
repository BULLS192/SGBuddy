# SGBuddy V2.4 — Everyday Singapore Apps & Digital Services

## Release structure
- **Scope:** development on `feature/sgbuddy-v2.4-everyday-apps-library`, based on **V2.3 PR #20**, not yet on production.
- **Source data:** `data/everyday-apps-v240.json` (69 entries: 64 mobile app candidates + five useful web services; 10 categories).
- **User interface:** `app-apps-v240.js` + `everyday-apps-v240.css`, loaded after the existing Discover module.
- **Distribution:** draft PR to V2.3 branch, preview only. Merging PR #20 first remains a dependency before this V2.4 wave can be merged into `main`.

## Experience
The former small *Useful apps* tab becomes the dedicated **Everyday apps** destination inside Discover. Unlike the previous bare app list, every card shows:
- What the app/service is for and when it helps.
- Its publisher, category, applicable Singapore user modes and eligibility/account prerequisite.
- A first-party publisher URL, plus exact App Store/Google Play buttons **only when individually researched**; no fabricated store slugs or generic search links.
- Whether it is a mobile app or **web-only service** (the latter shows no install link).
- A saved shortlist, **stored locally in this device's browser**; no cloud-sync claim, no installation tracking, no bank credentials.
- Editorial catalogue date. This **does not mean an app-store entry, current app availability or app features have been independently checked**.

Discover's mode-aware app starter collections: *For my mode*, *Start here* (essentials), *All apps*, and *My shortlist*. Filters: search, ten categories, source-verified iPhone/Android deep-link availability, and web-only services. Search and filter selection retain scroll position.

### Example situations
| Need | Examples |
|---|---|
| Government identity and access | Singpass, LifeSG, MyICA Mobile, SGWorkPass |
| Banking and payment | DBS digibank, DBS PayLah!, OCBC Digital, UOB TMRW, Wise, Revolut |
| Food and everyday errands | Grab, foodpanda, FairPrice Group, yuu Rewards, Carousell |
| Transport and parking | SimplyGo, MyTransport.SG, Gojek, CDG Zig, Parking.sg |
| Healthcare and utilities | HealthHub, SP app, MyENV |
| Education / community | NLB Mobile, MyActiveSG+, onePA |
| Visitor needs | Changi App, Klook, Trip.com, MyICA Mobile |

**Caveats:** 
- CDC vouchers are a **web service**, and the official CDC scheme explicitly says consumers do not need a dedicated app. Never suggest downloading RedeemSG Merchant app for residents.
- The OneService reporting flow is included as a LifeSG web/service integration. MyActiveSG+ is also treated as a publisher-run web service until a verified downloadable app is identified.
- HealthHub is taking over the cluster-specific public healthcare apps in late 2026; avoid duplicative recommendations for apps scheduled to retire.
- Secure links and publisher first: SGBuddy never asks for Singpass OTP, bank passwords, authentication tokens or card PINs. **Do not** search for similarly named app-store entries and claim them official.
- An app being present in the catalogue is **not an affiliation, sponsorship or recommendation to open financial products**.
- The catalogue date marks **curation**, not an independent up-to-the-minute check of any individual bank, merchant, stock, offer, eligibility or supported OS.

## Source registry — key first-party publishers
- [Singpass](https://app.singpass.gov.sg/)
- [LifeSG](https://www.life.gov.sg/app)
- [HealthHub](https://www.healthhub.sg/download-app)
- [MyICA Mobile](https://www.ica.gov.sg/public-education/myica-mobile)
- [Parking.sg / URA](https://www.ura.gov.sg/car-parks/short-term-parking/parkingsg-mobile-application/)
- [SimplyGo](https://www.simplygo.com.sg/simplygo-app/)
- [DBS digibank](https://www.dbs.com.sg/personal/digital-banking/ibanking-mobile-app)
- [DBS PayLah!](https://www.dbs.com.sg/personal/digital-banking/paylah)
- [Grab](https://www.grab.com/sg/download/)
- [foodpanda](https://www.foodpanda.sg/contents/apps)
- [NLB Mobile](https://www.nlb.gov.sg/main/services/faqs/NLB-Mobile)
- [FairPrice Group](https://www.fairprice.com.sg/)
- [SP app](https://www.spdigital.sg/spapp)
- [MyActiveSG+](https://www.activesgcircle.gov.sg/myactivesg-plus)
- [CDC vouchers](https://vouchers.cdc.gov.sg/residents/how-to-claim-and-spend/)

More specific source URLs are stored **per record** in the JSON, not inferred at runtime.

## Content quality and refresh process
Run `node scripts/apps-quality-v240.mjs` to produce:
- `reports/apps-quality-v240.json` — full catalogue, category/persona breadth, direct store-link coverage.
- `reports/apps-quality-v240.md` — human-readable provenance notes and metrics.
- `reports/apps-review-v240.csv` — prioritised editorial queue for apps lacking developer-confirmed direct download links, plus ageing catalogue rows.

The weekly source-freshness GitHub Action **reports only** and includes this apps queue once on the default branch; it must not auto-publish changed download links or add fake installed-app states. The original V2/V2.1/V2.2/V2.3 directory remains intact.

## Release gate
- [x] 69 unique records with publisher URLs, account prerequisites and persona mode segmentation.
- [x] Eight catalogued apps with at least one specifically identified store deep-link; all other apps link users to official publisher pages.
- [x] No generic or guessed App Store search links used in the new app guide; legacy fallback search links removed.
- [x] Curated web services are not represented as downloadable mobile apps.
- [x] New module is cached for installed PWAs (shell v50), and existing saved app IDs migrate to the new local shortlist.
- [ ] Full GitHub regression run passes at latest head.
- [ ] Manual Chrome desktop and iPhone Safari verification: app tab, every card, saved bookmarks, filters, keyboard navigation, external links, hidden legacy list, reload/offline.
- [ ] Vercel preview READY for latest SHA; verify preview.
- [ ] Explicit user release approval; merge V2.3 first and then V2.4.

## Proposed V2.5 — breadth with audited sources
1. Expand per-stall operator menus and names with exact unit-level proof; add verified stall-address refresh and model current status as unknown by default.
2. Add remaining Singapore community, recycling, civic, recreation, groceries and healthcare apps only with reliable first-party download links, and an issue-reporting button for obsolete app records.
3. Expand suburban food and neighbourhood services, prioritising neighbourhood coverage gaps from `reports/library-review-queue-v230.csv`.
4. Introduce editorial record submission, reviewer status, source-change diff and duplicate-resolution workflows without directly deploying changes.
