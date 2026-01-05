#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pages to enhance with structured data and noscript
const pages = [
  {
    path: 'index.html',
    title: 'Fixlo – Book Trusted Home Services Near You',
    description: 'Fixlo connects homeowners with trusted, verified home service professionals. Book plumbing, electrical, HVAC, cleaning, and more. Fast, reliable, and affordable home services.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Fixlo',
      'url': 'https://www.fixloapp.com',
      'logo': 'https://www.fixloapp.com/logo.png',
      'description': 'Fixlo connects homeowners with trusted, verified home service professionals',
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': 'US'
      }
    }
  },
  {
    path: 'services/index.html',
    title: 'Home Services - Professional Contractors | Fixlo',
    description: 'Browse all home services on Fixlo. Find verified professionals for plumbing, electrical, HVAC, cleaning, landscaping, and more. Quality service guaranteed.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Home Services',
      'description': 'Professional home services available on Fixlo',
      'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Plumbing Services'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Electrical Services'},
        {'@type': 'ListItem', 'position': 3, 'name': 'HVAC Services'},
        {'@type': 'ListItem', 'position': 4, 'name': 'Carpentry Services'},
        {'@type': 'ListItem', 'position': 5, 'name': 'Painting Services'},
        {'@type': 'ListItem', 'position': 6, 'name': 'Roofing Services'},
        {'@type': 'ListItem', 'position': 7, 'name': 'House Cleaning Services'},
        {'@type': 'ListItem', 'position': 8, 'name': 'Junk Removal Services'},
        {'@type': 'ListItem', 'position': 9, 'name': 'Landscaping Services'}
      ]
    }
  }
];

// Service pages
const services = [
  { name: 'plumbing', title: 'Plumbing Services', description: 'Find trusted plumbing professionals on Fixlo. Get quotes for leak repairs, drain cleaning, water heater installation, and all plumbing services. Licensed and insured plumbers.' },
  { name: 'electrical', title: 'Electrical Services', description: 'Hire licensed electricians on Fixlo. Get help with wiring, outlets, panel upgrades, lighting installation, and electrical repairs. Safe and certified electrical services.' },
  { name: 'hvac', title: 'HVAC Services', description: 'Book HVAC professionals on Fixlo. AC repair, heating installation, duct cleaning, and maintenance services. Stay comfortable year-round with expert HVAC technicians.' },
  { name: 'carpentry', title: 'Carpentry Services', description: 'Find skilled carpenters on Fixlo. Custom cabinets, deck building, trim work, and woodworking projects. Quality carpentry services from experienced professionals.' },
  { name: 'painting', title: 'Painting Services', description: 'Hire professional painters on Fixlo. Interior and exterior painting, cabinet refinishing, and color consultation. Transform your space with expert painting services.' },
  { name: 'roofing', title: 'Roofing Services', description: 'Book roofing contractors on Fixlo. Roof repair, replacement, inspection, and maintenance. Protect your home with quality roofing from certified professionals.' },
  { name: 'house-cleaning', title: 'House Cleaning Services', description: 'Find house cleaning services on Fixlo. Regular cleaning, deep cleaning, move-in/out services. Reliable and thorough cleaning professionals for your home.' },
  { name: 'junk-removal', title: 'Junk Removal Services', description: 'Book junk removal services on Fixlo. Furniture removal, appliance disposal, estate cleanouts, and debris hauling. Fast and affordable junk removal.' },
  { name: 'landscaping', title: 'Landscaping Services', description: 'Hire landscaping professionals on Fixlo. Lawn care, garden design, tree trimming, and outdoor maintenance. Beautiful landscapes from experienced landscapers.' }
];

services.forEach(service => {
  pages.push({
    path: `services/${service.name}/index.html`,
    title: `${service.title} - Find Trusted Professionals | Fixlo`,
    description: service.description,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'serviceType': service.title,
      'provider': {
        '@type': 'Organization',
        'name': 'Fixlo'
      },
      'areaServed': {
        '@type': 'Country',
        'name': 'United States'
      },
      'description': service.description
    }
  });
});

console.log('🔧 Adding structured data and noscript content to HTML files...\n');

let successCount = 0;
let errorCount = 0;

pages.forEach(page => {
  const filePath = path.join(__dirname, '..', page.path);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${page.path} - file not found`);
      return;
    }
    
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Check if structured data already exists
    if (!html.includes('application/ld+json')) {
      const structuredData = `    <script type="application/ld+json">${JSON.stringify(page.schema, null, 2)}</script>\n  `;
      html = html.replace('</head>', structuredData + '</head>');
    }
    
    // Check if noscript already exists
    if (!html.includes('<noscript>')) {
      const noscript = `    <noscript>
      <div style="padding: 20px; max-width: 1200px; margin: 0 auto; font-family: sans-serif;">
        <h1>${page.title}</h1>
        <p>${page.description}</p>
        <p><strong>Please enable JavaScript to use Fixlo.</strong></p>
        <p><a href="https://www.fixloapp.com">Return to Homepage</a></p>
      </div>
    </noscript>\n  `;
      html = html.replace('</body>', noscript + '</body>');
    }
    
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Enhanced ${page.path}`);
    successCount++;
    
  } catch (error) {
    console.error(`❌ Error processing ${page.path}:`, error.message);
    errorCount++;
  }
});

console.log(`\n🎉 Complete! Enhanced ${successCount} pages.`);
if (errorCount > 0) {
  console.log(`⚠️  ${errorCount} pages had errors.`);
}

console.log('\n📋 Summary:');
console.log('   - Added JSON-LD structured data for better indexing');
console.log('   - Added noscript fallback content for crawlers');
console.log('   - Enhanced SEO for all service and main pages');
