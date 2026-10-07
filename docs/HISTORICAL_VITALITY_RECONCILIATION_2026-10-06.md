# Historical Vitality reconciliation

The review model now supports secure drafts and legacy workflow/report contacts through the same permission-guarded RPCs. No runtime Netlify scrape occurs. The private archive preserves original completed summary and coach flags without inferring question/answer keys or scoring. Secure drafts always take precedence over historical data for the same contact.

## Controlled operator process

1. Inspect only matching Netlify metadata; retain raw summaries in protected temporary storage, never Git or ordinary logs.
2. Match workflow, contact identity and original receipt/completion times before calling `private.reconcile_vitality_history` for an existing completed workflow.
3. For an unrepresented verified source, call `private.reconcile_unlinked_vitality_source` with original timestamps, complete status, summary, flags, pathway, identity and attribution. Duplicate email/phone/name checks stop automatic association. Existing-contact association requires an explicitly approved contact ID and recorded reason.
4. Verify the source digest and idempotent result, unchanged existing-contact checksum, original workflow timestamps/status and absence of new secure credentials.
5. Test authorized review and denied unassigned/private access. Record counts, not private answers, in the report.

Both operator functions revoke execution from anonymous, authenticated and service roles. Only the maintenance database operator can reconcile reviewed sources. The import creates a report awaiting coach review rather than marking the assessment coach-reviewed. Existing workflows/reports remain unchanged.

Applied production ledger versions: 20261007030224 and 20261007030817. These correspond to repository source migrations 20261007010000 and 20261007012000; do not replay. Existing secure resume architecture and optimized decoder are preserved.

Known limitations: David Fowler and Forest Gump completed sources are held for test/real classification. Older incomplete leads have no completed answer summary and cannot be reconstructed. Original summaries contain original submitted wording; no fabricated normalized answers or composite score is introduced.

Lead-only coverage after reconciliation: 12 distinct pre-Oct. 5 submitted emails; 9 map to an existing workflow or a reviewed alternate-email source. Three remain unrepresented: two held test-like completed sources, and one David-owned lead-only inbox with no completed submission evidence. No completion, private answers or workflow is invented for that lead-only record.
