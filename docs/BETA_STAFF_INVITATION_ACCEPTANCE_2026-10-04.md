# Final hosted beta continuation — staff invitation sent

## Delivery update — 2026-10-05

The newly connected Resend integration reports **delivered** for both Client A message `01a10926-148e-714f-b496-d132c7a17761` and staff message `01a10976-5fde-70ce-95d6-01acb1c0f41e`, to their exact approved aliases. Both exact-address suppression lookups returned `404 Suppression not found`. This supersedes the earlier unavailable-provider-evidence statements below: receiving-server delivery is now verified; inbox/spam placement, user receipt and activation are still unverified. No bounce/rejection status was reported for these messages. [Sanitized provider receipt](../deployment-evidence/2026-10-05-beta-delivery/resend-receipt.json).

The user was asked to check the mailbox receiving `dave@eaglevision.biz` and open Client A's delivered link normally. No private mailbox was accessed, email body/token retrieved, resend performed or hosted record changed. Client B remains uncreated pending Client A's normal activation path. No suite rerun or new deployment was needed. The prior final production fingerprint receipt is retained; this read-only provider check introduced no new release/configuration change. Remaining hosted gates below are unchanged. **BETA NOT READY.**

## Historical snapshot — 2026-10-04

**BETA NOT READY.** At this snapshot, the approved synthetic Coach invitation had been sent through the intended staging UI, but external delivery and activation were unverified. The October 5 update above supersedes its delivery limitation. This record superseded the unsent-staff status in [the Client A report](BETA_CLIENT_A_ACCEPTANCE_2026-10-04.md); prior accepted tests remain valid.

## Release and safety

Staging source `86a0bf34fff4f08ef19567fd00172346adb095da`, Netlify deploy `6ac2cd1a0ce4124aafbdf39d`, site `071b252e-a922-4846-a784-8dca1edad377` are unchanged. No application/backend changes, build, deployment, migration replay, Edge redeployment, SMTP change, flag change, role-default change or additional permission grant occurred. Staging Supabase `bvooallokgfktssadsrv` retains the previously applied migration and Edge release.

At this continuation's final decision, all 23 staging asset hashes and 20 sampled production fingerprints matched the accepted release. The production control plane still returned deploy `6ac036d3b48eac0008568e00`. Production was not modified. See [public verification](../deployment-evidence/2026-10-04-beta-remaining/public-verification.json).

Existing accepted totals were retained, not rerun: build 313 files; JavaScript 77/77; frontend 446 passed, 0 failed, 27 historical skips; beta runtime 23/23 source and 23/23 exact-built; PostgreSQL 17.11 215/215; Edge 30/30 and 19 entrypoints. No code change justified another full-suite run.

## Staff invitation result

The existing form requires Name, Email and Phone. The first submission was stopped by native required-phone validation and created no invitation. After the user supplied the approved phone, the exact approved alias was entered and the normal Send Staff Invitation action succeeded. No SMS was enabled or sent.

- Recipient: `dave+rva-beta-staff@eaglevision.biz`.
- Name: Disposable Beta Scoped Staff.
- Role: **Coach**; scope: **Assigned People Only**.
- Staff/Auth user: `aa5d1bdd-e85e-4141-8a16-3fc409d3e827`.
- Contact: `15cd0173-83d0-4c24-9c20-0c37d1fada69`.
- Invitation: `bdf265b3-8363-4d55-8f63-bab1c416d600`, status `invited`, expires `2026-10-12T00:28:35.503Z`.
- Invitation time: `2026-10-05T00:28:35.503Z` (October 4 in America/Chicago).
- Audit: `6e8631fc-3c35-4847-8e17-7685464502b2`, `staff_invited`.
- UI: Active / NDA Pending / Limited access, zero assigned contacts and clients.
- Auth: email confirmation and last sign-in are NULL; onboarding pending.
- Delivery submission: normal Supabase Auth invite call succeeded and its invitation timestamp exists. This proves acceptance by the application/Auth sending flow, not external mailbox delivery or an independently inspected Resend delivery event.
- Actual delivery, activation, NDA acceptance and normal sign-in: **not verified**; user receipt confirmation requested.

Read-only hosted permission checks for this pending staff account returned false for `health.private.view`, `health.progress.manage`, `plan.override`, `staff.manage` and `people.export`. Both Client A and the existing member are out of scope. Individual permission override count is zero. These are actual pending-account checks, not proof of post-NDA assigned-staff acceptance. No contact assignment or permission grant was made. The owner portal warning/error log remained empty after invitation.

## Client A delivery investigation

The exact stored recipient is `dave+rva-client-a@eaglevision.biz`. Job `82c14af2-7ee4-4bbb-891f-baeba5bead7b` remains `sent`, provider Resend, message `01a10926-148e-714f-b496-d132c7a17761`, one attempt, no block/error, at `2026-10-04T23:00:53.054Z`.

The dispatcher records `sent` on provider request success; the job table does not expose downstream mailbox-delivery, bounce or suppression status. Primary Chat's independent Gmail search found no invitation. Actual external delivery remains **NOT VERIFIED**, not a proven bounce or rejection. No resend, token extraction or mailbox-access workaround occurred.

Resend delivery-log integration was discovered and suggested, but installation/connection was not confirmed. Its provider events therefore remain inaccessible in this continuation. The previously rejected private-mailbox path was not retried.

The existing intended **Copy Member Activation Link** workflow is documented in `portal/portal-client-foundation.js`: it is visible only when client access is `ready` and no user is linked; it calls the existing `journey-link` function and copies an onboarding URL. Client A remains `onboarding`, with user NULL, so this workflow is not presently available. It was not forced or bypassed, and no raw invitation token was read.

## Remaining hosted gates

| Gate | Result |
|---|---|
| Client A invitation provider acceptance | Passed previously; exact recipient reconfirmed |
| Client A external delivery / activation / login | Unverified / pending |
| Client B invitation / activation | Not started; awaiting a workable Client A delivery path |
| Staff invitation / assigned-only configuration | Passed; pending NDA and activation |
| Staff actual delivery / login / post-activation scope | Unverified / pending |
| A/B/staff recovery and revocation | Not executed |
| Meal/workout assignment to A and member detail | Not executed; archived fixtures retained |
| Client B denial and assigned/unassigned active-staff checks | Not executed; pending-staff denial checks passed |
| Five cross-account transitions / private DOM clearing / stale responses | Hosted acceptance not executed |
| Remaining member/scoped-staff/assignment responsive views | Not executed; prior owner/content/form evidence retained |

Cleanup remains pending so the delivered invitations can be tested. Client A stays pending and unclaimed; staff stays NDA-pending with zero assigned clients. Existing synthetic food/recipe/meal/workout fixtures remain archived/inactive. No permanent meal/workout assignments or nutrition data were created. Do not recreate the pending identities. Revoke/deactivate disposable identities through supported workflows after acceptance; preserve audit records.

Next: confirm actual receipt and complete normal user-controlled password/activation steps; connect Resend delivery logs if delivery remains uncertain. Continue the existing acceptance checklist only. No new feature package or Justin/Elle green flag is authorized by this report.

BETA NOT READY
