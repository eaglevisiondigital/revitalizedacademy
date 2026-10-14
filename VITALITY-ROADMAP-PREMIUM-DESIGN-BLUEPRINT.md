# REVitALIZED ACADEMY — VITALITY ROADMAP PREMIUM EDITORIAL UX BLUEPRINT
Product/art direction v1, 2026-10-14. Source references: founder's six-page "Vitality Roadmap Results" visual, Justyn's HTML interactive demo, October 12 developer handoff v0.14, approved Academy website branding. This is a visual/experience specification, not an approval of demo scores or clinical scoring.

## North star

Make an interactive Roadmap feel like a premium, personalized print wellness report that happens to be digitally interactive: editorial, warm, sophisticated, practical and worthy of saving. The same approved version should drive the screen and the printable/downloadable report. **Free for the recipient without coaching subscription**, with deeper optional coaching tools layered on without taking away the original.

## Design tokens and rules

- Primary emerald: #154734. Deep layered emerald: #0D3025. Approved cream: #FCF5EE. Gold: #B18845 with #D8A62A highlights. Paper card: #FFFEFA. Warm stroke: #E4DDD2. Muted sage: #ECF1E9.
- Use the approved actual Academy logo asset already on the site. Do not redraw, regenerate or replace it with words.
- Editorial serif headlines; normal website Inter/system sans for labels, explanations, input controls. Headline weight light-to-medium editorial, body readable and clear.
- Iconography: unified 1.5-2px stroke, rounded joins, outlined rather than filled; emerald line with occasional gold accent. Semantic icons only. No unrelated emojis, generic mismatched icons or stylistically discordant artwork.
- Imagery: authentic approved family/lifestyle photography integrated as a full-width cover/photo band, feathered/curved emerald treatment as in the PDF. Use existing approved site image assets for preview and confirmed original licensed source file for production; do not crop people out of the flattened composite supplied in chat or claim that the composite contains separable production assets.
- Background like textured warm paper, restrained and accessible: no noise that degrades readability. Borders 1px warm neutral, subtle shadow, rounded 12-20px. Generous vertical spacing and meaningful white space.
- Gold thin rules under section eyebrow labels; no overabundance of emerald color blocks, excessive gradients, badges or animations.
- Controls 44px+ touch targets, distinct focus, accessible contrast, reduced motion, chart text alternatives and keyboard operation.
- Mobile: progressive single-column editorial flow, 2-column rings, no sideways scroll, tappable Driver accordion, sticky navigation only if space allows.

## Information architecture

Keep three direct navigation tabs in the founder HTML: **My Overview** / **My 12 Drivers** / **My Action Plan**. Treat PDF pages as compositions within these tabs rather than creating six disconnected screens.

### 1. Cover hero (PDF page 1)
- Brand header with authentic approved logo, small "Vitality Roadmap" descriptor, clear report preview/print controls.
- Fictional example in preview: "Your Vitality Roadmap", "Prepared for Sample Member", warm personal introduction, discreet visual SAMPLE label.
- Visually place a photographic family/lifestyle strip into the deep emerald cover panel, with emerald-to-photo transition/curved ribbon detail; no distorted faces, no artificial-looking images.
- Live report uses recipient's approved legal/display name, assessment date, reviewer approval date and report version; access role controls.
- Never show invented personal data on a production report.

### 2. Executive Summary (PDF page 2)
- Large editorial overall score ring and explicit denominator plus an APPROVED/ILLUSTRATIVE state label. Spectrum strip if official stage available.
- Three concise icon-led summary facts: existing strengths, useful opportunities and achievable first actions. Preserve founder priorities ranking but do not solely rank by lowest numerical score unless approved.
- The overall score is determined only by the validated adult scoring configuration. Wise Budgeting is separate from health-stage aggregation per handoff. Any uncertainty or incomplete evidence must be visible.
- In preview, retain Justyn's fictional 68/100 with prominent fictional label; do not mix it with the separate six-page PDF's illustrative 72/100.

### 3. Whole-Person Snapshot (PDF page 3)
- 4 x 2 large circular progress dials in the PDF aesthetic, each containing an understated relevant SVG line icon and a score with a text label.
- PDF example's eight category names (Energy, Digestion, Sleep, Stress, Focus, Metabolism, Movement, Overall Well-Being) are VISUAL EXAMPLES only and are not declared mapped production fields. **Do not fabricate a mapping between eight example categories and 12 actual Drivers.**
- For the concept prototype, show eight *explicitly featured* entries from Justyn's same fictional twelve-Driver list, each retaining the exact existing example score, and a link to all twelve.
- Strong text alternatives and status words, never rely on color alone.
- Potential later 8-domain aggregation needs separately reviewed founder specification.

