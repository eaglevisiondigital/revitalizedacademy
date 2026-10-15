# Phase B1 — Secure Roadmap preparation foundation

Status: implemented and accepted as an isolated staging foundation; approval, release and sending remain held. Started from main `a428b565c075a3890744c9e1d80b8186829cf28a`. PR #20 was reviewed for editorial direction only; no fictional scores, diagnoses or invented recommendations were imported.

## Implemented

- Extends Staff Portal → People → Vitality Roadmaps with a preparation queue, existing completed source review, structured editor, clarification state, reviewer notes, evidence question keys/rationale and all twelve approved Drivers.
- Reuses `vitality_reports`, existing Contacts/Auth and private secure assessment snapshots. No second assessment or paid-member identity system.
- Every save/status/regeneration appends a version and reasoned audit; original source remains read-only. Monotonic versions, report-level locking, optimistic conflicts and request-content-bound idempotency prevent silent overwrites. Saved versions can be previewed separately.
- Staff reads require a verified current Auth session, `health.private.view`, `crm.view` and contact scope. Draft writes additionally require Owner/Admin and `health.progress.manage`. No permission/default grants were made.
- Actual Justyn and Elle beta Auth/staff rows were verified: confirmed email, active Owner, complete onboarding, All People, private-health and health-progress permissions. Their separate user IDs are resolved into the private final-approver registry by verified email, never hardcoded UUIDs or user metadata.
- Approval endpoint always refuses final approval; INSERT trigger also blocks any approved/released version or populated approval/scoring snapshot. No runtime flag bypass. Future enabling requires separately reviewed migration and founder/security approval.
- Free `/member/roadmap/` workspace reuses Supabase Auth. Exact normalized verified-email claim reuses a single existing adult/self contact and completed assessment; ambiguous/proxy/unverified/revoked/mismatched claims fail closed. Claim mapping/audit is separate from membership.
- Recipient reads return only released, approved immutable versions through a strict public-content whitelist, excluding reviewer notes, clarification, evidence IDs and raw answers. Auth session, bans, ownership and access revocation are checked server-side. Paid coaching cancellation does not revoke free report access.
- Interactive view and print-to-PDF use the same version document/checksum. All twelve Drivers print even when a tab/search hides them on screen. No public storage bucket or sensitive email attachment.
- Pure, deterministic report-ready notification model prepared with authenticated account link, version idempotency and `delivery=held`. No provider/queue/send integration exists in B1. Existing-account claim works; new-account setup-email acceptance remains pending.

## Staging deployment and migrations

Unpublished manual preview on existing staging Netlify site `071b252e-a922-4846-a784-8dca1edad377`:

- Deploy: `6ad0d7d4bcb0854a53e2911a`
- Staff: https://roadmap-b1--revitalizedacademy-staging.netlify.app/portal/
- Free workspace: https://roadmap-b1--revitalizedacademy-staging.netlify.app/member/roadmap/
- Accepted beta primary deploy remains `6acc33161511aa93c289bbcc`.
- Production deploy observed before work: `6ad0027282b2138262e70154`; no production deploy/migration/Edge/mail mutation performed.

Forward SQL lives exclusively in `supabase/environment-migrations/beta/`, outside the production replay directory:

| Source migration | Applied staging ledger |
| --- | --- |
| `20261015124333_vitality_roadmap_b1_review_delivery_staging_only.sql` | `20261015125851` |
| `20261015134236_vitality_roadmap_b1_staging_source_review_dependency.sql` | `20261015134411` |
| `20261015134650_vitality_roadmap_b1_optional_source_metadata.sql` | `20261015134741` |

The inspected October 14 foundation was not replayed. Hosted testing found beta lacked the production source-review APIs and optional referral columns. Forward compatibility migrations install only the accepted read helpers/read RPCs plus empty protected historical metadata storage. Optional fields use `to_jsonb`; no contact schema changes, historical import APIs or production data copies. These hosted defects were reproduced, corrected and retested. Never replay any of the above on staging.

## Verification

