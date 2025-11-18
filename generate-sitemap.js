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

// Load services from SEO generator to ensure consistency
let servicesData = [];
try {
  servicesData = require('./seo/services.json');
} catch (error) {
  console.warn('⚠️ Could not load services from seo/services.json:', error.message);
}

// Convert service names to URL slugs
function formatSlug(text) {
  return text.toLowerCase().replace(/\s+/g, '-');
}

// Define services available in the app - use SEO services if available
const services = servicesData.length > 0 
  ? servicesData.map(formatSlug)
  : [
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

// Load cities from SEO generator to ensure consistency
let citiesData = [];
try {
  citiesData = require('./seo/cities.json');
} catch (error) {
  console.warn('⚠️ Could not load cities from seo/cities.json:', error.message);
}

// Major cities to include in sitemap - use SEO cities if available
const majorCities = citiesData.length > 0
  ? citiesData.map(c => formatSlug(c.city))
  : [
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
      'el-paso',
      'nashville',
      'detroit',
      'oklahoma-city',
      'portland',
      'las-vegas',
      'memphis',
      'louisville',
      'baltimore'
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

  // Add service + city SEO landing pages (all combinations)
  sitemap += `\n  <!-- Service + City SEO Landing Pages -->\n`;
  let seoPageCount = 0;
  services.forEach(service => {
    majorCities.forEach(city => {
      sitemap += `  <url>
    <loc>${baseUrl}/services/${service}/${city}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  \n`;
      seoPageCount++;
    });
  });

  sitemap += `</urlset>`;

  // Write the sitemap to file
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  
  console.log(`✅ Sitemap generated successfully`);
  console.log(`📍 Services: ${services.length}`);
  console.log(`📍 Cities: ${majorCities.length}`);
  console.log(`📍 SEO landing pages: ${seoPageCount}`);
  console.log(`📍 Total URLs: ${1 + 6 + 1 + services.length + seoPageCount}`);
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