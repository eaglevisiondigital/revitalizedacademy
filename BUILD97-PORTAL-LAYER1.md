# Build 97 - Production Layer 1 Staff Portal

Date: 2026-09-24

## Added
- /portal/ staff authentication entry point
- Supabase email/password sign-in
- Invite/recovery password setup handling
- Staff role check through public.staff_access
- Live Production Layer 1 dashboard
- Executive metrics
- Follow-up queue
- Open task queue
- Recent contacts overview
- Responsive ReVitalized styling
- noindex/noarchive metadata for the portal

## Supabase
Project: ReVitalized Academy
Project ref: voalfpxiyznnqfcqcymd

The portal uses the public Supabase project URL and publishable key only.
No service role or secret key is exposed in browser code.
Existing RLS and security-invoker admin views remain the enforcement layer.

## Protected assessment scope
No assessment-owned or assessment-protected files were modified.
This build adds new portal files only.

## Manual production setting still required
In Supabase Authentication > URL Configuration:
- Site URL: https://revitalizedacademy.com/portal/
- Add Redirect URL: https://revitalizedacademy.com/portal/

The root production URL may also remain on the redirect allow list for future flows.
