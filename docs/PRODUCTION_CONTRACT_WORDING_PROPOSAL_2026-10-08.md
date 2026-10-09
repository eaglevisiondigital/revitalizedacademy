# Production contract wording proposal — 2026-10-08

Status: Superseded for final wording by `PRODUCTION_CONTRACT_RECOMMENDATION_2026-10-08.md` after review of current official Canadian and Québec consumer-contract guidance. This remains a local historical drafting artifact only. It did not publish an agreement, create a production mapping, apply a migration, deploy code, send mail, or create a client record.

## Approved mapping and business facts

- MK7 remains historical/legacy only and must not be mapped to new Holistic Foundations enrollments.
- MK8 is the proposed agreement for Holistic Foundations Monthly at CAD $89 per month.
- Initial term: six months.
- The first monthly payment is due upon activation.
- No good-faith deposit applies.
- The six-month initial term is a minimum payment commitment.
- After the initial term, the proposed model is month-to-month continuation unless cancelled under approved notice terms.
- A failed payment may suspend program access until the account is brought current.
- CAD $960 pay in full requires a separate billing-specific agreement revision. It is not MK7 or unchanged MK8.

## MK8 monthly — exact proposed replacement language

Replace current sections 3 through 4.4 with the following. Sections 5 through 16 remain unchanged unless separately reviewed and approved.

### 3. SERVICES & FEES.

The Client(s) will enroll in the {{program_name}} program as described in Appendix A. The monthly fee is CAD $89.00. The first monthly payment must be received before Program access is activated. The date on which the first monthly payment is successfully received and Program access is activated is the “Activation Date.” One monthly payment is due on each monthly anniversary of the Activation Date during the Initial Term. No good-faith deposit is required for this enrollment.

### 3.1 Initial Term and Minimum Commitment.

This Agreement becomes effective on the Effective Date. The initial service and payment term begins on the Activation Date and continues for six consecutive months (the “Initial Term”). The Client's agreement to the Initial Term is a minimum financial commitment consisting of six monthly payments of CAD $89.00, for a total minimum commitment of CAD $534.00. A cancellation request made during the Initial Term does not release the Client from monthly payments remaining in the Initial Term, except where applicable law requires otherwise or the Company agrees otherwise in writing.

### 3.2 Month-to-Month Continuation.

After the Initial Term, this Agreement will continue on a month-to-month basis at CAD $89.00 per month unless cancelled by either Party by providing {{cancellation_notice_period}} written notice through {{cancellation_notice_method}}. Cancellation after the Initial Term becomes effective at the end of the applicable notice period. No additional minimum term begins solely because the Agreement continues month to month.

### 3.3 Payment Method Authorization.

The Client is responsible for each payment when due. This Agreement records the Client's payment obligation but does not, by itself, authorize the Company to debit a bank account or charge a payment card automatically. Any recurring electronic payment authorization must be presented and accepted separately through the approved payment process.

### 3.4 Special Conditions.

{{special_conditions}}

### 4. REFUND, CANCELLATION, AND ACCESS POLICY.

By enrolling in the Program and signing this Agreement, the Client acknowledges and accepts the following terms regarding payments, cancellations, refunds, and program access.

### 4.1 Monthly Payment Refund Requests.

The Client may request a refund within three calendar days after a monthly payment is made. A request does not guarantee a refund. After the three-day request period, payments are non-refundable except where applicable law requires otherwise or the Company approves a refund in writing. Any approved refund during the Initial Term does not release the Client from the remaining minimum commitment unless the Company's written approval expressly states that it does.

### 4.2 No Deposit.

No good-faith deposit is required for this Holistic Foundations Monthly enrollment. Any later deposit requirement must be agreed to in a written amendment signed by both Parties.

### 4.3 Cancellation During the Initial Term.

The Client may provide written notice of cancellation during the Initial Term. Unless applicable law requires otherwise or the Company agrees otherwise in writing, the cancellation becomes effective at the end of the Initial Term, the remaining monthly payments in the six-month minimum commitment remain due, and program access remains available through the end of the Initial Term while the Client's account is current and the Client remains in compliance with this Agreement.

### 4.4 Cancellation After the Initial Term.

After the Initial Term, either Party may cancel the month-to-month continuation by providing the written notice described in section 3.2. Monthly payments remain due through the effective cancellation date. No monthly payment will be charged for a billing period beginning after the effective cancellation date. Program access ends on the effective cancellation date, subject to any access or record-retention rights required by applicable law.

### 4.5 Failed Payments and Temporary Access Suspension.

If a payment is not received when due, the Company may temporarily suspend program access until the past-due amount is paid. A temporary suspension does not cancel this Agreement, waive an amount due, extend the Initial Term, or release the Client from the minimum commitment. Access will be restored after the account is brought current, subject to normal processing time and the Client's continued compliance with this Agreement.

