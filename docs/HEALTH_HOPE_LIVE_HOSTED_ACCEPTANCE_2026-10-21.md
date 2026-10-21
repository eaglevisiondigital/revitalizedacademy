# Health & Hope Live — Zoom acceptance passed; narrow database repair pending

October 21, 2026. Isolated branch `codex/health-hope-live`. Public registration remains **HELD**. Existing one-inbox acceptance authorization persists; the additional migration below has **not** been applied or authorized.

## COMPLETED

The owner reported **Host Ready**, approved Zoom's displayed joining terms at the point of acceptance, admitted **HHL QA – Synthetic**, and then confirmed the test meeting ended for the separate early-entry check. Actual browser results:

| Joining requirement | Observed result |
| --- | --- |
| Supplied meeting `82516112925` / complete attendee URL | PASS, correct recurring topic |
| Guest entry without a Zoom account | PASS, synthetic name only; no sign-in |
| No unexpected passcode | PASS, none requested |
| Waiting Room with host present | PASS, host-present waiting message; entry blocked pending admission |
| Host admission | PASS, guest entered with Justyn Oliver present |
| No joining before host starts | PASS, second attempt after host ended showed waiting-for-host and did not enter |
| Guest media and exit | Camera/microphone permission declined; no screen sharing; guest left/exited both attempts and temporary Zoom tab closed |

No Zoom account setting, AI/transcription, recording, registration or automated attendance feature was enabled. The technical test was requested unrecorded and creates no Thursday attendance credit. A license/reporting entitlement or the three-hour duration claim was not independently tested. Manual attendance remains the approved initial approach. [Waiting Room](health-hope-live-zoom-acceptance-2026-10-21/waiting-room.jpg) and [blocked early entry](health-hope-live-zoom-acceptance-2026-10-21/waiting-for-host.jpg) are saved; the host-camera admission still is private local evidence outside Git/deployment assets.

Owner then confirmed Justyn's capability and responsibility to manage new HHL cloud/local recording copies/backups, saved chat/report exports and verified privacy requests by the approved twelve-month deadline. Separate Zoom diagnostic retention was explicitly disclosed. This is **owner-confirmed operational evidence**, not a claim that old recordings were inspected/deleted or that provider diagnostics follow the CRM purge. Resend's standard thirty-day retention and early-deletion/request-assistance procedure remain documented. No historic recording or actual participant data was deleted.

## CHANGED / CONTROLLED HOSTED PREPARATION

Fresh production reconciliation found the separately approved Founders release `6ad8bfbac855ac61228bb070`, source `3fee66773483ab3245f5efd734a26879e6a15336`. Relative to the previous HHL installation, only `/founders.html`, `/css/founders103.css` changed and two font/license paths were added. All thirteen Function hashes/schedules were exact. The controlled runtime retained **all 452 current file digests and thirteen existing archives**, current build settings, beta deployment and publication lock; no branch-wide build or stale website restore was used.

The genuine normal Owner session reviewed/published October 29 at 18:30 America/New_York privately, producing revision **2** and its real `session-save` actor audit. That audit, rather than an arbitrary metadata-selected owner, bound the one thirty-minute acceptance case to the existing authorized operator. No October 22/earlier session exists; eleven later Thursdays remain drafts. Public runtime registration and Zoom stayed false. The staff page displayed only `dave@theboss.biz`, October 29 and the pinned window; marketing was off. No registration was submitted.

The existing verified Resend sender/Reply-To, restricted secret metadata and available quota were checked. Only the event's existing five-event signed feedback hook was temporarily enabled, then disabled again. No secret value was printed or saved, no credential was replaced, and no other provider configuration changed.

## PRECISE BLOCKER / SECURITY HOLD

Before submission, the independent retention worker failed to advance its heartbeat. Actual scheduled invocations failed with `event_request_unavailable`; a bounded service-role REST diagnostic exposed **HTTP 400 / SQLSTATE 21000: `UPDATE requires a WHERE clause`**. A direct administrative SQL maintenance call had returned zero erased records, but did not exercise the REST connection's safety guard. It was not substituted for a successful scheduled heartbeat.

The affected code contains three unconditional singleton-settings updates in exactly two existing event functions. The guard is working as intended; it must remain enabled. The dependent registration/email test was stopped, as required by the owner's failed-prerequisite restriction.

