// client/scripts/generate-sitemap.js
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://www.fixloapp.com";

// Keep these arrays small & high-value to avoid "duplicate" flags.
// Expand gradually with truly unique content per city/service.
const services = [
  "plumbing", "electrical", "hvac",
  "carpentry", "painting", "roofing",
  "house-cleaning", "junk-removal", "landscaping",
];

const cities = [
  "miami", "new-york", "los-angeles", "chicago",
  "houston", "phoenix", "philadelphia",
  "san-antonio", "san-diego", "dallas",
];

// Core pages to include (must be indexable & have canonicals)
const staticPages = [
  { loc: "/", changefreq: "weekly", priority: 1.0 },
  { loc: "/how-it-works", changefreq: "monthly", priority: 0.9 },
  { loc: "/contact", changefreq: "monthly", priority: 0.7 },
  { loc: "/signup", changefreq: "monthly", priority: 0.8 },
  { loc: "/pro/signup", changefreq: "monthly", priority: 0.8 },
  { loc: "/pro", changefreq: "weekly", priority: 0.8 },
  { loc: "/pro/dashboard", changefreq: "weekly", priority: 0.7 },
  { loc: "/reviews", changefreq: "weekly", priority: 0.7 },
  { loc: "/terms", changefreq: "monthly", priority: 0.5 },
  { loc: "/privacy", changefreq: "monthly", priority: 0.5 },
  // add public profile & public review landings only if they are crawlable and stable
];

function url(loc, priority = 0.7, changefreq = "monthly", lastmod = new Date().toISOString().slice(0, 10)) {
  return `
  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function main() {
  const urls = [];

  // Static
  staticPages.forEach(({ loc, changefreq, priority }) => {
    urls.push(url(loc, priority, changefreq));
  });

  // High-value service pages
  services.forEach((s) => {
    urls.push(url(`/services/${s}`, 0.8, "monthly"));
  });

  // Select service+city pages (limit to avoid duplicates—expand slowly)
  services.forEach((s) => {
    cities.forEach((c) => {
      urls.push(url(`/services/${s}/${c}`, 0.7, "monthly"));
    });
  });

  // Add sample pro profile pages (when they become public and crawlable)
  // Example: urls.push(url('/pro/profile/sample-contractor', 0.6, 'weekly'));
  
  // Add sample public review pages (when they become public and crawlable) 
  // Example: urls.push(url('/reviews/plumbing/miami', 0.6, 'weekly'));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                      http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join("\n")}
</urlset>
`;

  // CRA serves from client/public
  const outFile = path.join(__dirname, "..", "public", "sitemap.xml");
  fs.writeFileSync(outFile, xml.trim() + "\n", "utf8");
  console.log(`✅ sitemap.xml written to ${outFile} (${urls.length} URLs)`);
}

main();