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

// Countries for global expansion
const countries = [
  { code: 'us', name: 'United States' },
  { code: 'ca', name: 'Canada' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'au', name: 'Australia' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'es', name: 'Spain' },
  { code: 'mx', name: 'Mexico' },
  { code: 'br', name: 'Brazil' },
  { code: 'co', name: 'Colombia' },
  { code: 'cl', name: 'Chile' },
  { code: 'ar', name: 'Argentina' }
];

// Major cities to include in sitemap (limit to avoid too many URLs)
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
  'san-jose',
  'austin',
  'jacksonville',
  'fort-worth',
  'columbus',
  'charlotte',
  'san-francisco',
  'indianapolis',
  'seattle',
  'denver',
  'washington',
  'boston',
  'nashville',
  'atlanta',
  'portland',
  'las-vegas',
  'detroit',
  'baltimore',
  'memphis',
  'louisville'
];

// Most important service/city combinations for SEO
const priorityServiceCities = [
  { service: 'plumbing', cities: ['new-york', 'los-angeles', 'chicago', 'houston', 'phoenix', 'miami'] },
  { service: 'electrical', cities: ['new-york', 'los-angeles', 'chicago', 'miami', 'denver'] },
  { service: 'hvac', cities: ['houston', 'phoenix', 'miami', 'atlanta', 'dallas'] },
  { service: 'cleaning', cities: ['new-york', 'chicago', 'los-angeles', 'san-francisco', 'boston'] },
  { service: 'landscaping', cities: ['miami', 'phoenix', 'dallas', 'san-diego', 'austin'] },
  { service: 'roofing', cities: ['houston', 'miami', 'denver', 'seattle', 'portland'] },
  { service: 'carpentry', cities: ['seattle', 'portland', 'denver', 'austin', 'charlotte'] },
  { service: 'painting', cities: ['san-diego', 'phoenix', 'austin', 'nashville', 'charlotte'] },
  { service: 'handyman', cities: ['austin', 'denver', 'nashville', 'charlotte', 'atlanta'] }
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
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/for-professionals</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
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

  <!-- Country-specific pages (global expansion) -->
`;

  // Add country pages
  countries.forEach(country => {
    sitemap += `  <url>
    <loc>${baseUrl}/country/${country.code}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
  });

  sitemap += `
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

  // Add priority service/city combinations for SEO
  sitemap += `  <!-- Priority service/city combinations -->\n`;
  priorityServiceCities.forEach(({ service, cities }) => {
    cities.forEach(city => {
      sitemap += `  <url>
    <loc>${baseUrl}/services/${service}/${city}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  \n`;
    });
  });

  // Add high-priority trend pages for emergency and urgency
  sitemap += `  <!-- High-priority trend-based SEO pages -->\n`;
  highPriorityTrends.forEach(trend => {
    // Add emergency services for top cities
    const topCities = ['new-york', 'los-angeles', 'chicago', 'houston', 'miami', 'phoenix'];
    const trendServices = ['plumbing', 'electrical', 'hvac'];
    
    topCities.forEach(city => {
      trendServices.forEach(service => {
        sitemap += `  <url>
    <loc>${baseUrl}/${trend}/${service}-in-${city}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  \n`;
      });
    });
  });

  // Add competitor alternatives pages
  sitemap += `  <!-- Competitor alternatives pages -->\n`;
  competitorPages.forEach(page => {
    sitemap += `  <url>
    <loc>${baseUrl}/${page}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  \n`;
  });

  sitemap += `</urlset>`;

  // Write the sitemap to file
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  
  const totalServiceCityCombos = priorityServiceCities.reduce((sum, sc) => sum + sc.cities.length, 0);
  const trendPageCount = highPriorityTrends.length * 6 * 3; // 7 trends * 6 cities * 3 services
  const competitorPageCount = competitorPages.length;
  const totalUrls = 1 + 7 + countries.length + 1 + services.length + totalServiceCityCombos + trendPageCount + competitorPageCount;
  
  console.log(`✅ Sitemap generated with:`);
  console.log(`   - ${services.length} service category pages`);
  console.log(`   - ${totalServiceCityCombos} service/city combinations`);
  console.log(`   - ${trendPageCount} trend-based SEO pages`);
  console.log(`   - ${competitorPageCount} competitor alternatives pages`);
  console.log(`   - ${countries.length} country pages`);
  console.log(`📍 Total URLs: ${totalUrls}`);
  console.log(`📝 Sitemap saved to: ${sitemapPath}`);
  
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