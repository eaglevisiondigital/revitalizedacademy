# ReVitalized Academy — current build state

## Enrollment account-creation confirmation repair — 2026-10-06

Hosted Client B acceptance reproduced a real mobile UX defect: Supabase created the account and sent verification immediately, but the enrollment page left the user on the unchanged form. The existing success text was written only to the page-level status above the mobile viewport, so the action appeared to do nothing.

The restricted Enrollment & Signature Center now replaces the sign-in/create form in place with a focused **Check your email to finish creating your account** panel after successful signup without an immediate session. It identifies the submitted address, explains email verification and the separate need to reopen the original private invitation, moves focus to the panel, scrolls it into view, and offers a safe return to sign-in. The existing Supabase signup, redirect, invitation claim, agreement, payment and lifecycle architecture is unchanged. Public onboarding JS/CSS cache versions advance from v2 to v3.

Validation: focused onboarding lifecycle **10/10**, JavaScript syntax **78/78**, full frontend **483 passed / 0 failed / 27 established skips**, staging build **314 files**. Source `3cb8ba4e18f73179e2de9ee7fdf88e516225fe2a` is live as dedicated staging deploy `6ac4ad32ad37f1281a60f6e8`; live onboarding JS/CSS v3 hashes match the exact build. Production remains deploy `6ac3eee5383ccf92be4d7a58`. [Repair report](docs/BETA_ONBOARDING_SIGNUP_CONFIRMATION_2026-10-06.md). Client B's already-created account is preserved; no duplicate signup or hosted data mutation is needed.

## Beta member benefit and session repair accepted — 2026-10-05

The two Client A blockers have narrow, tested repair candidates. `membership_entitlements.provisioning_source` distinguishes existing/template-managed rows from deliberately authorized `membership_override` rows; reconciliation continues to remove unbacked template benefits and all benefits for inactive memberships, while active/pending membership overrides retain their intentional status. The member shell now consumes Supabase `INITIAL_SESSION`, handles refresh events outside the auth callback lock, retries one early-empty restore, deduplicates same-session loads, and clears private state on logout, invalid sessions and account transitions. Member JS is cache version 211.

Local verification passes: frontend **482 passed / 0 failed / 27 established skips**, PostgreSQL 17 **240/240**, JavaScript syntax **78/78**, exact-built session runtime **6/6**, staging build **314 files**. Migration ledger **20261005221655** was applied once to staging. A guarded repair changed exactly Client A's two previously approved rows to active membership overrides; both survive a fresh reconciliation and authenticated `my_app_access` returns Nutrition/Fitness true with entitlement count 2. Source **abf2af690bc85387df4b4932b628bcf858a21875** is live as staging deploy **6ac42226bb66bc2171b9946e**. Live member JS v211, CSS v202 and runtime config match the exact build.

Hosted Client A acceptance passes. Nutrition opens and loads the real empty diary/targets/trends state; Workouts opens the real unassigned-plan state. A normal refresh restores the existing session without credential entry. A second tab restores the same session; refreshing tab A leaves both tabs authenticated. Explicit logout signs out both tabs, removes the private Client A identity from both DOMs and produces no console warning/error. Final normal re-login succeeds with Dashboard, Nutrition and Workouts available and a clean console. Production remains deploy **6ac3eee5383ccf92be4d7a58** and three public fingerprints are unchanged. No hosted nutrition/workout/health data was created or changed. [Implementation and acceptance evidence](docs/BETA_MEMBER_ACCESS_REPAIR_2026-10-05.md). **BETA READY.**

## Client A member dashboard acceptance exposed two blockers — 2026-10-05

Fresh normal Client A sign-in to the staging member dashboard succeeded. Home identified **Disposable Beta Client A**, active **Holistic Foundations**, 50% journey progress and current Vitality Assessment step. Health & Progress opened and rendered all ten configured standard metrics with neutral **Awaiting data / Building baseline** states, no fabricated Health Score, and no Family/household permission warning.

Benefit access does not pass. The live sidebar omits Nutrition and Workouts and the Health workspace says **Nutrition is not included in your current access**. Authoritative staging state shows the approved `nutrition_plans` and `fitness_plans` membership rows changed from active to `inactive` at `2026-10-05T21:41:30.698614Z`, the exact activation transition. `my_app_access` consequently returns `nutrition_enabled=false`, `fitness_enabled=false`, entitlement count 0. Root cause is confirmed: membership activation fired `sync_membership_entitlements_trigger`; `private.reconcile_membership_entitlements` deactivates any membership entitlement without an active program template. These two benefits were explicitly approved as membership-only with no program template, so activation removed their effective access. No template, grant, reactivation or repair was invented during validation.

Session refresh also fails hosted acceptance. A normal page reload after successful member sign-in returned to the Member sign-in screen, and the second open member tab also showed signed out. Source requests `persistSession:true`, so the live persistence failure needs isolated diagnosis rather than an unverified code change. No member data, source, migration, Edge Function, role, permission, feature flag, deployment or production system changed in this validation. [Sanitized member acceptance receipt](deployment-evidence/2026-10-05-beta-delivery/client-a-member-dashboard-acceptance.json). **BETA NOT READY.**

## Client A agreement, synthetic payment and activation — 2026-10-05

Staging's exact synthetic-recipient allowlist now preserves the seven earlier entries and adds the approved real identities `rva-client@eaglevision.biz`, `rva-staff@eaglevision.biz` and `dfowler4232@gmail.com`; no wildcard or mail-provider setting changed. Dashboard-confirmed digest `57ee965ad3fcf7c5785ec5c2d021fb0c8036b65aeb417a6afebe8be965c22561`. Existing Client A contact `5add389e-e922-436f-b56c-12c6a30d601c` was guardedly reconciled in place to `rva-client@eaglevision.biz`; the existing membership, agreement, activation and journey IDs are unchanged and duplicate record counts remain one. The prior journey link was deactivated and the existing agreement resent through the authenticated owner portal. Delivery job `7771fe3d-fd47-487a-b6b3-934e07335f63` completed in one attempt; Resend message `01a10dae-85ba-7271-aa57-a8bd839739e9` reports delivered at 3:08 PM Central with no suppression entry. The user independently confirmed actual receipt at `2026-10-05T20:10:54Z`; external delivery now passes.

The user opened the private link in Safari and selected **Create my account** once. The page reached its intended verification boundary. Staging contains exactly one real-alias Auth user `b308daf6-69a8-4d76-9c71-8c5b9e4183d9`, created at 3:19 PM Central. Resend reports **Confirm your email address** delivered at `2026-10-05T20:19:03.908Z`; the user completed verification/sign-in at `2026-10-05T20:47:32Z`. Reopening the original invitation successfully claimed the existing enrollment. The user personally accepted the existing MK8 agreement through the normal signed-in flow. Server state records one accepted primary signature at `2026-10-05T21:04:57.341512Z`; its signer user matches the claimed account and its content hash matches the frozen agreement.

After the user's explicit **record synthetic payment** authorization, the normal staging owner portal recorded exactly one `$89.00 USD` synthetic payment: payment `6f34ccd8-303b-4b32-a71f-b34b8be78e53`, method `other`, provider `Staging synthetic ledger`, reference `RVA-BETA-CLIENT-A-20261005`; no real funds moved. Read-only authoritative verification now shows payment `paid`, agreement `signed`, activation/client access `active`, membership `active`, and `needs_onboarding_claim=false`. The existing journey advanced to 50% with payment/agreement and backend-activation steps completed and Vitality Assessment in progress. Refreshing the live enrollment page displays **Payment requirement satisfied**, **Your member access is ready**, **Your Holistic Foundations access is active**, and the **Open Member Dashboard** CTA. The CTA reaches `/member/`, which requires a fresh normal member sign-in before dashboard/benefit acceptance can continue. The same contact/user/membership/agreement association remains; no duplicate or replacement record was created. No source/deployment/migration/Edge/role/permission/feature-flag/provider/production change; no password or raw token stored or exposed. [Identity/agreement receipt](deployment-evidence/2026-10-05-beta-delivery/client-a-real-alias-resend.json) and [payment/activation receipt](deployment-evidence/2026-10-05-beta-delivery/client-a-synthetic-payment-activation.json). **BETA NOT READY.**

