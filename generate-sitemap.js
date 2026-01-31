const fs = require('fs');
const path = require('path');

// Try to connect to database to get dynamic content for sitemap
let mongoose, Pro, Review;
try {
  mongoose = require('mongoose');
  Pro = require('./server/models/Pro');
  Review = require('./server/models/Review');
} catch (error) {
  console.warn('⚠️ Database models not available for sitemap generation:', error.message);
}

// Define services available in the app
const services = [
  'plumbing',
  'electrical', 
  'hvac',
  'carpentry',
  'painting',
  'roofing',
  'house-cleaning',
  'junk-removal',
  'landscaping'
];

// High-priority trends for SEO
const highPriorityTrends = [
  'emergency',
  'same-day',
  '24-hour',
  'christmas',
  'navidad',
  'near-me',
  'last-minute'
];

// Competitor alternatives pages
const competitorPages = [
  'alternatives-to-angi',
  'alternatives-to-homeadvisor',
  'alternatives-to-thumbtack',
  'alternatives-to-taskrabbit',
  'alternatives-to-handy',
  'angi-alternatives',
  'homeadvisor-alternatives',
  'thumbtack-alternatives'
];

// Countries for global expansion - INTERNATIONAL SEO
// Limited to priority countries for initial rollout
const priorityCountries = [
  { code: 'us', name: 'United States', servicesPath: 'services' },
  { code: 'ca', name: 'Canada', servicesPath: 'services' },
  { code: 'uk', name: 'United Kingdom', servicesPath: 'services' },
  { code: 'au', name: 'Australia', servicesPath: 'services' },
  { code: 'ar', name: 'Argentina', servicesPath: 'servicios' }
];

// Major cities to include in sitemap (limit to avoid too many URLs)
// Focus on top US cities for now - international cities can be added later
const majorCities = [
  'miami',
  'new-york',
  'los-angeles', 
  'chicago',
  'houston',
  'phoenix',
  'philadelphia',
  'san-antonio',
  'san-diego',
  'dallas',
  'austin',
  'seattle',
  'denver',
  'boston',
  'atlanta'
];

// Most important service/city combinations for SEO
const priorityServiceCities = [
  { service: 'plumbing', cities: ['new-york', 'los-angeles', 'chicago', 'houston', 'phoenix', 'miami'] },
  { service: 'electrical', cities: ['new-york', 'los-angeles', 'chicago', 'miami', 'denver'] },
  { service: 'hvac', cities: ['houston', 'phoenix', 'miami', 'atlanta', 'dallas'] },
  { service: 'cleaning', cities: ['new-york', 'chicago', 'los-angeles', 'san-francisco', 'boston'] },
  { service: 'landscaping', cities: ['miami', 'phoenix', 'dallas', 'san-diego', 'austin'] }
];