### 4. Top Areas of Focus (PDF page 4)
- Present three ranked concern/priority cards styled as cream/paper editorial modules: gold round number, tailored outline icon, short headline, "what your answer suggests", optionally approved score and next-step deep-link.
- Include context explaining why this concern matters and uncertainty; each links to the corresponding actual Driver accordion.
- In the free report, users see all three recommendations with no coaching paywall. A coach may review, correct and approve copy before release.
- If a recommendation is not supported/approved, show "Pending review" rather than an invented explanation.

### 5. Nutrition & Lifestyle Insights (PDF page 5)
- Four balanced responsive insight rows with icons, short explanatory text and a slim horizontal green/gold bar; suitable for The Living Diet, Functional Training, Holistic Recovery and Momentum Regimens in the *fictional preview*, with their existing example scores.
- Real production content must be derived from the approved Driver data, and wording must not present unvalidated category scores as factual.
- Clicking an insight navigates to a relevant Driver; no charts that don't trace back to data.

### 6. My 12 Drivers (founder demo interaction)
- Keep ALL actual 12 titles and detail panels, including Wise Budgeting's special numerical role. Preserve search, filter by red/yellow/green, expand all, click from overview, individual score/strength/what answers suggest/coach notes/available actions.
- Upgrade row styling to printed report typography, slim medal numbers, SVG category icon, subtle gold accent, score and explicit status word; generous expanded two-column details.
- Screen reader text for chart and scores; keyboard tab, accordion and search controls. Do not copy a reported life-impact item to multiple symptoms or present unknown as zero.

### 7. Your First Action Steps and My Action Plan (PDF page 6 + founder demo)
- Show numbered, individual action rows with thin gold connector and relevant icon, rather than generic application tasks. Preserve add/remove/check, "actions tried" progress, reset and cross-links to Drivers.
- The action tracker counts actions tried, not a new measured health outcome. No algorithm recalc due to checking a box.
- Add the 7-day observation, 30-day consistency, 90-day review journey to give context, not unsupported prescriptions.
- Free tier: foundational checklist and report access remain available after coaching cancellation; premium tiers: co-created plans, coaching messages, accountability and progress comparisons.
- Future persistent storage must be authenticated, tenant/person scoped and guarded by RLS; public fictional preview must not store private notes in browser localStorage.

## Coach approval and delivery contract

Assessment completion -> normalized preliminary calculation (with trace and completeness) -> coach review + clarification -> senior authorization -> immutable approved report snapshot -> secure free member account access + matching PDF. No client sees preliminary unapproved results. Later coaching builds on the same snapshot.

Scoring handoff v0.14 still has incomplete actual raw answer joins, several unapproved Driver rubrics and some unimplemented Hydration gates. PDF/HTML are presentation references, never numerical evidence. Child/proxy pathways require separate approved rubrics.

## Engineering/visual review acceptance

1. Approved logo and the live site's identity are preserved and consistent with the six-page PDF.
2. Authentic lifestyle hero photograph from existing approved site assets; no new facial synthesis or use of flattened PDF as background.
3. Overview, 12 Drivers, filter/search/expand, prior-visit toggle, priority links and add/remove/complete/reset action behavior remain functional.
4. Sample scores visually consistent across cards, rings, list and compass. Eight featured dials are derived from same sample Driver scores.
5. No invented health calculations, diagnosis, promises of unapproved outcomes or leaked member data.
6. Mobile 320/375/390/768/1024/1440 checked for clipping, contrast, tap targets and responsive layout.
7. Print displays full overview + all twelve Drivers + action plan, not empty hidden tabs.
8. Public sample labelled fictional everywhere appropriate and noindex/noarchive. Draft only until founder visual approval.
9. Free access and PDF not dependent on a coaching package; optional upgraded features clearly marked and non-blocking.
10. Verify production social-proof and Roadmap sample-popup UI separately. Do not mingle those marketing fixes with report scoring or portal changes.

## Source-specific caveats

- PDF mockup's six *pages* are visual reference compositions; the interactive founder demo has three *tabs*. Both survive, in different roles.
- PDF mockup's **72** sample overall score and sample rings differ from the founder HTML's illustrative **68** and twelve Driver values. In prototype use internally consistent fictional source values; in production show only computed/reviewed approved values.
- PDF mockup says Educate/Empower/Elevate, while public website has existing approved brand copy. Use approved website copy unless founders sign off on report-specific motto.
- Do not treat a derived PDF icon illustration as a separable licensed SVG file. Draw/reuse verified icon assets with consistent visual language.