## Vitality entry and completed progress cleanup — 2026-10-05 (deployed staging)

Implemented the approved two-path entry UX and completed progress strip. Start reveals existing Contact; Resume opens the one existing verified-email recovery form with approved neutral copy. Completed view marks ✓ Contact Saved / ✓ Assessment Complete / ✓ Complete; only Complete is current, 100% and locking preserved. No backend or completed hosted record mutation. Focused runtime 30/30, assessment 20/20, environment/protection 36/36, syntax78/78, staging build314. Exact-built isolated Start/Resume and completed layouts pass all three requested widths with no overflow/console warnings/errors. Deployed source **1d649c60abf580f9f696428ff2540a47ee1bf9eb**, staging deploy **6ac3bbaeecd0a269b0a5eef6**. Four live JS/CSS/runtime hashes match; HTML application text/forms/scripts match after existing Netlify processing. Live Start/Resume passes all three widths, clean console. Completed hosted record was not reopened; read-only hashes/timestamps/revision33/counts and original Spam capture are unchanged. Production deploy **6ac036d3b48eac0008568e00** and nine public fingerprints unchanged. [Package/evidence](docs/VITALITY_ENTRY_CLEANUP_2026-10-05.md).

Primary Chat now accepts the preserved synthetic Spam record as sufficient CAPTURE proof; no reclassification/resend/filter weakening. Downstream coach/notification delivery is a future concern, not a defect in this acceptance. Earlier NOT READY entries below are historical. **VITALITY RESUME READY** after successful focused tests and staging verification. **BETA NOT READY** remains independent pending client/staff/meal/workout hosted acceptance. No hosted form/email/data mutation, backend/provider change or migration replay.

## Hosted synthetic assessment completed and reconciled — 2026-10-05

Fresh 09:34 mail opened normally and verified at **14:38:59.864214 UTC**. Fresh 93% DOM restored all nine original answer checks, all eighteen Functional Training controls and final synthetic-only note, retaining revision 31 and the same IDs. The older tab was absent from both user and managed-tab inventory; actual old-tab reload denial is **unverified**, not claimed. Prior deployed RPC rolled-back security proof independently passed replaced-session/wrong-person/expiry checks.

Submitted once through the normal UI. Existing draft **1d66c0f6-c6ad-4cd6-ab8f-5fc778e87ce2** is now **completed / revision 33 / 100%**, dispatched **14:41:24.899158 UTC**, completed **14:41:25.339743 UTC**. Existing contact/workflow/journey retained; counts **1/1/1**. Workflow complete, one Journey completion event, one completed assessment Journey step, one completion activity. Normal reload stays complete/locked at 100%, assessment hidden, all assessment controls disabled; console warnings/errors **0**. Actual completion layouts pass **1440×1000, 768×1024, 390×844** with no page/card overflow.

Netlify captured exactly one target submission **6ac3b715e156348257058d67**, **14:41:25.209 UTC**, existing staging form **6abaa9ef8424f60009aaa4eb**, exact `assessment_resume_id` matching the draft and approved alias. Capture is classified **Spam**, verified count **0**. Its encoded coach-summary SHA-256 **619dd576a76601ef2a2fd698cec44bff17cf9b06c4c330223176cda60b871bcb** matches the preserved final payload exactly. No resend, reclassification or raw payload export. Read-only post-reload capture count remains one. No claim that verified notifications/coach processing occurred.

Staging and production published deploys unchanged at **6ac38599ba35bc77a266d41c / 6ac036d3b48eac0008568e00**, checked **14:46:32.779 UTC**. No application/backend/config/migration/Edge/deployment change. Related local test/documentation work preserves tab-scoped storage; focused runtime **22/22**, syntax check passes. Remaining: live transient-save error/retry coverage; actual stale-browser-tab reload unavailable; completion progress strip incorrectly shows **1 · Contact** after reload; synthetic Spam disposition/verified workflow acceptance needs explicit resolution. Do not reopen, reset or duplicate this completed synthetic assessment. [Completion report and Chat handoff](docs/VITALITY_HOSTED_COMPLETION_2026-10-05.md). **VITALITY RESUME NOT READY. BETA NOT READY.**

## Fresh 40% recovery passed; final review and stale-session checkpoint — 2026-10-05

User normally opened the newest 09:26 Central recovery email after genuinely closing the prior assessment tab. Server verification **14:31:20.536036 UTC**, revision **21**, section **6 / Functional Training / 40%**. Fresh DOM and server comparisons pass all nine original answer checks plus all **18 Functional Training controls**. Same contact/draft/workflow/journey; counts **1/1/1**. No restart at Contact/Section 0. This is actual full-close/fresh-email answer restoration; automatic plain-URL new-tab resume remains unsupported by tab-scoped credential storage.

Continued all remaining adult/self drivers with explicitly synthetic answers through normal UI. Server now confirms **revision 31 / section 14 / Final Thoughts & Submit / 93%**, saved **14:34:35.845618 UTC**; original nine answer checks remain true and synthetic-only final note is saved. No dispatch/completion timestamp or Journey completion event yet; Submit remains unclicked. Final-review viewport tests matched **1440×1000, 768×1024, 390×844**, no horizontal page/form overflow, Submit reachable, console warnings/errors **0**.

Issued one normal Continue Later recovery for actual session rotation: Resend `01a10c7c-ef1d-7ae8-9574-c52850f92068`, sent **14:34:36.851 UTC / 09:34 Central**, provider **delivered**, user receipt/open pending. Older live assessment tab intentionally retained. User must open newest 09:34 message once and leave older tab untouched; then reload older tab to verify rejection, continue fresh 93% tab, submit once, reconcile actual Netlify correlation, one Journey completion and completed lock. No application/backend/config/migration/deployment/production changes.

## Plain-URL reopen failure diagnosed — 2026-10-05

User closed the assessment tab and reopened normal `/consult.html`; fresh tab displays blank Step 1 Contact. Existing server draft is unchanged at **revision 21 / section 6 / Functional Training / 40%**, counts **1/1/1**, all nine stored answer checks true, active session expiry **2026-11-04 14:10:32 UTC**, no pending mail credential. Source explicitly stores the opaque credential in **tab-scoped sessionStorage**, not persistent localStorage. Closing the tab loses that client credential; a fresh plain-URL tab has no verified authority to read the draft. No data loss or server reset is evidenced. The earlier instruction to close every tab and reopen the plain URL as an automatic-resume test was incorrect and is superseded.

Correct full-close recovery uses **Returning to an unfinished assessment?** and a fresh verified email link for the existing draft. Never reuse a consumed email or submit Contact. Preserve tab-scoped storage and approved private-answer boundaries; no application/storage redesign. Added focused regression for new tab with no credential, unchanged server answers, email-only recovery and fresh-mail typed restoration; corrected misleading test name that simulated retained credential as browser-style close. Native/Edge source is unchanged. Recovery requests are rate-limited to three per hour; this existing recipient's window ends **09:25:38 Central**. No bypass or repeated request before that window ends.

After the window expired, submitted the normal email-only recovery form once. UI acknowledges **Link request received**. Resend message `01a10c75-1a91-7a4f-a70d-971cbc72d478` reports **delivered**, sent **14:26:03.734 UTC / 09:26 Central**. Post-request server state is still revision 21 / Functional Training / 40%, pending mail present, prior session retained. User must open this **newest 09:26 message** normally and click Continue once; actual receipt/open and renewed typed restoration remain pending. Focused runtime suite **22/22 passing**, no skips/failures. [Receipt](deployment-evidence/2026-10-05-vitality-hosted/blank-new-tab-recovery.json). **VITALITY RESUME NOT READY. BETA NOT READY.**

## Functional Training recovery verified; user full-leave test pending — 2026-10-05

