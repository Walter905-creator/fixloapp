Fixlo client with: Tailwind, SEO, sitemap, and a built-in /api/leads Twilio function.

Vercel settings:
- Root Directory: client
- Framework: Vite
- Build: npm run build
- Output: dist

Client envs (public):
- VITE_API_BASE (optional; if omitted, forms post to local /api/leads)
- VITE_STRIPE_CHECKOUT_URL
- VITE_CLOUDINARY_CLOUD_NAME
- VITE_CLOUDINARY_UPLOAD_PRESET

Serverless envs (secrets; set in same Vercel project, no VITE_ prefix):
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_MESSAGING_SERVICE_SID (or TWILIO_FROM)
- PROS_NOTIFY_NUMBERS (+1555...,+1555...)
- CORS_ORIGIN (optional; default *)

Assets:
- Navbar imports src/assets/fixlo-logo.png (bundled) and also serves /public/logo.png
