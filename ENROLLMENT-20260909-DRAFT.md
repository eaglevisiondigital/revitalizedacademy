# Enrollment application — review draft (2026-09-09)

Status: REVIEW ONLY — do not merge or activate as a live application yet.
Branch: feature/enrollment-application-20260909
Baseline: da037efe4a7382db4767def9cce67582b617cc05
Page blob: d12f3d013db316d506c78fff569b7f33153f562b

## Source and scope

Dave supplied `New Lead Application Form.jpg`, showing the original Apply To Join ReVitalized Academy form. This draft replaces only `enroll.html` on this feature branch. Existing Start Your Journey links already target that path; no shared page, image, stylesheet, assessment route, assessment file, or disclaimer was edited. No change was made to main or to the existing production placeholder.

All 13 original question topics are represented: full name, email, phone, referral source, sex, age, six-month goal, desired start timing, expectations from the meeting, monthly investment, biggest roadblock, commitment (five stars), and program confidence. Grammar and grouping were cleaned up, without inventing budget tiers or program-confidence answers. Sex choices are Male and Female.

The supplied screenshot has no street-address question. An optional, collapsed location section was added for the requested country/region selection: United States or Canada only; 50 U.S. states plus District of Columbia; all 13 Canadian provinces/territories. Selecting a new country clears the previous region. Long region names and the selected country are also written beneath the control so the selection remains readable on narrow screens. Name/email/phone/country/region use browser autocomplete tokens; no applicant's personal details are prefilled by the page.

The design uses emerald #154734, cream #FCF5EE, gold #B18845, serif headings, and responsive native inputs. The header references the existing approved logo unchanged. Offline screenshots show the text fallback because the logo asset was not available in the local runtime. The standalone preview's relative home/disclaimer links require the website context; they are not included in the single HTML artifact.

## Intentionally unfinished

1. Monthly investment: copy the actual options and currency wording from the original opened dropdown.
2. Program confidence: copy the actual options from the original opened dropdown.
3. After-submit booking handoff: confirm the intended destination and exact behavior. No booking URL was verified.
4. Submission delivery: preserve the existing Netlify form name `enrollment` when activating; verify form detection and notifications to contact@revitalizedacademy.com before claiming delivery works. No real submission was sent in this work.

Both unknown dropdowns are disabled and clearly labeled in the draft. The review button validates the known fields but does not transmit, save, pay, enroll, book, or claim success. `method="dialog"` is deliberately inert outside a dialog; the draft has no Netlify form registration, POST code, analytics, localStorage, or sessionStorage. JavaScript also prevents submission. The page asks reviewers to use sample information.

Before launch, replace this deliberate review-only handling with a real, validated POST workflow; only show a received message after confirmed server acceptance; retain entered data on errors; prevent accidental double submissions; finish the booking step; and remove the review banner/noindex setting as appropriate. Review privacy/contact-consent and data-retention handling with the owners. Do not collect detailed medical records on this public lead form.

## Executed checks

Local Chromium checks passed at 320, 375, 390, 768, 1024, and 1440 pixels: no horizontal overflow; original known controls; required-field validation; numeric age validation; five-star mouse and keyboard interaction; U.S./Canada region lists; stale-selection reset; readable long province name; no storage calls; no network form submission, including with JavaScript disabled. No end-to-end submission or email/booking test was performed. WebKit was unavailable in the local runtime, so Safari is not claimed as tested.

Run: `python tests/enrollment-preview.py` with Python Playwright and a Chromium browser installed. The test renders local HTML with `set_content` and sends no data to the production site. Output defaults to `qa-output/enrollment/`; override with `ENROLLMENT_QA_OUTPUT`.

## Reference documentation

- Netlify form setup: https://docs.netlify.com/manage/forms/setup/
- Netlify form notifications: https://docs.netlify.com/manage/forms/notifications/
- Canada Post region names: https://www.canadapost-postescanada.ca/cpc/en/support/articles/addressing-guidelines/symbols-and-abbreviations.page
