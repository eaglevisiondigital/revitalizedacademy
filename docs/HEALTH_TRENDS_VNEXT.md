# ReVitalized Academy - Health Trends vNext

Status: APPROVED first slice and implementation package. Feature disabled by default. Not deployed.

## Objective

Add premium trend visualization to the existing Connected Health & Wearable Data card without introducing Health Score, diagnosis, or medical interpretation.

## Data

Uses:
- `public.my_health_dashboard_cards_30d`
- `public.get_my_health_metric_trend(contact_id, metric_key, days)`

The feature selects up to four recently updated numeric metrics and loads 30 days of member-scoped trend data.

## Member presentation

Each trend shows:
- metric label
- latest value/unit
- 30-day sparkline
- absolute 30-day change
- latest timestamp

It does not label a direction as:
- good/bad
- healthy/unhealthy
- improving/worsening
- diagnostic

## Authorization

- member must already have paid active access
- Biometrics feature must be enabled for the member
- authenticated browser client only
- RLS/security-invoker backend remains authoritative
- RPC trend source remains self-scoped through the member timeline

## Feature flag

`feature_member_health_trends_vnext`

Default false.

## Explicit exclusions

- Health Score
- Family Health Score
- medical diagnosis
- treatment recommendations
- AI interpretation
- cross-adult health sharing
- activating native HealthKit/Health Connect
- connecting OAuth providers

## Definition of done

- no more than four trend charts in first slice
- post-first-paint
- feature/entitlement gated
- nonfatal
- descriptive only
- default off
- staging authorization and mobile acceptance before production enablement
