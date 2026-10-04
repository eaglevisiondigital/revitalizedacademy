# Remaining hosted beta acceptance — 2026-10-04

**BETA NOT READY: normal owner sign-in is the immediate blocker.** The prior benefit/inbox policy questions are resolved. This is an interim continuation receipt, not completed lifecycle acceptance.

## Release and verification

Deployed SHA `86a0bf34fff4f08ef19567fd00172346adb095da`; staging deploy `6ac2cd1a0ce4124aafbdf39d`; site `071b252e-a922-4846-a784-8dca1edad377`. [Staff portal](https://revitalizedacademy-staging.netlify.app/portal/) / [member workspace](https://revitalizedacademy-staging.netlify.app/member/). All 23 checked staging assets still match the exact accepted build. No new build/deploy or application changes.

Staging Supabase `bvooallokgfktssadsrv`: ledger `20261004214656` confirmed already applied. No migration replay or Edge redeployment; accepted staff-management v5 retained. Production site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06` remains deploy `6ac036d3b48eac0008568e00`; all 20 public fingerprints match. No production writes. [Fresh fingerprint receipt](../deployment-evidence/2026-10-04-beta-remaining/public-verification.json).

## Approved benefits, not yet applied

Existing active **Holistic Foundations** uses primary key/program code `holistic-foundations` and a six-month commitment. No separate program UUID exists in `program_catalog`.

| Key | Label | Limit | Cadence | Intended state | Scope |
|---|---|---|---|---|---|
| `nutrition_plans` | Meal Plans | NULL | none | active | Synthetic A/B memberships only |
| `fitness_plans` | Workout Plans | NULL | none | active | Synthetic A/B memberships only |

These neutral values are supported by the hosted schema. No benefit rows exist yet because synthetic memberships have not been created. Program templates and membership entitlements remain at zero. No tracking grant, global template or existing-member reconciliation. Record exact synthetic membership IDs after legitimate owner UI enrollment. Preserve payment, agreement, claim and activation gates. Existing documented staging synthetic ledger payments/reasoned owner waivers remain the only eligible payment mechanisms; neither was used in this continuation.

## Approved identities and allowlist

Client A: `dave+rva-client-a@eaglevision.biz`; Client B: `dave+rva-client-b@eaglevision.biz`; scoped staff: `dave+rva-beta-staff@eaglevision.biz`. Read-only hosted queries confirm none has an Auth user or contact. Existing owner/member identities are preserved.

At **2026-10-04 22:33:58 UTC**, the staging Supabase dashboard saved this exact approved allowlist, preserving both original recipients:

`dave@theboss.biz,dave@eaglevision.biz,dave+rva-client-a@eaglevision.biz,dave+rva-client-b@eaglevision.biz,dave+rva-beta-staff@eaglevision.biz`

Original SHA-256: `68a584bda0aeaab2f2e7f0723b086391db2ce8de925c71bb0dac2bf7aff52752`.

Saved SHA-256: `9642867372ec8b16d549d313fb88772080557260a2fc7744a0ddf80a1595e820`, verified against the exact five-address value and visible dashboard row. No wildcard, SMTP transport or unrelated setting change. Retained for the unfinished acceptance window; revisit cleanup afterward. This does not prove Auth SMTP or external delivery. No invitation/recovery sent. If alias delivery fails, stop that portion and obtain three fresh inboxes; do not extract invitation tokens from the database.

## Hosted results still pending

The owner tab remains at normal sign-in after the previously accepted logout. Owner email is prepared; no password was read, changed or submitted. A normal owner sign-in handoff is pending. Another existing portal tab also shows sign-in and does not target the approved owner; it was not submitted or repurposed.

| Required gate | Result |
|---|---|
| Client A/B invitation, delivery, activation, onboarding, login | Not executed; owner sign-in required |
| Distinct A/B identity and membership benefit access | Not executed |
| Scoped staff invitation/delivery/activation/access/scope | Not executed |
| Client and staff recovery, actual external delivery | Not executed |
| Staff revocation and applicable client deactivation | Not executed |
| Meal/workout assignment → Client A detail | Not executed |
| Client B wrong-client denial and staff contact-scope denial | Not executed |
| Owner → A → B → staff → A → owner privacy transitions | Not executed |
| Hosted private-DOM clearing and stale-response isolation | Pending |
| Hosted member/staff/activation/assignment responsive checks | Pending at 1440×1000, 768×1024, 390×844 |
| Fresh authenticated console certification | Not claimed |

New-password entry and legal acceptance require user interaction. Do not manufacture access or broaden permissions to obtain coverage.

## Retained acceptance and totals

[Accepted hosted report](BETA_HOSTED_ACCEPTANCE_2026-10-04.md): build313 files; syntax77/77; frontend473 total =446pass/0fail/27historical skips; beta runtime23/23 source and23/23 exact-built; native PostgreSQL17.11 215/215; Edge30/30 and19entrypoints typechecked. Member Health & Progress and Nutrition Targets + Trends retain their accepted passing status. Nine historical agreement-origin fixture failures were resolved by explicit fixture setup without weakening application gates. Prior hosted owner/content responsive27checks and post-repair staff console0warnings/errors remain accepted. These are retained results, not new suite runs or proof of pending synthetic-member coverage.

## Records and cleanup

No new hosted business records, Auth users, memberships, assignments, invitations, nutrition entries, payment rows, agreements or grants. Counts remain2Auth users,1staff,1client-access row. The only hosted write was the approved exact-recipient staging allowlist.

Every existing disposable record and child ID remains in the [cleanup receipt](../deployment-evidence/2026-10-04-beta-hosted-release/cleanup-receipt.json): food `c36fdb17-f4f9-48bf-8b12-0e5c136e249e` inactive; recipe `766f614f-8e5f-4c44-b5a9-f9e7f65611e6`, meal plan `a3cfe890-13f0-40d3-84a5-691098d167b7`, exercise `1c65a14a-7f21-4ef8-859f-e60e95dda494`, workout `a348bbd2-83d0-488c-a622-0de04b390513`, fitness program `c629f0dd-d12a-466d-bae8-3a475e10ca2f` archived. Four ingredient/composition/schedule rows remain for audit. No republishing or hard deletion in this continuation.

## Next action

Resume after normal owner sign-in. Create/invite only the approved synthetic identities through intended UI, configure only their legitimate membership IDs, prove actual delivery and complete the existing acceptance checklist. No new policy decision or feature package is needed. Primary Chat alone issues the Justin/Elle green flag after every gate passes.

BETA NOT READY
