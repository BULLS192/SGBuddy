# SGBuddy v0.9.0-dev — Travel + Living Intelligence Wave

This branch is a non-production review build. Production remains v0.8.2 until explicit release approval.

## Product architecture

Primary navigation becomes:

- Today — personal context, Next Up, trip/weather intelligence
- Move — MRT, bus, map, native route planner and embedded FREYA assistance
- Places — actionable Singapore destination catalog
- Money — reference FX and MAS-listed money changer locations
- Account — cross-device identity/profile controls

FREYA remains an intelligence layer inside the experience rather than consuming a permanent primary-navigation slot.

## Environmental intelligence

The existing /api/weather contract remains backward compatible while adding:
- nearest 2-hour forecast
- nearest station temperature, humidity, rainfall, wind speed and direction
- 24-hour forecast high/low and regional periods
- regional 24-hour PSI
- regional 1-hour PM2.5 concentration
- travel-risk interpretation
- provider, timestamps and partial-data quality

1-hour PM2.5 is intentionally not described as "1-hour PSI".

Environmental data is not persisted as high-volume history in this wave. It remains short-lived provider/cache data.

## Money

Reference conversion uses official ECB daily euro reference rates and cross-converts currency pairs. UI language explicitly calls this a reference rate, not a live cash/dealer quote.

Supported visitor currencies:
SGD, USD, EUR, GBP, AUD, JPY, CNY, MYR, IDR, THB, KRW, INR and BRL.

Money changer discovery uses the MAS Financial Institutions Directory as the trust concept and the MAS/data.gov.sg geospatial dataset for machine-readable locations. MAS listing data is not represented as a source of live shop buy/sell quotes.

Actual money changer quote observations remain in fx_quote_observations and are separate from licensing/location data.

## Places

The catalog expands to twenty high-value visitor destinations with:
- coordinates and aliases
- concise action-oriented description
- persona fit
- rain suitability
- best-time context
- nearest useful transit context
- source URL and verification timestamp in the database seed

STB Tourism Information & Services Hub (TIH) is not used; the project treats it as discontinued.

## Database changes

The staged migration:
- adds ECB, MAS geospatial and Visit Singapore/official web source registry entries
- expands the top-20 destination catalog
- adds safe fixed-projection public RPCs for featured places and money changers
- adds lookup indexes for verification/expiry
- does not add an environmental-history table

The migration is not applied in this branch.

Two explicit ingestion scripts are included:
- scripts/ingest-money-changers.mjs
- scripts/ingest-fx-reference.mjs

Both require a service-role key at runtime. No service-role key is stored in client code or committed to the repo.

## Source strategy

- Weather / PSI / PM2.5: NEA-backed data.gov.sg real-time APIs
- FX reference rates: European Central Bank
- Money changer trust/listing: MAS Financial Institutions Directory
- Money changer coordinates: MAS dataset on data.gov.sg
- Places: SGBuddy curated catalog using official attraction/operator and Visit Singapore references

## Local review

Switch to this branch, install dependencies, copy .env.example to .env.local, then use the existing local launcher or run Vercel dev.

Production aliases and main are deliberately unchanged.
