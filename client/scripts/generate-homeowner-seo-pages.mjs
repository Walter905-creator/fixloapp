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

const STATE_CONTEXT = {
  AL: 'hot summers, seasonal storms, and year-round home maintenance',
  AK: 'freeze-thaw cycles, snow, and cold-weather home maintenance',
  AZ: 'extreme heat, sun exposure, dust, and cooling-season wear',
  CA: 'sun exposure, dry seasons, coastal or inland climate conditions, and older housing stock in many neighborhoods',
  CO: 'snow, hail, freeze-thaw cycles, and strong seasonal temperature changes',
  CT: 'cold winters, humid summers, and seasonal exterior maintenance',
  FL: 'heat, humidity, heavy rain, and tropical-storm preparation',
  GA: 'heat, humidity, thunderstorms, and year-round exterior maintenance',
  HI: 'salt air, humidity, sun exposure, and tropical weather',
  IL: 'freeze-thaw cycles, summer humidity, storms, and seasonal maintenance',
  LA: 'heat, humidity, heavy rain, and storm-related wear',
  MA: 'snow, freeze-thaw cycles, humid summers, and older housing stock',
  MI: 'snow, freezing temperatures, summer humidity, and seasonal exterior wear',
  MN: 'severe winter cold, snow, freeze-thaw cycles, and short intense summers',
  NC: 'humid summers, thunderstorms, seasonal pollen, and changing temperatures',
  NJ: 'cold winters, humid summers, coastal weather, and dense older housing',
  NM: 'dry air, strong sun, dust, and large daily temperature swings',
  NV: 'dry heat, intense sun, dust, and large temperature swings',
  NY: 'cold winters, humid summers, freeze-thaw cycles, and varied housing ages',
  OH: 'freeze-thaw cycles, thunderstorms, humidity, and four-season maintenance',
  OR: 'rain, moisture, moss-prone conditions, and seasonal exterior maintenance',
  PA: 'cold winters, humid summers, rain, and older housing in many markets',
  SC: 'heat, humidity, heavy rain, and coastal-storm exposure in parts of the state',
  TN: 'humid summers, thunderstorms, rain, and four-season maintenance',
  TX: 'extreme heat, strong sun, severe storms, and heavy cooling demand',
  UT: 'dry air, strong sun, snow, and large seasonal temperature changes',
  VA: 'humid summers, storms, rain, and four-season exterior maintenance',
  WA: 'rain, moisture, moss-prone conditions, and cool-season maintenance',
  WI: 'snow, severe cold, freeze-thaw cycles, and humid summers'
};

const SERVICE_LOCAL_CONTEXT = {
  handyman: 'Common local requests can include punch-list repairs, doors, drywall, mounting, trim, fixtures, and maintenance items that accumulate as a home ages.',
  remodeling: 'Renovation planning often starts with scope, measurements, finish selections, access, permits when required, and a realistic sequence for the trades involved.',
  'bathroom-remodeling': 'Bathroom projects often combine moisture management, plumbing fixtures, tile, ventilation, cabinetry, lighting, and finish work.',
  'kitchen-remodeling': 'Kitchen projects can involve cabinets, counters, backsplash, flooring, lighting, appliance clearances, plumbing, and electrical coordination.',
  carpentry: 'Carpentry needs commonly include trim, doors, shelving, framing repairs, exterior woodwork, and custom adjustments to existing homes.',
  painting: 'Paint preparation should account for substrate condition, moisture, sun exposure, previous coatings, and whether the work is interior or exterior.',
  flooring: 'Flooring projects depend on subfloor condition, moisture, room use, transitions, material choice, and the amount of furniture or existing flooring to remove.',
  drywall: 'Drywall repairs can range from small holes and cracks to water-damaged sections, texture matching, finishing, and larger replacement areas.',
  'door-repair': 'Door problems can come from hardware wear, frame movement, weather exposure, damaged jambs, swelling, alignment, or an aging door unit.',
  'deck-repair': 'Deck work should consider boards, railings, stairs, fasteners, framing, moisture exposure, finishes, and any signs of structural deterioration.',
  'fence-repair': 'Fence repairs often involve posts, gates, panels, hardware, wind damage, rot, impact damage, or replacing only the affected sections.',
  plumbing: 'Plumbing requests often involve leaks, fixtures, drains, toilets, faucets, water heaters, shutoffs, and diagnosing where a water problem begins.',
  electrical: 'Electrical projects can include fixtures, fans, switches, receptacles, troubleshooting, dedicated circuits, and panel-related work where qualified licensing may be required.',
  roofing: 'Roof requests often begin with leak location, shingle or surface condition, flashing, storm damage, drainage, roof age, and whether repair or replacement is appropriate.',
  hvac: 'Heating and cooling requests can involve comfort problems, maintenance, thermostats, airflow, unusual system behavior, repairs, and replacement planning.',
  landscaping: 'Outdoor projects can include cleanup, lawn care, planting, edging, drainage, mulch, pruning, and hardscape or yard-improvement work.',
  'junk-removal': 'Removal projects are easier to plan when the item types, approximate volume, stairs, access, parking, and any heavy or restricted materials are described upfront.',
  'house-cleaning': 'Cleaning requests can be tailored around home size, recurring versus one-time service, kitchens and bathrooms, move-outs, deep cleaning, and post-project cleanup.'
};

