# Issue #55 — Source packet reconciliation addendum

November 1, 2026. Initial discovery remains historical in REPORT.md. This addendum updates source recovery and proposal traceability only. It does not approve a build, architecture, compensation plan, payout, credits, production action or provider integration.

Worktree/branch: academy-affiliate-foundation / codex/academy-affiliate-foundation. Unchanged base/code SHA: `3baef48590fbcd7955946bcc5e9988b7f88bf6b4`. Owner-supplied packet was staged outside Git. Only this Issue55 directory changed; no raw source or complete source quotations are copied into Git.

## Received and still missing

Verified packet SHA256: `28598c5c74901a97c37abdd0e4ad32136194a431eb42ed2b182671e2c69e3b7c`.

Verified artifact: `PROPEL_AFFILIATES_PHASE_0_BLUEPRINT_V0_1.md`, SHA256 `46fcd92550e71228f0f3e50ada5a09694e54ca89ece2fb4b0c4dec84fac33ba8`. Read completely: 24,499 bytes, 198 lines. It identifies October12,2026 and working draft v0.1. Its stated status is proposed architecture for review. Owner delivery establishes source availability, not approval of its recommendations.

Exact heading inspection found a title and draft/version heading plus **22 consecutively numbered blueprint sections, 1–22**. It also contains 11 logical domains in §4, eight explicit PA-DEC proposals in §19, four architecture/review gates and six release increments in §17. These are not 127 original handoff sections. The blueprint explicitly retains the missing master handoff as controlling for omitted scope.

**Recovered:** complete October12 Phase0 draft. **Still missing:** the complete original 127-section handoff, its original section titles/content and authoritative version/provenance. `127_SECTION_TRACE.csv` remains byte-identical, with 127 SOURCE_MISSING rows, blank original titles/content and no invented mapping. Earlier REPORT.md statements that both sources were unavailable describe the initial search; this addendum supersedes only Phase0 availability. Its business holds and historical-versus-live distinctions remain valid.

`SOURCE_TO_SCOPE_DECISION_TRACE.csv` covers all 22 actual blueprint sections, 11 domains, eight proposed decisions, four gates and six release increments: 51 rows. IDs prefixed P0 refer only to this blueprint; they must never be substituted for original PA-REQ or 127-section IDs. Brief summaries are analysis, not copied source content. Every row points to the same verified artifact hash and an exact section/line reference. Option3/checklist PDFs are assigned to Issue54; their content is not duplicated or interpreted here.

## Source-to-full-scope reconciliation

The blueprint confirms that the advanced scope was not a basic referral feature. It spans application, agreement, training and suspension; mobile affiliate dashboard/CRM; versioned campaigns and approved images/video/PDFs; email/text/DM/social sharing; personalized URLs/QR; click/contact/consultation/verified commerce attribution; approved knowledge and cited AI with human escalation; compensation/recurring eligibility; bonuses/refer-X-get-Y; separate cash, restricted credits, points and promotional benefits; immutable ledger, holds, reversals/disputes, payout and reconciliation; finance/privacy/consent/currency/operations. Full original scope still requires the controlling handoff.

Source §12 is specific to RVA: single-level, no upline/downline, sponsor graph/ranks OFF, health safeguards, minimal milestones and ReFuel later subject to approval. The broader platform's optional up-to-ten-level model (§§1,6,10,17) is **not RVA activation or compensation authorization**. Generic network module work is not needed to unblock an RVA staging increment; preserve future interfaces without enabling genealogy, ranks or multi-level calculations. Affiliate introduction bonus remains a separate unresolved optional policy, not an upline commission. Coach-of, referred-by and invited-by must remain distinct; coach compensation is outside affiliate rules.

Health boundary is stronger than merely omitting assessment answers: even milestone names, symptom tags, resource interest or a contact's engagement can expose sensitive information. Source §§9,12,14,15 do not authorize sending all listed event types or labels to an affiliate/core. Minimize and classify payloads; validate consent and intended recipient per field; gate UI/API/export/log/AI/support access. Never copy health responses, coach notes, diagnoses or voluntarily entered symptom tags into generic affiliate CRM. Approval of minimal disclosed statuses remains A05/A14.

