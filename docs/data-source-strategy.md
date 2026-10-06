# SGBuddy data-source plan

| Domain | Canonical / candidate source | Storage policy |
|---|---|---|
| Bus / roads | LTA DataMall | Live/cache; normalized APIs |
| Rail | LTA GTFS + realtime | Live/static cache |
| Weather | data.gov.sg | Short TTL only |
| Money-changer licensing | MAS Financial Institutions Directory | Durable catalog + verification timestamp |
| FX mid-market | Currency market-data provider | Short-lived snapshots |
| Shop FX quotes | partner/provider/user observations | Timestamped + expiring; never implied current after expiry |
| Places | SGBuddy curated catalog + future licensed provider | Durable canonical record with source links |
| Hotels/hostels | Amadeus Hotels candidate; Expedia Rapid candidate | Durable property mapping; live offers short TTL |
| Experiences/events | Curated/licensed sources to be selected | Durable metadata only where terms allow |
| Eligibility/rules | Official agency pages | Versioned rules + effective dates + source URL |

## Research correction

STB Tourism Information & Services Hub (TIH) was discontinued on 31 July 2025. It must not be treated as a future API dependency.

## Hotel/hostel selection criteria

Backpacker:
- nightly total and all mandatory fees
- hostel/capsule/private-room distinction
- distance/time to MRT
- late check-in / 24-hour desk
- luggage storage
- rating/review confidence
- air conditioning
- locker/security metadata
- airport transfer practicality

Visitor:
- attraction access
- simple transfers
- hotel return shortcut
- late-night transport
- rain exposure

Executive:
- door-to-door travel time to next meeting
- premium rating/service
- lounge/business facilities
- quiet/work suitability
- airport access
- reliability buffer

New in SG:
- weekly/monthly availability
- serviced apartment / co-living
- grocery/transit access
- study/work commute
- deposits and stay-length constraints

## Important commercial rule

Discovery and ranking can be ours; booking inventory belongs to providers. Store provider IDs and short-lived offers, and send bookings through the provider/affiliate flow unless/until Omnidite deliberately takes on booking/payment compliance.
