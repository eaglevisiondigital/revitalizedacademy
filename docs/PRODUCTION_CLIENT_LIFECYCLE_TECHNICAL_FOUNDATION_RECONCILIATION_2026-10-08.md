# Production Client Lifecycle v1 — technical foundation reconciliation

Date: 2026-10-08

## Boundary

This package prepares the non-agreement, non-payment production lifecycle foundation. It does not clear the Québec agreement-publication legal gate. It does not publish or map MK8, create the proposed pay-in-full agreement, reuse MK7, send enrollment/agreement mail, create production acceptance clients, record payment, or grant paid access.

## Reconciliation

- Original local candidate: `4f300906d3d93e92446635ffd0b475c67c26219c`.
- Exact currently published production application source: `2748528dfc0ec72aef7fdcc1eb2d71725c01ec76`.
- Published Netlify deploy: `6ac8236336cbba557f2f8cd3`.
- Reconciliation branch: `codex/production-client-lifecycle-v1-reconciled`.
- Applied candidate commits, in order: production lifecycle database draft, integrated lifecycle/frontend/Edge package, and legal fail-closed refinement.
- Every tracked Vitality reliability frontend, Edge, migration and regression file matches the published source byte for byte after reconciliation.

The exact reconciled release SHA is intentionally reported from Git outside this document so recording it does not recursively change the commit.

## Validation

| Check | Result |
| --- | --- |
| Production build | 389 files; production environment/project/origin |
| JavaScript syntax | 114/114 passed |
| Frontend | 106/106 passed |
| Edge | 40/40 tests plus Vitality and five lifecycle entrypoint type checks |
| PostgreSQL 17 | 126/126 maintained checks passed |
| Concurrency | Vitality one eight-worker race passed; lifecycle four race groups with eight workers passed |
| Lifecycle responsive | Chromium 37/37 at 1440×1000, 768×1024, 390×844 |
| Vitality/Safari responsive | WebKit 75/75 at the same three sizes |
| Environment isolation | exact production project/origin; no beta/staging marker or server/test tree in build |
| Git hygiene | `git diff --check` passed; tracked tree clean |

The synced workspace restored 112 stale, non-manifest duplicate files inside the generated output. They were quarantined outside the repository. The verified artifact was reduced to exactly the 388 allowlisted files plus `runtime-config.js`. No tracked source was removed.

## Database and legal gate

The only pending lifecycle migration is `20261007224150_production_client_lifecycle_v1.sql`. Restored native tests prove:

- contact reuse, normalized email/phone and duplicate prevention;
- Holistic Foundations intent limited to CAD $89/month with six-month minimum or CAD $960 one-time with 12-month term;
- billing choice/currency persistence and cross-path mapping denial;
- Owner/Admin authorization and scoped staff/member/anonymous denial;
- production-only origin and session/account isolation;
- neutral, bounded password recovery;
- `production_client_agreement_publication = held`;
- no active required Holistic Foundations mapping can be created while held;
- agreement preparation/delivery, payment recording and paid access fail closed;
- MK7 cannot satisfy a new Holistic Foundations enrollment.

Read-only production verification before release found:

- latest migration ledger: `20261008230843` (`vitality_start_delivery_reliability`);
- active required Holistic Foundations mappings: 0;
- client agreements: 0;
- payment records: 0;
- client memberships: 0;
- client access rows: 0.

## Stop gate

Reconciliation changed the candidate SHA. Per explicit user instruction, no GitHub push, production migration, Edge deployment, Netlify deployment, email, hosted lifecycle write, payment or access change may occur until the exact reconciled SHA is returned and explicitly approved. Beta remains untouched.

After approval, the controlled technical release is limited to:

1. push the exact reconciled branch/SHA;
2. recheck production drift and the migration ledger;
3. apply only `20261007224150_production_client_lifecycle_v1.sql` once to production project `voalfpxiyznnqfcqcymd`;
4. deploy only `member-account`, `agreement-sign`, `member-password-reset`, `client-lifecycle-delivery`, and `notification-delivery` from that SHA;
5. deploy the exact 389-file production build to Netlify site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`;
6. run read-only/transaction-rollback hosted acceptance for the approved non-agreement, non-payment boundaries;
7. verify the publication hold and zero active Holistic Foundations mappings remain in effect.

The later legal release requires a separate qualified determination, approved final agreement text, a forward publication/mapping migration, and explicit authorization. It must not modify this technical foundation migration after application.

## Release outcome

Primary Chat approved exact SHA `4fe1e812e007c840b0211cc61989f7b66fd28ba8`. It was pushed and deployed to production Netlify as `6ac870e0a8239709a2ab5d23`. The lifecycle migration applied once as production ledger `20261009043913`, and the five prepared Edge Functions were deployed. The held legal boundary and zero active Holistic Foundations mappings were reverified after rollback-only hosted acceptance. See [the release report](PRODUCTION_CLIENT_LIFECYCLE_TECHNICAL_FOUNDATION_RELEASE_2026-10-08.md).
