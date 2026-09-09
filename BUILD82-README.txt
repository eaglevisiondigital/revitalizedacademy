BUILD 82 — PROGRAMS + ENROLLMENT EXPERIENCE
Date: 2026-09-09

PURPOSE
Replace the Phase One enrollment placeholder with a complete premium package-selection and enrollment experience using the latest ReVitalized program/pricing information supplied by Justyn & Elle.

PUBLIC PROGRAMS INCLUDED
1. Holistic Foundations — $25/week, family membership, up to 5 profiles.
2. Vitality Accelerator Cohort — $1,000, 40-day group-coaching cohort.
3. Vitality Accelerator — $2,000, 40-day private + group coaching.
4. Total Wellness Intensive 6-Month — $7,500, personalized ongoing coaching.
5. Total Wellness Intensive 12-Month — $30,000, signature private coaching with Justyn & Elle.

UX
- Existing Start Your Journey links continue to use enroll.html.
- enroll.html is now the premium program comparison + enrollment page.
- Every package card uses the approved CTA: “Select This Package & Start Your Journey”.
- Selecting a package scrolls to the enrollment form, preselects the program, and updates the visible selection summary.
- Query-string deep links are supported: enroll.html?program=<slug>.
- Responsive layouts included for desktop, tablet, and mobile.

ENROLLMENT
- Netlify form name remains “enrollment”.
- Keeps lead-level fields only; no detailed medical history added.
- Adds package selection, enrollment-for, why-now, referral source, and acknowledgement.
- Final fit/payment/agreement/start-date language is intentionally explicit because checkout/payment integration is not part of this build.

FILES
- enroll.html — replaced Phase One placeholder with full programs + enrollment page.
- css/enroll82.css — new isolated visual layer.
- js/enroll82.js — new package-selection handoff logic.

ASSESSMENT PROTECTION
No assessment-owned files are changed by Build 82. consult.html, js/vitality55.js, css/vitality55.css, disclaimer.html, tests/assessment-person.cjs, assessment regression workflow, and BUILD71-ASSESSMENT-RESTORE.md remain untouched.
