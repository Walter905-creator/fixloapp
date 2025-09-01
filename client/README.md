# Fixlo Client (Patched)
- Fixes blank page + adds complete routing and real pages.
- Working lead forms wired to `VITE_API_BASE` with required SMS consent checkboxes.
- SEO: canonical tags via Helmet, robots.txt, and build-time sitemap.

## Dev
cd client && npm i && npm run dev

## Build
npm run build

## Deploy (Vercel)
Root: client/ • Build: npm run build • Output: dist
