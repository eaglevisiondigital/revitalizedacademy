# Hosted beta acceptance — Client A created, plus-address routing failed acceptance

## Delivery routing update — 2026-10-05

Resend confirms the exact recipient `dave+rva-client-a@eaglevision.biz` reached provider status `delivered`. The focused event totals are sent 1, delivered 1, bounced 0, suppressed 0, failed 0, delayed 0, opened 0 and clicked 0. The exact-address suppression lookup returned not found. The user reports that the message is absent from the mailbox they can access; only the unrelated Vitality Assessment email is present.

This proves receiving-server acceptance, not routing into the accessible mailbox. The user confirmed that the client's mail server does not support the `dave+...` pattern; the accepted assessment workaround was a real alias without that prefix. Do not resend to the same plus-address and do not recreate the client, agreement, invitation or Auth identity. Configure the real alias `rva-client-a@eaglevision.biz` to forward to a confirmed accessible inbox, then update the existing synthetic Client A email through the supported owner workflow and resend the existing agreement. Use the same real-alias pattern for the later Client B and scoped-staff acceptance addresses. [Sanitized investigation receipt](../deployment-evidence/2026-10-05-beta-delivery/client-a-plus-routing-investigation.json). No message was resent and no hosted or production state changed during this investigation.

**BETA NOT READY.** Normal owner second sign-in passed. Client A was created through the intended UI and its agreement email was accepted by Resend. Actual mailbox delivery, activation and remaining multi-account acceptance are still pending.

## Release and validation

