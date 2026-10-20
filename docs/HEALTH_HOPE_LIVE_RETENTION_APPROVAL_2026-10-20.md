**Implementation update, 2026-10-20:** The approved policy now has a locally validated forward implementation, documented in [activation readiness](HEALTH_HOPE_LIVE_ACTIVATION_READINESS_2026-10-20.md). All event SQL and collection/provider activation remain held. Actual vendor cleanup/retention and hosted acceptance are still required. The approval text below is preserved; its original implementation-status note is historical.

# Health & Hope Live — owner-approved event retention policy

Approval received directly from the owner in this task on October 20, 2026: **“Approve 12 months.”** The question approved was:

> Do you approve keeping identifiable event history for 12 months after each session, then removing participant identifiers and retaining only anonymous aggregate counts? Master contacts and consent/withdrawal records would follow their own approved policies; event deletion/export requests would need an authenticated, audited workflow before registration activation.

This resolves the duration and expiry decision. It does not imply consent to marketing, indefinite identifiable counts, erasure of shared master contacts, or alteration of private health records.

Before collecting any event registrations, implement and validate:

1. A per-session expiry at 12 months after the session, including related registration/attendance observations, request/job payloads, audit identifiers and any provider-held event data that requires an operational deletion process.
2. Removal of participant identifiers from expired event records; retained statistics must be anonymous aggregate counts, without a contact/person link. Any source/provider identifiers or indirect linkage must also be addressed.
3. An authenticated, authorized and audited export/deletion workflow for event participation data, integrated safely with the existing master-contact and consent policies. Do not delete shared contacts or private health records as a side effect.
4. Explicit tests for expiry boundaries, returning registrations, counts after expiry, withdrawn consent, deletion/export identity and staff authorization, and separation from health assessments.

The current candidate migration has restrictive contact references and does **not** implement this expiry/export/deletion workflow. It remains unapplied remotely. Registration and all event provider delivery remain held. Website-only publication does not collect event participant data and is independent of this remaining implementation gate.
