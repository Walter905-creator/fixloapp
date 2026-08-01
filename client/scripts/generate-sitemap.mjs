// client/scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";
import { PRO_CITIES, PRO_TRADES } from "../src/seo/proSeoData.js";
import { HOMEOWNER_SERVICES } from "../src/seo/homeownerSeoData.js";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const SITE = "https://www.fixloapp.com";
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_PATHS = [
  "/", "/pricing", "/services", "/terms", "/pros", "/pros/signup", "/request"
];

const url = (p) => `${SITE}${p.startsWith("/") ? "" : "/"}${p}`.replace(/\/+$/, "");

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

function generateURLs() {
  const urls = new Set();

  STATIC_PATHS.forEach((p) => urls.add(makeURLEntry(url(p), "0.80", "weekly")));

  for (const serviceSlug of Object.keys(HOMEOWNER_SERVICES)) {
    urls.add(makeURLEntry(url(`/services/${serviceSlug}`), "0.84", "weekly"));
    for (const citySlug of Object.keys(PRO_CITIES)) {
      urls.add(makeURLEntry(url(`/services/${serviceSlug}/${citySlug}`), "0.76", "weekly"));
    }
  }

  for (const tradeSlug of Object.keys(PRO_TRADES)) {
    for (const citySlug of Object.keys(PRO_CITIES)) {
      urls.add(makeURLEntry(url(`/${tradeSlug}-jobs/${citySlug}`), "0.72", "weekly"));
    }
  }

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
  const chunkSize = 45000;
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

  const indexXml =
`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${parts.map((part) => `  <sitemap>
    <loc>${SITE}/${part}</loc>
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
