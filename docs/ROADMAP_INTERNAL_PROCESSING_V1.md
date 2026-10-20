> Current unreleased local follow-up: [three-source package](ROADMAP_THREE_SOURCE_DRAFT_PACKAGE.md) preserves this pipeline and replaces its original broad sealing credential design. Historical implementation notes below are retained; no production change is implied.

# Vitality Roadmap internal processing v1 — local engineering candidate

## Outcome and scope

The isolated `codex/roadmap-internal-processing-v1` branch extends the deployed PR #51/B6 source, starting at local preservation/audit commit `1f9611da64dacee31b0de389ef985ba108b123c1`. It does not replace the platform or the B2.1 model. No remote push, deployment, hosted migration, participant processing, export, message or permission activation was performed for this package.

Implemented path:

`private questionnaire completion → metadata-only source-pinned queue → genuinely authenticated founder worker → server-sealed immutable 12-Driver evidence draft → cited founder proposals → regeneration/new immutable version → all-Driver internal review approval`

Client visibility, external delivery, email and real-source PDF remain held, including after internal approval. There is deliberately no client-read, release, send, adopt-rule or public-dataset action.

## Reused architecture

- The current secure `vitality_resume_command` / `private.vitality_command` save, resume, prepare/finalize and completion flow, unchanged.
- B4 cohort, exact source fingerprint, private immutable trigger, verified Adult/Myself read interface and source/contact/workflow separation.
- B4.2 authenticated identity verification, original session, independent identifier/date, SOP, revocation owner/backup and source eligibility checks.
- B5 source-specific pilot and B6 personal experimental-purpose/session/operator controls, unchanged. New processing never makes these optional.
- Existing strict B6 adapter, 743-field current-questionnaire reference, B2.1 formulas, all locked Driver weights, Budgeting separation and known founder calibration discrepancy.
- Approved `vitality-roadmap-view.js` and emerald/cream/gold report stylesheet, unchanged.
- Existing nine Function entrypoints and three shared payment modules, production configuration, worker schedule, NDA, payments and beta source, unchanged.

B1's version/delivery foundation is staging-specific. B4's existing draft schema and pilot explicitly remain read-only. This package therefore adds separately permissioned **internal processing versions**, rather than repurposing B4 drafts, copying beta schemas into production or widening old grants.

## Queue and processing contract

Forward candidate: `supabase/environment-migrations/production/20261019180611_roadmap_internal_processing_v1.sql`. Generated through `supabase migration new`, not applied hosted.

Eight private RLS tables: controls, purposes, grants, jobs, versions, reviews, approvals, audit. Browser, anonymous and service roles have no direct table access. Purpose/grant/version/review/approval/audit records are append-only, including truncate protection. Mutable job leases and a singleton control row are private operator machinery.

An AFTER INSERT / UPDATE OF status, snapshot, final_form trigger on the existing private assessment draft records metadata only for completed, verified Adult/Myself captures. It does not read answers into logs or alter submission storage. The original finish function updates the draft before the workflow and may precede the report mirror; enqueue does not depend on the report already existing. Claim later requires exactly one matching report and the complete B4/B4.2/B5/B6 authorization chain. No historical backfill runs at migration installation.

Identity is draft/contact/workflow + exact snapshot/final-form SHA256 + pipeline/version pins. Uniqueness makes repeated completion events harmless. Existing individually authorized sources can be queued by the new private operator grant helper without rewriting questionnaire rows. A source change cannot reuse an old cohort/grant/job or old report version.

Leases are 90 seconds, random and hashed, actor/session/grant-bound, with at most three attempts. A killed/failed worker can be retried after lease expiry. No endless scheduler or public draining endpoint is installed. Processing runs automatically when an authorized founder opens the internal workflow, using that founder's current JWT; without a valid founder session/purpose/operator chain the queue stays pending. **Unattended processing is not implemented by impersonating a founder or reusing a saved JWT.**

The additive `roadmap-processing` Function accepts no browser-supplied source, arithmetic, document, lease or seal. It gets protected answers from caller-authorized RPC, constructs the document on the server and obtains a backend-only seal binding its exact JSON hash to the current lease. Only `service_role` can call the seal primitive; that role cannot call the founder RPC, retrieve sources or create versions. The finish RPC rechecks the caller, every gate, source, lease, seal and document hash before committing. A stolen/guessed report ID cannot substitute another contact's lease or output. Source rows, control row, current session/status and existing report advisory locks protect critical writes; revocation uses the same report lock ordering.

