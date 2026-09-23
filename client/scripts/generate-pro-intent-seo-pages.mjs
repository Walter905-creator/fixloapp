import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SITE = 'https://www.fixloapp.com';

const PAGES = [
  {
    slug: 'handyman-leads',
    title: 'Handyman Leads | Get Local Home Repair Opportunities with Fixlo',
    description: 'Grow your handyman business with Fixlo. Get matched with local homeowner requests, choose the jobs you want, and manage opportunities from one dashboard.',
    eyebrow: 'Handyman leads',
    h1: 'Get More Handyman Leads with Fixlo',
    lead: 'Fixlo helps independent handyman professionals connect with homeowners who are actively requesting repairs, installations, maintenance, and small home projects.',
    bullets: ['Local homeowner opportunities', 'Choose the jobs that fit your business', '30-mile matching for standard Fixlo Pro', 'Dashboard, notifications, and lead management'],
    sections: [
      ['Local homeowner demand', 'Receive opportunities tied to your trade and service area so you can focus on homeowners who are already looking for help.'],
      ['You stay independent', 'Fixlo pros are independent service providers. You decide which opportunities to pursue, your schedule, and how you operate your business.'],
      ['Build repeatable lead flow', 'Use Fixlo alongside your existing marketing to add another source of homeowner requests without relying on only one advertising channel.']
    ],
    faqs: [
      ['How do handyman leads work on Fixlo?', 'After onboarding, eligible pros can receive notifications when homeowner requests match their trade and service area.'],
      ['Do I have to accept every lead?', 'No. You choose which opportunities fit your business.'],
      ['How far away can leads be?', 'Standard Fixlo Pro matching is designed around a 30-mile service radius, subject to your account settings and market availability.']
    ]
  },
  {
    slug: 'contractor-leads',
    title: 'Contractor Leads | Find Local Home Service Opportunities | Fixlo Pro',
    description: 'Get contractor leads with Fixlo. Connect with homeowners requesting home repair, remodeling, plumbing, electrical, HVAC, roofing, painting, landscaping, and more.',
    eyebrow: 'Contractor leads',
    h1: 'Find More Local Contractor Leads',
    lead: 'Fixlo connects independent home service professionals with homeowner requests across multiple trades. Build a pipeline of local opportunities without chasing cold prospects.',
    bullets: ['Homeowner-initiated service requests', 'Multiple home service trades supported', 'Local matching by service area', 'Pro dashboard and lead notifications'],
    sections: [
      ['Homeowners come to Fixlo with a project', 'Requests include the type of service, location, and project details so professionals can quickly decide whether an opportunity fits.'],
      ['Built for independent contractors', 'Fixlo is designed for professionals who want another channel for finding local work while remaining in control of the jobs they take.'],
      ['Use one profile across your market', 'Keep your trade, service area, notifications, and lead activity organized from your pro account.']
    ],
    faqs: [
      ['What types of contractors can join Fixlo?', 'Fixlo supports trades including handyman, plumbing, electrical, HVAC, roofing, painting, carpentry, flooring, landscaping, cleaning, junk removal, and remodeling.'],
      ['Are Fixlo pros employees?', 'No. Fixlo pros are independent service providers.'],
      ['Are leads guaranteed?', 'No. Lead availability varies by location, trade, homeowner demand, and account eligibility.']
    ]
  },
  {
    slug: 'home-service-leads',
    title: 'Home Service Leads | Grow Your Local Service Business with Fixlo',
    description: 'Get home service leads through Fixlo. Connect with homeowners looking for repairs, cleaning, landscaping, junk removal, remodeling, plumbing, electrical, HVAC, and more.',
    eyebrow: 'Home service leads',
    h1: 'Grow Your Home Service Business with Local Leads',
    lead: 'Fixlo gives home service professionals another way to connect with homeowners who are already searching for help in their area.',
    bullets: ['Local homeowner requests', 'Trade-based matching', 'Service-area controls', 'Lead alerts and dashboard access'],
    sections: [
      ['Stop relying only on referrals', 'Referrals are valuable, but they can be inconsistent. Fixlo can add a digital source of homeowner opportunities to your existing business.'],
      ['Focus on the work you want', 'Set your trade and service area, then review opportunities that match your business instead of spending time on unrelated inquiries.'],
      ['Designed for small service businesses', 'Fixlo can be used by solo pros and growing local service companies looking for a more organized way to find new work.']
    ],
    faqs: [
      ['Who are home service leads on Fixlo?', 'They are homeowner service requests submitted through Fixlo for supported trades and locations.'],
      ['Can I choose my trade?', 'Yes. Your trade and service area are part of your pro profile and matching setup.'],
      ['How do I start?', 'Create a Fixlo Pro account, complete onboarding, set your service area, and enable lead notifications.']
    ]
  },
  {
    slug: 'get-more-handyman-jobs',
    title: 'Get More Handyman Jobs | Grow Your Handyman Business | Fixlo',
    description: 'Looking for more handyman jobs? Join Fixlo Pro to receive local homeowner opportunities for repairs, drywall, doors, fixtures, carpentry, installations, and maintenance.',
    eyebrow: 'Grow your handyman business',
    h1: 'Get More Handyman Jobs in Your Area',
    lead: 'If you already have handyman skills and want more work, Fixlo can help you connect with homeowners who are requesting small repairs, maintenance, installations, and improvement projects.',
    bullets: ['Home repair opportunities', 'Local service-area matching', 'Pick the work that fits your schedule', 'Mobile-friendly lead access'],
    sections: [
      ['Turn local demand into booked work', 'Homeowners submit projects through Fixlo. Pros can review matching opportunities and decide which ones make sense for their business.'],
      ['Useful for solo handymen and crews', 'Whether you work alone or manage a small team, Fixlo can help add another stream of local project opportunities.'],
      ['Keep your pipeline active', 'Lead notifications can help you fill open days and keep future work moving without depending entirely on word-of-mouth.']
    ],
    faqs: [
      ['How can I get more handyman jobs?', 'You can join Fixlo Pro, complete your profile, and receive matching homeowner opportunities in your service area.'],
      ['What kinds of handyman jobs appear?', 'Requests can include general repairs, drywall, doors, fixtures, mounting, carpentry, and other small home projects.'],
      ['Can I decline jobs I do not want?', 'Yes. Independent pros choose which opportunities they want to pursue.']
    ]
  },
  {
    slug: 'jobs-for-handymen',
    title: 'Jobs for Handymen | Local Home Repair Opportunities | Fixlo Pro',
    description: 'Find local jobs for handymen through Fixlo. Get homeowner opportunities for repairs, installations, drywall, doors, fixtures, trim, and small home improvement work.',
    eyebrow: 'Jobs for handymen',
    h1: 'Local Job Opportunities for Handymen',
    lead: 'Fixlo helps handyman professionals discover homeowner requests in the areas they serve. Review opportunities, choose what fits, and manage your lead activity from one place.',
    bullets: ['Local repair and maintenance requests', 'Choose opportunities that fit your skills', 'Flexible service area', 'Independent pro model'],
    sections: [
      ['Work that matches common handyman skills', 'Homeowner requests can include drywall repair, door work, fixture installation, trim, minor carpentry, mounting, and general home repairs.'],
      ['Find opportunities close to your market', 'Service-area matching helps focus opportunities around the locations you want to serve.'],
      ['Join as an independent professional', 'Fixlo does not employ pros. You operate your own business and choose which opportunities to pursue.']
    ],
    faqs: [
      ['Does Fixlo hire handymen as employees?', 'No. Fixlo pros are independent service providers.'],
      ['Can I use Fixlo if I already have my own business?', 'Yes. Fixlo is designed to work alongside your existing business and marketing.'],
      ['How do I get started?', 'Sign up for Fixlo Pro, complete onboarding and verification, and set your trade and service area.']
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
        audience: { '@type': 'BusinessAudience', audienceType: 'Home service professionals' },
        url: canonical
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faqs.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Fixlo', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'For Pros', item: SITE + '/pros' },
          { '@type': 'ListItem', position: 3, name: page.h1, item: canonical }
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
    *{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827;background:#fff;line-height:1.6}.wrap{width:min(1120px,calc(100% - 32px));margin:auto}.nav{display:flex;justify-content:space-between;align-items:center;padding:22px 0}.brand{font-weight:900;font-size:28px}.brand span{color:#d6a700}.nav a{text-decoration:none;font-weight:800}.hero{background:#080808;color:#fff;padding:72px 0}.eyebrow{font-size:13px;text-transform:uppercase;letter-spacing:.18em;font-weight:900;color:#f4c542}.hero h1{font-size:clamp(40px,7vw,70px);line-height:1.04;margin:12px 0 20px}.hero p{max-width:800px;color:#d1d5db;font-size:19px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.btn{display:inline-flex;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:900}.primary{background:#f4c542;color:#111}.secondary{border:1px solid #666;color:#fff}.bullets{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:30px}.bullet{border:1px solid #333;border-radius:18px;padding:18px;background:#111827;color:#f9fafb}.section{padding:68px 0}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:22px}.card{border:1px solid #e5e7eb;border-radius:24px;padding:25px;background:#fff}.faq{background:#f3f4f6}.faq-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.faq article{background:#fff;border-radius:20px;padding:22px}.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.links a{border:1px solid #d1d5db;border-radius:999px;padding:9px 14px;text-decoration:none;font-size:14px}footer{border-top:1px solid #e5e7eb;padding:30px 0;color:#6b7280}@media(max-width:800px){.grid,.bullets,.faq-grid{grid-template-columns:1fr}.hero{padding:52px 0}.hero h1{font-size:42px}}
  </style>
</head>
<body>
  <header class="wrap nav"><div class="brand">FIX<span>LO</span></div><a href="/pros">For Professionals</a></header>
  <main>
    <section class="hero"><div class="wrap"><div class="eyebrow">${esc(page.eyebrow)}</div><h1>${esc(page.h1)}</h1><p>${esc(page.lead)}</p><div class="actions"><a class="btn primary" href="/pros/signup">Join Fixlo Pro</a><a class="btn secondary" href="/pros">See How Fixlo Works</a></div><div class="bullets">${page.bullets.map((b)=>`<div class="bullet">✓ ${esc(b)}</div>`).join('')}</div></div></section>
    <section class="section"><div class="wrap grid">${page.sections.map(([h,p])=>`<article class="card"><h2>${esc(h)}</h2><p>${esc(p)}</p></article>`).join('')}</div></section>
    <section class="section faq"><div class="wrap"><div class="eyebrow">Questions from pros</div><h2>How Fixlo Pro works</h2><div class="faq-grid">${page.faqs.map(([q,a])=>`<article><h3>${esc(q)}</h3><p>${esc(a)}</p></article>`).join('')}</div></div></section>
    <section class="section"><div class="wrap"><h2>Explore more ways to grow with Fixlo</h2><div class="links"><a href="/handyman-leads">Handyman Leads</a><a href="/contractor-leads">Contractor Leads</a><a href="/home-service-leads">Home Service Leads</a><a href="/get-more-handyman-jobs">Get More Handyman Jobs</a><a href="/jobs-for-handymen">Jobs for Handymen</a><a href="/pros/signup">Join Fixlo Pro</a></div></div></section>
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

console.info(`[pro-intent-seo] Generated ${PAGES.length} pro acquisition SEO pages.`);