- Production build: 395 files; B1 staging build: 180 files. Production manifest excludes B1 routes/modules; one existing source module gains only a local extension event.
- JavaScript syntax: 83 files passed.
- Maintained frontend/session/environment/content/pricing/Vitality suites: 145 passed; one final-submit test hit the initial 15-second harness limit, then passed alone with a 90-second limit (10.6 seconds). Effective result: 146 passed, no unresolved maintained-suite failure.
- B1 notification/isolation unit tests: 3 passed.
- PostgreSQL 17: 24 unchanged assessment-review regressions plus 23 B1 security/data-integrity tests passed. B1 tests also mirror beta's absent optional referral columns.
- Exact-built Chromium and WebKit: 71 checks passed at 1440×1000, 768×1024 and 390×844. Editor, all twelve Drivers, save, preview, account transition, late-response suppression, logout clearing, responsive overflow and zero warnings/errors covered. Synthetic PDF generated and first page visually inspected using PDF skill.
- Hosted staging rollback suite passed: authorized save, version history, retry idempotency, conflict denial, verified claim, draft privacy, wrong-contact denial, revoked-session denial, anonymous denial and table denial. Final counts: 0 versions, 0 claims, 0 claim audits, 2 designated founders. No synthetic fixture remains.
- User signed into isolated preview normally as existing staging Owner. Live queue, synthetic source editor and twelve-Driver unscored preview opened; final approval disabled. Existing synthetic assessment was not edited/saved. Free workspace restored same Auth account, showed no released reports/drafts; both consoles had zero warnings/errors.
- Seven live assets returned HTTP 200 and matched exact built SHA-256 hashes.
- An exploratory sweep of old package-specific integrity scripts is not a full-suite acceptance: several depend on retired website ZIP fixtures/hashes and generated datasets. No unrelated code changed to satisfy them. The maintained suites listed above were run separately.

Local commands: `npm run build:roadmap-b1:staging`, `npm run test:roadmap-b1`, `npm run test:roadmap-b1:database`, `npm run test:roadmap-b1:browser`. Install declared dev dependencies; browser harness accepts `RVA_PLAYWRIGHT_PATH`. Database harness requires PostgreSQL 17 on localhost:55449 and the repository's existing adjacent schema baseline/platform fixture (same convention as current production harnesses). It creates/drops a disposable `rva_gate_*` database. Released fixture is fictional and local-only, seeded before B1's hard gate, never a runtime release bypass.

## Production read-only aggregate audit — October 15

- 15 completed workflows; 20 in progress. Eleven completed secure snapshots, fourteen draft secure snapshots. Fifteen distinct-contact `awaiting_review` report placeholders, all matched to completed workflows, zero approved/sent/PDF-backed reports.
- Eleven completed secure sources: explicit Adult/Myself, snapshot version 1. Minimum 169 recorded field keys. All twelve Driver sections contain some nonblank mapped answers in all eleven sources (170-key current adult catalog inspected); this does not establish valid calculation coverage.
- Four historical sources: Adult/Myself with summaries, without detailed question coverage through the current review contract. Manual clarification/provenance review needed.
- Missing calculation-input readiness cannot be established until founder-required question mappings, weights, thresholds, missingness rules and interpretation versions are approved. No defaults/zero substitution, recalculation, release or bulk backfill performed.
- No production answers, identifying rows or raw submissions were exported to source, tests or logs. Audit outputs are counts/coverage metadata only.

## Security posture and pending gates

Advisors retain pre-existing unrelated findings (four definer family views, existing anonymous contract RPC warning, password-protection recommendation). New direct-access-denied/RLS private tables intentionally have no browser policies. Authenticated definer-RPC advisories are expected for the explicitly checked API boundary; not a claim that the whole project is free of advisories. No unrelated security configuration changed.

Pending: founder scoring formulas/stages and adult source mapping; historical/child/proxy handling; reviewed interpretation library/provenance; privacy/retention/SOP and notification wording; new-account email setup and real recipient released-version/PDF delivery acceptance. No production rollout or real report email is authorized by this staging package.

Next package: B2 — founder-approved adult scoring/coverage contract with de-identified expected-output cases and versioned interpretation evidence. Keep approval/release held while implementing and testing it. Then separately validate recipient account setup, immutable released-version/PDF parity and idempotent notification delivery before proposing production migration.
