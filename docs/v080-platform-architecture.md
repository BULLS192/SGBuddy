# SGBuddy v0.8 — Omnidite Travel Intelligence Foundation

## Product thesis

SGBuddy evolves from a Singapore transport PWA into the Singapore consumer surface for a reusable **Omnidite Travel Intelligence Core**.

The same Singapore data can support four modes with different recommendation policies:

| Mode | Primary goal | Ranking bias |
|---|---|---|
| Resident | Best daily way to move/live | speed, predictability, traffic, routine |
| Visitor | Navigate Singapore with low cognitive load | simplicity, alight guidance, hotel return, attractions |
| Executive | Minimise friction and lateness | reliability, comfort, door-to-door, premium options |
| New in SG | Learn to live locally | local discovery, settling-in, affordability, eligibility |

Modes are contexts, not account types. A user can switch at any time.

## Platform architecture

```
Public / partner sources
  LTA / data.gov.sg / MAS / hotel inventory / FX / places / events
                    |
                    v
       Omnidite Travel Data Layer
  normalize | source attribution | TTL | confidence
                    |
                    v
             Postgres / PostGIS
 durable catalog | profiles | rules | mappings | caches
                    |
        +-----------+-----------+
        |                       |
        v                       v
 Real-time service layer   Research/ingestion workers
 transport/weather/FX      catalog refresh / licensing
 hotel availability
        |                       |
        +-----------+-----------+
                    v
       Recommendation / Context Engine
 persona + time + weather + price + disruption + stay horizon
                    |
        +-----------+-----------+-----------+
        |           |           |           |
     Resident     Visitor    Executive   New in SG
                    |
                    v
                  SGBuddy
                    |
           later: hotel QR / FREYA /
             corporate / white-label
```

## Core product domains

### Mobility
Transit routing, rail/bus arrivals, traffic, driving/rideshare comparison, disruption risk, walking exposure, trip companion and alight alerts.

### Stay
Hotels, hostels, capsule hotels, serviced apartments and co-living. Search should optimise differently by persona. A backpacker may prioritise price, dorm/private room, MRT distance, late check-in, luggage storage and 24-hour reception. Executive mode should prioritise reliability, location, meeting access, service level and premium amenities. New in SG should gradually shift from nightly inventory toward monthly/co-living/serviced-apartment inventory.

### Money
Live mid-market FX, licensed money changers, ATMs/payment guidance and observed shop quotes. MAS licensing is the trust layer; live offered rates must retain source and timestamp. Do not imply a shop's current rate unless a current provider/partner/user observation exists.

### Places & experiences
Attractions, food, shopping, nightlife, business venues, coworking, lounges and local experiences. Persona fit is metadata, not separate catalogs.

### Rules & eligibility
Versioned rules for tourist refunds, pass/status-specific availability, local-only services and other eligibility questions. Store source URL, effective dates and verification timestamps.

### Trip intelligence
Weather, rail status, road incidents, time-of-day, stay horizon, budget, walking tolerance, meeting deadline and persona combine into recommendation policy.

## Accommodation strategy

Do not create our own stale hotel-rate database.

Store:
- canonical property record
- geolocation and accommodation segment
- amenities relevant to ranking
- provider property IDs
- provider/source attribution
- short-lived offer cache with expiry

Fetch live availability/prices when the user searches.

Candidate inventory providers:
- Amadeus Hotels for geocode discovery + live offers and optional booking
- Expedia Rapid as an alternative/second provider
- later direct/affiliate partners

A search like **"hotel nearby tonight under S$80"** becomes:

1. Resolve current/destination location.
2. Search provider inventory by geocode/date/occupancy.
3. Normalize offers to SGD.
4. Enrich with SGBuddy place/transit data.
5. Score by persona:
   - backpacker: price + MRT access + late check-in + rating
   - executive: meeting travel time + service + reliability
   - visitor: attraction access + simplicity + hotel-return route
6. Display booking/deep-link attribution.
7. Cache the offer briefly; never present an expired price as live.

## Money-changing strategy

MAS Financial Institutions Directory is the canonical licensing/trust source.

Store licensed entity + address + geocode durably. Store actual buy/sell observations separately with:
- currency pair
- side (buy/sell)
- source type
- observed time
- expiry
- confidence

A money-changing recommendation should optimise **effective value**, not headline FX alone:

```
effective_value =
  cash_received
  - transport_cost
  - explicit_fees
  - estimated_time_cost
```

This lets SGBuddy say that a slightly worse nearby rate is rational for S$200 while a farther shop may be worthwhile for S$2,000.

## Data ownership and privacy

Current Vercel Blob cloud profiles remain the legacy profile store during migration. v0.8 does not require an account migration.

Supabase becomes the structured system of record for:
- catalog data
- provider mappings
- persona preferences
- saved/recent places after migration
- journey sessions
- rules/eligibility
- short-lived hotel/FX caches

Do not store:
- card data
- passport numbers
- immigration document numbers
- precise location history by default
- full calendar/event contents unless explicitly connected and needed

Journey location can be ephemeral. Persist only when a user deliberately saves a place or opts into history.

## Rollout

### v0.8.0 — Platform foundation
Database, persona model, profile context, catalog/source model, existing v0.7 functionality unchanged.

### v0.8.1 — Persona onboarding
Resident / Visitor / Executive / New in SG; stay horizon; mode-specific Today cards.

### v0.8.2 — Money
Live FX, MAS money-changing directory, nearby licensed options, payment guidance.

### v0.8.3 — Stay
Hotel/hostel discovery, live nightly offers, backpacker filters, hotel-as-saved-place.

### v0.9 — Multimodal mobility
Transit vs road/taxi/rideshare decision engine.

### v1.0 — Trip Companion
Foreground live-trip mode, transfer/alight guidance, route progress and notification framework.
