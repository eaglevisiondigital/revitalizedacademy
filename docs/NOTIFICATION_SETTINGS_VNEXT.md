# ReVitalized Academy - Notification Settings vNext

Status: IMPLEMENTED on staging branch, not deployed.

## Changes

The existing notification settings form now also supports:
- quiet-hours enabled/disabled
- quiet-hours start
- quiet-hours end
- member time zone

Existing in-app, email and SMS preferences remain.

## Save path

The browser no longer directly upserts `notification_preferences` from this form.

It now calls:
`public.update_my_notification_preferences(p_preferences jsonb)`

This keeps preference validation in the existing authenticated database API, including validation of IANA time-zone names.

## Push

Push preference fields exist in the newer backend view, but the current update RPC does not yet accept push fields and hosted push delivery has not been proven.

Therefore this UI intentionally does NOT display push toggles yet.

Push controls should be added only after:
1. the provider/runtime delivery path is configured,
2. the update contract supports push fields,
3. hosted staging delivery is tested.

## Quiet hours

When enabled:
- start and end are required
- time zone is required
- browser time zone is used as a default when the member has no saved time zone

## Definition of done

- existing notification options preserved
- quiet hours/time zone visible
- saving uses the invoker RPC
- invalid time zone fails safely through the backend contract
- no unverified push controls shown
