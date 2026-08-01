import fs from 'fs';
import path from 'path';
import { PRO_CITIES } from '../src/seo/proSeoData.js';
import { HOMEOWNER_SERVICES } from '../src/seo/homeownerSeoData.js';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SITE = 'https://www.fixloapp.com';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderFaq(service, city) {
  return service.questions.map((question, index) => {
    const answers = [
      `Pricing varies by project scope, property conditions, materials, and the professional selected. Submit your request through Fixlo to share the details and connect with local professionals serving ${city.city}.`,
      `Include photos, measurements, timing, and a clear description of the work. Better project details help professionals understand the request before following up.`,
      `Yes. Fixlo supports both small repair requests and larger projects. Availability depends on the service, location, and professionals active in the area.`
    ];
    return { q: question, a: answers[index] || answers[0] };
  });
}

function renderPage(serviceSlug, service, citySlug, city) {
  const location = `${city.city}, ${city.state}`;
  const canonical = `${SITE}/services/${serviceSlug}/${citySlug}`;
  const title = `${service.label} in ${location} | Request Service with Fixlo`;
  const description = `Need ${service.label.toLowerCase()} in ${location}? Submit your project through Fixlo and connect with local professionals for estimates, repairs, installations, and home improvements.`;
  const faq = renderFaq(service, city);
  const relatedServices = Object.entries(HOMEOWNER_SERVICES)
    .filter(([slug]) => slug !== serviceSlug)
    .slice(0, 8)
    .map(([slug, item]) => `<a href="/services/${slug}/${citySlug}">${escapeHtml(item.label)} in ${escapeHtml(city.city)}</a>`)
    .join('');
  const nearbyCities = Object.entries(PRO_CITIES)
    .filter(([slug, item]) => slug !== citySlug && item.state === city.state)
    .slice(0, 8)
    .map(([slug, item]) => `<a href="/services/${serviceSlug}/${slug}">${escapeHtml(service.label)} in ${escapeHtml(item.city)}, ${escapeHtml(item.state)}</a>`)
    .join('');

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: title,
        description,
        url: canonical,
        about: {
          '@type': 'Service',
          name: service.label,
          areaServed: { '@type': 'City', name: location },
          provider: { '@type': 'Organization', name: 'Fixlo', url: SITE }
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Fixlo', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE}/services` },
          { '@type': 'ListItem', position: 3, name: service.label, item: `${SITE}/services/${serviceSlug}` },
          { '@type': 'ListItem', position: 4, name: location, item: canonical }
        ]
      }
    ]
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Fixlo" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE}/cover.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    :root{color-scheme:dark;--gold:#f4c542;--ink:#080808;--muted:#b9bdc6}*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--ink);color:#fff;line-height:1.6}a{color:inherit}.wrap{width:min(1120px,calc(100% - 32px));margin:auto}.nav{display:flex;justify-content:space-between;align-items:center;padding:22px 0}.brand{font-size:28px;font-weight:900;letter-spacing:.04em}.brand span{color:var(--gold)}.nav a,.button{display:inline-flex;text-decoration:none;font-weight:800;border-radius:999px;padding:12px 20px}.nav a{border:1px solid #333}.hero{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:center;padding:64px 0 88px}.eyebrow{color:var(--gold);font-weight:900;text-transform:uppercase;letter-spacing:.18em;font-size:13px}.hero h1{font-size:clamp(42px,7vw,72px);line-height:1.03;margin:14px 0 22px}.hero p{color:var(--muted);font-size:19px;max-width:680px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}.button.primary{background:var(--gold);color:#111}.button.secondary{border:1px solid #555}.card{border:1px solid rgba(244,197,66,.35);background:#121212;border-radius:28px;padding:28px}.card ul{padding:0;margin:20px 0 0;list-style:none}.card li{padding:13px 0;border-bottom:1px solid #292929}.card li:before{content:"✓";color:var(--gold);margin-right:10px;font-weight:900}.light{background:#fff;color:#111;padding:72px 0}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:28px}.feature{border:1px solid #e5e7eb;border-radius:22px;padding:24px}.steps{background:#111;color:#fff}.steps strong{color:var(--gold)}.faq{background:#f3f4f6;color:#111;padding:72px 0}.faq-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.faq article{background:#fff;border-radius:22px;padding:24px}.links{display:flex;flex-wrap:wrap;gap:10px}.links a{border:1px solid #d1d5db;border-radius:999px;padding:9px 14px;text-decoration:none;font-size:14px}.fine{color:#8b909a;font-size:13px;margin-top:18px}footer{padding:34px 0;color:#9297a0;text-align:center}@media(max-width:800px){.hero,.grid,.faq-grid{grid-template-columns:1fr}.hero{padding-top:38px}.hero h1{font-size:44px}}
  </style>
