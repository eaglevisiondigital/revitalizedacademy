# ReVitalized Academy - Account Privacy Center vNext

Status: APPROVED first slice and implementation package. Feature disabled by default. Not deployed.

## Objective

Expose existing active-member privacy/data-control workflows inside My Account without creating direct destructive browser actions.

## First slice

Uses `public.my_privacy_center` and existing invoker RPCs.

Members can:
- see their connected health providers
- see stored health observation count and latest observation timestamp
- disconnect a connected health provider
- submit a data-export request
- submit a health-data removal request
- submit an account-deletion request
- submit a correction or other privacy request
- see privacy request status/history

## Safety boundaries

Disconnect provider:
- stops future provider sync
- revokes current metric consent for that provider
- does not delete historical stored observations

Health-data deletion and account deletion:
- are requests for review
- are not executed directly by the browser
- existing approve/execute backend workflow remains authoritative

Data export:
- this slice submits/tracks the request only
- `my_privacy_exports.available_storage_path` is intentionally NOT used
- internal Storage paths are not public download URLs
- a later controlled signed-download flow is required before member export download is exposed

## Authorization limitation

Current backend privacy insertion and `my_privacy_center` require active `client_access`.

Therefore this first UI slice is active-member only.

OPEN / FUTURE DECISION:
privacy request access for payment-suspended, onboarding-only, inactive, or former members must be handled explicitly before the product claims Privacy Center is universally available regardless of membership state.

Do not weaken authorization implicitly in frontend code.

## Feature flag

`feature_member_privacy_center`

Default false.

## Loading

- post-first-paint
- authenticated browser client
- security-invoker/RLS
- nonfatal
- sequence guarded

## Definition of done

- no direct destructive delete from browser
- no internal export storage path exposed
- provider disconnect language clearly distinguishes disconnect from deletion
- request history visible
- default off
- staging acceptance before production enablement


## Secure export downloads

Ready privacy export packages are now listed inside the Privacy Center.

The browser reads `my_privacy_exports`, which only returns `available_storage_path` when:
- the export belongs to the authenticated user,
- status is `ready`,
- and the export is not expired.

The member never sees or links directly to that path.

When the member selects **Download Export**, the authenticated Supabase client requests a 5-minute signed URL from the private `privacy-exports` bucket. Storage RLS independently verifies that the ready export belongs to that user.

No service-role key, public URL, or permanent download URL is used.
