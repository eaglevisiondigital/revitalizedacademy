# Staging acceptance gate

**Not yet executed against hosted staging.** Local automated verification is in [STAGING_TEST_RESULTS](engineering/STAGING_TEST_RESULTS.md). The original 166 active tests remain, with environment/artifact/provisioning cases added. This plan is not a production transaction authorization.

## Entry conditions

Record reviewed commit, separate Netlify site ID, actual deploy SHA/time, branch/context, new Supabase ref and explicit origin. Verify the frontend runtime, Edge runtime and database receipt all agree. No production ref/origin/merchant account. Check private artifacts return 404, public Forms are detected on the staging site, Auth redirects exactly match, secrets are server-only, synthetic SMTP/delivery allowlists work and no cron/webhook forwards to production. HTTP 200 is insufficient.

Create only controlled synthetic identities: primary adult, independently authenticated secondary adult, unrelated adult/household, known minor case, owner, admin, coach, finance and support. Use separately approved test inboxes and synthetic names/phone numbers. No live client copy, real charge, real-client invitation or blanket role promotion. Bootstrap the first staging owner through an explicit operator-controlled grant after creating its confirmed synthetic Auth user; record the grant. Ordinary app signup must never create owner privileges. Keep log/screenshot tokens, email links and legal contents private.

## Matrix

| Flow | Action / evidence required | Expected boundary |
|---|---|---|
| First-step contact | Enter first/last/email/phone and click initial Next; inspect separate Netlify and mirror records | Immediate independent contact capture before later questions; no duplicates from ordinary retry |
| Mirror failure | Block staging public-intake request while Netlify works | First step still succeeds; missing mirror is recorded, not falsely reported as full sync |
| Adult assessment | Complete approved adult variants and conditional follow-ups | Existing questions, helpers and routing; no invented scores |
| Child assessment | Complete ages 0/8/18, swap adult/child pathway | Male/Female only, no stale adult answers; approved fiber examples/helper text unchanged |
| Webinar priority | Submit synthetic leads, duplicate retry, then isolated 49→50→51 boundary | Accurate staging counter/capacity behavior; priority intent is not a paid seat guarantee; record any discrepancy |
| Enrollment/Foundations | Create synthetic enrollment using existing permissioned flow | Six-month Foundations commitment; no checkout URL; required MK7 relationship in test fixture |
| Signup/claim | Open primary invitation, sign up, confirm email, reopen link and claim | Normal Auth; no paid data or enrollment details before recipient/token verification |
| Restricted onboarding | Access agreements, billing/status, own account/notices/support directly | Paid dashboard/API/Storage remain denied; v2 bootstrap follows successful paid preflight only |
| Contract/version | Issue MK7 with synthetic merge values, render and compare source/template/version/hash | Required values resolved, exact issued hash binds signing; changes invalidate stale signer UI |
| Primary e-sign | Sign own slot, retry, attempt second slot/stale hash/cross-account | One authenticated adult/role; no overwrite or same-account dual signatures |
| Secondary adult | Invite allowlisted recipient; confirm own Auth email, redeem, sign | Wrong/unverified/minor/expired/revoked/replayed recipient denied; unrelated health/household data remains private |
| Synthetic payments | Record below requirement, satisfy, refund, reverse, repay; test reasoned owner/admin waiver | No real money; net payment and agreement gates independent; audit and history retained |
| Activation/restriction | Complete both gates; then payment shortfall and restoration | Full access only after claim + both gates; payment_suspended retains allowed surfaces; inactive accounts not resurrected |
| Staff invite | Invite controlled test inbox with restricted role | Staging redirect, no excessive permissions, provider send verified in test inbox |
| Password recovery | Exercise standard and custom branded staff reset links, expiry/replay | Staging landing/token exchange, password changes only intended account, no token leakage |
| Coach NDA | Invite coach after MK.1 seed; inspect company approval, issue/view/sign | Correct staff template/merge/hash; incomplete NDA blocks intended onboarding completion; staging notification only |
| Permissions/export | Direct API/RPC calls for all roles, unrelated contacts, inactive staff, malformed inputs | people.export denied to ordinary admin/coach/finance/support; only explicit permission + scope + atomic audit allows export |
| Family Hub | Own household vs unrelated and secondary-only signer, adult health consent | Approved family visibility; no automatic adult health sharing from household relationship |
| Member mobile | 390×844 plus desktop; keyboard, errors, long contract, signer form | No clipped actions/overflow; visible loading/error/restricted states and preserved branding |
| Ask ReVitalized | Deploy optional companion functions; synthetic authorized/denied requests | Existing retrieval/review only; generation provider remains unverified unless separately proven |
| Push readiness | Inspect routes/device/config without real push delivery | Report backend readiness separately from missing native/provider delivery |
| Apple Health / Health Connect | Inspect consent/sync contracts with synthetic fixture payloads | Do not claim native runtime sync without device/runtime evidence |
| Exposure/rollback | GET representative excluded SQL/docs/private files, wrong-host config, wrong CORS origin; rehearse staging-only rollback | 404 exclusions; 503/config rejection before service actions; older compatible staging release or disabled site |

