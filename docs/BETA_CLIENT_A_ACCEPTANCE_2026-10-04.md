# Hosted beta acceptance — Client A agreement, payment and activation passed

## Member dashboard acceptance blockers — 2026-10-05

Fresh normal member sign-in succeeded. Dashboard Home loaded the correct synthetic member and active Holistic Foundations program, 50% journey progress, current Vitality Assessment step, no fabricated score and no Family/household permission warning. Health & Progress opened and rendered all ten configured standard metrics with neutral measured-data states.

Nutrition and Workouts access failed. Neither sidebar destination renders, and Health & Progress reports that Nutrition is not included. Read-only database verification shows both approved membership-level benefit rows changed to `inactive` at the membership activation timestamp. The authenticated `my_app_access` result is `nutrition_enabled=false`, `fitness_enabled=false`, entitlement count 0. The membership status transition fired the existing entitlement reconciliation trigger, whose current function deactivates any benefit not backed by an active program-level template. The prior explicit approval required these two benefits to remain membership-level and prohibited a program template, so creating a template or merely forcing the rows active would evade the underlying lifecycle defect.

A normal dashboard reload also returned to the member sign-in screen; the second open member tab showed signed out as well. This fails the required refresh persistence check even though the current source constructs the Supabase client with `persistSession:true`. Logout/re-login and benefits cannot be accepted until the refresh and reconciliation defects are repaired and redeployed. No repair, template, hosted data mutation or production change occurred during this read-only validation. [Sanitized receipt](../deployment-evidence/2026-10-05-beta-delivery/client-a-member-dashboard-acceptance.json). **BETA NOT READY.**

## Real-alias reconciliation and resend — 2026-10-05

The user approved `rva-client@eaglevision.biz` as Client A's real receiving identity and prohibited further use of the unreliable `dave+...` aliases. Staging `RVA_SYNTHETIC_EMAIL_ALLOWLIST` now preserves all seven earlier exact entries and adds only the three approved identities `rva-client@eaglevision.biz`, `rva-staff@eaglevision.biz` and `dfowler4232@gmail.com`; no wildcard or mail-provider setting changed. Dashboard-confirmed ten-address digest: `57ee965ad3fcf7c5785ec5c2d021fb0c8036b65aeb417a6afebe8be965c22561`, saved `2026-10-05T19:55:35Z`.

Client A's existing contact was reconciled in place from the unsupported plus-address to `rva-client@eaglevision.biz` under guarded staging-only preconditions and an owner-attributed audit activity. The existing contact, membership, agreement, activation and journey IDs remain unchanged. Post-checks show exactly one contact, one membership and one agreement, with no Auth user and no duplicate client, membership, agreement, invitation or workflow. The prior journey link was deactivated before the existing agreement was resent through the normal authenticated owner portal.

The resend retained agreement `af12575c-babc-4d42-8dd7-23e23f887358`, still sent/unsigned/unwaived. Delivery job `7771fe3d-fd47-487a-b6b3-934e07335f63` completed in one attempt with no block or error. Resend message `01a10dae-85ba-7271-aa57-a8bd839739e9` reports `delivered` to the exact real alias at `2026-10-05T20:08:23.807Z` (3:08 PM Central); the exact-address suppression lookup is not found. The user independently confirmed actual mailbox receipt at `2026-10-05T20:10:54Z`, so the Client A external-delivery gate passes.

The user opened the private enrollment link in Safari and selected **Create my account** once. The page correctly reached **Check your email to verify your account, then reopen your original invitation**; the apparent spinner was the email-confirmation boundary, not an incomplete signup. Staging Auth contains exactly one real-alias user `b308daf6-69a8-4d76-9c71-8c5b9e4183d9`, created at `2026-10-05T20:19:03Z`. Resend confirmation message `01a10db8-49b6-7c44-a1ca-de6840196208`, subject **Confirm your email address**, was delivered and the user completed verification/sign-in at `2026-10-05T20:47:32Z`.

