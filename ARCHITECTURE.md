# Production architecture release notes

The released production application uses Supabase `voalfpxiyznnqfcqcymd` and Netlify site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`. Its runtime origin is `https://revitalizedacademy.com`. Staging uses a separate project, site, configuration and migration history.

The pending durable-content package extends the existing Programs Content Library. Recipes reference Food Library ingredients and store full nutrient JSON plus calculation provenance snapshots. Meal templates compose published recipes; workout templates compose published exercises; fitness programs schedule published workouts by week/day. Nullable program weeks supports the existing ongoing model; no new scheduling architecture is introduced. Foods use active/inactive; reusable parents use draft/published/archived.

Methodology identity and existing production guidance are retained. The editor exposes name, version and philosophy through the existing tables. Dedicated phase editors, phase/program organization, independently modeled meal options, and new clinical logic are not added. Existing hidden phase/guidance fields are preserved on edit.

Authoring uses the shared authenticated production Supabase client. The build manifest explicitly includes both builder scripts. Browser configuration remains production-only; no staging bridges are used. The nutrient catalog is reference metadata, not client targets/diary data.

Vitality Review is already released. Its read RPCs operate on the production secure assessment store and retain private-health/contact-scope gates. The production member/client lifecycle remains an older release and requires a separate coordinated acceptance package. See the current release report for actual deployed versus pending status.