## Proposed decisions and existing approval register

The following are review dispositions, not new decisions. Existing A01–A18 IDs are retained from REPORT.md.

| Source decision | Existing register / consequence | Current disposition |
| --- | --- | --- |
| PA-DEC-001 | A01/A18, shared boundaries and adapter ownership | Proposed shared core/adapters; no approved separate service, repository, deployment or tenancy migration inferred |
| PA-DEC-002 | A05/A16; typed CRM, attribution, sponsor and compensation links | Proposed separation matches audit concern; WS02/03/08/09 contract review required |
| PA-DEC-003 | A03 | RVA single-level/OFF invariant independently confirmed by current coordination; blueprint receipt does not activate any plan |
| PA-DEC-004 | A08–A12/A15 | Proposed append-only books/reversals and acceptance-versus-payout distinction; accounting/credit/provider policy still pending |
| PA-DEC-005 | A05/A15/A18 | Proposed signed versioned event envelope, inbox/outbox and deterministic replay; exact shared API/schema not approved |
| PA-DEC-006 | A05/A14 | Proposed tenant-owned sensitive source and minimal milestones; exact disclosures/consent/access remain pending |
| PA-DEC-007 | A18 and WS02 ownership | Stack evaluation only; existing RVA stack is evidence, not approval of new multi-tenant architecture |
| PA-DEC-008 | A04/A10/A15/A18 | Proposed staging share→milestone→verified sale→commission→reversal journey; no current financial or staging deployment authority |

A01 is **partially resolved**: Phase0 is now received and verified; all127 originals still missing. A02/A04–A17 remain pending/held as previously recorded. Neither percentage/flat amounts, recurring duration, bonus thresholds, hold periods, credit expiry, attribution window, currencies/FX nor payouts have become approved. A03 continues as a current required invariant. A18 remains proposal-only.

## Financial event contract deltas for later review

Source §§8–11 align with the proposed report contract: verified originating commerce→resolved identity/attribution snapshot→frozen plan→earning decision/hold→journal→payout eligibility→provider payout/readback/reconciliation. Authorization or purchase alone cannot create withdrawable cash. Cash, credit, points and promotional benefits need typed independent policies/accounts; payment acceptance and disbursement adapters remain separate. No FX by default. General source mentions potential GBP; current RVA CAD-first/separate US preparation and no GBP activation remain unchanged.

Before implementation, reconcile report envelope with source §9: explicit tenant scope, producer/source-event IDs, schema version, occurrence/receipt clocks, correlation/causation, minimal subject reference and signature/replay context. The proposed shared event uniqueness is tenant+producer+source event+type, plus domain-specific transaction/period/rule uniqueness; server-derived tenant/actor remain mandatory. Do not retrofit tenant_id into existing RVA tables without WS02 review. Version compatibility, late corrections, signed ingress timestamps, backfills, outbox leases and dead-letter replay must be designed before a worker exists.

Add explicit account/issuer, funding/clearing and original-event references for monetary journals; validate balanced postings per entity/currency/unit and deterministic minor-unit rounding. Partial refunds/chargebacks need approved compensating postings, not edited historical earnings. Reconciliation must detect missing/unmatched events and reserved payouts after timeout. Payout rails, onboarding/KYC/tax and cross-border flow need independently approved vendor/legal evidence. A gateway or token vault is not a payout provider. No secrets or bank/card/tax fields enter affiliate reports/AI/test fixtures.

## Gates and slice correction

| Gate from §17 | Reconciled status |
| --- | --- |
| 0A source inventory | PARTIAL: Phase0 complete; 127 controlling sections missing; original requirement completeness not asserted |
| 0B architecture | PROPOSED: ownership/topology/edge/attribution/envelope/immutability/adapter decisions await review |
| 0C privacy/security/compliance | PLANNED: no review certification; financial, health, consent and vendor decisions open |
| 0D acceptance/release | PROPOSED: report/tests/slice available for review; no approved staging installation or release |

The source proposes gate clearance before coding. Therefore **no implementation slice is cleared by this reconciliation**. Safe current progress is source tracing, schema/adapter inventory, proposed payload classification and threat/test planning using fictional examples. Other Academy lanes can continue under their own authority; Issue55 is not a project-wide block.

