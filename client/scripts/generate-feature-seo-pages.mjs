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
  },
  {
    slug: 'handyman-near-me',
    title: 'Handyman Near Me | Find Local Handyman Help with Fixlo',
    description: 'Looking for a handyman near you? Use Fixlo to request local handyman help for repairs, installations, drywall, doors, fixtures, carpentry, and small home projects.',
    eyebrow: 'Local handyman help',
    h1: 'Find a Handyman Near You',
    lead: 'Fixlo helps homeowners connect with handyman professionals for everyday repairs and small home projects. Share your location and project details to start a local request or use direct handyman booking where available.',
    cta: '/request?mode=handyman',
    ctaLabel: 'Find a Handyman Near Me',
    secondary: '/free-home-service-quote',
    secondaryLabel: 'Get a Free Quote',
    bullets: [
      'Local handyman requests based on your service address',
      'Repairs, installations, drywall, doors, fixtures, and more',
      '$75/hour direct handyman labor where direct booking is available',
      'Live work-time tracking and detailed completion receipt'
    ],
    sections: [
      ['What can a local handyman help with?', 'Common handyman projects include minor home repairs, drywall patches, door adjustments, fixture installation, mounting, trim work, carpentry repairs, and general maintenance.'],
      ['How Fixlo uses your location', 'Your service address helps Fixlo connect the request with professionals who serve your area. Availability depends on the professionals active near the property.'],
      ['Direct booking or free quote', 'If you know you need a handyman, use direct booking where available. If you want to compare the project first, submit a free home service quote request.']
    ],
    faqs: [
      ['How do I find a handyman near me?', 'Enter your service address and project details in Fixlo so the request can be connected with professionals serving your area.'],
      ['What kinds of small jobs can I request?', 'You can request many common home repair and installation projects, including drywall, doors, fixtures, trim, mounting, and minor carpentry.'],
      ['Can I request a free estimate first?', 'Yes. Fixlo also offers a free home service quote request if you want to describe the project before confirming a booking.']
    ]
  },
  {
    slug: 'same-day-handyman',
    title: 'Same-Day Handyman Service | Request Fast Home Repair Help | Fixlo',
    description: 'Need same-day handyman help? Submit your project to Fixlo for urgent minor home repairs, installations, doors, drywall, fixtures, and maintenance. Availability varies by local pros.',
    eyebrow: 'Urgent home repair help',
    h1: 'Request Same-Day Handyman Service',
    lead: 'For repairs that cannot wait, submit the project details and preferred timing through Fixlo. Same-day availability depends on local professionals and the type of work requested.',
    cta: '/request?mode=handyman',
    ctaLabel: 'Request a Handyman',
    secondary: '/free-home-service-quote',
    secondaryLabel: 'Get a Free Quote',
    bullets: [
      'Request urgent handyman help online',
      'Add photos and details before the visit',
      'Local availability shown through the service workflow',
      '$75/hour direct handyman labor where available'
    ],
    sections: [
      ['When to request same-day handyman help', 'Same-day requests can be useful for minor repairs, damaged doors, loose fixtures, drywall damage, mounting issues, and other non-emergency home problems that need prompt attention.'],
      ['Availability is local', 'Same-day service is not guaranteed. Availability depends on the project, service area, timing, and professionals who can accept the job.'],
      ['For emergencies', 'Fixlo is intended for home-service work. For dangerous electrical, gas, fire, flooding, or life-safety emergencies, contact the appropriate emergency service or utility provider.']
    ],
    faqs: [
      ['Does Fixlo guarantee same-day handyman service?', 'No. You can request same-day service, but availability depends on local professionals and the project.'],
      ['Can I upload photos for an urgent repair?', 'Yes. Photos and a clear description can help a professional understand the work before arriving.'],
      ['How much is direct handyman labor?', 'Where direct handyman booking is available, labor is $75 per hour plus materials.']
    ]
  },
  {
    slug: 'small-home-repairs-near-me',
    title: 'Small Home Repairs Near Me | Local Handyman Help | Fixlo',
    description: 'Find help for small home repairs near you with Fixlo. Request drywall patches, door repairs, fixtures, mounting, trim, minor carpentry, and general home maintenance.',
    eyebrow: 'Small home repairs',
    h1: 'Help with Small Home Repairs Near You',
    lead: 'Fixlo makes it easier to request help for the small repairs that pile up around the house. Describe the job once, add photos, and connect with professionals serving your area.',
    cta: '/request',
    ctaLabel: 'Request a Free Quote',
    secondary: '/request?mode=handyman',
    secondaryLabel: 'Book a Handyman',
    bullets: [
      'Drywall patches and minor wall repairs',
      'Door, trim, hardware, and fixture repairs',
      'Mounting, assembly, and minor carpentry',
      'General maintenance and punch-list projects'
    ],
    sections: [
      ['Bundle several small repairs', 'If you have multiple small tasks, describe them together and include photos. A clear punch list helps a professional understand the scope before the visit.'],
      ['Free quote request', 'You can submit a home service quote request for free and provide the project details without paying a request fee.'],
      ['Direct handyman booking', 'For supported direct handyman bookings, Fixlo uses a $75 hourly labor rate plus materials and tracks the active visit from clock-in to clock-out.']
    ],
    faqs: [
      ['What counts as a small home repair?', 'Examples include drywall patches, sticking doors, loose hardware, trim repairs, fixture replacement, mounting, and other minor maintenance tasks.'],
      ['Can I request several repairs at once?', 'Yes. Include each task in the project description so the professional can review the full punch list.'],
      ['Is the quote request free?', 'Yes. Submitting a Fixlo home service quote request is free.']
    ]
  },
  {
    slug: 'free-handyman-estimate',
    title: 'Free Handyman Estimate | Request a Handyman Quote with Fixlo',
    description: 'Request a free handyman estimate with Fixlo. Describe your repair or installation project, add photos and timing, and connect with local professionals without a quote request fee.',
    eyebrow: 'Free handyman estimate',
    h1: 'Request a Free Handyman Estimate',
    lead: 'Not ready to book immediately? Submit your handyman project as a free quote request. Add photos, measurements, location, and timing so a professional can understand what you need.',
    cta: '/request?service=handyman',
    ctaLabel: 'Get a Free Handyman Quote',
    secondary: '/request?mode=handyman',
    secondaryLabel: 'Book a Handyman Now',
    bullets: [
      'No fee to submit the quote request',
      'Add photos, measurements, and repair details',
      'Request help for one task or a punch list',
      'Confirm a booking only when you are ready'
    ],
    sections: [
      ['Free quote request versus direct booking', 'A free quote request lets you describe the work without paying a request fee. Direct handyman booking is for homeowners ready to reserve service at the published hourly labor rate where available.'],
      ['Details that help with an estimate', 'Photos, dimensions, material preferences, access notes, and a clear list of tasks can make the initial conversation more useful.'],
      ['Confirm the job securely', 'If the quote turns into a booked project, Fixlo can securely collect a payment method before work begins and use the clock-in/clock-out record for final billing.']
    ],
    faqs: [
      ['Is the handyman estimate request really free?', 'Yes. Fixlo does not charge a fee to submit the home service quote request.'],
      ['Do I have to book after requesting an estimate?', 'No. A quote request does not obligate you to confirm a job.'],
      ['Can I switch to direct handyman booking?', 'Yes. If direct handyman booking is available for your project, you can use the direct booking flow at the published hourly labor rate.']
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