User reports the recovered assessment is at Functional Training / 40% and requests answer-based leave/resume acceptance. Fresh read-only server evidence confirms **revision 21 / section 6 / Functional Training / 40%**, updated **14:06:25.239775 UTC**, counts **1 contact / 1 draft / 1 workflow**, same journey. Successful fresh-email exchange is now **14:10:32.815932 UTC / 09:10:32 Central**; the 09:06 message credential is consumed, current session valid. The current user tab restores all nine earlier synthetic answer checks, plus all **18 Functional Training controls**: nine movement choices, symptoms, training frequency, program radio, five numeric ranges and activity choice. All six grouped server and DOM comparisons pass; console warnings/errors zero. This is actual answer restoration following the fresh-email exchange, not only section/progress.

The older session tab is no longer present, so actual older-tab stale denial is not claimed; deployed rolled-back security fixtures retain their separate prior proof. User asked to close every assessment tab and reopen normal `/consult.html` in the same Chrome profile, without clearing storage, submitting Contact or reusing the consumed email. Repeat the nine plus eighteen answer comparisons after that user-driven full leave. No new recovery mail or identity was requested in this check. No source/backend/config/migration/deployment/production changes. **VITALITY RESUME NOT READY. BETA NOT READY.**

## Full close/email typed restoration passed; later recovery pending — 2026-10-05

The user opened the newest 08:59 Central recovery message normally after both assessment tabs were closed. Fresh hosted DOM restored **Contact Saved / Cellular Hydration / 13% / Saved**, the adult/self pathway and all nine synthetic value checks (checkbox, text, numeric range, radio, conditional detail, textarea, dropdown, symptom details and hydration note). Same draft/contact/workflow/journey, counts **1/1/1**, revision **10**; new successful verification **14:01:21.907168 UTC**, pending mail consumed, no fragment or console warnings/errors. Actual viewport overrides now work: **1440×1000, 768×1024, 390×844** each matched requested dimensions and the restored Saved page had no horizontal page/panel overflow. Earlier unsuccessful override attempts remain historical, not current blockers.

Continued normal controls with explicitly synthetic answers through Systemic Detoxification, Electrobiology Rhythms, The Living Diet and Functional Training. Latest acknowledged hosted state: **revision 21 / section 6 / Functional Training / 40%**, updated **14:06:25.239775 UTC**; original nine snapshot checks still pass and identity counts remain **1/1/1**. Requested one later recovery using Continue Later. Resend accepted message `01a10c63-2255-79eb-9399-2e1309bb8346`, sent **14:06:26.029 UTC / 09:06 Central**; latest provider observation is **delivered**; actual user receipt/open remains pending. User asked to open that newest message normally; older working tab intentionally retained untouched for stale-session denial after rotation. Do not resend automatically or create another identity.

No source/backend/config changes, migration replay, deployment or production mutation. Only authorized synthetic draft saves and recovery state changed. Remaining gates: later recovery/stale session, complete final Netlify correlation, one Journey completion, completed lock, other required hosted responsive/error states and pathways. **VITALITY RESUME NOT READY. BETA NOT READY.**

## Hosted synthetic typed-save and leave checkpoint — 2026-10-05

Continued the approved existing assessment from the restored session using explicitly synthetic/non-sensitive fixtures. Exercised radio, three-checkbox selection, textarea/text, numeric scale, conditional diagnosis-detail field, hydration dropdowns and dynamically created symptom frequency/disruption/duration fields. Observed **Saving…**, then **Saved**. Nine read-only boolean comparisons against the hosted private snapshot pass; same draft/contact/workflow/journey IDs, counts **1/1/1**, revision **10**, section **2 / Cellular Hydration / 13%**, updated **2026-10-05 13:57:04.617567 UTC**. A normal reload restored the same section/percent and all nine DOM comparisons pass, including typed numeric scale and conditional/symptom details.

Used normal **Email me a link to continue later** only after Saved. Resend reports delivered for `01a10c5c-6c40-791b-a430-6ba73225ca52`, sent **13:59:06.205 UTC / 08:59 Central**, exact `rva-assessment@eaglevision.biz`. Fresh pending recovery credential exists on the same revision-10 draft; no duplicate identity or final submission. Closed both existing assessment tabs and verified zero `/consult` tabs remain, for a genuine leave/email-resume test. User action pending: receive/open **that newest 08:59 email**, click Continue once normally, then confirm the resulting screen. Do not start Contact or reuse older consumed messages. Full close/email restoration is not yet claimed; fresh open/restore comparisons, later recovery, completion and remaining responsive/security gates follow. No raw token access, direct answer SQL writes, source/backend/config change, migration, deployment or production mutation. [Checkpoint](deployment-evidence/2026-10-05-vitality-hosted/typed-save-before-close.json). **VITALITY RESUME NOT READY. BETA NOT READY.**

## Fresh recovery email opened successfully — 2026-10-05

User confirms normal opening of the newly requested email. New hosted tab displays **Contact Saved / Whole-Person Snapshot / 7% / Saved**, no URL fragment, and zero captured console warnings/errors. Read-only database evidence confirms the same contact/draft/workflow/journey IDs, counts **1/1/1**, fresh verification **2026-10-05 13:26:39.167446 UTC**, active session and consumed recovery credential. The user's subsequent assessment interactions have saved revision **4**, section **1**, percent **7**, updated **13:31:25.106512 UTC**. This is a real hosted fresh-mail exchange and subsequent save/progress acknowledgment; it does not yet prove typed-answer restoration after closing/recovery, all pathways or completed final dispatch.

No agent answer entry, new email, new identity, raw credential/answer extraction, backend/source/config change, migration, deployment or production mutation during this check. The new tab is preserved for continuation. Keep it open; do not reopen the consumed email link. Next acceptance is controlled synthetic-answer save/leave/recover/restore and eventual completion, preserving these IDs. [Fresh open receipt](deployment-evidence/2026-10-05-vitality-hosted/fresh-recovery-open.json). **VITALITY RESUME NOT READY. BETA NOT READY.**

## Approved existing-draft recovery email — 2026-10-05

Latest user explicitly treats the prior browser session as unavailable and authorizes one normal recovery email. Current Chrome inventory has only the user's failed Contact tab; used **Returning to an unfinished assessment? → Email my secure resume link** with exact `rva-assessment@eaglevision.biz`, without submitting Contact. UI confirms **Link request received**. Resend reports **delivered** for new message `01a10c3d-c8e4-7c75-a197-2b0603b06ca3`, sent **2026-10-05 13:25:38.357 UTC (08:25 Central)**. Actual forwarded mailbox receipt/open remains unverified.

Pre/post read-only checks retain contact `667aec53-0fe2-453b-b47a-8b3012777411`, draft `1d66c0f6-c6ad-4cd6-ab8f-5fc778e87ce2`, workflow `7d17430a-1e9e-4ba7-aacd-570d48cdf66d` and journey `409cdfcb-9aae-462b-9d49-abb3ac2ba2b4`; contact/draft/workflow counts remain **1/1/1**, status draft, revision 0. Fresh pending recovery credential expires **2026-11-04 13:25:38.095452 UTC**. Prior verified session remains present. Only expected recovery credential/rate-limit state changes; no answers/final submission/new identity, raw token access, source/backend/config change, migration replay, deployment or production mutation. Earlier acceptance evidence is retained. Stop pending user opening the **newest 08:25 Central** message normally and clicking Continue **once**. This supersedes the earlier instruction to find the old tab or avoid recovery. [Receipt](deployment-evidence/2026-10-05-vitality-hosted/fresh-recovery-receipt.json). **VITALITY RESUME NOT READY. BETA NOT READY.**

## Hosted unavailable-link investigation — 2026-10-05

