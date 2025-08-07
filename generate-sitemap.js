const fs = require('fs');
const path = require('path');

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

// Major cities to include in sitemap (limit to avoid too many URLs)
const majorCities = [
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

  // Add a limited number of city-specific service pages for major cities only
  // This prevents creating thousands of URLs that could be seen as duplicate content
  const priorityCities = majorCities.slice(0, 10); // Limit to top 10 cities
  
  sitemap += `  <!-- High-priority city-specific service pages -->\n`;
  services.forEach(service => {
    priorityCities.forEach(city => {
      sitemap += `  <url>
    <loc>${baseUrl}/services/${service}/${city}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  \n`;
    });
  });

  sitemap += `</urlset>`;

  // Write the sitemap to file
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  
  console.log(`✅ Sitemap generated with ${services.length} services and ${priorityCities.length} cities`);
  console.log(`📍 Total URLs: ${1 + 6 + services.length + (services.length * priorityCities.length)}`);
  console.log(`📝 Sitemap saved to: ${sitemapPath}`);
}

// Generate sitemap if run directly
if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap };