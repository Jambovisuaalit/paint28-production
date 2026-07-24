# Demo branch: Vercel deployment notes

This branch (`demo/vercel-deploy`) contains the Vercel configuration for a temporary customer demo on a `vercel.app` domain.

## Deployment configuration

- `vercel.json` runs `npm run build -- --mode vercel`.
- Vite uses `/` as the asset base in `vercel` mode and `/paint28-production/` for GitHub Pages.
- Vercel serves the built SPA from `dist` and rewrites routes to `index.html`.
- `.vercelignore` excludes local build artifacts.

## Backend

The demo does **not** use a mocked quote service. It connects to the Paint28 Supabase project and invokes the real `submit-quote` Edge Function.

The committed `.env.vercel` file contains only browser-public values:

- Supabase project URL
- Supabase publishable key
- Edge Function name
- preview admin email

No service-role key or other server secret is committed to GitHub or bundled into the frontend.

## Deploy from Vercel

Import `Jambovisuaalit/paint28-production` and select branch `demo/vercel-deploy`.

- Framework preset: Vite
- Build command: supplied by `vercel.json`
- Output directory: supplied by `vercel.json`

After the stable Vercel URL is known, add its exact origin to the `submit-quote` Edge Function origin allowlist before testing form submission.

## Required smoke checks

1. Public page loads without missing CSS, JavaScript or image assets.
2. Mobile sticky CTA is visible below 768 px and respects the safe area.
3. Quote submission with 1–3 valid images returns the success state.
4. Invalid file type, oversized image and missing consent are blocked.
5. Preview admin login, Realtime lead appearance and signed-image lightbox work.
6. Preview deployment is not used as the production `paint28.fi` canonical URL.