## MK8 implementation consequences

If the wording above is approved, the MK8 merge schema should no longer require `monthly_fee`, `term_duration`, `good_faith_deposit`, or `adjusted_monthly_payment` as editable staff inputs for this fixed monthly product. The rendered agreement should use the fixed approved CAD amounts and six-month term. `program_name`, client identity, effective/activation date, approved cancellation terms, special conditions, company approval, and Appendix A remain controlled merge values. Historical MK7 text and issued evidence must remain unchanged.

The exact cancellation notice period and method are not yet approved. MK8 must not be published or mapped while `{{cancellation_notice_period}}` or `{{cancellation_notice_method}}` is unresolved.

## Pay-in-full draft — approved facts only

This is a separate unpublished billing-specific revision. Its version label is intentionally unassigned.

### 3. SERVICES & FEES.

The Client(s) will enroll in the Holistic Foundations program as described in Appendix A. The Client agrees to pay a one-time fee of CAD $960.00 before Program access is activated. The date on which the one-time payment is successfully received and Program access is activated is the “Activation Date.” No good-faith deposit is required. The CAD $960.00 fee is a one-time payment and does not authorize or create a recurring monthly charge.

### 3.1 Coverage Period.

The one-time fee provides access to the Program for {{approved_pay_in_full_coverage_period}}, beginning on the activation date. The coverage period must be approved before this agreement revision is published.

### 3.2 Renewal.

Use exactly one of the following after Primary Chat approval:

**Option A — no automatic renewal**

This Agreement and the associated paid access end when the coverage period expires. The Agreement does not renew automatically. Continued participation requires a new written agreement and payment accepted by the Client.

**Option B — approved renewal offer**

At the end of the coverage period, the Program will {{approved_pay_in_full_renewal_behavior}}. The Company must disclose the renewal price, frequency, effective date, and cancellation procedure before obtaining the Client's separate renewal consent. The original CAD $960.00 payment does not authorize a renewal charge.

### 3.3 Payment Method Authorization.

This Agreement records the Client's obligation to make the one-time payment but does not, by itself, authorize the Company to debit a bank account or charge a payment card. Electronic payment authorization must be presented and accepted separately through the approved payment process.

### 3.4 Special Conditions.

{{special_conditions}}

### 4. REFUND, CANCELLATION, AND ACCESS POLICY.

The following four items must be approved together before publication: cancellation notice, refund treatment, renewal behavior, and access treatment after cancellation or refund.

### 4.1 Cancellation Notice.

The Client may request cancellation by providing {{approved_pay_in_full_notice_period}} written notice through {{approved_pay_in_full_notice_method}}. The effective cancellation date will be determined under the approved cancellation policy stated in this Agreement.

### 4.2 Refund Treatment.

Use exactly one approved policy; do not combine these alternatives:

**Option A — no contractual refund after the request window**

The Client may request a refund within three calendar days after the one-time payment is made. A request does not guarantee a refund. After that period, the one-time fee is non-refundable except where applicable law requires otherwise or the Company approves a refund in writing.

**Option B — approved unused-service calculation**

If cancellation becomes effective before the end of the coverage period, the Company will determine any refund using {{approved_pay_in_full_refund_formula}}. The agreement must state whether the calculation is mandatory or discretionary and identify any non-refundable amount before publication.

### 4.3 Effect of Cancellation or Refund on Access.

Use the access rule selected by Primary Chat:

**Option A — access through paid coverage unless refunded**

If the Client cancels without receiving a refund, program access continues through the end of the paid coverage period. If the Company issues a full refund, program access ends when the refund is approved. If the Company issues a partial refund, program access ends on {{approved_partial_refund_access_date}}.

**Option B — access ends on effective cancellation**

Program access ends on the effective cancellation date. The approved refund policy must state how the unused portion of the one-time fee is handled.

### 4.4 Failed or Reversed Payment.

If the one-time payment fails, is reversed, or is charged back, the Company may suspend program access while the payment remains unresolved. Suspension does not create a recurring payment obligation. Access may be restored after the payment is successfully resolved, subject to normal processing time and the Client's continued compliance with this Agreement.

## Remaining Primary Chat decisions

1. Monthly cancellation notice period.
2. Monthly cancellation notice method.
3. Pay-in-full coverage period.
4. Pay-in-full cancellation notice period and method.
5. Pay-in-full refund option and, if applicable, formula.
6. Pay-in-full renewal option and exact behavior.
7. Pay-in-full access option, including the partial-refund access date if needed.

No release candidate should publish or map either revised agreement until the applicable unresolved values are replaced with approved final text and regression-tested against the exact rendered agreement.
