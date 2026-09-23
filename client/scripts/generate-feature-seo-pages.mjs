import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SITE = 'https://www.fixloapp.com';

const PAGES = [
  {
    slug: 'free-home-service-quote',
    title: 'Free Home Service Quote | Request Local Pros with Fixlo',
    description: 'Request a free home service quote with Fixlo. Tell us what you need, add photos and project details, and connect with local home service professionals with no quote request fee.',
    eyebrow: 'Free home service quote',
    h1: 'Request a Free Home Service Quote',
    lead: 'Tell Fixlo what you need and submit your project at no cost. Share the service, location, timing, and photos so local professionals can review the request and follow up.',
    cta: '/request',
    ctaLabel: 'Get a Free Quote',
    secondary: '/services',
    secondaryLabel: 'Browse Home Services',
    bullets: [
      'No fee to submit a home service quote request',
      'Add project details, timing, address, and photos',
      'Connect with professionals serving your area',
      'Review the project before moving forward with a booking'
    ],
    sections: [
      ['How a free Fixlo quote request works', 'Choose the service you need, describe the project, add your location and contact information, and upload photos when useful. Your request can then be routed to professionals who serve your area.'],
      ['What to include for a better estimate', 'Include measurements, photos, access details, preferred timing, and a clear description of the work. Better information helps a professional understand the project before contacting you.'],
      ['From quote request to confirmed job', 'Submitting a quote request is free. If you later choose to confirm a job with a pro, Fixlo can securely collect a payment method before work begins so labor and approved materials can be handled through the platform.']
    ],
    faqs: [
      ['Does Fixlo charge to request a home service quote?', 'No. The Fixlo home service quote request is free to submit.'],
      ['Am I required to accept a quote?', 'No. Submitting a request does not require you to accept a quote or book a professional.'],
      ['What services can I request?', 'Fixlo supports common home services including handyman work, plumbing, electrical, HVAC, cleaning, landscaping, junk removal, painting, carpentry, flooring, drywall, roofing, and remodeling.']
    ]
  },
  {
    slug: 'handyman-75-per-hour',
    title: '$75/Hour Handyman Service | Book a Handyman with Fixlo',
    description: 'Book Fixlo handyman service at $75 per labor hour plus materials where direct booking is available. Secure first-hour checkout, live work timer, automatic final billing, and detailed receipt.',
    eyebrow: '$75 per labor hour',
    h1: 'Book a Handyman for $75 per Hour',
    lead: 'Fixlo direct handyman booking uses a clear $75 labor rate. The first labor hour is reserved through Stripe, then the work timer tracks the visit and the final approved balance is calculated at clock-out.',
    cta: '/request?mode=handyman',
    ctaLabel: 'Get a Handyman',
    secondary: '/free-home-service-quote',
    secondaryLabel: 'Need an estimate? Get a Free Quote',
    bullets: [
      '$75 per labor hour plus materials',
      'First labor hour reserved securely through Stripe',
      'Live clock-in timer visible during the job',
      'Automatic clock-out billing and detailed email receipt'
    ],
    sections: [
      ['Transparent hourly handyman pricing', 'The direct handyman booking rate is $75 per labor hour plus materials. The first hour is paid at checkout and credited toward the job total.'],
      ['Track time while the pro is working', 'When the assigned professional clocks in, Fixlo starts a live work timer. The homeowner and the professional can see how long the active visit has been running.'],
      ['Automatic billing after clock-out', 'When the professional clocks out, Fixlo calculates labor at the hourly rate, adds approved materials, applies the first-hour payment as a credit, and charges the remaining authorized balance to the saved payment method.'],
      ['Detailed invoice by email', 'The homeowner receives an invoice showing clock-in time, clock-out time, hours worked, hourly labor rate, materials, first-hour credit, amount charged at completion, and total service amount.']
    ],
    faqs: [
      ['How much is Fixlo handyman labor?', 'Fixlo direct handyman booking is $75 per labor hour plus materials where direct booking is available.'],
      ['Is the first hour charged twice?', 'No. The first-hour payment is credited toward the total labor amount when the job is completed.'],
      ['Can I see how long the handyman has been working?', 'Yes. After clock-in, the active work timer is visible in the connected job experience.'],
      ['When is the final charge made?', 'After clock-out, the system calculates the approved balance and can charge the saved payment method automatically.']
    ]
  },
  {
    slug: 'book-a-handyman-online',
    title: 'Book a Handyman Online | Fixlo Home Repair Service',
    description: 'Book a handyman online with Fixlo for home repairs, installations, maintenance, drywall, doors, fixtures, carpentry, and small projects. $75/hour labor plus materials for direct bookings.',
    eyebrow: 'Online handyman booking',
    h1: 'Book a Handyman Online with Fixlo',
    lead: 'Need help with repairs, installations, maintenance, or a small home project? Use Fixlo to request a handyman, enter the service address and project details, and reserve the first labor hour securely online.',
    cta: '/request?mode=handyman',
    ctaLabel: 'Book a Handyman',
    secondary: '/services/handyman',
    secondaryLabel: 'Explore Handyman Services',
    bullets: [
      'Home repairs and small improvement projects',
      'Online booking and secure Stripe checkout',
      '$75/hour labor for direct handyman bookings',
      'Clock-in tracking and detailed final invoice'
    ],
    sections: [
      ['Common handyman jobs', 'Homeowners can request help with drywall patches, door adjustments, fixture installation, trim and carpentry work, mounting, minor repairs, and general home maintenance.'],
      ['Book with project details upfront', 'Provide the address, preferred timing, contact information, and a detailed description so Fixlo and the assigned professional have the information needed before the visit.'],
      ['Track the active service visit', 'The professional clocks in when work begins. Fixlo records the start time and displays the running job timer until clock-out.']
    ],
    faqs: [
      ['Can I book a handyman online?', 'Yes. Fixlo offers an online direct handyman booking flow for supported jobs and locations.'],
      ['What is the hourly rate?', 'Direct handyman bookings use a $75 labor rate per hour plus materials.'],
      ['Do I receive a receipt?', 'Yes. After completion, the system can email a detailed invoice showing labor time, materials, credits, and the final total.']
    ]
  }
];

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function render(page) {
  const canonical = `${SITE}/${page.slug}`;
  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: page.title,
        description: page.description,
        url: canonical,
        isPartOf: { '@type': 'WebSite', name: 'Fixlo', url: SITE }
      },
      {
        '@type': 'Service',
        name: page.h1,
        provider: { '@type': 'Organization', name: 'Fixlo', url: SITE },
        areaServed: { '@type': 'Country', name: 'United States' },
        url: canonical
      },
      faqSchema,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Fixlo', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: page.h1, item: canonical }
        ]
      }
    ]
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Fixlo" />
  <meta property="og:title" content="${esc(page.title)}" />
  <meta property="og:description" content="${esc(page.description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE}/cover.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <style>
    *{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827;background:#fff;line-height:1.6}a{color:inherit}.wrap{width:min(1120px,calc(100% - 32px));margin:auto}.nav{display:flex;justify-content:space-between;align-items:center;padding:22px 0}.brand{font-weight:900;font-size:28px}.brand span{color:#d6a700}.nav a{text-decoration:none;font-weight:800}.hero{background:#080808;color:#fff;padding:72px 0}.eyebrow{font-size:13px;text-transform:uppercase;letter-spacing:.18em;font-weight:900;color:#f4c542}.hero h1{font-size:clamp(40px,7vw,70px);line-height:1.04;margin:12px 0 20px}.hero p{max-width:800px;color:#d1d5db;font-size:19px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.btn{display:inline-flex;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:900}.primary{background:#f4c542;color:#111}.secondary{border:1px solid #666}.section{padding:68px 0}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:22px}.card{border:1px solid #e5e7eb;border-radius:24px;padding:25px;background:#fff}.bullets{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:30px}.bullet{border:1px solid #333;border-radius:18px;padding:18px;background:#111827;color:#f9fafb}.faq{background:#f3f4f6}.faq-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.faq article{background:#fff;border-radius:20px;padding:22px}.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.links a{border:1px solid #d1d5db;border-radius:999px;padding:9px 14px;text-decoration:none;font-size:14px}footer{border-top:1px solid #e5e7eb;padding:30px 0;color:#6b7280}@media(max-width:800px){.grid,.bullets,.faq-grid{grid-template-columns:1fr}.hero{padding:52px 0}.hero h1{font-size:42px}}
  </style>
</head>
<body>
  <header class="wrap nav"><div class="brand">FIX<span>LO</span></div><a href="/services">Home Services</a></header>
  <main>
    <section class="hero"><div class="wrap"><div class="eyebrow">${esc(page.eyebrow)}</div><h1>${esc(page.h1)}</h1><p>${esc(page.lead)}</p><div class="actions"><a class="btn primary" href="${page.cta}">${esc(page.ctaLabel)}</a><a class="btn secondary" href="${page.secondary}">${esc(page.secondaryLabel)}</a></div><div class="bullets">${page.bullets.map((b)=>`<div class="bullet">✓ ${esc(b)}</div>`).join('')}</div></div></section>
    <section class="section"><div class="wrap grid">${page.sections.map(([h,p])=>`<article class="card"><h2>${esc(h)}</h2><p>${esc(p)}</p></article>`).join('')}</div></section>
    <section class="section faq"><div class="wrap"><div class="eyebrow">Frequently asked questions</div><h2>What homeowners want to know</h2><div class="faq-grid">${page.faqs.map(([q,a])=>`<article><h3>${esc(q)}</h3><p>${esc(a)}</p></article>`).join('')}</div></div></section>
    <section class="section"><div class="wrap"><h2>Explore more Fixlo home services</h2><p>Use these pages to compare your next step and submit the right kind of request.</p><div class="links"><a href="/services/handyman">Handyman Services</a><a href="/services/plumbing">Plumbing</a><a href="/services/electrical">Electrical</a><a href="/services/house-cleaning">House Cleaning</a><a href="/services/landscaping">Landscaping</a><a href="/services/junk-removal">Junk Removal</a><a href="/services">All Services</a></div></div></section>
  </main>
  <footer><div class="wrap">© ${new Date().getFullYear()} Fixlo · Find. Book. Get It Done.</div></footer>
</body>
</html>`;
}

for (const page of PAGES) {
  const dir = path.join(PUBLIC_DIR, page.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), render(page), 'utf8');
}

console.info(`[feature-seo] Generated ${PAGES.length} high-intent SEO pages.`);