Reopening the original agreement invitation in the same signed-in Safari session successfully claimed the existing enrollment. The live page showed **Complete your enrollment**, Holistic Foundations `$89.00 · monthly`, six-month commitment, Payment required, and the existing **ReVitalized Academy New Client Agreement · version MK8**. The user personally reviewed and signed it through the normal flow. Read-only server verification records one accepted primary signature at `2026-10-05T21:04:57.341512Z`; its signer is the claimed Auth user and its content hash matches the frozen agreement. The existing contact remains linked to that user, `needs_onboarding_claim=false`, the same single agreement is signed, and all contact/Auth/membership/agreement counts remain one. No duplicate or replacement record was created. [Sanitized reconciliation, claim and signature receipt](../deployment-evidence/2026-10-05-beta-delivery/client-a-real-alias-resend.json).

After the user explicitly authorized **record synthetic payment**, the normal authenticated staging owner portal recorded exactly one `$89.00 USD` synthetic payment. Payment `6f34ccd8-303b-4b32-a71f-b34b8be78e53` uses method `other`, provider `Staging synthetic ledger`, reference `RVA-BETA-CLIENT-A-20261005`, and an explicit no-real-funds acceptance reason. The portal displayed **Payment recorded and audit record created**. Authoritative staging verification shows payment `paid`, agreement `signed`, enrollment activation and client access `active`, membership `active`, and `needs_onboarding_claim=false`. The journey remains active at 50% with payment/agreement and backend activation completed and Vitality Assessment in progress. Refreshing the live Client A enrollment page displays **Payment requirement satisfied**, **Your member access is ready**, **Your Holistic Foundations access is active**, and **Open Member Dashboard**. That CTA reaches the normal `/member/` sign-in screen; fresh member-dashboard sign-in, refresh/logout/re-login and benefit checks remain pending. [Sanitized payment and activation receipt](../deployment-evidence/2026-10-05-beta-delivery/client-a-synthetic-payment-activation.json).

No application source, deployment, migration, Edge Function, role, permission, feature flag, SMTP/provider or production change occurred. The only hosted mutation in this step was the explicitly authorized synthetic payment and resulting lifecycle activation; no real funds moved. No raw invitation link or token was stored or exposed. **BETA NOT READY.**

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

- Client A external receipt, normal signup/email confirmation, enrollment claim, agreement acceptance, one approved synthetic payment and resulting activation now pass. Fresh dashboard sign-in, Home and Health & Progress load. Refresh persistence fails, and activation deactivated the two explicitly approved membership-only benefits, so Nutrition/Workouts, logout/re-login and benefit access remain blocked.
- Client B and scoped staff full lifecycle, actual delivery, recovery, revocation/deactivation, private-health scope and wrong-client denial remain unexecuted.
- Meal/workout assignment→Client A view, Client B denial, five requested account transitions, private-DOM clearing and delayed-response isolation remain unexecuted.
- Fresh hosted member/scoped-staff/assignment/activation responsive checks remain pending. The prepared owner Invite Staff form passes at1440×1000,768×1024,390×844: page widths match viewports, actual dialog scroll/client widths match758/738/372px, no control extends horizontally outside the dialog. Viewport restored afterward. Current owner-tab warning/error log is empty. These three form checks do not substitute for scoped-staff/member acceptance; prior owner/content27checks are retained.
- Automatic approval review rejected opening the existing private mailbox because authorization to inspect that mailbox/account was not established. No retry/workaround was made. User receipt confirmation is the safer path already requested. Do not infer delivery from the provider response or request tokens in chat.
- No new application/backend defect established. No new feature package started.

## Immediate continuation

Authorize a narrow repair package that preserves explicit membership-level benefits across membership status reconciliation without creating a program template, and diagnose/fix member-session persistence across reload. Add regressions for activation-time membership-only entitlements and real reload/session restoration, deploy only to staging, then repeat Client A dashboard refresh/logout/re-login and Nutrition/Workouts acceptance before continuing Client B/scoped-staff assignment and isolation gates. Primary Chat alone owns the Justin/Elle green flag.

BETA NOT READY