</head>
<body>
  <header class="wrap nav"><div class="brand">FIX<span>LO</span></div><a href="/services">Browse Services</a></header>
  <main>
    <section class="wrap hero">
      <div>
        <div class="eyebrow">Local home-service request</div>
        <h1>${escapeHtml(service.label)} in ${escapeHtml(location)}</h1>
        <p>${escapeHtml(service.intro)} Tell Fixlo what you need and connect with professionals serving ${escapeHtml(city.region)}.</p>
        <div class="actions"><a class="button primary" href="/request?service=${encodeURIComponent(serviceSlug)}&city=${encodeURIComponent(citySlug)}">Request Service</a><a class="button secondary" href="/services/${serviceSlug}">Learn about this service</a></div>
        <div class="fine">Availability, pricing, licensing, and project terms vary by professional and location.</div>
      </div>
      <aside class="card"><div class="eyebrow">Common requests</div><ul>${service.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join('')}</ul></aside>
    </section>

    <section class="light"><div class="wrap grid"><div><div class="eyebrow">How Fixlo works</div><h2>Describe the project once</h2><p>Add the work needed, location, timing, photos, and project details. Clear requests make it easier for professionals to evaluate the job.</p><div class="grid"><div class="feature">Local service matching</div><div class="feature">Mobile-friendly request form</div><div class="feature">Project details in one place</div><div class="feature">No obligation to accept an estimate</div></div></div><div class="card steps"><h2>Request ${escapeHtml(service.label.toLowerCase())}</h2><p><strong>1.</strong> Describe the project.</p><p><strong>2.</strong> Add your location and contact details.</p><p><strong>3.</strong> Upload photos when helpful.</p><p><strong>4.</strong> Review responses from available professionals.</p><a class="button primary" href="/request?service=${encodeURIComponent(serviceSlug)}&city=${encodeURIComponent(citySlug)}">Start your request</a></div></div></section>

    <section class="faq"><div class="wrap"><h2>Questions about ${escapeHtml(service.label.toLowerCase())}</h2><div class="faq-grid">${faq.map((item) => `<article><h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p></article>`).join('')}</div></div></section>

    <section class="light"><div class="wrap grid"><div><h2>Other services in ${escapeHtml(city.city)}</h2><div class="links">${relatedServices}</div></div><div><h2>${escapeHtml(service.label)} in nearby markets</h2><div class="links">${nearbyCities || `<a href="/services/${serviceSlug}">View all ${escapeHtml(service.label.toLowerCase())} information</a>`}</div></div></div></section>
  </main>
  <footer class="wrap">© ${new Date().getFullYear()} Fixlo · Find. Book. Get It Done.</footer>
</body>
</html>`;
}

let count = 0;
for (const [serviceSlug, service] of Object.entries(HOMEOWNER_SERVICES)) {
  for (const [citySlug, city] of Object.entries(PRO_CITIES)) {
    const targetDir = path.join(PUBLIC_DIR, 'services', serviceSlug, citySlug);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'index.html'), renderPage(serviceSlug, service, citySlug, city), 'utf8');
    count += 1;
  }
}

console.info(`[homeowner-seo] Generated ${count} homeowner service pages in ${PUBLIC_DIR}`);