The candidate Function expects an approved Functions-only `SUPABASE_SERVICE_ROLE_KEY` for sealing only. No credential was requested, inspected, created or copied. Configuration must be independently reviewed before release/activation. No new key should be exposed to public runtime configuration. The source worker remains held if this dependency is unavailable.

## Evidence, numerical calculation and narrative

`js/vitality-roadmap-processing.cjs` produces a deterministic versioned draft with all 12 Driver sections, selected original values, current reference wording labeled as such, evidence/status/field references, locked weights, actual candidate arithmetic, missing measurements, questions, source-supported practice/concern observations and preliminary coaching discussion/clarification actions.

The full 743-field coverage ledger distinguishes missing, unknown, inapplicable, conflicting, unsupported, shared and observed context. Unmapped submitted fields remain visible. Explicit null and zero remain distinguishable; unknown never becomes zero. Source answers and calculated output are immutable. Narratives quote self-reports and request clarification; they do not assert diagnoses, causal benefit, factual proficiency, clinical priority or treatment recommendations. Missing Drivers receive explicit gaps, not invented strengths or values.

**The current saved-answer adapter still supports zero complete numerical Driver scores.** The unchanged B2.1 engine is executed on its supported incomplete projection and correctly returns withheld values. Existing synthetic normalized numerical examples/tests continue to exercise real arithmetic; they are not passed off as questionnaire answers or participant results. No v0.14 package is a prerequisite for this implementation.

Remaining numerical requirements:

1. Independently established historical questionnaire wording/options/artifact revision. A content fingerprint and `secure-snapshot-v1` label do not prove semantic question revision.
2. Approved Driver-specific habit definitions, foundational/supporting ownership, applicable opportunities and **factual** proficiency. Confidence labels are not proficiency.
3. Exact unique symptom days, intensity, duration/persistence, independent impact/function and finding ownership. Ordinal ranges cannot silently become midpoints or exact days.
4. Approved complete source-to-measurement rules and stage prerequisites, with explicit supersession/version decisions. Current scale formulas alone do not approve a field conversion.
5. Founder resolution of the retained A/B/C calibration discrepancy before claiming model validation or client-ready scoring.

Wise Budgeting is a separate indicator and never deducts from health aggregation. No old six-month pricing, obsolete prototypes or unrelated scoring policies were changed.

## Founder workflow and retention

After a future exact release and separate activation permissions:

1. Founder signs in normally at the production portal and selects an already verified/authorized source in People → Vitality Roadmaps → Assessment Calibration.
2. Open **authorized internal draft workflow**. This spans the review workspace without changing existing report styles or other portal pages.
3. A separate personal acknowledgment explicitly covers private internal draft storage/review. B6's existing read-only/experimental acknowledgment alone does not authorize these new writes.
4. An independently authorized database operator records the exact new source-specific grant, its expiration and permission scope. Existing B4 `allow_drafts` stays false. Review requires both the new grant/control and the existing separate B6 feedback permission; approval is a further independent control.
5. The worker claims one metadata job, retrieves that source through authenticated backend RPC and stores one immutable evidence version. The private view shows all 12 Drivers, formulas/withheld results, shared/unmapped evidence, gaps and discussion opportunities.
6. Founder records accurate/inaccurate/needs-adjustment/request-input decisions, citations, proposed interpretation, scoring-adjustment suggestion and rationale. No proposal overwrites source answers or raw arithmetic. Retries are idempotent; stale review revisions conflict safely.
7. Return for regeneration creates a new idempotently keyed job/version and carries attributed interpretation proposals forward. Previous versions/audits remain intact. No global formula learns from feedback automatically.
8. Internal approval requires a current accurate review for every Driver, a genuine rationale and the exact version/review revision. A subsequent review or regeneration invalidates any claim of current approval. This approval never enables client access or email.

Session reset, close, page hide, changed account, failed authorization, expired grant and revocation clear the private controller; stale async results cannot repaint it. Focus checks, a 15-second permission recheck and an exact-expiry timer keep an open workspace fail-closed. No browser storage, external requests, telemetry, AI or answer logging are introduced. All new controls meet 44px touch targets.

Feedback is retained privately with author/session/source/rule/version provenance. Proposed rule changes must be reviewed offline and released as separately tested code/rule versions. There is no automatic training/adoption route.

## Controlled print/PDF

`roadmap-processing-print.cjs` renders a text-escaped, network-free confidential internal HTML document in the approved visual style. Synthetic native Chromium PDF generation is tested and visually reviewed. The private PDF RPC requires its own global control and source grant; all default false. The production Function has **no configured PDF runtime** and returns renderer-pending even after authorization; no real-source renderer or export was activated. A future separately reviewed renderer must reauthorize after rendering and before returning any bytes. There is no external recipient or email path.