function localContext(serviceSlug, service, city) {
  const climate = STATE_CONTEXT[city.state] || `the seasonal conditions common across ${city.region}`;
  const serviceContext = SERVICE_LOCAL_CONTEXT[serviceSlug] || `${service.label} projects vary by property, scope, and timing.`;
  return {
    climate,
    serviceContext,
    market: `${city.city} is part of ${city.region}. Homes and properties across this market can face ${climate}. For ${service.label.toLowerCase()}, the useful first step is to document the exact problem, property conditions, timing, and photos so a professional can evaluate the real scope rather than relying on a generic estimate.`,
    planning: `${serviceContext} In ${city.city}, include access details, approximate dimensions when relevant, material preferences, and whether the issue is urgent or part of planned maintenance.`
  };
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
  const isHandyman = serviceSlug === 'handyman';
  const requestHref = isHandyman
    ? `/request?mode=handyman&city=${encodeURIComponent(citySlug)}`
    : `/request?service=${encodeURIComponent(serviceSlug)}&city=${encodeURIComponent(citySlug)}`;
  const requestLabel = isHandyman ? 'Book a $75/Hour Handyman' : 'Request Service';
  const title = isHandyman
    ? `Handyman in ${location} | $75/Hour Local Handyman | Fixlo`
    : serviceSlug === 'drywall'
      ? `Drywall Repair in ${location} | Local Drywall Help | Fixlo`
      : serviceSlug === 'door-repair'
        ? `Door Repair in ${location} | Local Door Repair Help | Fixlo`
        : `${service.label} in ${location} | Request Service with Fixlo`;
  const description = isHandyman
    ? `Looking for a handyman near you in ${location}? Fixlo direct handyman booking uses a $75 labor rate per hour plus materials, with secure checkout, live work-time tracking, and a detailed invoice.`
    : serviceSlug === 'drywall'
      ? `Need drywall repair near you in ${location}? Request help for holes, cracks, damaged drywall, texture matching, and installation through Fixlo.`
      : serviceSlug === 'door-repair'
        ? `Need door repair near you in ${location}? Request help for sticking doors, damaged frames, hardware, alignment, replacement, and installation through Fixlo.`
        : `Need ${service.label.toLowerCase()} in ${location}? Submit your project through Fixlo and connect with local professionals for estimates, repairs, installations, and home improvements.`;
  const faq = renderFaq(service, city);
  const local = localContext(serviceSlug, service, city);
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
        <div class="actions"><a class="button primary" href="${requestHref}">${escapeHtml(requestLabel)}</a><a class="button secondary" href="/signup/homeowner">Create Free Account</a></div>
        <div class="fine">Availability, pricing, licensing, and project terms vary by professional and location.</div>
        ${isHandyman
          ? '<div class="links" style="margin-top:16px"><a href="/handyman-near-me">Handyman near me</a><a href="/same-day-handyman">Same-day handyman</a><a href="/small-home-repairs-near-me">Small home repairs near me</a><a href="/free-handyman-estimate">Free handyman estimate</a><a href="/handyman-75-per-hour">$75/hour handyman pricing</a><a href="/book-a-handyman-online">Book a handyman online</a></div>'
          : serviceSlug === 'drywall'
            ? '<div class="links" style="margin-top:16px"><a href="/small-home-repairs-near-me">Small home repairs near me</a><a href="/free-home-service-quote">Get a free home service quote</a></div>'
            : serviceSlug === 'door-repair'
              ? '<div class="links" style="margin-top:16px"><a href="/small-home-repairs-near-me">Small home repairs near me</a><a href="/free-handyman-estimate">Free handyman estimate</a></div>'
              : '<div class="links" style="margin-top:16px"><a href="/free-home-service-quote">Get a free home service quote</a></div>'}
      </div>
      <aside class="card"><div class="eyebrow">Common requests</div><ul>${service.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join('')}</ul></aside>
    </section>

    <section class="light"><div class="wrap grid"><div><div class="eyebrow">How Fixlo works</div><h2>Describe the project once</h2><p>Add the work needed, location, timing, photos, and project details. Clear requests make it easier for professionals to evaluate the job.</p><div class="grid"><div class="feature">Local service matching</div><div class="feature">Mobile-friendly request form</div><div class="feature">Project details in one place</div><div class="feature">No obligation to accept an estimate</div></div></div><div class="card steps"><h2>Request ${escapeHtml(service.label.toLowerCase())}</h2><p><strong>1.</strong> Describe the project.</p><p><strong>2.</strong> Add your location and contact details.</p><p><strong>3.</strong> Upload photos when helpful.</p><p><strong>4.</strong> Review responses from available professionals.</p><a class="button primary" href="${requestHref}">${isHandyman ? 'Book a Handyman' : 'Start your request'}</a><div class="fine"><a href="/signup/homeowner">Create a free Fixlo homeowner account</a> to keep your requests and service activity organized.</div></div></div></section>

    <section class="light"><div class="wrap grid"><article><div class="eyebrow">${escapeHtml(city.region)}</div><h2>Planning ${escapeHtml(service.label.toLowerCase())} in ${escapeHtml(city.city)}</h2><p>${escapeHtml(local.market)}</p></article><article><div class="eyebrow">Before you request service</div><h2>What to include for a more useful response</h2><p>${escapeHtml(local.planning)}</p><p>Fixlo does not assume that every property in ${escapeHtml(city.city)} has the same needs. Project scope, building conditions, licensing requirements, materials, and professional availability can differ by address.</p></article></div></section>

    <section class="faq"><div class="wrap"><h2>Questions about ${escapeHtml(service.label.toLowerCase())} in ${escapeHtml(city.city)}</h2><div class="faq-grid">${faq.map((item) => `<article><h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p></article>`).join('')}</div></div></section>

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
