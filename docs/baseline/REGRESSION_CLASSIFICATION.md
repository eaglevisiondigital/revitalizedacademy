# Classification of the 28 original failing tests

The unchanged Build 192 baseline had 44 passes and 28 failures. This ledger classifies each failed test, not each assertion hidden behind its first failure. No product changes were made to satisfy historical snapshots.

- Category 1: 27 build-specific byte/hash/markup tests retired explicitly with `test.skip`; original bodies retained.
- Category 2: one enrollment file corrected to the approved six-month commitment, current 12-Month Intensive label and current application-received confirmation. It now passes all remaining assertions.
- Categories 3–5: no original failing test was identified as a genuine regression, environment failure or unresolved decision. The new backend tests separately exposed genuine authorization/readiness/onboarding defects, fixed in the forward migration.

Build 76–81 checks asserted that only one old page region changed, or matched that historical package’s entire shared files, indentation, asset query strings and widget layout. Those conditions cannot remain true across later approved builds. The current homepage has Build 85 webinar markup, and the independent `webinar.html` contains the approved 50-seat Netlify priority registration. The current public behavior and untouched assessment files now have focused checks in `tests/current-regression.cjs`, alongside all 20 existing assessment scenarios. Legacy stored visual-check JSON is historical evidence, not a newly executed browser test. Retiring snapshots does not certify visual parity with inaccessible original approvals.

| Original failing test | File | Classification | Disposition |
|---|---|---|---|
| every byte outside the authorized coaching region and its asset includes is unchanged | `tests/coaching76-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| assessment popup is byte-for-byte unchanged | `tests/coaching76-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| footer and results disclaimer are byte-for-byte unchanged | `tests/coaching76-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| all assessment routes and includes are preserved | `tests/coaching76-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| shared health/results disclaimer CSS is unchanged | `tests/coaching76-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| original menu, video and Longevity Matrix JS is preserved; replacement JS parses | `tests/coaching76-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| approved art, unique asset references and two responsive enrollment links exist | `tests/coaching76-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| tests/enrollment82.cjs | `tests/enrollment82.cjs` | 2. stale requirement | Corrected; active |
| existing Build76 app prefix is preserved | `tests/family-health77-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| other family sections and footer are unchanged | `tests/family-health77-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| approved assets, markup and code match the checked package | `tests/family-health77-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| protected baseline files are untouched when present | `tests/family-health77-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| only the authorized card section and CSS include changed | `tests/family-health78-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| approved build artwork and files match validated output | `tests/family-health78-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| existing shared resources remain unchanged when present | `tests/family-health78-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| all packaged runtime files have the expected hashes | `tests/family-health79-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| shared resources are unchanged when checked in the installed site | `tests/family-health79-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| existing footer and disclaimer are unchanged | `tests/free-help80.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| only the webinar section and its new stylesheet include changed | `tests/webinar81-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| existing footer and disclaimer link are unchanged | `tests/webinar81-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| assessment popup and script include are unchanged | `tests/webinar81-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| all assessment buttons preserve their destinations and markup | `tests/webinar81-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| shared stylesheet, including disclaimer rules, is unchanged | `tests/webinar81-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| shared JavaScript is unchanged | `tests/webinar81-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| webinar form fields, validation and Netlify configuration are preserved | `tests/webinar81-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| the three existing benefits retain their original wording and icons | `tests/webinar81-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| benefits and signup are both in the new conversion row | `tests/webinar81-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
| new layout styles are scoped only to this webinar | `tests/webinar81-integrity.cjs` | 1. stale expected build hash/markup | Retired historical snapshot; body preserved |