Latest user could find only the rejected Contact tab. A fresh Chrome inventory still contains both assessment tabs; the original verified tab still displays Contact Saved / Introduction / Saved. It was located through native Chrome tab controls and selected for the user, without reload, answer entry or credential access. Read-only database verification still shows the same draft/contact/workflow IDs, revision 0, valid session and no pending mail. No recovery email is needed now. If the tab/session is genuinely lost later, the normal **Returning to an unfinished assessment?** recovery form with exact `rva-assessment@eaglevision.biz` requests a fresh link for the existing draft; successful fresh redemption rotates the session without changing identity/workflow IDs or erasing historical acceptance evidence. No recovery was submitted in this check. [Working-tab screenshot](../vitality-working-tab-2026-10-05.jpg).

The user reported a real unavailable-link screen after opening the received real-alias message. Read-only reconciliation establishes a successful first exchange at **12:27:59 UTC**, followed by a rejected POST (**401 at 12:32:34 UTC**). The existing draft `1d66c0f6-c6ad-4cd6-ab8f-5fc778e87ce2` is verified, has a valid session through **2026-11-04 12:27:59 UTC**, and has no pending mail credential. The original browser tab restored Introduction / 0% / Saved after a normal reload; the second tab displays the reported error. Evidence supports replay of an already-consumed single-use mail credential, not a failure of the first exchange. Minimal logs intentionally exclude request bodies/credentials and cannot independently fingerprint the rejected credential. No new identity, recovery email, hosted write, migration, Edge/source deployment or production change was made. Existing contact/draft/workflow/journey IDs are preserved.

