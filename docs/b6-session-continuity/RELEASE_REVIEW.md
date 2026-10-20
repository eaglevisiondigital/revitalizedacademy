# B6 retained-consent / current-session continuity repair

Local isolated branch `codex/b6-session-continuity-reconciled`, directly from current production source `7403a4ff20895200e2655745181f37b5ef7d5c7b`. It reuses the reviewed repair `1b305bd03ee849c6da6aabd218c641f61fe70a4b`. Last verified canonical deploy: `6ad7baf2e7b6f17c96d9dc78`. No push, hosted migration, deployment, feature activation, participant-answer retrieval, consent change, grant, job or draft was performed. Founder access 5/5 remains accepted; it was not repeated.

See `RECONCILIATION.md` for the current 447-path baseline, source-versus-live exclusions, fresh production read-only checks and reconciliation tests. The following repair remains unchanged.

## Root cause and narrow correction

The original consent session was treated as ongoing authorization in `private.roadmap_b6_set_pilot`, the issuing-purpose branch of `private.roadmap_b6_context`, and the personal-purpose/session comparisons in `public.roadmap_b6`. The public retry condition also required the original session, which could create another consent event after a normal sign-in. A direct dependency, `private.roadmap_b42_operator_plan`, likewise rejected durable identity/SOP verification after its recorded session ended. Exact deployed function-body hashes matched the reviewed original source before authoring this repair.

Consent and identity/SOP records now remain immutable provenance. They are valid only while their exact founder identity, latest active decision, seven explicit statements, source fingerprint, B5 sequence, current version pins, source eligibility, permissions, cohort and SOP/window checks pass. No historical row is backfilled, updated, deleted or re-dated.

A separate private append-only `roadmap_b6_session_confirmations` table records the authenticated source-specific request using the current JWT session. Its key is original purpose sequence plus current session ID; retries cannot duplicate it. Confirmation is bounded by the current session, B5 and SOP deadlines and contains no answers. It grants no permissions. Anonymous, application and service roles cannot read/write this table or execute its four private helpers. RLS is enabled, no browser policy is added, and update/delete/truncate are denied.

The existing authenticated B6 list/overview request verifies the genuine caller and confirms only that caller's retained consent. **Justyn can sign in normally and open Assessment Calibration; he does not repeat the seven statements.** Merely creating a new Auth session does not grant operator authority. A privileged B6 activation must find the separate current confirmation and revalidate it. Elle still needs her own consent and current authentication. Invalid/revoked consent, changed versions/source, expired authorization, denied roles and missing current sessions fail closed.

`private.roadmap_processing_set_grant` additionally validates retained B6 consent for the issuer and storage founder, locks/rechecks the storage founder's session and independently validates/locks the current Owner/Admin operator. Separate storage-purpose consent, feedback authority, source-specific processing grants and atomic-batch controls remain mandatory. Storage-purpose session semantics were not changed. Session deletion/role changes serialize with activation; a logout committed first denies activation without partial grants.

## Exact release boundary

One forward migration: `supabase/environment-migrations/production/20261020184635_roadmap_b6_session_continuity.sql`.

SQL SHA256: `2d4b5d1a306d699f2c325c8e7844f801f92cec5336fab196fe41921e7f0f072d`.

It guards five exact existing function bodies, creates one empty private audit table/four helpers, and replaces only the five reviewed functions named above. Existing owners, ACLs and empty search paths are preserved. No Auth roles, permissions, purpose rows, source rows, grants or feature settings are seeded or modified.

Two static updates: `/portal/index.html` (calibration reference v103) and `/portal/portal-roadmap-calibration.js` (clear retained-consent/current-session messages). The offline digest overlay preserves 445 other paths, the opaque historical configuration and **all ten existing Function archives byte-for-byte**. No Function source, archive, runtime, route, configuration, environment or payment schedule changes. Full build is a local regression check; it is not a replacement production deployment manifest. `ARTIFACT_HASHES.json` records exact static, SQL, rollback and ten archive hashes. The finalized external release package records the local commit SHA without a circular self-hash.

## Validation

