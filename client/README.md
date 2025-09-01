Fixlo client (Tailwind + Vite + SEO + sitemap + SMS consent).

Vercel: Root=client, Build=`npm run build`, Output=`dist`.

Env Vars:
- VITE_API_BASE: Backend base URL (e.g., https://fixloapp.onrender.com)
- VITE_STRIPE_CHECKOUT_URL: Stripe Checkout URL (Pros are redirected after Join form)
- VITE_CLOUDINARY_CLOUD_NAME: Cloudinary cloud name
- VITE_CLOUDINARY_UPLOAD_PRESET: Cloudinary unsigned upload preset
