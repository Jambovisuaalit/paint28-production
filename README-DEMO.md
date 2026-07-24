# Demo branch: Vercel deployment notes

This branch (demo/vercel-deploy) contains a minimal Vercel configuration used for creating a temporary demo on a free vercel.app domain.

Files added:
- vercel.json — instructs Vercel to run the build ("npm run build") and serve the SPA from the dist directory.
- .vercelignore — keeps the upload small by ignoring node_modules, dist and other local files.

How deployment is triggered
1) If you have connected this GitHub repository to Vercel via the Vercel Dashboard (recommended), a push to this branch will automatically start a deployment.
2) If not connected, import the repo in Vercel: https://vercel.com/new → Import Git Repository → select "Jambovisuaalit/paint28-production" → choose branch "demo/vercel-deploy" → Framework Preset: Vite (or Build Command: `npm run build`, Output Directory: `dist`).

Build command
- The repo already defines `"build": "tsc -b && vite build"` in package.json, which Vercel will run.

No secrets required
- This demo uses the mocked quote service included in the project; no environment variables are required for a demo deploy.

After deployment
- Vercel will provide a free <project>.vercel.app URL for the demo. Share the URL with stakeholders for the presentation.
- If you want me to verify the deployment and run a quick smoke-check (LCP image, contact form submit, mobile CTA visibility), tell me and I will run them.
