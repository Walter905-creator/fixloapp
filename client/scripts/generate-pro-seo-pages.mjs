import fs from 'fs';
import path from 'path';
import { PRO_CITIES, PRO_TRADES } from '../src/seo/proSeoData.js';

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

function titleCase(value = '') {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderPage(tradeSlug, trade, citySlug, city) {
  const location = `${city.city}, ${city.state}`;
  const canonical = `${SITE}/${tradeSlug}-jobs/${citySlug}`;
  const title = `${trade.label} Jobs in ${location} | Join Fixlo Pro`;
  const description = `Grow your ${trade.label.toLowerCase()} business in ${city.city}. Join Fixlo Pro to receive local homeowner opportunities and choose the work that fits your service area.`;
  const faq = [
    {
      q: `How do ${trade.label.toLowerCase()} professionals receive opportunities through Fixlo?`,
      a: 'After creating a pro account and completing onboarding, eligible professionals can receive notifications when homeowner requests match their trade and selected service area.'
    },
    {
      q: `Can I choose where I want ${trade.label.toLowerCase()} work?`,
      a: 'Yes. Fixlo is designed to help independent professionals focus on the locations and project types that fit their business.'
    },
    {
      q: 'Is a Fixlo pro an employee of Fixlo?',
      a: 'No. Fixlo pros are independent service providers responsible for their own business, licensing, insurance, pricing, and customer agreements.'
    }
  ];

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
          name: `${trade.label} lead-matching platform`,
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
          { '@type': 'ListItem', position: 2, name: 'For Pros', item: `${SITE}/pros` },
          { '@type': 'ListItem', position: 3, name: `${trade.label} Jobs in ${location}`, item: canonical }
        ]
      }
    ]
  };

  const relatedTrades = Object.entries(PRO_TRADES)
    .filter(([slug]) => slug !== tradeSlug)
    .slice(0, 6)
    .map(([slug, item]) => `<a href="/${slug}-jobs/${citySlug}">${escapeHtml(item.label)} jobs in ${escapeHtml(city.city)}</a>`)
    .join('');

  const relatedCities = Object.entries(PRO_CITIES)
    .filter(([slug]) => slug !== citySlug)
    .slice(0, 6)
    .map(([slug, item]) => `<a href="/${tradeSlug}-jobs/${slug}">${escapeHtml(trade.label)} jobs in ${escapeHtml(item.city)}, ${escapeHtml(item.state)}</a>`)
    .join('');

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
    :root{color-scheme:dark;--gold:#f4c542;--ink:#080808;--paper:#fff;--muted:#b9bdc6}*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--ink);color:#fff;line-height:1.6}a{color:inherit}.wrap{width:min(1120px,calc(100% - 32px));margin:auto}.nav{display:flex;justify-content:space-between;align-items:center;padding:22px 0}.brand{font-size:28px;font-weight:900;letter-spacing:.04em}.brand span{color:var(--gold)}.nav a,.button{display:inline-flex;text-decoration:none;font-weight:800;border-radius:999px;padding:12px 20px}.nav a{border:1px solid #333}.hero{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:center;padding:64px 0 88px}.eyebrow{color:var(--gold);font-weight:900;text-transform:uppercase;letter-spacing:.18em;font-size:13px}.hero h1{font-size:clamp(42px,7vw,72px);line-height:1.03;margin:14px 0 22px}.hero p{color:var(--muted);font-size:19px;max-width:680px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}.button.primary{background:var(--gold);color:#111}.button.secondary{border:1px solid #555}.card{border:1px solid rgba(244,197,66,.35);background:#121212;border-radius:28px;padding:28px}.card ul{padding:0;margin:20px 0 0;list-style:none}.card li{padding:13px 0;border-bottom:1px solid #292929}.card li:before{content:"✓";color:var(--gold);margin-right:10px;font-weight:900}.light{background:#fff;color:#111;padding:72px 0}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:28px}.feature{border:1px solid #e5e7eb;border-radius:22px;padding:24px}.feature h2,.feature h3{margin-top:0}.steps{background:#111;color:#fff}.steps strong{color:var(--gold)}.faq{background:#f3f4f6;color:#111;padding:72px 0}.faq-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.faq article{background:#fff;border-radius:22px;padding:24px}.links{display:flex;flex-wrap:wrap;gap:10px}.links a{border:1px solid #d1d5db;border-radius:999px;padding:9px 14px;text-decoration:none;font-size:14px}.fine{color:#8b909a;font-size:13px;margin-top:18px}footer{padding:34px 0;color:#9297a0;text-align:center}@media(max-width:800px){.hero,.grid,.faq-grid{grid-template-columns:1fr}.hero{padding-top:38px}.nav{align-items:flex-start}.hero h1{font-size:44px}}
  </style>
</head>
<body>
  <header class="wrap nav"><div class="brand">FIX<span>LO</span></div><a href="/pros">For Professionals</a></header>
  <main>
    <section class="wrap hero">
      <div>
        <div class="eyebrow">Fixlo for independent professionals</div>
        <h1>Get more ${escapeHtml(trade.label.toLowerCase())} opportunities in ${escapeHtml(location)}</h1>
        <p>Connect with homeowners looking for dependable ${escapeHtml(trade.plural)}. Choose opportunities that match your trade, schedule, and service area.</p>
        <div class="actions"><a class="button primary" href="/pros/signup">Join Fixlo Pro</a><a class="button secondary" href="/pros">See how Fixlo works</a></div>
        <div class="fine">Independent professionals choose which opportunities to pursue. Lead availability varies by market and trade.</div>
      </div>
      <aside class="card"><div class="eyebrow">Common homeowner requests</div><ul>${trade.services.map((service) => `<li>${escapeHtml(titleCase(service))}</li>`).join('')}</ul></aside>
    </section>

    <section class="light">
      <div class="wrap grid">
        <div>
          <div class="eyebrow">Grow locally</div>
          <h2>A simpler way to find homeowners who need your trade</h2>
          <p>Fixlo helps homeowners submit detailed service requests and helps professionals discover opportunities that fit their business. Keep lead notifications and activity organized in one place.</p>
          <div class="grid"><div class="feature">Local lead notifications</div><div class="feature">Flexible service area</div><div class="feature">Mobile-friendly access</div><div class="feature">Control over the work you accept</div></div>
        </div>
        <div class="card steps"><h2>Start receiving matching opportunities</h2><p><strong>1.</strong> Create your pro account and select your trade.</p><p><strong>2.</strong> Set the locations you want to serve.</p><p><strong>3.</strong> Complete required onboarding and verification.</p><p><strong>4.</strong> Review matching homeowner requests.</p><a class="button primary" href="/pros/signup">Create a pro account</a></div>
      </div>
    </section>

    <section class="faq"><div class="wrap"><h2>Frequently asked questions</h2><div class="faq-grid">${faq.map((item) => `<article><h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p></article>`).join('')}</div></div></section>

    <section class="light"><div class="wrap grid"><div><h2>Other trades in ${escapeHtml(city.city)}</h2><div class="links">${relatedTrades}</div></div><div><h2>${escapeHtml(trade.label)} opportunities in other markets</h2><div class="links">${relatedCities}</div></div></div></section>
  </main>
  <footer class="wrap">© ${new Date().getFullYear()} Fixlo · Find. Book. Get It Done.</footer>
</body>
</html>`;
}

let count = 0;
for (const [tradeSlug, trade] of Object.entries(PRO_TRADES)) {
  for (const [citySlug, city] of Object.entries(PRO_CITIES)) {
    const targetDir = path.join(PUBLIC_DIR, `${tradeSlug}-jobs`, citySlug);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'index.html'), renderPage(tradeSlug, trade, citySlug, city), 'utf8');
    count += 1;
  }
}

console.info(`[pro-seo] Generated ${count} pro acquisition pages in ${PUBLIC_DIR}`);
