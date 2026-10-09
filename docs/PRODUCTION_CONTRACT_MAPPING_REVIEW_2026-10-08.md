# MK7 / MK8 production mapping review — 2026-10-08

Read-only authoritative comparison; no production/beta mutation or deployment. Approval recorded for disposable production inboxes rva-client@eaglevision.biz and dfowler4232@gmail.com, controlled acceptance only, no real charges, cleanup required. No identities/records created.

## Exact source and difference

Production MK7: published, ID adba4332-becb-44d9-91f7-851cc1c129ec, hash 3a470c6508760ba4a61475d6a9f310e1456a094a906b7499d261ad285492820d.
Beta MK8: published, ID 57cf5277-516c-42c2-892a-248007d619b6, hash 5eebb464eb73ead9f45381f15b88f8412f585b8a364768705027dfe227f4f836.
Beta MK7 is retired and text-identical to production MK7. Production still has zero active required Holistic Foundations mappings. Production catalog commitment is six months.

Exact full text: [MK7](contract-review-2026-10-08/MK7-exact.txt), [MK8](contract-review-2026-10-08/MK8-exact.txt).
The only content difference is section 3's first sentence:
- MK7: “The Client(s) will enroll in the Program as a {{program_level}} client as described in Appendix A.”
- MK8: “The Client(s) will enroll in the {{program_name}} program as described in Appendix A.”
Merge schema substitutes required program_name for program_level. All payment/cancellation/refund/term text is unchanged. Verified exact replacement equality, not inferred from version names.

## Provisions — identical in both versions except program naming

| Topic | Current text and limitation |
| --- | --- |
| Payment structure | §3 monthly_fee; §3.2 good_faith_deposit followed by adjusted_monthly_payment. No hard-coded $89 or $960. Both require financial merge values. |
| Recurring billing | Monthly fee/payments stated, but charge date, automatic debit authorization and post-term continuation are not expressly specified. |
| One-time payment | No one-time/full-payment clause replacing the monthly/deposit schedule. Neither safely represents $960 one-time unchanged. Appendix A/special conditions do not automatically supersede conflicting monthly clauses. |
| Term / commitment | §3.1 duration is term_duration placeholder. Approved repository decision and production catalog say six months for Foundations. Contract does not itself spell out six-month minimum. Confirm $960 covered service period explicitly; do not infer a twelve-month period from its price. |
| Cancellation | §4.3 after first 30 days, no full refund including unused program portion; discretionary partial refund for advance payments/services not rendered, excluding deposit. No explicit notice method or treatment of cancellation in first 30 days, beyond monthly refund request clause. |
| Refunds | §4.1 may REQUEST a refund within three days of a monthly payment; after three days no refunds guaranteed. This is not an unconditional refund guarantee. §4.2 deposit non-refundable under any circumstances. §4.3 later partial refunds discretionary. No dedicated full-payment refund window. Deposit amount remains unspecified placeholder. |
| Remaining commitment | §4.4 installment clients canceling after 30 days owe for services already rendered; no future payments for services not delivered. Relationship between this wording and six-month minimum needs a Primary Chat policy decision. Do not assume early cancellation still owes all six months. |
| Renewal | No explicit automatic renewal, renewal price, extension or opt-out notice clause. |
| Access termination | §3.1 ties agreement termination to cancellation/refund policy; no precise dashboard/content access cutoff, failed-payment suspension date, refund-triggered access rule or retained account/history description. Existing app access rules are not equivalent to approved contract wording. |

## Exact recommended mapping — proposal, not approval

MK7 → historical/legacy issued agreements only; no new Holistic Foundations billing-option mapping.
Reason: generic Level wording and same monthly provisions as MK8, not a pay-in-full version. Preserve old signed evidence.

MK8 → proposed Holistic Foundations Monthly — $89/month, subject to Primary Chat confirming six-month term, deposit (if any), cancellation/refund/renewal/access terms and currency.
Reason: actual program name and compatible monthly structure; no production mapping performed.

Holistic Foundations Pay in Full — $960 one-time → neither current MK7 nor MK8. Prepare a separately approved version/billing-specific revision with explicit one-time total, coverage period, no recurring charge, deposit treatment, cancellation/refund/renewal/access rules. Revision name is not invented or published here.

## Primary Chat decision prompt

RECOMMENDED THINKING LEVEL: HIGH
CHAT DECISION NEEDED

The authoritative MK7/MK8 comparison shows only program naming changed; both still say monthly fee and deposit followed by monthly payments. Approve or correct this proposal:
1. Preserve MK7 for history; use MK8 as basis for new HF $89/month only.
2. Confirm six-month minimum versus §4.4 cancellation/undelivered-service exception, any deposit, cancellation notice/first-30-day policy, monthly refund request rights, post-term renewal and access cutoff.
3. For $960 one-time, confirm covered duration, currency, whether any separate deposit applies, specific refund/cancellation terms, renewal/no recurring charges and access cutoff. Approve exact new wording/revision rather than mapping it to unchanged MK7/MK8.
Disposable production inboxes are approved; no real charge. Final deployment approval text will follow a complete tested mapping/revision candidate. No deployment is authorized now.

Client lifecycle remains parked while the newly requested production Vitality Save/Resume reliability defect is investigated. No unrelated implementation changes made during comparison.