Retain sanitized pass/fail evidence and exact tested versions. Cleanup targets only explicitly recorded synthetic records, through a reviewed process that respects audit/history constraints. No mass deletion or production data cleanup.

## Work assignment

RECOMMENDED THINKING LEVEL: HIGH

WORK TASK NEEDED

Validate the ReVitalized Academy isolated staging release after the team creates the new Supabase project and separate Netlify site using docs/STAGING_RELEASE_RUNBOOK.md on codex/staging. First verify actual control-plane site ID, linked repo/branch, deploy SHA/time, publish=dist, configured origin, separate Supabase ref and database component receipt. Do not modify production or use a preview connected to production. Verify hosted Auth/SMTP/test recipient restrictions and 404 exclusion of backend/private artifacts before any synthetic transaction. Run the matrix in docs/STAGING_ACCEPTANCE.md only with approved controlled synthetic accounts and synthetic ledger payments. Capture actual workflow outcomes, email landing/token behavior, privacy/RLS/export denials, v2 preflight, mobile layout and rollback evidence. Preserve MK7/MK.1 text/hashes and approved public flows. Distinguish code readiness from proven email, AI, native, wearable or push delivery. Return tested commit/site/project, each pass/fail, redacted evidence, unresolved hosted settings and a recommendation; do not certify production or send real-client messages.

## Primary Chat decision before a production release

RECOMMENDED THINKING LEVEL: HIGH

CHAT DECISION NEEDED

Current read-only production configuration has published MK7 and MK.1 templates but no program_agreement_requirements rows. The staging package includes a clearly labeled synthetic Foundations→MK7 requirement to exercise the already-approved contract gate. Confirm the intended production program-to-required-agreement mapping before any production release/backfill. Options: require the approved MK7 for each relevant program, or explicitly define program-specific required templates/exceptions with reasons. Existing lifecycle code enforces issued required agreements and independent payment gates; an absent mapping may leave the intended requirement unissued. Preserve existing signed records and approved contract text; do not invent new wording, grandfather clients or perform a bulk update. Identify exactly which programs require which approved version and how legacy enrollments should be reviewed. Codex will implement only the resulting approved production mapping in a separate package.


## Restricted privacy and health-provider acceptance additions

The current staging branch adds two forward migrations after the lifecycle migration. Hosted staging acceptance must also prove:

- an onboarding authenticated client can open the restricted Privacy Center and submit a privacy/data request while `member_paid_access_allowed()` remains false;
- a payment-suspended authenticated client can open the restricted Privacy Center, submit a privacy/data request and see their own ready privacy export metadata while paid-domain API/RLS remains denied;
- a manually inactive client cannot open the restricted Privacy Center or submit a new privacy request;
- ready privacy exports are delivered only through authenticated short-lived signed URLs from the private `privacy-exports` bucket; raw Storage paths are not displayed;
- the restricted Privacy Center does not offer provider disconnect;
- an active full-access member can disconnect only their own health provider and revoke only their own provider metric consents;
- a payment-suspended or unrelated user cannot use the full-member provider-disconnect RPC;
- provider disconnect clears stored credential reference and granted scopes without deleting historical health observations.

Record these outcomes separately from paid-member health/wearable-provider connectivity. Passing provider disconnect does not certify native HealthKit, Health Connect, Fitbit, Garmin, Oura, Withings or push delivery.