## Real-source acceptance

The three owner-prioritized sources were **not read or processed by this engineering task**. Earlier B5 authorizations are not a substitute for current source checks, each founder's genuine B6 acknowledgment, operator activation or new draft-storage/review permissions. Their current fingerprints/acknowledgments have not been reverified in this local test package. No participant identifier, answer or real source fingerprint is included in code, tests or this evidence. The fourth source and all live cohort entries remain untouched.

A supervised real-source acceptance requires a released exact candidate plus current verified identity/source/SOP/B4/B5/B6 chain, separate new storage/review authority and source-specific grants. Expiration must not exceed any existing grant/SOP deadline; the currently approved pilot deadline remains 2026-10-22 08:45 Central. Do not start a new 72-hour period. No PDF, delivery, email or client scoring authority is implied.

## Validation and preservation

See `docs/evidence/roadmap-processing-v1/validation.json` and `local-preservation.json` for sanitized evidence and hashes. Tests use fictional local records only.

- PostgreSQL 17: baseline + 17 production forward files + maintained B4/B4.2/B5/B6 fixture migrations. No staging/production participant data restored. Full DB regressions include current content, USDA, RepDB, lifecycle, recovery/reliability, authorization, RLS and B4–B6.
- Exact existing completion/resume commands are tested with the candidate trigger installed; repeated finish creates one completion event and one queue job.
- Existing public/private function definitions, ownership and ACL are hash-equal before/after the candidate migration in the isolated schema.
- Native Chromium and WebKit at 1440, 768 and 390: real local RPC/Function/engine path through draft, feedback, regeneration and internal approval; zero console warnings/errors, overflow, external requests, downloads or browser storage. Revocation/logout and late response cleanup verified.
- Four true eight-worker PG race groups: one lease, one canonical result across eight finish retries, one review winner/seven safe conflicts, one regeneration job across eight identical requests.
- Local comparison against deployed PR51 source: two existing public assets changed, three added, 437 paths unchanged including generated runtime config; 442 candidate public paths total. All nine existing Function entrypoints/three payment helper files and B6 pinned source are byte-identical. This is a source/local artifact comparison, not a new live archive verification.
- Synthetic confidential PDF: all pages rendered and visually checked. Real-source PDF remains held.

## Exact next release/rollback gate

No release approval is requested for unreviewed mapping assumptions. Review this local commit, migration hash and evidence first. Then separately authorize a **technical-only, held-by-default installation** of the exact reviewed SHA, this single migration, five static changes (two replacements/three additions), and the additive tenth `roadmap-processing` Function.

Before any hosted mutation, independently recheck the actual locked production baseline/ledger/current cohort, exact public manifest, nine live archive checksums/Node22/runtime/routes/configuration and payment-worker schedule. Current main is not authoritative. Preserve the exact nine live archives; do not rebuild them or merge old stacked branches. Prepare a single unpublished production-context digest candidate and narrow forward revert. Reconcile any drift and return a changed SHA for fresh approval.

Technical installation must leave all five control flags false and purpose/grant/job/version/review/approval tables empty. Do not auto-backfill, enroll, grant, open answers, send email or process the priority cases during installation. Existing production and beta data/locks stay unchanged. Sealing credential/runtime review is separate from public configuration; PDF rendering remains unconfigured/held.

Rollback before publication: cancel the unpublished candidate; leave publication lock on. After publication failure: restore the exact prior static/Function artifact set through the reviewed forward-revert process, preserving all existing schedules/configuration. Privileged operator sets only new processing controls false and appends source-grant revocations where applicable; verify both founders denied and no worker can store/read new versions. Do not drop the migration, queue, original answers, versions or audit history. Source/purpose/grant history remains immutable. No unrelated rollback or pilot change is authorized by this plan.

## Primary Chat decisions / authorization prompt

> Review the exact local Roadmap internal-processing candidate and its validation manifest. Authorize technical-only installation only after current production/SQL/archive preflight passes, with all new processing, review, approval and PDF controls held. Separately decide whether the three previously approved calibration sources may have private persisted evidence drafts and attributed review writes, subject to current personal B6 acknowledgment, explicit new storage-purpose acknowledgment, original source/SOP/B4/B5/B6 gates and the existing deadline. This does not approve numerical field rubrics, client scoring, export, delivery, email or self-modifying rules. Resolve archived question semantics and the listed measurement/rubric gaps before authorizing any non-withheld numerical conversion.
