# ReVitalized Academy - Progress Photos vNext Phase 1

Status: APPROVED first phase and implementation package. Feature disabled by default. Not deployed.

## Scope

Phase 1 is PRIVATE VIEWING ONLY.

It uses:
- `public.my_progress_photo_sets`
- `public.my_progress_photos`
- private Storage bucket `progress-photos`

The member can see up to 12 recent progress photos after the browser receives short-lived signed URLs.

## Security model

- bucket remains private
- existing Storage RLS remains authoritative
- member paths are scoped to the member's contact-ID folder
- frontend uses `createSignedUrl(..., 300)`
- signed URLs expire after 5 minutes
- images use `referrerPolicy="no-referrer"`
- raw `storage_path` is never written into visible DOM text or links
- no `getPublicUrl`
- no public bucket conversion

## Upload deliberately deferred

Phase 1 does NOT add browser upload.

There is currently no transactional upload RPC coordinating:
1. Storage object creation
2. progress photo set row
3. progress photo row

A direct browser upload could create orphaned files if database insertion failed after Storage succeeded.

Upload must be a later package with either:
- atomic server-side orchestration, or
- a tested compensating cleanup workflow.

## Feature flag

`feature_member_progress_photos_vnext`

Default false.

## Loading

- post-first-paint
- authenticated
- RLS-backed
- nonfatal
- sequence guarded
- max 12 photo records
- signed on demand

## Explicit exclusions

- uploading
- public photo URLs
- cross-adult photo sharing
- Family Hub photo sharing
- AI photo analysis
- body-composition inference from images
- health scoring from images

## Definition of done

Phase 1 is complete when:
- private photos render only through short-lived signed URLs
- raw Storage paths are not surfaced to the member
- no upload is available
- feature defaults off
- signed-URL failure degrades per image
- staging privacy/authorization acceptance passes before production enablement


## Phase 2 - server-mediated upload

Implemented on the staging branch, disabled by default.

Upload is controlled separately by:
`feature_member_progress_photo_uploads`

A member may submit one photo set containing any combination of:
- front
- side
- back
- other

Rules:
- at least one image
- JPEG, PNG or WebP only
- 15 MB maximum per image
- actual server-side magic bytes must match the declared MIME type
- captured date is required
- label maximum 120 characters
- notes maximum 2000 characters

The browser never writes Storage or photo rows directly.

The `progress-photo-upload` Edge Function:
1. validates environment/origin/authentication
2. requires full paid member access
3. resolves the authenticated member's active contact/membership
4. validates metadata/files
5. creates one progress photo set
6. uploads each object under the authenticated contact-ID folder
7. inserts the matching progress photo row
8. removes all newly uploaded objects and deletes the new set if any later step fails

This is compensating transaction behavior across Postgres and Storage.

The feature remains disabled until the new Edge Function is deployed and synthetic staging acceptance passes.


## Retry / idempotency

The browser generates one UUID per pending photo-set submission and sends it as `request_id`.

The Edge Function uses that UUID as the actual `progress_photo_sets.id`.

This means:
- a lost HTTP response does not create a duplicate set on retry
- an already completed retry returns the existing set as `replayed:true`
- a conflicting/incomplete request returns 409 rather than silently creating a second set
- no additional migration or idempotency table is required