The earlier held restricted-test-credit slice is now explicitly a **pre-acceptance substep**, not source R1 completion and not a replacement for PA-DEC-008. After gates and exact scope clearance, proposed R1 staging acceptance must exercise application/onboarding/agreement, one approved campaign asset/link/QR, basic attribution and approved minimal milestone, a verified synthetic eligible sale, one explainable single-level commission/obligation with audited balanced ledger, and a refund/reversal/readback. A held test-credit demonstration alone cannot satisfy this. No real cash or provider payout is required by an offline fictional step; whether/how a later staging adapter simulates settlement must be approved and impossible to enable in production. Recurring/refer-X-get-Y/credit accounts/reconciliation/payout rails remain the source's later increments subject to approvals, not deleted scope.

R2's richer CRM/content/compliance/analytics, R3's AI/communications, R4's recurring/incentive/credit/payout, R5's enterprise/branding/operations and R6's separately legally reviewed optional network capabilities remain explicitly recorded. R6 stays OFF for RVA and must not block R1. No Lockliel repository/content was inspected in this reconciliation; source §13's adapter recommendation is cross-project discovery, not authority to access/change it.

## Additional proposed tests and Owner UX implications

Original T01–T35 remain proposed and unexecuted. Add:

| ID | Source-aligned future test |
| --- | --- |
| T36 | Deliver a qualifying signed event 100 times and under concurrency: one immutable obligation/journal; changed replay conflicts |
| T37 | Two tenant/entity/producer IDs with overlapping external IDs stay isolated across API/DB/storage/analytics/AI/support |
| T38 | Exact percentage/flat/recurring and partial-refund expected arithmetic; floor/cap/rounding/date boundaries only from approved rule fixtures |
| T39 | Signed event timestamp, compatibility version and replay-window rejection; late correction/dead-letter recovery deterministic |
| T40 | Content/tool prompt injection cannot send, approve compensation, change attribution, disclose health status or initiate payout |
| T41 | Affiliate dashboard computed from immutable projections equals source books; per-currency/unit reconciliation detects stale/missing/duplicate entries |
| T42 | Backup/restore and worker/outbox/dead-letter replay preserve event uniqueness, balances, audit and held uncertainty |
| T43 | R1 synthetic end-to-end commission and reversal demonstrate the source journey; noncash-only substep cannot be labeled R1 complete |

None of these tests ran. Capacity/cost/service/recovery objectives (§16) require measurable agreed targets; no scalability or recovery certification follows from source receipt.

Owner UX map gains a requirement/source/decision inspector showing requested/proposed/approved/implemented/verified separately; a gate0A–0D readiness panel; frozen-plan simulation preview with no publish authority; and finance journal→event→provider evidence drilldown. Affiliate-facing statuses remain consent-limited and plain-language, with cash/credit/point amounts distinct. Support/SuperAdmin access is contracted, scoped and audited, not routine raw tenant visibility. These are proposed controls, not runtime changes.

## Validation, blockers and handoff

Actual checks: supplied ZIP and artifact hashes; complete source read; exact22 numbered headings,11domains,8PA-DEC IDs,4gate IDs,6release IDs; 51-row trace uniqueness/coverage; original REPORT/127trace byte preservation; JSON/source hash consistency; branch/base and owned-path checks. No behavior, SQL/RLS, browser, provider or live tests ran. No source archive or full original text was added to Git.

Updated blockers: B01 now means missing controlling127 handoff only, with Phase0 recovery resolved; B02 business/financial/consent approvals remain; B03 present operational/provider readiness unverified; B04 shared owners/contracts/gates not cleared. Next safe action: coordinator obtains the controlling original and reviews0B–0D/proposed decisions while independent trace/threat/payload/test planning continues. Exact later clearance is required before code, staging setup, migration or activation.

Chat handoff: October12 Phase0 is received, hash-verified and fully reconciled. Its22sections do not replace the controlling127. The full advanced scope and RVA single-level/OFF boundaries are preserved; architecture/payout/credits/compensation remain proposed. Planning can continue independently; no engineering slice or production/financial authority is newly cleared. Alex private issuance remains untouched.