- Native PostgreSQL 17.11: 191 tests, all passed (14 new post-migration continuity/security/preservation tests plus maintained B4/B4.2/B5/B6, processing/scope, intake/resume and client-lifecycle regressions).
- Eight simultaneous native database sessions: two overlap groups for status confirmation and identical consent retries; one confirmation per new session, one unchanged consent event. Concurrent logout/activation denies with zero partial grants.
- Maintained browser suite reused after the new migration and deletion of the original consent/identity session: Chromium and WebKit at 1440, 768 and 390px, 192 checks; zero warnings/errors, overflow or downloads. Read/revocation, stale response, account transition, refresh, logout and denied-source behavior retained. Native transport uses fictional local database identities, not hosted sessions.
- Original byte-identical UI’s retained offline acknowledgment/error evidence: 186 checks across the same six combinations. Expected deliberately injected transport failures are separately counted; zero unexpected console errors. All seven statements, missing statements, network failure/lost response, repeated clicks, denied roles and expired/stale frontend sessions covered.
- Reconciled Node backend/frontend/session and Health & Hope regressions: 83 existing checks passed plus 6 new release guards (89 unique tests). One new guard initially referenced a nonexistent payment filename; only that local fixture reference was corrected and all six guards passed. Static production build, 743-field/pin drift guards, archive/digest overlay and rollback checks passed.
- Original consent JSON hash/count, source hashes, append-only history, unchanged function definitions/ACL/ownership and all five false controls are checked with fictional sources. Actual consent records were not read or modified by tests.

Fresh Health & Hope synthetic browser regressions: 282 checks across Chromium/WebKit at the same six viewports, zero application errors or actual external requests. Registration/provider requests were intercepted fictional tests; no hosted activity.

The original local cluster bootstrap hit macOS shared-memory exhaustion. Tests used the existing developer PostgreSQL 17 service and disposable `rva_gate_*` databases instead; no existing cluster was stopped or replaced. A missing non-personal baseline permission-catalog fixture and a browser-test SQL-role race were corrected in the new harness; initial failure evidence is retained. No application/security check was suppressed.

## Release sequence — separate exact authorization required

1. Recheck source/clean tree, exact SQL hash, live locked baseline, schema/ledger/dependency/owner/ACL hashes and the preserved archive manifest. Stop on drift. Never replay any existing migration.
2. Approve the exact local SHA push and this one held forward migration to `voalfpxiyznnqfcqcymd`. Verify no existing source, consent, permission, key or control changes and zero added confirmations until genuine authenticated requests occur. All five controls remain false.
3. Approve one unpublished static-only production-context candidate on Netlify site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`: two static updates, 445 preserved paths, all ten exact archives retained without rebuilding. Validate all hashes/configuration/schedule, expected preview-origin denials and no private-state exposure. Keep lock and canonical alias unchanged. Genuine founder authentication requires canonical origin; do not weaken it for a preview.
4. Request separate approval of the exact verified candidate before promotion. Canonical acceptance: approved assets/v103; genuine founder normal sign-in and existing B6 list confirms retained consent without a new purpose event; old purpose/session/timestamp/consent hash unchanged; other-founder/non-founder/anonymous/source isolation/refresh/logout denial; correct storage/operator hold; all five controls false; four sources untouched; zero processing.
5. Only then revisit the **already recorded conditional three-source activation authorization**. It remains applicable to the same three exact sources and scope, not to this technical migration/deployment. Reverify live founder/operator sessions, source pins, existing B6, personal storage acknowledgment, separate feedback authority, inactive key/config, exact source grants and SOP windows. Do not request repeat B6 consent or extend the deadline. No later than `2026-10-22T13:45:00Z` (October22 08:45 Central). An expired SOP requires its established renewal process. The fourth source remains excluded. No export, approval, delivery or email is authorized.

## Rollback and limitations

Before any hosted action, retain current locked deploy and exact ten archives; verify the offline rollback digest against it. A migration preflight failure rolls back the entire transaction. For an already installed but faulty repair, keep controls held and restore only the five exact prior function definitions using `rollback-functions.sql` under explicit operator authority. Retain the new private audit table, all original consents, confirmations and immutable source records. Restore the prior static assets by the existing narrow manual release procedure, preserving all ten archives/configuration/lock. Do not drop/replay old migrations or delete audit evidence. Rollback safely restores the earlier fail-closed continuity restriction, not automatic processing.

This repair does not calculate participant scores. The saved-answer adapter still yields zero complete numeric Drivers and does not justify a numerical aggregate/Spectrum. No real draft was generated. Existing three-source report/processing and export limitations remain unchanged.