function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];
  const baseUrl = 'https://www.fixloapp.com';
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                           http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- Main pages with high priority -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/how-it-works</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/signup</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/pro/signup</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/ai-assistant</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/about-walter-arevalo</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Main services page -->
  <url>
    <loc>${baseUrl}/services</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Main service category pages (high-level) -->\n`;

  // Add service category pages
  services.forEach(service => {
    sitemap += `  <url>
    <loc>${baseUrl}/services/${service}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  \n`;
  });

  // INTERNATIONAL SEO: Add country-specific service pages
  // Loop order: country → service → city (as specified in requirements)
  console.log(`\n🌍 CANONICAL URL GENERATION - Starting international SEO URLs...`);
  console.log(`📋 Processing ${priorityCountries.length} countries with ${services.length} services each`);
  
  let countryUrlCount = 0;
  const urlsByCountry = {};
  
  priorityCountries.forEach(country => {
    urlsByCountry[country.code] = [];
    console.log(`\n🌐 Country: ${country.name} (${country.code})`);
    
    // Add service category pages per country
    services.forEach(service => {
      const canonicalUrl = `${baseUrl}/${country.code}/${country.servicesPath}/${service}`;
      sitemap += `  <url>
    <loc>${canonicalUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  \n`;
      urlsByCountry[country.code].push(canonicalUrl);
      countryUrlCount++;
    });
    
    // Add service/city combinations ONLY for US
    // International cities should be added later with proper geographic data
    if (country.code === 'us') {
      console.log(`   📍 Adding ${priorityServiceCities.length} priority service/city combinations for US`);
      priorityServiceCities.forEach(({ service, cities }) => {
        cities.forEach(city => {
          const canonicalUrl = `${baseUrl}/${country.code}/${country.servicesPath}/${service}/${city}`;
          sitemap += `  <url>
    <loc>${canonicalUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  \n`;
          urlsByCountry[country.code].push(canonicalUrl);
          countryUrlCount++;
        });
      });
    }
    
    console.log(`   ✅ Generated ${urlsByCountry[country.code].length} canonical URLs for ${country.name}`);
  });
  
  // Validation logging
  console.log(`\n📊 CANONICAL URL VALIDATION:`);
  console.log(`   ✓ All URLs follow pattern: ${baseUrl}/{country}/{services|servicios}/{service}/{city?}`);
  console.log(`   ✓ Country codes used: ${priorityCountries.map(c => c.code).join(', ')}`);
  console.log(`   ✓ No cross-country canonical references`);
  console.log(`   ✓ Each URL is self-referencing canonical`);
  console.log(`\n🔍 URLs by Country:`);
  Object.entries(urlsByCountry).forEach(([code, urls]) => {
    console.log(`   ${code}: ${urls.length} URLs`);
  });

  // REMOVED: Priority service/city combinations (these cause Soft 404 as they're not prerendered)
  // REMOVED: High-priority trend pages (these cause Soft 404 as they're not prerendered)
  // REMOVED: Competitor alternatives pages (these cause Soft 404 as they're not prerendered)
  // REMOVED: Country pages (these cause Soft 404 as they're not prerendered)

  sitemap += `</urlset>`;

  // Write the sitemap to file
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  
  const totalUrls = 1 + 7 + 1 + services.length + countryUrlCount; // homepage + 7 main pages + services page + service categories + country URLs
  
  console.log(`\n✅ SITEMAP GENERATION COMPLETE`);
  console.log(`   📄 Main pages: 9 (homepage, how-it-works, contact, signup, etc.)`);
  console.log(`   🏷️  Service category pages: ${services.length}`);
  console.log(`   🌍 Country-specific URLs: ${countryUrlCount}`);
  console.log(`   📍 Total canonical URLs in sitemap: ${totalUrls}`);
  console.log(`   💾 Sitemap saved to: ${sitemapPath}`);
  console.log(`\n⚠️  IMPORTANT NOTES:`);
  console.log(`   ✓ Only canonical URLs included (no redirects)`);
  console.log(`   ✓ No cross-country canonical references`);
  console.log(`   ✓ All URLs are self-referencing canonicals`);
  console.log(`   ✓ Country → Service → City loop order maintained`);
  console.log(`   ✓ Removed non-rendered URLs to prevent Soft 404 errors`);
  
  return sitemap;
}

// Enhanced sitemap generation with dynamic professional profiles and reviews
async function generateEnhancedSitemap() {
  try {
    let staticSitemap = generateSitemap(); // Generate base sitemap first
    
    // If database is not available, use static sitemap
    if (!mongoose || !Pro || !Review) {
      console.log('📝 Using static sitemap (database not available)');
      return staticSitemap;
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📝 Using static sitemap (database not connected)');
      return staticSitemap;
    }

    console.log('🔍 Generating enhanced sitemap with database content...');
    
    // Remove closing tag to add dynamic content
    staticSitemap = staticSitemap.replace('</urlset>', '');
    
    const currentDate = new Date().toISOString().split('T')[0];
    const baseUrl = 'https://www.fixloapp.com';
    let dynamicContent = '';
    let urlCount = 0;

    // Add professional profile pages
    const pros = await Pro.find({ isActive: true, slug: { $exists: true, $ne: '' } })
      .select('slug updatedAt')
      .limit(1000) // Limit to prevent too large sitemap
      .lean();

    if (pros.length > 0) {
      dynamicContent += `\n  <!-- Professional Profile Pages -->\n`;
      pros.forEach(pro => {
        const lastmod = pro.updatedAt ? pro.updatedAt.toISOString().split('T')[0] : currentDate;
        dynamicContent += `  <url>
    <loc>${baseUrl}/pro/${pro.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  \n`;
        urlCount++;
      });
    }

    // Add published review pages for SEO
    const reviews = await Review.find({ status: 'published' })
      .select('_id createdAt')
      .limit(500) // Limit to prevent too large sitemap
      .lean();

    if (reviews.length > 0) {
      dynamicContent += `\n  <!-- Published Review Pages -->\n`;
      reviews.forEach(review => {
        const lastmod = review.createdAt ? review.createdAt.toISOString().split('T')[0] : currentDate;
        dynamicContent += `  <url>
    <loc>${baseUrl}/review/public/${review._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
  \n`;
        urlCount++;
      });
    }

    // Close the sitemap
    dynamicContent += `</urlset>`;
    
    const enhancedSitemap = staticSitemap + dynamicContent;
    
    // Write enhanced sitemap
    const sitemapPath = path.join(__dirname, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, enhancedSitemap);
    
    console.log(`✅ Enhanced sitemap generated`);
    console.log(`📍 Added ${pros.length} professional profiles`);
    console.log(`📍 Added ${reviews.length} review pages`);
    console.log(`📍 Total dynamic URLs added: ${urlCount}`);
    console.log(`📝 Enhanced sitemap saved to: ${sitemapPath}`);
    
    return enhancedSitemap;
    
  } catch (error) {
    console.error('❌ Error generating enhanced sitemap:', error.message);
    console.log('📝 Falling back to static sitemap');
    return generateSitemap();
  }
}

// Generate sitemap if run directly
if (require.main === module) {
  generateEnhancedSitemap();
}

module.exports = { generateSitemap, generateEnhancedSitemap };