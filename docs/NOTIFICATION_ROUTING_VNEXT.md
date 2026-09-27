# ReVitalized Academy - Notification Routing vNext

Status: IMPLEMENTED on `codex/staging`, disabled by default, not deployed.

## Objective

Make existing member notifications actionable without sending the current web dashboard to future `/app/*` routes that do not yet exist.

## Backend

Uses:
`public.my_notification_routes`

The view resolves notification types to:
- route_key
- screen_name
- feature_key
- resolved_link_url

The first web slice intentionally ignores `resolved_link_url` for navigation.

## Web routing

Only approved `route_key` values map to known existing dashboard selectors.

Examples:
- today -> Daily Action Center
- coaching -> Coaching Hub
- messages -> Messages
- courses -> Learning Progress
- family_hub -> Family Hub
- health -> Health & Devices
- progress -> Progress Center
- progress_photos -> Progress Photos
- settings -> Notification/Account settings
- billing -> Billing
- ask_revitalized -> Ask ReVitalized

Unknown route keys remain non-clickable.

## Security

- no arbitrary external URL navigation
- no execution of backend metadata
- clicking an unread routed notification marks it read
- existing Dismiss/Mark Read controls remain
- feature failure falls back to current v2 notification list

## Feature flag

`feature_member_notification_routing_vnext`

Default false.
