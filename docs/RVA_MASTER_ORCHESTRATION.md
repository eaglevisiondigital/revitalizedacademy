# RVA Master Codex — Workstream Orchestration Contract

**Created:** 2026-11-01 | **Status:** Non-production coordination candidate
**Repo:** eaglevisiondigital/revitalizedacademy
**Verified production reference at initiation:** source `10dec6682e7e87bf637482fc027e54c6800260e4`; deploy `6ae6b971e17bce85e37aa95c`. Re-verify prior to any use as a new baseline.

## Owner experience
The Owner gives direction to the **RVA MASTER CODEX**. The coordinator turns it into independently executable issues with explicit dependencies, resolves ownership, delegates to supported subagents or separately initiated specialist Codex threads, and reports one consolidated status.

**No fake delegation:** issues are a task queue, not a runtime agent scheduler. A specialist is only ACTIVE when Codex confirms an actual launched subagent/thread and worktree. New permanent threads require action in Codex, or a separately approved automation that actually supports them. Report unsupported automation transparently.

## Stage A: parallel read-only discovery (four initial lanes)
1. **Architecture / Design / Source of Truth** — actual deployed code inventory; asset identity, design tokens, API/data contracts; source-control and release baselines.
2. **Client + Coach + Family journey** — complete requirements-to-UI/API/database acceptance matrix, including 49-day programs, households, permissions, courses, nutrition and fitness.
3. **Advanced Affiliate / Ambassador** — full 127-section prior handoff and Phase 0 architecture reconciliation, Share Center (email/SMS/social/campaigns), referral CRM, attribution, commissions, credits, reward rules and payouts. RVA activation single-level; broader optional platform separately recorded.
4. **Independent QA / Integration** — verify existing evidence, full-stack end-to-end journeys, release gates, gaps in CI, risk register and regression/test ownership.

Then expand to Roadmap/V3, CRM/payment, mobile and operations as interfaces stabilize; continue blocked work only within safely independent scopes.

## Workstream owners
- WS-01 Website, branding, conversion, design system
- WS-02 Core architecture, identity, security and permissions
- WS-03 CRM, intake, enrollment, scheduling, messaging and automation
- WS-04 Vitality Roadmap, founder review, V3 methodology, Coach Companion
- WS-05 Client portal, coach operations, sessions, entitlements
- WS-06 Family Hub, guardianship, privacy and shared experiences
- WS-07 Nutrition, fitness, educational content, tracking and challenges
- WS-08 Advanced Affiliate / Ambassador, Share Center and referrals
- WS-09 Checkout, billing, commissions, credits, settlement and payouts (shared financial contracts)
- WS-10 System integration, testing, release operations, migration and training

## Shared invariants
1. Keep a **single approved design system**: visual tokens, responsive shell/components, exact logo/photos and accessible UX. No workstream invents new brand styling.
2. Keep **one identity and client/household/affiliate source of truth**. Each shared table and API has an accountable owner and versioned contract.
3. Preserve private health boundaries. Affiliates may receive a consented referral status, never assessment answers or confidential coaching notes.
4. Financial earning, restricted credits, points and payout are distinct; no unverified eligible order, duplicate webhook or failed payment can result in withdrawable earnings.
5. Do not confuse the coaching portal's V3 education knowledge with approved individual clinical or dosing directions.
6. No specialist deploys production or changes live DB/Auth/financial/Roadmap permissions independently.
7. Protect currently active protected-client workflows and authorizations from unrelated work.

## Work order / dependency rules
- Start independent tasks from exact pinned base refs; declare worktree and files at task start.
- Assign **one owner per overlapping file or schema family**. Changes to auth, payment, navigation shell, public component tokens and DB migrations require contract review first.
- Cross-workstream work is merged by ONE integration lane through reviewable PRs; no default-branch/production change by mere issue completion.
- Use proposed change contracts before implementing shared APIs.
- Blocks must be recorded with responsible decision and unblock condition, not become blanket project holds.

## Definition of Done for a feature
1. Founder/Owner requirement and applicable approval traced; deviations visible.
2. UI uses approved design/asset references and matches responsive design.
3. Backend policy and data-contract tests pass, including cross-account negative cases.
4. Synthetic end-to-end acceptance passes; production acceptance remains separately gated.
5. Observability, failure/retry/deduplication, audit and rollback plan documented.
6. Integrator confirms shared journey and no regression of existing modules.
7. Named Owner/reviewer accepts, and the actual release independently verified.

## A task handoff must include
`ISSUE | SCOPE | AGENT/THREAD | BRANCH/WORKTREE | BASE SHA | MODIFIED PATHS | SHARED CONTRACTS | DEPENDENCIES | TESTS | RISKS | APPROVALS | BLOCKERS | NEXT ACTION`.

## Reporting to Owner
Give:
- Current deployment vs source branch, pending candidate branches/PRs
- What is verified live, locally implemented, proposal only and blocked
- Actual launched agents vs queued workstreams
- What proceeded despite other blocks
- What exact approvals are required next
- A single integrated acceptance matrix, with evidence links

## Launch sequence
- Controlled onboarding/payment/client+coach operating beta
- Controlled Roadmap founder pilot and verified V3
- Limited affiliate end-to-end tests with noncash/no live payouts
- Family adult-household pilot after permission/consent decisions
- Full financial payout and deeper family/minor/app capabilities only upon independent compliance, QA, and Owner approval

**Scope expectation:** The final full Academy includes all WS-01–10, including the advanced affiliate suite; partial beta does not mean full completion.