Added replay regressions and made the isolated browser mail fixture single-use: **21/21 runtime, 20/20 native PostgreSQL 17.11, 18/18 Edge**. No application/backend repair is indicated by this sequence; the session reload works and replay denial preserves security. Current Edge control-plane version is **3**, with the same bundle SHA-256 as the original version-1 release receipt; the older version-1 label below describes that initial release. [Diagnosis, limits and exact next user action](docs/VITALITY_HOSTED_ACCEPTANCE_2026-10-05.md#unavailable-link-investigation). Next: return to the existing tab showing **Contact Saved / Introduction / Saved** and confirm it is visible; do not reopen the consumed email link, submit Step 1 again or request another email yet. Subsequent answer-save/recovery/completion acceptance remains pending. **VITALITY RESUME NOT READY. BETA NOT READY.**

## Secure free Vitality resume implementation — 2026-10-05

Latest user authority resolves the earlier identity questions: verified-email resume without a member account, private server drafts and 30-day inactivity credentials. Implemented debounced typed-answer autosave, restoration, recovery, revision protection and locked completion. One forward migration applied once to staging as **20261005110245**; new `vitality-resume` Edge function **v1** deployed. Frontend source **e51b04545c5eba5f33d7b3a3aafca3b2cca854a8** deployed to staging site `071b252e-a922-4846-a784-8dca1edad377`, deploy **6ac38599ba35bc77a266d41c**. Six exact asset hashes match the build. Production deploy `6ac036d3b48eac0008568e00` and nine public fingerprints are unchanged. Native PostgreSQL 17.11 **234/234**, Edge **47/47**, new resume **20/20**, existing assessment **20/20**, JavaScript syntax **78/78**. Full frontend **466 passed / 0 failed / 27 skipped**. Local Saved/error/recovery/completion screens and live entry fit 1440×1000, 768×1024 and 390×844 with no horizontal overflow; live entry console is clean. The four intentionally changed protected hashes were reviewed and updated; unchanged form controls and child questionnaire remain protected. [Current implementation and 22-case acceptance](docs/VITALITY_RESUME_BETA_GATE.md).

Latest authority replaces the unconfirmed plus-address for continued testing with the real forwarding alias `rva-assessment@eaglevision.biz`. The exact alias was added to the staging recipient allowlist while preserving all six prior recipients; verified seven-address digest `58168025c8e9fca07db5d30970c7eb1713daed8fe98d560f443f87db0256dcd3`. Normal hosted Save & Continue captured one new Netlify lead (`6ac395a92a1105478a7ad04c`), contact (`667aec53-0fe2-453b-b47a-8b3012777411`), draft (`1d66c0f6-c6ad-4cd6-ab8f-5fc778e87ce2`) and workflow (`7d17430a-1e9e-4ba7-aacd-570d48cdf66d`). Resend accepted message `01a10c00-a40f-79b1-bc16-d6b2bcbe84f5`; the user then confirmed actual receipt at `dave@eaglevision.biz` and opened the Continue link normally. Hosted verification passes: URL fragment removed, same draft verified, opaque session digest present, one-time mail digest consumed, Introduction 0% restored and console clean. No health answers or final submission exist because this requested checkpoint stops immediately after normal open. The older plus-address record remains an unfinished historical synthetic record and must not be used for continuation. [Hosted checkpoint](docs/VITALITY_HOSTED_ACCEPTANCE_2026-10-05.md).

No application source, migration, Edge or frontend redeployment occurred during this hosted continuation. The browser viewport override did not apply requested responsive dimensions; only the actual desktop verification page and clean console were observed, so fresh responsive lifecycle coverage remains pending. Existing A/B/staff identities remain reserved. External Netlify final dispatch is at-most-once; ambiguous delivery preserves answers and requires reconciliation rather than an automatic duplicate. **VITALITY RESUME NOT READY. BETA NOT READY.** The older progress-only audit below is historical, not current source behavior.


## Additional mandatory beta gate — free Vitality save/resume — 2026-10-05

The user adds full free/pre-client assessment answer persistence and secure resume to the final green flag, without replacing pending client/staff/meal/workout acceptance. [Audit, 22-case matrix and decision handoff](docs/VITALITY_RESUME_BETA_GATE.md). Current frontend loses unfinished answers on close/reload; Supabase mirrors progress metadata, not Vitality answers. Existing Journey links restart `/consult.html`. Exact-built synthetic reload reproduction confirms lost answer/section and no answer-save or resume request. Secure free-user recovery identity and draft storage/privacy policy require primary Chat resolution; no schema/access model was invented. No application/backend/hosted change. **VITALITY RESUME NOT READY. BETA NOT READY.**

## Beta invitation delivery verified by Resend — 2026-10-05

Connected Resend now reports **delivered** for both exact approved Client A and synthetic staff invitations. Neither address has a suppression entry. This confirms receiving-server delivery; user receipt/inbox placement and normal activation are still unverified. [Provider receipt](deployment-evidence/2026-10-05-beta-delivery/resend-receipt.json) and [updated acceptance report](docs/BETA_STAFF_INVITATION_ACCEPTANCE_2026-10-04.md). User action requested in the mailbox receiving the eaglevision.biz aliases; no email body/token retrieval or bypass. No resend, hosted-data change, source change or deployment occurred. Client B and the later lifecycle/assignment/isolation gates remain pending. **BETA NOT READY.** Earlier delivery-unknown/provider-disconnected statements below are historical.

## Final beta continuation — scoped staff invitation sent — 2026-10-04

[Latest acceptance record](docs/BETA_STAFF_INVITATION_ACCEPTANCE_2026-10-04.md). The approved synthetic staff invitation was sent through the normal owner UI after the user supplied the required phone. Exact alias `dave+rva-beta-staff@eaglevision.biz`; Coach / Assigned People Only; NDA pending, zero assigned clients, zero individual permission overrides. Current private-health/progress/plan-override/staff-management/export checks and unassigned contact access all return false. Actual mail receipt, activation and post-activation scope remain unverified. Client A remains onboarding/unclaimed: Resend accepted its exact invitation, but Primary Chat found no message in connected Gmail. Downstream delivery/bounce/suppression is unverified; Resend integration suggested but not yet connected. No token bypass or rejected-mailbox workaround.

No source, deployment, migration, Edge, role-default, feature-flag or SMTP change. Existing accepted suites retained. Final comparison: 23 staging hashes and 20 production fingerprints unchanged; production deploy `6ac036d3b48eac0008568e00`. Client B and remaining recovery/revocation/assignment/isolation/responsive hosted gates remain pending delivery and activation. **BETA NOT READY.** This supersedes the unsent-staff status below. Pending synthetic identities and audit records retained for continuation; archived content fixtures unchanged.

## Remaining beta acceptance — Client A created, external receipt pending — 2026-10-04

[Latest hosted continuation](docs/BETA_CLIENT_A_ACCEPTANCE_2026-10-04.md). Normal owner second sign-in passed. Client A was created via People/Action Center with pending Holistic Foundations membership and MK8 agreement; Resend accepted its invitation at23:00:53UTC, but actual mailbox receipt awaits user confirmation. Only Client A membership received approved Meal Plans/nutrition_plans and Workout Plans/fitness_plans (NULL limit/none cadence). Payment remains pending, agreement unsigned, Auth user NULL and claim required; no lifecycle bypass. Staff Coach/Assigned People Only invitation is prepared but unsent pending browser-required confirmation; Client B not yet created. No source/schema/deployment/role/flag changes. Release86a0bf3/deploy6ac2cd1a0ce4124aafbdf39d retained;23staging and20production fingerprints rechecked unchanged. Production6ac036d3b48eac0008568e00 untouched. Exact synthetic records retained pending acceptance. BETA NOT READY; continue receipt/activation and multi-account gates, no new feature package.

## Remaining beta acceptance — owner sign-in pending — 2026-10-04

[Continuation receipt](docs/BETA_REMAINING_ACCEPTANCE_2026-10-04.md). The user approved synthetic membership-only Meal Plans/nutrition_plans and Workout Plans/fitness_plans plus three fresh eaglevision.biz aliases. Staging recipient allowlist now preserves the original two recipients and adds only those aliases; saved digest verified. No accounts, benefits or invitations created yet: normal owner sign-in is pending after accepted logout. No new product decision is needed. Existing source86a0bf3/deploy6ac2cd1a0ce4124aafbdf39d unchanged; all23staging hashes and20production hashes freshly verified. Production deploy6ac036d3b48eac0008568e00 unchanged. No source, schema, role, flag, migration or Edge change. Prior tests retained. BETA NOT READY until remaining hosted lifecycle, delivery, assignment and privacy gates pass.

## Hosted beta release and acceptance — BETA NOT READY — 2026-10-04

[Current hosted acceptance, exact live hashes and complete Chat/Work handoffs](docs/BETA_HOSTED_ACCEPTANCE_2026-10-04.md). Owner normal login/refresh/logout passed; second sign-in and multi-account acceptance remain pending. Final staging source86a0bf34fff4f08ef19567fd00172346adb095da is deploy6ac2cd1a0ce4124aafbdf39d. Forward migration applied once under actual ledger20261004214656 (source20261004124537), staff-managementv5. Hosted workout-duration constraint defect was narrowly repaired in frontend Content Compositionv2, redeployed and retested successfully. Build313, syntax77, frontend446pass/0fail/27existing skips, beta source/exact-built23/23; unchanged native215/215 and Edge30/30 retained. Hosted synthetic food/recipe/calculation/edit/meal/workout composition and scheduling pass;27form/content responsive checks show no overflow. All five content fixtures archived and food inactive; no synthetic people or assignments created. No program/member entitlements exist; approved benefit mapping and unused inbox/allowlist approval are required before remaining lifecycle/member acceptance. BETA NOT READY. Production deploy6ac036d3b48eac0008568e00 and20fingerprints unchanged. All23checked staging assets match build. Earlier held-release sections below are historical.

## Hosted owner preflight — BETA NOT READY — 2026-10-04

[Fresh owner/session diagnosis, migration preconditions, live hashes and acceptance limits](docs/BETA_HOSTED_PREFLIGHT_2026-10-04.md). The existing staging owner is already active, confirmed, fully onboarded and has all six required operator permissions. The available browser account had no staff record; normal logout and owner-email preparation completed, but owner sign-in awaits user password entry. No manual grant or activation is needed. No release or synthetic transaction was performed. Candidate3996379 is unchanged; migration20261004124537 remains unapplied; staging deploy6ac1fec19f756106b6a84964 and production6ac036d3b48eac0008568e00 remain unchanged.14live baseline assets match accepted source and20production fingerprints are unchanged. Existing local test results are retained, not rerun or misrepresented as hosted acceptance. The latest user authorizes the coordinated release only after legitimate owner access and all security/regression gates pass.

## Beta Readiness Core v1 — HELD / BETA NOT READY — 2026-10-04

Local candidate extends accepted `1462b34b49716f19fb0db55d4bc11098edfe2b9d` on `codex/staging`. [Implementation, security, tests, operator paths and required acceptance](docs/BETA_READINESS_CORE_V1.md). Adds existing-library edit/composition workflows, scoped client meal/workout assignments and member detail, duplicate-safe staff invitation, repeated Add Person and staff/session privacy repairs. No parallel content model or new access grants.

Build313, syntax77, frontend470 total/443pass/27historical skips, native PostgreSQL17.11 215/215, Edge30/30 with19entrypoints checked. New beta20runtime/36database/5Edge tests pass. Exact-built synthetic browser33responsive checks pass at desktop/tablet/mobile. The historical nine agreement fixture failures are corrected by supplying their missing explicit synthetic onboarding origin, without weakening application gates. Accepted Health and Nutrition suites stay green locally.

**Not deployed:** staging remains deploy `6ac1fec19f756106b6a84964`. Migration `20261004124537_beta_core_assignment_boundaries.sql` is a new unapplied candidate; staff-management Edge changes are unpublished. Existing staff login still reaches **Account Active / Staff access is pending**. Mandatory hosted invitation/login/recovery, scoped staff and two-member meal/workout acceptance remain blocked. No hosted content/accounts/permissions changed; no real beta clients added. Production deploy `6ac036d3b48eac0008568e00` and20sampled fingerprints remain unchanged. Local success does not authorize beta use. Next: normal approved-owner sign-in, then coordinated candidate rollout/required synthetic hosted acceptance under the documented gate. Final primary Chat green flag withheld.

## Member Health & Progress Dashboard v1 — 2026-10-04

Implemented on `codex/staging`, preserving accepted Nutrition Targets + Trends baseline `b726fdbd062f1e419a70380119c5ae75fe8854b6`. [Contract inventory, behavior, flags, privacy and acceptance boundaries](docs/MEMBER_HEALTH_PROGRESS_V1.md). Existing premium Health overview now combines configured real measurements/7–30-day trends with compact goals, habits, nutrition, coaching and source summaries. Core session/request ownership and private-DOM clearing are hardened. No backend contract, hosted migration, grant or feature activation was introduced.

Member core JS 209 / CSS 201; Health JS 1 / CSS 1; build 311 files. The new maintained suites contain 52 frontend/runtime and 16 native database cases. All native scoped cases pass; the nine known unrelated agreement fixtures remain separate. Browser normal/empty/partial/long-label cases pass at 1440×1000, 768×1024, 390×844. The normal staging member session became available after asynchronous restoration. Authenticated read-only acceptance now passes: ten configured metrics, six manual choices, neutral empty states, 7/30-day controls, refresh, quick links/sidebar navigation and clean console at all three sizes. Nutrition/connected-health access correctly remains unavailable for this member. Populated hosted acceptance remains limited by empty data; synthetic local fixtures cover those states.

**Release evidence:** the workspace `STAGING_MEMBER_HEALTH_PROGRESS_2026-10-04.md` and `deployment-evidence/2026-10-04-member-health/` record the final tested SHA, complete suite totals, staging deploy ID, live hash verification and unchanged production evidence. Consult that receipt for current deployment; this implementation record alone is not a deployment assertion. Existing staging site only: `071b252e-a922-4846-a784-8dca1edad377`; production remains outside scope. The accepted Nutrition release and historical records below are preserved. No unrelated next build has begun.


## Latest package — Nutrition Targets + Trends frontend repair, 2026-10-04

The authorized D1–D5 repair extends candidate `8c030118239528cd2ddbfccbfe32edc31c5dc245` and preserves its six upstream commits. Day, effective targets and selected 7/30-day report now load together through normal Review open/reload/date/range controls. All private DOM clears on context changes or failure. Generation/contact/date/range/open/permission ownership applies to reads and target mutation completions. SQL dates render locally without timestamp conversion. All configured targets remain accessible, including null-valued overrides; numeric zero stays distinct from unknown.

**Verified before release:** build 309 files; syntax 72/72; full frontend 398 total: 371 passed, zero failed, 27 historical skips. New normal-flow runtime suite 102/102; Coach Review 22/22; target source 4/4; Nutrition Engine 6/6; Content Builder 9/9; Member Nutrition 18/18. Native PostgreSQL 17: 163 total, 154 passed, the same nine unrelated agreement onboarding-origin fixtures failed; all 37 accepted target/trend and 29 existing nutrition database tests pass. Frozen Edge 25/25 and 19 entrypoints typechecked. Exact-built browser checks cover 101 targets/202 actions, read-only/editable, empty and long text at 1440×1000, 768×1024 and 390×844 without overflow or console warnings/errors.

Release assets: Review JS103 / Wellness CSS120 / Wellness JS118. This source package is authorized only for existing staging site `071b252e-a922-4846-a784-8dca1edad377`. The final deployed SHA, deploy ID and exact public hashes are recorded separately in workspace `STAGING_NUTRITION_TARGETS_REPAIR_2026-10-04.md`; source completion alone is not deployment evidence. Hosted authenticated acceptance remains blocked by **Account Active / Staff access is pending**. No access was manufactured.

Migration ledger `20261004055612` and accepted SQL are unchanged; no replay. The prior uncommitted 37-test database suite is preserved byte-for-byte and incorporated with its validation documents. The Living Diet remains draft; no hosted target/diary/client or permission writes are authorized. [Repair details and historical failed-candidate evidence](docs/NUTRITION_TARGETS_TRENDS_VALIDATION.md).

Next: obtain a normally approved working staff session through the established access process for read-only hosted acceptance. Do not change roles or grants merely to complete this test. No additional Nutrition Targets + Trends code repair is indicated by the maintained checks.


## Historical held validation — Nutrition Targets + Trends/Reports v1, 2026-10-04

Candidate `codex/staging` SHA `8c030118239528cd2ddbfccbfe32edc31c5dc245` contains all six requested commits. **Deployment held:** targets/trends are not loaded on open/date changes, private target/trend DOM is not cleared on client transitions, stale trend responses can replace current/closed views, date labels shift a day in Central time, and configured targets are silently capped at24. See [complete validation and reproduction contract](docs/NUTRITION_TARGETS_TRENDS_VALIDATION.md).

New maintained database tests37/37 pass. Full backend154pass +nine known agreement-origin fixture failures; frontend267pass/2stale Coach Review assertions/27historical skips; build309/syntax72; Edge25pass/19typechecks. Supplemental exact-built UI4pass/10fail; separate instrumented component diagnostics2pass/1cap failure. Nine responsive checks pass, with target rendering explicitly diagnostic because the normal loader is unreachable. Hosted staff remains pending.

Migration already applied to staging at ledger `20261004055612`, source/stored SQL MD5 `40f46ce425e50f9fca8131e12a6cdce4`; no replay. Methodology targets, client targets and diary rows all remain zero; The Living Diet stays draft. Scoped reads/writes, coach precedence, clear fallback and logged-day averages pass in isolated PostgreSQL17. Staging remains deploy `6ac1e6fd3020fcfb080bf7b7` with Review JS101/CSS119/Wellness JS118. Production deploy and20public fingerprints unchanged. Local changes are validation tests/docs only; no new commit/push or application/backend implementation changes. Next: narrow frontend repair before staging release.

## Current package — Coach Nutrition Review repair, 2026-10-04

The approved repair preserves the original five commits and the Chat date/null patches. [Coach Review contract and validation](docs/COACH_NUTRITION_REVIEW.md) supersedes the earlier coach-UI deferral below. Nutrition Review is now an independent private-health read section; existing Wellness management gates are unchanged. Client/date request ownership, immediate private DOM clearing, local-calendar controls, strict numeric display and full long-text wrapping are implemented.

Review source/exact-built tests22/22 and the original supplemental suite10/10 pass. The12 responsive normal/empty/denied/long-text checks pass at all three requested sizes with a clean console. Native tests also cover Wellness-management-only denial without changing the backend. Assets: Review JS101, Wellness CSS119 and unchanged Wellness JS118;309-file build. No migration or hosted nutrition write is included. Final release SHA/deploy ID/full regression totals and hosted staff limitation are recorded in the workspace `STAGING_COACH_NUTRITION_REPAIR_2026-10-04.md`, separately from source completion. Production remains outside scope.

Final local regression totals: frontend265 pass/0 fail/27 historical skips; native PostgreSQL17 backend117 pass/nine known agreement-origin fixture failures; Edge25 pass and19 entry points typechecked;72 JavaScript syntax checks pass.

## Current package — 2026-10-04 UTC

Nutrition Diary + Daily Targets v1 is implemented and validated on `codex/staging`, preserving the four approved commits through `15a247cba5f9fa3dca25490b2474cea0b3215b29` and the prior Recipe Builder release. See [package contract and verification](docs/NUTRITION_DIARY.md).

- **Applied database:** reviewed `20261004043000_nutrition_diary_daily_targets.sql` applied once to staging `bvooallokgfktssadsrv`; actual ledger version `20261004044342`. Stored SQL MD5 equals the reviewed file: `36c05958cffc0c4d3f75e816079949a6`. No earlier migration replayed.
- **Implemented:** shared-client Nutrition module, date navigation, seven meal groups, full numeric nutrient snapshots/totals, target hierarchy, published-only sources and seven-day actual intake. Existing Nutrition entitlement visibility preserved. Member JS 208, CSS 201, Nutrition module 1; 308-file build.
- **Tested:** 71 JS syntax checks; frontend 243 passed / 27 existing skips / zero failures; native PostgreSQL 17 backend 116 passed / nine known agreement onboarding-origin fixture failures; Edge 25 passed / 19 entry points typechecked. Diary: 28 database + 18 UI passed. Nutrition Engine / Content Builder / Recipe Builder + integrity: 26 passed (included in frontend totals).
- **Responsive fixture:** exact-built full member shell, empty and populated diaries at 1440×1000, 768×1024 and 390×844; no horizontal overflow or console warnings/errors. Navigation and bottom controls work.
- **Acceptance limits:** existing paid member's Nutrition entitlement is unavailable; no access was manufactured. Source inventory is empty and The Living Diet remains draft. Staff read RPC is complete; coach Nutrition Review drawer UI is deferred to a narrow follow-up.
- **Release boundary:** existing Netlify staging site `071b252e-a922-4846-a784-8dca1edad377` only. The workspace `STAGING_NUTRITION_DIARY_2026-10-04.md` records the deployment receipt, exact live hashes and final hosted acceptance separately. Source/test completion is not deployment evidence. Production is outside this authorization.

The dated sections below are historical snapshots; their original unknown-environment and “not deployed” statements do not supersede current staging release receipts. Next narrow package: read-only coach Nutrition Review UI, then hosted member acceptance once approved source publication and existing entitlement/session prerequisites are available without widening permissions.

## Historical build record

Updated 2026-09-27 UTC. **Staging preparation IMPLEMENTED and locally tested on `codex/staging`, based on lifecycle `feef92e1c0809cbd035edf35ebc70050d958b46b`; NOT DEPLOYED.**

## Repository and baseline

- Implementation: `eaglevisiondigital/revitalizedacademy`.
- Current branch extends verified `codex/backend-security-gate` commit `018c7441e318b6bde72d8001b796c7d587de7b61` and preserves that source recovery/security work.
- Observed production/source baseline remains Build 192, main `df8aba33cd8bac16e54aded92a4c99439f74f1d5`, Supabase `voalfpxiyznnqfcqcymd`; no fresh Netlify control-plane provenance has been supplied.
- Primary Chat approves policy/architecture. Work validates external environments. Codex implements and tests.

## Approved and implemented lifecycle

| Area | Implemented code | Verification / release limit |
|---|---|---|
| Onboarding | Additive `onboarding` state on existing client_access; existing membership foundation provisions before both gates complete | Real local database + synthetic browser tests; invitation claim required before exposing enrollment; hosted Auth verification/redirects require staging |
| Paid access | Shared actual-payment AND required-agreement gate; restrictive RLS over paid domains/Storage and checked Edge paths | Direct SQL bypass tests and active-owner/member positive cases pass; full production-data acceptance remains required |
| Independent adults | Primary/secondary roles each bind one distinct auth user; secure recipient-bound expiring invitation; immutable content hash | Wrong recipient, unverified email, known minor, expiry, revocation, stale hash, replay and overwrite cases pass |
| Payment reversal | Net recorded payment shortfall restricts active membership; repayment or authorized waiver reevaluates both gates | Partial refunds, reversals, voiding, concurrent refunds, retained history and non-resurrection of inactive accounts pass |
| Restricted surfaces | Existing billing/payment link, agreement signing/history, account email, relevant notices and support | New `/member/onboarding/`; v2 paid dashboard retained behind preflight |
| Notifications/audit | Existing outbox, member notifications, contact activity and manual override audit reused | No actual email/SMS or provider transaction was executed |
| Migration | `20260927020040_client_access_lifecycle.sql` follows `20260926212638_authorization_and_enrollment_gate.sql` | Both applied only to disposable local databases; neither applied remotely |

The three previous lifecycle product questions are resolved by the user's approved assignment. See [state machine, signer flow, RLS and release notes](docs/CLIENT_ACCESS_LIFECYCLE.md).

## Tests and advisors

**166 active automated tests pass:** 65 frontend, 85 PostgreSQL, 16 Edge. The original 106 cases remain, with the now-disallowed same-account/two-name expectation changed to denial. All 15 Edge entry points typecheck; 61 JavaScript files pass syntax checking. No configured compilation/lint command exists. Synthetic desktop/mobile layout was inspected. [Detailed evidence](docs/engineering/LIFECYCLE_TEST_RESULTS.md).

Local Supabase Security Advisor: zero findings. Local Performance Advisor: 8 pre-existing warnings (5 multiple-policy, 3 duplicate-index). Four existing identity-initplan warnings were corrected. Live read-only advisors still report leaked-password protection disabled and the original index/policy/connection findings. No hosted setting or index was changed.

## Preserved and unresolved

Public website, approved imagery/branding, initial assessment lead capture, adult/child questions, Netlify mirror behavior, 50-seat priority flow, six-month Foundations, export permission boundary and current bootstrap v2 are preserved. AI generation/native wearables/push are not newly connected or proven.

Still unknown: exact Netlify site/deploy mapping; approved hosted staging/Auth origins; original assessment approval files and scoring authority; live provider delivery and approved `client_onboarding` origin configuration; production-shaped performance. Source recovery remains a structure snapshot, not a full managed-platform/business-data backup. The earlier baseline reports are historical evidence, not current release certification.

## Next coherent package

Review this branch, reconcile genuine historical migrations and schema drift, and validate the complete database → Edge → frontend package in an explicitly approved non-production environment. Inventory legacy active accounts, historical same-account double signatures and incomplete ledger/waiver records before release; do not silently grandfather them or run a mass backfill. Confirm Auth redirects/verification/recovery, legal template seeds, notification delivery, and Netlify artifact exclusions. Obtain explicit production release authorization only after staging acceptance. No merge/deployment is authorized here.


## Isolated staging release package

Shared browser/build and Edge configuration replaces embedded production URLs/keys in every active caller. Explicit staging project/origin guards, runtime host checks, Netlify site/branch/context checks, synthetic payment boundary and recipient/notification isolation are implemented. Netlify tracked configuration now builds and publishes a 306-file dist allowlist, excluding backend/SQL/private/docs/test material; existing live hosting has not changed.

A fresh-project initializer restores the recovered baseline → security migration → lifecycle migration → private buckets/config/legal seeds, transactionally, with component hashes and no fabricated historical ledger. Actual original MK7/MK.1 PDFs and existing published merge-template bytes/hashes recovered into ignored local private storage. Five program definitions, three journeys/26 steps and permission configuration recovered without clients/prices/provider URLs. New staging-only constraints fix onboarding to its explicit origin and prohibit payment endpoints.

Local verification now totals **208 active cases** (90 frontend, 85 existing DB, 8 staged provisioning, 25 Edge); all prior 166 remain. All 15 Edge functions typecheck, 69 JS files pass syntax, local seeded advisors report 0 security findings / 8 existing performance warnings. See docs/engineering/STAGING_TEST_RESULTS.md and the final handoff for pushed-commit CI evidence.

**Unresolved:** no hosted staging project/site/Auth/SMTP configured; exact Netlify production provenance still unknown. Fresh hosted baseline compatibility and full business/entitlement/content/provider setup remain unverified. Seven outreach assets already missing. Read-only live program_agreement_requirements is empty; staging's Foundations→MK7 relation is a synthetic test fixture only. Primary Chat must confirm actual production mapping/legacy review before a production release.

**Next:** create the separate staging resources and follow docs/STAGING_RELEASE_RUNBOOK.md; Work executes docs/STAGING_ACCEPTANCE.md with synthetic accounts. No production release or merge is authorized. Earlier next-package paragraphs above describe the lifecycle handoff and are superseded by this staging preparation status.


## Home / Today vNext and dashboard resilience

**IMPLEMENTED on `codex/staging`, feature disabled by default; NOT DEPLOYED.**

- Home / Today vNext preserves `my_app_bootstrap_v2` and adds a reversible runtime flag: `feature_member_home_vnext`.
- Staging provisioning seeds the flag `false`. Production has no required activation change from this work.
- When enabled, the existing Needs Your Attention card incorporates `my_next_best_actions` rather than adding a duplicate priority module.
- A compact Up Next card uses `my_up_next`.
- Weekly Momentum can use `my_weekly_progress_story` with the existing v2 weekly summary as fallback.
- The additive vNext reads are explicitly nonfatal.
- Initial member-dashboard failures are now classified: only bootstrap, member dashboard identity/access, and entitlements are fatal. Optional feature modules log/degrade to their existing empty states.
- Weekly check-in supporting reads also fail locally rather than denying the whole dashboard.
- Health Score/Family Score formulas, AI generation, native wearable code, push-provider activation and assessment scoring remain excluded.
- See `docs/HOME_VNEXT.md`.

Current implementation commits:
- `9b058c9c25fecd614e815ad9f255e703d85a4e5b` Home / Today vNext
- `9a413efd63bc8480578dc55ff759531c577ef0d2` optional-module dashboard resilience

Hosted staging acceptance remains the release gate.


## 2026-09-27 — member experience vNext build wave

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED, production unchanged.**

Current member app still preserves `my_app_bootstrap_v2` as the core contract/fallback.

### Loading / resilience

- paid-access preflight remains first
- critical first-screen database wave is reduced to three reads:
  - `my_app_bootstrap_v2`
  - `my_member_dashboard`
  - `my_member_entitlements`
- journey and feature enrichments load after first paint
- lower-priority modules load through sequence-guarded deferred reads
- optional feature failures degrade locally rather than denying the entire dashboard
- signout reloads the member page to clear rendered private state between users

### Home / Today vNext

Default-off runtime flag:
`feature_member_home_vnext`

Adds:
- backend-driven priorities via `my_next_best_actions`
- compact Up Next via `my_up_next`
- richer weekly progress story via `my_weekly_progress_story`

The existing v2 Today and attention behavior remains the fallback.

### Progress vNext

Default-off runtime flag:
`feature_member_progress_vnext`

Adds:
- deterministic goal progress
- achievements
- descriptive 30-day progress insights

No Health Score, medical interpretation, or invented completion is introduced.

### Progress Photos vNext Phase 1

Default-off runtime flag:
`feature_member_progress_photos_vnext`

Viewing only:
- member-scoped photo sets/photos
- private `progress-photos` bucket
- 5-minute signed URLs
- no `getPublicUrl`
- no raw Storage path rendered to the member
- no upload/delete flow yet

Upload remains intentionally deferred until Storage + database writes have an atomic or compensating workflow.

### Coaching Hub vNext

Default-off runtime flag:
`feature_member_coaching_vnext`

Enriches the existing Coaching Hub with deterministic `my_coaching_momentum` context:
- 7-day plan completion
- planned/full days
- last check-in/progress timestamps
- active/overdue goals
- momentum state

No duplicate coaching dashboard and no medical/AI interpretation.

### Family Hub vNext

Default-off runtime flag:
`feature_member_family_vnext`

Adds the 14-day non-health family schedule from `my_family_calendar_summary`.

Explicitly excludes:
- family/member health scores
- `my_family_progress_dashboard`
- `my_family_dashboard_summary_v2`
- `my_family_wellness_summary`
- raw adult health data

### Privacy Center vNext

Default-off runtime flag:
`feature_member_privacy_center`

Inside My Account:
- connected provider visibility
- provider disconnect
- data-export request
- health-data removal request
- account-deletion request
- correction/other privacy request
- request history/status

No direct destructive browser action and no private export Storage path exposure.

Current backend privacy request access is active-member scoped. Restricted/former-member privacy access remains a future explicit lifecycle decision.

### My Calendar vNext

Default-off runtime flag:
`feature_member_calendar_vnext`

Adds a unified next-30-day member calendar using `my_calendar_feed_60d`.

Member-facing fields are limited to:
- type
- title
- status
- date/time
- safe location URL

Embedded backend metadata is not surfaced.

### Notification Settings vNext

Upgrades the existing settings form in place:
- quiet hours
- quiet-hour start/end
- member IANA time zone
- save via `update_my_notification_preferences` RPC

Existing in-app/email/SMS controls remain.

Push preference UI remains intentionally hidden until the push update contract and hosted delivery are proven.

### Ask ReVitalized member feedback

Connects the existing feedback backend to answered/resolved responses:
- Helpful
- Needs Review
- backend-approved reason
- optional comment

Uses `my_companion_feedback` and `submit_my_companion_feedback`.

Negative feedback continues into the existing quality/human-review workflow. Generation/safety behavior is unchanged.

### Health Trends vNext

Default-off runtime flag:
`feature_member_health_trends_vnext`

Biometrics-gated descriptive trend visualization:
- up to four recent numeric metrics
- latest value/unit
- 30-day sparkline
- absolute change
- latest timestamp

Uses `my_health_dashboard_cards_30d` and `get_my_health_metric_trend`.

No Health Score, Family Health Score, diagnosis, treatment language, or good/bad interpretation.

### Current release posture

All work above remains staging-branch implementation only.

Do not enable any default-off vNext flag in production before isolated hosted staging acceptance.

The production lifecycle/security migrations remain unapplied and production remains Build 192.


## Member document upload hardening

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

The existing secure document vault UI now writes through `member-document-upload` instead of performing browser-side database-first + Storage upload.

The Edge function:
- validates environment/origin
- authenticates the caller
- requires full paid member access
- resolves the member contact/membership server-side
- limits member categories to general/progress
- validates 25 MB maximum
- validates supported MIME/file signatures
- uses contact-scoped private Storage paths
- uses client-generated UUID idempotency
- cleans up both Storage and the database row on partial failure

Because the member frontend now depends on this Edge function, it is part of required staging deployment sequencing before member acceptance.


## Lifecycle-safe member support

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

A new required Edge function `member-support` reuses the existing private messaging tables and `support` conversation type.

Support is available to authenticated client-access states:
- ready
- invited
- onboarding
- active
- payment_suspended

It is not enabled by default for manually suspended or inactive accounts.

This endpoint intentionally does not call `member_paid_access_allowed()`; support remains available without reopening paid member features.

The Enrollment & Signature Center now contains a private Support Center for eligible restricted/active users, and the active member Messages area has a Contact Support action. Both use the same contact-scoped support conversation.

Support conversation creation is deterministic/idempotent and support-message sends use idempotent request UUIDs.


## Message attachment upload hardening

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

Private message attachments now write through required Edge function `member-message-attachment-upload`.

The handler:
- validates environment/origin and caller authentication
- verifies the caller owns the target message
- verifies active conversation participation
- enforces the existing 10 MB private-bucket limit
- validates the existing MIME allowlist and file signatures
- uses conversation/message scoped private Storage paths
- uses client-generated UUID attachment IDs for idempotency
- removes a newly uploaded object if the attachment database row fails

The browser no longer writes message attachments directly to Storage/database and retries one transient failure with the same attachment UUID.


## Restricted Privacy Center lifecycle access

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

Forward migration:
`20260928064500_privacy_lifecycle_access.sql`

The Privacy Center database/view/RPC access boundary now includes:
- ready
- invited
- onboarding
- active
- payment_suspended

This does not alter `member_paid_access_allowed()` and does not relax paid-domain RLS.

Enrollment & Signature Center now exposes a restricted Privacy & Data section for eligible authenticated accounts:
- data-export request
- health-data removal request
- account-deletion request
- correction/other privacy request
- request history
- read-only connected-provider context
- ready export download through a 5-minute signed URL

Provider disconnect remains excluded from the restricted surface pending separate hardening of the health-connection/consent write path.

Lifecycle regression coverage verifies onboarding and payment-suspended privacy access while paid features stay denied, and verifies manually inactive accounts cannot open the Privacy Center or submit new privacy requests.


## Health provider disconnect hardening

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

Forward migration:
`20260928071500_health_provider_disconnect_hardening.sql`

The existing full-member provider disconnect RPC is now a narrowly scoped `SECURITY DEFINER` function that:
- requires authenticated full member access
- resolves only the caller's own active contact
- clears credential reference and granted scopes only for the selected own provider
- revokes only the caller's metric consents for that provider
- leaves stored historical health observations intact
- denies payment-suspended and unrelated identities

Backend regression coverage verifies active own-provider disconnect, consent revocation, payment-suspended denial, and cross-user denial.

This hardening does not certify or activate native HealthKit, Health Connect, Fitbit, Garmin, Oura, Withings or other provider connectivity.


## Idempotent member message sending

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

The active member messaging composer now uses client-generated UUID message IDs.

Retry behavior:
- the same pending message UUID is reused after a transient/lost response
- a duplicate UUID is accepted only if sender, conversation and body match exactly
- body edits generate a new message UUID
- an optional attachment preserves its own stable UUID across retries
- pending message/attachment identities clear only after full success or modal close
- the Send button is disabled during the active send

This complements the existing `member-message-attachment-upload` hardening so both the text message and optional attachment are retry-safe without duplicate records/files.


## Progress and weekly check-in retry safety

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

Manual progress entry now:
- generates an explicit UUID row ID
- preserves that ID and recorded timestamp across retry of the same metric/value/note payload
- verifies any duplicate UUID belongs to the same member data before treating it as replay success
- rejects retry identity conflicts visibly
- clears pending retry state after success or fresh dashboard load

Weekly check-in keeps the existing database unique index on contact/template/period as its duplicate guard. A duplicate-week retry is now treated as success only when the existing submitted response set matches the current response set after deterministic key normalization. Different answers remain a visible already-submitted conflict.

Both forms disable submit while the write is active.


## Idempotent goal and habit creation

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

Forward migration:
`20260928084500_goal_habit_idempotency.sql`

New RPCs:
- `create_my_goal_idempotent`
- `create_my_habit_idempotent`

Both:
- require full paid member access
- accept a client-generated request UUID used as the row primary key
- return the existing row on exact replay
- reject UUID reuse with changed payload
- preserve the existing validation/contact/membership behavior

The member Goal and Habit forms now retain request UUIDs through failed retries, generate a new UUID when the payload changes, disable submit while active, and clear retry state on success/modal close.

The original legacy goal/habit RPCs remain present for compatibility.
