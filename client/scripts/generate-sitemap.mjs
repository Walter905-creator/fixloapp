import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SRC_DIR = path.join(ROOT, 'src');
const BASE_URL = process.env.PUBLIC_URL || 'https://www.fixloapp.com';
const services = ['plumbing','electrical','carpentry','painting','hvac','roofing','landscaping','house-cleaning','junk-removal'];
const cities = ['miami-fl','new-york-ny','los-angeles-ca','chicago-il','houston-tx','phoenix-az'];
const today = new Date().toISOString().split('T')[0];
const urls = new Set([ '/', '/pricing', '/services', '/terms' ]);
services.forEach(svc => urls.add(`/services/${svc}`));
services.forEach(svc => cities.forEach(cty => urls.add(`/services/${svc}/${cty}`)));
function urlNode(loc, priority='0.80', changefreq='weekly'){return `
  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;}
let body=''; for (const loc of urls){const isDeep = loc.split('/').filter(Boolean).length >= 3; const pr = isDeep ? '0.60' : '0.80'; body += urlNode(loc, pr);}
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${body}
</urlset>`;
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), xml.trim(), 'utf-8');
console.log(`✅ Generated sitemap.xml with ${urls.size} URLs at ${path.join(PUBLIC_DIR, 'sitemap.xml')}`);
