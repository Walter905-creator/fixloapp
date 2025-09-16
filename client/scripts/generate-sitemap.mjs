// client/scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const SITE = "https://www.fixloapp.com"; // canonical origin (no trailing slash)
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// 1) Static pages
const STATIC_PATHS = [
  "/", "/pricing", "/services", "/terms"
];

// 2) Services (top-level)
const SERVICES = [
  "plumbing","electrical","carpentry","painting","hvac",
  "roofing","landscaping","house-cleaning","junk-removal"
];

// 3) Cities (example starter list — extend/replace from your data source)
const CITIES = [
  "miami-fl", "new-york-ny", "los-angeles-ca", "chicago-il", "houston-tx", "phoenix-az"
];

// Build full URL
const url = (p) => `${SITE}${p.startsWith("/") ? "" : "/"}${p}`.replace(/\/+$/,""); // no trailing slash

// Compose url entries
function makeURLEntry(loc, priority = "0.60", changefreq = "weekly") {
  return (
`  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  );
}

// Generate the full list
function generateURLs() {
  const urls = new Set();

  // static
  STATIC_PATHS.forEach(p => urls.add(makeURLEntry(url(p), "0.80", "weekly")));

  // service hubs
  SERVICES.forEach(svc => urls.add(makeURLEntry(url(`/services/${svc}`), "0.80", "weekly")));

  // service + city pages
  SERVICES.forEach(svc => {
    CITIES.forEach(city => {
      urls.add(makeURLEntry(url(`/services/${svc}/${city}`), "0.60", "weekly"));
    });
  });

  return Array.from(urls);
}

function writeSingleSitemap(urlEntries) {
  const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries.join("\n")}
</urlset>
`;
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), xml, "utf8");
  console.info(`[sitemap] Wrote ${urlEntries.length} URLs to ${path.join(PUBLIC_DIR, "sitemap.xml")}`);
}

function writeIndexedSitemaps(urlEntries) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const chunkSize = 45000; // leave buffer below 50k
  const parts = [];

  for (let i = 0; i < urlEntries.length; i += chunkSize) {
    const chunk = urlEntries.slice(i, i + chunkSize);
    const fname = `sitemap-part-${parts.length + 1}.xml`;
    const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${chunk.join("\n")}
</urlset>
`;
    fs.writeFileSync(path.join(PUBLIC_DIR, fname), xml, "utf8");
    parts.push(fname);
    console.info(`[sitemap] Wrote part ${parts.length} with ${chunk.length} URLs → ${fname}`);
  }

  // Write index
  const indexXml =
`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${parts.map(p => `  <sitemap>
    <loc>${SITE}/${p}</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), indexXml, "utf8");
  console.info(`[sitemap] Wrote index with ${parts.length} parts to ${path.join(PUBLIC_DIR, "sitemap.xml")}`);
}

(function main() {
  const entries = generateURLs();

  if (entries.length > 45000) {
    writeIndexedSitemaps(entries);
  } else {
    writeSingleSitemap(entries);
  }
})();
