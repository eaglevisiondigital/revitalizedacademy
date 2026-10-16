# B5 Founder Scoring Lab — candidate, no production release or participant scoring

Issue #34. Built from deployed B4.2 source `4247e33322c9117b92f68718ed9408070b7b03e2`, not stale main. Production was rechecked as deploy `6ad29658dd8a8c0932b4d6d0`; main remains `79debed92925b920f9052d9c522a796bbf929223`. Reference PR #28 is `b1c42963e8f5d1d6bf42d5dddb94477e665eb39c`. No stacked PR is merged. PR #29 NDA, B4/B4.1/B4.2, all eight existing Function entrypoints/libraries, questionnaire, recovery, payments, content and production config are byte-preserved. The candidate adds three private frontend files and one ninth Function. Production remains unpublished by this task.

## Useful testing now, without invented participant scores

The accepted B2 and B2.1 engines and all 30+20 fictional measurement sheets are reused unchanged on the server. Their arithmetic is candidate mathematics, not adopted scoring policy. The lab provides per-Driver inputs, weights, traces, baseline/experimental comparisons, explicit detached assumptions, provisional Spectrum outputs, candidate rankings, reviewer proposals and an interactive fictional preview. No symptom–habit causal relationship, clinical recommendation or diagnosis is generated. Starting-action text requests clarification and discussion, not treatment.

