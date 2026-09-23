ReVitalized Academy Webinar Hero Seat Card — APPROVED CHANGE ONLY

Purpose:
Make the top "Only 50 seats" card slightly wider so it visually balances better with the CTA row beneath it.

Target file:
css/webinar-founders.css

Approved change only:
- Add width: 100%;
- Change max-width from 640px to 820px
- Change padding from 16px 18px to 16px 24px

No other files or styles should be changed.

Safest implementation:
Append the contents of "webinar-seat-card-override.css" to the END of css/webinar-founders.css.
Because this is an override, it avoids editing or replacing any unrelated existing CSS.

Expected visual result:
- The 50-seat card extends farther to the right
- Better visual alignment with the CTA / "No Payment Today" row below
- Same card height, colors, typography, icon, and content
- No changes to mobile behavior beyond inheriting the existing responsive layout