Final published forward hold: **`6ad8d01637b3964dd9501ffa`**, retained source **`3fee66773483ab3245f5efd734a26879e6a15336`**. All 452 file digests, thirteen Function archives/configuration/schedules and Founders restoration remain exact. All six event runtime enablement flags are false, seven runtime test pins blank, DB case null, DB collection/notification/Zoom/retention flags false, stale heartbeat cleared, and the event feedback hook disabled. Provider-policy confirmation is retained. Public sessions are empty and anonymous registration returns **503 `registration_held`**. No test CRM contact, registration, job or email exists. No runtime schema/permission change or migration replay occurred.

## LOCAL REPAIR / TESTED

Prepared **one unapplied forward migration**: [20261021144712_health_hope_live_safe_updates.sql](../supabase/migrations/20261021144712_health_hope_live_safe_updates.sql), SHA-256 **`4799e7565458b36a33db5fefe73958d240f76441378a130f409d4f49a7156066`** (2,795 bytes).

It adds `WHERE singleton` to two settings updates in `private.hhl_maintain()` and one in `private.hhl_staff_guest_core(text,jsonb)`. Existing source fingerprints must match before changes. Repeating a matching repair is safe; unexpected function drift aborts. It explicitly verifies unchanged owners, EXECUTE ACLs, SECURITY DEFINER state and function configuration. No table, role, policy, grant, shared CRM/health routine, Function archive or frontend asset changes. The original four migrations remain byte-identical and installed exactly once.

**Six new targeted PostgreSQL 17 tests PASS**, with the actual upstream `pg-safeupdate` C library, pinned to commit `37dbc9c4acf5e2504adf2b218e9c6b41751022f3`. An isolated pre-repair service-role call reproduces the exact hosted error. After the repair, tests cover maintenance with the guard on; authorized controls and denied restricted staff; expiry/provider-overdue hold with master-contact preservation; deduplicated Registered Guests and confirmation-only claim; repeat safety; and rejection of unexpected source drift. Service role cannot disable the guard. Only synthetic setup uses guard-off locally; each exercised command runs guard-on. No production guard setting was changed.

All **319 pre-existing shared function definitions**, existing table RLS/policies/ACLs/ownership and local global roles are preserved. The disposable database and temporary compiled-guard workspace were removed. [Exact test log](health-hope-live-zoom-acceptance-2026-10-21/safeupdate-tests.log), [pinned dependency evidence](health-hope-live-zoom-acceptance-2026-10-21/safeupdate-test-dependency.json), [sanitized overall status](health-hope-live-zoom-acceptance-2026-10-21/status.json). Completed browser/regression suites were not rerun; no website behavior/design change requires them in this repair. Hosted REST/scheduled acceptance of the repair remains pending production scope approval.

## DOCUMENTATION / UNRESOLVED / NEXT RECOMMENDED BUILD

Updated current build, security, architecture and decisions; added the narrow migration, focused test-runner option/tests and complete stage/hold evidence. Roadmap, Founders, health records/permissions, payments and unrelated systems are protected. No push occurred. Original frozen approval artifacts and earlier evidence are unchanged.

The smallest additional approval is **only this new migration**, followed by resuming the already-authorized controlled acceptance. The owner originally approved four exact migrations and prohibited additional scope; that does not cover this fifth file. Do not apply it under the earlier authority or disable the safety guard. After approval: fresh source/ledger/security preflight; apply only version `20261021144712` once; verify the real scheduled retention heartbeat; pin a fresh case and identical protected runtime values; perform exactly one registration/confirmation to the nominated inbox; verify CRM/session/delivery/inbox/join instructions and scoped export/deletion cleanup; return to the hold. A new migration/Function/publication scope requires further approval if these checks uncover another defect.

**Copy-ready approval:** Approve applying only `20261021144712_health_hope_live_safe_updates.sql`, SHA-256 `4799e7565458b36a33db5fefe73958d240f76441378a130f409d4f49a7156066`, updating the two named HHL functions without changing permissions or disabling the safeguard. Then resume the previously authorized single-inbox controlled acceptance, preserving the current production manifest/Founders/Roadmap and keeping public registration and automated Zoom disabled. No replay of the original four migrations and no additional recipient/message are authorized. Public activation remains separately reserved.

## CHAT HANDOFF

Zoom guest URL/account/passcode/Waiting Room/admission/before-host checks now PASS and synthetic guest exited. Provider operational responsibility is owner-confirmed. Real controlled acceptance exposed a hosted WHERE-clause safety failure before any guest/contact/job/email. Final full-hold deployment is `6ad8d01637b3964dd9501ffa`, preserving source `3fee667`, all 452 static paths and thirteen Functions. One local forward repair adds three singleton predicates across two HHL functions; six real-guard tests pass, shared security preserved. Need exact fifth-migration scope approval above, then finish the existing one-inbox acceptance. Public registration remains disabled and needs later separate approval.