The independent B5 measurement contract uses deployed B4 coverage (which preserves B3's hold) and the exact reference registry: 743 field IDs / 190 symptom observations; SHA-256 `2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced`. `secure-snapshot-v1` is only a snapshot format label, not exact historical questionnaire provenance. Even an eligible detailed source is not automatically scoreable. **All actual Driver/overall scores and stages currently remain withheld** because approved complete source measurements/rubrics are absent. The UI displays why and permits detached fictional experiments; it never derives exact days, duration midpoints, factual proficiency or multiple independent functions from insufficient answers.

Modes are explicit:

- Observed supported component: original reported context or explicit zero/empty screen; no claim of complete measured health.
- Computed candidate: fixed, sufficiently defined fictional measurement sheets, with arithmetic trace and unapproved policy status.
- Conditional what-if: entered assumptions on a detached fictional case and proposed formula parameters; never joined to a person's answers.
- Withheld: incomplete, unknown, conflicting, inapplicable, historical, unsupported or stale evidence/rubrics. Missing is never zero.

Weights: Hydration, Neural Repatterning, Detoxification and GI 1.4; Hormone, Living Diet, Recovery and Mentality 1.3; Electrobiology and Training 1.2; Momentum 1.1. Budget 1.0 is separate with **zero health/stage deduction**.

## Versioned measurement crosswalk

Executable independent mapping: `js/vitality-roadmap-b5-contract.js`; `crosswalk()` enumerates every reference field's question ID, label, conditional branch, Driver and permitted role against the pinned B4 registry. No actual participant data is in that contract.

| Driver | Explicit source context examples | Factual gaps / unapproved rubric |
|---|---|---|
| Cellular Hydration | water_intake_consistency, electrolyte_consistency, hydration_symptoms, hydration_proficiency | Measured water/weight units and applicable days, source-count definition, factual proficiency; confidence is context |
| Systemic Detoxification | urinary/liver_bile/lymphatic/lungs screens, whole_body_movement, sedentary_periods, walking_regularity | Distinct primary finding ownership, habit roles/opportunities, independent function; no inferred detox diagnosis |
| Electrobiology Rhythms | sleep_wake_consistency, morning_daylight, evening_light_exposure, outdoor_time, grounding_frequency | Factual practice definitions/thresholds/opportunities and independent Driver function |
| The Living Diet | eating_* habits, nutrition_* confidence, whole_food_percentage | Applicable habit counts/roles, factual nutrition proficiency, no conversion of confidence to intake adequacy |
| Functional Training | movement_* confidence, training_sessions_weekly, training_program, performance_*, body_allows_activities | Factual movement criteria and distinct Driver function; one global function answer cannot supply eleven functions |
| Holistic Recovery | recovery_* screens and recovery_behavior_* | Separate exact symptom days, intensity, impact and factual recovery habit rubric |
| Gastrointestinal Renovation | bowel_movement_frequency, bristol_stool_types, colon_symptoms, gi_symptoms, fiber_whole_foods | No diagnosis or assumed exact duration; primary ownership, factual habits and independent function |
| Hormone Balancing | hormone_pathway and branch-dependent screens | Preserve branch inapplicability, no invented diagnosis; independent habits/function and current severity/impact |
| Neural Repatterning | neural_symptoms, stress_*, cognitive_*, learning habits | Do not equate cognition confidence with factual performance; exact qualifying symptom/impact criteria |
| Momentum Regimens | daily_habit_consistency, weekly_rhythm, monthly_goal_review, routine_friction/restart | Factual opportunities/proficiency, role definitions and independent function |
| Mentality Realignment | self_talk, gratitude, positive_environment, life_purpose, emotional_patterns_symptoms | Educational interpretation, no diagnosis/causation; factual rubric and independent function |
| Wise Budgeting | monthly_health_spending, wellness_budget, spending context | Separate approved planning/preparedness rubric; income/spending never health status |

For each applicable health Driver, full factual scoring additionally needs: explicit uniquely owned findings; unique days in the last 30; separate intensity and daily impact; exact persistence days and resolution; distinct reported-condition identity rather than counting one condition repeatedly; per-Driver independent function; factual habit proficiency and appropriate opportunity counts. Unknown rubrics, exponents and Spectrum prerequisites need founder acceptance. This package adds no questionnaire questions or consents.

## Known calibration blockers, deliberately visible

A/B/C remains 70.6597194618 / 35.4813389234 / 70.00. Founders wanted them close with A slightly highest, but independent expected numerical ranges/spread were never approved. Symptom-free B's numeric Chaos is an unresolved current-burden interpretation concern. No silent tuning fixes it. Peace 90/95, qualifying cognitive/GI criteria, chronic grouping, >90-day handling, impairment prerequisites, breadth/exponents and curated knowledge relationships remain decisions. Engineering can test deterministic effects now; it cannot invent policy adoption.

## Private production execution and immutable proposals

Additive migration: `20261016215456_vitality_roadmap_b5_scoring_lab.sql` (CLI-generated, **unapplied**). Three private RLS/append-only tables: independent pilot events, cited proposals and metadata-only audit. No direct browser/service-role grants. UPDATE/DELETE/TRUNCATE raise; grants/revocations are new events. Public authenticated RPC has a mandatory pinned-founder/current-session guard, not general Owner permission. Dave/other Owners/Admin/Coach/member/anonymous/service callers are denied. No permissions or Auth users change.

`roadmap-scoring-lab` is a minimal same-origin production-only caller-JWT Function; no service key or AI. It calls only `public.roadmap_b5`. Authenticated synthetic calculations use fixed fictional cases and bounded proposed parameters. Real source reads require every link: B4.2 pinned founder, current verified active Owner/All People/private-health/CRM/contact authority, live Auth session, confirmed eligible exact identity/date/source and current B4.2 SOP, active exact source-pinned B4 cohort, **independent operator-granted B5 pilot authorization**, valid UTC expiry (≤14 days and ≤SOP), no subsequent revocation or metadata/source change. Existing read-only B4.2 workflows are unchanged and do not need restarting.

No grant is seeded. Operator-only `roadmap_b5_set_pilot` records the separate approval reference and the authenticated B4.2 actor/session/signoff provenance. It must never be called on actual records without separate exact authorization. The separate real experimental computation authorization does not itself validate missing rubrics: actual scores remain withheld under the present contract.

Proposal writes additionally invoke B4 `allow_drafts` + health-progress authority. They store proposed language, question-key citations, reviewer reasons, config/adapter/rubric/source pins, actor/session/time, optimistic revision and retry fingerprint. They never accept source-answer updates, numerical actual scores, adopted policy or release actions. Audit contains no answer or proposal text. Comments are private draft proposals; founders are instructed not to paste original answers. Knowledge-base relationships require separate curation approval. No B4 report version is implicitly created.

Browser state is document-local, abortable, epoch guarded and cleared on logout, account change, close, pagehide, access/source/pilot change. Foreground plus 15-second revalidation clears revoked access. No telemetry, console logs, storage, identifiers in URLs, downloads or external processing. Print is fictional-only; a real-source lab is entirely hidden in print and its Print button disabled. There is no PDF endpoint or client-readable score.

## Founder rehearsal checklist

1. Open People → Vitality Roadmaps → Founder Scoring Lab as a designated founder after normal sign-in. Existing Founder Pilot Verification remains adjacent and independently usable.
2. Confirm the empty scoring cohort and gates. Choose fictional A, B, C; inspect all twelve Driver traces and calibration warnings.
3. Compare source-supported availability versus withheld actual scores (local fictional DB acceptance only in this candidate).
4. Enter detached assumptions; compare before/after. Explain whether changed output is desirable. Do not describe the hypothetical result as a participant's score.
5. Enter independent expected ranges/reasons. These notes are session-local, not policy signoff.
6. Create cited correction/strength/priority/action/KB proposals with reasons. Durable private append is disabled unless separately authorized; it is never adopted automatically.
7. Inspect the interactive fictional Roadmap and safe print rehearsal. Never copy/screenshot/export actual source data.
8. Close/logout; verify private state disappears. After source revision/revocation, stop and request renewed exact authorization.

## Estimates and blocker register

| Item | Status / next bounded work |
|---|---|
| Lab arithmetic, mapping and synthetic review | Implemented candidate; engineering verification recorded separately |
| Independent founder calibration | Unresolved; approximately 1–2 founder working sessions after they review the fictional sheets; no invented expected ranges |
| Measurement/rubric completeness | Blocking actual scores for all 12 Drivers; questionnaire/rubric decision package and new versioned implementation needed after founder decisions (estimate 2–4 engineering days once specified) |
| Historical summaries / revision provenance | Not reconstructable by guessing; authoritative source clarification required; no time promise for absent records |
| Production technical install | Separate exact SHA/migration/additive ninth Function approval; typically one bounded release/acceptance session |
| Any real scoring or private derivative writes | Separate exact identity/SOP/cohort/pilot/draft authorization; not included in technical install |
| Client report approval/release/delivery | Separate much later product/legal/security release; no estimate until scoring and interpretation policy accepted |

These are planning estimates, not approvals or guaranteed outcomes.

## Production release review and rollback — execute nothing yet

1. Verify current deployed metadata, full file digests and eight Function bundle/runtime/routes/schedule pins again. If production drifted, reconcile and return a new tested exact SHA. Never deploy stale main or merge stacked branches wholesale.
2. After explicit exact-source approval, apply only this new production migration once to `voalfpxiyznnqfcqcymd`; do not replay B4/B4.2. Verify empty B5 tables, unchanged B4 cohort/version counts and existing permissions/gates.
3. Deploy matching frontend plus additive `roadmap-scoring-lab`, preserving all eight deployed Functions and non-B5 artifacts. Use the complete reviewed manifest, not a frontend-only upload that removes Functions.
4. Hosted technical acceptance uses separate normal Justyn/Elle sign-ins, fictional calculations, empty real cohort and denial probes only. No real source search, enrollment, participant compute/write or email.
5. Rollback on failed technical acceptance: revoke authenticated EXECUTE on `public.roadmap_b5(text,uuid,jsonb)`; remove/revert only B5 frontend references/assets and ninth Function using the preserved full baseline manifest. Retain all private append-only evidence; do not drop tables or reverse/replay migrations. If unrelated production changed, create a reviewed forward revert, not a blanket restore.
6. Revocation for a separately approved future pilot: operator appends `private.roadmap_b5_revoke` with the private bound report and reference; also revoke B4 cohort independently if that review authorization ends. Verify current tabs clear at foreground/15-second check, new reads/writes denied, and aggregate no-active-grant result. Owner Justyn; backup Elle; authorized operator and scheduled UTC end must be named before execution. B5 access also expires automatically; this does not add expiry to unchanged B4.

Separate next approvals: **(a)** technical exact-source install only; **(b)** private B4.2 identity/date/SOP confirmation; **(c)** exact B4 read-only cohort with drafts false; **(d)** independent source-pinned experimental-scoring pilot, and distinct B4 draft grant if derivative writes are approved; **(e)** future client release. None is implied by another.

## Final validation evidence

Production build 434 files; JavaScript syntax 170; maintained unit/frontend 185 plus 53 B5/retained B2.1 checks = 238 distinct checks; PostgreSQL17/RLS 201 (9 new B5); 534 native-DB/Function/browser checks (B4 168 + B4.2 186 + B5 180), all six Chromium/WebKit size combinations; 18 race groups ×8 overlapping workers; session39; Vitality WebKit75; mocked Edge40 and six unchanged entrypoint type checks. Retained B1/B2/B3 reference checks167; separate B1/B3 native DB38 plus24 prior-review checks and two durable-browser flows pass. Zero final browser warnings/errors, downloads or horizontal overflow. Initial harness build-output collisions and the WebKit selected-option paint overflow were corrected and the final matrix rerun cleanly. Original eight Function sources, schedule, NDA and unrelated protected assets remain identical.

Machine evidence: [validation](evidence/b5/validation.json), [source/Function preservation](evidence/b5/artifact-preservation.json). Fictional design screenshots in `docs/evidence/b5/`. The preview is an explicitly fictional rehearsal, not authenticated signoff or production acceptance. No actual participant's answers, identity, date or fingerprint was retrieved into engineering artifacts. The final production check used aggregate counts only: cohort0, B4versions0, identity confirmations0; B5 RPC not installed.

Reproduction uses the existing Node24, pg8.16.3/jsdom26.1, PostgreSQL17.11 and bundled Playwright Chromium/WebKit runtimes. `npm run test:roadmap-b5`; `npm run test:roadmap-b5:database` with local-only PG17 and Playwright paths; `npm run build:production-vitality`; `npm run build:roadmap-b5:preview` with `RVA_ESBUILD_PATH` pointing to the available esbuild package; `npm run preview:roadmap-b5`. The DB harness creates/removes only `rva_gate_*` local databases and never connects to hosted projects. See the test script for baseline and runtime prerequisites. No new runtime dependency is introduced.

[Hosted fictional rehearsal](https://roadmap-b5-lab--revitalizedacademy-staging.netlify.app), draft deploy `6ad2a4fee37965a1606af688`: three exact asset hashes, CSP connections blocked, zero Functions/backend/config, six hosted synthetic browser runs passed. Production and published beta are unchanged. [Hosted preview evidence](evidence/b5/hosted-fictional-preview.json). This intentionally public fictional demo does not authenticate founders or access any private records.

Cleanup: every task-local disposable database was removed (verified count0); task PostgreSQL17 cluster stopped. No hosted participant fixtures or private proposal records were created.

Final review additionally scoped Lab print styling to `body.rv5-open`; a regression in all six browser/size combinations proves closed-Lab styles leave ordinary portal printing visible. Private-source printing remains blocked.
