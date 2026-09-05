# Build 71: restore the complete Vitality Assessment

The Build 70 website upload kept the newer website design but replaced the
assessment with the Build 55 placeholder. After contact capture, visitors could
no longer reach the full assessment.

This repair starts from current website commit `72b7ebc` and restores the approved
assessment from Build 68 commit `bfe62cb`. It restores assessment files,
assessment response caching, and the removed Build 65 disclaimer integration,
plus this note and the automated regression workflow.

Restored behavior:

- Separate immediate `vitality-lead` submission before health questions appear.
- Introduction, Whole-Person Snapshot, and all 12 Drivers (14 sections total).
- The disclaimer acknowledgment, completion guidance, testimonial disclosures,
  footer links on the homepage/Stories/Free Help, and disclaimer-page styles.
- Build 66 complete question cards and answer spacing.
- Build 67 validation that ignores disabled symptom branches, including the
  Systemic Detoxification and hormone pathways.
- Build 68 self, child, spouse, and someone-else selection; conditional identity,
  age, relationship and authorization fields; separate respondent/subject summary.
- Separate final `vitality-assessment` submission with readable coach summary.
- `Cache-Control: no-store` on the assessment route.

The assessment and disclaimer pages use the current approved v69 dark logo.
All Build 70 shared styles remain intact, with only the removed legal styles
appended. Newer homepage content, navigation, branding, and website design are
preserved; homepage edits restore the approved disclosure/footer link and refresh
asset versions. The Founders page and all image assets remain byte-for-byte intact.

The children's question bank remains an approval draft and is not implemented.
Unfinished health answers do not persist across a page refresh; saved lead
information remains independent. No automated scoring has been added.

Verification: run `NODE_PATH=<jsdom node_modules directory> node --test
tests/assessment-person.cjs`. All values are synthetic and form requests are
simulated. The new GitHub workflow runs these checks on assessment changes so a
future placeholder regression is reported. It does not enable branch protection.

For future edits, start from the latest `main` commit and carry forward these
assessment files together. Do not replace production with an older full-site ZIP.
