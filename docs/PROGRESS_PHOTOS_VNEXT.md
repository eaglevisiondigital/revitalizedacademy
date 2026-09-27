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