Staging source `86a0bf34fff4f08ef19567fd00172346adb095da`, deploy `6ac2cd1a0ce4124aafbdf39d`, site `071b252e-a922-4846-a784-8dca1edad377` are unchanged. [Staff portal](https://revitalizedacademy-staging.netlify.app/portal/). No build, deployment, migration replay, Edge redeployment or application source change was needed. Supabase staging remains `bvooallokgfktssadsrv`; already-applied ledger `20261004214656` and staff-management v5 retained.

All 23 live staging hashes still match. Production site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06` remains deploy `6ac036d3b48eac0008568e00`; all 20 sampled fingerprints were rechecked after Client A setup and remain unchanged. [Fingerprint receipt](../deployment-evidence/2026-10-04-beta-remaining/public-verification.json). No production data, configuration, grants, payments, SMTP, SMS or Edge writes.

Retained accepted totals: build313files, syntax77/77, frontend473total/446pass/0fail/27historical skips, beta runtime23/23 source and23/23exact-built, native PostgreSQL17.11 215/215, Edge30/30 and19entrypoints typechecked. Accepted Member Health & Progress and Nutrition Targets + Trends remain unchanged. Nine historical agreement fixture failures were resolved by explicit fixture setup, not weakened gates. These suites were not rerun for hosted data setup.

## Client A normal workflow

1. Verified portal identity **Dave Fowler - Staging Owner / Owner** after user normal sign-in.
2. People → Add Person created **Disposable Beta Client A**, `dave+rva-client-a@eaglevision.biz`, Other Manual Entry, Direct Membership / Enrollment, explicit synthetic tag and note.
3. Action Center → Save Enrollment Activation created a pending Holistic Foundations enrollment, monthly $89, six-month commitment; all payment/agreement/access statuses initially pending/not-sent. No payment was recorded.
4. The first Send action on the unprepared agreement correctly rejected missing `effective_date`. The normal Assign / Send Agreement form provided the required approved MK8 fields, using existing enrollment defaults and current date. Preparing and sending through that form succeeded. No contract text or business terms were rewritten, and no agreement was signed or waived.
5. Resend accepted the exact Client A invitation: job `82c14af2-7ee4-4bbb-891f-baeba5bead7b`, provider ID `01a10926-148e-714f-b496-d132c7a17761`, one attempt, sent at `2026-10-04T23:00:53.054Z`, no block/error. **Provider accepted/sent is not proof of external mailbox delivery.** User receipt confirmation is pending. No private token was extracted.

## Benefit mapping applied only to Client A

Program primary key `holistic-foundations` (Holistic Foundations); no separate program UUID. Configuration is **membership-level**, not program-template-level.

| Benefit | Label | Limit | Cadence | State | Row ID |
|---|---|---|---|---|---|
| nutrition_plans | Meal Plans | NULL | none | active | `2ee99e6b-cfda-464e-82cf-06a7a5186cae` |
| fitness_plans | Workout Plans | NULL | none | active | `95641782-3466-4304-a1a6-777282c86154` |

Both belong only to membership `16f27a3f-11b9-4aac-9f07-6e158f498768`. The explicitly approved schema insert was guarded by exact membership/contact/email/program/pending status and includes synthetic acceptance metadata. Global program templates remain zero; no tracking or real-member benefits changed.

Post-insert verification: membership pending; client access onboarding; Auth user NULL; `needs_onboarding_claim=true`; payment pending; agreement sent; enrollment access pending. Configuring the benefits did not bypass lifecycle gates or create an authenticated session.

## Identity, records and cleanup state

| Record | ID |
|---|---|
| Client A contact | `5add389e-e922-436f-b56c-12c6a30d601c` |
| Enrollment activation | `b463cb8d-d660-48f4-a6b5-906ebfa89034` |
| Membership | `16f27a3f-11b9-4aac-9f07-6e158f498768` |
| Draft individual household | `89b374fb-b63d-4cb9-aa78-e8b6e0d052ae` |
| Journey | `4f2afc7c-4e44-4aac-b5c8-ed7065dcf89c` |
| MK8 agreement, sent/unsigned | `af12575c-babc-4d42-8dd7-23e23f887358` |

[Complete Client A receipt](../deployment-evidence/2026-10-04-beta-remaining/client-a-progress.json) and [child IDs/audit rows](../deployment-evidence/2026-10-04-beta-remaining/client-a-child-records.json) include the two benefits, email delivery job, six journey steps, household membership, note, tag, five activities and invitation-link record ID/expiry without its token. No follow-up task or workflow record was created. Counts now:2Auth users,1staff,2client-access rows,2membership benefits,0program templates.

Client A is clearly labeled disposable and remains safely pending while acceptance awaits user interaction. Do not recreate it. Preserve audit and finish deactivation after testing. Existing archived/inactive food/recipe/meal/exercise/workout/fitness fixtures were not republished or changed; their [complete prior cleanup receipt](../deployment-evidence/2026-10-04-beta-hosted-release/cleanup-receipt.json) remains valid.

Client B `dave+rva-client-b@eaglevision.biz` is not created, pending confirmation that plus-address delivery works. Staff `dave+rva-beta-staff@eaglevision.biz` invitation is prepared in the normal UI with **Coach / Assigned People Only**, intended Client A scope, synthetic reason and planned revocation. **Not sent:** the browser action-time confirmation for staff access is pending. No role/default/override or staff grant changed.

The allowlist retains both originals plus the three exact approved aliases, digest `9642867372ec8b16d549d313fb88772080557260a2fc7744a0ddf80a1595e820`, as documented in the [previous continuation receipt](BETA_REMAINING_ACCEPTANCE_2026-10-04.md). No wildcard or SMTP change. Entries retained during unfinished acceptance; revisit cleanup afterward.

## Remaining gates and limitations

- Actual Client A external receipt and normal activation/signup/email confirmation, agreement acceptance, approved synthetic payment/waiver, claim, member login/refresh/logout/re-login and benefit access remain unproven.
- Client B and scoped staff full lifecycle, actual delivery, recovery, revocation/deactivation, private-health scope and wrong-client denial remain unexecuted.
- Meal/workout assignment→Client A view, Client B denial, five requested account transitions, private-DOM clearing and delayed-response isolation remain unexecuted.
- Fresh hosted member/scoped-staff/assignment/activation responsive checks remain pending. The prepared owner Invite Staff form passes at1440×1000,768×1024,390×844: page widths match viewports, actual dialog scroll/client widths match758/738/372px, no control extends horizontally outside the dialog. Viewport restored afterward. Current owner-tab warning/error log is empty. These three form checks do not substitute for scoped-staff/member acceptance; prior owner/content27checks are retained.
- Automatic approval review rejected opening the existing private mailbox because authorization to inspect that mailbox/account was not established. No retry/workaround was made. User receipt confirmation is the safer path already requested. Do not infer delivery from the provider response or request tokens in chat.
- No new application/backend defect established. No new feature package started.

## Immediate continuation

Obtain Client A mailbox receipt confirmation and browser-required scoped staff invitation confirmation. Keep the normal owner session. If the alias is rejected/bounced, stop that portion and request three fresh distinct inboxes. If received, use the actual delivered link and normal activation; user handles new passwords and legal acceptance. Continue the approved synthetic-only checklist, preserving all gates and documenting cleanup. Primary Chat alone owns the Justin/Elle green flag.

BETA NOT READY
